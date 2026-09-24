// chrome 原生宿主同步 —— 原 main-C-Mhak1n.ts 6,739-7,180 行
// （`no/yre/bre/ro/xre/Sre/io/Cre/wre/ao/Tre/oo/so/co/lo/Ere/uo/fo/po/Dre/mo/
//   ho/go/_o/yo/bo/xo/So/Co/wo`）+ 11,961-12,046 行
// （`dl/aoe`→chrome 原生宿主缓存 watcher）。
//
// 职责：
//   - marketplace 侧的路径脱敏 / 越界校验（本地 vo 在 marketplace.ts）；
//   - 卸载不在名单内的已装插件（ro）、清理陈旧 bundled marketplace 目录
//     （xre/Sre/io）；
//   - chrome 扩展同步 managed 标记读写（wre/ao）、插件 enabled 配置写回（Cre）；
//   - 插件安装状态比对（Tre/Ere）、插件缓存路径（oo/so/co/latest 软链 lo）；
//   - 宿主侧文件读写（po/fo）、跨平台插件目录复制（Dre，darwin 用 ditto、
//     Windows 用 windows-file-copy 回退）；
//   - bundled 资源 / 运行时 marketplace 有效性校验（mo/ho/go/_o）；
//   - CUA 技能目录同步（Co/wo：按 surface 暴露/回收 skills/<surface>）；
//   - chrome 原生宿主缓存目录 watcher（aoe：插件缓存目录变动时重跑 n.Jt）。
//
// 依赖方向：marketplace → 本模块（见深析 §3.3）；本模块回调 marketplace 的
// 读取/日志 helper（模块循环仅在函数体内取绑定，安全）。

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  Bo as getBundledPluginCachePath,
  Jt as reconcileChromeNativeHost,
  Kt as getChromeNativeHostName,
  Ul as marketplaceNameForFlavor,
  kl as BROWSER_PLUGIN_NAME,
  jl as CHROME_DEV_PLUGIN_NAME,
  Al as CHROME_INTERNAL_PLUGIN_NAME,
  Fl as COMPUTER_USE_PLUGIN_NAME,
  Ml as CHROME_PLUGIN_NAME,
  Xt as uninstallChromePluginRuntimeForPlugin,
  Yt as pointLatestCacheAtVersionShared,
} from "@chunk/shared";
import { memoizedTaggedLogger } from "@chunk/logger";
import { copyDirectoryAllowDecryptedDestinationOnEncryptionFailure } from "@chunk/windows-file-copy";
import {
  execFileAsync,
  LOCAL_MARKETPLACE_LIST_FILTER,
  logManifestReadFailure,
  marketplaceLogger,
  MARKETPLACE_MANIFEST_SEGMENTS,
  MATERIALIZATION_KEY_FILE_NAME,
  bundledMarketplaceSchema,
  localMarketplaceReadSchema,
  pluginManifestSchema,
  selectBundledMarketplaces,
  findBundledPluginRoot,
  resolveBundledPluginPath,
  STALE_BUNDLED_MARKETPLACE_NAMES,
} from "./marketplace";
import { getBundledPluginsResourcesPath, getRuntimeMarketplaceRoot } from "./browser-runtime-resolution";

// ---- 6,739-6,760：路径脱敏与安装决策 ------------------------------------------

/**
 * 打包插件 source.path 的日志脱敏（原 `no`）：相对路径明文，绝对路径仅报
 * `redacted`。
 */
export function redactBundledPluginSourcePath(sourcePath: string) {
  let segments = sourcePath.split(/[\\/]+/).filter(Boolean);
  return !sourcePath.startsWith(`/`) &&
    !sourcePath.startsWith(`\\`) &&
    !/^[a-zA-Z]:/.test(sourcePath) &&
    !segments.includes(`..`)
    ? { bundledPluginSourcePath: sourcePath, bundledPluginSourcePathKind: `relative` }
    : { bundledPluginSourcePathKind: `redacted` };
}

/** 计算安装理由：forced / missing / outdated / unknown / null=跳过（原 `yre`）。 */
export function computePluginInstallReason({
  forceInstall,
  installWhenMissing,
  installedPluginStatus,
}: {
  forceInstall: boolean;
  installWhenMissing: boolean;
  installedPluginStatus?: string;
}): string | null {
  return forceInstall && installedPluginStatus === `current`
    ? `forced`
    : installedPluginStatus === `missing`
      ? installWhenMissing
        ? `missing`
        : null
      : installedPluginStatus === `current`
        ? null
        : installedPluginStatus!;
}

/** chrome 同步必须提供 resourcesPath（原 `bre`）。 */
export function requireResourcesPathForChromeSync(
  resourcesPath: string | undefined,
  pluginName: string,
): string {
  if (resourcesPath == null)
    throw Error(
      `Missing resourcesPath required to sync Chrome native host resources for ${pluginName}.`,
    );
  return resourcesPath;
}

// ---- 6,761-6,848：卸载与陈旧目录清理 ------------------------------------------

/** 卸载全部「已禁用但仍安装」的插件（原 `ro`）。 */
export async function uninstallDisabledPlugins(options: {
  appServerConnection: any;
  chromeExtensionSyncManagedPluginStore?: any;
  disabledInstalledPlugins: any[];
  marketplaceName?: string;
}) {
  if (options.disabledInstalledPlugins.length === 0) return;
  let codexHome = await options.appServerConnection.codexHome();
  for (let plugin of options.disabledInstalledPlugins)
    await uninstallChromePluginRuntimeForPlugin({
        codexHome,
        marketplaceName: options.marketplaceName,
        pluginName: plugin.name,
      }),
      marketplaceLogger.info(`bundled_plugin_uninstall_requested`, {
        safe: {
          pluginId: plugin.id,
          pluginName: plugin.name,
          reason: `not_in_bundled_marketplace_plugin_names`,
        },
        sensitive: {},
      }),
      await options.appServerConnection.uninstallPlugin({ pluginId: plugin.id }),
      options.chromeExtensionSyncManagedPluginStore?.setManagedPluginId(plugin.id, !1);
}

/** 清理陈旧 bundled marketplace（原 `xre`）。 */
export async function removeStaleBundledMarketplaces(options: {
  appServerConnection: any;
  marketplaceName?: string;
}) {
  if (options.marketplaceName !== `openai-bundled`) return;
  let marketplaces: any[] = [];
  try {
    ({ marketplaces } = await options.appServerConnection.listPlugins(LOCAL_MARKETPLACE_LIST_FILTER));
  } catch (error) {
    marketplaceLogger.warning(`stale_bundled_marketplaces_list_failed`, {
      safe: {},
      sensitive: { error },
    });
  }
  let stale = marketplaces.filter(
    (marketplace) =>
      STALE_BUNDLED_MARKETPLACE_NAME_SET_LOCAL.has(marketplace.name),
  );
  for (let marketplace of stale)
    try {
      await options.appServerConnection.sendAppServerRequest(`marketplace/remove`, {
          marketplaceName: marketplace.name,
        }),
        marketplaceLogger.info(`stale_bundled_marketplace_remove_requested`, {
          safe: { marketplaceName: marketplace.name },
          sensitive: {},
        });
    } catch (error) {
      marketplaceLogger.warning(`stale_bundled_marketplace_remove_failed`, {
        safe: { marketplaceName: marketplace.name },
        sensitive: { error },
      });
    }
  try {
    await cleanupStaleMarketplaceDirectories({
      codexHome: await options.appServerConnection.codexHome(),
    });
  } catch (error) {
    marketplaceLogger.warning(`stale_bundled_marketplace_directory_cleanup_failed`, {
      safe: { reason: `codex_home_unavailable` },
      sensitive: { error },
    });
  }
}

/** 陈旧 bundled marketplace 名字集合（原 `Da`）。 */
const STALE_BUNDLED_MARKETPLACE_NAME_SET_LOCAL = new Set(STALE_BUNDLED_MARKETPLACE_NAMES);

/** 清理 plugin cache 与运行时 marketplace 两类陈旧目录（原 `Sre`）。 */
async function cleanupStaleMarketplaceDirectories(options: { codexHome: string }) {
  for (let marketplaceName of STALE_BUNDLED_MARKETPLACE_NAMES)
    await removeStaleMarketplaceDirectory({
        codexHome: options.codexHome,
        directoryKind: `plugin_cache`,
        marketplaceName,
        pathSegments: [`plugins`, `cache`, marketplaceName],
      }),
      await removeStaleMarketplaceDirectory({
        codexHome: options.codexHome,
        directoryKind: `runtime_marketplace`,
        marketplaceName,
        pathSegments: [`.tmp`, `bundled-marketplaces`, marketplaceName],
      });
}

/** 删除单个陈旧目录（存在才删，双日志；原 `io`）。 */
async function removeStaleMarketplaceDirectory(options: {
  codexHome: string;
  directoryKind: string;
  marketplaceName: string;
  pathSegments: string[];
}) {
  let directory = path.join(options.codexHome, ...options.pathSegments);
  if (fs.existsSync(directory))
    try {
      await fsp.rm(directory, { recursive: !0, force: !0 }),
        marketplaceLogger.info(`stale_bundled_marketplace_directory_removed`, {
          safe: { directoryKind: options.directoryKind, marketplaceName: options.marketplaceName },
          sensitive: {},
        });
    } catch (error) {
      marketplaceLogger.warning(`stale_bundled_marketplace_directory_remove_failed`, {
          safe: { directoryKind: options.directoryKind, marketplaceName: options.marketplaceName },
          sensitive: { error },
        }),
        marketplaceLogger.warning(`plugin_marketplace_folder_remove_failed`, {
          safe: {
            directoryKind: options.directoryKind,
            marketplaceName: options.marketplaceName,
            removePhase: `stale_cleanup`,
          },
          sensitive: { directory, error },
        });
    }
}

// ---- 6,849-6,877：enabled 配置与 chrome 扩展同步标记 --------------------------

/** 写插件的 enabled 配置（config/batchWrite；原 `Cre`）。 */
export async function writePluginEnabledConfig(options: {
  appServerConnection: any;
  beforeSendRequest?: () => void;
  enabled: boolean;
  pluginId: string;
}) {
  await options.appServerConnection.sendAppServerRequest(
    `config/batchWrite`,
    {
      edits: [
        {
          keyPath: `plugins.${options.pluginId}.enabled`,
          mergeStrategy: `upsert`,
          value: options.enabled,
        },
      ],
      reloadUserConfig: !0,
    },
    ...(options.beforeSendRequest ? [options.beforeSendRequest] : []),
  );
}

/** 读取 chrome 扩展同步 managed 插件 id 集合（原 `wre`）。 */
export async function readChromeExtensionSyncManagedIds(options: {
  chromeExtensionSyncManagedPluginStore?: {
    getManagedPluginIds(): Set<string>;
  } | null;
}) {
  if (options.chromeExtensionSyncManagedPluginStore == null)
    throw Error(`Missing Chrome extension sync managed plugin store.`);
  let managedPluginIds = options.chromeExtensionSyncManagedPluginStore.getManagedPluginIds();
  return (
    marketplaceLogger.info(`bundled_plugins_chrome_extension_sync_marker_read`, {
      safe: { managedPluginCount: managedPluginIds.size },
      sensitive: {},
    }),
    managedPluginIds
  );
}

/** 写 chrome 扩展同步 managed 标记（原 `ao`）。 */
export async function writeChromeExtensionSyncManagedMarker(options: {
  chromeExtensionSyncManagedPluginStore?: {
    setManagedPluginId(pluginId: string, managed: boolean): void;
  } | null;
  managed: boolean;
  pluginId: string;
}) {
  if (options.chromeExtensionSyncManagedPluginStore == null)
    throw Error(`Missing Chrome extension sync managed plugin store.`);
  options.chromeExtensionSyncManagedPluginStore.setManagedPluginId(options.pluginId, options.managed);
}

// ---- 6,878-7,007：安装状态比对与缓存路径 --------------------------------------

/**
 * 读取已装插件相对 bundled 版本的状态（current/outdated/unknown；原 `Tre`）。
 * visualize 插件额外比对 SKILL.md 内容（经宿主 readFile）。
 */
export async function readInstalledPluginStatus(options: {
  appServerConnection: any;
  bundledManifest: any;
  bundledPlugin: { name: string; source: { path: string } };
  codexHome: string;
  installedPlugin: any;
  marketplaceName?: string;
  marketplaceRoot: string;
  executionHostPath: any;
}): Promise<string> {
  try {
    if (options.installedPlugin.source.type !== `local`)
      return (
        marketplaceLogger.warning(`bundled_plugin_status_unknown`, {
          safe: {
            bundledVersion: options.bundledManifest.version,
            installedLocalVersion: options.installedPlugin.localVersion,
            marketplaceName: options.marketplaceName,
            pluginName: options.bundledPlugin.name,
            reason: `non_local_source`,
            sourceType: options.installedPlugin.source.type,
          },
          sensitive: {},
        }),
        `unknown`
      );
    let cacheRoot = getPluginCacheRoot({
        bundledPluginName: options.bundledPlugin.name,
        codexHome: options.codexHome,
        marketplaceName: options.marketplaceName,
        executionHostPath: options.executionHostPath,
      }),
      installedPath: string = options.installedPlugin.source.path;
    !isRemotePathWithinRoot({
      path: installedPath,
      executionHostPath: options.executionHostPath,
      root: cacheRoot,
    }) &&
      isRemotePathWithinRoot({
        path: installedPath,
        executionHostPath: options.executionHostPath,
        root: options.marketplaceRoot,
      }) &&
      (installedPath = getPluginCacheVersionRoot({
        bundledPluginName: options.bundledPlugin.name,
        codexHome: options.codexHome,
        marketplaceName: options.marketplaceName,
        executionHostPath: options.executionHostPath,
        version: options.bundledManifest.version,
      }));
    let installedManifest = await readPluginManifestOnHost({
        appServerConnection: options.appServerConnection,
        executionHostPath: options.executionHostPath,
        pluginRoot: installedPath,
      }),
      comparison = comparePluginManifests({
        bundledManifest: options.bundledManifest,
        installedManifest,
      });
    if (comparison !== `current` || options.bundledPlugin.name !== `visualize`) return comparison;
    let bundledPluginRoot = assertRemotePathWithinRoot({
        label: `bundled plugin source`,
        path: options.bundledPlugin.source.path,
        executionHostPath: options.executionHostPath,
        root: options.marketplaceRoot,
      }),
      [bundledSkill, installedSkill] = await Promise.all([
        readFileOnHost({
          appServerConnection: options.appServerConnection,
          path: options.executionHostPath.join(bundledPluginRoot, `skills`, `visualize`, `SKILL.md`),
        }),
        readFileOnHost({
          appServerConnection: options.appServerConnection,
          path: options.executionHostPath.join(installedPath, `skills`, `visualize`, `SKILL.md`),
        }),
      ]);
    return bundledSkill === installedSkill ? `current` : `outdated`;
  } catch (error) {
    return (
      marketplaceLogger.warning(`bundled_plugin_status_unknown`, {
        safe: {
          bundledVersion: options.bundledManifest.version,
          errorName: error instanceof Error ? error.name : typeof error,
          installedLocalVersion: options.installedPlugin.localVersion,
          marketplaceName: options.marketplaceName,
          pluginName: options.bundledPlugin.name,
          reason: `status_check_failed`,
          sourceType: options.installedPlugin.source.type,
        },
        sensitive: {
          error,
          installedPluginSourcePath:
            options.installedPlugin.source.type === `local`
              ? options.installedPlugin.source.path
              : void 0,
        },
      }),
      `unknown`
    );
  }
}

/** 插件缓存根 `<codexHome>/plugins/cache/<marketplace>/<plugin>`（原 `oo`）。 */
export function getPluginCacheRoot(options: {
  bundledPluginName: string;
  codexHome: string;
  marketplaceName?: string;
  executionHostPath: any;
}): string {
  return assertRemotePathWithinRoot({
    label: `bundled plugin cache`,
    path: options.bundledPluginName,
    executionHostPath: options.executionHostPath,
    root: options.executionHostPath.join(
      options.codexHome,
      `plugins`,
      `cache`,
      options.marketplaceName!,
    ),
  });
}

/** 插件缓存版本目录 `<cacheRoot>/<version>`（原 `so`）。 */
export function getPluginCacheVersionRoot(options: {
  bundledPluginName: string;
  codexHome: string;
  marketplaceName?: string;
  executionHostPath: any;
  version: string;
}): string {
  return assertRemotePathWithinRoot({
    label: `bundled plugin cache version`,
    path: options.version,
    executionHostPath: options.executionHostPath,
    root: getPluginCacheRoot(options),
  });
}

/** 插件缓存 latest 目录（原 `co`）。 */
export function getPluginLatestCacheRoot(options: {
  bundledPluginName: string;
  codexHome: string;
  marketplaceName?: string;
  executionHostPath: any;
}): string {
  return assertRemotePathWithinRoot({
    label: `bundled plugin latest cache`,
    path: `latest`,
    executionHostPath: options.executionHostPath,
    root: getPluginCacheRoot(options),
  });
}

/**
 * 把 latest 指到当前版本目录（原 `lo`；非 chrome 插件直接跳过）。
 * 与 shared 的 `Yt`（pointLatestCacheAtVersion）不同：这里按需读 manifest。
 */
export async function pointLatestCacheAtVersionRoot(options: {
  codexHome: string;
  executionHostPath: any;
  getBundledManifest: () => Promise<{ version: string }>;
  marketplaceName?: string;
  pluginName: string;
}) {
  if (getChromeNativeHostName(options.pluginName) == null) return;
  let manifest = await options.getBundledManifest();
  await pointLatestCacheAtVersionShared({
    latestRoot: getPluginLatestCacheRoot({
      bundledPluginName: options.pluginName,
      codexHome: options.codexHome,
      marketplaceName: options.marketplaceName,
      executionHostPath: options.executionHostPath,
    }),
    versionRoot: getPluginCacheVersionRoot({
      bundledPluginName: options.pluginName,
      codexHome: options.codexHome,
      marketplaceName: options.marketplaceName,
      executionHostPath: options.executionHostPath,
      version: manifest.version,
    }),
    waitForVersionRoot: !1,
  });
}

/** manifest 三元组比对（name/bundledContentVariant/version；原 `Ere`）。 */
function comparePluginManifests({
  bundledManifest,
  installedManifest,
}: {
  bundledManifest: any;
  installedManifest: any;
}): string {
  return bundledManifest.name === installedManifest.name &&
    bundledManifest.bundledContentVariant === installedManifest.bundledContentVariant &&
    bundledManifest.version === installedManifest.version
    ? `current`
    : `outdated`;
}

// ---- 7,008-7,043：宿主侧读写与目录复制 ----------------------------------------

/** 宿主侧 marketplace.json 路径（原 `uo`）。 */
export function getMarketplaceManifestPath(options: {
  executionHostPath: any;
  marketplaceRoot: string;
}): string {
  return options.executionHostPath.join(options.marketplaceRoot, ...MARKETPLACE_MANIFEST_SEGMENTS);
}

/** 宿主侧读取插件 manifest（原 `fo`）。 */
export async function readPluginManifestOnHost(options: {
  appServerConnection: any;
  executionHostPath: any;
  pluginRoot: string;
}) {
  return pluginManifestSchema.parseAsync(
    JSON.parse(
      await readFileOnHost({
        appServerConnection: options.appServerConnection,
        path: options.executionHostPath.join(options.pluginRoot, `.codex-plugin`, `plugin.json`),
      }),
    ),
  );
}

/** 宿主侧读取文本文件（fs/readFile → base64；原 `po`）。 */
export async function readFileOnHost(options: {
  appServerConnection: any;
  path: string;
}): Promise<string> {
  let { dataBase64 } = await options.appServerConnection.sendAppServerRequest(`fs/readFile`, {
    path: options.path,
  });
  return Buffer.from(dataBase64, `base64`).toString(`utf8`);
}

/** 跨平台复制插件目录（darwin: ditto；win: 加密回退；其余: cp；原 `Dre`）。 */
export async function copyPluginDirectory(source: string, destination: string) {
  if (process.platform === `darwin`) {
    await execFileAsync(`/usr/bin/ditto`, [`--noqtn`, source, destination]);
    return;
  }
  if (process.platform !== `win32`) {
    await fsp.cp(source, destination, { recursive: !0, verbatimSymlinks: !0 });
    return;
  }
  await copyDirectoryAllowDecryptedDestinationOnEncryptionFailure({
    copy: () => fsp.cp(source, destination, { recursive: !0, verbatimSymlinks: !0 }),
    destination,
    source,
  });
}

// ---- 7,044-7,119：marketplace 有效性校验与越界判定 ----------------------------

/** bundled 资源 marketplace 是否有效（原 `mo`）。 */
export async function isBundledResourceMarketplaceValid(options: {
  marketplaceName?: string;
  marketplaceRoot: string;
}): Promise<boolean> {
  return isMarketplaceRootValid({
    marketplaceName: options.marketplaceName,
    marketplaceRoot: options.marketplaceRoot,
    marketplaceRootKind: `bundled_resource`,
    marketplaceSchema: bundledMarketplaceSchema,
  });
}

/** 运行时 marketplace 是否有效（原 `ho`）。 */
export async function isRuntimeMarketplaceValid(options: {
  marketplaceRoot: string;
}): Promise<boolean> {
  return isMarketplaceRootValid({ marketplaceRoot: options.marketplaceRoot, marketplaceSchema: localMarketplaceReadSchema });
}

/** marketplace 根校验：manifest 可解析且每个插件条目自洽（原 `go`）。 */
async function isMarketplaceRootValid(options: {
  marketplaceName?: string;
  marketplaceRoot: string;
  marketplaceRootKind?: string;
  marketplaceSchema: any;
}): Promise<boolean> {
  let manifestPath = path.join(options.marketplaceRoot, ...MARKETPLACE_MANIFEST_SEGMENTS);
  if (!fs.existsSync(manifestPath)) return !1;
  try {
    let marketplace = await options.marketplaceSchema.parseAsync(
      JSON.parse(await fsp.readFile(manifestPath, `utf8`)),
    );
    return (
      await Promise.all(
        marketplace.plugins.map(async (plugin: any) =>
          isPluginEntryValid({
            pluginName: plugin.name,
            pluginRoot: path.resolve(options.marketplaceRoot, plugin.source.path),
          }),
        ),
      )
    ).every((valid) => valid);
  } catch (error) {
    return (
      options.marketplaceName != null &&
        options.marketplaceRootKind != null &&
        logManifestReadFailure({
          error,
          marketplaceName: options.marketplaceName,
          marketplaceRoot: options.marketplaceRoot,
          marketplaceRootKind: options.marketplaceRootKind,
        }),
      !1
    );
  }
}

/** 单个插件条目是否有效（plugin.json 存在且 name 匹配；原 `_o`）。 */
async function isPluginEntryValid(options: {
  pluginName: string;
  pluginRoot: string;
}): Promise<boolean> {
  let manifestPath = path.join(options.pluginRoot, `.codex-plugin`, `plugin.json`);
  if (!fs.existsSync(manifestPath)) return !1;
  try {
    return (
      (await pluginManifestSchema.parseAsync(JSON.parse(await fsp.readFile(manifestPath, `utf8`))))
        .name === options.pluginName
    );
  } catch {
    return !1;
  }
}

/** 宿主侧路径越界校验（resolve 后必须位于 root 下；原 `yo`）。 */
export function assertRemotePathWithinRoot(options: {
  executionHostPath: any;
  label: string;
  path: string;
  root: string;
}): string {
  let resolvedRoot = options.executionHostPath.resolve(options.root),
    resolvedPath = options.executionHostPath.resolve(resolvedRoot, options.path);
  if (
    !isPathAtOrUnderRoot({
      path: resolvedPath,
      executionHostPath: options.executionHostPath,
      root: resolvedRoot,
    })
  )
    throw Error(`${options.label} path escapes marketplace root: ${resolvedPath}`);
  return resolvedPath;
}

/** 宿主侧路径是否位于 root 下（原 `bo`）。 */
export function isRemotePathWithinRoot(options: {
  executionHostPath: any;
  path: string;
  root: string;
}): boolean {
  return isPathAtOrUnderRoot({
    path: normalizeRemotePath(options.path, options.executionHostPath),
    executionHostPath: options.executionHostPath,
    root: normalizeRemotePath(options.root, options.executionHostPath),
  });
}

/** 归一化宿主侧路径（win32 转 namespaced + 小写；原 `xo`）。 */
function normalizeRemotePath(target: string, executionHostPath: any): string {
  let resolved = executionHostPath.resolve(target);
  return executionHostPath === path.win32
    ? executionHostPath.toNamespacedPath(resolved).toLowerCase()
    : resolved;
}

/** 路径是否等于 root 或位于 root/ 下（原 `So`）。 */
function isPathAtOrUnderRoot(options: { executionHostPath: any; path: string; root: string }): boolean {
  let rootWithSep = options.root.endsWith(options.executionHostPath.sep)
    ? options.root
    : `${options.root}${options.executionHostPath.sep}`;
  return options.path === options.root || options.path.startsWith(rootWithSep);
}

// ---- 7,120-7,180：CUA 技能 surface 同步（Co/wo）--------------------------------

/** 插件名 → CUA 技能 surface 目录名（原 `Co`）。 */
export const CUA_SKILL_SURFACE_BY_PLUGIN: Record<string, string> = {
  [BROWSER_PLUGIN_NAME]: `control-in-app-browser`,
  [CHROME_PLUGIN_NAME]: `control-chrome`,
  [CHROME_DEV_PLUGIN_NAME]: `control-chrome`,
  [CHROME_INTERNAL_PLUGIN_NAME]: `control-chrome`,
  [COMPUTER_USE_PLUGIN_NAME]: `computer-use`,
};

/**
 * 按 cuaReplSurfaces 同步各插件的技能目录（原 `wo`）：
 * surface 未启用 → 删除已装技能目录；启用 → 从 bundled 源复制（临时目录 +
 * rename）；版本不匹配且需要暴露时抛错。
 */
export async function syncCuaSkillsForPlugins(options: {
  codexHome: string;
  cuaReplSurfaces: string[];
  marketplaceName?: string;
  marketplaces: any[];
  platform: NodeJS.Platform;
  resourcesPath?: string;
}) {
  let pluginPairs = selectBundledMarketplaces(options).flatMap((marketplace) =>
      marketplace.plugins.map((plugin: any) => ({ marketplace, plugin })),
    ),
    syncResults = await Promise.all(
      pluginPairs.map(async ({ marketplace, plugin }) => {
        let skillSurface = CUA_SKILL_SURFACE_BY_PLUGIN[plugin.name],
          isComputerUse = plugin.name === COMPUTER_USE_PLUGIN_NAME,
          shouldExposeSkills = !options.cuaReplSurfaces.includes(
            isComputerUse ? `computer` : `browser`,
          );
        if (!plugin.installed || skillSurface == null || (isComputerUse && options.platform !== `darwin`))
          return null;
        let isUsable = plugin.enabled && plugin.availability === `AVAILABLE`;
        if (!shouldExposeSkills && !isUsable) return null;
        let pluginRoot = getBundledPluginCachePath({
            codexHome: options.codexHome,
            localVersion: plugin.localVersion,
            marketplaceName: marketplace.name,
            pluginName: plugin.name,
          }),
          installedSkillPath = path.join(pluginRoot, `skills`, skillSurface);
        if (fs.existsSync(path.join(installedSkillPath, `SKILL.md`)) === shouldExposeSkills)
          return null;
        let bundled = await findBundledPluginRoot({
          ...options,
          marketplaceName: marketplace.name,
          marketplaceRoot: isComputerUse
            ? getRuntimeMarketplaceRoot({ codexHome: options.codexHome, marketplaceName: marketplace.name })
            : void 0,
          pluginName: plugin.name,
        });
        if (bundled == null || bundled.version !== plugin.localVersion) {
          if (!isUsable) return null;
          throw Error(`Bundled CUA skill version mismatch: ${plugin.name}`);
        }
        let sourceSkillPath = path.join(bundled.path, `skills`, skillSurface);
        return (
          await fsp.access(path.join(sourceSkillPath, `SKILL.md`)),
          { sourcePath: sourceSkillPath, installedPath: installedSkillPath, pluginRoot, exposeSkills: shouldExposeSkills }
        );
      }),
    );
  await Promise.all(
    syncResults.map(async (result) => {
      if (result != null) {
        if (!result.exposeSkills)
          await fsp.rm(result.installedPath, { recursive: !0, force: !0 });
        else {
          let stagingPath = path.join(
            result.pluginRoot,
            `.codex-plugin`,
            `skill-${randomUUID()}`,
          );
          try {
            await fsp.cp(result.sourcePath, stagingPath, { recursive: !0 }),
              await fsp.rm(result.installedPath, { recursive: !0, force: !0 }),
              await fsp.mkdir(path.dirname(result.installedPath), { recursive: !0 }),
              await fsp.rename(stagingPath, result.installedPath);
          } finally {
            await fsp.rm(stagingPath, { recursive: !0, force: !0 });
          }
        }
      }
    }),
  );
}

// ---- 11,961-12,046：chrome 原生宿主缓存 watcher（dl/aoe）------------------------

const cacheWatcherLogger = memoizedTaggedLogger(`chrome-native-host-cache-watcher`);

/**
 * chrome 原生宿主缓存 watcher（原 `aoe`）：监听（远端）插件缓存目录变动，
 * 变动后重跑 shared 的原生宿主 reconcile（n.Jt）。同一插件的 reconcile
 * 串行排队；变动发生在 reconcile 期间时重排队一次。
 */
export function createChromeNativeHostCacheWatcher(options: {
  buildFlavor: string;
  codexHome: string;
  env?: Record<string, string | undefined>;
  executionCodexHome: string;
  repoRoot?: string;
  resourcesPath?: string;
}) {
  let marketplaceName = marketplaceNameForFlavor(options.buildFlavor),
    watchRoot = path.join(options.executionCodexHome, `plugins`, `cache`, marketplaceName),
    marketplacePath = path.join(
      getRuntimeMarketplaceRoot({ codexHome: options.codexHome, marketplaceName }),
      `.agents`,
      `plugins`,
      `marketplace.json`,
    ),
    resourcesPath = options.resourcesPath ?? getBundledPluginsResourcesPath(),
    watchedPlugins = new Set<string>(),
    pendingPlugins = new Set<string>(),
    dirtyPlugins = new Set<string>(),
    reconcileQueue = Promise.resolve(),
    watcher: fs.FSWatcher | null = null,
    disposed = !1,
    reconcilePlugin = (pluginName: string) => {
      if (watchedPlugins.has(pluginName)) {
        if (pendingPlugins.has(pluginName)) {
          dirtyPlugins.add(pluginName);
          return;
        }
        pendingPlugins.add(pluginName),
          (reconcileQueue = reconcileQueue.then(async () => {
            try {
              if (!watchedPlugins.has(pluginName)) return;
              await reconcileChromeNativeHost({
                codexHome: options.executionCodexHome,
                devRuntimeRepoRoot:
                  process.env.NODE_ENV === `development` ? options.repoRoot : void 0,
                marketplacePath,
                pluginName,
                resourcesPath,
              });
            } catch (error) {
              watchedPlugins.has(pluginName) &&
                cacheWatcherLogger().warning(`chrome_native_host_cache_reconcile_failed`, {
                  safe: { marketplaceName, pluginName },
                  sensitive: { error },
                });
            } finally {
              (pendingPlugins.delete(pluginName),
              dirtyPlugins.delete(pluginName) && watchedPlugins.has(pluginName) && reconcilePlugin(pluginName));
            }
          }));
      }
    },
    closeWatcher = () => {
      watcher?.close(), (watcher = null);
    };
  return {
    dispose: () => {
      (disposed = !0), watchedPlugins.clear(), dirtyPlugins.clear(), closeWatcher();
    },
    setPluginInstallState: (pluginName: string, installed: boolean) => {
      if (disposed || getChromeNativeHostName(pluginName) == null) return;
      if (!installed) {
        (watchedPlugins.delete(pluginName),
          dirtyPlugins.delete(pluginName),
          watchedPlugins.size === 0 && closeWatcher());
        return;
      }
      if ((watchedPlugins.add(pluginName), watcher == null))
        try {
          (watcher = fs.watch(watchRoot, { persistent: !1, recursive: !1 }, (_event, filename) => {
            if (filename == null) {
              for (let pluginName of watchedPlugins) reconcilePlugin(pluginName);
              return;
            }
            reconcilePlugin(filename);
          })),
            watcher.on(`error`, (error) => {
              (closeWatcher(),
                disposed ||
                  cacheWatcherLogger().warning(`chrome_native_host_cache_watch_failed`, {
                    safe: { marketplaceName },
                    sensitive: { error },
                  }));
            });
        } catch (error) {
          cacheWatcherLogger().warning(`chrome_native_host_cache_watch_start_failed`, {
            safe: { marketplaceName, pluginName },
            sensitive: { error },
          });
        }
    },
  };
}
