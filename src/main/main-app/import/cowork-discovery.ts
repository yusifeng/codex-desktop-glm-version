// Claude Cowork 导入：空间/项目发现 + 配置面收集 + 会话 manifest + artifacts。
//
// 对应 main-C-Mhak1n.ts 83,989-85,073：
//   - TF/EF：cwd 收集与宿主路径映射
//   - fPe：导入计划生成（CONFIG/PLUGINS/AGENTS_MD/SESSIONS 四类 plan item）
//   - OF discoverCoworkSpaces：userDataDir/local-agent-mode-sessions/<org>/
//     <user> 的 accountOrg 目录枚举 → spaces.json 解析 → project（单 source
//     folder）/projectlessSpace（无 folder）/skippedProject（多 folder、
//     claude 托管目录、目录缺失）三分
//   - VF collectConfigSurfaces：项目与无项目空间的配置面（mcp/settings/
//     plugins/skills/agents/extensions/operon）+ scheduled tasks + 会话
//     manifest（预算化发现）
//   - 安全预算（PF/zF/BF/RF）：directoryEntries 2e4 / durationMs 1e4 /
//     manifestBytes 32MiB / transcriptBytes 64MiB 等；超限置 deferred 并最终
//     抛 CoworkHistoryLimitError；不可读抛 CoworkHistoryReadError
//   - 会话 manifest（APe/jPe/HF/MPe/WF）：多 org 目录去重合并（cliSessionIds/
//     storageDirs/userSelectedFolders 并集、cwd/title/spaceId 首见优先）
//   - artifacts（RPe/YFe/zPe/HPe/UPe/WPe）：outputs 目录 + artifacts.json
//     的文件收集与拷贝（fileKey/realPath 去重 + 相对路径清洗 + 重名递增）
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, readdir, opendir, stat, copyFile, cp, realpath, rm } from "node:fs/promises";
import { join, dirname, basename, relative, resolve, normalize, extname, isAbsolute, sep } from "node:path";
import { wf as objectSchema, Of as stringSchema, gf as booleanSchema, hf as arraySchema, jf as unionSchema, Mf as jsonSchema, xf as looseObjectSchema } from "@chunk/shared";
import {
  COWORK_PROVIDER_ID,
  COWORK_CONFIG_FILENAMES,
  spaceListSchema,
  sessionSchema,
  sessionEntriesSchema,
  taskListSchema,
  pluginManifestSchema,
  readJsonFile,
  readTextFile,
  walkFiles,
  isFile,
  isDirectory,
  pathExists,
  isPlainObject,
  normalizeTimestamp,
  errorMessage,
  readBoundedText,
  readMcpConfigFiles,
  readDisabledServerNames,
  readCoworkSettings,
  filterExisting,
  isServerDisabled,
  pathsEqual,
  type BoundedReadResult,
} from "./cowork-history";

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

export interface DiscoveryOptions {
  userDataDir: string;
  fallbackUserDataDirs?: string[];
  documentsDir: string;
  homeDir?: string | null;
}

interface AccountOrgLocation {
  accountOrgDir: string;
  accountOrgKey: string;
  userDataDir: string;
}

export interface CoworkProject {
  accountOrgDir: string;
  accountOrgDirs: string[];
  documentsDir: string;
  homeDir: string | null;
  instructions: string | null;
  name: string;
  sourceRoot: string;
  spaceId: string;
  userDataDir: string;
  userDataDirs: string[];
}

export interface ProjectlessSpace {
  accountOrgDir: string;
  accountOrgDirs: string[];
  documentsDir: string;
  homeDir: string | null;
  name: string;
  projectlessImportRoot: string;
  spaceConfigPath: string;
  spaceId: string | null;
  userDataDir: string;
  userDataDirs: string[];
}

export interface SkippedProject {
  name: string;
  reason: "multiple-source-folders" | "claude-managed-folder" | "missing-source-folder";
  spaceConfigPath: string;
  sourceFolders: string[];
  spaceId: string;
}

interface CoworkSpace {
  id: string;
  name?: string;
  title?: string;
  instructions?: string;
  folders?: Array<string | { path: string }>;
  userSelectedFolders?: Array<string | { path: string }>;
}

export interface SessionManifest {
  cliSessionIds: string[];
  cwd: string | null;
  detectedFiles: Array<{ fileName: string; hostPath: string; timestampMs: number | null }>;
  lastActivityAtMs: number | null;
  manifestPath: string;
  remoteMcpServerNames: string[];
  scheduledTaskId: string | null;
  sessionId: string;
  spaceId: string | null;
  storageDirs: string[];
  title: string | null;
  userSelectedFolders: string[];
}

export interface ConfigSurface {
  kind: "agents" | "extensions" | "mcp" | "operon" | "plugins" | "settings" | "skills";
  path: string;
}

export interface PluginCandidate {
  accountOrgDir: string;
  pluginName: string;
  pluginRoot: string;
  manifestPath: string;
  skillPaths: string[];
  version?: string;
}

interface LooseSkill {
  skillRoot: string;
}

export interface ProjectlessScan {
  looseSkills: LooseSkill[];
  pluginBundles: PluginCandidate[];
}

interface ProjectScan {
  configSurfaces: ConfigSurface[];
  project: CoworkProject;
  scheduledTasks: Array<{ id: string; name: string | null; sourcePath: string }>;
  sessionManifests: SessionManifest[];
  warnings: string[];
}

interface ProjectlessScanResult {
  configSurfaces: ConfigSurface[];
  pluginCandidates: PluginCandidate[];
  projectlessSpace: ProjectlessSpace;
  sessionManifests: SessionManifest[];
  warnings: string[];
}

export interface DiscoveryResult {
  cloudSessionCount: number;
  projectlessSpaces: ProjectlessSpace[];
  projects: CoworkProject[];
  skippedProjects: SkippedProject[];
  warnings: string[];
}

export interface ConfigSurfacesResult {
  configSurfacesByProjectRoot: Map<string, ConfigSurface[]>;
  historyDiscoveryBudget: DiscoveryBudget | undefined;
  pluginCandidatesByProjectlessSpaceRoot: Map<string, PluginCandidate[]>;
  projectlessSpaces: ProjectlessSpace[];
  projects: CoworkProject[];
  scheduledTasksByProjectRoot: Map<string, Array<{ id: string; name: string | null; sourcePath: string }>>;
  sessionManifestsByProjectlessSpaceRoot: Map<string, SessionManifest[]>;
  sessionManifestsByProjectRoot: Map<string, SessionManifest[]>;
  skippedProjects: SkippedProject[];
  warnings: string[];
}

// ---------------------------------------------------------------------------
// 安全预算（原 `PF`/`RF`/`zF`/`BF`/`IF`/`LF`）
// ---------------------------------------------------------------------------

const SAFETY_LIMITS = {
  directoryEntries: 20_000,
  durationMs: 10_000,
  manifestAttempts: 2_000,
  manifestBytes: 33_554_432,
  manifestFileBytes: 4_194_304,
  sessionAttempts: 500,
  sessionBytes: 16_777_216,
  sessionMessages: 10_000,
  transcriptBytes: 67_108_864,
  transcriptFileBytes: 8_388_608,
} as const;

const HISTORY_LIMIT_WARNING = "Some Claude Cowork chats were deferred because history discovery reached its safety limits.";

export class CoworkHistoryLimitError extends Error {
  errorCode = "cowork-history-limit";
  constructor() {
    super("The selected Claude Cowork history exceeds the safe import limit.");
    this.name = "CoworkHistoryLimitError";
  }
}

export class CoworkHistoryReadError extends Error {
  errorCode = "cowork-history-unreadable";
  constructor() {
    super("Could not read the selected Claude Cowork history.");
    this.name = "CoworkHistoryReadError";
  }
}

export interface DiscoveryBudget {
  deadlineMs: number;
  deferred: boolean;
  remaining: {
    directoryEntries: number;
    manifestAttempts: number;
    manifestBytes: number;
    sessionAttempts: number;
    transcriptBytes: number;
  };
}

export function createDiscoveryBudget(): DiscoveryBudget {
  return {
    deadlineMs: Date.now() + SAFETY_LIMITS.durationMs,
    deferred: false,
    remaining: {
      directoryEntries: SAFETY_LIMITS.directoryEntries,
      manifestAttempts: SAFETY_LIMITS.manifestAttempts,
      manifestBytes: SAFETY_LIMITS.manifestBytes,
      sessionAttempts: SAFETY_LIMITS.sessionAttempts,
      transcriptBytes: SAFETY_LIMITS.transcriptBytes,
    },
  };
}

/** 预算扣减（原 `zF`）：超时或额度耗尽置 deferred 并返回 false。 */
export function consumeBudget(budget: DiscoveryBudget, resource: keyof DiscoveryBudget["remaining"], cost = 0): boolean {
  if (Date.now() >= budget.deadlineMs || budget.remaining[resource] <= cost) {
    budget.deferred = true;
    return false;
  }
  --budget.remaining[resource];
  return true;
}

/** 预算化有界读取（原 `BF`）。 */
export async function readBoundedWithBudget(
  path: string,
  maxBytes: number,
  budget: DiscoveryBudget | undefined,
  resource: keyof DiscoveryBudget["remaining"],
): Promise<BoundedReadResult> {
  if (budget == null) return readBoundedText(path, maxBytes);
  if (Date.now() >= budget.deadlineMs || budget.remaining[resource] <= 1) {
    budget.deferred = true;
    return { bytesRead: 0, status: "too-large" };
  }
  const result = await readBoundedText(path, Math.min(maxBytes, budget.remaining[resource] - 1));
  budget.remaining[resource] -= result.bytesRead;
  if (result.status === "too-large") budget.deferred = true;
  return result;
}

// ---------------------------------------------------------------------------
// 目录枚举（原 `OF`/`_Pe`/`kF`/`MF`/`NF`/`SPe`/`xPe`/`bPe`）
// ---------------------------------------------------------------------------

/** userDataDir 去重（原 `kF`）。 */
function dedupeUserDataDirs(options: DiscoveryOptions): string[] {
  const all = [options.userDataDir, ...(options.fallbackUserDataDirs ?? [])];
  return all.filter((dir, index) => all.findIndex((other) => pathsEqual(other, dir)) === index);
}

/** 子目录枚举（原 `MF`）。 */
async function listSubdirectories(path: string): Promise<string[]> {
  return (await isDirectory(path))
    ? (await readdir(path, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b))
    : [];
}

/** 顶层 JSON 文件枚举（原 `NF`：排除 cowork 配置文件名）。 */
async function listTopLevelJsonFiles(path: string): Promise<string[]> {
  return (await isDirectory(path))
    ? (await readdir(path, { withFileTypes: true }))
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json") && !COWORK_CONFIG_FILENAMES.has(entry.name))
        .map((entry) => entry.name)
    : [];
}

/** accountOrg 目录枚举（原 `_Pe`）：按 org key 分组（win32 大小写不敏感）。 */
async function discoverAccountOrgLocations(userDataDirs: string[]): Promise<AccountOrgLocation[][]> {
  const byKey = new Map<string, AccountOrgLocation[]>();
  const all = await Promise.all(
    userDataDirs.map(async (userDataDir) => {
      const sessionsRoot = join(userDataDir, "local-agent-mode-sessions");
      const orgs = await listSubdirectories(sessionsRoot);
      return (
        await Promise.all(
          orgs.map(async (org) => {
            const orgDir = join(sessionsRoot, org);
            return (await listSubdirectories(orgDir)).map((user) => ({
              accountOrgDir: join(orgDir, user),
              accountOrgKey: process.platform === "win32" ? `${org}\u001f${user}`.toLowerCase() : `${org}\u001f${user}`,
              userDataDir,
            }));
          }),
        )
      ).flat();
    }),
  );
  for (const location of all.flat()) {
    const group = byKey.get(location.accountOrgKey) ?? [];
    group.push(location);
    byKey.set(location.accountOrgKey, group);
  }
  return [...byKey.values()];
}

/** 身份目录解析（原 `bPe`）：fallback userDataDir 下的等价 org 目录。 */
function resolveIdentityLocation(locations: AccountOrgLocation[], options: DiscoveryOptions): { accountOrgDir: string; userDataDir: string } {
  const fallbackDir = options.fallbackUserDataDirs?.find((dir) => !pathsEqual(dir, options.userDataDir)) ?? options.userDataDir;
  const anchor = locations.find((location) => isPathInsideDir(location.userDataDir, fallbackDir)) ?? locations[0];
  return {
    accountOrgDir: join(fallbackDir, relative(anchor.userDataDir, anchor.accountOrgDir)),
    userDataDir: fallbackDir,
  };
}

/** 有顶层活动迹象判定（原 `xPe`/`SPe`）。 */
async function hasAccountLevelActivity(accountOrgDirs: string[]): Promise<boolean> {
  const topLevelJson = await Promise.all(accountOrgDirs.flatMap((dir) => [listTopLevelJsonFiles(dir), listTopLevelJsonFiles(join(dir, "agent"))]));
  if (topLevelJson.some((files) => files.length > 0)) return true;
  return await hasPluginSurfaces(accountOrgDirs, []);
}

/** 插件/skill 目录存在性（原 `SPe`）。 */
async function hasPluginSurfaces(accountOrgDirs: string[], userDataDirs: string[]): Promise<boolean> {
  const pluginDirs = ["rpm", "skills", "cowork_plugins", ".local-plugins", ".remote-plugins"];
  const orgName = basename(accountOrgDirs[0]);
  const parentName = basename(dirname(accountOrgDirs[0]));
  const candidates = [
    ...accountOrgDirs.flatMap((dir) => pluginDirs.map((sub) => join(dir, sub))),
    ...userDataDirs.map((dir) => join(dir, "local-agent-mode-sessions", "skills-plugin", orgName, parentName)),
  ];
  return (await Promise.all(candidates.map(isDirectory))).some(Boolean);
}

/** claude 托管目录判定（原 `vPe`）。 */
function isClaudeManagedFolder(path: string, options: DiscoveryOptions): boolean {
  const artifactsDir = join(options.documentsDir, "Claude", "Artifacts");
  return dedupeUserDataDirs(options).some((dir) => isPathInsideDir(path, dir)) || isPathInsideDir(path, artifactsDir);
}

function isPathInsideDir(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}

/** folder 列表解析（原 `AF`）。 */
function resolveFolderPaths(folders: Array<string | { path: string }> | undefined): string[] {
  return folders == null ? [] : folders.map((folder) => (typeof folder == "string" ? folder : folder.path)).filter((path) => path !== "");
}

// ---------------------------------------------------------------------------
// 空间三分（原 `wPe`/`CPe`/`jF`）
// ---------------------------------------------------------------------------

/** 单空间三分（原 `wPe`）：无 folder → projectless；多 folder/托管/缺失 → skipped。 */
async function classifySpace({
  accountOrgDirs,
  identityLocation,
  options,
  space,
  spaceConfigPath,
  userDataDirs,
}: {
  accountOrgDirs: string[];
  identityLocation: { accountOrgDir: string; userDataDir: string };
  options: DiscoveryOptions;
  space: CoworkSpace;
  spaceConfigPath: string;
  userDataDirs: string[];
}): Promise<{ project: CoworkProject | null; projectlessSpace: ProjectlessSpace | null; skippedProject: SkippedProject | null }> {
  const name = space.name ?? space.title ?? space.id;
  const folderPaths = resolveFolderPaths(space.folders ?? space.userSelectedFolders).map((folder) => resolve(folder));

  if (folderPaths.length === 0)
    return {
      project: null,
      projectlessSpace: {
        accountOrgDir: identityLocation.accountOrgDir,
        accountOrgDirs,
        documentsDir: options.documentsDir,
        homeDir: options.homeDir ?? null,
        name,
        projectlessImportRoot: join(identityLocation.accountOrgDir, "projectless-spaces", space.id),
        spaceConfigPath,
        spaceId: space.id,
        userDataDir: identityLocation.userDataDir,
        userDataDirs,
      },
      skippedProject: null,
    };

  if (folderPaths.length !== 1)
    return {
      project: null,
      projectlessSpace: null,
      skippedProject: {
        name,
        reason: "multiple-source-folders",
        spaceConfigPath,
        sourceFolders: folderPaths,
        spaceId: space.id,
      },
    };

  const sourceRoot = folderPaths[0];
  if (!(await isDirectory(sourceRoot)))
    return {
      project: null,
      projectlessSpace: null,
      skippedProject: {
        name,
        reason: "missing-source-folder",
        spaceConfigPath,
        sourceFolders: [sourceRoot],
        spaceId: space.id,
      },
    };

  if (isClaudeManagedFolder(sourceRoot, options))
    return {
      project: null,
      projectlessSpace: null,
      skippedProject: {
        name,
        reason: "claude-managed-folder",
        spaceConfigPath,
        sourceFolders: [sourceRoot],
        spaceId: space.id,
      },
    };

  return {
    project: {
      accountOrgDir: identityLocation.accountOrgDir,
      accountOrgDirs,
      documentsDir: options.documentsDir,
      homeDir: options.homeDir ?? null,
      instructions: space.instructions ?? null,
      name,
      sourceRoot,
      spaceId: space.id,
      userDataDir: identityLocation.userDataDir,
      userDataDirs,
    },
    projectlessSpace: null,
    skippedProject: null,
  };
}

/** account 级 projectless（原 `CPe`）。 */
function buildAccountProjectlessSpace({
  accountOrgDirs,
  identityLocation,
  options,
  spaceConfigPath,
  userDataDirs,
}: {
  accountOrgDirs: string[];
  identityLocation: { accountOrgDir: string; userDataDir: string };
  options: DiscoveryOptions;
  spaceConfigPath: string;
  userDataDirs: string[];
}): ProjectlessSpace {
  return {
    accountOrgDir: identityLocation.accountOrgDir,
    accountOrgDirs,
    documentsDir: options.documentsDir,
    homeDir: options.homeDir ?? null,
    name: "Cowork recents",
    projectlessImportRoot: join(identityLocation.accountOrgDir, "projectless-spaces", "account"),
    spaceConfigPath,
    spaceId: null,
    userDataDir: identityLocation.userDataDir,
    userDataDirs,
  };
}

/** projectless → project 形状（原 `jF`）。 */
export function projectlessAsProject(space: ProjectlessSpace): CoworkProject {
  return {
    accountOrgDir: space.accountOrgDir,
    accountOrgDirs: space.accountOrgDirs,
    documentsDir: space.documentsDir,
    homeDir: space.homeDir,
    instructions: null,
    name: space.name,
    sourceRoot: space.projectlessImportRoot,
    spaceId: space.spaceId ?? "account",
    userDataDir: space.userDataDir,
    userDataDirs: space.userDataDirs,
  };
}

// ---------------------------------------------------------------------------
// 空间发现入口（原 `OF`/`yPe`）
// ---------------------------------------------------------------------------

/** 单组 accountOrg 位置的空间发现（原 `yPe`）。 */
async function discoverSpacesAtLocation({
  locations,
  options,
  userDataDirs,
  warnings,
}: {
  locations: AccountOrgLocation[];
  options: DiscoveryOptions;
  userDataDirs: string[];
  warnings: string[];
}): Promise<Array<{ project: CoworkProject | null; projectlessSpace: ProjectlessSpace | null; skippedProject: SkippedProject | null }>> {
  const identityLocation = resolveIdentityLocation(locations, options);
  const accountOrgDirs = locations.map((location) => location.accountOrgDir);
  const spacesPaths = await filterExisting(accountOrgDirs.map((dir) => join(dir, "spaces.json")));
  const parsedSpaces = await Promise.all(spacesPaths.map(async (path) => ({ parsed: await readJsonFile(path, spaceListSchema as never), sourcePath: path })));

  const spacesById = new Map<string, { sourcePath: string; space: CoworkSpace }>();
  for (const { parsed, sourcePath } of parsedSpaces) {
    if (parsed == null) {
      warnings.push(`Could not read Claude Cowork spaces file: ${sourcePath}`);
      continue;
    }
    const list = Array.isArray(parsed) ? parsed : (parsed as { spaces: CoworkSpace[] }).spaces;
    for (const space of list) if (!spacesById.has(space.id)) spacesById.set(space.id, { sourcePath, space });
  }

  const fallbackConfigPath =
    parsedSpaces.find((entry) => entry.parsed != null)?.sourcePath ?? spacesPaths[0] ?? join(locations[0].accountOrgDir, "spaces.json");

  const accountProjectless =
    (await hasAccountLevelActivity(accountOrgDirs)) || (await hasPluginSurfaces(accountOrgDirs, userDataDirs))
      ? buildAccountProjectlessSpace({ accountOrgDirs, identityLocation, options, spaceConfigPath: fallbackConfigPath, userDataDirs })
      : null;

  if (spacesById.size === 0)
    return accountProjectless == null ? [] : [{ project: null, projectlessSpace: accountProjectless, skippedProject: null }];

  const classified = await Promise.all(
    [...spacesById.values()].map(async ({ sourcePath, space }) =>
      classifySpace({ accountOrgDirs, identityLocation, options, space, spaceConfigPath: sourcePath, userDataDirs }),
    ),
  );
  return accountProjectless == null ? classified : [...classified, { project: null, projectlessSpace: accountProjectless, skippedProject: null }];
}

/** 空间发现（原 `OF`）：全部 accountOrg 位置 + 云会话计数。 */
export async function discoverCoworkSpaces(options: DiscoveryOptions): Promise<DiscoveryResult> {
  const warnings: string[] = [];
  const userDataDirs = dedupeUserDataDirs(options);
  const locationGroups = await discoverAccountOrgLocations(userDataDirs);

  const [groupResults, cloudSessions] = await Promise.all([
    Promise.all(locationGroups.map((locations) => discoverSpacesAtLocation({ locations, options, userDataDirs, warnings }))),
    Promise.all(
      locationGroups.flat().map(async ({ accountOrgDir }) => {
        const parsed = await readJsonFile(join(accountOrgDir, "remote-session-spaces.json"), sessionEntriesSchema as never);
        return (
          (parsed as { entries?: Array<{ sessionId: string } | null> } | null)?.entries
            .filter((entry) => entry != null)
            .map((entry) => entry.sessionId.replace(/^cse_/, "session_"))
            .filter((sessionId) => /^session_[A-Za-z0-9]+$/.test(sessionId)) ?? []
        );
      }),
    ),
  ]);

  const all = groupResults.flat();
  const projects = all.flatMap((entry) => (entry.project != null ? [entry.project] : []));
  const projectlessSpaces = all.flatMap((entry) => (entry.projectlessSpace != null ? [entry.projectlessSpace] : []));
  const skippedProjects = all.flatMap((entry) => (entry.skippedProject != null ? [entry.skippedProject] : []));

  if (projects.length === 0 && projectlessSpaces.length === 0 && skippedProjects.length === 0 && warnings.length === 0)
    warnings.push("No Claude Cowork spaces were found");

  return {
    cloudSessionCount: new Set(cloudSessions.flat()).size,
    projectlessSpaces,
    projects,
    skippedProjects,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// 会话 manifest（原 `APe`/`jPe`/`HF`/`MPe`/`WF`/`qF`/`KF`/`FPe`）
// ---------------------------------------------------------------------------

const sessionEntrySchema = (looseObjectSchema({
  createdBySessionId: stringSchema().nullable().optional(),
  id: stringSchema(),
  lastModifiedBySessionId: stringSchema().nullable().optional(),
  name: stringSchema().nullable().optional(),
}) as unknown as { loose(): unknown }).loose();
const artifactListSchema = unionSchema([arraySchema(sessionEntrySchema as never), (looseObjectSchema({ artifacts: arraySchema(sessionEntrySchema as never) }) as unknown as { loose(): unknown }).loose()]);

interface ManifestFileEntry {
  accountOrgDir: string;
  manifest: SessionManifest;
  sourceOrder: number;
}

/** org 目录的搜索根（原 `KF`：org 目录 + 其 agent 子目录，偶奇交错序）。 */
function manifestSearchRoots(byAccountOrg: Map<string, string[]>): Array<{ accountOrgDir: string; path: string; sourceOrder: number }> {
  return [...byAccountOrg].flatMap(([accountOrgDir, dirs]) =>
    dirs.flatMap((dir, index) => [
      { accountOrgDir, path: dir, sourceOrder: index * 2 },
      { accountOrgDir, path: join(dir, "agent"), sourceOrder: index * 2 + 1 },
    ]),
  );
}

/** manifest 文件生成器（原 `qF`：预算化目录扫描）。 */
async function* iterateManifestFiles(byAccountOrg: Map<string, string[]>, budget: DiscoveryBudget | undefined): AsyncGenerator<{ accountOrgDir: string; modifiedAtMs: number; path: string; sourceOrder: number }> {
  const halfBudget = SAFETY_LIMITS.directoryEntries / 2;
  for (const root of manifestSearchRoots(byAccountOrg)) {
    const dir = await opendir(root.path).catch(() => null);
    if (dir == null) continue;
    for await (const entry of dir) {
      if (budget != null && !consumeBudget(budget, "directoryEntries", halfBudget)) return;
      if (!entry.isFile() || !entry.name.endsWith(".json") || COWORK_CONFIG_FILENAMES.has(entry.name)) continue;
      const filePath = join(root.path, entry.name);
      const stats = await stat(filePath).catch(() => null);
      if (stats?.isFile())
        yield { accountOrgDir: root.accountOrgDir, modifiedAtMs: stats.mtimeMs, path: filePath, sourceOrder: root.sourceOrder };
    }
  }
}

/** 单 manifest 解析（原 `WF`）：schema 校验 + 字段归一。 */
async function readSessionManifest(path: string, budget: DiscoveryBudget | undefined): Promise<{ bytesRead: number; manifest: SessionManifest } | null> {
  const result = await readBoundedWithBudget(path, SAFETY_LIMITS.manifestFileBytes, budget, "manifestBytes");
  if (result.status === "too-large") throw new CoworkHistoryLimitError();
  if (result.status === "unreadable") return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(result.text);
  } catch {
    return null;
  }
  const validated = (sessionSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: Record<string, unknown> } }).safeParse(parsed);
  if (!validated.success) return null;
  const session = validated.data!;
  const sessionId = (session.sessionId as string) ?? (session.id as string) ?? basename(path, ".json");
  return {
    bytesRead: result.status === "read" ? result.bytesRead : 0,
    manifest: {
      cliSessionIds: session.cliSessionId == null ? [] : [session.cliSessionId as string],
      cwd: (session.cwd as string) ?? null,
      detectedFiles: ((session.fsDetectedFiles as Array<Record<string, unknown>>) ?? []).map((file) => ({
        fileName: file.fileName as string,
        hostPath: file.hostPath as string,
        timestampMs: normalizeTimestamp(file.timestamp ?? null),
      })),
      lastActivityAtMs: normalizeTimestamp(session.lastActivityAt ?? session.updatedAt ?? session.createdAt ?? null),
      manifestPath: path,
      remoteMcpServerNames: collectMcpServerNames(session.remoteMcpServersConfig),
      scheduledTaskId: (session.scheduledTaskId as string) ?? null,
      sessionId,
      spaceId: (session.spaceId as string) ?? null,
      storageDirs: [path.slice(0, -extname(path).length)],
      title: (session.title as string) ?? null,
      userSelectedFolders: resolveFolderPaths(session.userSelectedFolders as Array<string | { path: string }> | undefined),
    },
  };
}

/** remoteMcpServersConfig 的 server 名列表（原 `EMe`）。 */
function collectMcpServerNames(config: unknown): string[] {
  if (!isPlainObject(config)) return [];
  const names = new Map<string, string>();
  for (const rawName of Object.keys(config)) {
    const trimmed = rawName.trim();
    if (trimmed.length === 0) continue;
    const key = trimmed.toLowerCase();
    if (!names.has(key)) names.set(key, trimmed);
  }
  return [...names.values()].sort((a, b) => a.localeCompare(b));
}

/** manifest 合并（原 `MPe`）：首见优先 + 列表并集。 */
function mergeSessionManifests(primary: SessionManifest, secondary: SessionManifest): SessionManifest {
  const union = (a: string[], b: string[]) => [...new Set([...a, ...b])];
  const detectedByPath = new Map(primary.detectedFiles.map((file) => [file.hostPath, file]));
  for (const file of secondary.detectedFiles) if (!detectedByPath.has(file.hostPath)) detectedByPath.set(file.hostPath, file);
  return {
    ...primary,
    cliSessionIds: union(primary.cliSessionIds, secondary.cliSessionIds),
    cwd: primary.cwd ?? secondary.cwd,
    detectedFiles: [...detectedByPath.values()],
    lastActivityAtMs: primary.lastActivityAtMs ?? secondary.lastActivityAtMs,
    remoteMcpServerNames: union(primary.remoteMcpServerNames, secondary.remoteMcpServerNames),
    scheduledTaskId: primary.scheduledTaskId ?? secondary.scheduledTaskId,
    spaceId: primary.spaceId ?? secondary.spaceId,
    storageDirs: union(primary.storageDirs, secondary.storageDirs),
    title: primary.title ?? secondary.title,
    userSelectedFolders: union(primary.userSelectedFolders, secondary.userSelectedFolders),
  };
}

/** manifest 分组排序（原 `HF`）：sourceOrder → path，再按 sessionId 去重合并。 */
function groupSessionManifests(entries: ManifestFileEntry[]): Map<string, SessionManifest[]> {
  entries.sort((a, b) => a.sourceOrder - b.sourceOrder || a.manifest.manifestPath.localeCompare(b.manifest.manifestPath));
  const byAccountOrg = new Map<string, Map<string, SessionManifest>>();
  for (const { accountOrgDir, manifest } of entries) {
    let bySession = byAccountOrg.get(accountOrgDir);
    if (!bySession) byAccountOrg.set(accountOrgDir, (bySession = new Map()));
    const existing = bySession.get(manifest.sessionId);
    bySession.set(manifest.sessionId, existing == null ? manifest : mergeSessionManifests(existing, manifest));
  }
  return new Map([...byAccountOrg].map(([dir, bySession]) => [dir, [...bySession.values()]]));
}

/** 全量 manifest 发现（原 `APe`）：预算化扫描 + deferred 补齐。 */
async function discoverSessionManifests(byAccountOrg: Map<string, string[]>, budget: DiscoveryBudget): Promise<Map<string, SessionManifest[]>> {
  const files: Array<{ accountOrgDir: string; modifiedAtMs: number; path: string; sourceOrder: number }> = [];
  for await (const entry of iterateManifestFiles(byAccountOrg, budget)) files.push(entry);

  const wasDeferred = budget.deferred;
  const searchRoots = manifestSearchRoots(byAccountOrg);

  // 按（org 目录, 文件名）分组；deferred 时从其它 org 目录补齐同名文件。
  const groups = new Map<string, typeof files>();
  for (const file of files.sort((a, b) => b.modifiedAtMs - a.modifiedAtMs)) {
    const key = JSON.stringify([file.accountOrgDir, basename(file.path)]);
    const group = groups.get(key);
    group == null ? groups.set(key, [file]) : group.push(file);
  }

  const collected: ManifestFileEntry[] = [];
  manifestGroups: for (const group of groups.values()) {
    if (budget.remaining.manifestBytes <= 1) {
      budget.deferred = true;
      break;
    }
    if (wasDeferred) {
      const anchor = group[0];
      const known = new Set(group.map((file) => file.path));
      for (const root of searchRoots.filter((entry) => entry.accountOrgDir === anchor.accountOrgDir)) {
        const candidate = join(root.path, basename(anchor.path));
        if (known.has(candidate)) continue;
        if (!consumeBudget(budget, "directoryEntries")) break manifestGroups;
        const stats = await stat(candidate).catch(() => null);
        if (stats?.isFile())
          group.push({ accountOrgDir: anchor.accountOrgDir, modifiedAtMs: stats.mtimeMs, path: candidate, sourceOrder: root.sourceOrder });
      }
    }
    group.sort((a, b) => a.sourceOrder - b.sourceOrder || a.path.localeCompare(b.path));
    const parsed: ManifestFileEntry[] = [];
    for (const file of group) {
      if (!consumeBudget(budget, "manifestAttempts")) break manifestGroups;
      try {
        const manifest = await readSessionManifest(file.path, budget);
        if (manifest != null) parsed.push({ accountOrgDir: file.accountOrgDir, manifest: manifest.manifest, sourceOrder: file.sourceOrder });
      } catch (error) {
        if (!(error instanceof CoworkHistoryLimitError)) throw error;
        continue manifestGroups;
      }
    }
    collected.push(...parsed);
  }
  return groupSessionManifests(collected);
}

/** 选定会话的 manifest 发现（原 `jPe`）：sessionId 锚定 + storageDirs 校验。 */
async function discoverSelectedSessionManifests(byAccountOrg: Map<string, string[]>, selectedSessionIds: string[]): Promise<Map<string, SessionManifest[]>> {
  if (selectedSessionIds.length === 0) return new Map();
  const sessionIdsByOrg = new Map([...byAccountOrg].map(([dir, dirs]) => [dir, resolveSessionIdCandidates(dirs, selectedSessionIds)]));
  const parsedByPath = new Map<string, ManifestFileEntry>();
  const sessionIdsSeen = new Map<string, Set<string>>();
  let totalBytes = 0;

  for (const root of manifestSearchRoots(byAccountOrg)) {
    for (const sessionId of sessionIdsByOrg.get(root.accountOrgDir) ?? []) {
      const manifestPath = join(root.path, `${sessionId}.json`);
      if (parsedByPath.has(manifestPath)) continue;
      const parsed = await readSessionManifest(manifestPath, undefined);
      if (parsed == null) continue;
      totalBytes += parsed.bytesRead;
      if (totalBytes > SAFETY_LIMITS.manifestBytes) throw new CoworkHistoryLimitError();
      parsedByPath.set(manifestPath, { accountOrgDir: root.accountOrgDir, manifest: parsed.manifest, sourceOrder: root.sourceOrder });
      const seen = sessionIdsSeen.get(root.accountOrgDir) ?? new Set<string>();
      seen.add(parsed.manifest.sessionId);
      sessionIdsSeen.set(root.accountOrgDir, seen);
    }
  }

  const collected = [...parsedByPath.values()];
  // 校验：每个选定会话的 storageDirs 至少有一个可定位，否则视为不可读。
  if (selectedSessionIds.some((sessionId) => !collected.some(({ manifest }) => manifest.storageDirs.some((dir) => isPathInsideDir(sessionId, dir) || sessionId.includes(dir)))))
    throw new CoworkHistoryReadError();

  // 补齐：同 org 目录下与已见 sessionId 相同的其它 manifest。
  const anchored = new Map([...byAccountOrg].filter(([dir]) => sessionIdsSeen.has(dir)));
  for await (const file of iterateManifestFiles(anchored, undefined)) {
    if (parsedByPath.has(file.path)) continue;
    let parsed: { bytesRead: number; manifest: SessionManifest } | null;
    try {
      parsed = await readSessionManifest(file.path, undefined);
    } catch (error) {
      if (!(error instanceof CoworkHistoryLimitError)) throw error;
      continue;
    }
    if (parsed != null && sessionIdsSeen.get(file.accountOrgDir)?.has(parsed.manifest.sessionId)) {
      totalBytes += parsed.bytesRead;
      if (totalBytes > SAFETY_LIMITS.manifestBytes) throw new CoworkHistoryLimitError();
      collected.push({ accountOrgDir: file.accountOrgDir, manifest: parsed.manifest, sourceOrder: file.sourceOrder });
    }
  }
  return groupSessionManifests(collected);
}

/** 选定会话的候选 id（原 `FPe`：org 目录下的 <sessionId> 子目录名）。 */
function resolveSessionIdCandidates(dirs: string[], selectedSessionIds: string[]): Set<string> {
  const candidates = new Set<string>();
  for (const sessionId of selectedSessionIds) {
    for (const dir of dirs) {
      if (!isPathInsideDir(sessionId, dir)) continue;
      const segments = relative(dir, sessionId).split(sep);
      const first = segments[0] === "agent" ? segments[1] : segments[0];
      if (first != null && first !== "" && first !== "." && first !== "..") candidates.add(first);
    }
  }
  return candidates;
}

// ---------------------------------------------------------------------------
// 配置面 + scheduled tasks（原 `GF`/`PPe`/`kPe`）
// ---------------------------------------------------------------------------

const CONFIG_SURFACE_FILES = [
  { kind: "plugins", relativePath: "plugins.json" },
  { kind: "plugins", relativePath: "plugins-mcp-skills.json" },
  { kind: "plugins", relativePath: ".local-plugins" },
  { kind: "plugins", relativePath: ".remote-plugins" },
  { kind: "skills", relativePath: "skills.json" },
  { kind: "skills", relativePath: "skills" },
  { kind: "agents", relativePath: "agents.json" },
  { kind: "agents", relativePath: "agents" },
  { kind: "settings", relativePath: "cowork_account_settings.json" },
  { kind: "settings", relativePath: "cowork_settings.json" },
] as const;

const EXTENSION_SURFACES = [
  { kind: "extensions", relativePath: "Claude Extensions" },
  { kind: "extensions", relativePath: "Claude Extensions Settings" },
  { kind: "extensions", relativePath: "Extensions Update Cache" },
  { kind: "extensions", relativePath: "extensions-blocklist.json" },
  { kind: "extensions", relativePath: "extensions-installations.json" },
] as const;

/** MCP 活跃配置面（原 `PPe`）。 */
async function findActiveMcpConfigSurfaces({ disabledServerNames, project, warnings }: { disabledServerNames: Set<string>; project: CoworkProject; warnings?: string[] }): Promise<ConfigSurface[]> {
  const files = await readMcpConfigFiles(project);
  return (
    await Promise.all(
      files.map(async ({ parsed, sourcePath }) => {
        if (parsed == null) {
          warnings?.push(`Could not read Cowork MCP config file: ${sourcePath}`);
          return null;
        }
        const servers = { ...(parsed.mcpServers as Record<string, unknown>), ...(parsed.mcp_servers as Record<string, unknown>) };
        const hasActive = Object.entries(servers).some(([name, config]) => {
          const trimmed = name.trim();
          return trimmed !== "" && !isServerDisabled({ disabledServerNames, serverConfig: config as Record<string, unknown>, serverName: trimmed });
        });
        return hasActive
          ? {
              kind: project.userDataDirs.some((dir) => sourcePath === join(dir, "claude_desktop_config.json")) ? "settings" : "mcp",
              path: sourcePath,
            }
          : null;
      }),
    )
  ).filter((surface): surface is ConfigSurface => surface != null);
}

/** 项目的全部配置面（原 `GF`）。 */
async function collectConfigSurfacesForProject(project: CoworkProject, warnings: string[], settings?: Record<string, unknown>): Promise<ConfigSurface[]> {
  const disabledNames = readDisabledServerNames(settings ?? (warnings == null ? {} : await readCoworkSettings(project.accountOrgDirs, warnings)));
  const mcpSurfaces = await findActiveMcpConfigSurfaces({ disabledServerNames: disabledNames, project, warnings });
  const standardSurfaces: ConfigSurface[] = (
    await Promise.all(
      [
        ...CONFIG_SURFACE_FILES.map((surface) => ({ ...surface, roots: project.accountOrgDirs })),
        ...EXTENSION_SURFACES.map((surface) => ({ ...surface, roots: project.userDataDirs })),
      ].map(async ({ kind, relativePath, roots }): Promise<ConfigSurface | null> => {
        const [existing] = await filterExisting(roots.map((root) => join(root, relativePath)));
        return existing == null ? null : { kind, path: existing };
      }),
    )
  ).filter((surface): surface is ConfigSurface => surface != null);

  if (project.homeDir != null) {
    const operonDir = join(project.homeDir, ".operon");
    if (await pathExists(operonDir)) standardSurfaces.push({ kind: "operon", path: operonDir });
  }
  return [...mcpSurfaces, ...standardSurfaces];
}

/** scheduled tasks（原 `kPe`）。 */
async function readScheduledTasks(project: CoworkProject, warnings: string[] | null): Promise<Array<{ id: string; name: string | null; sourcePath: string }>> {
  const paths = await filterExisting(project.accountOrgDirs.map((dir) => join(dir, "scheduled-tasks.json")));
  if (paths.length === 0) return [];
  const parsed = await Promise.all(paths.map(async (path) => ({ parsed: await readJsonFile(path, taskListSchema as never), sourcePath: path })));
  for (const entry of parsed)
    if (entry.parsed == null && warnings != null)
      warnings.push(`Could not read Claude Cowork scheduled tasks file: ${entry.sourcePath}`);
  const first = parsed.find((entry) => entry.parsed != null);
  if (first?.parsed == null) return [];
  const tasks = Array.isArray(first.parsed) ? first.parsed : (first.parsed as { tasks: Array<Record<string, unknown>> }).tasks;
  return tasks
    .filter((task) => task.spaceId == null || task.spaceId === project.spaceId)
    .map((task, index) => ({
      id: (task.id as string) ?? `scheduled-task-${index + 1}`,
      name: (task.name as string) ?? (task.title as string) ?? null,
      sourcePath: first.sourcePath,
    }));
}

// ---------------------------------------------------------------------------
// 配置面收集入口（原 `VF`）
// ---------------------------------------------------------------------------

/** 全部项目的配置面 + manifest 收集（原 `VF`）。 */
export async function collectConfigSurfaces(
  discovery: DiscoveryResult,
  selectedSessionIds?: string[],
): Promise<ConfigSurfacesResult> {
  const byAccountOrg = new Map(
    [...discovery.projects, ...discovery.projectlessSpaces].map(({ accountOrgDir, accountOrgDirs }) => [accountOrgDir, accountOrgDirs]),
  );
  let budget: DiscoveryBudget | undefined;
  let manifests: Map<string, SessionManifest[]>;
  if (selectedSessionIds == null) {
    budget = createDiscoveryBudget();
    manifests = await discoverSessionManifests(byAccountOrg, budget);
  } else {
    manifests = await discoverSelectedSessionManifests(byAccountOrg, selectedSessionIds);
  }

  const projectScans: ProjectScan[] = await Promise.all(
    discovery.projects.map(async (project) => {
      const warnings: string[] = [];
      const settings = await readCoworkSettings(project.accountOrgDirs, warnings);
      const [scheduledTasks, configSurfaces] = await Promise.all([
        readScheduledTasks(project, warnings),
        collectConfigSurfacesForProject(project, warnings, settings),
      ]);
      return {
        configSurfaces,
        project,
        scheduledTasks,
        sessionManifests: manifests.get(project.accountOrgDir) ?? [],
        warnings,
      };
    }),
  );

  const projectlessScans: ProjectlessScanResult[] = await Promise.all(
    discovery.projectlessSpaces.map(async (space) => {
      const asProject = projectlessAsProject(space);
      const warnings: string[] = [];
      const settings = await readCoworkSettings(asProject.accountOrgDirs, warnings);
      const [configSurfaces, scan] = await Promise.all([
        collectConfigSurfacesForProject(asProject, warnings, settings),
        scanProjectlessSpace(asProject),
      ]);
      const skillSurfaces: ConfigSurface[] = scan.looseSkills.map((skill) => ({ kind: "skills", path: skill.skillRoot }));
      return {
        configSurfaces: [...configSurfaces, ...skillSurfaces],
        pluginCandidates: scan.pluginBundles,
        projectlessSpace: space,
        sessionManifests: manifests.get(space.accountOrgDir) ?? [],
        warnings,
      };
    }),
  );

  const configSurfacesByProjectRoot = new Map(projectScans.map((scan) => [scan.project.sourceRoot, scan.configSurfaces]));
  for (const scan of projectlessScans) configSurfacesByProjectRoot.set(scan.projectlessSpace.projectlessImportRoot, scan.configSurfaces);

  return {
    configSurfacesByProjectRoot,
    historyDiscoveryBudget: budget,
    pluginCandidatesByProjectlessSpaceRoot: new Map(
      projectlessScans.map((scan) => [scan.projectlessSpace.projectlessImportRoot, scan.pluginCandidates]),
    ),
    projectlessSpaces: discovery.projectlessSpaces,
    projects: discovery.projects,
    scheduledTasksByProjectRoot: new Map(projectScans.map((scan) => [scan.project.sourceRoot, scan.scheduledTasks])),
    sessionManifestsByProjectlessSpaceRoot: new Map(
      projectlessScans.map((scan) => [scan.projectlessSpace.projectlessImportRoot, scan.sessionManifests]),
    ),
    sessionManifestsByProjectRoot: new Map(projectScans.map((scan) => [scan.project.sourceRoot, scan.sessionManifests])),
    skippedProjects: discovery.skippedProjects,
    warnings: [...discovery.warnings, ...projectScans.flatMap((scan) => scan.warnings), ...projectlessScans.flatMap((scan) => scan.warnings)],
  };
}

/** projectless 空间的 skills/plugins 扫描（原 `yF`，looseSkills/pluginBundles）。 */
export async function scanProjectlessSpace(project: CoworkProject): Promise<ProjectlessScan> {
  // skills：org 目录下的 skills/<名> 目录
  const looseSkills: LooseSkill[] = [];
  for (const orgDir of project.accountOrgDirs) {
    const skillsRoot = join(orgDir, "skills");
    if (!(await isDirectory(skillsRoot))) continue;
    for (const entry of await readdir(skillsRoot, { withFileTypes: true }).catch(() => [])) {
      if (entry.isDirectory()) looseSkills.push({ skillRoot: join(skillsRoot, entry.name) });
    }
  }
  // plugins：.local-plugins/.remote-plugins 的插件候选（原 `yF`：manifest
  // name/version 优先，缺失时回退目录名 + 版本清洗）
  const pluginBundles: PluginCandidate[] = [];
  for (const orgDir of project.accountOrgDirs) {
    for (const pluginsDir of [join(orgDir, ".local-plugins"), join(orgDir, ".remote-plugins")]) {
      if (!(await isDirectory(pluginsDir))) continue;
      for (const entry of await readdir(pluginsDir, { withFileTypes: true }).catch(() => [])) {
        if (!entry.isDirectory()) continue;
        const pluginRoot = join(pluginsDir, entry.name);
        const manifestPath = join(pluginRoot, "manifest.json");
        if (!(await isFile(manifestPath))) continue;
        const manifest = await readJsonFile(manifestPath, pluginManifestSchema as never);
        const manifestName = typeof (manifest as { name?: unknown })?.name === "string" ? (manifest as { name: string }).name.trim() : "";
        const manifestVersion = typeof (manifest as { version?: unknown })?.version === "string" ? (manifest as { version: string }).version.trim() : "";
        pluginBundles.push({
          accountOrgDir: project.accountOrgDir,
          pluginName:
            manifestName === ""
              ? entry.name.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "cowork-plugin"
              : manifestName.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "cowork-plugin",
          pluginRoot,
          manifestPath,
          skillPaths: await walkFiles(pluginRoot).then((paths) => paths.filter((path) => basename(path) === "SKILL.md")),
          ...(manifestVersion === ""
            ? {}
            : { version: manifestVersion.replace(/[^A-Za-z0-9.+_-]+/g, "-").replace(/^[.+-]+|[.+-]+$/g, "") || "local" }),
        });
      }
    }
  }
  return { looseSkills, pluginBundles };
}

// ---------------------------------------------------------------------------
// artifacts / 输出文件（原 `RPe`/`YFe`/`zPe`/`HPe`/`UPe`/`WPe`/`GPe`/`KPe` 等）
// ---------------------------------------------------------------------------

/** 允许导入的文件扩展名（原 `IPe`）。 */
const IMPORTABLE_EXTENSIONS = new Set([
  "csv", "doc", "docx", "htm", "html", "jpeg", "jpg", "jsx", "md", "mdx", "mermaid",
  "pdf", "png", "ppt", "pptx", "svg", "tsv", "txt", "webp", "xls", "xlsm", "xlsx",
]);

export interface OutputSource {
  kind: "output";
  label: string;
  relativePath: string;
  sourcePath: string;
}

export interface ArtifactSource {
  kind: "artifact";
  artifactId: string;
  label: string;
  sourceDirectory: string;
}

export type ImportFileSource = OutputSource | ArtifactSource;

export interface ImportFileResult {
  kind: "output" | "artifact";
  label: string;
  targetPath: string;
}

interface UploadIndex {
  fileKeys: Set<string>;
  realPaths: Set<string>;
  roots: string[];
}

function pathIdentity(path: string): string {
  const normalizedPath = normalize(path);
  return process.platform === "win32" ? normalizedPath.toLowerCase() : normalizedPath;
}

/** 文件名清洗（原 `eI`：控制字符与 Windows 保留字符替换）。 */
function sanitizeFileName(name: string): string {
  const sanitized = Array.from(name)
    .map((char) => (char.charCodeAt(0) <= 31 || `<>:"|?*`.includes(char) ? "-" : char))
    .join("")
    .trim();
  return sanitized === "" || sanitized === "." || sanitized === ".." ? "file" : sanitized;
}

/** 相对路径清洗（原 `$F`）。 */
function sanitizeRelativePath(fileName: string, hostPath: string): string | null {
  const normalized = fileName.replaceAll("\\", "/");
  if (normalized.startsWith("/") || /^[A-Za-z]:\//.test(normalized)) return sanitizeFileName(basename(hostPath));
  const segments = normalized.split("/").filter((segment) => segment !== "");
  if (segments.length === 0 || segments.some((segment) => segment === "..")) return null;
  return join(...segments.map(sanitizeFileName));
}

/** 重名递增（原 `tI`：name-2.ext）。 */
function allocateRelativePath(path: string, used: Set<string>): string {
  const normalized = normalize(path);
  const extension = extname(normalized);
  const stem = normalized.slice(0, normalized.length - extension.length);
  let candidate = normalized;
  let counter = 2;
  while (used.has(pathIdentity(candidate))) {
    candidate = `${stem}-${counter}${extension}`;
    counter += 1;
  }
  used.add(pathIdentity(candidate));
  return candidate;
}

async function fileIdentityKey(path: string): Promise<string | null> {
  try {
    const stats = await stat(path);
    return `${stats.dev}:${stats.ino}`;
  } catch {
    return null;
  }
}

async function realPathOf(path: string): Promise<string | null> {
  try {
    return await realpath(path);
  } catch {
    return null;
  }
}

/** uploads 索引（原 `GPe`）。 */
async function buildUploadIndex(sessionStorageDirs: string[]): Promise<UploadIndex> {
  const uploadRoots = sessionStorageDirs.map((dir) => join(dir, "uploads"));
  const files = (await Promise.all(uploadRoots.map((root) => walkFiles(root)))).flat();
  const identities = await Promise.all(files.map(async (file) => ({ fileKey: await fileIdentityKey(file), realPath: await realPathOf(file) })));
  return {
    fileKeys: new Set(identities.flatMap(({ fileKey }) => fileKey ?? [])),
    realPaths: new Set(identities.flatMap(({ realPath }) => realPath ?? [])),
    roots: uploadRoots,
  };
}

/** 文件是否为 upload 的引用（原 `KPe`）。 */
async function isUploadReference(path: string, index: UploadIndex): Promise<boolean> {
  if (index.roots.some((root) => isPathInsideDir(root, path))) return true;
  const [fileKey, realPath] = await Promise.all([fileIdentityKey(path), realPathOf(path)]);
  return (fileKey != null && index.fileKeys.has(fileKey)) || (realPath != null && index.realPaths.has(realPath));
}

/** 会话输出文件收集（原 `zPe`/`BPe`）：detectedFiles + outputs 目录，排除 upload 引用。 */
async function collectOutputSources(session: {
  detectedFiles: Array<{ fileName: string; hostPath: string }>;
  sessionStorageDirs: string[];
  documentsDir: string;
  accountOrgDirs: string[];
}): Promise<OutputSource[]> {
  const uploadIndex = await buildUploadIndex(session.sessionStorageDirs);
  const detected = session.detectedFiles.flatMap((file) => {
    const relativePath = sanitizeRelativePath(file.fileName, file.hostPath);
    return relativePath == null ? [] : [{ relativePath, sourcePath: file.hostPath }];
  });
  const outputs = (
    await Promise.all(
      session.sessionStorageDirs.map(async (dir) => {
        const outputsRoot = join(dir, "outputs");
        return (await walkFiles(outputsRoot)).flatMap((path) => {
          const relativePath = sanitizeRelativePath(relative(outputsRoot, path), path);
          return relativePath == null ? [] : [{ relativePath, sourcePath: path }];
        });
      }),
    )
  ).flat();
  const byPath = new Map<string, { relativePath: string; sourcePath: string }>();
  for (const output of outputs) {
    const key = pathIdentity(output.sourcePath);
    if (!byPath.has(key)) byPath.set(key, output);
  }
  const candidates = [...byPath.values(), ...detected];
  const collected = (
    await Promise.all(
      candidates.map(async (candidate) => {
        const extension = extname(candidate.relativePath).slice(1).toLowerCase();
        if (!IMPORTABLE_EXTENSIONS.has(extension)) return null;
        if (await isUploadReference(candidate.sourcePath, uploadIndex)) return null;
        if (!(await isFile(candidate.sourcePath))) return null;
        return { kind: "output" as const, label: basename(candidate.relativePath), relativePath: candidate.relativePath, sourcePath: candidate.sourcePath };
      }),
    )
  ).filter((source): source is OutputSource => source != null);
  // 源路径去重（原 `qPe`）。
  const seen = new Set<string>();
  return candidates.length === 0 ? [] : collected.filter((source) => {
    const key = pathIdentity(resolve(source.sourcePath));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** artifacts 收集（原 `HPe`）：artifacts.json 中本会话创建/修改的 artifact 目录。 */
async function collectArtifactSources(session: { accountOrgDirs: string[]; documentsDir: string; sourceId: string }): Promise<ArtifactSource[]> {
  const artifactsRoot = join(session.documentsDir, "Claude", "Artifacts");
  const byId = new Map<string, Record<string, unknown>>();
  const parsed = await Promise.all(session.accountOrgDirs.map((dir) => readJsonFile(join(dir, "artifacts.json"), artifactListSchema as never)));
  for (const artifact of parsed.flatMap((entry) => (entry == null ? [] : Array.isArray(entry) ? entry : (entry as { artifacts: Array<Record<string, unknown>> }).artifacts))) {
    const key = pathIdentity(join(artifactsRoot, artifact.id as string));
    if (!byId.has(key)) byId.set(key, artifact);
  }
  return (
    await Promise.all(
      [...byId.values()].map(async (artifact) => {
        if (artifact.createdBySessionId !== session.sourceId && artifact.lastModifiedBySessionId !== session.sourceId) return null;
        const directory = join(artifactsRoot, artifact.id as string);
        return (artifact.id as string).trim() === "" || !isPathInsideDir(directory, artifactsRoot) || !(await isDirectory(directory))
          ? null
          : { artifactId: artifact.id as string, kind: "artifact" as const, label: (artifact.name as string) ?? (artifact.id as string), sourceDirectory: directory };
      }),
    )
  ).filter((source): source is ArtifactSource => source != null);
}

/** 会话导入文件源汇总（原 `RPe`）：输出文件 + artifacts。 */
export async function collectImportFileSources(session: {
  accountOrgDirs: string[];
  detectedFiles: Array<{ fileName: string; hostPath: string }>;
  documentsDir: string;
  sessionStorageDirs: string[];
  sourceId: string;
}): Promise<ImportFileSource[]> {
  const [outputs, artifacts] = await Promise.all([
    collectOutputSources(session),
    collectArtifactSources(session),
  ]);
  return [...outputs, ...artifacts];
}

/** 输出文件 + artifacts 拷贝（原 `YFe`/`UPe`/`WPe`）。 */
export async function importSessionFiles({
  candidate,
  outputDirectory,
  sources,
}: {
  candidate: { projectRoot: string; workspaceKind?: string };
  outputDirectory: string;
  sources: ImportFileSource[];
}): Promise<ImportFileResult[]> {
  if (sources.length === 0) return [];
  await mkdir(outputDirectory, { recursive: true });
  const usedRelativePaths = new Set<string>();
  return (
    await Promise.all(
      sources.map((source) =>
        source.kind === "output"
          ? importOutputFile({ candidate, outputDirectory, source, usedRelativePaths })
          : importArtifactDirectory({ outputDirectory, source, usedRelativePaths }),
      ),
    )
  ).filter((result): result is ImportFileResult => result != null);
}

async function importOutputFile({
  candidate,
  outputDirectory,
  source,
  usedRelativePaths,
}: {
  candidate: { projectRoot: string; workspaceKind?: string };
  outputDirectory: string;
  source: OutputSource;
  usedRelativePaths: Set<string>;
}): Promise<ImportFileResult | null> {
  // 项目内文件留在原位。
  if (candidate.workspaceKind === "project" && isPathInsideDir(source.sourcePath, candidate.projectRoot))
    return { kind: "output", label: source.label, targetPath: source.sourcePath };
  const relativePath = allocateRelativePath(source.relativePath, usedRelativePaths);
  const targetPath = join(outputDirectory, relativePath);
  if (!isPathInsideDir(targetPath, outputDirectory)) return null;
  if (!pathsEqual(source.sourcePath, targetPath)) {
    await mkdir(dirname(targetPath), { recursive: true });
    await copyFile(source.sourcePath, targetPath);
  }
  return { kind: "output", label: source.label, targetPath };
}

async function importArtifactDirectory({
  outputDirectory,
  source,
  usedRelativePaths,
}: {
  outputDirectory: string;
  source: ArtifactSource;
  usedRelativePaths: Set<string>;
}): Promise<ImportFileResult | null> {
  const relativePath = allocateRelativePath(join("artifacts", sanitizeFileName(source.artifactId)), usedRelativePaths);
  const targetPath = join(outputDirectory, relativePath);
  if (!isPathInsideDir(targetPath, outputDirectory)) return null;
  await mkdir(dirname(targetPath), { recursive: true });
  await cp(source.sourceDirectory, targetPath, { force: true, recursive: true });
  const indexPath = join(targetPath, "index.html");
  return { kind: "artifact", label: source.label, targetPath: (await isFile(indexPath)) ? indexPath : targetPath };
}

/** 导入文件的 markdown 清单（原 `JPe`/`nI`/`XPe`）。 */
export function formatImportedFileList(results: ImportFileResult[]): string | null {
  const deduped: ImportFileResult[] = [];
  const seen = new Set<string>();
  for (const result of results) {
    const key = `${result.kind}\u001f${result.targetPath}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(result);
    }
  }
  const outputs = deduped.filter((result) => result.kind === "output");
  const artifacts = deduped.filter((result) => result.kind === "artifact");
  if (outputs.length === 0 && artifacts.length === 0) return null;
  const formatEntry = (result: ImportFileResult) => `- [${escapeMarkdownLabel(result.label)}](<${result.targetPath}>)`;
  return [
    ...(outputs.length === 0 ? [] : ["Imported Cowork generated files:", ...outputs.map(formatEntry)]),
    ...(artifacts.length === 0 ? [] : [...(outputs.length === 0 ? [] : [""]), "Imported Cowork live artifacts:", ...artifacts.map(formatEntry)]),
  ].join("\n");
}

function escapeMarkdownLabel(label: string): string {
  return label.replaceAll("\\", "\\\\").replaceAll("[", "\\[").replaceAll("]", "\\]");
}

// ---------------------------------------------------------------------------
// 导入计划生成（原 `fPe`/`pPe`/`mPe`/`hPe`/`DF`）
// ---------------------------------------------------------------------------

export interface PlanItem {
  cwd: string | null;
  description: string;
  details: {
    commands: unknown[];
    hooks: unknown[];
    mcpServers: unknown[];
    /** 内部计划为扁平 {name} 形态；detect 线上格式为 {marketplaceName, pluginNames}。 */
    plugins: Array<{ name: string } | { marketplaceName: string; pluginNames: string[] }>;
    sessions: Array<{ cwd: string; path: string; title: string | null; workspaceKind?: string }>;
    skills?: unknown[];
    subagents: unknown[];
  } | null;
  itemType: "CONFIG" | "PLUGINS" | "AGENTS_MD" | "SESSIONS";
  providerId: string;
  sourcePath: string | undefined;
}

function planItem({
  cwd,
  description,
  details = null,
  itemType,
  sourcePath,
}: {
  cwd: string | null;
  description: string;
  details?: PlanItem["details"];
  itemType: PlanItem["itemType"];
  sourcePath?: string;
}): PlanItem {
  return { cwd, description, details, itemType, providerId: COWORK_PROVIDER_ID, sourcePath };
}

/** CONFIG 计划（原 `pPe`）。 */
function configPlanItems(projects: Array<{ accountSetupSelected: boolean; configSurfaces: ConfigSurface[]; project: { accountOrgDir: string } }>, projectlessSpaces: Array<{ accountSetupSelected: boolean; configSurfaces: ConfigSurface[]; projectlessSpace: { accountOrgDir: string } }>): PlanItem[] {
  const dirs = new Set<string>();
  for (const project of projects)
    if (project.accountSetupSelected && project.configSurfaces.length !== 0) dirs.add(project.project.accountOrgDir);
  for (const space of projectlessSpaces)
    if (space.accountSetupSelected && space.configSurfaces.length !== 0) dirs.add(space.projectlessSpace.accountOrgDir);
  return [...dirs]
    .sort((a, b) => a.localeCompare(b))
    .map((dir) => planItem({ cwd: null, description: "Migrate supported Cowork account/org setup", itemType: "CONFIG", sourcePath: dir }));
}

/** PLUGINS 计划（原 `mPe`）。 */
function pluginPlanItems(projects: Array<{ pluginSetupSelected: boolean; pluginCandidates: PluginCandidate[]; project: { accountOrgDir: string } }>, projectlessSpaces: Array<{ pluginSetupSelected: boolean; pluginCandidates: PluginCandidate[]; projectlessSpace: { accountOrgDir: string } }>): PlanItem[] {
  const byOrgDir = new Map<string, PluginCandidate[]>();
  for (const project of projects) {
    if (!project.pluginSetupSelected || project.pluginCandidates.length === 0) continue;
    const existing = byOrgDir.get(project.project.accountOrgDir) ?? [];
    byOrgDir.set(project.project.accountOrgDir, [...existing, ...project.pluginCandidates]);
  }
  for (const space of projectlessSpaces) {
    if (!space.pluginSetupSelected || space.pluginCandidates.length === 0) continue;
    const existing = byOrgDir.get(space.projectlessSpace.accountOrgDir) ?? [];
    byOrgDir.set(space.projectlessSpace.accountOrgDir, [...existing, ...space.pluginCandidates]);
  }
  return [...byOrgDir.entries()]
    .map(([orgDir, candidates]) => {
      const names = new Set<string>();
      for (const candidate of candidates) names.add(candidate.pluginName);
      return planItem({
        cwd: null,
        description: "Install supported Cowork plugins",
        details: {
          commands: [],
          hooks: [],
          mcpServers: [],
          plugins: [...names].sort((a, b) => a.localeCompare(b)).map((name) => ({ name })),
          sessions: [],
          subagents: [],
        },
        itemType: "PLUGINS",
        sourcePath: orgDir,
      });
    })
    .sort((a, b) => (a.sourcePath ?? "").localeCompare(b.sourcePath ?? ""));
}

/** SESSIONS 计划（原 `fPe` 的 transcript 部分）。 */
function sessionPlanItems(projects: Array<{ itemTypes: Set<string>; project: { name: string; sourceRoot: string }; transcriptCandidates: Array<{ projectRoot: string; sourceJsonlPath: string; title: string | null; workspaceKind?: string }> }>, projectlessSpaces: Array<{ transcriptCandidates: Array<{ projectRoot: string; sourceJsonlPath: string; title: string | null; workspaceKind?: string }> }>): PlanItem[] {
  const agentsMdItems = projects.flatMap((project) =>
    project.itemTypes.has("AGENTS_MD")
      ? [planItem({ cwd: project.project.sourceRoot, description: `Append imported Cowork project instructions for ${project.project.name}`, itemType: "AGENTS_MD" })]
      : [],
  );
  const sessions = [
    ...projects.flatMap((project) => project.transcriptCandidates),
    ...projectlessSpaces.flatMap((space) => space.transcriptCandidates),
  ].map((candidate) => ({
    cwd: candidate.projectRoot,
    path: candidate.sourceJsonlPath,
    title: candidate.title,
    ...(candidate.workspaceKind === "projectless" ? { workspaceKind: candidate.workspaceKind } : {}),
  }));
  const description = sessions.length === 1 ? "Import 1 Cowork JSONL transcript" : `Import ${sessions.length} Cowork JSONL transcripts`;
  return [
    ...agentsMdItems,
    ...(sessions.length === 0
      ? []
      : [
          planItem({
            cwd: null,
            description,
            details: { commands: [], hooks: [], mcpServers: [], plugins: [], sessions, subagents: [] },
            itemType: "SESSIONS",
          }),
        ]),
  ];
}

/** 完整导入计划（原 `fPe`）。 */
export function buildImportPlan({
  projectlessSpaces = [],
  projects,
}: {
  projectlessSpaces?: Array<{ accountSetupSelected: boolean; configSurfaces: ConfigSurface[]; pluginSetupSelected: boolean; pluginCandidates: PluginCandidate[]; projectlessSpace: { accountOrgDir: string }; transcriptCandidates: Array<{ projectRoot: string; sourceJsonlPath: string; title: string | null; workspaceKind?: string }> }>;
  projects: Array<{ accountSetupSelected: boolean; configSurfaces: ConfigSurface[]; itemTypes: Set<string>; pluginSetupSelected: boolean; pluginCandidates: PluginCandidate[]; project: { accountOrgDir: string; name: string; sourceRoot: string }; transcriptCandidates: Array<{ projectRoot: string; sourceJsonlPath: string; title: string | null; workspaceKind?: string }> }>;
}): PlanItem[] {
  return [
    ...configPlanItems(projects, projectlessSpaces),
    ...pluginPlanItems(projects, projectlessSpaces),
    ...sessionPlanItems(projects, projectlessSpaces),
  ];
}

/** workspaceRoots 过滤 skipped 项目（原 `hPe`）。 */
export function filterSkippedProjectsByWorkspaceRoots(
  skippedProjects: SkippedProject[],
  workspaceRoots: string[] | null,
): SkippedProject[] {
  return workspaceRoots == null ? skippedProjects : skippedProjects.filter((project) => project.sourceFolders.some((folder) => workspaceRoots.some((root) => pathsEqual(root, folder))));
}

export { SAFETY_LIMITS, HISTORY_LIMIT_WARNING };
