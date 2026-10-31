// Computer Use 审批存储（windows always-allowed / CUA app approvals / Messages
// 审批）+ mac 图标 + 锁定使用状态 + defaults 配置 + 服务门面。
//
// 对应 main-C-Mhak1n.ts 79,795-80,317：
//   - windowsAlwaysAllowedStore（bM~PM）：config.toml 的
//     [computer_use.windows.always_allowed_app_ids] 段读写 + 从旧版
//     [apps.allowed] 段的一次性迁移（CM）
//   - cuaAppApprovalsStore（FM~tN）：win32 走 config.toml（TOML 段）、darwin 走
//     Group Containers JSON（2DC432GLL2.com.openai.sky.CUAService）
//   - messagesReadDecisionsStore（nN~dN）/ messagesSendApprovalsStore
//     （fN~yN）：均仅 darwin，与 CUA 同目录
//   - macAppIconPng（BAe~UAe）：sips 转 png + Info.plist 图标名探测
//   - lockedUseState（WAe~QAe）：CUA Installer CLI（status/install/uninstall）
//   - cuaDefaults（CN~tje）：defaults read/write（soundMode/appshotSoundEnabled）
//   - nje ComputerUseSettingsService：per-origin 门面
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { join, dirname, extname } from "node:path";
import { tmpdir, homedir } from "node:os";
import { promisify } from "node:util";
import { nativeImage } from "electron";
import {
  wf as objectSchema,
  xf as looseObjectSchema,
  Of as stringSchema,
  Cf as numberSchema,
  gf as booleanSchema,
  hf as arraySchema,
  Ef as recordSchema,
  wi as parseToml,
  Oi as codexHome,
  A as resolveAppPath,
  F as readPlistValue,
  Bi as sanitizedProcessEnv,
  Uf as EventEmitterBase,
} from "@chunk/shared";
import { stringifyToml } from "../misc/env-toml-stringifier";
import { getAppIconMedium, getAppIconSmall } from "../windows/native-app-icons";
import { openChromeExtensionSettings } from "../plugins/browser-runtime-resolution";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// windowsAlwaysAllowedStore（原 `bM`~`PM`）
// ---------------------------------------------------------------------------

const windowsAlwaysAllowedSchema = objectSchema({
  computer_use: objectSchema({ windows: objectSchema({ always_allowed_app_ids: recordSchema(stringSchema(), booleanSchema()) }) }),
});
const legacyAllowedAppsSchema = (looseObjectSchema({ apps: (objectSchema({ allowed: arraySchema(stringSchema()) }) as unknown as { loose(): unknown }).loose() }) as unknown as { loose(): unknown }).loose();
const ALWAYS_ALLOWED_SECTION_RE =
  /(^|\r?\n)\[computer_use\.windows\.always_allowed_app_ids\][\s\S]*?(?=\r?\n\[[^\]\r\n]+\]|$)/;

function isTomlTable(value: unknown): value is Record<string, unknown> {
  return typeof value == "object" && !!value && !Array.isArray(value);
}

/** 去重 + trim + 去空（原 `NM`）。 */
function normalizeAppIds(ids: string[]): string[] {
  return Array.from(new Set(ids.map((id) => id.trim()).filter((id) => id !== "")));
}

/** TOML 文件读取（原 `OM`）：不存在或非对象返回空表。 */
async function readTomlObject(path: string): Promise<Record<string, unknown>> {
  if (!existsSync(path)) return {};
  const parsed = parseToml(await readFile(path, "utf8"));
  return isTomlTable(parsed) ? parsed : {};
}

/** TOML 文件写入（原 `kM`/`AM`）：尾换行保证 + 目录创建；接受表或文本。 */
async function writeTomlFile(path: string, contents: Record<string, unknown> | string): Promise<void> {
  const serialized = typeof contents == "string" ? contents : stringifyToml(contents);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, serialized.endsWith("\n") ? serialized : `${serialized}\n`, "utf8");
}

/** always_allowed 段序列化（原 `MM`）。 */
function serializeAlwaysAllowedSection(appIds: string[]): string {
  const serialized = stringifyToml({
    computer_use: {
      windows: { always_allowed_app_ids: Object.fromEntries(appIds.map((id) => [id, true])) },
    },
  });
  return serialized.endsWith("\n") ? serialized : `${serialized}\n`;
}

/** 文本级段替换（原 `jM`）：已有段原位替换，否则追加。 */
function replaceAlwaysAllowedSection(content: string, appIds: string[]): string {
  const section = serializeAlwaysAllowedSection(appIds);
  const match = ALWAYS_ALLOWED_SECTION_RE.exec(content);
  return match == null
    ? content.trim() === ""
      ? section
      : `${content}${content.endsWith("\n") ? "\n" : "\n\n"}${section}`
    : [content.slice(0, match.index), match[1], section, content.slice(match.index + match[0].length)].join("");
}

/** 旧版 [apps.allowed] 段迁移（原 `CM`）：迁移后清空旧段。 */
async function migrateLegacyAllowedApps(configPath: string): Promise<void> {
  const legacyPath = join(dirname(configPath), "computer-use", "config.toml");
  if (!existsSync(legacyPath)) return;
  let legacy: Record<string, unknown>;
  try {
    legacy = await readTomlObject(legacyPath);
  } catch {
    return;
  }
  const parsed = (legacyAllowedAppsSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: { apps?: { allowed?: string[] } } } }).safeParse(legacy);
  if (!parsed.success) return;
  const migrated = normalizeAppIds(parsed.data!.apps?.allowed ?? []);
  if (migrated.length === 0) return;
  const existing = (await readAlwaysAllowed(configPath)) ?? [];
  await writeAlwaysAllowed(configPath, normalizeAppIds([...existing, ...migrated]));
  parsed.data!.apps!.allowed = [];
  await writeTomlFile(legacyPath, legacy);
}

/** 读 always_allowed（原 `wM`/`EM`）：先迁移再读。 */
async function readAlwaysAllowed(configPath: string): Promise<string[] | null> {
  await migrateLegacyAllowedApps(configPath);
  if (!existsSync(configPath)) return null;
  let contents: Record<string, unknown>;
  try {
    contents = await readTomlObject(configPath);
  } catch {
    return null;
  }
  const parsed = (windowsAlwaysAllowedSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: { computer_use: { windows: { always_allowed_app_ids: Record<string, boolean> } } } } }).safeParse(contents);
  return parsed.success
    ? normalizeAppIds(
        Object.entries(parsed.data!.computer_use.windows.always_allowed_app_ids)
          .filter(([, allowed]) => allowed === true)
          .map(([id]) => id),
      )
    : null;
}

/** 写 always_allowed（原 `TM`/`DM`）：先迁移再文本级段替换。 */
async function writeAlwaysAllowed(configPath: string, appIds: string[]): Promise<void> {
  await migrateLegacyAllowedApps(configPath);
  const existing = existsSync(configPath) ? await readFile(configPath, "utf8") : "";
  parseToml(existing);
  await writeTomlFile(configPath, replaceAlwaysAllowedSection(existing, appIds));
}

// ---------------------------------------------------------------------------
// cuaAppApprovalsStore（原 `FM`~`tN`）
// ---------------------------------------------------------------------------

const APPROVALS_JSON_FILENAME = "ComputerUseAppApprovals.json";
const CONFIG_TOML_FILENAME = "config.toml";
const SOFTWARE_SUBPATH = join("Library", "Application Support", "Software");
const GROUP_CONTAINERS_PATH = join("Library", "Group Containers");
const CUA_GROUP_ID = "2DC432GLL2.com.openai.sky.CUAService";
const approvalsJsonSchema = objectSchema({ approvedBundleIdentifiers: arraySchema(stringSchema()) });
/** 应用解析缓存（原 `VM`：platform:bundleId → 条目）。 */
const resolvedAppCache = new Map<string, ApprovedApp>();

interface ApprovalStoreLocation {
  filePath: string;
  format: "toml" | "json";
}

interface ApprovalsEnv {
  codexHome?: string;
  homeDirectory?: string;
  platform?: string;
}

/** 存储位置（原 `GM`）：win32 → config.toml；darwin → Group Containers JSON。 */
function approvalsLocation(env: ApprovalsEnv = {}): ApprovalStoreLocation {
  const { codexHome: home, homeDirectory = homedir(), platform = process.platform } = env;
  if (platform === "win32") return { filePath: join(home ?? (codexHome as () => string)(), CONFIG_TOML_FILENAME), format: "toml" };
  const groupDir = join(homeDirectory, GROUP_CONTAINERS_PATH, CUA_GROUP_ID, SOFTWARE_SUBPATH);
  return { filePath: join(groupDir, APPROVALS_JSON_FILENAME), format: "json" };
}

/** JSON 读（原 `qM`）：损坏返回空列表。 */
async function readApprovalsJson(path: string): Promise<string[]> {
  let parsed: unknown = {};
  if (existsSync(path)) {
    try {
      parsed = JSON.parse(await readFile(path, "utf8"));
    } catch {
      parsed = {};
    }
  }
  const result = (approvalsJsonSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: { approvedBundleIdentifiers: string[] } } }).safeParse(parsed);
  return result.success ? result.data!.approvedBundleIdentifiers : [];
}

/** JSON 写（原 `JM`）。 */
async function writeApprovalsJson(path: string, bundleIds: string[]): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify({ approvedBundleIdentifiers: bundleIds }, null, 2), "utf8");
}

/** bundle id 列表规范化（原 `YM`）。 */
function normalizeBundleIds(ids: string[]): string[] {
  return Array.from(new Set(ids.map((id) => id.trim()).filter((id) => id !== "")));
}

interface ApprovedApp {
  bundleIdentifier: string;
  displayName: string;
  iconDataURL: string | null;
}

/** 平台归类（原 `eN`）：仅 darwin/win32 有图标路径。 */
function iconPlatform(platform: string | undefined = process.platform): "darwin" | "win32" | "other" {
  return platform === "darwin" || platform === "win32" ? platform : "other";
}

/** 单应用解析（原 `ZM`）：缓存 + 图标（win32 无图标不缓存）。 */
async function resolveApprovedApp(bundleId: string, platform: "darwin" | "win32" | "other", rawPlatform?: string): Promise<ApprovedApp> {
  const cacheKey = `${platform}:${bundleId}`;
  const cached = resolvedAppCache.get(cacheKey);
  if (cached != null) return cached;
  const resolved = (await resolveAppEntry(bundleId, platform, rawPlatform)) ?? { bundleIdentifier: bundleId, displayName: bundleId, iconDataURL: null };
  if (platform !== "win32" || resolved.iconDataURL != null) resolvedAppCache.set(cacheKey, resolved);
  else resolvedAppCache.delete(cacheKey);
  return resolved;
}

/** shared 的应用信息 + 图标（原 `QM`）。 */
async function resolveAppEntry(bundleId: string, platform: "darwin" | "win32" | "other", rawPlatform: string | undefined): Promise<ApprovedApp | null> {
  try {
    const info = await (resolveAppPath as (bundleId: string) => Promise<{ appPath: string; displayName: string } | null>)(bundleId);
    return info == null
      ? null
      : {
          bundleIdentifier: bundleId,
          displayName: info.displayName,
          iconDataURL: platform === "darwin" ? await getAppIconMedium(info.appPath) : await getAppIconSmall(info.appPath, { platform: rawPlatform as never }),
        };
  } catch {
    return null;
  }
}

/** 读全部审批（原 `HM`）。 */
async function getAppApprovals(env: ApprovalsEnv = {}): Promise<{ approvedApps: ApprovedApp[]; approvedBundleIdentifiers: string[] } | null> {
  const location = approvalsLocation(env);
  const stored = location.format === "toml" ? await readAlwaysAllowed(location.filePath) : existsSync(location.filePath) ? await readApprovalsJson(location.filePath) : null;
  if (stored == null) return null;
  const bundleIds = normalizeBundleIds(stored);
  return { approvedApps: await resolveApprovedApps(bundleIds, env), approvedBundleIdentifiers: bundleIds };
}

/** 写审批（原 `UM`）。 */
async function setAppApprovals(bundleIds: string[], env: ApprovalsEnv = {}): Promise<{ approvedApps: ApprovedApp[]; approvedBundleIdentifiers: string[] }> {
  const location = approvalsLocation(env);
  const normalized = normalizeBundleIds(bundleIds);
  if (location.format === "toml") await writeAlwaysAllowed(location.filePath, normalized);
  else await writeApprovalsJson(location.filePath, normalized);
  return { approvedApps: await resolveApprovedApps(normalized, env), approvedBundleIdentifiers: normalized };
}

/** 移除单个审批（原 `WM`）。 */
async function removeAppApproval(bundleId: string, env: ApprovalsEnv = {}): Promise<{ approvedApps: ApprovedApp[]; approvedBundleIdentifiers: string[] } | null> {
  const current = await getAppApprovals(env);
  return current == null
    ? null
    : setAppApprovals(
        current.approvedBundleIdentifiers.filter((id) => id !== bundleId),
        env,
      );
}

async function resolveApprovedApps(bundleIds: string[], env: ApprovalsEnv = {}): Promise<ApprovedApp[]> {
  const platform = iconPlatform(env.platform);
  return Promise.all(bundleIds.map((bundleId) => resolveApprovedApp(bundleId, platform, env.platform)));
}

// ---------------------------------------------------------------------------
// messagesReadDecisionsStore（原 `nN`~`dN`）
// ---------------------------------------------------------------------------

const MESSAGES_READ_DECISIONS_FILENAME = "MessagesReadDecisions.json";
const readDecisionsSchema = looseObjectSchema({
  readAccessPolicy: (stringSchema() as unknown as { default(value: string): unknown }).default("askPerChat"),
  chats: recordSchema((stringSchema() as unknown as { min(n: number): unknown }).min(1), looseObjectSchema({ displayName: stringSchema(), decision: stringSchema() })),
});

interface MessagesReadState {
  readAccessPolicy: string;
  chats: Record<string, { displayName: string; decision: string }>;
}

interface MessagesReadView {
  readAccessPolicy: "askPerChat" | "allowUnconfiguredChats" | "allowAllChats";
  chats: Array<{ chatGUID: string; displayName: string; decision: string }>;
}

/** 存储位置（原 `dN`）：与 CUA 审批同目录，仅 darwin。 */
function readDecisionsLocation(env: ApprovalsEnv = {}): { filePath: string } | null {
  const { homeDirectory, platform = process.platform } = env;
  return platform === "darwin"
    ? { filePath: join(dirname(approvalsLocation({ homeDirectory, platform }).filePath), MESSAGES_READ_DECISIONS_FILENAME) }
    : null;
}

/** 读（原 `lN`）：损坏回退 askPerChat 空表。 */
async function readMessagesReadState(env: ApprovalsEnv = {}): Promise<MessagesReadState | null> {
  const location = readDecisionsLocation(env);
  if (location == null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(location.filePath, "utf8"));
  } catch {
    return { readAccessPolicy: "askPerChat", chats: {} };
  }
  const result = (readDecisionsSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: MessagesReadState } }).safeParse(parsed);
  return result.success ? result.data! : { readAccessPolicy: "askPerChat", chats: {} };
}

/** 投影（原 `uN`）：未知策略/决策过滤 + 排序。 */
function projectReadDecisions(state: MessagesReadState): MessagesReadView {
  return {
    readAccessPolicy:
      state.readAccessPolicy === "allowUnconfiguredChats" || state.readAccessPolicy === "allowAllChats"
        ? state.readAccessPolicy
        : "askPerChat",
    chats: Object.entries(state.chats)
      .flatMap(([chatGUID, { displayName, decision }]) =>
        decision === "alwaysAllow" || decision === "ask" || decision === "alwaysDeny"
          ? [{ chatGUID, displayName, decision }]
          : [],
      )
      .sort(
        (a, b) => a.displayName.localeCompare(b.displayName) || a.chatGUID.localeCompare(b.chatGUID),
      ),
  };
}

/** 写（原 `cN`）。 */
async function writeMessagesReadState(state: MessagesReadState, env: ApprovalsEnv = {}): Promise<MessagesReadView | null> {
  const location = readDecisionsLocation(env);
  if (location == null) return null;
  await mkdir(dirname(location.filePath), { recursive: true });
  await writeFile(location.filePath, JSON.stringify(state, null, 2), "utf8");
  return projectReadDecisions(state);
}

/** 读视图（原 `iN`）。 */
async function getMessagesReadDecisions(env: ApprovalsEnv = {}): Promise<MessagesReadView | null> {
  const state = await readMessagesReadState(env);
  return state == null ? null : projectReadDecisions(state);
}

/** 设置全局策略（原 `aN`）。 */
async function setMessagesReadPolicy(policy: string, env: ApprovalsEnv = {}): Promise<MessagesReadView | null> {
  const state = await readMessagesReadState(env);
  if (state == null) return null;
  state.readAccessPolicy = policy;
  return writeMessagesReadState(state, env);
}

/** 设置单聊决策（原 `oN`）。 */
async function setMessagesChatDecision(chatGUID: string, decision: string, displayName: string, env: ApprovalsEnv = {}): Promise<MessagesReadView | null> {
  const state = await readMessagesReadState(env);
  if (state == null) return null;
  const existing = state.chats[chatGUID];
  if (existing == null) state.chats[chatGUID] = { displayName, decision };
  else {
    existing.displayName = displayName;
    existing.decision = decision;
  }
  return writeMessagesReadState(state, env);
}

/** 移除单聊决策（原 `sN`）。 */
async function removeMessagesChatDecision(chatGUID: string, env: ApprovalsEnv = {}): Promise<MessagesReadView | null> {
  const state = await readMessagesReadState(env);
  if (state == null) return null;
  return state.chats[chatGUID] == null
    ? projectReadDecisions(state)
    : (delete state.chats[chatGUID], writeMessagesReadState(state, env));
}

// ---------------------------------------------------------------------------
// messagesSendApprovalsStore（原 `fN`~`yN`）
// ---------------------------------------------------------------------------

const MESSAGES_SEND_APPROVALS_FILENAME = "MessagesSendApprovals.json";
const sendApprovalsSchema = looseObjectSchema({
  allowAllChats: (booleanSchema() as unknown as { default(value: boolean): unknown }).default(false),
  approvedChats: recordSchema((stringSchema() as unknown as { min(n: number): unknown }).min(1), (stringSchema() as unknown as { min(n: number): unknown }).min(1)),
});

interface MessagesSendState {
  allowAllChats: boolean;
  approvedChats: Record<string, string>;
}

interface MessagesSendView {
  allowAllChats: boolean;
  approvedChats: Array<{ chatGUID: string; displayName: string }>;
}

function sendApprovalsLocation(env: ApprovalsEnv = {}): { filePath: string } | null {
  const { homeDirectory, platform = process.platform } = env;
  return platform === "darwin"
    ? { filePath: join(dirname(approvalsLocation({ homeDirectory, platform }).filePath), MESSAGES_SEND_APPROVALS_FILENAME) }
    : null;
}

async function readMessagesSendState(path: string): Promise<MessagesSendState | null> {
  try {
    return (sendApprovalsSchema as unknown as { parse(input: unknown): MessagesSendState }).parse(JSON.parse(await readFile(path, "utf8")));
  } catch {
    return null;
  }
}

function projectSendApprovals(state: MessagesSendState): MessagesSendView {
  return {
    allowAllChats: state.allowAllChats,
    approvedChats: Object.entries(state.approvedChats)
      .map(([chatGUID, displayName]) => ({ chatGUID, displayName }))
      .sort(
        (a, b) => a.displayName.localeCompare(b.displayName) || a.chatGUID.localeCompare(b.chatGUID),
      ),
  };
}

/** 读（原 `mN`）。 */
async function getMessagesSendApprovals(env: ApprovalsEnv = {}): Promise<MessagesSendView | null> {
  const location = sendApprovalsLocation(env);
  if (location == null) return null;
  const state = await readMessagesSendState(location.filePath);
  return state == null ? { allowAllChats: false, approvedChats: [] } : projectSendApprovals(state);
}

/** 设置 allowAllChats（原 `hN`）。 */
async function setMessagesAllowAllChats(allowAll: boolean, env: ApprovalsEnv = {}): Promise<MessagesSendView | null> {
  const location = sendApprovalsLocation(env);
  if (location == null) return null;
  const state = (await readMessagesSendState(location.filePath)) ?? { allowAllChats: false, approvedChats: {} };
  state.allowAllChats = allowAll;
  await mkdir(dirname(location.filePath), { recursive: true });
  await writeFile(location.filePath, JSON.stringify(state, null, 2), "utf8");
  return projectSendApprovals(state);
}

/** 移除单聊审批（原 `gN`）。 */
async function removeMessagesSendApproval(chatGUID: string, env: ApprovalsEnv = {}): Promise<MessagesSendView | null> {
  const location = sendApprovalsLocation(env);
  if (location == null) return null;
  const state = await readMessagesSendState(location.filePath);
  return state == null
    ? { allowAllChats: false, approvedChats: [] }
    : Object.hasOwn(state.approvedChats, chatGUID)
      ? (delete state.approvedChats[chatGUID],
        await writeFile(location.filePath, JSON.stringify(state, null, 2), "utf8"),
        projectSendApprovals(state))
      : projectSendApprovals(state);
}

// ---------------------------------------------------------------------------
// mac 图标（原 `BAe`~`UAe`）
// ---------------------------------------------------------------------------

/** .icns → png dataURL（原 `bN`）：sips 转换 + 5s 超时。 */
async function icnsToPngDataUrl(icnsPath: string): Promise<string | null> {
  const tempDir = await mkdtemp(join(tmpdir(), "codex-app-icon-"));
  const pngPath = join(tempDir, "icon.png");
  try {
    await execFileAsync("/usr/bin/sips", ["-s", "format", "png", icnsPath, "--out", pngPath], {
      env: sanitizedProcessEnv(process.env),
      timeout: 5e3,
    });
    const png = await readFile(pngPath);
    return png.byteLength === 0 ? null : `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}

/** Info.plist 的图标路径探测（原 `HAe`）。 */
async function macAppIconPng(appPath: string): Promise<string | null> {
  if (process.platform !== "darwin") return null;
  const iconPath = await resolveMacIconPath(appPath);
  return iconPath == null ? null : icnsToPngDataUrl(iconPath);
}

async function resolveMacIconPath(appPath: string): Promise<string | null> {
  const plistPath = join(appPath, "Contents", "Info.plist");
  const resourcesDir = join(appPath, "Contents", "Resources");
  const iconName = (await (readPlistValue as (path: string, key: string) => Promise<string | null>)(plistPath, "CFBundleIconFile")) ??
    (await (readPlistValue as (path: string, key: string) => Promise<string | null>)(plistPath, "CFBundleIconName"));
  const candidates = iconName == null ? [] : [iconName, withIcnsExtension(iconName)];
  for (const candidate of [...candidates, "AppIcon.icns"]) {
    const candidatePath = join(resourcesDir, candidate);
    if (existsSync(candidatePath)) return candidatePath;
  }
  return null;
}

function withIcnsExtension(name: string): string {
  return extname(name) === "" ? `${name}.icns` : name;
}

// ---------------------------------------------------------------------------
// 锁定使用状态（原 `WAe`~`QAe`）
// ---------------------------------------------------------------------------

const CUA_INSTALLER_RELATIVE_PATH = [
  "computer-use",
  "Codex Computer Use.app",
  "Contents",
  "SharedSupport",
  "Codex Computer Use Installer.app",
  "Contents",
  "MacOS",
  "Codex Computer Use Installer",
];
const CORE_TYPES_RESOURCES = join("/System", "Library", "CoreServices", "CoreTypes.bundle", "Contents", "Resources");
const LOCKED_ICON_PATH = join(CORE_TYPES_RESOURCES, "LockedIcon.icns");
const NS_COMPUTER_IMAGE = "NSComputer";

/** CUA Installer CLI 路径（原 `QAe`）。 */
function cuaInstallerCliPath(): string {
  return join((codexHome as () => string)(), ...CUA_INSTALLER_RELATIVE_PATH);
}

/** 调用 Installer CLI（原 `SN`）：12s 超时。 */
async function runCuaInstallerCli(command: string): Promise<string> {
  const { stdout } = await execFileAsync(cuaInstallerCliPath(), [command], { env: sanitizedProcessEnv(process.env), timeout: 12e4 });
  return stdout;
}

/** 锁定使用已安装（原 `YAe`/`xN`）。 */
async function isLockedUseInstalled(): Promise<boolean | null> {
  if (process.platform !== "darwin") return null;
  try {
    return (await runCuaInstallerCli("status")).trim() === "OK: installed";
  } catch {
    return false;
  }
}

/** 锁定使用图标（原 `XAe`）：NSComputer + LockedIcon。 */
async function lockedUseIcons(): Promise<{ computerIconDataURL: string | null; lockIconDataURL: string | null }> {
  if (process.platform !== "darwin") return { computerIconDataURL: null, lockIconDataURL: null };
  const computerIcon = nativeImage.createFromNamedImage(NS_COMPUTER_IMAGE);
  return {
    computerIconDataURL: computerIcon.isEmpty() ? null : computerIcon.toDataURL(),
    lockIconDataURL: await icnsToPngDataUrl(LOCKED_ICON_PATH),
  };
}

/** 安装/卸载锁定使用（原 `ZAe`）。 */
async function setLockedUseInstalled(installed: boolean): Promise<boolean | null> {
  return process.platform === "darwin" ? (await runCuaInstallerCli(installed ? "install" : "uninstall"), isLockedUseInstalled()) : null;
}

// ---------------------------------------------------------------------------
// cuaDefaults（原 `CN`~`tje`）
// ---------------------------------------------------------------------------

const CUA_SERVICE_ID = "com.openai.sky.CUAService";
const SOUND_MODE_KEY = "computerUseSoundMode";

/** 读 soundMode（原 `$Ae`）。 */
async function getCuaSoundMode(): Promise<string | null> {
  if (process.platform !== "darwin") return null;
  try {
    const { stdout } = await execFileAsync("/usr/bin/defaults", ["read", CUA_SERVICE_ID, SOUND_MODE_KEY]);
    const trimmed = stdout.trim();
    return trimmed === "" ? null : trimmed;
  } catch {
    return null;
  }
}

/** 写 soundMode（原 `eje`）。 */
async function setCuaSoundMode(mode: string): Promise<string> {
  if (process.platform === "darwin") await execFileAsync("/usr/bin/defaults", ["write", CUA_SERVICE_ID, SOUND_MODE_KEY, mode]);
  return mode;
}

/** 写 appshot 声音开关（原 `tje`）。 */
async function setCuaAppshotSoundEnabledImpl(enabled: boolean): Promise<void> {
  if (process.platform === "darwin")
    await execFileAsync("/usr/bin/defaults", ["write", CUA_SERVICE_ID, "appshotSoundEnabled", "-bool", enabled ? "YES" : "NO"]);
}

// ---------------------------------------------------------------------------
// ComputerUseSettingsService（原 `nje`）
// ---------------------------------------------------------------------------

/** per-origin 的 Computer Use 设置门面（原 `nje`）。 */
class ComputerUseSettingsService extends (EventEmitterBase as new () => {}) {
  requestComputerUseWorker: ((request: { method: string; params: Record<string, unknown> }) => Promise<unknown>) | null;

  constructor(requestComputerUseWorker: ComputerUseSettingsService["requestComputerUseWorker"]) {
    super();
    this.requestComputerUseWorker = requestComputerUseWorker;
  }

  getAppApprovals() {
    return getAppApprovals();
  }

  removeAppApproval(bundleId: string) {
    return removeAppApproval(bundleId);
  }

  async searchMessagesChats(query: string) {
    return process.platform !== "darwin" || this.requestComputerUseWorker == null
      ? null
      : this.requestComputerUseWorker({ method: "messagesSearchChats", params: { query } });
  }

  getMessagesReadDecisions() {
    return getMessagesReadDecisions();
  }

  setMessagesReadAccessPolicy(policy: string) {
    return setMessagesReadPolicy(policy);
  }

  setMessagesReadDecision(chatGUID: string, decision: string, displayName: string) {
    return setMessagesChatDecision(chatGUID, decision, displayName);
  }

  removeMessagesReadDecision(chatGUID: string) {
    return removeMessagesChatDecision(chatGUID);
  }

  getMessagesSendApprovals() {
    return getMessagesSendApprovals();
  }

  setMessagesSendAllowAllChats(allowAll: boolean) {
    return setMessagesAllowAllChats(allowAll);
  }

  removeMessagesSendApproval(chatGUID: string) {
    return removeMessagesSendApproval(chatGUID);
  }

  getSoundMode() {
    return getCuaSoundMode();
  }

  setSoundMode(mode: string) {
    return setCuaSoundMode(mode);
  }

  /** 组合视图（原 getLockedUseState）：enabled + 双图标。 */
  async getLockedUseState() {
    const [enabled, icons] = await Promise.all([isLockedUseInstalled(), lockedUseIcons()]);
    return { enabled, ...icons };
  }

  setLockedUseEnabled(enabled: boolean) {
    return setLockedUseInstalled(enabled);
  }

  openChromeExtensionInstallPage() {
    return openChromeExtensionSettings({});
  }
}

export {
  readAlwaysAllowed,
  writeAlwaysAllowed,
  getAppApprovals,
  setAppApprovals,
  removeAppApproval,
  getMessagesReadDecisions,
  setMessagesReadPolicy,
  setMessagesChatDecision,
  removeMessagesChatDecision,
  getMessagesSendApprovals,
  setMessagesAllowAllChats,
  removeMessagesSendApproval,
  macAppIconPng,
  isLockedUseInstalled,
  lockedUseIcons,
  setLockedUseInstalled,
  getCuaSoundMode,
  setCuaSoundMode,
  setCuaAppshotSoundEnabledImpl as setCuaAppshotSoundEnabled,
  ComputerUseSettingsService,
  approvalsLocation,
  type ApprovedApp,
  type MessagesReadView,
  type MessagesSendView,
};
