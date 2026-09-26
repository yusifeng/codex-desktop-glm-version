// shared chunk：app-server 版本门控与语义化版本（app-server-version 分区，
// settings-threads 子区）。
//
// 对应 src-DldfpmrL.ts 的 L17,129-17,379 区段：
//   - Fv/zv/Rv/Iv：semver 解析与比较（Zu=Iv 消费名 compareSemver）
//   - Lv（Qu）：合法 semver 判定
//   - Bv=0.141.0 最低支持版本；Vv/qu：`codex-app-server-version-unsupported:`
//     前缀；Hv：restart-available 前缀；Uv/ey=0.0.0 开发版哨兵；
//     $v=0.142.0 recency 门
//   - Wv/Gv + Kv/Ju：`name/version` 与自由文本的版本提取
//   - Jv/Yv/Xv/Zv：restart-available 消息构造/解析 + 版本错误分类
//     （restart-required / update-required / connection-failed）
//   - Qv（Yu）：版本可用判定（开发版或 ≥ 最低支持）
//   - ty 全表 37 门 + ny（Wu）：版本门控（compactionImageBudget 的
//     0.149.0-alpha.4./.7. 特例 + 0.150.0- 排除）
//   - ry（Ku）：分页历史支持（≥ 0.145.0-alpha.15）；iy（Gu）：recency
//     排序键支持（开发版或 ≥ 0.142.0）
//   - ly/gy/uy（Uu）/dy（Ru）/fy（Bu）：app 版本解析族——minor 的
//     MMDD 日期编码（_y：5 前缀 + ≥10000 patch 才剥，防误剥纯数字
//     minor）；fy 输出 isPreRelease + 规范化版本
//   - py（zu）：版本 → 构建日期（patch 尾 4 位 = 日内 HHMM，+8h 时区）；
//     my（Hu）：Windows Store 构建号规范化（(day-1)*1440+HHMM 分钟）；
//     hy（Vu）：MSIX package identity（. → -）
//   - Nv（ed）：恒等（requestIdOf）
//
// 消费方：app-server/cloud-backend.ts、app-server/*、updater/* 等
// （Zu/Qu/Wu/Ku/Gu/Hu/Vu/Bu 等以 compareSemver/appServerSupports/… 消费）。
//
// 兼容导出：Zu=Iv、Qu=Lv、qu=Vv、Ju=qv、Yu=Qv、Wu=ny、Ku=ry、
// Gu=iy、Uu=uy、Ru=dy、Bu=fy、zu=py、Hu=my、Vu=hy、ed=Nv。

// ---------------------------------------------------------------------------
// semver 解析与比较（原 `Fv`/`zv`/`Rv`/`Iv`/`Lv`）
// ---------------------------------------------------------------------------

const SEMVER_PATTERN =
  /^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<prerelease>[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

/** 解析后的语义化版本。 */
export interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease: (number | string)[];
}

/** semver 解析（原 `zv`）。 */
export function parseSemver(version: string): ParsedSemver | null {
  const match = SEMVER_PATTERN.exec(version);
  if (match?.groups == null) return null;
  return {
    major: Number(match.groups.major),
    minor: Number(match.groups.minor),
    patch: Number(match.groups.patch),
    prerelease:
      match.groups.prerelease?.split(".").map((part) => (/^(0|[1-9]\d*)$/.test(part) ? Number(part) : part)) ?? [],
  };
}

/** 主版本比较（原 `Rv`）。 */
function compareSemverMain(a: ParsedSemver, b: ParsedSemver): number {
  return a.major === b.major
    ? a.minor === b.minor
      ? a.patch === b.patch
        ? 0
        : a.patch - b.patch
      : a.minor - b.minor
    : a.major - b.major;
}

/** semver 比较（原 `Iv`，导出 `Zu`；任一侧不可解析返回 0）。 */
export function compareSemver(a: string, b: string): number {
  const parsedA = parseSemver(a);
  const parsedB = parseSemver(b);
  if (parsedA == null || parsedB == null) return 0;
  const main = compareSemverMain(parsedA, parsedB);
  if (main !== 0) return main;
  const preA = parsedA.prerelease;
  const preB = parsedB.prerelease;
  if (preA.length === 0 && preB.length === 0) return 0;
  if (preA.length === 0) return 1;
  if (preB.length === 0) return -1;
  const length = Math.max(preA.length, preB.length);
  for (let index = 0; index < length; index += 1) {
    const partA = preA[index];
    const partB = preB[index];
    if (partA == null) return -1;
    if (partB == null) return 1;
    if (partA !== partB) {
      if (typeof partA === "number" && typeof partB === "number") return partA - partB;
      if (typeof partA === "number") return -1;
      if (typeof partB === "number") return 1;
      return partA.localeCompare(partB as string);
    }
  }
  return 0;
}

/** 合法 semver 判定（原 `Lv`，导出 `Qu`）。 */
export function isValidSemver(version: string): boolean {
  return parseSemver(version) != null;
}

// ---------------------------------------------------------------------------
// 版本提取与错误分类（原 `Bv`..`Zv`）
// ---------------------------------------------------------------------------

/** 最低支持版本（原 `Bv`）。 */
export const MIN_SUPPORTED_APP_SERVER_VERSION = "0.141.0";

/** 版本不支持前缀（原 `Vv`，导出 `qu`）。 */
export const APP_SERVER_UNSUPPORTED_PREFIX = "codex-app-server-version-unsupported:";

/** 重启可用前缀（原 `Hv`）。 */
export const APP_SERVER_RESTART_AVAILABLE_PREFIX = "codex-app-server-version-restart-available:";

/** 开发版哨兵（原 `Uv`/`ey`）。 */
export const DEV_VERSION = "0.0.0";

/** `name/version` 提取（原 `Wv`+`Kv`）。 */
export function versionFromUserAgent(userAgent: string): string | null {
  return /^.+?\/(?<version>\S+)/.exec(userAgent)?.groups?.version ?? null;
}

/** 自由文本版本提取（原 `Gv`+`qv`，导出 `Ju`）。 */
export function parseVersionOutput(text: string): string | null {
  return /(?:^|\s)(?<version>\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?)(?:\s|$)/.exec(text)?.groups?.version ?? null;
}

/** restart-available 消息构造（原 `Jv`）。 */
export function restartAvailableMessage({ currentVersion, installedVersion }: { currentVersion: string; installedVersion: string }): string {
  return `${APP_SERVER_RESTART_AVAILABLE_PREFIX}${currentVersion}:${installedVersion}`;
}

/** restart-available 消息解析（原 `Yv`）。 */
export function parseRestartAvailableMessage(message: string): { currentVersion: string; installedVersion: string } | null {
  if (!message?.startsWith(APP_SERVER_RESTART_AVAILABLE_PREFIX)) return null;
  const [currentVersion, installedVersion] = message.slice(43).split(":", 2);
  return !currentVersion || !installedVersion ? null : { currentVersion, installedVersion };
}

/** 版本错误分类（原 `Xv`）。 */
export function classifyAppServerError(message: string):
  | { code: "restart-required" }
  | { code: "restart-required"; currentVersion: string; installedVersion: string }
  | { code: "update-required"; minRequiredVersion: string; currentVersion: string }
  | { code: "connection-failed"; message: string } {
  if (message.startsWith("Parse Error")) return { code: "restart-required" };
  const restart = parseRestartAvailableMessage(message);
  return restart == null
    ? message.startsWith(APP_SERVER_UNSUPPORTED_PREFIX)
      ? { code: "update-required", minRequiredVersion: MIN_SUPPORTED_APP_SERVER_VERSION, currentVersion: message.slice(37) }
      : { code: "connection-failed", message }
    : { code: "restart-required", currentVersion: restart.currentVersion, installedVersion: restart.installedVersion };
}

/** 版本可用判定（原 `Qv`，导出 `Yu`：开发版或 ≥ 最低支持）。 */
export function isSupportedAppServerVersion(version: string): boolean {
  return version === DEV_VERSION || compareSemver(version, MIN_SUPPORTED_APP_SERVER_VERSION) >= 0;
}

// ---------------------------------------------------------------------------
// 特性门控（原 `ty`/`ny`/`ry`/`iy`）
// ---------------------------------------------------------------------------

/** 特性门控版本表（原 `ty`，37 门）。 */
export const APP_SERVER_FEATURE_GATES: Record<string, string> = {
  mcpServerCapabilities: "0.155.0-alpha.4",
  applyPatchPreserveLineEndings: "0.148.0-alpha.6",
  appRead: "0.145.0-alpha.19",
  compactionImageBudget: "0.149.1",
  cyberAccessProgram: "0.150.0-alpha.11",
  daybreakEnabled: "0.154.0-alpha.6",
  daybreakModelAccess: "0.155.0-alpha.6",
  mcpToolExposure: "0.147.0",
  mcpToolCallAppContext: "0.142.0-alpha.3",
  misalignmentReview: "0.151.0-alpha.1",
  diagnostics: "0.148.0-alpha.3",
  hostedLoginSuccess: "0.143.0-alpha.39",
  defaultPaginatedHistory: "0.150.0-alpha.10",
  deferredToolWorldState: "0.146.0-alpha.6",
  mcpEventStream: "0.150.0-alpha.1",
  mcpOauthLoginThreadId: "0.143.0-alpha.26",
  mcpOauthRefreshCoordination: "0.154.0-alpha.1",
  mcpResourceReadOriginCallId: "0.148.0-alpha.22",
  mcpStructuredErrors: "0.151.0-alpha.7",
  pluginMcpConfigOverrides: "0.151.0-alpha.1",
  guardianV2StructuredConfig: "0.148.0-alpha.18",
  recommendedPlugins: "0.147.0-alpha.1",
  rolloutCompression: "0.155.0-alpha.13",
  projects: "0.148.0-alpha.21",
  providerModelFallback: "0.143.0-alpha.26",
  threadAttachments: "0.155.0-alpha.2",
  threadQueue: "0.148.0-alpha.14",
  threadRevert: "0.148.0-alpha.13",
  threadTimeline: "0.150.0-alpha.9",
  threadRealtimeExistingCall: "0.150.0-alpha.3",
  tokenBudgetHistoryNotes: "0.150.0-alpha.2",
  turnTrigger: "0.150.0-alpha.10",
  turnToolOutput: "0.151.0-alpha.4",
  turnApprovalsReviewer: "0.153.0-alpha.4",
  serviceTierForTurn: "0.150.0-alpha.10",
};

/** 分页历史门（原 `$v`）。 */
const RECENCY_SORT_GATE = "0.142.0";

/**
 * app-server 特性门控（原 `ny`，导出 `Wu`）。
 * 开发版全开；compactionImageBudget 的 0.149.0-alpha.4./.7. 内部
 * 版本走特例，0.150.0- 排除。
 */
export function appServerSupportsFeature(appServerVersion: string | null, feature: string): boolean {
  if (appServerVersion === DEV_VERSION) return true;
  const gate = APP_SERVER_FEATURE_GATES[feature];
  if (gate == null || appServerVersion == null || !isValidSemver(appServerVersion)) return false;
  if (feature === "compactionImageBudget") {
    if (appServerVersion.startsWith("0.149.0-alpha.4.")) return compareSemver(appServerVersion, "0.149.0-alpha.4.3") >= 0;
    if (appServerVersion.startsWith("0.149.0-alpha.7.")) return compareSemver(appServerVersion, "0.149.0-alpha.7.3") >= 0;
    if (appServerVersion.startsWith("0.150.0-")) return false;
  }
  return compareSemver(appServerVersion, gate) >= 0;
}

/** 分页历史支持（原 `ry`，导出 `Ku`：非开发版且 ≥ 0.145.0-alpha.15）。 */
export function supportsPaginatedHistory(appServerVersion: string | null): boolean {
  return appServerVersion != null && appServerVersion !== DEV_VERSION && compareSemver(appServerVersion, "0.145.0-alpha.15") >= 0;
}

/** recency 排序键支持（原 `iy`，导出 `Gu`：开发版或 ≥ 0.142.0）。 */
export function supportsRecencySortKey(appServerVersion: string | null): boolean {
  return appServerVersion === DEV_VERSION || (appServerVersion != null && isValidSemver(appServerVersion) && compareSemver(appServerVersion, RECENCY_SORT_GATE) >= 0);
}

// ---------------------------------------------------------------------------
// app 版本解析族（原 `ly`/`gy`/`uy`/`dy`/`fy`/`_y`/`vy`/`yy`/`by`）
// ---------------------------------------------------------------------------

/** MMDD 最小 patch（原 `oy`：≥10000 才可能是日期编码）。 */
const DATE_ENCODED_PATCH_MIN = 10_000;

/** minor 日期前缀（原 `ay` = '5'）。 */
const DATE_MINOR_PREFIX = "5";

/** 构建日期时区偏移小时（原 `cy` = 8）。 */
const BUILD_DATE_TIMEZONE_HOURS = 8;

/** 每日分钟数（原 `sy`）。 */
const MINUTES_PER_DAY = 1440;

const APP_VERSION_PATTERN =
  /^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?<suffix>(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?)$/;

/** 解析后的 app 版本（原 `gy` 返回形态：suffix + 三段）。 */
export interface ParsedAppVersion {
  suffix: string;
  version: {
    major: number;
    minor: number;
    patch: number;
  };
}

/** app 版本解析（原 `gy`：非法抛错）。 */
export function parseAppVersion(version: string): ParsedAppVersion {
  const match = APP_VERSION_PATTERN.exec(version);
  if (match?.groups == null) throw new Error(`Invalid semantic version: ${version}`);
  return {
    suffix: match.groups.suffix,
    version: {
      major: Number(match.groups.major),
      minor: Number(match.groups.minor),
      patch: Number(match.groups.patch),
    },
  };
}

/** MMDD 解析（原 `by`）。 */
function monthDayOf(encoded: string): { day: number; month: number } | null {
  if (!/^[0-9]{3,4}$/.test(encoded)) return null;
  const monthPart = encoded.length === 3 ? encoded.slice(0, 1) : encoded.slice(0, 2);
  const dayPart = encoded.length === 3 ? encoded.slice(1) : encoded.slice(2);
  const month = Number(monthPart);
  const day = Number(dayPart);
  return month < 1 || month > 12 || day < 1 || day > 31 ? null : { day, month };
}

/** 年内有效 MMDD 判定（原 `yy`）。 */
function isValidMonthDay(year: number, encoded: string): boolean {
  const monthDay = monthDayOf(encoded);
  if (monthDay == null) return false;
  const daysInMonth = new Date(Date.UTC(2000 + year, monthDay.month, 0)).getUTCDate();
  return monthDay.day <= daysInMonth;
}

/** 日期编码 patch 判定（原 `vy`）。 */
function isDateEncodedVersion(version: { major: number; minor: number; patch: number }): boolean {
  return version.patch >= DATE_ENCODED_PATCH_MIN && isValidMonthDay(version.major, String(version.minor));
}

/** minor 日期解码（原 `_y`：5 前缀且年内有效才剥）。 */
function decodedMinor(version: { major: number; minor: number; patch: number }): number {
  const minor = String(version.minor);
  if (isValidMonthDay(version.major, minor) || version.patch < DATE_ENCODED_PATCH_MIN || !minor.startsWith(DATE_MINOR_PREFIX))
    return version.minor;
  const stripped = minor.slice(1);
  return isValidMonthDay(version.major, stripped) ? Number(stripped) : version.minor;
}

/** 解析版本三段（原 `uy`，导出 `Uu`：非法抛错）。 */
export function parseSemanticVersion(version: string): { major: number; minor: number; patch: number } {
  return parseAppVersion(version).version;
}

/** 三段格式化（原 `dy`，导出 `Ru`）。 */
export function formatSemanticVersion(version: { major: number; minor: number; patch: number }): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * 规范化 app 版本（原 `fy`，导出 `Bu`）。
 * minor 的 5MDD 日期编码剥为 MDD；输出 isPreRelease 标记。
 */
export function normalizeAppVersion(version: string): { isPreRelease: boolean; version: string } {
  const parsed = parseAppVersion(version);
  const minor = decodedMinor(parsed.version);
  return {
    isPreRelease: minor !== parsed.version.minor,
    version: `${formatSemanticVersion({ major: parsed.version.major, minor, patch: parsed.version.patch })}${parsed.suffix}`,
  };
}

/**
 * 版本 → 构建日期（原 `py`，导出 `zu`）。
 * patch = D*10000 + HHMM（D 为年内日序）；非法返回 null。
 */
export function parseAppVersionAsDate(version: string): Date | null {
  let parsed: ParsedAppVersion;
  try {
    parsed = parseAppVersion(version);
  } catch {
    return null;
  }
  if (!isDateEncodedVersion(parsed.version)) return null;
  const monthDay = monthDayOf(String(parsed.version.minor));
  if (monthDay == null) return null;
  const patch = String(parsed.version.patch);
  const dayOfYear = Number(patch.slice(0, -4));
  const timePart = patch.slice(-4);
  const hours = Number(timePart.slice(0, 2));
  const minutes = Number(timePart.slice(2));
  return !Number.isInteger(dayOfYear) ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    dayOfYear < 1 ||
    hours > 23 ||
    minutes > 59
    ? null
    : new Date(Date.UTC(2000 + parsed.version.major, monthDay.month - 1, monthDay.day + dayOfYear - 1, hours + BUILD_DATE_TIMEZONE_HOURS, minutes));
}

/**
 * Windows Store 构建号规范化（原 `my`，导出 `Hu`）。
 * 日期编码版本 → major.minor.(分钟数).0；非日期编码 → 原版 + .0。
 */
export function normalizeWindowsStoreBuildVersion(version: string): string {
  const parsed = parseAppVersion(version);
  if (!isDateEncodedVersion(parsed.version)) return `${formatSemanticVersion(parsed.version)}.0`;
  const patch = String(parsed.version.patch);
  const days = Number(patch.slice(0, -4));
  const timePart = patch.slice(-4);
  const hours = Number(timePart.slice(0, 2));
  const minutes = Number(timePart.slice(2));
  const totalMinutes = (days - 1) * MINUTES_PER_DAY + hours * 60 + minutes;
  return `${parsed.version.major}.${parsed.version.minor}.${totalMinutes}.0`;
}

/** MSIX package identity（原 `hy`，导出 `Vu`：版本点号转连字符）。 */
export function buildMsixPackageIdentity(name: string, version: string): string {
  return `${name}.v${version.replaceAll(".", "-")}`;
}

// ---------------------------------------------------------------------------
// 恒等（原 `Nv`，导出 `ed`）
// ---------------------------------------------------------------------------

/** 恒等函数（原 `Nv`，导出 `ed`——消费名 requestIdOf）。 */
export function identity<T>(value: T): T {
  return value;
}

// ---------------------------------------------------------------------------
// 兼容导出（app-server-version 分区 15 个压缩名）
// ---------------------------------------------------------------------------

export {
  compareSemver as Zu,
  isValidSemver as Qu,
  APP_SERVER_UNSUPPORTED_PREFIX as qu,
  parseVersionOutput as Ju,
  isSupportedAppServerVersion as Yu,
  appServerSupportsFeature as Wu,
  supportsPaginatedHistory as Ku,
  supportsRecencySortKey as Gu,
  parseSemanticVersion as Uu,
  formatSemanticVersion as Ru,
  normalizeAppVersion as Bu,
  parseAppVersionAsDate as zu,
  normalizeWindowsStoreBuildVersion as Hu,
  buildMsixPackageIdentity as Vu,
  identity as ed,
};
