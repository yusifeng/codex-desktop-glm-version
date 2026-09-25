// Claude Cowork 导入：history 账本 + 共享文件工具 + 配置 schema。
//
// 对应 main-C-Mhak1n.ts 82,530-82,968：
//   - 有界文件读取（xP：64KiB 分块 + too-large/unreadable/read 三态）
//   - 文件工具（SP readJsonFile / CP readTextFile / wP writeFileAtomicish /
//     TP walkFiles / EP isFile / DP isDirectory / OP exists）
//   - history 账本（claude-cowork-import-history.json）：records（会话去重
//     账本：projectRoot+sourceId+contentSha256）/ projects（spaceId+sourceRoot）/
//     accountSetupItems（itemType+accountOrgDir）/ connectorCandidates
//     （remoteMcpServersConfig 的合并计数）四本账 + 读写与合并谓词
//   - 常量：instruction header（RP）/ provider id（zP）/ 默认 include（BP）/
//     AGENTS_MD 白名单（WMe）/ cowork 配置文件名集合（VP）
//   - 配置 schema：spaces / sessions / mcp servers / plugins / scheduled tasks
//   - config.toml 读写（qP/JP）+ 基础判定（YP isPlainObject / XP nonEmpty /
//     ZP 时间戳归一：秒→毫秒）
import { readFile, writeFile, mkdir, readdir, stat, lstat, open } from "node:fs/promises";
import { join, dirname, relative, isAbsolute } from "node:path";
import {
  wf as objectSchema,
  Of as stringSchema,
  Cf as numberSchema,
  gf as booleanSchema,
  hf as arraySchema,
  df as enumSchema,
  bf as literalSchema,
  jf as unionSchema,
  Ef as recordSchema,
  Mf as jsonSchema,
  xf as looseObjectSchema,
  wi as parseToml,
} from "@chunk/shared";
import { stringifyToml } from "../misc/env-toml-stringifier";

// ---------------------------------------------------------------------------
// 基础工具（原 `bP`/`YP`/`XP`/`ZP`/`eNe`）
// ---------------------------------------------------------------------------

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value == "object" && !!value && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | null {
  return typeof value == "string" && value.trim() !== "" ? value : null;
}

/** 时间戳归一（原 `ZP`）：秒级（<1e10）转毫秒，字符串走 Date.parse。 */
function normalizeTimestamp(value: unknown): number | null {
  if (typeof value == "number") return value > 1e10 ? value : value * 1e3;
  if (typeof value == "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// ---------------------------------------------------------------------------
// 文件工具（原 `xP`/`SP`/`CP`/`wP`/`TP`/`EP`/`DP`/`OP`）
// ---------------------------------------------------------------------------

/** 有界读取（原 `xP`）：超限即中止（read 一字节越界判定），64KiB 分块。 */
type BoundedReadResult =
  | { bytesRead: number; status: "read"; text: string }
  | { bytesRead: number; status: "too-large" }
  | { bytesRead: number; status: "unreadable" };

async function readBoundedText(path: string, maxBytes: number): Promise<BoundedReadResult> {
  let bytesRead = 0;
  const handle = await open(path, "r").catch(() => null);
  if (handle == null) return { bytesRead, status: "unreadable" };
  try {
    const info = await handle.stat();
    if (!info.isFile()) return { bytesRead, status: "unreadable" };
    if (info.size > maxBytes) return { bytesRead, status: "too-large" };
    const chunks: Buffer[] = [];
    while (bytesRead <= maxBytes) {
      const chunk = Buffer.allocUnsafe(Math.min(65536, maxBytes + 1 - bytesRead));
      const { bytesRead: read } = await handle.read(chunk, 0, chunk.length, null);
      if (read === 0)
        return { bytesRead, status: "read", text: Buffer.concat(chunks, bytesRead).toString("utf8") };
      bytesRead += read;
      if (bytesRead > maxBytes) return { bytesRead, status: "too-large" };
      chunks.push(chunk.subarray(0, read));
    }
    return { bytesRead, status: "too-large" };
  } catch {
    return { bytesRead, status: "unreadable" };
  } finally {
    await handle.close();
  }
}

/** JSON 文件读取 + schema 校验（原 `SP`）。 */
async function readJsonFile<T>(path: string, schema: { safeParse(input: unknown): { success: boolean; data?: T } }): Promise<T | null> {
  const text = await readTextFile(path);
  if (text == null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  const result = schema.safeParse(parsed);
  return result.success ? (result.data as T) : null;
}

async function readTextFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

/** 尾换行保证的写入（原 `wP`）。 */
async function writeTextFile(path: string, text: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

/** 递归文件枚举（原 `TP`）。 */
async function walkFiles(directory: string): Promise<string[]> {
  if (!(await isDirectory(directory))) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const entryPath = join(directory, entry.name);
        return entry.isDirectory() ? walkFiles(entryPath) : entry.isFile() ? [entryPath] : [];
      }),
    )
  ).flat();
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// history 账本（原 `kP`~`HMe`）
// ---------------------------------------------------------------------------

const IMPORT_HISTORY_FILENAME = "claude-cowork-import-history.json";

const importRecordSchema = (objectSchema({
  contentSha256: stringSchema(),
  importedAtMs: numberSchema(),
  importedThreadId: stringSchema(),
  projectRoot: stringSchema().optional(),
  sessionId: stringSchema().optional(),
  sourceId: stringSchema().optional(),
  sourcePath: stringSchema(),
  spaceId: stringSchema().optional(),
}) as unknown as {
  transform(fn: (value: Record<string, unknown>) => unknown): unknown;
}).transform((value) => ({
  contentSha256: value.contentSha256,
  importedAtMs: value.importedAtMs,
  importedThreadId: value.importedThreadId,
  projectRoot: value.projectRoot ?? value.spaceId ?? "",
  sourceId: value.sourceId ?? value.sessionId ?? "",
  sourcePath: value.sourcePath,
}));

const projectRecordSchema = objectSchema({ importedAtMs: numberSchema(), sourceRoot: stringSchema(), spaceId: stringSchema() });
const accountSetupRecordSchema = objectSchema({
  accountOrgDir: stringSchema(),
  importedAtMs: numberSchema(),
  itemType: enumSchema(["CONFIG", "PLUGINS"]),
});
const connectorCandidateSchema = objectSchema({
  importedAtMs: numberSchema(),
  lastSeenAtMs: numberSchema().nullable(),
  name: stringSchema(),
  sessionCount: numberSchema(),
  source: literalSchema("remoteMcpServersConfig"),
});

const importHistorySchema = (objectSchema({
  accountSetupItems: arraySchema(accountSetupRecordSchema).optional(),
  connectorCandidates: arraySchema(connectorCandidateSchema).optional(),
  projects: arraySchema(projectRecordSchema).optional(),
  records: arraySchema(importRecordSchema as never),
  version: literalSchema(1),
}) as unknown as {
  transform(fn: (value: Record<string, unknown>) => unknown): unknown;
}).transform((value) => ({
  accountSetupItems: (value.accountSetupItems as typeof accountSetupRecords[number][]) ?? [],
  connectorCandidates: (value.connectorCandidates as ConnectorCandidate[]) ?? [],
  projects: (value.projects as ProjectRecord[]) ?? [],
  records: value.records as ImportRecord[],
  version: value.version,
}));

type ImportRecord = {
  contentSha256: string;
  importedAtMs: number;
  importedThreadId: string;
  projectRoot: string;
  sourceId: string;
  sourcePath: string;
};
type ProjectRecord = { importedAtMs: number; sourceRoot: string; spaceId: string };
type AccountSetupRecord = { accountOrgDir: string; importedAtMs: number; itemType: "CONFIG" | "PLUGINS" };
const accountSetupRecords: AccountSetupRecord[] = [];
type ConnectorCandidate = { importedAtMs: number; lastSeenAtMs: number | null; name: string; sessionCount: number; source: "remoteMcpServersConfig" };

export interface CoworkImportHistory {
  accountSetupItems: AccountSetupRecord[];
  connectorCandidates: ConnectorCandidate[];
  projects: ProjectRecord[];
  records: ImportRecord[];
  version: 1;
}

const EMPTY_HISTORY: CoworkImportHistory = {
  accountSetupItems: [],
  connectorCandidates: [],
  projects: [],
  records: [],
  version: 1,
};

/** 读账本（原 `jP`）：损坏返回空账本。 */
async function readImportHistory(codexHome: string): Promise<CoworkImportHistory> {
  return (await readJsonFile(join(codexHome, IMPORT_HISTORY_FILENAME), importHistorySchema as never)) ?? EMPTY_HISTORY;
}

/** 账本统计（原 `MMe`）：不存在返回 0；损坏抛错。 */
async function importHistoryStats(codexHome: string): Promise<{ importedSessionCount: number; latestImportedAtMs: number | null }> {
  const historyPath = join(codexHome, IMPORT_HISTORY_FILENAME);
  const history = (await readJsonFile(historyPath, importHistorySchema as never)) as CoworkImportHistory | null;
  if (history == null) {
    try {
      await lstat(historyPath);
    } catch (error) {
      if (typeof error == "object" && error && "code" in error && (error as { code?: string }).code === "ENOENT")
        return { importedSessionCount: 0, latestImportedAtMs: null };
      throw new Error("Unable to read Claude Cowork import history");
    }
    throw new Error("Invalid Claude Cowork import history");
  }
  return {
    importedSessionCount: history.records.length,
    latestImportedAtMs: [
      ...history.records.map((record) => record.importedAtMs),
      ...history.projects.map((record) => record.importedAtMs),
      ...history.accountSetupItems.map((record) => record.importedAtMs),
      ...history.connectorCandidates.map((record) => record.importedAtMs),
    ].reduce((latest, at) => (latest == null ? at : Math.max(latest, at)), null),
  };
}

/** 会话入账（原 `NMe`）。 */
async function recordImportedTranscripts({ codexHome, importedAtMs = Date.now(), transcripts }: { codexHome: string; importedAtMs?: number; transcripts: Array<{ importedThreadId: string; transcript: { contentSha256: string; projectRoot: string; sourceId: string; sourceJsonlPath: string } }> }): Promise<void> {
  const records = transcripts.map(({ importedThreadId, transcript }) => ({
    contentSha256: transcript.contentSha256,
    importedAtMs,
    importedThreadId,
    projectRoot: transcript.projectRoot,
    sourceId: transcript.sourceId,
    sourcePath: transcript.sourceJsonlPath,
  }));
  if (records.length === 0) return;
  const history = await readImportHistory(codexHome);
  await writeImportHistory(codexHome, { ...history, records: mergeByPredicate(history.records, records, isDuplicateRecord) });
}

/** 配置/插件导入入账（原 `PMe`）。 */
async function recordAccountSetupItems({ codexHome, importedAtMs = Date.now(), items }: { codexHome: string; importedAtMs?: number; items: Array<{ accountOrgDir: string; itemType: "CONFIG" | "PLUGINS" }> }): Promise<void> {
  if (items.length === 0) return;
  const history = await readImportHistory(codexHome);
  const records = items.map((item): AccountSetupRecord => ({ accountOrgDir: item.accountOrgDir, importedAtMs, itemType: item.itemType }));
  await writeImportHistory(codexHome, { ...history, accountSetupItems: mergeByPredicate(history.accountSetupItems, records, isDuplicateAccountSetupItem) });
}

/** 项目入账（原 `FMe`）。 */
async function recordImportedProjects({ codexHome, importedAtMs = Date.now(), projects }: { codexHome: string; importedAtMs?: number; projects: Array<{ sourceRoot: string; spaceId: string }> }): Promise<void> {
  if (projects.length === 0) return;
  const history = await readImportHistory(codexHome);
  const records = projects.map((project): ProjectRecord => ({ importedAtMs, sourceRoot: project.sourceRoot, spaceId: project.spaceId }));
  await writeImportHistory(codexHome, { ...history, projects: mergeByPredicate(history.projects, records, isDuplicateProject) });
}

/** connector 候选入账（原 `IMe`）。 */
async function recordConnectorCandidates({ candidates, codexHome }: { candidates: Array<{ lastSeenAtMs: number | null; name: string; sessionCount: number; source: string }>; codexHome: string }): Promise<void> {
  if (candidates.length === 0) return;
  const history = await readImportHistory(codexHome);
  await writeImportHistory(codexHome, {
    ...history,
    connectorCandidates: mergeConnectorCandidates({ existingRecords: history.connectorCandidates, nextCandidates: candidates as never }),
  });
}

/** 项目是否已导入（原 `LMe`）。 */
function hasImportedProject(history: CoworkImportHistory, project: ProjectRecord): boolean {
  return history.projects.some((record) => isDuplicateProject(record, project));
}

/** 配置/插件是否已导入（原 `MP`）。 */
function hasImportedAccountSetupItem(history: CoworkImportHistory, item: AccountSetupRecord): boolean {
  return history.accountSetupItems.some((record) => isDuplicateAccountSetupItem(record, item));
}

async function writeImportHistory(codexHome: string, history: CoworkImportHistory): Promise<void> {
  await mkdir(codexHome, { recursive: true });
  await writeFile(join(codexHome, IMPORT_HISTORY_FILENAME), `${JSON.stringify(history, null, 2)}\n`, "utf8");
}

/** 去重合并（原 `PP`）：被新记录覆盖的旧记录剔除后追加。 */
function mergeByPredicate<T>(existing: T[], next: T[], isDuplicate: (a: T, b: T) => boolean): T[] {
  return [...existing.filter((record) => !next.some((candidate) => isDuplicate(record, candidate))), ...next];
}

function isDuplicateAccountSetupItem(a: AccountSetupRecord, b: AccountSetupRecord): boolean {
  return a.itemType === b.itemType && pathsEqual(a.accountOrgDir, b.accountOrgDir);
}

function isDuplicateProject(a: ProjectRecord, b: ProjectRecord): boolean {
  return a.spaceId === b.spaceId && pathsEqual(a.sourceRoot, b.sourceRoot);
}

function isDuplicateRecord(a: ImportRecord, b: ImportRecord): boolean {
  return pathsEqual(a.projectRoot, b.projectRoot) && a.sourceId === b.sourceId && a.contentSha256 === b.contentSha256;
}

/** connector 候选合并（原 `VMe`）：同名同源累计 sessionCount、取最新 lastSeen。 */
function mergeConnectorCandidates({ existingRecords, nextCandidates }: { existingRecords: ConnectorCandidate[]; nextCandidates: ConnectorCandidate[] }): ConnectorCandidate[] {
  const now = Date.now();
  const byKey = new Map(existingRecords.map((record) => [connectorCandidateKey(record.name, record.source), record]));
  for (const candidate of nextCandidates) {
    const key = connectorCandidateKey(candidate.name, candidate.source);
    const existing = byKey.get(key);
    byKey.set(key, {
      importedAtMs: now,
      lastSeenAtMs:
        existing?.lastSeenAtMs == null
          ? candidate.lastSeenAtMs
          : candidate.lastSeenAtMs == null
            ? existing.lastSeenAtMs
            : Math.max(existing.lastSeenAtMs, candidate.lastSeenAtMs),
      name: pickDisplayName(existing?.name, candidate.name),
      sessionCount: (existing?.sessionCount ?? 0) + candidate.sessionCount,
      source: candidate.source,
    });
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function connectorCandidateKey(name: string, source: string): string {
  return `${source}\u001f${normalizeName(name)}`;
}

function pickDisplayName(existing: string | undefined, next: string): string {
  const trimmed = existing?.trim();
  return trimmed != null && trimmed.length > 0 ? trimmed : next.trim();
}

/** 路径相等判定（原 `hP`：规范化后比较）。 */
function pathsEqual(a: string, b: string): boolean {
  return a === b || normalizeName(a) === normalizeName(b);
}

// ---------------------------------------------------------------------------
// 常量与 schema（原 `RP`~`$Me` + `qP`/`JP`）
// ---------------------------------------------------------------------------

/** 导入的项目指令头（原 `RP`）。 */
export const IMPORTED_INSTRUCTIONS_HEADER = "## Imported Claude Cowork project instructions";
/** provider id（原 `zP`）。 */
export const COWORK_PROVIDER_ID = "claude-cowork";
/** 默认 include 集合（原 `BP`）。 */
export const DEFAULT_INCLUDE = { agents: true, config: true, sessions: true } as const;
/** AGENTS.md 白名单（原 `WMe`）。 */
export const AGENTS_MD_KEYS = ["AGENTS_MD"] as const;
/** cowork 配置文件名集合（原 `VP`）。 */
export const COWORK_CONFIG_FILENAMES = new Set([
  "spaces.json",
  "scheduled-tasks.json",
  "artifacts.json",
  "mcp.json",
  "mcp-servers.json",
  "plugins.json",
  "plugins-mcp-skills.json",
  "skills.json",
  "agents.json",
  "cowork_settings.json",
  "cowork_account_settings.json",
  "cowork-clientdata-cache.json",
  "cowork-gb-cache.json",
  "remote-session-spaces.json",
]);

const tomlValueSchema = recordSchema(stringSchema(), jsonSchema());
const folderRefSchema = unionSchema([stringSchema(), (looseObjectSchema({ path: stringSchema() }) as unknown as { loose(): unknown }).loose()]);
const spaceSchema = (looseObjectSchema({
  folders: arraySchema(folderRefSchema).optional(),
  id: stringSchema(),
  instructions: stringSchema().optional(),
  name: stringSchema().optional(),
  title: stringSchema().optional(),
  userSelectedFolders: arraySchema(folderRefSchema).optional(),
}) as unknown as { loose(): unknown }).loose();
const spaceListSchema = unionSchema([arraySchema(spaceSchema as never), (looseObjectSchema({ spaces: arraySchema(spaceSchema as never) }) as unknown as { loose(): unknown }).loose()]);
const sessionEntriesSchema = (looseObjectSchema({
  entries: arraySchema((looseObjectSchema({ sessionId: stringSchema() }) as unknown as { loose(): { nullable(): { catch(value: null): unknown } } }).loose().nullable().catch(null)),
}) as unknown as { loose(): unknown }).loose();
const detectedFileSchema = (looseObjectSchema({
  fileName: stringSchema(),
  hostPath: stringSchema(),
  timestamp: unionSchema([numberSchema(), stringSchema()]).nullable().optional(),
}) as unknown as { loose(): unknown }).loose();
const sessionSchema = (looseObjectSchema({
  cliSessionId: stringSchema().nullable().optional(),
  createdAt: unionSchema([numberSchema(), stringSchema()]).nullable().optional(),
  cwd: stringSchema().nullable().optional(),
  fsDetectedFiles: arraySchema(detectedFileSchema as never).optional(),
  id: stringSchema().optional(),
  lastActivityAt: unionSchema([numberSchema(), stringSchema()]).nullable().optional(),
  remoteMcpServersConfig: jsonSchema().optional(),
  scheduledTaskId: stringSchema().nullable().optional(),
  sessionId: stringSchema().optional(),
  spaceId: stringSchema().nullable().optional(),
  title: stringSchema().nullable().optional(),
  updatedAt: unionSchema([numberSchema(), stringSchema()]).nullable().optional(),
  userSelectedFolders: arraySchema(folderRefSchema).optional(),
}) as unknown as { loose(): unknown }).loose();
const taskRefSchema = (looseObjectSchema({
  id: stringSchema().optional(),
  name: stringSchema().nullable().optional(),
  spaceId: stringSchema().nullable().optional(),
  title: stringSchema().nullable().optional(),
}) as unknown as { loose(): unknown }).loose();
const taskListSchema = unionSchema([arraySchema(taskRefSchema as never), (looseObjectSchema({ tasks: arraySchema(taskRefSchema as never) }) as unknown as { loose(): unknown }).loose()]);
const mcpServerSchema = (looseObjectSchema({
  args: arraySchema(stringSchema()).optional(),
  command: stringSchema().optional(),
  disabled: booleanSchema().optional(),
  enabled: booleanSchema().optional(),
  env: recordSchema(stringSchema(), jsonSchema()).optional(),
  headers: recordSchema(stringSchema(), jsonSchema()).optional(),
  type: stringSchema().optional(),
  url: stringSchema().optional(),
}) as unknown as { loose(): unknown }).loose();
const mcpServersFileSchema = (looseObjectSchema({
  mcp_servers: recordSchema(stringSchema(), mcpServerSchema as never).optional(),
  mcpServers: recordSchema(stringSchema(), mcpServerSchema as never).optional(),
}) as unknown as { loose(): unknown }).loose();
const pluginRefSchema = (looseObjectSchema({ id: stringSchema().optional(), name: stringSchema().optional(), path: stringSchema().optional() }) as unknown as { loose(): unknown }).loose();
const pluginListSchema = unionSchema([
  arraySchema(pluginRefSchema as never),
  (looseObjectSchema({ agents: arraySchema(pluginRefSchema as never).optional(), skills: arraySchema(pluginRefSchema as never).optional() }) as unknown as { loose(): unknown }).loose(),
]);

/** 插件 manifest schema（原 `tNe`）。 */
const pluginManifestSchema = (looseObjectSchema({
  description: stringSchema().optional(),
  name: stringSchema().optional(),
  version: stringSchema().optional(),
}) as unknown as { loose(): unknown }).loose();

/** 本地插件来源类型（原 `QP`）。 */
export const LOCAL_PLUGIN_SOURCE = "local";
/** skills 目录名（原 `$P`）。 */
export const SKILLS_DIRNAME = "skills";
/** MCP 配置文件名（原 `nNe`）。 */
export const MCP_CONFIG_FILENAMES = new Set([".mcp.json", "mcp.json"]);
/** semver 正则（原 `rNe`）。 */
export const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

/** config.toml 读取（原 `qP`）：损坏记入 warnings 并返回 null。 */
async function readCodexConfigToml(path: string, warnings: string[]): Promise<Record<string, unknown> | null> {
  const text = await readTextFile(path);
  if (text == null) return {};
  try {
    const parsed = (tomlValueSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: Record<string, unknown> } }).safeParse(parseToml(text));
    if (parsed.success) return parsed.data ?? {};
  } catch (error) {
    return (warnings.push(`Could not read Codex config.toml ${path}: ${errorMessage(error)}`), null);
  }
  return (warnings.push(`Could not read Codex config.toml ${path}`), null);
}

/** config.toml 写入（原 `JP`）。 */
async function writeCodexConfigToml(path: string, config: Record<string, unknown>): Promise<void> {
  await writeTextFile(path, stringifyToml(config));
}

/** space 配置路径映射（原 `UMe`）。 */
function mapSpaceConfig<S extends { spaceConfigPath: string; sourceFolders: string[] }>(space: S, mapPath: (path: string) => string): S {
  return {
    ...space,
    spaceConfigPath: mapPath(space.spaceConfigPath),
    sourceFolders: space.sourceFolders.map(mapPath),
  };
}

// ---------------------------------------------------------------------------
// MCP 配置读取（原 `lF`/`SNe`/`uF`/`dF`/`sF`/`cF`/`gP`）
// ---------------------------------------------------------------------------

/** 逐候选探测存在性（原 `sF`/`cF`）。 */
async function filterExisting(paths: string[]): Promise<string[]> {
  const exists = await Promise.all(paths.map((path) => pathExists(path)));
  return paths.filter((_path, index) => exists[index]);
}

/** 从属判定（原 `gP`：child 在 parent 之下）。 */
function isPathInsideDir(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}

/** cowork 设置合并（原 `lF`）：accountOrgDirs 倒序逐个合并。 */
async function readCoworkSettings(accountOrgDirs: string[], warnings: string[]): Promise<Record<string, unknown>> {
  const merged: Record<string, unknown> = {};
  const existing = await filterExisting(
    ["cowork_account_settings.json", "cowork_settings.json"].flatMap((filename) =>
      [...accountOrgDirs].reverse().map((dir) => join(dir, filename)),
    ),
  );
  const parsed = await Promise.all(existing.map(async (path) => ({ parsed: await readJsonFile(path, tomlValueSchema as never), sourcePath: path })));
  for (const { parsed: settings, sourcePath } of parsed) {
    if (settings == null) {
      warnings.push(`Could not read Cowork settings file: ${sourcePath}`);
      continue;
    }
    Object.assign(merged, settings);
  }
  return merged;
}

/** MCP 配置文件读取（原 `uF`）：org 目录的 mcp.json/mcp-servers.json + userData 的 claude_desktop_config。 */
async function readMcpConfigFiles(project: { accountOrgDirs: string[]; userDataDirs: string[] }): Promise<Array<{ parsed: Record<string, unknown> | null; sourcePath: string }>> {
  const paths = await filterExisting(
    project.userDataDirs.flatMap((userDataDir) => {
      const orgDir = project.accountOrgDirs.find((dir) => isPathInsideDir(dir, userDataDir));
      return [
        ...(orgDir == null ? [] : [join(orgDir, "mcp.json"), join(orgDir, "mcp-servers.json")]),
        join(userDataDir, "claude_desktop_config.json"),
      ];
    }),
  );
  return Promise.all(paths.map(async (path) => ({ parsed: await readJsonFile(path, mcpServersFileSchema as never), sourcePath: path })));
}

/** disabled 名单（原 `dF`）。 */
function readDisabledServerNames(settings: Record<string, unknown>): Set<string> {
  const disabled = (settings.disabledMcpjsonServers ?? settings.disabledMcpServers) as unknown;
  return Array.isArray(disabled)
    ? new Set(
        (disabled as unknown[])
          .filter((name): name is string => typeof name == "string")
          .map((name) => name.trim())
          .filter((name) => name !== ""),
      )
    : new Set();
}

function isServerDisabled({ disabledServerNames, serverConfig, serverName }: { disabledServerNames: Set<string>; serverConfig: Record<string, unknown>; serverName: string }): boolean {
  return disabledServerNames.has(serverName) || serverConfig.disabled === true || serverConfig.enabled === false;
}

/** MCP server 配置合并（原 `SNe`）：双源 + disabled 过滤 + 空名拒绝。 */
async function readMcpServerConfigs(
  project: { accountOrgDirs: string[]; userDataDirs: string[] },
  warnings: string[],
  settings: Record<string, unknown>,
): Promise<Map<string, { config: Record<string, unknown>; sourcePath: string }>> {
  const disabledNames = readDisabledServerNames(settings);
  const servers = new Map<string, { config: Record<string, unknown>; sourcePath: string }>();
  const seen = new Set<string>();
  const configFiles = await readMcpConfigFiles(project);
  for (const { parsed, sourcePath } of configFiles) {
    if (parsed == null) {
      warnings.push(`Could not read Cowork MCP config file: ${sourcePath}`);
      continue;
    }
    const serverEntries = { ...(parsed.mcpServers as Record<string, unknown>), ...(parsed.mcp_servers as Record<string, unknown>) } as Record<string, Record<string, unknown>>;
    for (const [name, config] of Object.entries(serverEntries)) {
      const trimmed = name.trim();
      if (trimmed === "") {
        warnings.push(`Cowork MCP config ${sourcePath} had an empty server name`);
        continue;
      }
      if (seen.has(trimmed)) continue;
      seen.add(trimmed);
      if (!isServerDisabled({ disabledServerNames: disabledNames, serverConfig: config, serverName: trimmed }))
        servers.set(trimmed, { config, sourcePath });
    }
  }
  return servers;
}

export {
  readBoundedText,
  type BoundedReadResult,
  readJsonFile,
  readTextFile,
  writeTextFile,
  walkFiles,
  isFile,
  isDirectory,
  pathExists,
  readImportHistory,
  importHistoryStats,
  recordImportedTranscripts,
  recordAccountSetupItems,
  recordImportedProjects,
  recordConnectorCandidates,
  hasImportedProject,
  hasImportedAccountSetupItem,
  readCodexConfigToml,
  writeCodexConfigToml,
  mapSpaceConfig,
  normalizeName,
  normalizeTimestamp,
  nonEmptyString,
  isPlainObject,
  errorMessage,
  pathsEqual,
  filterExisting,
  readCoworkSettings,
  readMcpConfigFiles,
  readDisabledServerNames,
  isServerDisabled,
  readMcpServerConfigs,
  spaceListSchema,
  sessionSchema,
  sessionEntriesSchema,
  taskListSchema,
  mcpServersFileSchema,
  pluginListSchema,
  pluginManifestSchema,
  type ImportRecord,
  type ProjectRecord,
  type AccountSetupRecord,
  type ConnectorCandidate,
};
