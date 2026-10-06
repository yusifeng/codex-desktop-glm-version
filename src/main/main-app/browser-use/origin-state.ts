// Browser Use 的来源规则状态 + 远端设置同步。
//
// 对应 main-C-Mhak1n.ts 68,705-69,353：
//   - XOe BrowserUseOriginState（68,716-68,747）：webmcp/iab 审批模式/来源规则
//     的本地 config.toml 读写（经 syncSettings 回调可改走远端）
//   - 规则更新引擎（rke/uD/ike/hD，68,781-68,928）：add/remove 的 allow/deny
//     矩阵 + origin 规范化（补协议、取 origin）
//   - config.toml 读写（dD/fD/pD/ake，68,825-68,858）
//   - 投影（mD/gD/yD/vD/bD/_D/xD/SD，68,859-68,942）
//   - 远端设置 schema（CD/wD/TD/ED，68,943-68,963）
//   - uke RemoteBrowserSettings（68,966-68,990）：/wham/browser/settings 的
//     乐观 revision 读改
//   - pke BrowserConfigFile（69,000-69,058）：TOML 文件层（原子写 + BigInt）
//   - _ke BrowserSettingsSync（69,090-69,321）：60s 轮询 + 文件 watcher +
//     远端双向投影（ND 差分/vke 合并/409 冲突重读/principal 变更重置）
import { watch } from "node:fs";
import { readFile, writeFile, mkdir, rename, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join, dirname, basename } from "node:path";
import {
  wf as objectSchema,
  Of as stringSchema,
  Cf as numberSchema,
  gf as booleanSchema,
  hf as arraySchema,
  df as enumSchema,
  Af as tupleSchema,
  _f as refineSchema,
  Oi as codexHome,
  wi as parseToml,
  Rc as chromeExtensionIdsForChannel,
  Vc as browserPluginDescriptor,
  Nc as dedupeTabCandidates,
  Mc as candidateLimitForQuery,
  Ya as chromeTabLivenessSchema,
  Ja as chromeTabFocusSchema,
  qa as tabMentionSearchSchema,
  Uf as EventEmitterBase,
} from "@chunk/shared";
import { dedupeBrowserUseStrings, normalizeBrowserUseOrigin, oppositeBrowserUseRuleKind } from "./origin-policy";
import { createTaggedLogger, type Logger } from "@chunk/logger";
import { stringifyToml } from "../misc/env-toml-stringifier";
import { AuthenticatedDesktopFetchError } from "../api/desktop-fetch";
import { discoverPipeClients } from "../native-pipe/server";

// browser-use/config.toml 的文件名（原 `Dn`，rpc-client.ts 已定义同名常量，
// 此处独立声明避免循环依赖）。
const BROWSER_CONFIG_FILENAME = "config.toml";
const FULL_CDP_KEY = "full_cdp_access_enabled";
const WEBMCP_KEY = "webmcp_enabled";

// ---------------------------------------------------------------------------
// 规则模型（原 `JOe`/`oD`/`YOe`）
// ---------------------------------------------------------------------------

type OriginResource = "origin" | "download" | "upload" | "fullCdp";

const RESOURCE_KINDS: Record<OriginResource, string> = {
  origin: "origins",
  download: "downloads",
  upload: "uploads",
  fullCdp: "full_cdp",
};

const originRuleUpdateSchema = arraySchema(
  objectSchema({
    action: enumSchema(["add", "remove"]),
    kind: enumSchema(["allowed", "denied"]),
    origin: stringSchema().min(1),
    resource: enumSchema(["origin", "download", "upload", "fullCdp"]),
  }),
);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value == "object" && !!value && !Array.isArray(value);
}

/** 字符串数组去重保序（原 `xD`）。 */
function dedupeStrings(value: unknown): string[] {
  return dedupeBrowserUseStrings(value);
}

/** origin 规范化（原 `lke`）：缺协议补 https://，仅 http/https，取 origin。 */
function normalizeOrigin(value: string): string | null {
  return normalizeBrowserUseOrigin(value);
}

// ---------------------------------------------------------------------------
// config.toml 读写（原 `dD`/`fD`/`pD`/`ake`）
// ---------------------------------------------------------------------------

function browserConfigPath(home: string): string {
  return join(home, BROWSER_CONFIG_FILENAME);
}

async function readBrowserConfig(home: string): Promise<Record<string, any>> {
  const path = browserConfigPath(home);
  if (!existsSync(path)) return {};
  try {
    const parsed = parseToml(await readFile(path, "utf8"));
    return isPlainObject(parsed) ? (parsed as Record<string, any>) : {};
  } catch (error) {
    originStateLogger.warning("browser_use_origin_state_parse_failed", {
      safe: {},
      sensitive: { error, filePath: path },
    });
    return {};
  }
}

// existsSync 由顶部 watch 同文件引入（node:fs）。
import { existsSync } from "node:fs";

async function writeBrowserConfig(home: string, config: Record<string, any>): Promise<void> {
  const path = browserConfigPath(home);
  await mkdir(dirname(path), { recursive: true });
  const serialized = stringifyToml(config);
  await writeFile(
    path,
    serialized.endsWith("\n") ? serialized : `${serialized}\n`,
    "utf8",
  );
}

// ---------------------------------------------------------------------------
// 规则更新引擎（原 `rke`/`uD`/`ike`/`hD`）
// ---------------------------------------------------------------------------

function rulesSectionFor(config: Record<string, any>, sectionKey: string): Record<string, any> {
  if (isPlainObject(config[sectionKey])) return config[sectionKey] as Record<string, any>;
  const section: Record<string, any> = {};
  config[sectionKey] = section;
  return section;
}

function oppositeKind(kind: string): string {
  return oppositeBrowserUseRuleKind(kind);
}

/** 单条规则的矩阵更新（原 `rke`）：add 互斥写入，remove 仅本 kind。 */
function applyRuleUpdate(config: Record<string, any>, update: { action: string; kind: string; origin: string; resource: OriginResource }): boolean {
  const { action, kind, origin } = update;
  const sectionKey = RESOURCE_KINDS[update.resource];
  if (action === "add") {
    const section = rulesSectionFor(config, sectionKey);
    const current = dedupeStrings(section[kind]);
    const opposite = dedupeStrings(section[oppositeKind(kind)]);
    section[kind] = current.includes(origin) ? current : [...current, origin];
    section[oppositeKind(kind)] = opposite.filter((entry) => entry !== origin);
    return !current.includes(origin) || opposite.includes(origin);
  }
  const section = config[sectionKey];
  if (!isPlainObject(section)) return false;
  const current = dedupeStrings(section[kind]);
  return current.includes(origin) ? ((section[kind] = current.filter((entry) => entry !== origin)), true) : false;
}

/** 当前规则决策（原 `hD`）：denied 优先。 */
function ruleDecisionFor(config: Record<string, any>, resource: OriginResource, origin: string): "allow" | "deny" | null {
  const section = config[RESOURCE_KINDS[resource]];
  return stringSetHas(section, "denied", origin) ? "deny" : stringSetHas(section, "allowed", origin) ? "allow" : null;
}

function stringSetHas(section: unknown, kind: string, origin: string): boolean {
  return isPlainObject(section) && dedupeStrings(section[kind]).includes(origin);
}

/** add 前的 origin 规范化（原 `ike`）：已有精确匹配优先，否则规范化。 */
function resolveOriginForAdd(config: Record<string, any>, resource: OriginResource, origin: string): string {
  const section = config[RESOURCE_KINDS[resource]];
  if (isPlainObject(section) && (dedupeStrings(section.allowed).includes(origin) || dedupeStrings(section.denied).includes(origin)))
    return origin;
  const normalized = normalizeOrigin(origin);
  if (normalized == null) throw new Error("Invalid Browser Use origin");
  return normalized;
}

/** 批量规则更新（原 `uD`）：返回远端 rule_updates（决策变化）或 null。 */
function computeRuleUpdates(config: Record<string, any>, updates: Array<{ action: string; kind: string; origin: string; resource: OriginResource }>): Array<{ resource: string; pattern: string; decision: "allow" | "deny" | null }> | null {
  const resolved = updates.map((update) => ({
    ...update,
    origin: update.action === "add" ? resolveOriginForAdd(config, update.resource, update.origin) : update.origin,
  }));
  const beforeDecisions = resolved.map(({ resource, origin }) => ({ resource, origin, decision: ruleDecisionFor(config, resource, origin) }));
  let changed = false;
  for (const update of resolved) changed = applyRuleUpdate(config, update) || changed;
  if (!changed) return null;
  const remoteUpdates: Array<{ resource: string; pattern: string; decision: "allow" | "deny" | null }> = [];
  for (const { resource, origin, decision } of beforeDecisions) {
    const after = ruleDecisionFor(config, resource, origin);
    if (decision !== after)
      remoteUpdates.push({ resource: resource === "fullCdp" ? "full_cdp" : resource, pattern: origin, decision: after });
  }
  return remoteUpdates;
}

// ---------------------------------------------------------------------------
// 投影（原 `mD`/`gD`/`yD`/`vD`/`bD`/`_D`）
// ---------------------------------------------------------------------------

function approvalModeOf(value: unknown): "neverAsk" | "alwaysAsk" {
  return value === "never_ask" ? "neverAsk" : "alwaysAsk";
}

function historyApprovalModeOf(value: unknown): "disabled" | "neverAsk" | "alwaysAsk" {
  switch (value) {
    case "disabled":
      return "disabled";
    case "never_ask":
      return "neverAsk";
    case "always_ask":
      return "alwaysAsk";
    default:
      return "alwaysAsk";
  }
}

function approvalModeToToml(value: string): "never_ask" | "always_ask" {
  return value === "neverAsk" ? "never_ask" : "always_ask";
}

function historyApprovalModeToToml(value: string): "disabled" | "never_ask" | "always_ask" {
  return value === "disabled" ? "disabled" : approvalModeToToml(value);
}

function kindSetOf(section: unknown, kind: string): string[] {
  return isPlainObject(section) ? dedupeStrings(section[kind]) : [];
}

/** config → 桌面模型投影（原 `mD`）。 */
function projectOriginState(config: Record<string, any>) {
  const origins = config.origins;
  return {
    fullCdpAccessEnabled: config[FULL_CDP_KEY] === true,
    ...(typeof config.webmcp_enabled == "boolean" ? { webMcpEnabled: config[WEBMCP_KEY] } : {}),
    approvalMode: approvalModeOf(config.approval_mode),
    chromeHistoryApprovalMode: historyApprovalModeOf(config.history_approval_mode),
    iabHistoryApprovalMode: historyApprovalModeOf(config.iab_history_approval_mode),
    downloadApprovalMode: approvalModeOf(config.download_approval_mode),
    uploadApprovalMode: approvalModeOf(config.upload_approval_mode),
    allowedOrigins: kindSetOf(origins, "allowed"),
    deniedOrigins: kindSetOf(origins, "denied"),
    allowedDownloadOrigins: kindSetOf(config.downloads, "allowed"),
    deniedDownloadOrigins: kindSetOf(config.downloads, "denied"),
    allowedUploadOrigins: kindSetOf(config.uploads, "allowed"),
    deniedUploadOrigins: kindSetOf(config.uploads, "denied"),
    allowedFullCdpOrigins: kindSetOf(config.full_cdp, "allowed"),
    deniedFullCdpOrigins: kindSetOf(config.full_cdp, "denied"),
  };
}

// ---------------------------------------------------------------------------
// 偏好写入（原 `lD`/`nke`/`$Oe`/`eke`/`tke`/`ZOe`/`QOe`）
// ---------------------------------------------------------------------------

type SyncSettingsCallback = ((payload: Record<string, unknown>, extra?: unknown) => Promise<boolean>) | ((thunk: () => Promise<Record<string, unknown> | null>) => Promise<boolean>);

/** 偏好写入门面（原 `lD`）：syncSettings 成功走远端，否则直写文件。 */
async function writePreference(
  preference: Record<string, unknown>,
  home: string,
  syncSettings?: SyncSettingsCallback,
  extra?: unknown,
) {
  if (await (syncSettings as ((payload: Record<string, unknown>, extra?: unknown) => Promise<boolean>) | undefined)?.({ preferences: preference }, extra))
    return readProjectedState(home);
  if (syncSettings == null && extra != null) await (extra as () => Promise<void>)();
  const config = await readBrowserConfig(home);
  Object.assign(config, preference);
  await writeBrowserConfig(home, config);
  return projectOriginState(config);
}

async function readProjectedState(home = codexHome()): Promise<ReturnType<typeof projectOriginState>> {
  return projectOriginState(await readBrowserConfig(home));
}

async function setApprovalMode(mode: string, home = codexHome(), syncSettings?: SyncSettingsCallback, extra?: unknown) {
  return writePreference({ approval_mode: approvalModeToToml(mode) }, home, syncSettings, extra);
}

async function setIabHistoryApprovalMode(mode: string, home = codexHome(), syncSettings?: SyncSettingsCallback, extra?: unknown) {
  return writePreference({ iab_history_approval_mode: historyApprovalModeToToml(mode) }, home, syncSettings, extra);
}

function transferApprovalModeKey(resource: "download" | "upload"): string {
  return resource === "download" ? "download_approval_mode" : "upload_approval_mode";
}

async function setTransferApprovalMode(resource: "download" | "upload", mode: string, home = codexHome(), syncSettings?: SyncSettingsCallback, extra?: unknown) {
  return writePreference({ [transferApprovalModeKey(resource)]: approvalModeToToml(mode) }, home, syncSettings, extra);
}

async function setFullCdpAccessEnabled(enabled: boolean, home = codexHome(), syncSettings?: SyncSettingsCallback) {
  return writePreference({ full_cdp_access_enabled: enabled }, home, syncSettings);
}

async function setWebMcpEnabled(enabled: boolean, home = codexHome(), syncSettings?: SyncSettingsCallback) {
  return writePreference({ webmcp_enabled: enabled }, home, syncSettings);
}

// ---------------------------------------------------------------------------
// BrowserUseOriginState（原 `XOe`）
// ---------------------------------------------------------------------------

const originStateLogger = createTaggedLogger("BrowserUseOriginState");

/** 全局持久审批的企业策略判定（原 `KOe`/`sD`）。 */
function isGlobalPersistentApprovalAllowed(requirements: unknown): boolean {
  return (requirements as { allowGlobalPersistentApproval?: boolean } | undefined)?.allowGlobalPersistentApproval !== false;
}

async function assertIabModeAllowedByPolicy(mode: string, getConfigRequirements: () => Promise<{ requirements: unknown }>) {
  if (mode !== "neverAsk") return;
  const { requirements } = await getConfigRequirements();
  if (!isGlobalPersistentApprovalAllowed((requirements as { browserUse?: unknown })?.browserUse))
    throw new Error("Global persistent Browser Use approvals are disabled by enterprise policy");
}

/** 来源规则/审批模式的本地+远端写入门面（原 `XOe`）。 */
class BrowserUseOriginState extends EventEmitterBase {
  codexHome: string;
  getConfigRequirements: () => Promise<{ requirements: unknown }>;
  syncSettings?: SyncSettingsCallback;

  constructor(
    home: string,
    getConfigRequirements: () => Promise<{ requirements: unknown }> = async () => {
      throw new Error("Config requirements are unavailable");
    },
    syncSettings?: SyncSettingsCallback,
  ) {
    super();
    this.codexHome = home;
    this.getConfigRequirements = getConfigRequirements;
    this.syncSettings = syncSettings;
  }

  async updateWebMcpEnabled(enabled: boolean) {
    return setWebMcpEnabled(enabled, this.codexHome, this.syncSettings);
  }

  async updateIabHistoryApprovalMode(mode: string) {
    return setIabHistoryApprovalMode(mode, this.codexHome, this.syncSettings, () =>
      assertIabModeAllowedByPolicy(mode, this.getConfigRequirements),
    );
  }

  async updateOriginRules(rules: Array<{ action: string; kind: string; origin: string; resource: string }>) {
    const updates = originRuleUpdateSchema.parse(rules) as Array<{ action: string; kind: string; origin: string; resource: OriginResource }>;
    if (
      await (this.syncSettings as ((thunk: () => Promise<Record<string, unknown> | null>) => Promise<boolean>) | undefined)?.(async () => {
        const config = await readBrowserConfig(this.codexHome);
        const ruleUpdates = computeRuleUpdates(config, updates);
        return ruleUpdates != null && ruleUpdates.length > 0 ? { rule_updates: ruleUpdates } : null;
      })
    )
      return readProjectedState(this.codexHome);
    const config = await readBrowserConfig(this.codexHome);
    if (computeRuleUpdates(config, updates) != null) await writeBrowserConfig(this.codexHome, config);
    return projectOriginState(config);
  }
}

// ---------------------------------------------------------------------------
// 远端设置 schema 与 API（原 `CD`/`wD`/`TD`/`ED`/`uke`）
// ---------------------------------------------------------------------------

const approvalModeSchema = enumSchema(["always_ask", "never_ask"]);
const historyApprovalModeSchema = enumSchema(["always_ask", "never_ask", "disabled"]);
const rulesMapSchema = (refineSchema((value) => typeof value == "object" && !!value && !Array.isArray(value)) as unknown as {
  transform(fn: (value: unknown) => unknown): { pipe(schema: unknown): { transform(fn: (value: unknown) => unknown): unknown } };
})
  .transform((value) => Object.entries(value))
  .pipe(arraySchema(tupleSchema([stringSchema(), enumSchema(["allow", "deny"])])))
  .transform((value) => Object.fromEntries(value as [string, string][]));

/** 远端浏览器设置（原 `ED`）。 */
const remoteBrowserSettingsSchema = objectSchema({
  revision: (numberSchema() as unknown as { int(): { nonnegative(): unknown } }).int().nonnegative(),
  preferences: objectSchema({
    approval_mode: approvalModeSchema,
    history_approval_mode: historyApprovalModeSchema,
    iab_history_approval_mode: historyApprovalModeSchema,
    download_approval_mode: approvalModeSchema,
    upload_approval_mode: approvalModeSchema,
    disable_auto_review: booleanSchema(),
    full_cdp_access_enabled: booleanSchema(),
    webmcp_enabled: booleanSchema(),
  }),
  rules: objectSchema({ origin: rulesMapSchema, download: rulesMapSchema, upload: rulesMapSchema, full_cdp: rulesMapSchema }),
});

type RemoteBrowserSettingsDocument = {
  revision: number;
  preferences: Record<string, unknown>;
  rules: Record<string, Record<string, "allow" | "deny">>;
};

const BROWSER_SETTINGS_ENDPOINT = "/wham/browser/settings";
const BROWSER_SETTINGS_TIMEOUT_MS = 15e3;

/** /wham/browser/settings 的乐观 revision 读改（原 `uke`）。 */
class RemoteBrowserSettings {
  fetchJson: (path: string, options: Record<string, unknown>) => Promise<Record<string, unknown>>;
  expectedPrincipal: unknown;

  constructor(fetchJson: RemoteBrowserSettings["fetchJson"], expectedPrincipal: unknown) {
    this.fetchJson = fetchJson;
    this.expectedPrincipal = expectedPrincipal;
  }

  async read(signal: AbortSignal): Promise<RemoteBrowserSettingsDocument> {
    return remoteBrowserSettingsSchema.parse(
      await this.fetchJson(BROWSER_SETTINGS_ENDPOINT, {
        expectedPrincipal: this.expectedPrincipal,
        signal: AbortSignal.any([signal, AbortSignal.timeout(BROWSER_SETTINGS_TIMEOUT_MS)]),
      }),
    ) as RemoteBrowserSettingsDocument;
  }

  async update(revision: number, changes: Record<string, unknown>, signal: AbortSignal): Promise<RemoteBrowserSettingsDocument> {
    return remoteBrowserSettingsSchema.parse(
      await this.fetchJson(BROWSER_SETTINGS_ENDPOINT, {
        method: "PATCH",
        body: { ...changes, expected_revision: revision },
        expectedPrincipal: this.expectedPrincipal,
        signal: AbortSignal.any([signal, AbortSignal.timeout(BROWSER_SETTINGS_TIMEOUT_MS)]),
      }),
    ) as RemoteBrowserSettingsDocument;
  }
}

// ---------------------------------------------------------------------------
// BrowserConfigFile（原 `pke`）：TOML 文件层
// ---------------------------------------------------------------------------

const RULE_SECTION_KEYS: Array<[string, string]> = [
  ["origin", "origins"],
  ["download", "downloads"],
  ["upload", "uploads"],
  ["full_cdp", "full_cdp"],
];

const allowDenySchema = (objectSchema({
  allowed: arraySchema(stringSchema()).default([]),
  denied: arraySchema(stringSchema()).default([]),
}) as unknown as { default(value: unknown): unknown }).default({ allowed: [], denied: [] });

/** rules map → allow/deny 列表（原 `AD`）。 */
function rulesMapToLists(section: unknown): Record<string, "allow" | "deny"> {
  const parsed = (allowDenySchema as unknown as { parse(input: unknown): { allowed: string[]; denied: string[] } }).parse(section);
  const result = new Map<string, "allow" | "deny">();
  for (const origin of parsed.allowed) result.set(origin, "allow");
  for (const origin of parsed.denied) result.set(origin, "deny");
  return Object.fromEntries(result);
}

/** 远端文档 → 本地 TOML 文档（原 `kD`）。 */
function remoteToLocalDocument(document: Record<string, any>): { preferences: Record<string, unknown>; rules: Record<string, Record<string, "allow" | "deny">> } {
  return {
    preferences: (remoteBrowserSettingsSchema as unknown as { shape: { preferences: { parse(input: unknown): Record<string, unknown> } } }).shape.preferences.parse({
      approval_mode: "always_ask",
      history_approval_mode: "always_ask",
      iab_history_approval_mode: "always_ask",
      download_approval_mode: "always_ask",
      upload_approval_mode: "always_ask",
      disable_auto_review: false,
      full_cdp_access_enabled: false,
      webmcp_enabled: true,
      ...document,
    }),
    rules: {
      origin: rulesMapToLists(document.origins),
      download: rulesMapToLists(document.downloads),
      upload: rulesMapToLists(document.uploads),
      full_cdp: rulesMapToLists(document.full_cdp),
    },
  };
}

function isTomlTable(value: unknown): value is Record<string, unknown> {
  return typeof value == "object" && !!value && !Array.isArray(value) && !(value instanceof Date);
}

/** browser/config.toml 的文件层（原 `pke`）：原子写（tmp+rename，mode 0600）。 */
class BrowserConfigFile {
  path: string;

  constructor(home: string) {
    this.path = join(home, BROWSER_CONFIG_FILENAME);
  }

  async read(): Promise<{ preferences: Record<string, unknown>; rules: Record<string, Record<string, "allow" | "deny">> } | null> {
    const document = await this.readDocument();
    return document == null ? null : remoteToLocalDocument(document.document as Record<string, any>);
  }

  async write(settings: { preferences: Record<string, unknown>; rules: Record<string, Record<string, "allow" | "deny">> }, signal?: AbortSignal) {
    signal?.throwIfAborted();
    const existing = await this.readDocument();
    const base = (existing?.document ?? {}) as Record<string, unknown>;
    const ruleSections = Object.fromEntries(
      RULE_SECTION_KEYS.map(([localKey, fileKey]) => {
        const entries = Object.entries(settings.rules[localKey]);
        const section = base[fileKey];
        return [
          fileKey,
          {
            ...(isTomlTable(section) ? section : {}),
            allowed: entries.filter(([, decision]) => decision === "allow").map(([origin]) => origin),
            denied: entries.filter(([, decision]) => decision === "deny").map(([origin]) => origin),
          },
        ];
      }),
    );
    const serialized = stringifyToml({
      ...base,
      ...((remoteBrowserSettingsSchema as unknown as { shape: { preferences: { parse(input: unknown): object } } }).shape.preferences.parse(settings.preferences) as object),
      ...ruleSections,
    });
    const content = serialized.endsWith("\n") ? serialized : `${serialized}\n`;
    if (content === existing?.content) {
      signal?.throwIfAborted();
      return;
    }
    await mkdir(dirname(this.path), { recursive: true });
    const tempPath = `${this.path}.${randomUUID()}.tmp`;
    try {
      await writeFile(tempPath, content, { encoding: "utf8", mode: 0o600, signal });
      signal?.throwIfAborted();
      await rename(tempPath, this.path);
    } finally {
      await rm(tempPath, { force: true });
    }
  }

  private async readDocument(): Promise<{ content: string; document: unknown } | null> {
    try {
      const content = await readFile(this.path, "utf8");
      return { content, document: parseToml(content, { integersAsBigInt: true }) };
    } catch (error) {
      if (error instanceof Error && "code" in error && (error as { code?: string }).code === "ENOENT") return null;
      throw error;
    }
  }
}

// ---------------------------------------------------------------------------
// BrowserSettingsSync（原 `_ke`）
// ---------------------------------------------------------------------------

const SYNC_INTERVAL_MS = 60e3;
const FILE_CHANGE_DEBOUNCE_MS = 200;
const RULE_RESOURCES = ["origin", "download", "upload", "full_cdp"] as const;

interface SyncOptions {
  configFile: BrowserConfigFile;
  createApi(principal: unknown): RemoteBrowserSettings;
  getAuthenticatedPrincipal(): Promise<unknown>;
  isEnabled(): boolean;
  onSettingsChanged(): void;
}

function isSamePrincipal(a: { accountId: string; userId: string }, b: { accountId: string; userId: string }): boolean {
  return a.accountId === b.accountId && a.userId === b.userId;
}

/** 两份设置的差分（原 `ND`）：无差异返回 null。 */
function settingsDiff(before: RemoteBrowserSettingsDocument, after: RemoteBrowserSettingsDocument): { preferences?: Record<string, unknown>; rule_updates?: Array<{ resource: string; pattern: string; decision: "allow" | "deny" | null }> } | null {
  const preferences: Record<string, unknown> = {};
  for (const key of (remoteBrowserSettingsSchema as unknown as { shape: { preferences: { keyof(): { options: string[] } } } }).shape.preferences.keyof().options)
    if ((before.preferences as Record<string, unknown>)[key] !== (after.preferences as Record<string, unknown>)[key])
      Object.assign(preferences, { [key]: (after.preferences as Record<string, unknown>)[key] });
  const ruleUpdates: Array<{ resource: string; pattern: string; decision: "allow" | "deny" | null }> = [];
  for (const resource of RULE_RESOURCES) {
    const beforeRules = new Map(Object.entries(before.rules[resource]));
    const afterRules = new Map(Object.entries(after.rules[resource]));
    for (const pattern of new Set([...beforeRules.keys(), ...afterRules.keys()]))
      if (beforeRules.get(pattern) !== afterRules.get(pattern))
        ruleUpdates.push({ resource, pattern, decision: afterRules.get(pattern) ?? null });
  }
  return Object.keys(preferences).length === 0 && ruleUpdates.length === 0
    ? null
    : {
        preferences: Object.keys(preferences).length === 0 ? undefined : preferences,
        rule_updates: ruleUpdates.length === 0 ? undefined : ruleUpdates,
      };
}

/** 远端快照 + 本地差分合并（原 `vke`）。 */
function mergeIntoSnapshot(snapshot: RemoteBrowserSettingsDocument, localDiff: { preferences?: Record<string, unknown>; rule_updates?: Array<{ resource: string; pattern: string; decision: "allow" | "deny" | null }> }): RemoteBrowserSettingsDocument {
  const merged = structuredClone(snapshot);
  Object.assign(merged.preferences, localDiff.preferences);
  for (const resource of RULE_RESOURCES) {
    const rules = new Map(Object.entries(merged.rules[resource]));
    for (const update of localDiff.rule_updates ?? [])
      if (update.resource === resource) update.decision == null ? rules.delete(update.pattern) : rules.set(update.pattern, update.decision);
    merged.rules[resource] = Object.fromEntries(rules) as Record<string, "allow" | "deny">;
  }
  return merged;
}

/** 远端 ↔ 本地 config.toml 的双向同步（原 `_ke`）。 */
class BrowserSettingsSync {
  options: SyncOptions;
  logger: Logger = createTaggedLogger("BrowserSettingsSync");
  scope: { principal: { accountId: string; userId: string }; controller: AbortController; api: RemoteBrowserSettings } | null = null;
  projection: { principal: { accountId: string; userId: string }; snapshot: RemoteBrowserSettingsDocument } | null = null;
  generation = 0;
  queue = Promise.resolve();
  watcher: ReturnType<typeof watch> | null = null;
  refreshTimer: ReturnType<typeof setInterval> | null = null;
  fileChangeTimer: ReturnType<typeof setTimeout> | null = null;
  refreshQueued = false;
  fileSyncQueued = false;
  disposed = false;

  constructor(options: SyncOptions) {
    this.options = options;
  }

  start() {
    if (this.refreshTimer != null || this.disposed) return;
    this.refreshTimer = setInterval(() => this.requestRefresh(), SYNC_INTERVAL_MS);
    (this.refreshTimer as ReturnType<typeof setInterval> & { unref(): void }).unref();
    this.requestRefresh();
  }

  requestRefresh() {
    if (this.options.isEnabled() || this.invalidateScope(), !(this.refreshQueued || this.disposed)) {
      this.refreshQueued = true;
      this.enqueue(async () => {
        this.refreshQueued = false;
        await this.synchronize();
      }).catch((error) => this.logBackgroundError(error));
    }
  }

  refresh() {
    return this.enqueue(() => this.synchronize());
  }

  /** 带账号守卫的设置更新（原 `update`）。 */
  update(changes: Record<string, unknown> | (() => Promise<Record<string, unknown> | null>), onAccountChange?: () => Promise<void>) {
    const generation = this.generation;
    return this.enqueue(async () => {
      this.assertGeneration(generation);
      const wasEnabled = this.options.isEnabled();
      const scope = await this.getScope();
      if ((this.assertGeneration(generation), scope == null)) {
        if (onAccountChange != null) {
          await onAccountChange();
          this.assertGeneration(generation);
          if (this.options.isEnabled() !== wasEnabled)
            throw new DOMException("Browser settings account changed", "AbortError");
        }
        return false;
      }
      await this.initialize(scope);
      await this.uploadFileChanges(scope);
      if (onAccountChange != null) {
        await onAccountChange();
        this.assertActive(scope);
      }
      const patch = typeof changes == "function" ? await changes() : changes;
      this.assertActive(scope);
      if (patch != null) await this.patch(scope, patch, this.getSnapshot(scope));
      return true;
    });
  }

  principalChanged(principal: { accountId: string; userId: string } | null) {
    if (principal != null && this.projection != null && !isSamePrincipal(this.projection.principal, principal)) this.logout();
    else if (this.scope == null || principal == null || !isSamePrincipal(this.scope.principal, principal)) {
      this.generation++;
      this.invalidateScope();
    }
    this.requestRefresh();
  }

  logout() {
    const hadProjection = this.projection != null;
    this.generation++;
    this.invalidateScope();
    this.projection = null;
    if (hadProjection)
      this.enqueue(async () => {
        if (this.projection == null) {
          await this.options.configFile.write(remoteToLocalDocument({}));
          this.options.onSettingsChanged();
        }
      }).catch((error) => this.logBackgroundError(error));
  }

  dispose() {
    this.disposed = true;
    this.generation++;
    this.invalidateScope();
    if (this.refreshTimer != null) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const chained = this.queue.then(operation);
    this.queue = chained.then(
      () => void 0,
      () => void 0,
    );
    return chained;
  }

  private async getScope() {
    if (this.disposed || !this.options.isEnabled()) return (this.invalidateScope(), null);
    const generation = this.generation;
    const principal = await this.options.getAuthenticatedPrincipal();
    if ((this.assertGeneration(generation), !this.options.isEnabled()))
      throw new DOMException("Browser settings account changed", "AbortError");
    if (principal == null) return (this.scope != null && this.generation++, this.invalidateScope(), null);
    if (this.scope != null && isSamePrincipal(this.scope.principal, principal as never)) return this.scope;
    const previousPrincipal = this.scope?.principal ?? this.projection?.principal;
    if (previousPrincipal != null && !isSamePrincipal(previousPrincipal, principal as never)) {
      this.generation++;
      this.invalidateScope();
    }
    const scope = { principal: principal as never, controller: new AbortController(), api: this.options.createApi(principal) };
    this.scope = scope;
    if (this.projection != null && !isSamePrincipal(this.projection.principal, principal as never)) {
      await this.options.configFile.write(remoteToLocalDocument({}), scope.controller.signal);
      this.assertActive(scope);
      this.projection = null;
      this.options.onSettingsChanged();
    }
    return scope;
  }

  private async initialize(scope: NonNullable<BrowserSettingsSync["scope"]>) {
    if (this.getSnapshot(scope) != null) return;
    const remote = await scope.api.read(scope.controller.signal);
    await this.project(scope, remote, remote, null);
  }

  private async synchronize() {
    const scope = await this.getScope();
    if (scope == null) return;
    const snapshot = this.getSnapshot(scope);
    if (snapshot == null) {
      await this.initialize(scope);
      return;
    }
    if (await this.uploadFileChanges(scope)) return;
    const remote = await scope.api.read(scope.controller.signal);
    this.assertActive(scope);
    const local = await this.options.configFile.read();
    if ((this.assertActive(scope), local != null && settingsDiff(snapshot, local as never) != null)) {
      await this.uploadFileChanges(scope);
      return;
    }
    await this.project(scope, remote, remote, local);
  }

  private async uploadFileChanges(scope: NonNullable<BrowserSettingsSync["scope"]>) {
    const snapshot = this.getSnapshot(scope);
    if (snapshot == null) return false;
    const local = await this.options.configFile.read();
    if ((this.assertActive(scope), local == null)) return false;
    const diff = settingsDiff(snapshot, local as never);
    return diff != null && (await this.patch(scope, diff, local as never), true);
  }

  private async patch(scope: NonNullable<BrowserSettingsSync["scope"]>, changes: Record<string, unknown>, expectedLocal: unknown) {
    const snapshot = this.getSnapshot(scope);
    if (snapshot == null) throw new Error("Browser settings have not been synchronized");
    this.assertActive(scope);
    let updated: RemoteBrowserSettingsDocument;
    try {
      updated = await scope.api.update(snapshot.revision, changes, scope.controller.signal);
    } catch (error) {
      this.assertActive(scope);
      // 409：远端已被他人更新，重读后由调用方决定是否重试。
      if (error instanceof AuthenticatedDesktopFetchError && error.status === 409) {
        const remote = await scope.api.read(scope.controller.signal);
        await this.project(scope, remote, remote, null);
      }
      throw error;
    }
    this.assertActive(scope);
    const local = await this.options.configFile.read();
    this.assertActive(scope);
    const localDiff = expectedLocal != null && local != null ? settingsDiff(expectedLocal as never, local as never) : null;
    await this.project(scope, updated, localDiff == null ? updated : mergeIntoSnapshot(updated, localDiff), local);
    if (localDiff != null) this.requestFileSync();
  }

  private async project(scope: NonNullable<BrowserSettingsSync["scope"]>, snapshot: RemoteBrowserSettingsDocument, settings: { preferences: Record<string, unknown>; rules: Record<string, Record<string, "allow" | "deny">>; revision?: number }, existingLocal: Awaited<ReturnType<BrowserConfigFile["read"]>>) {
    this.assertActive(scope);
    const shouldWrite = existingLocal == null || settingsDiff(existingLocal as never, settings as never) != null;
    if (shouldWrite) {
      await this.options.configFile.write(settings, scope.controller.signal);
      this.assertActive(scope);
    }
    this.projection = { principal: scope.principal, snapshot };
    this.ensureWatcher();
    if (shouldWrite) this.options.onSettingsChanged();
  }

  private assertActive(scope: NonNullable<BrowserSettingsSync["scope"]>) {
    if (
      scope.controller.signal.throwIfAborted(),
      this.disposed || this.scope !== scope || !this.options.isEnabled()
    )
      throw new DOMException("Browser settings account changed", "AbortError");
  }

  private assertGeneration(generation: number) {
    if (this.disposed || generation !== this.generation)
      throw new DOMException("Browser settings account changed", "AbortError");
  }

  private getSnapshot(scope: NonNullable<BrowserSettingsSync["scope"]>): RemoteBrowserSettingsDocument | null {
    return this.projection != null && isSamePrincipal(this.projection.principal, scope.principal)
      ? this.projection.snapshot
      : null;
  }

  private invalidateScope() {
    this.scope?.controller.abort();
    this.scope = null;
    this.watcher?.close();
    this.watcher = null;
    if (this.fileChangeTimer != null) {
      clearTimeout(this.fileChangeTimer);
      this.fileChangeTimer = null;
    }
  }

  private ensureWatcher() {
    if (this.refreshTimer == null || this.watcher != null) return;
    const configPath = this.options.configFile.path;
    this.watcher = watch(dirname(configPath), { persistent: false }, (_event, filename) => {
      if (filename == null || filename === basename(configPath)) {
        if (this.fileChangeTimer != null) clearTimeout(this.fileChangeTimer);
        this.fileChangeTimer = setTimeout(() => {
          this.fileChangeTimer = null;
          this.requestFileSync();
        }, FILE_CHANGE_DEBOUNCE_MS);
        (this.fileChangeTimer as ReturnType<typeof setTimeout> & { unref(): void }).unref();
      }
    });
    this.watcher.on("error", (error) => {
      this.watcher?.close();
      this.watcher = null;
      this.logBackgroundError(error);
    });
  }

  private requestFileSync() {
    if (this.fileSyncQueued || this.disposed) return;
    this.fileSyncQueued = true;
    this.enqueue(async () => {
      this.fileSyncQueued = false;
      const scope = await this.getScope();
      if (scope != null) await this.uploadFileChanges(scope);
    }).catch((error) => this.logBackgroundError(error));
  }

  private logBackgroundError(error: unknown) {
    if (error instanceof Error && error.name === "AbortError") return;
    this.logger.warning("browser_settings_sync_failed", {
      safe: { status: error instanceof AuthenticatedDesktopFetchError ? error.status : undefined },
      sensitive: { error },
    });
  }
}

export {
  BrowserUseOriginState,
  RemoteBrowserSettings,
  BrowserConfigFile,
  BrowserSettingsSync,
  settingsDiff,
  mergeIntoSnapshot,
  remoteToLocalDocument,
  normalizeOrigin,
  readProjectedState,
  setApprovalMode,
  setIabHistoryApprovalMode,
  setTransferApprovalMode,
  setFullCdpAccessEnabled,
  setWebMcpEnabled,
  type RemoteBrowserSettingsDocument,
};
