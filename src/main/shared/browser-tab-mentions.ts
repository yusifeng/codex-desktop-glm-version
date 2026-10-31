// shared chunk：浏览器族配置与 tab mention（browser-tab-mentions 分区，
// settings-threads 子区）。
//
// 对应 src-DldfpmrL.ts 的 L18,465-19,068 区段：
//   - cS（Kc）：无孤立代理项的字符串判定（UTF-16 合法性）
//   - uS（Vc）：浏览器插件描述符（browser@openai-bundled、
//     hostedBrowser@openai-curated-remote、chrome/chrome-dev/
//     chrome-internal@openai-bundled）
//   - dS/fS/pS：mention=tab-v1 + URL 参数序；mS：序列化上限
//     12×(128+1024+4096+16384+128)
//   - xS：tab mention 校验（browserId ≤128/tabId ≤1024/title ≤4096/
//     url ≤16384、source extension|iab、pluginId 白名单、快照纯对象）
//   - vS：plugin:// 序列化；bS（Gc）：反序列化（参数序严格 + 往返一致）
//   - yS（Hc）：批量预算 1MiB；_S（Wc）：dedupe key
//   - eC（Nc）：候选去重 + query 过滤（≤100）；tC（Mc）：空 query 3 条
//     否则 100
//   - MS/NS/PS/FS/zS：扩展分发表（chrome-web-store beta/stable、
//     edge add-ons、managed-self-hosted dev/beta/stable）
//   - BS（Pc）：五浏览器配置表（chrome/edge/brave/opera/vivaldi——
//     displayName/图标/UA 标识/internalUrlSchemes/扩展管理 URL/
//     linux|macos|windows 安装与 NativeMessaging 路径）
//   - XS（Bc）：族存在判定；YS（Ic）：ProgId → 族；
//     US（Rc）：channel → 扩展 id 集；GS（Lc）：分发查找；
//     qS（zc）：store 分发；JS（Fc）：store URL
//
// 兼容导出：Kc/Vc/Rc/zc/Fc/Lc/Pc/Bc/Ic/Nc/Mc/Wc/Hc/Gc。

import { z } from "zod";

// ---------------------------------------------------------------------------
// 字符串合法性（原 `cS`）
// ---------------------------------------------------------------------------

/** 无孤立代理项判定（原 `cS`，导出 `Kc`）。 */
export function hasValidUnicode(text: string): boolean {
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = text.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// 浏览器插件描述符（原 `uS`）
// ---------------------------------------------------------------------------

/** 浏览器插件描述符（原 `uS`，导出 `Vc`）。 */
export const BROWSER_PLUGIN_DESCRIPTORS = {
  browser: "browser@openai-bundled",
  hostedBrowser: "browser@openai-curated-remote",
  chrome: "chrome@openai-bundled",
  chromeDev: "chrome-dev@openai-bundled",
  chromeInternal: "chrome-internal@openai-bundled",
} as const;

/** Browser page kinds used by IAB snapshots (原 `tb`，导出 `lu`)。 */
export const BROWSER_TAB_TYPES = { NEW_TAB_PAGE: "new-tab-page", WEB: "web" } as const;

// ---------------------------------------------------------------------------
// 尺寸常量与校验（原 `rS`..`xS`）
// ---------------------------------------------------------------------------

const BROWSER_ID_MAX = 128;
const TAB_ID_MAX = 1024;
const TITLE_MAX = 4096;
const URL_MAX = 16384;
const MENTION_SERIALIZED_MAX = 12 * (BROWSER_ID_MAX + TAB_ID_MAX + TITLE_MAX + URL_MAX + BROWSER_ID_MAX);

/** mention 标记（原 `dS`）。 */
const TAB_MENTION_MARKER = "tab-v1";

/** URL 参数序（原 `fS`/`pS`）。 */
const MENTION_PARAMS = ["mention", "browserId", "tabId", "title", "url"] as const;
const MENTION_PARAMS_WITH_SOURCE = ["mention", "source", "browserId", "tabId", "title", "url"] as const;

/** tab mention。 */
export interface BrowserTabMention {
  browserId: string;
  pluginId: string;
  source: "extension" | "iab";
  tabId: string;
  snapshot: { title: string; url: string };
}

/** favicon data URL 校验（原 `oS`）。 */
export function parseFaviconDataUrl(value: string): string | null {
  return typeof value == "string" &&
    value.length <= URL_MAX &&
    /^data:image\/(?:avif|bmp|gif|jpeg|png|webp|x-icon|vnd\.microsoft\.icon);base64,[A-Za-z0-9+/]+={0,2}$/.test(value) &&
    value.slice(value.indexOf(",") + 1).length % 4 == 0
    ? value
    : null;
}

/** Case-insensitive all-token query match across tab title and URL (原 `sS`，导出 `qc`)。 */
export function matchesBrowserTabQuery(snapshot: { title: string; url: string }, query: string): boolean {
  const haystack = `${snapshot.title}\n${snapshot.url}`.toLowerCase();
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean).every((token) => haystack.includes(token));
}

/** 短字符串校验（原 `SS`/`CS`）。 */
function boundedText(value: unknown, max: number): string | null {
  return typeof value == "string" && value.length <= max && value.trim().length > 0 && hasValidUnicode(value) ? value : null;
}

/** 快照纯对象化（原 `AS`）。 */
function plainObject(value: unknown): Record<string, unknown> | null {
  return typeof value == "object" && value && !Array.isArray(value) ? Object.fromEntries(Object.entries(value)) : null;
}

/** 键白名单判定（原 `jS`）。 */
function keysWithin(value: Record<string, unknown>, allowed: string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

/** 快照校验（原 `OS`）。 */
function validSnapshot(snapshot: unknown): { title: string; url: string } | null {
  const object = plainObject(snapshot);
  if (object == null || !keysWithin(object, ["title", "url"])) return null;
  const title = typeof object.title == "string" && object.title.length <= TITLE_MAX && hasValidUnicode(object.title) ? object.title : null;
  const url = typeof object.url == "string" && object.url.length <= URL_MAX && hasValidUnicode(object.url) ? object.url : null;
  if (title == null || url == null) return null;
  const result = { title, url };
  return displayTextOf(result).length > 0 ? result : null;
}

/** 展示文本（原 `gS`：title 空则用 url）。 */
function displayTextOf(snapshot: { title: string; url: string }): string {
  const title = snapshot.title.replace(/[\r\n]+/g, " ").trim();
  return title.length > 0 ? title : snapshot.url.replace(/[\r\n]+/g, " ").trim();
}

/** source 校验（原 `wS`）。 */
function validSource(source: unknown): "extension" | "iab" | null {
  return source === "extension" || source === "iab" ? source : null;
}

/** pluginId 校验（原 `ES`/`DS`）。 */
function validPluginId(pluginId: unknown, source: "extension" | "iab" | null): string | null {
  if (pluginId === BROWSER_PLUGIN_DESCRIPTORS.browser) return pluginId;
  if (source === "extension") {
    switch (pluginId) {
      case BROWSER_PLUGIN_DESCRIPTORS.hostedBrowser:
      case BROWSER_PLUGIN_DESCRIPTORS.chrome:
      case BROWSER_PLUGIN_DESCRIPTORS.chromeDev:
      case BROWSER_PLUGIN_DESCRIPTORS.chromeInternal:
        return pluginId;
    }
  }
  return null;
}

/** tab mention 校验（原 `xS`）。 */
export function parseBrowserTabMention(input: unknown): BrowserTabMention | null {
  const object = plainObject(input);
  if (object == null || !keysWithin(object, ["browserId", "pluginId", "source", "tabId", "snapshot"])) return null;
  const browserId = boundedText(object.browserId, BROWSER_ID_MAX);
  const source = validSource(object.source);
  const pluginId = validPluginId(object.pluginId, source);
  const tabId = boundedText(object.tabId, TAB_ID_MAX);
  const snapshot = validSnapshot(object.snapshot);
  return browserId == null || pluginId == null || source == null || tabId == null || snapshot == null
    ? null
    : { browserId, pluginId, source, tabId, snapshot };
}

/** Browser tab candidate schema (原 `hS`，导出 `Uc`)。 */
export const browserTabMentionSchema = z.custom<BrowserTabMention>((input) => parseBrowserTabMention(input) != null);

// ---------------------------------------------------------------------------
// 序列化（原 `TS`/`vS`/`bS`/`yS`/`_S`）
// ---------------------------------------------------------------------------

/** 前缀解析（原 `TS`）。 */
function parsePluginPrefix(url: string): { pluginId: string; source: "extension" | "iab" } | null {
  const browserPrefix = `plugin://${BROWSER_PLUGIN_DESCRIPTORS.browser}?`;
  if (url.startsWith(browserPrefix)) {
    const params = new URLSearchParams(url.slice(browserPrefix.length));
    return { pluginId: BROWSER_PLUGIN_DESCRIPTORS.browser, source: params.get("source") === "extension" ? "extension" : "iab" };
  }
  if (url.startsWith(`plugin://${BROWSER_PLUGIN_DESCRIPTORS.chrome}?`)) return { pluginId: BROWSER_PLUGIN_DESCRIPTORS.chrome, source: "extension" };
  if (url.startsWith(`plugin://${BROWSER_PLUGIN_DESCRIPTORS.hostedBrowser}?`)) return { pluginId: BROWSER_PLUGIN_DESCRIPTORS.hostedBrowser, source: "extension" };
  if (url.startsWith(`plugin://${BROWSER_PLUGIN_DESCRIPTORS.chromeDev}?`)) return { pluginId: BROWSER_PLUGIN_DESCRIPTORS.chromeDev, source: "extension" };
  if (url.startsWith(`plugin://${BROWSER_PLUGIN_DESCRIPTORS.chromeInternal}?`)) return { pluginId: BROWSER_PLUGIN_DESCRIPTORS.chromeInternal, source: "extension" };
  return null;
}

/** 序列化（原 `vS`）。 */
export function serializeBrowserTabMention(mention: BrowserTabMention): string {
  const validated = parseBrowserTabMention(mention);
  if (validated == null) throw new TypeError("Invalid browser tab mention");
  const params = new URLSearchParams();
  params.set("mention", TAB_MENTION_MARKER);
  if (validated.pluginId === BROWSER_PLUGIN_DESCRIPTORS.browser && validated.source === "extension") params.set("source", "extension");
  params.set("browserId", validated.browserId);
  params.set("tabId", validated.tabId);
  params.set("title", validated.snapshot.title);
  params.set("url", validated.snapshot.url);
  const serialized = `plugin://${validated.pluginId}?${params.toString()}`;
  if (serialized.length > MENTION_SERIALIZED_MAX) throw new TypeError("Serialized browser tab mention exceeds its size limit");
  return serialized;
}

/**
 * 反序列化（原 `bS`，导出 `Gc`）。
 * 参数序严格 + 往返一致才接受。
 */
export function deserializeBrowserTabMention(url: unknown): BrowserTabMention | null {
  if (typeof url != "string" || url.length > MENTION_SERIALIZED_MAX) return null;
  const prefix = parsePluginPrefix(url);
  if (prefix == null) return null;
  const base = `plugin://${prefix.pluginId}?`;
  try {
    const params = new URLSearchParams(url.slice(base.length));
    const keys = [...params.keys()];
    const expected = prefix.pluginId === BROWSER_PLUGIN_DESCRIPTORS.browser && prefix.source === "extension" ? MENTION_PARAMS_WITH_SOURCE : MENTION_PARAMS;
    if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index]) || params.get("mention") !== TAB_MENTION_MARKER)
      return null;
    const mention = parseBrowserTabMention({
      browserId: params.get("browserId"),
      pluginId: prefix.pluginId,
      source: prefix.source,
      tabId: params.get("tabId"),
      snapshot: { title: params.get("title"), url: params.get("url") },
    });
    return mention != null && serializeBrowserTabMention(mention) === url ? mention : null;
  } catch {
    return null;
  }
}

/** 批量预算 1MiB（原 `yS`，导出 `Hc`）。 */
export function mentionsWithinBudget(mentions: BrowserTabMention[]): boolean {
  let total = 0;
  for (const mention of mentions) {
    total += serializeBrowserTabMention(mention).length;
    if (total > 1_048_576) return false;
  }
  return true;
}

/** dedupe key（原 `_S`，导出 `Wc`）。 */
export function tabDedupeKey(mention: BrowserTabMention): string {
  return JSON.stringify(["browser-tab", mention.source, mention.browserId, mention.tabId]);
}

// ---------------------------------------------------------------------------
// 候选去重（原 `eC`/`tC`/`nC`/`rC`/`sS`）
// ---------------------------------------------------------------------------

/** query 匹配（原 `sS`：title\nurl 全词包含）。 */
function snapshotMatchesQuery(snapshot: { title: string; url: string }, query: string): boolean {
  const haystack = `${snapshot.title}\n${snapshot.url}`.toLowerCase();
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

/** 候选比较（原 `nC`：recency 降序 + 七字段字典序）。 */
function compareCandidates(a: CandidateMention, b: CandidateMention): number {
  if (a.recency !== b.recency) return a.recency > b.recency ? -1 : 1;
  const chain: [string, string][] = [
    [a.source, b.source],
    [a.pluginId, b.pluginId],
    [a.browserId, b.browserId],
    [a.tabId, b.tabId],
    [a.snapshot.title, b.snapshot.title],
    [a.snapshot.url, b.snapshot.url],
    [a.faviconUrl ?? "", b.faviconUrl ?? ""],
  ];
  for (const [left, right] of chain) {
    if (left !== right) return left < right ? -1 : 1;
  }
  return 0;
}

/** 候选形态（含 recency/favicon）。 */
export interface CandidateMention extends BrowserTabMention {
  recency: number;
  faviconUrl?: string | null;
}

/** 去重 + 过滤（原 `eC`，导出 `Nc`；≤100）。 */
export function dedupeTabCandidates(candidates: CandidateMention[], query = ""): CandidateMention[] {
  const seen = new Set<string>();
  const result: CandidateMention[] = [];
  for (const candidate of [...candidates].sort(compareCandidates)) {
    const key = tabDedupeKey(candidate);
    if (!seen.has(key)) {
      seen.add(key);
      if (snapshotMatchesQuery(candidate.snapshot, query)) {
        result.push(candidate);
        if (result.length === 100) break;
      }
    }
  }
  return result;
}

/** 候选上限（原 `tC`，导出 `Mc`：空 query 3，否则 100）。 */
export function candidateLimitForQuery(query: string): number {
  return query.trim().length === 0 ? 3 : 100;
}

// ---------------------------------------------------------------------------
// 扩展分发（原 `MS`/`NS`/`PS`/`FS`/`zS`/`IS`/`LS`/`RS`）
// ---------------------------------------------------------------------------

/** 扩展分发形态。 */
export interface ExtensionDistribution {
  distribution: string;
  extensionIds: string[];
  outputModes: string[];
  releaseChannel: string;
  signingIdentity: string | null;
  storeUrl?: string;
}

/** chrome-web-store beta（原 `MS`）。 */
const CHROME_WEB_STORE_BETA: ExtensionDistribution = {
  distribution: "chrome-web-store",
  extensionIds: ["lfkehkpjohcoelkpembgemeipeppanef"],
  outputModes: [],
  releaseChannel: "beta",
  signingIdentity: null,
  storeUrl: "https://chromewebstore.google.com/detail/codex/lfkehkpjohcoelkpembgemeipeppanef",
};

/** chrome-web-store stable（原 `NS`）。 */
const CHROME_WEB_STORE_STABLE: ExtensionDistribution = {
  distribution: "chrome-web-store",
  extensionIds: ["hehggadaopoacecdllhhajmbjkdcmajg"],
  outputModes: [],
  releaseChannel: "stable",
  signingIdentity: null,
  storeUrl: "https://chromewebstore.google.com/detail/chatgpt/hehggadaopoacecdllhhajmbjkdcmajg",
};

/** edge add-ons stable（原 `PS`）。 */
const EDGE_ADDONS_STABLE: ExtensionDistribution = {
  distribution: "microsoft-edge-add-ons",
  extensionIds: ["odlomjlbamekndcpllcnffbgeohgkmjh"],
  outputModes: [],
  releaseChannel: "stable",
  signingIdentity: null,
  storeUrl: "https://microsoftedge.microsoft.com/addons/detail/odlomjlbamekndcpllcnffbgeohgkmjh",
};

/** chrome 扩展分发表（原 `FS.chrome`）。 */
const CHROME_EXTENSION_CHANNELS = {
  dev: [
    { distribution: "local-development", extensionIds: [], outputModes: ["file"], releaseChannel: "dev", signingIdentity: "development" },
    { distribution: "managed-self-hosted", extensionIds: [], outputModes: ["file"], releaseChannel: "dev", signingIdentity: "development" },
    CHROME_WEB_STORE_BETA,
  ],
  internal: [
    { distribution: "managed-self-hosted", extensionIds: [], outputModes: ["file", "blobstore"], releaseChannel: "beta", signingIdentity: "beta" },
    CHROME_WEB_STORE_BETA,
  ],
  prod: [
    { distribution: "managed-self-hosted", extensionIds: [], outputModes: ["file"], releaseChannel: "stable", signingIdentity: "stable" },
    CHROME_WEB_STORE_STABLE,
  ],
};

/** edge 扩展分发表（原 `FS.edge`）。 */
const EDGE_EXTENSION_CHANNELS = {
  dev: [
    { distribution: "local-development", extensionIds: [], outputModes: ["file"], releaseChannel: "dev", signingIdentity: "development" },
    { distribution: "managed-self-hosted", extensionIds: [], outputModes: ["file"], releaseChannel: "dev", signingIdentity: "development" },
    CHROME_WEB_STORE_BETA,
  ],
  internal: [
    { distribution: "managed-self-hosted", extensionIds: [], outputModes: ["file", "blobstore"], releaseChannel: "beta", signingIdentity: "beta" },
    EDGE_ADDONS_STABLE,
    CHROME_WEB_STORE_BETA,
  ],
  prod: [
    { distribution: "managed-self-hosted", extensionIds: [], outputModes: ["file"], releaseChannel: "stable", signingIdentity: "stable" },
    EDGE_ADDONS_STABLE,
    CHROME_WEB_STORE_STABLE,
  ],
};

/** Windows 原生 messaging 清单位置（原 `IS`）。 */
const WINDOWS_NATIVE_MESSAGING = {
  manifestDirectory: "AppData/Local/OpenAI/extension",
  registryRoot: "HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts",
};

/** 扩展 channel 名（原 `LS`）。 */
export const EXTENSION_CHANNELS = {
  dev: "com.openai.codexextension.dev",
  internal: "com.openai.codexextension.internal",
  production: "com.openai.codexextension",
} as const;

/** chrome web store 详情 URL 前缀（原 `RS`）。 */
const CHROME_STORE_DETAIL_URL = "https://chromewebstore.google.com/detail";

/** 扩展 id 校验（原 `$S`：32 个 a-p）。 */
function validExtensionId(id: string): string {
  const trimmed = id.trim();
  if (!/^[a-p]{32}$/u.test(trimmed)) throw new Error(`Invalid Chromium extension ID "${id}".`);
  return trimmed;
}

/** id 收集（原 `QS`）。 */
function collectExtensionId(ids: Set<string>, id: string): void {
  ids.add(validExtensionId(id));
}

/** 分发收集（原 `ZS`：managed-self-hosted 的 signingIdentity 也收）。 */
function collectDistribution(ids: Set<string>, distribution: ExtensionDistribution, signingKeys: Record<string, string>): void {
  for (const id of distribution.extensionIds) collectExtensionId(ids, id);
  if (distribution.distribution !== "managed-self-hosted" || distribution.signingIdentity == null) return;
  const signed = signingKeys[distribution.signingIdentity];
  if (signed != null) collectExtensionId(ids, signed);
}

// ---------------------------------------------------------------------------
// 浏览器族配置表（原 `BS`）
// ---------------------------------------------------------------------------

/** 浏览器族平台配置。 */
export interface BrowserFamilyConfig {
  backendCompatibilityKey: string;
  displayName: string;
  browserIconAssetPath: string;
  shortDisplayName: string;
  userAgentIdentifiers: string[];
  internalUrlSchemes: string[];
  extensionManagementUrl: string;
  extensionChannels: Record<string, { distributions: ExtensionDistribution[] }>;
  linux: {
    installations: { commands: string[]; userDataDirName: string }[];
    nativeMessagingManifestDirectories: string[];
    processNames: string[];
    userDataDirectorySegments: string[];
  };
  macos: {
    applicationNames: string[];
    bundleId: string;
    nativeMessagingManifestDirectories: string[];
    processNames: string[];
    userDataDirectorySegments: string[];
  };
  windows: {
    commandNames: string[];
    httpsUserChoiceProgIdPrefixes: string[];
    installPathSegments: string[];
    processNames: string[];
    userDataDirectorySegments: string[];
  };
}

/** chrome 通道表（原 `zS`）。 */
const CHROME_CHANNELS = {
  dev: { distributions: CHROME_EXTENSION_CHANNELS.dev },
  internal: { distributions: CHROME_EXTENSION_CHANNELS.internal },
  prod: { distributions: CHROME_EXTENSION_CHANNELS.prod },
};

/** edge 通道表。 */
const EDGE_CHANNELS = {
  dev: { distributions: EDGE_EXTENSION_CHANNELS.dev },
  internal: { distributions: EDGE_EXTENSION_CHANNELS.internal },
  prod: { distributions: EDGE_EXTENSION_CHANNELS.prod },
};

/** 浏览器族配置表（原 `BS`，导出 `Pc`）。 */
export const BROWSER_FAMILY_CONFIGS: Record<string, BrowserFamilyConfig> = {
  chrome: {
    backendCompatibilityKey: "chrome",
    displayName: "Google Chrome",
    browserIconAssetPath: "assets/google-chrome.png",
    shortDisplayName: "Chrome",
    userAgentIdentifiers: ["Chrome/"],
    internalUrlSchemes: ["chrome"],
    extensionManagementUrl: "chrome://extensions",
    extensionChannels: CHROME_CHANNELS,
    linux: {
      installations: [
        { commands: ["google-chrome", "google-chrome-stable"], userDataDirName: "google-chrome" },
        { commands: ["chromium", "chromium-browser"], userDataDirName: "chromium" },
        { commands: ["google-chrome-beta"], userDataDirName: "google-chrome-beta" },
        { commands: ["google-chrome-unstable"], userDataDirName: "google-chrome-unstable" },
        { commands: ["google-chrome-for-testing"], userDataDirName: "google-chrome-for-testing" },
      ],
      nativeMessagingManifestDirectories: [
        ".config/google-chrome/NativeMessagingHosts",
        ".config/chromium/NativeMessagingHosts",
        ".config/google-chrome-beta/NativeMessagingHosts",
        ".config/google-chrome-unstable/NativeMessagingHosts",
        ".config/google-chrome-for-testing/NativeMessagingHosts",
      ],
      processNames: ["chrome"],
      userDataDirectorySegments: [".config", "google-chrome"],
    },
    macos: {
      applicationNames: ["Google Chrome.app"],
      bundleId: "com.google.Chrome",
      nativeMessagingManifestDirectories: [
        "Library/Application Support/Google/Chrome/NativeMessagingHosts",
        "Library/Application Support/Chromium/NativeMessagingHosts",
        "Library/Application Support/Google/ChromeForTesting/NativeMessagingHosts",
        "Library/Application Support/Google/Chrome for Testing/NativeMessagingHosts",
      ],
      processNames: ["Google Chrome", "Google Chrome Helper"],
      userDataDirectorySegments: ["Library", "Application Support", "Google", "Chrome"],
    },
    windows: {
      commandNames: ["chrome.exe", "chrome"],
      httpsUserChoiceProgIdPrefixes: ["chromehtml"],
      installPathSegments: ["Google", "Chrome", "Application", "chrome.exe"],
      processNames: ["chrome.exe"],
      userDataDirectorySegments: ["Google", "Chrome", "User Data"],
    },
  },
  edge: {
    backendCompatibilityKey: "chrome",
    displayName: "Microsoft Edge",
    browserIconAssetPath: "assets/microsoft-edge.svg",
    shortDisplayName: "Edge",
    userAgentIdentifiers: ["Edg/"],
    internalUrlSchemes: ["edge"],
    extensionManagementUrl: "edge://extensions",
    extensionChannels: EDGE_CHANNELS,
    linux: {
      installations: [{ commands: ["microsoft-edge", "microsoft-edge-stable"], userDataDirName: "microsoft-edge" }],
      nativeMessagingManifestDirectories: [".config/microsoft-edge/NativeMessagingHosts"],
      processNames: ["msedge"],
      userDataDirectorySegments: [".config", "microsoft-edge"],
    },
    macos: {
      applicationNames: ["Microsoft Edge.app"],
      bundleId: "com.microsoft.edgemac",
      nativeMessagingManifestDirectories: ["Library/Application Support/Microsoft Edge/NativeMessagingHosts"],
      processNames: ["Microsoft Edge", "Microsoft Edge Helper"],
      userDataDirectorySegments: ["Library", "Application Support", "Microsoft Edge"],
    },
    windows: {
      commandNames: ["msedge.exe", "msedge"],
      httpsUserChoiceProgIdPrefixes: ["msedgehtm"],
      installPathSegments: ["Microsoft", "Edge", "Application", "msedge.exe"],
      processNames: ["msedge.exe"],
      userDataDirectorySegments: ["Microsoft", "Edge", "User Data"],
    },
  },
  brave: {
    backendCompatibilityKey: "chrome",
    displayName: "Brave Browser",
    browserIconAssetPath: "assets/brave.svg",
    shortDisplayName: "Brave Browser",
    userAgentIdentifiers: ["Brave/"],
    internalUrlSchemes: ["brave", "chrome"],
    extensionManagementUrl: "brave://extensions",
    extensionChannels: CHROME_CHANNELS,
    linux: {
      installations: [{ commands: ["brave-browser", "brave-browser-stable", "brave"], userDataDirName: "BraveSoftware/Brave-Browser" }],
      nativeMessagingManifestDirectories: [".config/BraveSoftware/Brave-Browser/NativeMessagingHosts"],
      processNames: ["brave", "brave-browser"],
      userDataDirectorySegments: [".config", "BraveSoftware", "Brave-Browser"],
    },
    macos: {
      applicationNames: ["Brave Browser.app"],
      bundleId: "com.brave.Browser",
      nativeMessagingManifestDirectories: ["Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts"],
      processNames: ["Brave Browser", "Brave Browser Helper"],
      userDataDirectorySegments: ["Library", "Application Support", "BraveSoftware", "Brave-Browser"],
    },
    windows: {
      commandNames: ["brave.exe", "brave", "brave-browser"],
      httpsUserChoiceProgIdPrefixes: ["bravehtml"],
      installPathSegments: ["BraveSoftware", "Brave-Browser", "Application", "brave.exe"],
      processNames: ["brave.exe"],
      userDataDirectorySegments: ["BraveSoftware", "Brave-Browser", "User Data"],
    },
  },
  opera: {
    backendCompatibilityKey: "chrome",
    displayName: "Opera",
    browserIconAssetPath: "assets/opera.svg",
    shortDisplayName: "Opera",
    userAgentIdentifiers: ["OPR/", "Opera/"],
    internalUrlSchemes: ["opera", "chrome"],
    extensionManagementUrl: "opera://extensions",
    extensionChannels: CHROME_CHANNELS,
    linux: {
      installations: [{ commands: ["opera", "opera-stable"], userDataDirName: "opera" }],
      nativeMessagingManifestDirectories: [".config/opera/NativeMessagingHosts"],
      processNames: ["opera"],
      userDataDirectorySegments: [".config", "opera"],
    },
    macos: {
      applicationNames: ["Opera.app"],
      bundleId: "com.operasoftware.Opera",
      nativeMessagingManifestDirectories: ["Library/Application Support/com.operasoftware.Opera/NativeMessagingHosts"],
      processNames: ["Opera", "Opera Helper"],
      userDataDirectorySegments: ["Library", "Application Support", "com.operasoftware.Opera"],
    },
    windows: {
      commandNames: ["opera.exe", "opera"],
      httpsUserChoiceProgIdPrefixes: ["operastable"],
      installPathSegments: ["Opera", "opera.exe"],
      processNames: ["opera.exe"],
      userDataDirectorySegments: ["Opera Software", "Opera Stable"],
    },
  },
  vivaldi: {
    backendCompatibilityKey: "chrome",
    displayName: "Vivaldi",
    browserIconAssetPath: "assets/vivaldi.svg",
    shortDisplayName: "Vivaldi",
    userAgentIdentifiers: ["Vivaldi/"],
    internalUrlSchemes: ["vivaldi", "chrome"],
    extensionManagementUrl: "vivaldi://extensions",
    extensionChannels: CHROME_CHANNELS,
    linux: {
      installations: [{ commands: ["vivaldi", "vivaldi-stable"], userDataDirName: "vivaldi" }],
      nativeMessagingManifestDirectories: [".config/vivaldi/NativeMessagingHosts"],
      processNames: ["vivaldi", "vivaldi-bin"],
      userDataDirectorySegments: [".config", "vivaldi"],
    },
    macos: {
      applicationNames: ["Vivaldi.app"],
      bundleId: "com.vivaldi.Vivaldi",
      nativeMessagingManifestDirectories: ["Library/Application Support/Vivaldi/NativeMessagingHosts"],
      processNames: ["Vivaldi", "Vivaldi Helper"],
      userDataDirectorySegments: ["Library", "Application Support", "Vivaldi"],
    },
    windows: {
      commandNames: ["vivaldi.exe", "vivaldi"],
      httpsUserChoiceProgIdPrefixes: ["vivaldihtm"],
      installPathSegments: ["Vivaldi", "Application", "vivaldi.exe"],
      processNames: ["vivaldi.exe"],
      userDataDirectorySegments: ["Vivaldi", "User Data"],
    },
  },
};

// ---------------------------------------------------------------------------
// 族查询与扩展 id（原 `XS`..`JS`）
// ---------------------------------------------------------------------------

/** 族存在判定（原 `XS`，导出 `Bc`）。 */
export function isKnownBrowserFamily(family: string): boolean {
  return Object.hasOwn(BROWSER_FAMILY_CONFIGS, family);
}

/** ProgId → 族（原 `YS`，导出 `Ic`）。 */
export function browserFamilyForProgId(progId: string): string | undefined {
  const normalized = progId.toLowerCase();
  return (Object.keys(BROWSER_FAMILY_CONFIGS) as string[]).filter(isKnownBrowserFamily).find((family) =>
    BROWSER_FAMILY_CONFIGS[family].windows.httpsUserChoiceProgIdPrefixes.some((prefix) => normalized.startsWith(prefix.toLowerCase())),
  );
}

/** channel → 扩展 id 集（原 `US`，导出 `Rc`）。 */
export function chromeExtensionIdsForChannel(channel: string, extraIds: string[] = [], signingKeys: Record<string, string> = {}): string[] {
  const ids = new Set<string>();
  for (const id of extraIds) collectExtensionId(ids, id);
  for (const family of Object.keys(BROWSER_FAMILY_CONFIGS).filter(isKnownBrowserFamily)) {
    const config = BROWSER_FAMILY_CONFIGS[family];
    for (const distribution of config.extensionChannels[channel].distributions) collectDistribution(ids, distribution, signingKeys);
  }
  return [...ids];
}

/** channel → 扩展 id 集（按 flavor，原 `WS`）。 */
export function extensionIdsForFlavor(flavor: string, signingKeys: Record<string, string> = {}): string[] {
  switch (flavor) {
    case EXTENSION_CHANNELS.dev:
      return chromeExtensionIdsForChannel("dev", [], signingKeys);
    case EXTENSION_CHANNELS.internal:
      return chromeExtensionIdsForChannel("internal", [], signingKeys);
    case EXTENSION_CHANNELS.production:
      return chromeExtensionIdsForChannel("prod", [], signingKeys);
    default:
      return [];
  }
}

/** store 分发查找（原 `KS`）。 */
function storeDistribution(distributions: ExtensionDistribution[]): ExtensionDistribution | null {
  return (
    distributions.find(
      (distribution) =>
        (distribution.distribution === "chrome-web-store" || distribution.distribution === "microsoft-edge-add-ons") &&
        distribution.extensionIds[0] != null &&
        distribution.storeUrl != null,
    ) ?? null
  );
}

/** 族+channel 的 store 分发（原 `qS`，导出 `zc`）。 */
export function getBrowserFamilyStoreUrls(family: string, channel: string): ExtensionDistribution | null {
  return storeDistribution(BROWSER_FAMILY_CONFIGS[family].extensionChannels[channel].distributions);
}

/** 分发查找（原 `GS`，导出 `Lc`）。 */
export function findDistribution(family: string, channel: string, distribution: string): ExtensionDistribution {
  const found = BROWSER_FAMILY_CONFIGS[family].extensionChannels[channel].distributions.find((entry) => entry.distribution === distribution);
  if (found == null) throw new Error(`Missing ${distribution} extension distribution for ${family} ${channel}.`);
  return found;
}

/** store 详情 URL（原 `JS`，导出 `Fc`）。 */
export function buildChromiumExtensionManagementUrl(extensionId: string): string {
  return `${CHROME_STORE_DETAIL_URL}/${validExtensionId(extensionId)}`;
}

/** NativeMessaging 目录（原 `VS`/`HS`）。 */
export function nativeMessagingManifestDirectories(platform: string): string[] {
  return platform === "windows"
    ? [WINDOWS_NATIVE_MESSAGING.manifestDirectory]
    : [...new Set(Object.values(BROWSER_FAMILY_CONFIGS).flatMap((config) => config[platform as "linux" | "macos"].nativeMessagingManifestDirectories))];
}

// ---------------------------------------------------------------------------
// 兼容导出（browser-tab-mentions 分区 14 个压缩名）
// ---------------------------------------------------------------------------

export {
  hasValidUnicode as Kc,
  BROWSER_PLUGIN_DESCRIPTORS as Vc,
  chromeExtensionIdsForChannel as Rc,
  getBrowserFamilyStoreUrls as zc,
  buildChromiumExtensionManagementUrl as Fc,
  findDistribution as Lc,
  BROWSER_FAMILY_CONFIGS as Pc,
  isKnownBrowserFamily as Bc,
  browserFamilyForProgId as Ic,
  dedupeTabCandidates as Nc,
  candidateLimitForQuery as Mc,
  tabDedupeKey as Wc,
  mentionsWithinBudget as Hc,
  deserializeBrowserTabMention as Gc,
  browserTabMentionSchema as Uc,
  parseFaviconDataUrl as Jc,
  matchesBrowserTabQuery as qc,
  BROWSER_TAB_TYPES as lu,
};
