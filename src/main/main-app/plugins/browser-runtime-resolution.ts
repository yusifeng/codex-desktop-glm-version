// 浏览器运行时解析 —— 原 main-C-Mhak1n.ts 4,836-5,452 行。
//
// 本模块覆盖三个子带：
//   1. 4,836-4,939（bundled 插件资源路径 + chrome 插件渠道判定 + 通用命令
//      helpers）：该带未在合同模块表中指派，但其唯一消费方是本簇
//      （marketplace/orchestrator/chrome-native-host-sync/browser-runtime），
//      就近收编于此（见重写报告）。
//   2. 4,940-5,044：Windows 程序目录 / vswhere / 开始菜单快捷方式解析。
//   3. 5,045-5,452：Chromium 扩展商店 URL / runtime 渠道 / profile 探测 /
//      chrome 安装迁移 / 录音技能注入片段。
//
// 关键导出（压缩名 → 语义名）：
//   Hi→getBundledPluginsResourcesPath、Ui→getRuntimeMarketplaceRoot、
//   Tne→getForcedReloadPluginNames、Gi/Ki/qi/Dne→chrome 渠道判定、
//   Zi→runCommand、ha→isChromiumExtensionInstalled、Ca→isComputerAudioEnabled、
//   tre→applyBundledContentVariant、ma→resolveChromeExtensionSet。

import { spawn, spawnSync, execFile } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import {
  A as isMacosAppInstalled,
  Bi as buildWindowsProcessEnv,
  Bc as isSupportedBrowserFamily,
  Ef as zStringRecord,
  Fc as buildChromiumExtensionManagementUrl,
  I as getChromiumConfigDir,
  Lc as getBrowserFamilyChannelDistribution,
  Mf as zUnknown,
  Nf as zUrl,
  Of as zString,
  Pc as BROWSER_FAMILY_CONFIG,
  qn as pathResolver,
  wf as zObject,
  xf as zRecord,
  zc as getBrowserFamilyStoreUrls,
} from "@chunk/shared";
import { in as BuildFlavor } from "@chunk/bootstrap";

// ===========================================================================
// 子带 1：bundled 插件资源路径 + chrome 插件渠道 + 通用命令 helpers（4,836-4,939）
// ===========================================================================

/** 环境变量：bundled 插件资源根目录覆盖（原 `Cne`）。 */
export const BUNDLED_PLUGINS_RESOURCES_PATH_ENV = `CODEX_ELECTRON_BUNDLED_PLUGINS_RESOURCES_PATH`;
/** 环境变量：强制重载的插件名单（逗号/空白分隔；原 `wne`）。 */
export const BUNDLED_PLUGINS_FORCE_RELOAD_ENV = `CODEX_ELECTRON_BUNDLED_PLUGINS_FORCE_RELOAD`;

/** bundled 插件资源根目录（env 覆盖 → resourcesPath；原 `Hi`）。 */
export function getBundledPluginsResourcesPath(options?: {
  env?: Record<string, string | undefined>;
  resourcesPath?: string;
}): string {
  return (
    (options?.env ?? process.env)[BUNDLED_PLUGINS_RESOURCES_PATH_ENV]?.trim() ||
    options?.resourcesPath ||
    process.resourcesPath
  );
}

/** 运行时物化 marketplace 根目录 `<codexHome>/.tmp/bundled-marketplaces/<name>`（原 `Ui`）。 */
export function getRuntimeMarketplaceRoot(options: {
  codexHome: string;
  marketplaceName?: string;
}): string {
  return path.join(
    options.codexHome,
    `.tmp`,
    `bundled-marketplaces`,
    options.marketplaceName ?? `openai-bundled`,
  );
}

/** 解析强制重载插件名单（原 `Tne`）。 */
export function getForcedReloadPluginNames(options?: {
  env?: Record<string, string | undefined>;
}): Set<string> {
  let raw = (options?.env ?? process.env)[BUNDLED_PLUGINS_FORCE_RELOAD_ENV]?.trim();
  return raw
    ? new Set(
        raw
          .split(/[,\s]+/)
          .map((name) => name.trim())
          .filter((name) => name.length > 0),
      )
    : new Set();
}

/** 环境变量：使用 internal chrome 插件（原 `Ene`）。 */
const CODEX_USE_INTERNAL_CHROME_PLUGIN_ENV = `CODEX_USE_INTERNAL_CHROME_PLUGIN`;
/** env 是否要求 internal chrome 插件（原 `Wi`）。 */
const isUseInternalChromePluginEnv = (env: Record<string, string | undefined>) =>
  env[CODEX_USE_INTERNAL_CHROME_PLUGIN_ENV] === `1`;

/** dev flavor 且未显式要求 internal 时使用 dev chrome 插件（原 `Gi`）。 */
export const shouldUseDevChromePlugin = (
  flavor: string,
  env: Record<string, string | undefined> = process.env,
) => flavor === BuildFlavor.Dev && !isUseInternalChromePluginEnv(env);

/** 该 flavor 是否使用 internal chrome 插件（原 `Ki`）。 */
export const shouldUseInternalChromePlugin = (
  flavor: string,
  env: Record<string, string | undefined> = process.env,
) => {
  switch (flavor) {
    case BuildFlavor.Dev:
      return isUseInternalChromePluginEnv(env);
    case BuildFlavor.InternalAlpha:
    case BuildFlavor.Nightly:
      return !0;
    case BuildFlavor.Agent:
    case BuildFlavor.Prod:
    case BuildFlavor.PublicBeta:
      return !1;
  }
};

/** flavor 是否走 production 渠道（原 `qi`）。 */
export const isProductionChannelFlavor = (flavor: string) =>
  flavor === BuildFlavor.PublicBeta || flavor === BuildFlavor.Prod;

/** 解析 chrome 插件渠道：dev / internal / production / null（原 `Dne`）。 */
export const resolveChromePluginChannel = (
  flavor: string,
  env: Record<string, string | undefined> = process.env,
) => (shouldUseDevChromePlugin(flavor, env) ? `dev` : shouldUseInternalChromePlugin(flavor, env) ? `internal` : isProductionChannelFlavor(flavor) ? `production` : null);

const IS_MACOS = process.platform === `darwin`;
const IS_WINDOWS = process.platform === `win32`;

/** 在 PATH 上解析可执行文件（Windows 兜底 where.exe；原 `Yi`）。 */
export function resolveExecutableOnPath(name: string): string | null {
  let resolved = pathResolver.resolve(name);
  return typeof resolved == `string` && fs.existsSync(resolved)
    ? resolved
    : IS_WINDOWS
      ? resolveWithWhereExe(name)
      : null;
}

/** 沿目录树向上找第一个存在的祖先（原 `kne`）。 */
function findExistingAncestor(target: string): string | null {
  let current = target;
  for (;;) {
    if (fs.existsSync(current)) return current;
    let parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

/** 资源管理器/ Finder 定位参数（原 `Xi`）。 */
export function buildRevealPathArgs(target: string): string[] {
  if (IS_MACOS) return [`-R`, target];
  if (IS_WINDOWS) {
    let existing = findExistingAncestor(target);
    return existing
      ? fs.statSync(existing).isFile()
        ? [`/select,`, existing]
        : [existing]
      : [target];
  }
  return [target];
}

/** Windows .cmd/.bat 需经 cmd.exe /c 执行（原 `Ane`）。 */
function wrapWindowsCmdInvocation(
  platform: NodeJS.Platform,
  command: string,
  args: string[],
  comspec: string | undefined,
) {
  return platform === `win32` && /\.(cmd|bat)$/i.test(command)
    ? { command: comspec ?? `cmd.exe`, args: [`/d`, `/s`, `/c`, command, ...args] }
    : { command, args };
}

/** runCommand 的签名（供默认参数引用）。 */
type RunCommandFn = (
  command: string,
  args: string[],
  options?: { env?: Record<string, string | undefined>; stdin?: string },
) => Promise<void>;

/** 运行外部命令（stdin 可选；非零退出码报错；原 `Zi`）。 */
export function runCommand(
  command: string,
  args: string[],
  options?: { env?: Record<string, string | undefined>; stdin?: string },
): Promise<void> {
  return new Promise((resolve, reject) => {
    let env = buildWindowsProcessEnv(options?.env ?? process.env),
      invocation = wrapWindowsCmdInvocation(
        process.platform,
        pathResolver.resolve(command, { env }) ?? command,
        args,
        process.env.ComSpec,
      ),
      child = spawn(invocation.command, invocation.args, {
        stdio: options?.stdin == null ? `ignore` : [`pipe`, `ignore`, `ignore`],
        env,
      });
    child.on(`error`, reject),
      child.stdin?.on(`error`, reject),
      child.stdin?.end(options?.stdin),
      child.on(`close`, (code) => {
        if (!code) {
          resolve();
          return;
        }
        reject(Error(`${command} exited with code ${code ?? `unknown`} (${args.join(` `)})`));
      });
  });
}

/** Windows where.exe 解析（原 `jne`）。 */
function resolveWithWhereExe(name: string): string | null {
  let result = spawnSync(`where.exe`, [name], {
    windowsHide: !0,
    encoding: `utf8`,
    env: buildWindowsProcessEnv(process.env),
  });
  return result.status !== 0 || typeof result.stdout != `string`
    ? null
    : (result.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line.length > 0) ?? null);
}

/** PATH 解析器（shared `qn`，带缓存）。 */

/** 默认 runCommand 句柄（函数声明提升后可用）。 */
const runCommandFn: RunCommandFn = runCommand;

// ===========================================================================
// 子带 2：Windows 程序目录 / vswhere / 开始菜单解析（4,940-5,044）
// ===========================================================================

/** %LOCALAPPDATA%（回退 ~/AppData/Local；原 `Qi`）。 */
const WINDOWS_LOCAL_APP_DATA =
  process.env.LOCALAPPDATA ?? path.join(os.homedir(), `AppData`, `Local`);
/** 常规程序安装目录（原 `Mne`）。 */
const WINDOWS_PROGRAM_DIRS = [
  path.join(WINDOWS_LOCAL_APP_DATA, `Programs`),
  process.env.ProgramFiles,
  process.env[`ProgramFiles(x86)`],
].flatMap((dir) => (dir ? [dir] : []));
/** Microsoft Store 应用目录（原 `$i`）。 */
const WINDOWS_APPS_DIR = path.join(WINDOWS_LOCAL_APP_DATA, `Microsoft`, `WindowsApps`);
/** 开始菜单程序目录（原 `Nne`）。 */
const WINDOWS_START_MENU_DIRS = [
  process.env.APPDATA
    ? path.join(process.env.APPDATA, `Microsoft`, `Windows`, `Start Menu`, `Programs`)
    : null,
  process.env.ProgramData
    ? path.join(process.env.ProgramData, `Microsoft`, `Windows`, `Start Menu`, `Programs`)
    : null,
].flatMap((dir) => (dir ? [dir] : []));
/** vswhere.exe 路径构造（原 `ea`）。 */
const vswherePathFor = (envVar: string) =>
  process.env[envVar] == null
    ? null
    : path.join(process.env[envVar]!, `Microsoft Visual Studio`, `Installer`, `vswhere.exe`);
/** vswhere 候选路径（原 `Pne`）。 */
const VSWHERE_PATHS = [vswherePathFor(`ProgramFiles(x86)`), vswherePathFor(`ProgramFiles`)].flatMap(
  (candidate) => (candidate ? [candidate] : []),
);

/** 在常规程序目录里找第一个存在的组合路径（原 `ta`）。 */
function findFirstExistingProgramPath(segmentsList: string[][]): string | null {
  return joinProgramDirs(segmentsList).find(fs.existsSync) ?? null;
}

/** 异步版本（原 `Fne`）。 */
async function findFirstExistingProgramPathAsync(segmentsList: string[][]): Promise<string | null> {
  return (
    (
      await Promise.all(
        joinProgramDirs(segmentsList).map((candidate) =>
          fsp.access(candidate).then(
            () => candidate,
            () => null,
          ),
        ),
      )
    ).find((candidate) => candidate != null) ?? null
  );
}

/** 解析 Windows 可执行路径（无扩展名时补 .cmd/.bat/.exe；原 `na`）。 */
function resolveWindowsExecutable(target: string): string | null {
  if (!fs.existsSync(target)) return null;
  if (path.extname(target)) return target;
  for (let extension of [`.cmd`, `.bat`, `.exe`]) {
    let withExtension = `${target}${extension}`;
    if (fs.existsSync(withExtension)) return withExtension;
  }
  return target;
}

/** 在可执行文件旁找同名数据文件（bin 目录上提一级；原 `ra`）。 */
function findSiblingFile(executablePath: string, siblingName: string): string | null {
  let directory = path.dirname(executablePath);
  if (path.basename(directory).toLowerCase() === `bin`) {
    let sibling = path.join(path.dirname(directory), siblingName);
    if (fs.existsSync(sibling)) return sibling;
  }
  let localSibling = path.join(directory, siblingName);
  return fs.existsSync(localSibling) ? localSibling : null;
}

/** WindowsApps 目录下的可执行文件（原 `ia`）。 */
export function resolveWindowsAppsExecutable(name: string): string | null {
  return resolveWindowsExecutable(path.join(WINDOWS_APPS_DIR, name));
}

/** WindowsApps 目录（原 `aa`）。 */
export function getWindowsAppsDir(): string {
  return WINDOWS_APPS_DIR;
}

/** 解析浏览器可执行文件（PATH 命令 → 安装目录；原 `oa`）。 */
export function resolveDefaultBrowserCommand({
  pathCommand,
  executableName,
  installDirName,
}: {
  pathCommand?: string;
  executableName: string;
  installDirName: string;
}): string | null {
  if (pathCommand) {
    let resolved = resolveWindowsExecutable(pathCommand);
    if (resolved)
      return findSiblingFile(resolved, executableName) ??
        (path.basename(resolved).toLowerCase() === executableName.toLowerCase() ? resolved : null);
  }
  return findFirstExistingProgramPath([[installDirName, executableName]]);
}

/** 用 vswhere 查找 VS 安装内的文件（原 `Ine`）。 */
export function findWithVswhere(pattern: string): string | null {
  let vswhere = VSWHERE_PATHS.find((candidate) => fs.existsSync(candidate));
  if (vswhere == null) return null;
  let result = spawnSync(
    vswhere,
    [`-products`, `*`, `-all`, `-find`, pattern, `-utf8`, `-nologo`, `-prerelease`],
    { windowsHide: !0, encoding: `utf8`, env: buildWindowsProcessEnv(process.env) },
  );
  return result.status !== 0 || typeof result.stdout != `string`
    ? null
    : (result.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line.length > 0 && fs.existsSync(line)) ?? null);
}

/** 在开始菜单目录树里找快捷方式（原 `sa`）。 */
export function findStartMenuShortcut(names: string[]): string | null {
  let lowercaseNames = new Set(names.map((name) => name.toLowerCase()));
  for (let startMenuDir of WINDOWS_START_MENU_DIRS) {
    let found = findShortcutRecursive(startMenuDir, lowercaseNames);
    if (found) return found;
  }
  return null;
}

/** 程序目录 × 相对段的全组合（原 `ca`）。 */
function joinProgramDirs(segmentsList: string[][]): string[] {
  return WINDOWS_PROGRAM_DIRS.flatMap((programDir) =>
    segmentsList.map((segments) => path.join(programDir, ...segments)),
  );
}

/** 递归找开始菜单快捷方式（原 `la`）。 */
function findShortcutRecursive(directory: string, lowercaseNames: Set<string>): string | null {
  if (!fs.existsSync(directory)) return null;
  for (let entry of fs.readdirSync(directory, { withFileTypes: !0 })) {
    let entryPath = path.join(directory, entry.name);
    if (entry.isFile() && lowercaseNames.has(entry.name.toLowerCase())) return entryPath;
    if (!entry.isDirectory()) continue;
    let found = findShortcutRecursive(entryPath, lowercaseNames);
    if (found) return found;
  }
  return null;
}

// ===========================================================================
// 子带 3：扩展商店 URL / runtime 渠道（5,045-5,101）
// ===========================================================================

/** macOS open 二进制（原 `Lne`）。 */
const MACOS_OPEN_PATH = `/usr/bin/open`;
/** Chromium 扩展 id 形状（32 个 a-p 字符；原 `Rne`）。 */
const CHROMIUM_EXTENSION_ID_PATTERN = /^[a-p]{32}$/;
/** https Chromium URL schema（原 `ua`）。 */
const chromiumUrlSchema = zUrl().refine(
  (value: string) => new URL(value).protocol === `https:`,
  { message: `Invalid Chromium browser URL` },
);
/** 扩展 settings 条目 schema（原 `da`）。 */
const chromiumExtensionSettingsEntrySchema = zObject({
  path: zString().trim().min(1).optional(),
});
/** Preferences 扩展段 schema（原 `zne`）。 */
const chromiumPreferencesSchema = zObject({
  extensions: zObject({
    opsettings: zStringRecord(zString(), zUnknown()).optional(),
    settings: zStringRecord(zString(), zUnknown()).optional(),
  }).optional(),
});

/** runtime 渠道：dev / internal / prod（原 `fa`）。 */
function resolveRuntimeChannel(flavor: string): `dev` | `internal` | `prod` {
  return flavor === BuildFlavor.Dev
    ? `dev`
    : resolveChromePluginChannel(flavor) === `internal` || flavor === BuildFlavor.Agent
      ? `internal`
      : `prod`;
}

/** 扩展管理页 URL（原 `Bne`）。 */
function buildExtensionManagementUrl(browserFamily: string, extensionId: string): string {
  let normalizedId = assertChromiumExtensionId(extensionId);
  return `${BROWSER_FAMILY_CONFIG[browserFamily].extensionManagementUrl}/?id=${normalizedId}`;
}

/** 扩展商店 URL（dev 渠道回落到管理页；原 `pa`）。 */
function getExtensionStoreUrl(browserFamily: string, channel: string = `prod`): string {
  let familyConfig = BROWSER_FAMILY_CONFIG[browserFamily];
  if (channel === `dev`) return familyConfig.extensionManagementUrl;
  let storeUrls = getBrowserFamilyStoreUrls(browserFamily, channel);
  if (storeUrls?.storeUrl == null)
    throw Error(`No ${channel} extension store URL is configured for ${familyConfig.displayName}`);
  return storeUrls.storeUrl;
}

/** 解析扩展集合（id 去重 + 安装 URL；原 `ma`）。 */
export function resolveChromeExtensionSet({
  browserFamily,
  buildFlavor,
  compatibleExtensionIds,
}: {
  browserFamily: string;
  buildFlavor: string;
  compatibleExtensionIds?: string[];
}): { extensionIds: string[]; installUrl: string | null; runtimeChannel: string } {
  let runtimeChannel = resolveRuntimeChannel(buildFlavor),
    extensionIds = resolveChannelExtensionIds({
      browserFamily,
      compatibleExtensionIds,
      runtimeChannel,
    });
  return {
    extensionIds: [...new Set(extensionIds)],
    installUrl: resolveChannelInstallUrl({ browserFamily, extensionIds, runtimeChannel }),
    runtimeChannel,
  };
}

/** 渠道扩展 id 列表（原 `Vne`）。 */
function resolveChannelExtensionIds({
  browserFamily,
  compatibleExtensionIds,
  runtimeChannel,
}: {
  browserFamily: string;
  compatibleExtensionIds?: string[];
  runtimeChannel: string;
}): string[] {
  return runtimeChannel === `dev`
    ? (compatibleExtensionIds ?? [])
    : runtimeChannel === `internal`
      ? getBrowserFamilyChannelDistribution(browserFamily, runtimeChannel, `chrome-web-store`)
          .extensionIds
      : BROWSER_FAMILY_CONFIG[browserFamily].extensionChannels[runtimeChannel].distributions.flatMap(
          (distribution: { extensionIds: string[] }) => distribution.extensionIds,
        );
}

/** 渠道安装 URL（原 `Hne`）。 */
function resolveChannelInstallUrl({
  browserFamily,
  extensionIds,
  runtimeChannel,
}: {
  browserFamily: string;
  extensionIds: string[];
  runtimeChannel: string;
}): string | null {
  if (runtimeChannel === `dev`) {
    let first = extensionIds[0];
    return first == null ? null : buildChromiumExtensionManagementUrl(first);
  }
  if (runtimeChannel === `internal`)
    return (
      getBrowserFamilyChannelDistribution(browserFamily, runtimeChannel, `chrome-web-store`)
        .storeUrl ?? null
    );
  try {
    return getExtensionStoreUrl(browserFamily, runtimeChannel);
  } catch {
    return null;
  }
}

// ===========================================================================
// 子带 4：安装探测 / profile 洗选 / 打开设置（5,102-5,401）
// ===========================================================================

/** Chromium 浏览器是否已安装（原 `Une`）。 */
export async function isChromiumBrowserInstalled({
  browserFamily,
  platform = process.platform,
}: {
  browserFamily: string;
  platform?: NodeJS.Platform;
}): Promise<boolean> {
  return platform === `darwin`
    ? (await isMacosAppInstalled(BROWSER_FAMILY_CONFIG[browserFamily].macos.bundleId, {
        platform,
      })) != null
    : platform === `win32`
      ? (await findWindowsChromiumBrowser(browserFamily)) != null
      : platform === `linux` && findLinuxChromiumBrowser(browserFamily) != null;
}

/**
 * 「缺扩展安装提示」信息（原 `Wne`）：默认浏览器为受支持 Chromium 且
 * 尚未安装目标扩展时返回 {browserFamily, displayName, installUrl}。
 */
export function getMissingChromeExtensionInstallInfo(options: {
  buildFlavor?: string;
  chromeConfigHome?: string;
  compatibleExtensionIds?: string[];
  defaultBrowserName?: string;
  defaultBrowserPath?: string;
  homeDir?: string;
  localAppDataDir?: string;
  roamingAppDataDir?: string;
  platform?: NodeJS.Platform;
  xdgConfigHome?: string;
}): {
  browserFamily: string;
  displayName: string;
  installUrl: string;
} | null {
  let {
    buildFlavor = BuildFlavor.resolve(),
    chromeConfigHome = process.env.CHROME_CONFIG_HOME,
    compatibleExtensionIds,
    defaultBrowserName,
    defaultBrowserPath,
    homeDir = os.homedir(),
    localAppDataDir = process.env.LOCALAPPDATA,
    platform = process.platform,
    roamingAppDataDir = options.localAppDataDir == null ? process.env.APPDATA : localAppDataDir,
    xdgConfigHome = process.env.XDG_CONFIG_HOME,
  } = options;
  if (platform !== `darwin` && platform !== `win32` && platform !== `linux`) return null;
  let browserFamily = detectBrowserFamilyFromDefault({
    defaultBrowserName,
    defaultBrowserPath,
    platform,
  });
  if (browserFamily == null) return null;
  let familyConfig = BROWSER_FAMILY_CONFIG[browserFamily],
    extensionSet = resolveChromeExtensionSet({
      browserFamily,
      buildFlavor,
      compatibleExtensionIds,
    });
  return extensionSet.installUrl == null
    ? null
    : findInstalledExtensionId({
        browserFamily,
        extensionIds: extensionSet.extensionIds,
        chromeConfigHome,
        homeDir,
        localAppDataDir,
        platform,
        roamingAppDataDir,
        xdgConfigHome,
      }) == null
      ? { browserFamily, displayName: familyConfig.shortDisplayName, installUrl: extensionSet.installUrl }
      : null;
}

/** 扩展是否已安装（任一 profile 命中；原 `ha`）。 */
export function isChromiumExtensionInstalled({
  browserFamily = `chrome`,
  extensionId,
  chromeConfigHome = process.env.CHROME_CONFIG_HOME,
  homeDir = os.homedir(),
  localAppDataDir = process.env.LOCALAPPDATA,
  roamingAppDataDir = process.env.APPDATA,
  platform = process.platform,
  xdgConfigHome = process.env.XDG_CONFIG_HOME,
}: {
  browserFamily?: string;
  extensionId: string;
  chromeConfigHome?: string;
  homeDir?: string;
  localAppDataDir?: string;
  roamingAppDataDir?: string;
  platform?: NodeJS.Platform;
  xdgConfigHome?: string;
}): boolean {
  let normalizedId = assertChromiumExtensionId(extensionId);
  return getChromiumProfileDirs({
    browserFamily,
    homeDir,
    chromeConfigHome,
    localAppDataDir,
    roamingAppDataDir,
    platform,
    xdgConfigHome,
  }).some((profileDir) => isExtensionInstalledInProfile(profileDir, normalizedId));
}

/** 第一个已安装的扩展 id（原 `ga`）。 */
export function findInstalledExtensionId({
  extensionIds,
  ...rest
}: {
  extensionIds: string[];
  browserFamily?: string;
  chromeConfigHome?: string;
  homeDir?: string;
  localAppDataDir?: string;
  roamingAppDataDir?: string;
  platform?: NodeJS.Platform;
  xdgConfigHome?: string;
}): string | null {
  return (
    extensionIds.find((extensionId) => isChromiumExtensionInstalled({ ...rest, extensionId })) ??
    null
  );
}

/** 打开浏览器扩展设置页（原 `Gne`）。 */
export async function openBrowserExtensionSettings({
  browserFamily = `chrome`,
  extensionId,
  platform = process.platform,
  runCommand = runCommandFn,
}: {
  browserFamily?: string;
  extensionId: string;
  platform?: NodeJS.Platform;
  runCommand?: RunCommandFn;
}) {
  await openUrlInChromiumBrowser({
    browserFamily,
    extensionId,
    platform,
    runCommand,
    unsupportedPlatformError: `Opening browser extension settings is only supported on macOS, Windows, and Linux`,
    url: buildExtensionManagementUrl(browserFamily, extensionId),
  });
}

/** 在 Chromium 浏览器中打开 URL（原 `Kne`）。 */
export async function openChromiumUrl({
  browserFamily,
  platform = process.platform,
  runCommand = runCommandFn,
  url,
}: {
  browserFamily: string;
  platform?: NodeJS.Platform;
  runCommand?: RunCommandFn;
  url: string;
}) {
  await openUrlInChromiumBrowser({
    browserFamily,
    platform,
    runCommand,
    unsupportedPlatformError: `Opening Chromium browser URLs is only supported on macOS, Windows, and Linux`,
    url: validateChromiumUrl(browserFamily, url),
  });
}

/** 打开 Chrome 扩展商店设置（原 `qne`）。 */
export async function openChromeExtensionSettings({
  buildFlavor = BuildFlavor.resolve(),
  platform = process.platform,
  detectChromeCommand,
  runCommand = runCommandFn,
}: {
  buildFlavor?: string;
  platform?: NodeJS.Platform;
  detectChromeCommand?: () => string | null | Promise<string | null>;
  runCommand?: RunCommandFn;
}) {
  let runtimeChannel = resolveRuntimeChannel(buildFlavor),
    extensionId =
      runtimeChannel === `dev`
        ? void 0
        : getBrowserFamilyChannelDistribution(`chrome`, runtimeChannel, `chrome-web-store`)
            .extensionIds[0];
  if (runtimeChannel !== `dev` && extensionId == null)
    throw Error(`Missing ${runtimeChannel} Chrome Web Store extension ID`);
  await openUrlInChromiumBrowser({
    browserFamily: `chrome`,
    detectBrowserCommand: detectChromeCommand,
    extensionId,
    platform,
    runCommand,
    unsupportedPlatformError: `Opening Chrome extension settings is only supported on macOS, Windows, and Linux`,
    url: getExtensionStoreUrl(`chrome`, runtimeChannel),
  });
}

/** Chromium URL 校验（管理页本身放行，其余必须 https；原 `Jne`）。 */
function validateChromiumUrl(browserFamily: string, url: string): string {
  return url === BROWSER_FAMILY_CONFIG[browserFamily].extensionManagementUrl
    ? url
    : (chromiumUrlSchema.parse(url) as string);
}

/** 跨平台打开 URL 的公共实现（原 `_a`）。 */
async function openUrlInChromiumBrowser({
  browserFamily,
  detectBrowserCommand,
  extensionId,
  platform,
  runCommand,
  unsupportedPlatformError,
  url,
}: {
  browserFamily: string;
  detectBrowserCommand?: () => any;
  extensionId?: string;
  platform: NodeJS.Platform;
  runCommand: RunCommandFn;
  unsupportedPlatformError: string;
  url: string;
}) {
  let familyConfig = BROWSER_FAMILY_CONFIG[browserFamily];
  if (platform === `darwin`) {
    await runCommand(MACOS_OPEN_PATH, [`-b`, familyConfig.macos.bundleId, url]);
    return;
  }
  if (platform === `win32` || platform === `linux`) {
    let browserPath =
      detectBrowserCommand == null
        ? platform === `linux`
          ? findLinuxChromiumBrowser(browserFamily, extensionId)
          : await findWindowsChromiumBrowser(browserFamily)
        : detectBrowserCommand();
    if (browserPath == null) throw Error(`${familyConfig.displayName} is not installed`);
    await runCommand(browserPath, [url]);
    return;
  }
  throw Error(unsupportedPlatformError);
}

/** 解析 Windows Chromium 可执行文件（安装目录 → LOCALAPPDATA → where.exe；原 `va`）。 */
async function findWindowsChromiumBrowser(browserFamily: string): Promise<string | null> {
  let familyConfig = BROWSER_FAMILY_CONFIG[browserFamily];
  return (
    (await findFirstExistingProgramPathAsync([[...familyConfig.windows.installPathSegments]])) ??
    (await checkWindowsInstallPathAsync(browserFamily)) ??
    new Promise((resolve) => {
      execFile(
        path.win32.join(
          process.env.SystemRoot ?? process.env.windir ?? `C:\\Windows`,
          `System32`,
          `where.exe`,
        ),
        [...familyConfig.windows.commandNames],
        { encoding: `utf8`, env: buildWindowsProcessEnv(process.env), timeout: 5e3, windowsHide: !0 },
        (error, stdout) => {
          if (error != null && ((error as any).killed || (error as any).code !== 1)) {
            resolve(null);
            return;
          }
          resolve(
            (stdout as string)
              .split(/\r?\n/)
              .map((line) => line.trim())
              .find((line) => line.length > 0) ?? null,
          );
        },
      );
    })
  );
}

/** 解析 Linux Chromium 可执行文件（原 `ya`；优先装了目标扩展的安装位）。 */
function findLinuxChromiumBrowser(
  browserFamily: string,
  extensionId?: string,
): string | null {
  let installations = BROWSER_FAMILY_CONFIG[browserFamily].linux.installations;
  if (extensionId != null) {
    let sawInstallation = !1;
    for (let installation of installations) {
      if (
        !isExtensionInstalledInProfile(
          path.join(
            getChromiumConfigDir({
              chromeConfigHome:
                browserFamily === `chrome` ? process.env.CHROME_CONFIG_HOME : void 0,
              homeDir: os.homedir(),
              xdgConfigHome: process.env.XDG_CONFIG_HOME,
            }),
            installation.userDataDirName,
          ),
          extensionId.trim(),
        )
      )
        continue;
      sawInstallation = !0;
      let command = resolveLinuxBrowserCommand(installation);
      if (command != null) return command;
    }
    if (sawInstallation) return null;
  }
  for (let installation of installations) {
    let command = resolveLinuxBrowserCommand(installation);
    if (command != null) return command;
  }
  return null;
}

/** Linux 安装位 → 可执行文件（原 `ba`）。 */
function resolveLinuxBrowserCommand(installation: { commands: string[] }): string | null {
  for (let command of installation.commands) {
    let resolved = resolveExecutableOnPath(command);
    if (resolved != null) return resolved;
  }
  return null;
}

/** LOCALAPPDATA 安装路径异步探测（原 `Yne`）。 */
function checkWindowsInstallPathAsync(browserFamily: string): Promise<string | null> {
  let familyConfig = BROWSER_FAMILY_CONFIG[browserFamily],
    installPath = path.join(
      process.env.LOCALAPPDATA ?? path.join(os.homedir(), `AppData`, `Local`),
      ...familyConfig.windows.installPathSegments,
    );
  return fsp.access(installPath).then(
    () => installPath,
    () => null,
  );
}

/** 校验 Chromium 扩展 id（原 `xa`）。 */
function assertChromiumExtensionId(extensionId: string): string {
  let trimmed = extensionId.trim();
  if (!CHROMIUM_EXTENSION_ID_PATTERN.test(trimmed)) throw Error(`Invalid Chromium extension id`);
  return trimmed;
}

/** 从默认浏览器名/路径探测浏览器族（原 `Xne`）。 */
function detectBrowserFamilyFromDefault({
  defaultBrowserName,
  defaultBrowserPath,
  platform,
}: {
  defaultBrowserName?: string;
  defaultBrowserPath?: string;
  platform: NodeJS.Platform;
}): string | undefined {
  let basename =
    platform === `win32`
      ? path.win32.basename(defaultBrowserPath!)
      : path.posix.basename(defaultBrowserPath!);
  return Object.keys(BROWSER_FAMILY_CONFIG)
    .filter(isSupportedBrowserFamily)
    .find((family) => {
      let familyConfig = BROWSER_FAMILY_CONFIG[family];
      if (platform === `darwin`)
        return (
          familyConfig.macos.applicationNames.some((name: string) =>
            defaultBrowserPath!.split(/[\\/]/u).includes(name),
          ) || defaultBrowserName === familyConfig.displayName
        );
      if (platform === `win32`)
        return familyConfig.windows.commandNames.some(
          (name: string) => name.toLowerCase() === basename.toLowerCase(),
        );
      let desktopName = basename.replace(/\.desktop$/u, ``);
      return (
        familyConfig.linux.installations.some((installation: { commands: string[] }) =>
          installation.commands.some((command) => command === desktopName),
        ) || defaultBrowserName === familyConfig.displayName
      );
    });
}

/** 扩展是否已装进某个 profile（Secure Preferences / Preferences / Extensions 目录；原 `Sa`）。 */
function isExtensionInstalledInProfile(profileDir: string, extensionId: string): boolean {
  return fs.existsSync(profileDir)
    ? [
        profileDir,
        ...fs.readdirSync(profileDir, { withFileTypes: !0 }).flatMap((entry) =>
          entry.isDirectory() ? [path.join(profileDir, entry.name)] : [],
        ),
      ].some((directory) => {
        let sawPreferences = !1;
        for (let preferencesFile of [`Secure Preferences`, `Preferences`])
          try {
            let extensions = chromiumPreferencesSchema.parse(
              JSON.parse(fs.readFileSync(path.join(directory, preferencesFile), `utf8`)),
            ).extensions;
            if (
              ((sawPreferences = !0),
              [extensions?.settings, extensions?.opsettings].some((entries) => {
                let parsed = chromiumExtensionSettingsEntrySchema.safeParse(
                  (entries as Record<string, unknown>)?.[extensionId],
                );
                return parsed.success
                  ? parsed.data.path == null
                    ? fs.existsSync(path.join(directory, `Extensions`, extensionId))
                    : extensionPathExistsInRoot(directory, parsed.data.path)
                  : !1;
              }))
            )
              return !0;
          } catch {}
        return !sawPreferences && fs.existsSync(path.join(directory, `Extensions`, extensionId));
      })
    : !1;
}

/** 扩展相对路径是否存在于 profile 根或 Extensions 下（原 `Zne`）。 */
function extensionPathExistsInRoot(root: string, relativePath: string): boolean {
  return [root, path.join(root, `Extensions`)].some((directory) => {
    try {
      return fs.statSync(path.resolve(directory, relativePath)).isDirectory();
    } catch {
      return !1;
    }
  });
}

/** Chromium 用户数据目录列表（原 `Qne`）。 */
function getChromiumProfileDirs({
  browserFamily,
  chromeConfigHome,
  homeDir,
  localAppDataDir,
  roamingAppDataDir,
  platform,
  xdgConfigHome,
}: {
  browserFamily: string;
  chromeConfigHome?: string;
  homeDir: string;
  localAppDataDir?: string;
  roamingAppDataDir?: string;
  platform: NodeJS.Platform;
  xdgConfigHome?: string;
}): string[] {
  let familyConfig = BROWSER_FAMILY_CONFIG[browserFamily];
  if (platform === `darwin`)
    return [path.join(homeDir, ...familyConfig.macos.userDataDirectorySegments)];
  if (platform === `win32`)
    return [
      localAppDataDir ?? path.join(homeDir, `AppData`, `Local`),
      roamingAppDataDir ?? path.join(homeDir, `AppData`, `Roaming`),
    ].map((directory) => path.join(directory, ...familyConfig.windows.userDataDirectorySegments));
  if (platform === `linux`) {
    let configDir = getChromiumConfigDir({
      chromeConfigHome: browserFamily === `chrome` ? chromeConfigHome : void 0,
      homeDir,
      xdgConfigHome,
    });
    return familyConfig.linux.installations.map((installation: { userDataDirName: string }) =>
      path.join(configDir, installation.userDataDirName),
    );
  }
  return [];
}

// ===========================================================================
// 子带 5：录音技能注入 + bundled 内容变体（5,402-5,451）
// ===========================================================================

/** computer-use 录音技能的 SKILL.md 追加片段（原 `$ne`）。 */
const COMPUTER_AUDIO_SKILL_SNIPPET = `

## Computer audio

\`\`\`js
await sky.start_audio_recording({ max_duration_ms: 5000 });
// Perform desktop actions while recording.
var audio = await sky.stop_audio_recording();
await nodeRepl.emitAudio(audio.data_url);
\`\`\`

\`max_duration_ms\` defaults to 60000 and supports up to 300000.
`;

/** plugin.json 的宽松 schema（原 `ere`）。 */
const emptyJsonObjectSchema = zRecord({});

/** 电脑音频开关（两个 env 均为 1；原 `Ca`）。 */
export function isComputerAudioEnabled(): boolean {
  return process.env.SKY_ENABLE_AUDIO === `1` && process.env.NODE_REPL_ENABLE_AUDIO === `1`;
}

/**
 * 物化 marketplace 时对个别插件写入 bundledContentVariant 标记（原 `tre`）：
 *   - computer-use 且音频开启 → `audio`（SKILL.md 描述行前缀 + 追加录音片段）；
 *   - visualize 且 live-disabled → 删除 `skills/live` 目录并标记变体。
 * 最后统一把 variant 写进 `.codex-plugin/plugin.json`。
 */
export async function applyBundledContentVariant(options: {
  liveVisualizationSkillVariant?: string | null;
  pluginName: string;
  pluginRoot: string;
  visualizeTreatment?: boolean;
}): Promise<void> {
  let isAudioVariant = options.pluginName === `computer-use` && isComputerAudioEnabled(),
    variant: string | undefined;
  if (
    (isAudioVariant
      ? (variant = `audio`)
      : options.pluginName === `visualize` &&
        ((variant = options.liveVisualizationSkillVariant),
        options.liveVisualizationSkillVariant === `live-disabled` &&
          (await fsp.rm(path.join(options.pluginRoot, `skills`, `live`), {
            force: !0,
            recursive: !0,
          }))),
    variant == null)
  )
    return;
  if (isAudioVariant) {
    let skillPath = path.join(options.pluginRoot, `skills`, `computer-use`, `SKILL.md`),
      skillContents = await fsp.readFile(skillPath, `utf8`);
    await fsp.writeFile(
      skillPath,
      skillContents.replace(/^(description: )(["']?)/m, `$1$2Record computer audio. `) +
        COMPUTER_AUDIO_SKILL_SNIPPET,
      `utf8`,
    );
  }
  let manifestPath = path.join(options.pluginRoot, `.codex-plugin`, `plugin.json`),
    manifest = await emptyJsonObjectSchema.parseAsync(
      JSON.parse(await fsp.readFile(manifestPath, `utf8`)),
    );
  await fsp.writeFile(
    manifestPath,
    `${JSON.stringify({ ...manifest, bundledContentVariant: variant }, null, 2)}\n`,
    `utf8`,
  );
}
