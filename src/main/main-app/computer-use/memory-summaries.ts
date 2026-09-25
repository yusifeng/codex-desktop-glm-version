// CUA worker 产出的 ambient memory summaries（memory-summary.md）解析。
//
// 对应 main-C-Mhak1n.ts 79,355-79,595：
//   - 文件名协议（Hj）：YYYY-MM-DDTHH-mm-ss-<id>-(10min|6h)-memory-summary.md
//   - frontmatter schema（Gj/Kj）：title/description/applications/suggestion
//   - frontmatter 缓存（qj：路径 → promise，失效文件自动清缓存）
//   - 应用解析（eM 工厂 + tM/nM：launch-services 优先、shared 兜底）
//   - 应用清单（Qj/$j：图标 + 后台 agent 过滤 + web browser 标注）
//   - 摘要列表（aM：6h 覆盖 10min 去重，按 interval 降序）
//   - ambient suggestions（Yj/Xj：48h 窗口内的 suggestion 卡）
//   - 活跃区间（Zj）
import { readFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import {
  wf as objectSchema,
  df as enumSchema,
  Of as stringSchema,
  hf as arraySchema,
  A as resolveAppPath,
  M as listInstalledApplications,
  P as listWebBrowsersFromShared,
  j as isBackgroundApp,
} from "@chunk/shared";
import { parse as parseYaml } from "@main-vendor/yaml";
import { getAppIconMedium } from "../windows/native-app-icons";
import { appForBundleId, listWebUrlHandlers } from "../mac/launch-services";

// ---------------------------------------------------------------------------
// 文件名协议与 schema
// ---------------------------------------------------------------------------

const MEMORY_SUMMARY_FILENAME_RE = /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-[^-]+-(10min|6h)-memory-summary\.md$/;
const SIX_HOUR = "six_hour";
/** suggestion 的展示窗口：48h（原 `Wj`）。 */
const SUGGESTION_WINDOW_MS = 172_800_000;
const TEN_MINUTE_MS = 6e5;
const SIX_HOUR_MS = 216e5;

const suggestionSchema = objectSchema({
  type: enumSchema(["skill", "automation"]),
  name: (stringSchema() as unknown as { trim(): { min(n: number): unknown } }).trim().min(1),
  description: (stringSchema() as unknown as { trim(): { min(n: number): unknown } }).trim().min(1),
});

const frontmatterSchema = objectSchema({
  title: stringSchema(),
  description: stringSchema(),
  applications: arraySchema(stringSchema()),
  suggestion: (suggestionSchema as unknown as { optional(): { catch(value: unknown): unknown } }).optional().catch(undefined),
});

/** frontmatter 缓存（原 `qj`）。 */
const frontmatterCache = new Map<string, Promise<Frontmatter | null>>();

/** 系统/安全面板进程（不出现在建议里，原 `Jj`）。 */
const APPLE_PROCESS_BLOCKLIST = new Set([
  "com.openai.sky.CUAService",
  "com.apple.WindowManager",
  "com.apple.controlcenter",
  "com.apple.dock",
  "com.apple.notificationcenterui",
  "com.apple.UserNotificationCenter",
  "com.apple.LocalAuthentication.UIAgent",
  "com.apple.LocalAuthenticationRemoteService",
  "com.apple.SecurityAgent",
]);

// ---------------------------------------------------------------------------
// 类型与基础工具
// ---------------------------------------------------------------------------

interface Frontmatter {
  title: string;
  description: string;
  applications: string[];
  suggestion?: { type: string; name: string; description: string };
}

interface MemorySummaryInterval {
  startMs: number;
  endMs: number;
}

interface ParsedSummaryFile {
  fileName: string;
  interval: MemorySummaryInterval;
  summaryLevel: string;
}

interface SummaryWithFrontmatter extends ParsedSummaryFile {
  frontmatter: Frontmatter;
  memoryFilePath: string;
}

interface AppEntry {
  bundleIdentifier: string;
  displayName: string;
  iconDataURL: string | null;
  isWebBrowser: boolean;
  isBackgroundAgent?: boolean;
  appPath?: string;
}

function isEnoent(error: unknown): boolean {
  return typeof error == "object" && !!error && "code" in error && (error as { code?: string }).code === "ENOENT";
}

/** 文件名 → 区间 + 级别（原 `rM`）。 */
function parseSummaryFileName(fileName: string): { interval: MemorySummaryInterval; summaryLevel: string } | null {
  const match = MEMORY_SUMMARY_FILENAME_RE.exec(fileName);
  if (match == null) return null;
  const [, day, hour, minute, second, level] = match;
  const startMs = Date.parse(`${day}T${hour}:${minute}:${second}Z`);
  return Number.isFinite(startMs)
    ? {
        interval: { startMs, endMs: startMs + (level === "6h" ? SIX_HOUR_MS : TEN_MINUTE_MS) },
        summaryLevel: level === "6h" ? SIX_HOUR : "ten_minute",
      }
    : null;
}

/** 目录内全部摘要文件（原 `iM`）。 */
async function listSummaryFiles(directory: string): Promise<ParsedSummaryFile[]> {
  let entries: string[];
  try {
    entries = await readdir(directory);
  } catch (error) {
    if (isEnoent(error)) return [];
    throw error;
  }
  return entries.flatMap((fileName) => {
    const parsed = parseSummaryFileName(fileName);
    return parsed == null ? [] : [{ fileName, ...parsed }];
  });
}

/** frontmatter 解析（原 `sM`）：yaml 头 + schema 校验。 */
function parseFrontmatter(content: string): Frontmatter | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(content);
  if (match?.[1] == null) return null;
  try {
    const parsed = (frontmatterSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: Frontmatter } }).safeParse(parseYaml(match[1]));
    return parsed.success ? parsed.data! : null;
  } catch {
    return null;
  }
}

/** 带 promise 缓存的 frontmatter 读取（原 `oM`）：目录变更后自动清缓存。 */
async function readFrontmatter(path: string): Promise<Frontmatter | null> {
  const cached = frontmatterCache.get(path);
  if (cached != null) return cached;
  const pending = readFile(path, "utf8")
    .then(parseFrontmatter)
    .catch((error) => {
      if (isEnoent(error)) return null;
      throw error;
    });
  frontmatterCache.set(path, pending);
  try {
    const frontmatter = await pending;
    return (frontmatter ?? frontmatterCache.delete(path), frontmatter);
  } catch (error) {
    frontmatterCache.delete(path);
    throw error;
  }
}

/** 摘要列表（原 `aM`）：6h 覆盖 10min 去重，interval 降序。 */
async function listSummaries(resourcesDirectory: string, sinceMs = -Number.POSITIVE_INFINITY): Promise<SummaryWithFrontmatter[]> {
  const files = await listSummaryFiles(resourcesDirectory);
  const presentPaths = new Set(files.map(({ fileName }) => join(resourcesDirectory, fileName)));
  for (const cachedPath of frontmatterCache.keys())
    if (dirname(cachedPath) === resourcesDirectory && !presentPaths.has(cachedPath)) frontmatterCache.delete(cachedPath);
  const inWindow = files.filter(
    ({ interval, summaryLevel }) => interval.startMs > sinceMs || (summaryLevel === SIX_HOUR && interval.endMs > sinceMs),
  );
  const load = async (file: ParsedSummaryFile) => {
    const memoryFilePath = join(resourcesDirectory, file.fileName);
    const frontmatter = await readFrontmatter(memoryFilePath);
    return frontmatter == null ? null : { ...file, frontmatter, memoryFilePath };
  };
  const sixHourSummaries = (await Promise.all(inWindow.filter(({ summaryLevel }) => summaryLevel === SIX_HOUR).map(load))).filter(
    (entry): entry is SummaryWithFrontmatter => entry != null,
  );
  const tenMinuteSummaries = (
    await Promise.all(
      inWindow
        .filter(
          ({ interval, summaryLevel }) =>
            summaryLevel !== SIX_HOUR &&
            !sixHourSummaries.some((sixHour) => sixHour.interval.startMs <= interval.startMs && sixHour.interval.endMs >= interval.endMs),
        )
        .map(load),
    )
  ).filter((entry): entry is SummaryWithFrontmatter => entry != null);
  return [...sixHourSummaries, ...tenMinuteSummaries]
    .filter(({ interval }) => interval.startMs > sinceMs)
    .sort((a, b) => b.interval.startMs - a.interval.startMs);
}

// ---------------------------------------------------------------------------
// 应用解析（原 `eM`/`tM`/`nM`/`cM`）
// ---------------------------------------------------------------------------

/** 应用条目投影（原 `cM`）。 */
function normalizeAppEntry(entry: AppEntry): AppEntry {
  return {
    bundleIdentifier: entry.bundleIdentifier,
    displayName: entry.displayName,
    iconDataURL: entry.iconDataURL,
    isWebBrowser: entry.isWebBrowser,
  };
}

/** launch-services 优先、shared 兜底的应用信息（原 `tM`）。 */
async function resolveAppInfo(bundleId: string): Promise<{ appPath: string; displayName: string } | null> {
  return (await appForBundleId(bundleId)) ?? ((resolveAppPath as (bundleId: string) => { appPath: string; displayName: string } | null)(bundleId));
}

/** web 浏览器列表（原 `nM`）。 */
async function listWebBrowsers(): Promise<Array<{ bundleId: string; displayName: string; appPath: string }>> {
  return (await listWebUrlHandlers())?.applications ?? ((listWebBrowsersFromShared as (opts: { order: string }) => Promise<Array<{ bundleId: string; displayName: string; appPath: string }>>)({ order: "usage" }) as never);
}

/** 应用解析器工厂（原 `eM`）：blocklist + 浏览器标注 + 图标。 */
function createApplicationResolver() {
  const webBrowsers = listWebBrowsers().then((browsers) => new Set(browsers.map((browser) => browser.bundleId)));
  return async (bundleId: string): Promise<AppEntry | null> => {
    if (APPLE_PROCESS_BLOCKLIST.has(bundleId)) return null;
    const [info, browsers] = await Promise.all([resolveAppInfo(bundleId), webBrowsers]);
    return info == null
      ? bundleId.startsWith("com.apple.")
        ? null
        : {
            bundleIdentifier: bundleId,
            displayName: bundleId,
            iconDataURL: null,
            isBackgroundAgent: false,
            isWebBrowser: browsers.has(bundleId),
          }
      : {
          bundleIdentifier: bundleId,
          displayName: info.displayName,
          iconDataURL: await getAppIconMedium(info.appPath),
          isBackgroundAgent: await (isBackgroundApp as (info: { appPath: string }) => Promise<boolean>)(info),
          isWebBrowser: browsers.has(bundleId),
        };
  };
}

// ---------------------------------------------------------------------------
// 对外查询（原 `Yj`/`Xj`/`Zj`/`Qj`/`$j`）
// ---------------------------------------------------------------------------

/** ambient 摘要列表（原 `Yj`）：应用名解析 + 后台 agent 过滤 + 48h suggestion 窗口。 */
async function listAmbientSummaries({
  resourcesDirectory,
  resolveApplication = createApplicationResolver(),
  currentTimeMs = Date.now(),
}: {
  resourcesDirectory: string;
  resolveApplication?: (bundleId: string) => Promise<AppEntry | null>;
  currentTimeMs?: number;
}) {
  const summaries = await listSummaries(resourcesDirectory);
  const resolvedById = new Map<string, Promise<AppEntry | null>>();
  const resolve = (bundleId: string): Promise<AppEntry | null> => {
    const cached = resolvedById.get(bundleId);
    if (cached != null) return cached;
    const resolved = resolveApplication(bundleId);
    resolvedById.set(bundleId, resolved);
    return resolved;
  };
  return Promise.all(
    summaries.map(async ({ fileName, frontmatter, interval, memoryFilePath, summaryLevel }) => {
      const applications = await Promise.all(frontmatter.applications.map(resolve));
      return {
        id: fileName,
        title: frontmatter.title,
        description: frontmatter.description,
        interval,
        summaryLevel,
        applications: applications.flatMap((entry) => (entry == null || entry.isBackgroundAgent ? [] : [normalizeAppEntry(entry)])),
        memoryFilePath,
        suggestion: currentTimeMs - interval.startMs < SUGGESTION_WINDOW_MS ? frontmatter.suggestion : undefined,
      };
    }),
  );
}

/** 新建议卡（原 `Xj`）：48h 内有 suggestion 的摘要。 */
async function newAmbientSuggestions({ resourcesDirectory, currentTimeMs = Date.now() }: { resourcesDirectory: string; currentTimeMs?: number }) {
  return (await listSummaries(resourcesDirectory, currentTimeMs - SUGGESTION_WINDOW_MS)).flatMap(
    ({ fileName, frontmatter, interval, memoryFilePath }) =>
      frontmatter.suggestion == null
        ? []
        : [{ ...frontmatter.suggestion, id: fileName, interval, memoryFilePath }],
  );
}

/** 活跃区间（原 `Zj`）。 */
async function activeSummaryIntervals({ resourcesDirectory, sinceMs }: { resourcesDirectory: string; sinceMs: number }) {
  return (await listSummaryFiles(resourcesDirectory))
    .filter(({ interval }) => interval.endMs > sinceMs)
    .sort((a, b) => b.interval.startMs - a.interval.startMs)
    .map(({ interval }) => interval);
}

/** 全量应用清单（原 `Qj`）：图标 + blocklist/后台过滤 + 浏览器标注。 */
async function listAllApplications({
  getIcon = getAppIconMedium,
  isBackgroundApplication = isBackgroundApp as never,
  listApplications = () => (listInstalledApplications as (opts: { order: string }) => Promise<Array<{ bundleId: string; displayName: string; appPath: string }>>)({ order: "usage" }),
  listBrowsers = listWebBrowsers,
} = {}) {
  const [applications, browsers] = await Promise.all([listApplications(), listBrowsers()]);
  const browserIds = new Set(browsers.map((browser) => browser.bundleId));
  const seen = new Set<string>();
  const unique = [...applications, ...browsers].filter((application) => !seen.has(application.bundleId) && (seen.add(application.bundleId), true));
  return (
    await Promise.all(
      unique.map(async (application) => {
        try {
          return APPLE_PROCESS_BLOCKLIST.has(application.bundleId) || (await (isBackgroundApplication as (app: unknown) => Promise<boolean>)(application))
            ? null
            : {
                bundleIdentifier: application.bundleId,
                displayName: application.displayName,
                iconDataURL: await getIcon((application as { appPath: string }).appPath),
                isWebBrowser: browserIds.has(application.bundleId),
              };
        } catch {
          return null;
        }
      }),
    )
  ).filter((entry): entry is AppEntry => entry != null);
}

/** 按 bundle id 的应用清单（原 `$j`）：解析失败时保留 id 兜底条目。 */
async function listApplicationsByBundleIds({
  bundleIdentifiers,
  resolveApplication = createApplicationResolver(),
}: {
  bundleIdentifiers: string[];
  resolveApplication?: (bundleId: string) => Promise<AppEntry | null>;
}) {
  const unique = [...new Set(bundleIdentifiers)];
  return (
    await Promise.all(
      unique.map(async (bundleId) => {
        try {
          const entry = await resolveApplication(bundleId);
          return entry == null || entry.isBackgroundAgent ? null : normalizeAppEntry(entry);
        } catch {
          return {
            bundleIdentifier: bundleId,
            displayName: bundleId.split(".").at(-1) ?? bundleId,
            iconDataURL: null,
            isWebBrowser: false,
          };
        }
      }),
    )
  ).filter((entry): entry is AppEntry => entry != null);
}

export {
  listAmbientSummaries,
  newAmbientSuggestions,
  activeSummaryIntervals,
  listAllApplications,
  listApplicationsByBundleIds,
  createApplicationResolver,
  listSummaries,
  type AppEntry,
  type Frontmatter,
  type MemorySummaryInterval,
};
