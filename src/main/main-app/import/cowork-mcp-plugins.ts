// Claude Cowork 导入：插件安装 + MCP 配置导入 + AGENTS.md 指令 + 导入编排。
//
// 对应 main-C-Mhak1n.ts 82,970-83,629：
//   - iNe importAccountSetup：编排入口（rollout 导入 + 插件安装 + 账本写入）
//   - oNe importRollouts：并发 ≤5 的线程导入（去重账本 + projectless 登记 +
//     标题设置 + 失败上报 + 临时目录清理）
//   - 插件安装（sNe/cNe/lNe/uNe/dNe）：版本去重合并 → 拷贝插件根（排除
//     mcp.json/mcp-servers.json）→ skills 目录拷贝 → manifest 重写（剥
//     skills/mcpServers 字段 + name/version 覆写）→ config.toml plugins 段启用
//   - 市场注册（nF/hNe/gNe）：扫描插件缓存目录 → 最新版本选择（semver
//     比较 _Ne/iF）→ marketplace.json 写入 → addMarketplace
//   - MCP 配置导入（ENe）：cowork settings（disabledMcpjsonServers）+
//     mcp.json/mcp-servers.json/claude_desktop_config.json 双源合并 →
//     server entry 规范化（command/HTTP 互斥字段剥离 + 路径解析 + env/
//     headers 迁移 + Bearer token 环境变量提取 + 可执行文件存在性校验）→
//     config.toml mcp_servers 段写入
//   - 模型/权限映射（LNe/RNe）：claude-* → gpt-*；acceptEdits →
//     workspace-write
//   - AGENTS.md 指令写入（HNe/_F）：已有导入标记时跳过
import { readFile, writeFile, mkdir, readdir, rm, cp, stat } from "node:fs/promises";
import { join, dirname, basename, relative, isAbsolute, win32, sep, resolve, extname } from "node:path";
import {
  wf as objectSchema,
  Of as stringSchema,
  xf as looseObjectSchema,
  Ef as recordSchema,
  Mf as jsonSchema,
} from "@chunk/shared";
import {
  COWORK_PROVIDER_ID,
  LOCAL_PLUGIN_SOURCE,
  SKILLS_DIRNAME,
  IMPORTED_INSTRUCTIONS_HEADER,
  MCP_CONFIG_FILENAMES,
  SEMVER_PATTERN,
  pluginManifestSchema,
  mcpServersFileSchema,
  pluginListSchema,
  isPlainObject,
  nonEmptyString,
  errorMessage,
  readJsonFile,
  readTextFile,
  writeTextFile,
  isFile,
  pathExists,
  readImportHistory,
  readCodexConfigToml,
  writeCodexConfigToml,
  recordImportedTranscripts,
  recordAccountSetupItems,
  recordImportedProjects,
  recordConnectorCandidates,
  normalizeName,
  pathsEqual,
  filterExisting,
  readCoworkSettings,
  readMcpServerConfigs,
} from "./cowork-history";
import { scanProjectlessSpace } from "./cowork-discovery";
import type { ProjectImportSelection, TranscriptCandidate } from "./cowork-transcripts";
import { stringifyToml } from "../misc/env-toml-stringifier";

// ---------------------------------------------------------------------------
// 路径工具（原 `oF`/`sF`/`cF`/`gP`）
// ---------------------------------------------------------------------------

/** 宿主路径映射（原 `oF`：callbacks.pathForCodexHost）。 */
function hostPath(callbacks: { pathForCodexHost?(path: string): string }, path: string): string {
  return callbacks.pathForCodexHost?.(path) ?? path;
}

/** 候选目录的从属判定（原 `gP`：userDataDir 在 accountOrgDir 之下）。 */
function isPathInsideDir(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}

// ---------------------------------------------------------------------------
// MCP server entry 规范化（原 `ANe`~`BNe`）
// ---------------------------------------------------------------------------

/** 允许的运行时解释器（原 `CNe`）。 */
const ALLOWED_RUNTIMES = new Set([
  "bash", "bun", "deno", "node", "perl", "php", "python", "python3", "ruby", "sh", "tsx", "zsh",
]);
const ENV_VAR_PATTERN = /^\$\{([A-Za-z_][A-Za-z0-9_]*)\}$/;
const BEARER_ENV_PATTERN = /^Bearer\s+\$\{([A-Za-z_][A-Za-z0-9_]*)\}$/;

/** entry 规范化（原 `ANe`）：相对路径解析（command/args）。 */
function normalizeServerEntry(entry: { config: Record<string, unknown>; sourcePath: string }): Record<string, unknown> {
  const { config } = entry;
  const command = typeof config.command == "string" ? config.command.trim() : undefined;
  if (command == null || command === "") return config;
  const sourceDir = dirname(entry.sourcePath);
  const resolvedCommand = resolveConfigPath(sourceDir, command);
  const resolvedArgs = resolveConfigArgs(config.args as string[] | undefined, sourceDir);
  return resolvedCommand == null
    ? !isRuntimeCommand(command) || resolvedArgs === config.args
      ? config
      : { ...config, args: resolvedArgs }
    : resolvedArgs === config.args
      ? { ...config, command: resolvedCommand }
      : { ...config, args: resolvedArgs, command: resolvedCommand };
}

/** 可执行文件探测（原 `jNe`）：command 或首个 ./ 路径 arg。 */
function findExecutablePath(entry: { config: Record<string, unknown>; sourcePath: string }): string | null {
  const command = typeof entry.config.command == "string" ? entry.config.command.trim() : undefined;
  if (command == null || command === "") return null;
  const sourceDir = dirname(entry.sourcePath);
  const resolved = resolveConfigPath(sourceDir, command);
  if (resolved != null) return resolved;
  if (!isRuntimeCommand(command)) return null;
  const scriptArg = (entry.config.args as string[] | undefined)?.find(isRelativePath) ?? null;
  return scriptArg == null ? null : resolveConfigPath(sourceDir, scriptArg);
}

function resolveConfigArgs(args: string[] | undefined, sourceDir: string): string[] | undefined {
  if (args == null) return undefined;
  let changed = false;
  const resolved = args.map((arg) => {
    const path = resolveConfigPath(sourceDir, arg);
    return path == null ? arg : ((changed = true), path);
  });
  return changed ? resolved : args;
}

/** 配置路径解析（原 `pF`）：绝对或相对路径，win32 绝对跨平台拒绝。 */
function resolveConfigPath(sourceDir: string, value: string): string | null {
  if (!isConfigPathLike(value)) return null;
  const normalized = value.replaceAll("\\", sep);
  return win32.isAbsolute(value) && !isAbsolute(value)
    ? null
    : isAbsolute(normalized)
      ? normalized
      : resolve(sourceDir, normalized);
}

function isConfigPathLike(value: string): boolean {
  return isAbsolute(value) || win32.isAbsolute(value) || isRelativePath(value);
}

function isRelativePath(value: string): boolean {
  return value.startsWith("./") || value.startsWith("../") || value.startsWith(".\\") || value.startsWith("..\\");
}

/** 运行时解释器判定（原 `hF`：剥 .bat/.cmd/.exe 后缀）。 */
function isRuntimeCommand(command: string): boolean {
  const name = basename(command).replace(/\.(?:bat|cmd|exe)$/i, "").toLowerCase();
  return ALLOWED_RUNTIMES.has(name);
}

/** HTTP headers 迁移（原 `PNe`）：Bearer → bearer_token_env_var；${VAR} → env_http_headers。 */
function migrateHttpHeaders(target: Record<string, unknown>, headers: Record<string, unknown> | undefined): void {
  if (headers == null) return;
  const plainHeaders: Record<string, string> = {};
  const envHeaders: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    const text = String(value);
    const bearerVar = matchBearerEnv(text);
    if (name.toLowerCase() === "authorization" && bearerVar != null) {
      target.bearer_token_env_var = bearerVar;
      continue;
    }
    const envVar = matchEnvVar(text);
    if (envVar != null) {
      envHeaders[name] = envVar;
      continue;
    }
    plainHeaders[name] = text;
  }
  if (Object.keys(plainHeaders).length > 0) target.http_headers = plainHeaders;
  if (Object.keys(envHeaders).length > 0) target.env_http_headers = envHeaders;
}

/** env 迁移（原 `FNe`）：${SELF} 自引用 → env_vars 列表。 */
function migrateEnvVars(target: Record<string, unknown>, env: Record<string, unknown> | undefined): void {
  if (env == null) return;
  const plainEnv: Record<string, string> = {};
  const selfVars: string[] = [];
  for (const [name, value] of Object.entries(env)) {
    const text = String(value);
    if (matchEnvVar(text) === name) {
      selfVars.push(name);
      continue;
    }
    plainEnv[name] = text;
  }
  if (selfVars.length > 0) target.env_vars = selfVars;
  if (Object.keys(plainEnv).length > 0) target.env = plainEnv;
}

/** server entry → codex mcp_servers 条目（原 `ONe`）：command/HTTP 互斥 + 字段剥离。 */
function buildCodexServerEntry({ serverEntry, serverName, warnings }: { serverEntry: { config: Record<string, unknown>; sourcePath: string }; serverName: string; warnings: string[] }): Record<string, unknown> | null {
  const normalized = normalizeServerEntry(serverEntry);
  const entry: Record<string, unknown> = { enabled: true };
  const command = typeof normalized.command == "string" ? normalized.command.trim() : undefined;
  const url = typeof normalized.url == "string" ? normalized.url.trim() : undefined;
  const type = typeof normalized.type == "string" ? normalized.type : undefined;
  const ignoredFields: string[] = [];
  let transport: string;

  if (command != null && command !== "") {
    if (type != null && type !== "stdio") {
      warnings.push(`Cowork MCP server ${serverName} skipped because command transport is incompatible with type ${type}`);
      return null;
    }
    entry.command = command;
    const args = normalized.args as string[] | undefined;
    if (args != null && args.length > 0) entry.args = args;
    migrateEnvVars(entry, normalized.env as Record<string, unknown> | undefined);
    const headers = normalized.headers as Record<string, unknown> | undefined;
    if (headers != null && Object.keys(headers).length > 0) ignoredFields.push("headers");
    if (url != null && url !== "") ignoredFields.push("url");
    transport = "command";
  } else if (url != null && url !== "") {
    if (type != null && type !== "http" && type !== "streamable_http" && type !== "streamable-http") {
      warnings.push(`Cowork MCP server ${serverName} skipped because HTTP transport is incompatible with type ${type}`);
      return null;
    }
    entry.url = url;
    migrateHttpHeaders(entry, normalized.headers as Record<string, unknown> | undefined);
    const args = normalized.args as string[] | undefined;
    if (args != null && args.length > 0) ignoredFields.push("args");
    const env = normalized.env as Record<string, unknown> | undefined;
    if (env != null && Object.keys(env).length > 0) ignoredFields.push("env");
    transport = "HTTP";
  } else {
    warnings.push(`Cowork MCP server ${serverName} skipped because it has no command or URL`);
    return null;
  }
  if (ignoredFields.length > 0)
    warnings.push(`Cowork MCP server ${serverName} ignored fields incompatible with ${transport} transport: ${ignoredFields.join(", ")}`);
  const unsupported = findUnsupportedFields(normalized);
  if (unsupported.length > 0)
    warnings.push(`Cowork MCP server ${serverName} has unsupported fields: ${unsupported.join(", ")}`);
  return entry;
}

/** 可执行文件校验（原 `kNe`）：缺失时记 warning（不阻断）。 */
async function warnMissingExecutables({ servers, warnings }: { servers: Map<string, { config: Record<string, unknown>; sourcePath: string }>; warnings: string[] }): Promise<void> {
  const checked = await Promise.all(
    [...servers.entries()].map(async ([name, entry]) => {
      const executablePath = findExecutablePath(entry);
      return executablePath == null || (await isFile(executablePath)) ? null : { executablePath, serverName: name };
    }),
  );
  for (const result of checked) {
    if (result == null) continue;
    const warning = `Cowork MCP server ${result.serverName} config migrated, but executable not found: ${result.executablePath}`;
    if (!warnings.includes(warning)) warnings.push(warning);
  }
}

function findUnsupportedFields(config: Record<string, unknown>): string[] {
  const known = new Set(["args", "command", "disabled", "enabled", "env", "headers", "name", "scope", "type", "url"]);
  return Object.keys(config).filter((key) => !known.has(key)).sort();
}

function matchEnvVar(value: string): string | null {
  return ENV_VAR_PATTERN.exec(value)?.[1] ?? null;
}

function matchBearerEnv(value: string): string | null {
  return BEARER_ENV_PATTERN.exec(value)?.[1] ?? null;
}

// ---------------------------------------------------------------------------
// 模型/权限映射 + 顶层 config 段（原 `LNe`/`RNe`/`DNe`/`BNe`）
// ---------------------------------------------------------------------------

/** claude 模型名映射（原 `LNe`）。 */
function mapClaudeModel(model: string): string {
  return model.startsWith("claude-opus")
    ? "gpt-5.6-terra"
    : model.startsWith("claude-sonnet") || model.startsWith("claude-haiku")
      ? "gpt-5.6-luna"
      : model;
}

/** 权限模式映射（原 `RNe`）。 */
function mapPermissionMode(mode: string): "workspace-write" | "read-only" | null {
  return mode === "acceptEdits" ? "workspace-write" : mode === "readOnly" ? "read-only" : null;
}

/** 顶层 config 键值映射（原 `DNe`）：model + sandbox_mode。 */
function buildTopLevelConfig(settings: Record<string, unknown>): Record<string, unknown> {
  const config: Record<string, unknown> = {};
  const model = nonEmptyString(settings.model);
  if (model != null) config.model = mapClaudeModel(model);
  const sandboxMode = mapPermissionMode(nonEmptyString(settings.permissionMode) ?? "");
  if (sandboxMode != null) config.sandbox_mode = sandboxMode;
  return config;
}

/** config 段获取或创建（原 `BNe`）。 */
function ensureConfigSection(config: Record<string, unknown>, section: string): Record<string, unknown> {
  const existing = config[section];
  if (isPlainObject(existing)) return existing;
  const created: Record<string, unknown> = {};
  config[section] = created;
  return created;
}

// ---------------------------------------------------------------------------
// MCP 配置导入入口（原 `ENe`）
// ---------------------------------------------------------------------------

export interface McpImportResult {
  importedMcpServerNames: string[];
  liveConfigPaths: string[];
}

/** MCP 配置导入（原 `ENe`）：settings + 双源 servers → config.toml。 */
async function importMcpConfig({ codexHome, copiedFiles, projectImport }: { codexHome: string; copiedFiles: string[]; projectImport: ProjectImport }): Promise<McpImportResult> {
  const settings = await readCoworkSettings(projectImport.project.accountOrgDirs, projectImport.warnings);
  const servers = await readMcpServerConfigs(projectImport.project, projectImport.warnings, settings);
  const topLevelConfig = buildTopLevelConfig(settings);
  if (servers.size === 0 && Object.keys(topLevelConfig).length === 0)
    return { importedMcpServerNames: [], liveConfigPaths: [] };
  await warnMissingExecutables({ servers, warnings: projectImport.warnings });
  const configPath = join(codexHome, "config.toml");
  const config = await readCodexConfigToml(configPath, projectImport.warnings);
  if (config == null) return { importedMcpServerNames: [], liveConfigPaths: [] };
  let changed = false;
  const importedServerNames: string[] = [];
  for (const [key, value] of Object.entries(topLevelConfig))
    if (config[key] == null) {
      config[key] = value;
      changed = true;
    }
  if (servers.size > 0) {
    const mcpServers = ensureConfigSection(config, "mcp_servers");
    for (const [name, entry] of [...servers.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      if (mcpServers[name] != null) continue;
      const built = buildCodexServerEntry({ serverEntry: entry, serverName: name, warnings: projectImport.warnings });
      if (built != null) {
        mcpServers[name] = built;
        importedServerNames.push(name);
        changed = true;
      }
    }
  }
  return changed
    ? (await writeCodexConfigToml(configPath, config), copiedFiles.push(configPath), { importedMcpServerNames: importedServerNames, liveConfigPaths: [configPath] })
    : { importedMcpServerNames: importedServerNames, liveConfigPaths: [] };
}

// ---------------------------------------------------------------------------
// AGENTS.md 指令写入（原 `HNe`/`_F`）
// ---------------------------------------------------------------------------

const MIGRATION_HEADER = "## Claude Cowork Migration";

/** 已含标记判定（原 `_F`）。 */
function textContainsHeader(text: string | null, header: string): boolean {
  return text != null && text.includes(header);
}

/** AGENTS.md 追加导入指令（原 `HNe`）：已有标记时跳过。 */
async function appendImportedInstructions({ projectImport }: { projectImport: ProjectImport }): Promise<string | null> {
  const agentsPath = join(projectImport.project.sourceRoot, "AGENTS.md");
  const existing = await readTextFile(agentsPath);
  if (textContainsHeader(existing, IMPORTED_INSTRUCTIONS_HEADER) || textContainsHeader(existing, MIGRATION_HEADER)) return null;
  const instructions = projectImport.project.instructions;
  const body = instructions == null || instructions.trim() === "" ? null : instructions.trim();
  const header = body == null ? IMPORTED_INSTRUCTIONS_HEADER : [IMPORTED_INSTRUCTIONS_HEADER, "", body].join("\n");
  let separator = "\n\n";
  if (existing == null || existing === "" || existing.endsWith("\n\n")) separator = "";
  else if (existing.endsWith("\n")) separator = "\n";
  const content = `${existing ?? ""}${separator}${header}\n`;
  await writeTextFile(agentsPath, content);
  return agentsPath;
}

// ---------------------------------------------------------------------------
// 插件安装（原 `sNe`~`mNe`）
// ---------------------------------------------------------------------------

export interface PluginImport {
  pluginName: string;
  pluginRoot: string;
  manifestPath: string;
  skillPaths: string[];
  version?: string;
  accountOrgDir: string;
}

/** 同名同版本合并（原 `cNe`）：skillPaths 去重。 */
function dedupePluginImports(imports: PluginImport[]): PluginImport[] {
  const byKey = new Map<string, PluginImport>();
  for (const pluginImport of imports) {
    const version = pluginImport.version ?? LOCAL_PLUGIN_SOURCE;
    const key = [COWORK_PROVIDER_ID, pluginImport.pluginName, version].join("");
    const existing = byKey.get(key);
    if (existing == null) {
      byKey.set(key, { ...pluginImport, skillPaths: [...pluginImport.skillPaths] });
      continue;
    }
    const skillByKey = new Map(existing.skillPaths.map((path) => [skillDirKey(path), path]));
    for (const path of pluginImport.skillPaths) {
      const dirKey = skillDirKey(path);
      if (!skillByKey.has(dirKey)) skillByKey.set(dirKey, path);
    }
    existing.skillPaths = [...skillByKey.values()];
  }
  return [...byKey.values()];
}

function skillDirKey(skillPath: string): string {
  const sanitized = sanitizeSkillDirName(dirname(skillPath));
  return process.platform === "win32" ? sanitized.toLowerCase() : sanitized;
}

/** skill 目录名清洗（原 `aF`：非字母数字 → 短横线）。 */
function sanitizeSkillDirName(dir: string): string {
  return basename(dir).replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "cowork-skill";
}

/** 单插件安装（原 `lNe`）：拷贝 + skills + manifest 重写。 */
async function installPlugin({ codexHome, pluginImport }: { codexHome: string; pluginImport: PluginImport }): Promise<void> {
  const version = pluginImport.version ?? LOCAL_PLUGIN_SOURCE;
  const targetRoot = join(codexHome, "plugins", "cache", COWORK_PROVIDER_ID, pluginImport.pluginName, version);
  await rm(targetRoot, { force: true, recursive: true });
  await mkdir(dirname(targetRoot), { recursive: true });
  await cp(pluginImport.pluginRoot, targetRoot, { filter: skipMcpConfigFiles, recursive: true });
  await copySkillDirectories({ pluginImport, targetRoot });
  await rewritePluginManifest({ pluginImport, targetRoot, version });
}

/** skills 目录拷贝（原 `uNe`）：skills/ 下的目录平铺到 target/skills/<清洗名>。 */
async function copySkillDirectories({ pluginImport, targetRoot }: { pluginImport: PluginImport; targetRoot: string }): Promise<void> {
  await Promise.all(
    pluginImport.skillPaths.map(async (skillPath) => {
      // skills/ 内部的目录已随插件根拷贝，跳过。
      if (relative(pluginImport.pluginRoot, skillPath).split(sep)[0] === SKILLS_DIRNAME) return;
      const sourceDir = dirname(skillPath);
      const targetDir = join(targetRoot, SKILLS_DIRNAME, sanitizeSkillDirName(sourceDir));
      await rm(targetDir, { force: true, recursive: true });
      await mkdir(dirname(targetDir), { recursive: true });
      await cp(sourceDir, targetDir, { recursive: true });
    }),
  );
}

/** manifest 重写（原 `dNe`）：剥 skills/mcpServers + name/version 覆写。 */
async function rewritePluginManifest({ pluginImport, targetRoot, version }: { pluginImport: PluginImport; targetRoot: string; version: string }): Promise<void> {
  const manifest = await readPluginManifest(pluginImport.manifestPath);
  delete (manifest as Record<string, unknown>).skills;
  delete (manifest as Record<string, unknown>).mcpServers;
  delete (manifest as Record<string, unknown>).mcp_servers;
  const manifestPath = join(targetRoot, ".codex-plugin", "plugin.json");
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify({ ...manifest, name: pluginImport.pluginName, version }, null, 2)}\n`, "utf8");
}

function skipMcpConfigFiles(path: string): boolean {
  return !MCP_CONFIG_FILENAMES.has(basename(path));
}

async function readPluginManifest(manifestPath: string): Promise<Record<string, unknown>> {
  const text = await readFile(manifestPath, "utf8").catch(() => "{}");
  try {
    const parsed = (pluginManifestSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: Record<string, unknown> } }).safeParse(JSON.parse(text));
    return parsed.success ? (parsed.data ?? {}) : {};
  } catch {
    return {};
  }
}

/** config.toml 启用插件（原 `mNe`）：plugins 段 enabled: true。 */
async function enablePluginsInConfig({ codexHome, pluginImports }: { codexHome: string; pluginImports: PluginImport[] }): Promise<void> {
  if (pluginImports.length === 0) return;
  const configPath = join(codexHome, "config.toml");
  const config = await readCodexConfigToml(configPath, []);
  if (config == null) throw new Error("Could not read Codex plugin config");
  const plugins = ensureConfigSection(config, "plugins");
  let changed = false;
  for (const pluginImport of pluginImports) {
    const key = `${pluginImport.pluginName}@${COWORK_PROVIDER_ID}`;
    const existing = plugins[key];
    if (isPlainObject(existing) && existing.enabled === true) continue;
    plugins[key] = { ...(isPlainObject(existing) ? existing : {}), enabled: true };
    changed = true;
  }
  if (changed) await writeCodexConfigToml(configPath, config);
}

// ---------------------------------------------------------------------------
// 市场注册（原 `nF`/`hNe`/`gNe`）
// ---------------------------------------------------------------------------

/** 插件缓存根（原 `rF`）。 */
function pluginCacheRoot(codexHome: string): string {
  return join(codexHome, "plugins", "cache", COWORK_PROVIDER_ID);
}

/** 扫描已安装插件（原 `gNe`）：每个插件名取最新版本。 */
async function listInstalledPlugins(codexHome: string): Promise<Array<{ name: string; source: { path: string; source: string } }>> {
  const cacheRoot = pluginCacheRoot(codexHome);
  const entries = await readdir(cacheRoot, { withFileTypes: true }).catch(() => []);
  return (
    await Promise.all(
      entries
        .filter((entry) => entry.isDirectory() && entry.name !== ".agents")
        .map(async (entry) => {
          const pluginDir = join(cacheRoot, entry.name);
          const versions = (
            await Promise.all(
              (await readdir(pluginDir, { withFileTypes: true }).catch(() => []))
                .filter((version) => version.isDirectory())
                .map(async (version) =>
                  (await readFile(join(pluginDir, version.name, ".codex-plugin", "plugin.json"), "utf8").catch(() => null)) == null
                    ? null
                    : version.name,
                ),
            )
          ).filter((version): version is string => version != null);
          versions.sort(compareSemver);
          const latest = versions[versions.length - 1];
          return latest == null
            ? null
            : { name: entry.name, source: { path: [".", entry.name, latest].join("/"), source: "local" } };
        }),
    )
  )
    .filter((plugin): plugin is { name: string; source: { path: string; source: string } } => plugin != null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** semver 比较（原 `_Ne`/`iF`：mainline 逐段 + prerelease 数字优先）。 */
function compareSemver(a: string, b: string): number {
  const parsedA = parseSemver(a);
  const parsedB = parseSemver(b);
  if (parsedA == null || parsedB == null)
    return parsedA == null ? (parsedB == null ? a.localeCompare(b, undefined, { numeric: true }) : -1) : 1;
  for (let i = 0; i < 3; i++) {
    if (parsedA.mainline[i] !== parsedB.mainline[i]) return parsedA.mainline[i] < parsedB.mainline[i] ? -1 : 1;
  }
  if (parsedA.prerelease.length === 0) return parsedB.prerelease.length === 0 ? 0 : 1;
  if (parsedB.prerelease.length === 0) return -1;
  const length = Math.max(parsedA.prerelease.length, parsedB.prerelease.length);
  for (let i = 0; i < length; i++) {
    const partA = parsedA.prerelease[i];
    const partB = parsedB.prerelease[i];
    if (partA == null || partB == null) return partA == null ? -1 : 1;
    if (partA === partB) continue;
    const numA = Number.parseInt(partA, 10);
    const numB = Number.parseInt(partB, 10);
    const aIsNumeric = String(numA) === partA;
    const bIsNumeric = String(numB) === partB;
    return aIsNumeric && bIsNumeric ? (numA < numB ? -1 : 1) : aIsNumeric === bIsNumeric ? partA.localeCompare(partB) : aIsNumeric ? -1 : 1;
  }
  return 0;
}

function parseSemver(version: string): { mainline: number[]; prerelease: string[] } | null {
  const match = SEMVER_PATTERN.exec(version);
  return match == null
    ? null
    : { mainline: [Number(match[1]), Number(match[2]), Number(match[3])], prerelease: match[4]?.split(".") ?? [] };
}

/** marketplace.json 写入（原 `hNe`）。 */
async function writeMarketplaceManifest({ codexHome, plugins }: { codexHome: string; plugins: Array<{ name: string; source: unknown }> }): Promise<string> {
  const cacheRoot = pluginCacheRoot(codexHome);
  const manifestPath = join(cacheRoot, ".agents", "plugins", "marketplace.json");
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify({ name: COWORK_PROVIDER_ID, plugins: [...plugins].sort((a, b) => a.name.localeCompare(b.name)) }, null, 2)}\n`, "utf8");
  return cacheRoot;
}

/** 市场注册（原 `nF`）：扫描 → 写 manifest → addMarketplace。 */
async function registerPluginMarketplace({ callbacks, codexHome }: { callbacks: Pick<ImportCallbacks, "addMarketplace" | "pathForCodexHost">; codexHome: string }): Promise<void> {
  const plugins = await listInstalledPlugins(codexHome);
  if (plugins.length === 0) return;
  const marketplaceRoot = await writeMarketplaceManifest({ codexHome, plugins });
  await callbacks.addMarketplace({ source: hostPath(callbacks, marketplaceRoot) });
}

/** 插件安装编排（原 `sNe`）。 */
async function importPlugins({ callbacks, codexHome, pluginImports }: { callbacks: ImportCallbacks; codexHome: string; pluginImports: PluginImport[] }): Promise<void> {
  const deduped = dedupePluginImports(pluginImports);
  if (deduped.length === 0) return;
  await Promise.all(deduped.map((pluginImport) => installPlugin({ codexHome, pluginImport })));
  await registerPluginMarketplace({ callbacks, codexHome });
  await enablePluginsInConfig({ codexHome, pluginImports: deduped });
}

// ---------------------------------------------------------------------------
// 导入编排（原 `iNe`/`oNe`）
// ---------------------------------------------------------------------------

export interface ImportCallbacks {
  forkThread(request: { cwd: string; ephemeral: boolean; path: string; threadId: string }): Promise<{ ephemeral: boolean; threadId: string }>;
  addMarketplace(request: { source: string }): Promise<unknown>;
  setThreadName?(request: { name: string; threadId: string }): Promise<void>;
  recordProjectlessThread?(request: { outputDirectory: string; threadId: string; workspaceRoot: string }): Promise<void>;
  reportSessionImportError?(report: { error: unknown; session: PreparedRollout | TranscriptCandidate }): void;
  pathForCodexHost?(path: string): string;
  createProjectlessThreadPaths?(candidate: { title: string | null }): Promise<{ cwd: string; outputDirectory: string; workspaceRoot: string }>;
}

export interface PreparedRollout {
  projectRoot: string;
  sourceId: string;
  contentSha256: string;
  sourceThreadId: string;
  sourceJsonlPath: string;
  rolloutRoot: string;
  rolloutPath: string;
  cwd: string;
  title?: string | null;
  workspaceKind?: string;
  projectlessOutputDirectory?: string | null;
  projectlessWorkspaceRoot?: string | null;
  remoteMcpServerNames: string[];
  lastActivityAtMs: number | null;
}

export interface ProjectImport {
  project: {
    sourceRoot: string;
    accountOrgDirs: string[];
    userDataDirs: string[];
    instructions?: string | null;
  };
  warnings: string[];
}

export interface MigrationInput {
  preparedRollouts: PreparedRollout[];
  projectsToRecord: Array<{ sourceRoot: string; spaceId: string }>;
  accountSetupItemsToRecord: Array<{ accountOrgDir: string; itemType: "CONFIG" | "PLUGINS" }>;
}

/** rollout 去重键（原 `yNe`/`bNe`/`xNe`）。 */
const claimedRolloutKeys = new Set<string>();

function claimRolloutKey(codexHome: string, rollout: PreparedRollout): string | null {
  const key = [codexHome, rollout.projectRoot, rollout.sourceId].join("");
  if (claimedRolloutKeys.has(key)) return null;
  claimedRolloutKeys.add(key);
  return key;
}

function releaseRolloutKeys(keys: string[]): void {
  for (const key of keys) claimedRolloutKeys.delete(key);
}

/** rollout 导入（原 `oNe`）：并发 ≤5 + 去重 + projectless 登记 + 标题 + 清理。 */
async function importRollouts({ callbacks, claimedKeys, codexHome, preparedRollouts }: { callbacks: ImportCallbacks; claimedKeys: string[]; codexHome: string; preparedRollouts: PreparedRollout[] }): Promise<Array<{ importedThreadId: string; rollout: PreparedRollout }>> {
  if (preparedRollouts.length === 0) return [];
  const inFlight = new Set<Promise<void>>();
  const settled = await Promise.allSettled(
    preparedRollouts.map(async (rollout) => {
      for (; inFlight.size >= 5; ) await Promise.race(inFlight);
      let release: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      inFlight.add(gate);
      const key = claimRolloutKey(codexHome, rollout);
      if (key != null) claimedKeys.push(key);
      try {
        if (
          key == null ||
          (await readImportHistory(codexHome)).records.some(
            (record) => pathsEqual(record.projectRoot, rollout.projectRoot) && record.sourceId === rollout.sourceId,
          )
        )
          return { importedRollout: null };
        const thread = await callbacks.forkThread({
          cwd: hostPath(callbacks, rollout.cwd),
          ephemeral: false,
          path: hostPath(callbacks, rollout.rolloutPath),
          threadId: rollout.sourceThreadId,
        });
        if (thread.ephemeral) throw new Error("Cowork import created an ephemeral thread");
        const imported: { importedThreadId: string; rollout: PreparedRollout } = { importedThreadId: thread.threadId, rollout };
        if (rollout.workspaceKind === "projectless" && rollout.projectlessOutputDirectory != null && rollout.projectlessWorkspaceRoot != null) {
          try {
            await callbacks.recordProjectlessThread?.({
              outputDirectory: hostPath(callbacks, rollout.projectlessOutputDirectory),
              threadId: thread.threadId,
              workspaceRoot: hostPath(callbacks, rollout.projectlessWorkspaceRoot),
            });
          } catch (error) {
            callbacks.reportSessionImportError?.({ error, session: rollout });
            return { error, importedRollout: imported };
          }
        }
        try {
          if (rollout.title != null && rollout.title !== "")
            await callbacks.setThreadName?.({ name: rollout.title, threadId: thread.threadId });
        } catch (error) {
          callbacks.reportSessionImportError?.({ error, session: rollout });
          return { error, importedRollout: imported };
        }
        return { importedRollout: imported };
      } catch (error) {
        callbacks.reportSessionImportError?.({ error, session: rollout });
        throw error;
      } finally {
        await rm(rollout.rolloutRoot, { force: true, recursive: true })
          .catch((error) => {
            callbacks.reportSessionImportError?.({ error, session: rollout });
            throw error;
          })
          .finally(() => {
            inFlight.delete(gate);
            release?.();
          });
      }
    }),
  );
  const fulfilled = settled.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
  const imported = fulfilled.flatMap((result) => (result.importedRollout == null ? [] : [result.importedRollout]));
  await recordImportedTranscripts({
    codexHome,
    transcripts: imported.map(({ importedThreadId, rollout }) => ({ importedThreadId, transcript: rollout as never })),
  });
  await recordConnectorCandidates({ candidates: buildConnectorCandidates(imported.map(({ rollout }) => rollout)), codexHome });
  const rejected = settled.find((result) => result.status === "rejected");
  if (rejected?.status === "rejected") throw rejected.reason;
  const errored = fulfilled.find((result) => result.error != null);
  if (errored?.error != null) throw errored.error;
  return imported;
}

/** connector 候选（原 `DMe`：remoteMcpServerNames 合并计数）。 */
function buildConnectorCandidates(rollouts: PreparedRollout[]): Array<{ importedAtMs: number; lastSeenAtMs: number | null; name: string; sessionCount: number; source: "remoteMcpServersConfig" }> {
  const byName = new Map<string, { lastSeenAtMs: number | null; name: string; sessionCount: number }>();
  for (const rollout of rollouts) {
    const names = new Map<string, string>();
    for (const rawName of rollout.remoteMcpServerNames) {
      const trimmed = rawName.trim();
      if (trimmed.length === 0) continue;
      const key = normalizeName(trimmed);
      if (!names.has(key)) names.set(key, trimmed);
    }
    for (const [key, displayName] of names) {
      const existing = byName.get(key);
      byName.set(key, {
        lastSeenAtMs:
          existing?.lastSeenAtMs == null
            ? rollout.lastActivityAtMs
            : rollout.lastActivityAtMs == null
              ? existing.lastSeenAtMs
              : Math.max(existing.lastSeenAtMs, rollout.lastActivityAtMs),
        name: existing?.name ?? displayName,
        sessionCount: (existing?.sessionCount ?? 0) + 1,
      });
    }
  }
  return [...byName.values()]
    .map((candidate) => ({ ...candidate, importedAtMs: Date.now(), source: "remoteMcpServersConfig" as const }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** 插件导入的账本条目（原 `aNe`）。 */
function pluginAccountSetupItems(pluginImports: PluginImport[]): Array<{ accountOrgDir: string; itemType: "PLUGINS" }> {
  return [...new Set(pluginImports.map((pluginImport) => pluginImport.accountOrgDir))].map((accountOrgDir) => ({
    accountOrgDir,
    itemType: "PLUGINS",
  }));
}

/** 导入编排入口（原 `iNe`）。 */
async function importAccountSetup({ callbacks, codexHome, migration, pluginImports = [] }: { callbacks: ImportCallbacks; codexHome: string; migration: MigrationInput; pluginImports?: PluginImport[] }): Promise<{ importedRollouts: Array<{ importedThreadId: string; rollout: PreparedRollout }> }> {
  const claimedKeys: string[] = [];
  try {
    const importedRollouts = await importRollouts({ callbacks, claimedKeys, codexHome, preparedRollouts: migration.preparedRollouts });
    await importPlugins({ callbacks, codexHome, pluginImports });
    await recordAccountSetupItems({ codexHome, items: [...migration.accountSetupItemsToRecord, ...pluginAccountSetupItems(pluginImports)] });
    await recordImportedProjects({ codexHome, projects: migration.projectsToRecord });
    return { importedRollouts };
  } finally {
    releaseRolloutKeys(claimedKeys);
  }
}

// ---------------------------------------------------------------------------
// 账号级 skills/agents 迁移（原 `aPe`/`oPe`/`sPe`/`cPe`/`SF`/`CF`/`lPe`）
// ---------------------------------------------------------------------------

/** 账号条目名清洗（原 `vF`）。 */
function sanitizeAccountItemName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "cowork-item"
  );
}

/** skill markdown 缺 frontmatter 时补写（原 `sPe`/`cPe`）。 */
function ensureSkillFrontmatter({ content, name }: { content: string; name: string }): string {
  const frontmatter = /^---\n([\s\S]*?)\n---\n?/.exec(content);
  if (frontmatter != null && /\bname\s*:/.test(frontmatter[1]) && /\bdescription\s*:/.test(frontmatter[1])) return content;
  return [
    "---",
    `name: ${JSON.stringify(name)}`,
    `description: ${JSON.stringify(`Migrated Claude Cowork skill ${name}.`)}`,
    "---",
    "",
    content.trim(),
    "",
  ].join("\n");
}

/** org 目录下 <key>/*.md 收集（原 `CF`）：文件名（win32 小写）去重。 */
async function collectAccountMarkdown(accountOrgDirs: string[], key: string): Promise<string[]> {
  const scanned = await Promise.all(
    accountOrgDirs.map(async (orgDir) => ({
      entries: await readdir(join(orgDir, key), { withFileTypes: true }).catch(() => []),
      root: orgDir,
    })),
  );
  const byName = new Map<string, string>();
  for (const { entries, root } of scanned) {
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const nameKey = process.platform === "win32" ? entry.name.toLowerCase() : entry.name;
      if (entry.isFile() && entry.name.endsWith(".md") && !byName.has(nameKey)) byName.set(nameKey, join(root, key, entry.name));
    }
  }
  return [...byName.values()];
}

/** skills.json/agents.json 名称索引（原 `SF`）：name/id → 显示名，单条目时提供 fallback。 */
async function readAccountNameIndex(accountOrgDirs: string[], count: number, key: string): Promise<Map<string, string>> {
  const lists = await Promise.all(accountOrgDirs.map((orgDir) => readJsonFile(join(orgDir, `${key}.json`), pluginListSchema as never)));
  const entries = lists.flatMap((list) =>
    list == null ? [] : Array.isArray(list) ? list : (((list as Record<string, unknown>)[key] as unknown[] | undefined) ?? []),
  );
  const index = new Map<string, string>();
  for (const entry of entries) {
    if (!isPlainObject(entry)) continue;
    const displayName = (entry.name as string | undefined) ?? (entry.id as string | undefined);
    if (displayName == null) continue;
    const pathValue = nonEmptyString(entry.path);
    const nameKey = pathValue == null ? sanitizeAccountItemName(displayName) : basename(pathValue, extname(pathValue));
    if (!index.has(nameKey)) index.set(nameKey, displayName);
  }
  if (entries.length === 1 && count === 1) {
    const [only] = entries;
    if (isPlainObject(only)) {
      const displayName = (only.name as string | undefined) ?? (only.id as string | undefined);
      if (displayName != null) index.set("fallback", displayName);
    }
  }
  return index;
}

/** agent 显示名兜底（原 `lPe`）：分隔符切段首字母大写。 */
function titleCaseAgentName(name: string): string {
  const title = name
    .split(/[-_]+/g)
    .filter((part) => part !== "")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
  return title === "" ? "Cowork Agent" : title;
}

/** skills 迁移（原 `aPe`）：skills/*.md → codexHome/skills/<名>/SKILL.md + loose skill 目录拷贝。 */
async function importAccountSkills({
  codexHome,
  copiedFiles,
  projectImport,
}: {
  codexHome: string;
  copiedFiles: string[];
  projectImport: ProjectImportSelection;
}): Promise<string[]> {
  const { looseSkills } = await scanProjectlessSpace(projectImport.project);
  const skillFiles = await collectAccountMarkdown(projectImport.project.accountOrgDirs, SKILLS_DIRNAME);
  const nameIndex = await readAccountNameIndex(projectImport.project.accountOrgDirs, skillFiles.length, SKILLS_DIRNAME);
  const targets = new Map<string, { skillName: string; sourcePath: string }>();
  for (const sourcePath of skillFiles) {
    const base = basename(sourcePath, extname(sourcePath));
    const skillName = nameIndex.get(base) ?? nameIndex.get("fallback") ?? base;
    const target = join(codexHome, SKILLS_DIRNAME, sanitizeAccountItemName(skillName), "SKILL.md");
    if (!targets.has(target)) targets.set(target, { skillName, sourcePath });
  }
  const written = (
    await Promise.all(
      [...targets].map(async ([target, { skillName, sourcePath }]) => {
        if (await isFile(target)) return null;
        await writeTextFile(target, ensureSkillFrontmatter({ content: await readFile(sourcePath, "utf8"), name: skillName }));
        copiedFiles.push(target);
        return target;
      }),
    )
  ).filter((path): path is string => path != null);
  const copied = (
    await Promise.all(
      looseSkills.map(async (skill) => {
        const target = join(codexHome, SKILLS_DIRNAME, sanitizeAccountItemName(basename(skill.skillRoot)));
        const skillFile = join(target, "SKILL.md");
        if (await isFile(skillFile)) return null;
        await cp(skill.skillRoot, target, { recursive: true });
        copiedFiles.push(skillFile);
        return skillFile;
      }),
    )
  ).filter((path): path is string => path != null);
  return [...written, ...copied];
}

/** agents 迁移（原 `oPe`）：agents/*.md → codexHome/agents/<名>.toml。 */
async function importAccountAgents({
  codexHome,
  copiedFiles,
  projectImport,
}: {
  codexHome: string;
  copiedFiles: string[];
  projectImport: ProjectImportSelection;
}): Promise<string[]> {
  const agentFiles = await collectAccountMarkdown(projectImport.project.accountOrgDirs, "agents");
  if (agentFiles.length === 0) return [];
  const nameIndex = await readAccountNameIndex(projectImport.project.accountOrgDirs, agentFiles.length, "agents");
  const targets = new Map<string, { agentName: string; sourcePath: string }>();
  for (const sourcePath of agentFiles) {
    const base = basename(sourcePath, extname(sourcePath));
    const agentName = nameIndex.get(base) ?? nameIndex.get("fallback") ?? titleCaseAgentName(base);
    const target = join(codexHome, "agents", `${sanitizeAccountItemName(agentName)}.toml`);
    if (!targets.has(target)) targets.set(target, { agentName, sourcePath });
  }
  return (
    await Promise.all(
      [...targets].map(async ([target, { agentName, sourcePath }]) => {
        if (await isFile(target)) return null;
        const instructions = await readFile(sourcePath, "utf8");
        await writeTextFile(
          target,
          stringifyToml({
            name: agentName,
            description: `Migrated Claude Cowork agent ${agentName}.`,
            developer_instructions: instructions.trim(),
          }),
        );
        copiedFiles.push(target);
        return target;
      }),
    )
  ).filter((path): path is string => path != null);
}

// ---------------------------------------------------------------------------
// 项目导入准备（原 `uPe`/`dPe`）
// ---------------------------------------------------------------------------

/** 单项目的导入准备结果（原 `dPe` 返回值）。 */
export interface ProjectImportPreparation {
  agentsPath: string | null;
  copiedFiles: string[];
  importedMcpServerNames: string[];
  liveConfigPaths: string[];
  projectImport: ProjectImportSelection;
  transcriptCandidates: TranscriptCandidate[];
}

/** 项目导入准备（原 `uPe`）：逐项目串行执行 MCP/skills/agents/AGENTS.md。 */
export async function prepareProjectImports({
  codexHome,
  projects,
}: {
  codexHome: string;
  projects: ProjectImportSelection[];
}): Promise<{ projects: ProjectImportPreparation[] }> {
  const prepared: ProjectImportPreparation[] = [];
  for (const projectImport of projects) {
    prepared.push(await prepareProjectImport({ codexHome, projectImport }));
  }
  return { projects: prepared };
}

async function prepareProjectImport({
  codexHome,
  projectImport,
}: {
  codexHome: string;
  projectImport: ProjectImportSelection;
}): Promise<ProjectImportPreparation> {
  const copiedFiles: string[] = [];
  const importedMcpServerNames: string[] = [];
  const liveConfigPaths: string[] = [];
  let agentsPath: string | null = null;
  if (projectImport.accountSetupSelected) {
    const mcp = await importMcpConfig({ codexHome, copiedFiles, projectImport });
    importedMcpServerNames.push(...mcp.importedMcpServerNames);
    liveConfigPaths.push(
      ...mcp.liveConfigPaths,
      ...(await importAccountSkills({ codexHome, copiedFiles, projectImport })),
      ...(await importAccountAgents({ codexHome, copiedFiles, projectImport })),
    );
  }
  if (projectImport.itemTypes.has("AGENTS_MD")) agentsPath = await appendImportedInstructions({ projectImport });
  return {
    agentsPath,
    copiedFiles,
    importedMcpServerNames,
    liveConfigPaths,
    projectImport,
    transcriptCandidates: projectImport.itemTypes.has("SESSIONS") ? projectImport.transcriptCandidates : [],
  };
}

export {
  importAccountSetup,
  importRollouts,
  importMcpConfig,
  appendImportedInstructions,
  readCoworkSettings,
  readMcpServerConfigs,
  mapClaudeModel,
  mapPermissionMode,
  compareSemver,
  listInstalledPlugins,
  registerPluginMarketplace,
  importPlugins,
  buildConnectorCandidates,
};
