// Windows 原生应用图标 + sky addon 家族（原 main-C-Mhak1n.ts 9,983-11,091 行的
// `kae/Aae/jae/Mae/Is/Nae/Ls/Pae/Fae/Rs/zs`（windows 图标 addon + LRU）、
// `Bs/Iae/Vs`（sky addon 加载器）、`Lae/Rae/zae/Hs/Bae`（frontmost 窗口 schema +
// LRU）、`Us/Ws/Gs/Ks/qs/Js/Ys/Xs/Zs/Qs/$s`（窗口拖拽/图标）、
// `ec/tc`（SkyComputerUseService spawn / 进程匹配）、
// `nc..Ac`（隐私终止请求 + remote-hosted PIP 内容宿主包装）、
// `jc/Mc/Nc/Pc/Fc`（browser-use PIP 呈现管理器）、
// `Ic/Lc/Rc/zc/Bc/Vc/Hc/Uc`（chrome 标签页聚焦的裸管道客户端）。
//
// 两个原生 addon：
//   - `computer-use-app-icons.node`（windows 图标，schema 校验 iconSmallForAppPath）
//   - `sky.node`（darwin：拖拽/图标/服务 spawn/PIP 内容宿主等全部能力）
// 均惰性加载（每次调用重新探测路径并 require；失败抛错由各包装函数吞掉或上抛）。
//
// 模块顶层可变状态（深析 §4）：
//   - `windowsIconCache`（原 `Is`，9,987）：LRU（容量 100），bundleId 小写 →
//     图标 promise；命中会重插到 MRU 端。
//   - `appIconCache`（原 `Hs`，10,089）：LRU（容量 100），`platform:path` →
//     图标 promise。
//
// 本模块无其他模块加载期副作用（Map/常量/logger 构造）。

import { createConnection } from "node:net";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { readdir } from "node:fs/promises";
import { endianness } from "node:os";
import { join as pathJoin } from "node:path";
import { Buffer } from "node:buffer";

import { app } from "electron";
import { resolveElectronResourcesPath } from "@chunk/electron-resources-path";
import { createTaggedLogger, memoizedTaggedLogger } from "@chunk/logger";
// @chunk/shared 的压缩名导出，按语义重命名导入：
//   wf/Of/_f/hf/bf → zod 构造器（object/string/custom/array/literal）
//   Pc → 浏览器族配置表（browserIconAssetPath）
//   Bc → isKnownBrowserFamily
//   tu → isComputerUseServerName（computer-use MCP server 判定）
import {
  Bc as isKnownBrowserFamily,
  Pc as BROWSER_FAMILY_CONFIG,
  bf as literalSchema_,
  df as enumSchema_,
  hf as arraySchema_,
  Of as stringSchema_,
  tu as isComputerUseServerName,
  wf as objectSchema_,
  _f as customSchema_,
} from "@chunk/shared";

// 压缩名导入后重绑为 any：d.ts 的 Schema 接口未声明 zod 的链式方法。
const objectSchema: any = objectSchema_;
const stringSchema: any = stringSchema_;
const arraySchema: any = arraySchema_;
const literalSchema: any = literalSchema_;
const customSchema: any = customSchema_;

// ---- Windows 图标 addon（原 kae/Aae/jae/Mae/Is/Nae/Ls/Pae/Fae/Rs/zs）--------

/** windows 图标 addon 的 schema（原 `kae`）。 */
const windowsIconAddonSchema: any = objectSchema({
  iconSmallForAppPath: customSchema((value: unknown) => typeof value === `function`),
});

/** windows 图标 LRU 容量（原 `Aae`）。 */
const WINDOWS_ICON_CACHE_CAPACITY = 100;
/** windows 图标查询超时（原 `jae`）。 */
const WINDOWS_ICON_TIMEOUT_MS = 1e4;
/** windows 图标 addon 文件名（原 `Mae`）。 */
const WINDOWS_ICON_ADDON_NAME = `computer-use-app-icons.node`;

/**
 * windows 图标 LRU（原 `Is`，模块顶层可变状态）：
 * 规范化路径（小写）→ 图标 dataURL promise。
 */
const windowsIconCache = new Map<string, Promise<string | null>>();

/** windows 图标 addon 的 require（原 `Nae`）。 */
const requireWindowsIconAddon = createRequire(__filename);

/** 具名 logger（原 `Ls`，r.r → 直接 Logger 实例）。 */
const windowsIconLogger = createTaggedLogger(`windows-native-app-icon`);

/**
 * 取 Windows 应用的 16px 图标 dataURL（原 `Pae`，win32 专用）。
 *
 * LRU 缓存（容量 100，命中重插 MRU 端）；查询带 10s 超时（超时记
 * windows_app_icon_timed_out 并返回 null）；addon 抛错记
 * windows_app_icon_failed 返回 null。
 */
export async function getWindowsAppIconSmall(
  appPath: string,
  {
    addon,
    electronAppPath = pathJoin(__dirname, `..`),
    resourcesPath = resolveElectronResourcesPath({
      env: process.env,
      resourcesPath: process.resourcesPath,
    }),
  }: {
    addon?: any;
    electronAppPath?: string;
    resourcesPath?: string | null;
  } = {},
): Promise<string | null> {
  const normalized = normalizeWindowsAppPath(appPath);
  if (normalized === ``) return null;
  const cacheKey = normalized.toLowerCase();
  const cached = windowsIconCache.get(cacheKey);
  if (cached != null) {
    // LRU 命中：重插到 MRU 端
    windowsIconCache.delete(cacheKey);
    windowsIconCache.set(cacheKey, cached);
    return cached;
  }
  const load = queryWindowsAppIcon(normalized, { addon, electronAppPath, resourcesPath }).then(
    (icon) => {
      if (icon == null) windowsIconCache.delete(cacheKey);
      return icon;
    },
  );
  windowsIconCache.set(cacheKey, load);
  while (windowsIconCache.size > WINDOWS_ICON_CACHE_CAPACITY) {
    const oldestKey = windowsIconCache.keys().next().value;
    if (oldestKey == null) break;
    windowsIconCache.delete(oldestKey);
  }
  return load;
}

/** 单次 windows 图标查询（超时/失败吞掉，原 `Fae`）。 */
async function queryWindowsAppIcon(
  appPath: string,
  {
    addon,
    electronAppPath,
    resourcesPath,
  }: { addon?: any; electronAppPath: string; resourcesPath?: string | null },
): Promise<string | null> {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(() =>
        (addon ?? loadWindowsIconAddon({ electronAppPath, resourcesPath })).iconSmallForAppPath(
          appPath,
        ),
      ),
      new Promise<null>((resolve) => {
        timeout = setTimeout(() => {
          windowsIconLogger.info(`windows_app_icon_timed_out`, { safe: {}, sensitive: {} });
          resolve(null);
        }, WINDOWS_ICON_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    windowsIconLogger.info(`windows_app_icon_failed`, { safe: {}, sensitive: { error } });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 规范化 windows 应用路径（原 `Rs`）：`process:` 前缀且剩余部分含路径分隔符时
 * 剥掉前缀，否则原样返回。
 */
function normalizeWindowsAppPath(appPath: string): string {
  const trimmed = appPath.trim();
  if (trimmed.toLowerCase().startsWith(`process:`)) {
    const rest = trimmed.slice(8).trim();
    if (rest.includes(`\\`) || rest.includes(`/`)) return rest;
  }
  return trimmed;
}

/**
 * 加载 windows 图标 addon（原 `zs`）：
 * 优先 resourcesPath/native，其次 electronAppPath 下的构建产物（按 arch）。
 * 加载后经 schema 校验；失败记 windows_app_icon_addon_load_failed 并上抛；
 * 全部缺失记 windows_app_icon_addon_missing 并抛
 * `Windows native desktop app icons addon is unavailable`。
 */
function loadWindowsIconAddon({
  electronAppPath,
  resourcesPath,
}: {
  electronAppPath: string;
  resourcesPath?: string | null;
}): any {
  for (const addonPath of [
    ...(resourcesPath == null ? [] : [pathJoin(resourcesPath, `native`, WINDOWS_ICON_ADDON_NAME)]),
    pathJoin(
      electronAppPath,
      `native`,
      `computer-use-app-icons-addon`,
      `build`,
      `Release-${process.arch}`,
      `computer_use_app_icons.node`,
    ),
  ]) {
    if (existsSync(addonPath))
      try {
        return windowsIconAddonSchema.parse(requireWindowsIconAddon(addonPath));
      } catch (error) {
        windowsIconLogger.warning(`windows_app_icon_addon_load_failed`, {
          safe: {
            arch: process.arch,
            platform: process.platform,
            nodeVersion: process.versions.node,
          },
          sensitive: { addonPath, runtimeExecutable: process.execPath, error },
        });
        throw error;
      }
  }
  windowsIconLogger.warning(`windows_app_icon_addon_missing`, {
    safe: { arch: process.arch, platform: process.platform },
    sensitive: { electronAppPath, resourcesPath },
  });
  throw new Error(`Windows native desktop app icons addon is unavailable`);
}

// ---- sky addon 加载器（原 Bs/Iae/Vs）---------------------------------------

/** sky addon 文件名（原 `Bs`）。 */
const SKY_ADDON_NAME = `sky.node`;

/** sky addon 的 require（原 `Iae`）。 */
const requireSkyAddon = createRequire(__filename);

/**
 * 加载 sky addon（原 `Vs`，惰性：每次调用重新探测）：
 * 优先 resourcesPath/native/sky.node，其次 electronAppPath 下的构建产物。
 * 全部缺失抛 `Sky native addon is unavailable`（无日志）。
 */
export function loadSkyAddon({
  electronAppPath,
  resourcesPath,
}: {
  electronAppPath: string;
  resourcesPath?: string | null;
}): any {
  const candidates = [
    ...(resourcesPath == null ? [] : [pathJoin(resourcesPath, `native`, SKY_ADDON_NAME)]),
    pathJoin(electronAppPath, `native`, `sky-addon`, `build`, `Release-${process.arch}`, SKY_ADDON_NAME),
  ];
  for (const candidate of candidates) if (existsSync(candidate)) return requireSkyAddon(candidate);
  throw new Error(`Sky native addon is unavailable`);
}

// ---- frontmost 窗口 + 跨平台图标 LRU（原 Lae/Rae/zae/Hs/Bae/Js/Ys/Xs/Zs/Qs/$s）

/** 跨平台图标 LRU 容量（原 `Lae`）。 */
const APP_ICON_CACHE_CAPACITY = 100;
/** frontmost 窗口查询超时（原 `Rae`）。 */
const FRONTMOST_WINDOW_TIMEOUT_MS = 1e4;
/** 浏览器 PIP 图标资源查找的插件目录（原 `zae`）。 */
const BROWSER_ICON_PLUGIN_DIRS = [`chrome-internal`, `chrome-dev`, `chrome`];

/**
 * 跨平台图标 LRU（原 `Hs`，模块顶层可变状态）：`platform:path` → 图标 promise。
 */
const appIconCache = new Map<string, Promise<string | null>>();

/** frontmost 窗口信息 schema（原 `Bae`）。 */
const frontmostWindowSchema: any = objectSchema({
  bundleIdentifier: stringSchema(),
  iconSmallDataURL: stringSchema()
    .nullish()
    .transform((value: unknown) => value ?? null),
  name: stringSchema(),
  windowTitle: stringSchema()
    .nullish()
    .transform((value: unknown) => value ?? null),
});

/** sky addon 包装的公共选项。 */
export interface SkyAddonCallOptions {
  /** 注入的 addon 实例（测试用）。 */
  addon?: any;
  /** Electron app 根路径（默认 app.getAppPath()）。 */
  electronAppPath?: string;
  /** 平台（默认 process.platform）。 */
  platform?: string;
  /** resources 路径（默认 process.resourcesPath）。 */
  resourcesPath?: string | null;
}

/** 解析包装函数的默认 electronAppPath。 */
function defaultElectronAppPath(electronAppPath?: string): string {
  return electronAppPath ?? app.getAppPath();
}

/** 注册窗口拖拽目标（原 `Us`，darwin）。 */
export function setWindowDragTarget(
  window: { getNativeWindowHandle(): Buffer } | null | undefined,
  { addon, electronAppPath, platform: platformName = process.platform, resourcesPath = process.resourcesPath }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin`) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath: defaultElectronAppPath(electronAppPath), resourcesPath })
    ).setWindowDragTarget(window?.getNativeWindowHandle() ?? null);
  } catch {
    return false;
  }
}

/** 执行窗口拖拽（原 `Ws`，darwin）。 */
export function performWindowDrag(
  window: { getNativeWindowHandle(): Buffer },
  dragParams: Record<string, unknown>,
  displayBounds: unknown,
  {
    addon,
    electronAppPath,
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin`) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath: defaultElectronAppPath(electronAppPath), resourcesPath })
    ).performWindowDrag({
      nativeWindowHandle: window.getNativeWindowHandle(),
      displayBounds,
      ...dragParams,
    });
  } catch {
    return false;
  }
}

/** 查询窗口拖拽是否进行中（原 `Gs`，darwin）。 */
export function isWindowDragActive(
  window: { getNativeWindowHandle(): Buffer },
  {
    addon,
    electronAppPath,
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin`) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath: defaultElectronAppPath(electronAppPath), resourcesPath })
    ).isWindowDragActive(window.getNativeWindowHandle());
  } catch {
    return false;
  }
}

/** 结束窗口拖拽（原 `Ks`，darwin）。 */
export function finishWindowDrag(
  window: { getNativeWindowHandle(): Buffer },
  {
    addon,
    electronAppPath,
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): unknown {
  if (platformName !== `darwin`) return null;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath: defaultElectronAppPath(electronAppPath), resourcesPath })
    ).finishWindowDrag(window.getNativeWindowHandle());
  } catch {
    return null;
  }
}

/** 查询最前台应用窗口信息（原 `qs`，darwin；10s 超时）。 */
export async function getFrontmostWindow({
  addon,
  electronAppPath = app.getAppPath(),
  platform: platformName = process.platform,
  resourcesPath = process.resourcesPath,
}: SkyAddonCallOptions = {}): Promise<unknown> {
  if (platformName !== `darwin`) return null;
  try {
    let timeout: NodeJS.Timeout | null = null;
    const raw = await Promise.race([
      (addon ?? loadSkyAddon({ electronAppPath, resourcesPath })).frontmostWindow(),
      new Promise<null>((resolve) => {
        timeout = setTimeout(() => {
          resolve(null);
        }, FRONTMOST_WINDOW_TIMEOUT_MS);
        timeout.unref();
      }),
    ]).finally(() => {
      if (timeout != null) clearTimeout(timeout);
    });
    return raw == null ? null : frontmostWindowSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * 取应用 16px 图标（跨平台，原 `Js`）：darwin 用 sky addon，win32 用 windows
 * 图标 addon；LRU 缓存按 `platform:path`。
 */
export async function getAppIconSmall(
  appPath: string,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = resolveElectronResourcesPath({
      env: process.env,
      resourcesPath: process.resourcesPath,
    }),
  }: SkyAddonCallOptions = {},
): Promise<string | null> {
  const normalized = normalizeIconAppPath(appPath, platformName);
  if (normalized === ``) return null;
  const cacheKey = iconCacheKey(normalized, platformName);
  const cached = appIconCache.get(cacheKey);
  if (cached != null) {
    appIconCache.delete(cacheKey);
    appIconCache.set(cacheKey, cached);
    return cached;
  }
  const load = queryAppIconSmall(normalized, {
    addon,
    electronAppPath,
    platform: platformName,
    resourcesPath,
  }).then((icon) => {
    if (icon == null) appIconCache.delete(cacheKey);
    return icon;
  });
  appIconCache.set(cacheKey, load);
  evictAppIconCache();
  return load;
}

/** 取应用中等图标（原 `Ys`，darwin 且路径以 .app 结尾；无缓存）。 */
export async function getAppIconMedium(
  appPath: string,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = resolveElectronResourcesPath({
      env: process.env,
      resourcesPath: process.resourcesPath,
    }),
  }: SkyAddonCallOptions = {},
): Promise<string | null> {
  if (platformName !== `darwin` || !appPath.endsWith(`.app`)) return null;
  try {
    return await (
      addon ?? loadSkyAddon({ electronAppPath: defaultElectronAppPath(electronAppPath), resourcesPath })
    ).iconMediumForAppPath(appPath);
  } catch {
    return null;
  }
}

/** 按平台规范化图标路径（原 `Xs`）：win32 走 windows 规范化，darwin trim。 */
function normalizeIconAppPath(appPath: string, platformName: string): string {
  return platformName === `win32`
    ? normalizeWindowsAppPath(appPath)
    : platformName === `darwin`
      ? appPath.trim()
      : ``;
}

/** 单次跨平台图标查询（原 `Zs`；失败返回 null）。 */
async function queryAppIconSmall(
  appPath: string,
  {
    addon,
    electronAppPath,
    platform: platformName,
    resourcesPath,
  }: Required<Pick<SkyAddonCallOptions, "electronAppPath" | "platform" | "resourcesPath">> &
    SkyAddonCallOptions,
): Promise<string | null> {
  try {
    if (platformName === `darwin`)
      return await (
        addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
      ).iconSmallForAppPath(appPath);
    if (platformName === `win32`)
      return await (
        addon ?? loadWindowsIconAddon({ electronAppPath, resourcesPath })
      ).iconSmallForAppPath(appPath);
    return null;
  } catch {
    return null;
  }
}

/** 图标缓存键（原 `Qs`）：win32 路径小写。 */
function iconCacheKey(appPath: string, platformName: string): string {
  return `${platformName}:${platformName === `win32` ? appPath.toLowerCase() : appPath}`;
}

/** LRU 淘汰到容量内（原 `$s`）。 */
function evictAppIconCache(): void {
  while (appIconCache.size > APP_ICON_CACHE_CAPACITY) {
    const oldestKey = appIconCache.keys().next().value;
    if (oldestKey == null) return;
    appIconCache.delete(oldestKey);
  }
}

// ---- SkyComputerUseService spawn / 进程匹配（原 ec/tc）---------------------

/** spawn 托管服务进程（原 `ec`，darwin；返回 pid）。 */
export async function spawnComputerUseService(
  executablePath: string,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): Promise<number | null> {
  return platformName !== `darwin` || executablePath.trim() === ``
    ? null
    : (
        addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
      ).spawnComputerUseService(executablePath);
}

/** 判定 pid 是否本服务进程（原 `tc`，darwin；pid 正整数 + 路径非空）。 */
export function computerUseServiceProcessMatchesExecutablePath(
  pid: number,
  executablePath: string,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin` || !Number.isSafeInteger(pid) || pid <= 0 || executablePath.trim() === ``)
    return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).computerUseServiceProcessMatchesExecutablePath(pid, executablePath);
  } catch {
    return false;
  }
}

// ---- 隐私终止请求 + remote-hosted PIP 内容宿主包装（原 nc..Ac）---------------

/** 是否隐私设置终止请求（原 `nc`，darwin）。 */
export function isPrivacySettingsTerminationRequest({
  addon,
  electronAppPath = app.getAppPath(),
  platform: platformName = process.platform,
  resourcesPath = process.resourcesPath,
}: SkyAddonCallOptions = {}): boolean {
  if (platformName !== `darwin`) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).isPrivacySettingsTerminationRequest();
  } catch {
    return false;
  }
}

/** 启动 PIP 内容宿主（原 `rc`，darwin）。 */
export function startRemoteHostedPIPContentHost({
  addon,
  controlTooltips,
  electronAppPath = app.getAppPath(),
  onServiceConnectionLost,
  platform: platformName = process.platform,
  resourcesPath = process.resourcesPath,
}: SkyAddonCallOptions & {
  controlTooltips: unknown;
  onServiceConnectionLost: unknown;
}): boolean {
  if (platformName !== `darwin`) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).startRemoteHostedPIPContentHost(controlTooltips, onServiceConnectionLost);
  } catch {
    return false;
  }
}

/** 连接 PIP 内容宿主（原 `ic`，darwin）。 */
export function connectRemoteHostedPIPContentHost(
  hostId: number,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin` || !Number.isSafeInteger(hostId) || hostId <= 0) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).connectRemoteHostedPIPContentHost(hostId);
  } catch {
    return false;
  }
}

/** 停止 PIP 内容宿主（原 `ac`，darwin）。 */
export function stopRemoteHostedPIPContentHost({
  addon,
  electronAppPath = app.getAppPath(),
  platform: platformName = process.platform,
  resourcesPath = process.resourcesPath,
}: SkyAddonCallOptions = {}): boolean {
  if (platformName !== `darwin`) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).stopRemoteHostedPIPContentHost();
  } catch {
    return false;
  }
}

/** 设置 PIP 活跃线程（原 `oc`，darwin）。 */
export function setRemoteHostedPIPContentActiveThreadID(
  threadId: unknown,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin`) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).setRemoteHostedPIPContentActiveThreadID(threadId);
  } catch {
    return false;
  }
}

/** 设置 PIP 抑制线程（原 `sc`，darwin）。 */
export function setRemoteHostedPIPContentSuppressedThreadIDs(
  threadIds: unknown,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin`) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).setRemoteHostedPIPContentSuppressedThreadIDs(threadIds);
  } catch {
    return false;
  }
}

/** 设置任务可见性判定 handler（原 `cc`，darwin）。 */
export function setRemoteHostedPIPContentShouldShowTaskHandler(
  handler: unknown,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin`) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).setRemoteHostedPIPContentShouldShowTaskHandler(handler);
  } catch {
    return false;
  }
}

/** 设置视频帧 handler（原 `lc`，darwin）。 */
export function setRemoteHostedPIPContentVideoFrameHandler(
  handler: unknown,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin`) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).setRemoteHostedPIPContentVideoFrameHandler(handler);
  } catch {
    return false;
  }
}

/** 开关原生视频（原 `uc`，darwin；id 数组非空）。 */
export function setRemoteHostedPIPContentNativeVideoEnabled(
  presentationIds: Array<number | string>,
  enabled: boolean,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin` || presentationIds.length === 0) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).setRemoteHostedPIPContentNativeVideoEnabled(presentationIds, enabled);
  } catch {
    return false;
  }
}

/** 标记原生视频就绪（原 `dc`，darwin）。 */
export function setRemoteHostedPIPContentNativeVideoReady(
  presentationIds: Array<number | string>,
  ready: boolean,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin` || presentationIds.length === 0) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).setRemoteHostedPIPContentNativeVideoReady(presentationIds, ready);
  } catch {
    return false;
  }
}

/** 设置呈现位置（原 `fc`，darwin）。 */
export function setRemoteHostedPIPContentPlacement(
  presentationIds: Array<number | string>,
  placement: unknown,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin` || presentationIds.length === 0) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).setRemoteHostedPIPContentPlacement(presentationIds, placement);
  } catch {
    return false;
  }
}

/** 与呈现交互（原 `pc`，darwin；两组 id 数组均非空）。 */
export function interactWithRemoteHostedPIPContentPresentation(
  presentationIds: Array<number | string>,
  interactionIds: Array<number | string>,
  interaction: unknown,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin` || presentationIds.length === 0 || interactionIds.length === 0)
    return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).interactWithRemoteHostedPIPContentPresentation(presentationIds, interactionIds, interaction);
  } catch {
    return false;
  }
}

/** 刷新呈现可见性（原 `mc`，darwin；参数缺省刷新全部）。 */
export function refreshRemoteHostedPIPContentVisibility(
  presentationId: number | string | null,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin`) return false;
  try {
    const skyAddon = addon ?? loadSkyAddon({ electronAppPath, resourcesPath });
    return presentationId == null
      ? skyAddon.refreshRemoteHostedPIPContentVisibility()
      : skyAddon.refreshRemoteHostedPIPContentVisibility(presentationId);
  } catch {
    return false;
  }
}

/** 设置最大显示尺寸（原 `hc`，darwin；有限数）。 */
export function setRemoteHostedPIPContentMaxDisplaySize(
  maxSize: number,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin` || !Number.isFinite(maxSize)) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).setRemoteHostedPIPContentMaxDisplaySize(maxSize);
  } catch {
    return false;
  }
}

/** 设置最大显示尺寸变更 handler（原 `gc`，darwin）。 */
export function setRemoteHostedPIPContentMaxDisplaySizeChangedHandler(
  handler: unknown,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin`) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).setRemoteHostedPIPContentMaxDisplaySizeChangedHandler(handler);
  } catch {
    return false;
  }
}

/** 读取布局状态（原 `_c`，darwin）。 */
export function getRemoteHostedPIPContentLayoutState({
  addon,
  electronAppPath,
  platform: platformName = process.platform,
  resourcesPath = process.resourcesPath,
}: SkyAddonCallOptions = {}): unknown {
  if (platformName !== `darwin`) return null;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath: defaultElectronAppPath(electronAppPath), resourcesPath })
    ).getRemoteHostedPIPContentLayoutState();
  } catch {
    return null;
  }
}

/** 设置布局状态变更 handler（原 `vc`，darwin）。 */
export function setRemoteHostedPIPContentLayoutStateChangedHandler(
  handler: unknown,
  {
    addon,
    electronAppPath,
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin`) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath: defaultElectronAppPath(electronAppPath), resourcesPath })
    ).setRemoteHostedPIPContentLayoutStateChangedHandler(handler);
  } catch {
    return false;
  }
}

/** 是否有任意呈现（原 `yc`，darwin）。 */
export function hasRemoteHostedPIPContentAnyPresentation({
  addon,
  electronAppPath = app.getAppPath(),
  platform: platformName = process.platform,
  resourcesPath = process.resourcesPath,
}: SkyAddonCallOptions = {}): boolean {
  if (platformName !== `darwin`) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).hasRemoteHostedPIPContentAnyPresentation();
  } catch {
    return false;
  }
}

/** 活跃任务 id 列表（原 `bc`，darwin）。 */
export function getRemoteHostedPIPContentActiveTaskIDs({
  addon,
  electronAppPath = app.getAppPath(),
  platform: platformName = process.platform,
  resourcesPath = process.resourcesPath,
}: SkyAddonCallOptions = {}): Array<number | string> {
  if (platformName !== `darwin`) return [];
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).getRemoteHostedPIPContentActiveTaskIDs();
  } catch {
    return [];
  }
}

/** 设置 pet 唤醒 handler（原 `xc`，darwin）。 */
export function setRemoteHostedPIPContentPetWakeRequestHandler(
  handler: unknown,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin`) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).setRemoteHostedPIPContentPetWakeRequestHandler(handler);
  } catch {
    return false;
  }
}

/** 设置可见性请求 handler（原 `Sc`，darwin）。 */
export function setRemoteHostedPIPContentVisibilityRequestHandler(
  handler: unknown,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin`) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).setRemoteHostedPIPContentVisibilityRequestHandler(handler);
  } catch {
    return false;
  }
}

/** 设置 computer-use 光标位置 handler（原 `Cc`，darwin）。 */
export function setRemoteHostedPIPContentComputerUseCursorLocationHandler(
  handler: unknown,
  {
    addon,
    electronAppPath,
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin`) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath: defaultElectronAppPath(electronAppPath), resourcesPath })
    ).setRemoteHostedPIPContentComputerUseCursorLocationHandler(handler);
  } catch {
    return false;
  }
}

/** 设置 browser-use PIP 点击 handler（原 `wc`，darwin）。 */
export function setBrowserUsePIPContentClickHandler(
  handler: unknown,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin`) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).setBrowserUsePIPContentClickHandler(handler);
  } catch {
    return false;
  }
}

// ---- PIP host 注册/注销/turn 生命周期（原 Tc/Ec/Dc/Oc）-----------------------

/** 注册 PIP 内容宿主（原 `Tc`，darwin）。 */
export function registerRemoteHostedPIPContentHost(
  presentationId: string,
  window: {
    getContentBounds(): unknown;
    getTitle(): string;
    getNativeWindowHandle?: () => Buffer;
  },
  {
    addon,
    anchors = null,
    anchorRect = null,
    animated = false,
    animationSpring,
    electronAppPath = app.getAppPath(),
    isCodexHomeAvailable = false,
    interactionPassthroughRect = null,
    platform: platformName = process.platform,
    presentationScope = `thread`,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions & {
    anchors?: unknown;
    anchorRect?: unknown;
    animated?: boolean;
    animationSpring?: unknown;
    isCodexHomeAvailable?: boolean;
    interactionPassthroughRect?: unknown;
    presentationScope?: string;
  } = {},
): boolean {
  if (platformName !== `darwin` || presentationId.trim() === ``) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).registerRemoteHostedPIPContentHost({
      anchors,
      anchorRect,
      animated,
      ...(animationSpring == null ? {} : { animationSpring }),
      contentBounds: window.getContentBounds(),
      id: presentationId,
      isCodexHomeAvailable,
      interactionPassthroughRect,
      nativeWindowHandle:
        typeof window.getNativeWindowHandle === `function` ? window.getNativeWindowHandle() : null,
      presentationScope,
      title: window.getTitle(),
    });
  } catch {
    return false;
  }
}

/** 注销 PIP 内容宿主（原 `Ec`，darwin）。 */
export function unregisterRemoteHostedPIPContentHost(
  presentationId: string,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin` || presentationId.trim() === ``) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).unregisterRemoteHostedPIPContentHost(presentationId);
  } catch {
    return false;
  }
}

/** 完成线程呈现（原 `Dc`，darwin）。 */
export function completeRemoteHostedPIPContentThread(
  threadId: string,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin` || threadId.trim() === ``) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).completeRemoteHostedPIPContentThread(threadId);
  } catch {
    return false;
  }
}

/** 使 turn 失效（原 `Oc`，darwin）。 */
export function invalidateRemoteHostedPIPContentTurn(
  threadId: string,
  turnId: string,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin` || threadId.trim() === `` || turnId.trim() === ``) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).invalidateRemoteHostedPIPContentTurn(threadId, turnId);
  } catch {
    return false;
  }
}

/** 更新 browser-use PIP 呈现（原 `kc`，darwin；chrome 后端解析浏览器图标资源）。 */
export function upsertBrowserUsePIPContent(
  presentationId: string,
  threadId: string,
  imageDataURL: string,
  backend: string,
  browserFamily: string | undefined,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = resolveElectronResourcesPath({
      env: process.env,
      resourcesPath: process.resourcesPath,
    }),
  }: SkyAddonCallOptions = {},
): boolean {
  if (
    platformName !== `darwin` ||
    presentationId.trim() === `` ||
    threadId.trim() === `` ||
    !imageDataURL.startsWith(`data:image/`)
  )
    return false;
  try {
    const browserIconAssetPath =
      backend === `chrome` ? BROWSER_FAMILY_CONFIG[browserFamily ?? `chrome`].browserIconAssetPath : null;
    const iconAssetPath =
      resourcesPath == null || browserIconAssetPath == null
        ? null
        : (BROWSER_ICON_PLUGIN_DIRS.flatMap((pluginDir) =>
            [``, `app.asar.unpacked`].map((asarSegment) =>
              pathJoin(resourcesPath, asarSegment, `plugins`, `openai-bundled`, `plugins`, pluginDir, browserIconAssetPath),
            ),
          ).find((candidate) => existsSync(candidate)) ?? null);
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).upsertBrowserUsePIPContent(presentationId, threadId, imageDataURL, iconAssetPath);
  } catch {
    return false;
  }
}

/** 使 browser-use PIP 呈现失效（原 `Ac`，darwin）。 */
export function invalidateBrowserUsePIPContent(
  presentationId: string,
  {
    addon,
    electronAppPath = app.getAppPath(),
    platform: platformName = process.platform,
    resourcesPath = process.resourcesPath,
  }: SkyAddonCallOptions = {},
): boolean {
  if (platformName !== `darwin` || presentationId.trim() === ``) return false;
  try {
    return (
      addon ?? loadSkyAddon({ electronAppPath, resourcesPath })
    ).invalidateBrowserUsePIPContent(presentationId);
  } catch {
    return false;
  }
}

// ---- browser-use PIP 呈现管理器（原 jc/Mc/Nc/Pc/Fc）--------------------------

/** browser-use toolSurface 元数据 schema（原 `jc`）。 */
const browserUseToolSurfaceSchema: any = objectSchema({
  kind: literalSchema(`browserUse`),
  backend: enumSchema_([`chrome`, `iab`, `cdp`]),
  browserId: stringSchema().trim().min(1),
  browserFamily: customSchema(
    (value: unknown) => typeof value === `string` && isKnownBrowserFamily(value),
  ).optional(),
  extensionInstanceId: stringSchema().trim().min(1).optional(),
  openTabIds: arraySchema(stringSchema().trim().min(1)).optional(),
  sessionEnded: literalSchema(true).optional(),
  screenshot: objectSchema({
    tabId: stringSchema().trim().min(1),
    url: stringSchema().startsWith(`data:image/`),
  }).optional(),
});

/** 通知的 _meta schema（原 `Mc`）。 */
const browserUseToolSurfaceMetaSchema: any = objectSchema({
  "codex/toolSurface": browserUseToolSurfaceSchema,
});

/** 具名 logger（原 `Nc`，r.i → 惰性）。 */
const browserUsePipLogger = memoizedTaggedLogger(`browser-use-pip`);

/** browser-use toolSurface 元数据。 */
export interface BrowserUseToolSurface {
  kind: `browserUse`;
  backend: string;
  browserId: string;
  browserFamily?: string;
  extensionInstanceId?: string;
  openTabIds?: string[];
  sessionEnded?: boolean;
  screenshot?: { tabId: string; url: string };
}

/** PIP 管理器的依赖注入面。 */
export interface BrowserUsePipManagerOptions {
  appServerConnection: { registerInternalNotificationHandler(handler: (n: any) => void): () => void };
  /** 聚焦呈现（异步；失败仅告警）。 */
  focusPresentation: (presentationId: string) => Promise<boolean>;
  /** 使原生/渲染呈现失效（默认 invalidateBrowserUsePIPContent）。 */
  invalidatePresentation?: (presentationId: string) => boolean;
  /** 是否启用原生呈现（默认 true）。 */
  nativePresentationEnabled?: boolean;
  /** 线程活跃翻转回调。 */
  onActivityChanged: (threadId: string, active: boolean) => void;
  /** 渲染侧呈现移除回调。 */
  onFrameRemoved?: (presentationId: string) => void;
  /** 渲染侧呈现更新回调。 */
  onFrameUpserted?: (frame: {
    backend: string;
    imageDataURL: string;
    presentationID: string;
    tabID: string;
    threadID: string;
  }) => void;
  /** 点击 handler 安装器（默认 setBrowserUsePIPContentClickHandler）。 */
  setClickHandler?: (handler: ((presentationId: string) => void) | null) => void;
  /** 原生呈现更新器（默认 upsertBrowserUsePIPContent）。 */
  upsertPresentation?: (
    presentationId: string,
    threadId: string,
    imageDataURL: string,
    backend: string,
    browserFamily: string | undefined,
  ) => boolean;
}

/**
 * browser-use PIP 呈现管理器（原 `Pc`）：
 * 订阅 app-server 通知，把 browser-use 工具调用的截图/标签页元数据映射为
 * PIP 呈现（渲染侧回调 + 可选的原生 PIP），并跟踪线程活跃度。
 * turn 完成与线程归档/关闭/删除时清理该线程的全部呈现。
 */
export function createBrowserUsePipManager({
  appServerConnection,
  focusPresentation,
  invalidatePresentation = invalidateBrowserUsePIPContent,
  nativePresentationEnabled = true,
  onActivityChanged,
  onFrameRemoved = () => {},
  onFrameUpserted = () => {},
  setClickHandler = setBrowserUsePIPContentClickHandler,
  upsertPresentation = upsertBrowserUsePIPContent,
}: BrowserUsePipManagerOptions): { dispose: () => void } {
  /** presentationKey → 该键的呈现集合。 */
  const presentationsByKey = new Map<
    string,
    { nativePresentationIDs: Set<string>; presentationIDsByTabID: Map<string, string>; threadID: string }
  >();
  /** threadId → 活跃 presentationKey 计数。 */
  const activeCountsByThread = new Map<string, number>();
  /** presentationId → 点击聚焦所需信息。 */
  const focusTargetsByPresentation = new Map<
    string,
    { backend: string; sessionID: string; tabID: string; extensionInstanceID?: string }
  >();

  setClickHandler((presentationId) => {
    const target = focusTargetsByPresentation.get(presentationId);
    if (target == null) return;
    focusPresentation(presentationId)
      .then((focused) => {
        if (!focused)
          browserUsePipLogger().warning(`Failed to focus Browser Use PiP content`, {
            safe: { backend: target.backend, tabID: target.tabID },
            sensitive: {},
          });
      })
      .catch((error) => {
        browserUsePipLogger().warning(`Failed to focus Browser Use PiP content`, {
          safe: { backend: target.backend, tabID: target.tabID },
          sensitive: { error },
        });
      });
  });

  /** 为 presentationKey 建立呈现集合并计线程活跃。 */
  const ensurePresentations = (key: string, threadId: string) => {
    const entry = {
      nativePresentationIDs: new Set<string>(),
      presentationIDsByTabID: new Map<string, string>(),
      threadID: threadId,
    };
    presentationsByKey.set(key, entry);
    const previousCount = activeCountsByThread.get(threadId) ?? 0;
    activeCountsByThread.set(threadId, previousCount + 1);
    if (previousCount === 0) onActivityChanged(threadId, true);
    return entry;
  };

  /** 移除 presentationKey 的全部呈现并递减线程活跃。 */
  const removePresentations = (key: string) => {
    const entry = presentationsByKey.get(key);
    if (entry == null) return;
    for (const presentationId of entry.presentationIDsByTabID.values()) {
      onFrameRemoved(presentationId);
      if (entry.nativePresentationIDs.has(presentationId)) invalidatePresentation(presentationId);
      focusTargetsByPresentation.delete(presentationId);
    }
    presentationsByKey.delete(key);
    const count = activeCountsByThread.get(entry.threadID) ?? 0;
    if (count <= 1) {
      activeCountsByThread.delete(entry.threadID);
      onActivityChanged(entry.threadID, false);
      return;
    }
    activeCountsByThread.set(entry.threadID, count - 1);
  };

  /** 移除某线程的全部呈现。 */
  const removePresentationsForThread = (threadId: string) => {
    for (const [key, entry] of presentationsByKey)
      if (entry.threadID === threadId) removePresentations(key);
  };

  const unsubscribe = appServerConnection.registerInternalNotificationHandler((notification) => {
    const parsed = parseBrowserUseSurfaceNotification(notification);
    if (parsed != null) {
      const { surface, threadID } = parsed;
      const key = JSON.stringify([threadID, surface.browserId]);
      let entry = presentationsByKey.get(key);
      const shouldKeep =
        surface.openTabIds == null
          ? entry != null || surface.screenshot != null
          : surface.openTabIds.length > 0;
      if (surface.sessionEnded === true || !shouldKeep) {
        removePresentations(key);
        return;
      }
      entry ??= ensurePresentations(key, threadID);
      if (surface.screenshot != null) {
        const presentationId = `browser:${JSON.stringify([threadID, surface.browserId, surface.screenshot.tabId])}`;
        entry.presentationIDsByTabID.set(surface.screenshot.tabId, presentationId);
        onFrameUpserted({
          backend: surface.backend,
          imageDataURL: surface.screenshot.url,
          presentationID: presentationId,
          tabID: surface.screenshot.tabId,
          threadID,
        });
        if (
          nativePresentationEnabled &&
          upsertPresentation(
            presentationId,
            threadID,
            surface.screenshot.url,
            surface.backend,
            surface.browserFamily,
          )
        ) {
          entry.nativePresentationIDs.add(presentationId);
          if (surface.backend === `iab`)
            focusTargetsByPresentation.set(presentationId, {
              backend: surface.backend,
              sessionID: threadID,
              tabID: surface.screenshot.tabId,
            });
          else if (surface.backend === `chrome` && surface.extensionInstanceId != null)
            focusTargetsByPresentation.set(presentationId, {
              backend: surface.backend,
              extensionInstanceID: surface.extensionInstanceId,
              sessionID: threadID,
              tabID: surface.screenshot.tabId,
            });
        } else if (nativePresentationEnabled) {
          browserUsePipLogger().warning(`Failed to upsert Browser Use PiP content`, {
            safe: { backend: surface.backend, tabID: surface.screenshot.tabId },
            sensitive: {},
          });
        }
      }
      if (surface.openTabIds != null) {
        const openTabs = new Set(surface.openTabIds);
        for (const [tabId, presentationId] of entry.presentationIDsByTabID) {
          if (openTabs.has(tabId)) continue;
          onFrameRemoved(presentationId);
          if (entry.nativePresentationIDs.delete(presentationId)) invalidatePresentation(presentationId);
          focusTargetsByPresentation.delete(presentationId);
          entry.presentationIDsByTabID.delete(tabId);
        }
      }
      return;
    }
    if (
      notification.method === `turn/completed` ||
      notification.method === `thread/archived` ||
      notification.method === `thread/closed` ||
      notification.method === `thread/deleted`
    ) {
      if (typeof notification.params?.threadId === `string`)
        removePresentationsForThread(notification.params.threadId);
    }
  });

  return {
    dispose: () => {
      unsubscribe();
      setClickHandler(null);
      for (const key of presentationsByKey.keys()) removePresentations(key);
    },
  };
}

/** 解析 browser-use toolSurface 通知（原 `Fc`；成功记 info 日志）。 */
function parseBrowserUseSurfaceNotification(notification: {
  method: string;
  params?: any;
}): { surface: BrowserUseToolSurface; threadID: string } | null {
  if (
    notification.method !== `item/completed` ||
    typeof notification.params?.threadId !== `string` ||
    typeof notification.params.item !== `object` ||
    notification.params.item == null ||
    !(`type` in notification.params.item) ||
    notification.params.item.type !== `mcpToolCall` ||
    !(`server` in notification.params.item) ||
    typeof notification.params.item.server !== `string` ||
    !isComputerUseServerName(notification.params.item.server) ||
    !(`result` in notification.params.item) ||
    typeof notification.params.item.result !== `object` ||
    notification.params.item.result == null ||
    !(`_meta` in notification.params.item.result)
  )
    return null;
  const parsed = browserUseToolSurfaceMetaSchema.safeParse(notification.params.item.result._meta);
  return parsed.success
    ? (browserUsePipLogger().info(`Received Browser Use PiP metadata`, {
        safe: {
          backend: parsed.data[`codex/toolSurface`].backend,
          browserID: parsed.data[`codex/toolSurface`].browserId,
          tabID: parsed.data[`codex/toolSurface`].screenshot?.tabId,
          threadID: notification.params.threadId,
        },
        sensitive: {},
      }),
      {
        surface: parsed.data[`codex/toolSurface`],
        threadID: notification.params.threadId,
      })
    : null;
}

// ---- chrome 标签页聚焦（原 Ic/Lc/Rc/zc/Bc/Vc/Hc/Uc）--------------------------

/** 帧前缀字节数（原 `Ic`）。 */
const TAB_FOCUS_PREFIX_BYTES = 4;
/** 帧上限（原 `Lc`）。 */
const TAB_FOCUS_MAX_FRAME_BYTES = 8388608;
/** 请求超时（原 `Rc`）。 */
const TAB_FOCUS_TIMEOUT_MS = 1e3;
/** getInfo 响应 schema（原 `zc`）。 */
const tabFocusInfoSchema: any = objectSchema({
  metadata: objectSchema({ extensionInstanceId: stringSchema() }),
  type: literalSchema(`extension`),
});

/** browser-use 管道目录（原 `In`，2,771 行）。 */
const browserUsePipeDirectory = (platformName: string): string =>
  platformName === `win32` ? `\\\\.\\pipe\\codex-browser-use` : `/tmp/codex-browser-use`;

/** 聚焦请求的目标描述。 */
export interface ChromeTabFocusTarget {
  backend: string;
  extensionInstanceID: string;
  sessionID: string;
  tabID: string;
}

/**
 * 聚焦 chrome 扩展的标签页（原 `Bc`，darwin + chrome 后端）：
 * 枚举管道目录下的 .sock，逐个发 getInfo 匹配 extensionInstanceId，
 * 再发 focusTab。1s 超时；任一环节失败返回 false。
 */
export async function focusChromeTabForPipPresentation(
  target: ChromeTabFocusTarget,
  {
    nativePipeDirectory = browserUsePipeDirectory(process.platform),
    platform: platformName = process.platform,
  }: { nativePipeDirectory?: string; platform?: string } = {},
): Promise<boolean> {
  if (platformName !== `darwin` || target.backend !== `chrome`) return false;
  const tabId = Number(target.tabID);
  if (!Number.isSafeInteger(tabId) || tabId <= 0) return false;
  let socketNames: string[];
  try {
    socketNames = (await readdir(nativePipeDirectory)).filter((name) => name.endsWith(`.sock`));
  } catch {
    return false;
  }
  const probed = await Promise.all(
    socketNames.map(async (name) => {
      const pipePath = pathJoin(nativePipeDirectory, name);
      return { info: await requestChromeTabPipe(pipePath, { method: `getInfo`, params: {} }), pipePath };
    }),
  );
  const match = probed.find(({ info }) => {
    if (!info.ok) return false;
    const parsed = tabFocusInfoSchema.safeParse(info.result);
    return parsed.success && parsed.data.metadata.extensionInstanceId === target.extensionInstanceID;
  });
  if (match == null) return false;
  const focused = await requestChromeTabPipe(match.pipePath, {
    method: `focusTab`,
    params: { session_id: target.sessionID, tabId },
  });
  return focused.ok && focused.result === true;
}

/** 单次裸管道 JSON-RPC 请求（原 `Vc`；1s 超时，id 匹配后销毁）。 */
function requestChromeTabPipe(
  pipePath: string,
  request: { method: string; params: unknown },
): Promise<{ ok: boolean; result?: unknown }> {
  return new Promise((resolve) => {
    const requestId = randomUUID();
    const socket = createConnection(pipePath);
    let buffered = Buffer.alloc(0);
    let settled = false;
    const finish = (result: { ok: boolean; result?: unknown }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.destroy();
      resolve(result);
    };
    const timeout = setTimeout(() => {
      finish({ ok: false });
    }, TAB_FOCUS_TIMEOUT_MS);
    timeout.unref();
    socket.once(`connect`, () => {
      socket.write(encodeTabFocusFrame(JSON.stringify({ id: requestId, jsonrpc: `2.0`, ...request })));
    });
    socket.on(`data`, (data) => {
      const incoming = Buffer.isBuffer(data) ? data : Buffer.from(data);
      buffered = Buffer.concat([buffered, incoming]);
      while (buffered.length >= TAB_FOCUS_PREFIX_BYTES) {
        const frameLength = readTabFocusFrameLength(buffered);
        if (frameLength > TAB_FOCUS_MAX_FRAME_BYTES) {
          finish({ ok: false });
          return;
        }
        const totalLength = TAB_FOCUS_PREFIX_BYTES + frameLength;
        if (buffered.length < totalLength) return;
        const payload = buffered.subarray(TAB_FOCUS_PREFIX_BYTES, totalLength).toString(`utf8`);
        buffered = buffered.subarray(totalLength);
        let message: any;
        try {
          message = JSON.parse(payload);
        } catch {
          continue;
        }
        if (typeof message === `object` && message && `id` in message && message.id === requestId) {
          finish(`error` in message ? { ok: false } : { ok: true, result: `result` in message ? message.result : undefined });
          return;
        }
      }
    });
    socket.once(`error`, () => {
      finish({ ok: false });
    });
    socket.once(`close`, () => {
      finish({ ok: false });
    });
  });
}

/** 编码帧（原 `Hc`）。 */
function encodeTabFocusFrame(payload: string): Buffer {
  const encoded = Buffer.from(payload, `utf8`);
  const frame = Buffer.alloc(TAB_FOCUS_PREFIX_BYTES + encoded.length);
  if (endianness() === `LE`) frame.writeUInt32LE(encoded.length, 0);
  else frame.writeUInt32BE(encoded.length, 0);
  encoded.copy(frame, TAB_FOCUS_PREFIX_BYTES);
  return frame;
}

/** 读帧长（原 `Uc`）。 */
function readTabFocusFrameLength(buffer: Buffer): number {
  return endianness() === `LE` ? buffer.readUInt32LE(0) : buffer.readUInt32BE(0);
}
