// bundled 插件市场（marketplace）核心 —— 原 main-C-Mhak1n.ts
//   4,707-4,728 行（`Di/mne/Oi/ki/Ai`：marketplace 过滤器、bundled 名单、查找）
//   5,452-6,738 行（`wa/Ta/nre/Ea/Da/Oa/ka/Aa/ja/Ma/Na/rre/Pa` 常量与 schema、
//     `Fa`→总体协调、`are/Ia`→chrome 扩展同步状态、`ore/sre/cre/La/Ra`→
//     安装流水线、`za/Ba/Va/lre/Ha/Ua/ure/dre/fre/pre/mre`、
//     `Wa/Ga/Ka/qa/Ja/Ya/Xa/hre/Za/Qa/gre/$a/_re/eo/to`、`vre`→reconcile 核心）
//   11,323-11,377 行（`al`→bundled 插件描述符清单）
//
// 职责（见深析 §3.3，依赖方向 orchestrator → marketplace →
// chrome-native-host-sync / browser-runtime-resolution）：
//   - 从 app resources 物化一份「运行时 marketplace」到
//     `<codexHome>/.tmp/bundled-marketplaces/<name>`（staging 目录 + 原子
//     rename + materialization-key 内容哈希复用）；
//   - 通过 app-server addMarketplace/installPlugin/uninstallPlugin 把插件
//     安装到 codex home（含 chrome 插件的 store 同步、原生宿主安装、
//     skills/extension-ids 同步）；
//   - 卸载不在 bundled 名单内的已装插件；产出 chrome 插件安装状态回调。
//
// 可变状态：本模块无模块级可变状态（logger/schema 均为只读）。

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

import {
  $t as installChromePluginRuntime,
  Bl as VISUALIZE_PLUGIN_NAME,
  Bo as getBundledPluginCachePath,
  Xt as uninstallChromePluginRuntime,
  Yt as pointLatestCacheAtVersion,
  Qt as installChromeNativeHostManifest,
  Vl as DEFAULT_MARKETPLACE_NAME,
  Vo as extractBundleOperationErrorCode,
  Wl as isBundledMarketplaceName,
  Ff as SchemaError,
  Zt as stopChromeNativeHostsUnderRoot,
  Hr as getExecutionHostPathForPlatform,
  Kt as getChromeNativeHostName,
  Ur as toRemotePath,
  Af as zNonEmptyArray,
  Of as zString,
  hf as zArray,
  wf as zObject,
  xf as zRecord,
  bf as zLiteral,
  Mf as zUnknown,
  Ef as zStringRecord,
  _f as zCustom,
  Ll as BUNDLED_PLUGIN_DESCRIPTORS_BASE,
  Hl as buildAutoInstallOptOutKey,
} from "@chunk/shared";
import { in as BuildFlavor } from "@chunk/bootstrap";
import { createTaggedLogger } from "@chunk/logger";
import {
  applyBundledContentVariant,
  isChromiumExtensionInstalled,
  isComputerAudioEnabled,
  shouldUseDevChromePlugin,
  shouldUseInternalChromePlugin,
  isProductionChannelFlavor,
} from "./browser-runtime-resolution";
import {
  redactBundledPluginSourcePath,
  computePluginInstallReason,
  requireResourcesPathForChromeSync,
  uninstallDisabledPlugins,
  readInstalledPluginStatus,
  getPluginCacheRoot,
  getPluginCacheVersionRoot,
  getPluginLatestCacheRoot,
  pointLatestCacheAtVersionRoot,
  getMarketplaceManifestPath,
  readPluginManifestOnHost,
  readFileOnHost,
  copyPluginDirectory,
  isBundledResourceMarketplaceValid,
  isRuntimeMarketplaceValid,
  readChromeExtensionSyncManagedIds,
  writeChromeExtensionSyncManagedMarker,
  writePluginEnabledConfig,
  assertRemotePathWithinRoot,
} from "./chrome-native-host-sync";
import { migrateLocalBrowserUseToBundled } from "../browser-use/migration";

const logger = createTaggedLogger(`BundledPluginsMarketplace`);

/** 同一 logger 实例（chrome-native-host-sync 等同簇模块共用原 `Pa`）。 */
export const marketplaceLogger = logger;

/** execFile 的 promisify 形态（原 `ire`，5,492；仅 `Dre` 消费，见 chrome-native-host-sync）。 */
export const execFileAsync = promisify(execFile);

// ===========================================================================
// 4,707-4,728：marketplace 过滤器与查找
// ===========================================================================

/** listPlugins 的 local-marketplace 过滤器（原 `Di`）。 */
export const LOCAL_MARKETPLACE_LIST_FILTER = { marketplaceKinds: [`local`] };
/** bundled 资源目录里的 bundle id 文件名（原 `mne`）。 */
export const BUNDLE_ID_FILE_NAME = `.bundle-id`;
/** 历次发布用过的 bundled marketplace 名单（清理陈旧安装；原 `Oi`）。 */
export const STALE_BUNDLED_MARKETPLACE_NAMES = [
  `openai-bundled-agent`,
  `openai-bundled-alpha`,
  `openai-bundled-beta`,
  `openai-bundled-dev`,
  `openai-bundled-nightly`,
  `openai-bundled-owl`,
];

/** 选取目标 marketplace 与默认 marketplace 的并集（按名字去重；原 `ki`）。 */
export function selectBundledMarketplaces({
  marketplaceName,
  marketplaces,
}: {
  marketplaceName?: string;
  marketplaces: any[];
}): any[] {
  return [marketplaceName, DEFAULT_MARKETPLACE_NAME]
    .filter((name, index, all) => all.indexOf(name) === index)
    .flatMap((name) => marketplaces.filter((marketplace) => marketplace.name === name));
}

/** 在 bundled marketplace 中查找指定插件（原 `Ai`）。 */
export function findBundledPlugin({
  marketplaceName,
  marketplaces,
  pluginName,
}: {
  marketplaceName?: string;
  marketplaces: any[];
  pluginName: string;
}): { marketplace: any; plugin: any } | null {
  for (let marketplace of selectBundledMarketplaces({ marketplaceName, marketplaces })) {
    let plugin = marketplace.plugins.find((plugin: any) => plugin.name === pluginName);
    if (marketplace.path != null && plugin != null)
      return { marketplace: { ...marketplace, path: marketplace.path }, plugin };
  }
  return null;
}

// ===========================================================================
// 5,452-5,491：常量与 schema
// ===========================================================================

/** bundled 插件在 resources 下的目录段（原 `wa`）。 */
const BUNDLED_PLUGINS_RESOURCE_SEGMENTS = [`plugins`];
/** marketplace.json 的目录段（原 `Ta`）。 */
export const MARKETPLACE_MANIFEST_SEGMENTS = [`.agents`, `plugins`, `marketplace.json`];
/** extension-ids.json 的目录段（原 `nre`）。 */
const EXTENSION_IDS_SEGMENTS = [`scripts`, `extension-ids.json`];
/** 物化键文件名（原 `Ea`）。 */
export const MATERIALIZATION_KEY_FILE_NAME = `.materialization-key`;
/** 陈旧 bundled marketplace 名字集合（原 `Da`）。 */
const STALE_BUNDLED_MARKETPLACE_NAME_SET = new Set(STALE_BUNDLED_MARKETPLACE_NAMES);

/** marketplace 名 schema（单段、非 . / ..；原 `Oa`）。 */
const marketplaceNameSchema = zString()
  .trim()
  .min(1)
  .refine(
    (name: string) => name !== `.` && name !== `..` && !name.includes(`/`) && !name.includes(`\\`),
    `Expected a single marketplace name.`,
  );

/** marketplace 条目里的插件描述（原 `ka`）。 */
const marketplacePluginEntrySchema = zRecord({
  name: zString().trim().min(1),
  source: zObject({ source: zLiteral(`local`), path: zString().trim().min(1) }),
});

/** bundled marketplace.json schema（名字须为 OpenAI bundled；原 `Aa`）。 */
export const bundledMarketplaceSchema = zRecord({
  name: marketplaceNameSchema.refine(isBundledMarketplaceName, `Expected an OpenAI bundled marketplace name.`),
  interface: zUnknown().optional(),
  plugins: zArray(marketplacePluginEntrySchema),
});

/** 运行时（本地）marketplace.json schema（原 `ja`）。 */
export const localMarketplaceReadSchema = zRecord({
  name: marketplaceNameSchema,
  interface: zUnknown().optional(),
  plugins: zArray(marketplacePluginEntrySchema),
});

/** 插件 manifest（.codex-plugin/plugin.json）schema（原 `Ma`）。 */
export const pluginManifestSchema = zRecord({
  bundledContentVariant: zString().trim().min(1).optional(),
  name: zString(),
  version: zString().trim().min(1),
});

/** 扩展 id 列表 schema（首元素必填；原 `Na`）。 */
const extensionIdsSchema = zNonEmptyArray([zString().trim().min(1)]).rest(zString().trim().min(1));

/** extension-ids.json schema（原 `rre`）。 */
const extensionIdsFileSchema = zObject({
  browserExtensions: zArray(
    zObject({
      browserFamily: zCustom((value: unknown) => typeof value == `string` && isSupportedBrowserFamilySafe(value)),
      extensionIds: extensionIdsSchema,
      storeExtensionId: zString().trim().min(1).nullable().optional(),
    }),
  ),
  extensionIds: extensionIdsSchema,
});

// isSupportedBrowserFamily 在 browser-runtime-resolution 中按其模块内默认参
// 数语义使用；此处仅作 zCustom 谓词，经 shared 直接引用。
import { Bc as isSupportedBrowserFamilySafe } from "@chunk/shared";

// ===========================================================================
// 5,493-5,607：总体协调（Fa）
// ===========================================================================

/** marketplace reconcile 结果。 */
export interface MarketplaceReconcileResult {
  hadReconcileFailure: boolean;
  hadUnknownChromeExtensionSyncState: boolean;
  installedChromePluginNames: string[] | null;
}

/** 安装流水线详细结果（Ra 的返回）。 */
export interface MarketplaceInstallResult extends MarketplaceReconcileResult {
  installedPluginCountAfterWrite: number | null;
}

/**
 * bundled marketplace 总体协调（原 `Fa`）：
 * 读取已装 marketplace → 物化运行时 marketplace → 逐插件 reconcile（Ra）
 * → 卸载禁用插件（ro）→ 完成日志（$a）。
 */
export async function reconcileBundledPluginsMarketplace(options: {
  appServerConnection: any;
  chromeExtensionSyncManagedPluginStore?: any;
  devRuntimeRepoRoot?: string;
  forceInstallPluginNames?: string[];
  installWhenMissingPluginNames?: string[];
  isChromeExtensionInstalled?: (options: { browserFamily: string; extensionId: string }) => boolean;
  liveVisualizationSkillVariant?: string | null;
  marketplaceName?: string;
  marketplacePluginNames: string[];
  packagedAppVersion?: string;
  reconcilePluginNames?: string[];
  resourcesPath?: string;
  runtimeMarketplaceRoot?: string;
  syncInstallStateWithChromeExtensionPluginNames?: string[];
  throwOnReconcileFailure?: boolean;
  uninstallDisabledPlugins?: boolean;
  visualizeTreatment?: boolean;
}): Promise<MarketplaceReconcileResult> {
  let marketplaceName = options.marketplaceName ?? `openai-bundled`,
    pluginNames = options.marketplacePluginNames,
    reconcilePluginNames = new Set(options.reconcilePluginNames ?? pluginNames),
    syncInstallStateWithChromeExtensionPluginNames = new Set(
      options.syncInstallStateWithChromeExtensionPluginNames ?? [],
    ),
    throwOnReconcileFailure = options.throwOnReconcileFailure === !0,
    installed = await listMarketplaceSafe({
      appServerConnection: options.appServerConnection,
      failOnError: throwOnReconcileFailure,
      marketplaceName,
      marketplacePluginNames: pluginNames,
    }),
    installedMarketplace = installed.marketplace,
    pluginNameSet = new Set(pluginNames),
    disabledInstalled =
      installedMarketplace?.plugins.filter(
        (plugin: any) =>
          options.uninstallDisabledPlugins !== !1 && plugin.installed && !pluginNameSet.has(plugin.name),
      ) ?? [],
    codexHome: string,
    platformFamily: string,
    materialized: Awaited<ReturnType<typeof resolveMaterializedBundledMarketplace>> | null;
  try {
    [codexHome, platformFamily] = await Promise.all([
      options.appServerConnection.codexHome(),
      options.appServerConnection.platformFamily(),
    ]);
    materialized = await resolveMaterializedBundledMarketplace({
      codexHome,
      liveVisualizationSkillVariant: options.liveVisualizationSkillVariant,
      visualizeTreatment: !1,
      marketplacePluginNames: pluginNames,
      marketplaceName,
      packagedAppVersion: options.packagedAppVersion,
      platformFamily,
      resourcesPath: options.resourcesPath,
      runtimeMarketplaceRoot: options.runtimeMarketplaceRoot,
    });
  } catch (error) {
    return (
      logger.warning(`bundled_plugins_marketplace_resolve_failed`, {
        safe: {},
        sensitive: { error },
      }),
      await uninstallDisabledPlugins({
        appServerConnection: options.appServerConnection,
        chromeExtensionSyncManagedPluginStore: options.chromeExtensionSyncManagedPluginStore,
        disabledInstalledPlugins: disabledInstalled,
        marketplaceName,
      }),
      {
        hadReconcileFailure: !0,
        hadUnknownChromeExtensionSyncState: !1,
        installedChromePluginNames: null,
      }
    );
  }
  if (materialized == null)
    return (
      logger.warning(`bundled_plugins_marketplace_missing`, {
        safe: { marketplacePluginNames: pluginNames },
        sensitive: {},
      }),
      await uninstallDisabledPlugins({
        appServerConnection: options.appServerConnection,
        chromeExtensionSyncManagedPluginStore: options.chromeExtensionSyncManagedPluginStore,
        disabledInstalledPlugins: disabledInstalled,
        marketplaceName,
      }),
      {
        hadReconcileFailure: !0,
        hadUnknownChromeExtensionSyncState: !1,
        installedChromePluginNames: null,
      }
    );
  let materializedPluginNames = new Set(materialized.marketplace.plugins.map((plugin: any) => plugin.name)),
    vanishedInstalled =
      installedMarketplace?.plugins.filter(
        (plugin: any) =>
          options.uninstallDisabledPlugins !== !1 &&
          plugin.installed &&
          pluginNameSet.has(plugin.name) &&
          !materializedPluginNames.has(plugin.name),
      ) ?? [],
    installResult = await installMaterializedMarketplace({
      appServerConnection: options.appServerConnection,
      chromeExtensionSyncManagedPluginStore: options.chromeExtensionSyncManagedPluginStore,
      devRuntimeRepoRoot: options.devRuntimeRepoRoot,
      throwOnReconcileFailure,
      forceInstallPluginNames: new Set(options.forceInstallPluginNames ?? []),
      installWhenMissingPluginNames: new Set(options.installWhenMissingPluginNames ?? []),
      isChromeExtensionInstalled: options.isChromeExtensionInstalled ?? isChromiumExtensionInstalled,
      installedBundledMarketplace: installedMarketplace,
      materializedMarketplace: materialized,
      platformFamily,
      reconcilePluginNames,
      resourcesPath: options.resourcesPath,
      syncInstallStateWithChromeExtensionPluginNames,
    });
  return (
    await uninstallDisabledPlugins({
      appServerConnection: options.appServerConnection,
      chromeExtensionSyncManagedPluginStore: options.chromeExtensionSyncManagedPluginStore,
      disabledInstalledPlugins: [...disabledInstalled, ...vanishedInstalled],
      marketplaceName,
    }),
    installResult.installedPluginCountAfterWrite != null &&
      logMarketplaceSyncCompleted({
        installedBundledMarketplace: installedMarketplace,
        installedPluginCountAfterWrite: installResult.installedPluginCountAfterWrite,
        marketplaceName,
        materializedMarketplace: materialized,
      }),
    {
      hadReconcileFailure: installed.hadReadFailure || installResult.hadReconcileFailure,
      hadUnknownChromeExtensionSyncState: installResult.hadUnknownChromeExtensionSyncState,
      installedChromePluginNames: installResult.installedChromePluginNames,
    }
  );
}

// ===========================================================================
// 5,608-5,701：chrome 扩展同步状态（are/Ia/ore）
// ===========================================================================

/** 序列化 chrome 扩展同步状态（原 `are`）。 */
export async function serializeChromeExtensionSyncState(options: {
  isChromeExtensionInstalled?: (options: { browserFamily: string; extensionId: string }) => boolean;
  marketplaceName?: string;
  marketplacePluginNames: string[];
  resourcesPath?: string;
}): Promise<string | null> {
  if (options.marketplacePluginNames.length === 0) return null;
  let state = await readChromeExtensionSyncState(options);
  return state == null ? null : JSON.stringify(state);
}

/** 读取各插件的 chrome 扩展安装状态（原 `Ia`）。 */
export async function readChromeExtensionSyncState(options: {
  isChromeExtensionInstalled?: (options: { browserFamily: string; extensionId: string }) => boolean;
  marketplaceName?: string;
  marketplacePluginNames: string[];
  resourcesPath?: string;
}): Promise<
  | {
      browserExtensions: { browserFamily: string; extensionId: string }[];
      isExtensionInstalled: boolean;
      pluginName: string;
    }[]
  | null
> {
  if (options.marketplacePluginNames.length === 0) return [];
  let marketplaceName = options.marketplaceName ?? `openai-bundled`;
  try {
    let resourceRoot = await findBundledResourceRoot({
        marketplaceName,
        resourcesPath: options.resourcesPath,
      });
    if (resourceRoot == null)
      return (
        logger.warning(`bundled_plugins_marketplace_missing`, {
          safe: { marketplacePluginNames: options.marketplacePluginNames },
          sensitive: {},
        }),
        null
      );
    let marketplace = filterMarketplacePlugins({
        marketplacePluginNames: options.marketplacePluginNames,
        marketplace: await readBundledMarketplaceManifest(resourceRoot),
      }),
      isExtensionInstalled = options.isChromeExtensionInstalled ?? isChromiumExtensionInstalled;
    return await Promise.all(
      marketplace.plugins.map(async (plugin: any) => {
        let extensions = await listPluginBrowserExtensions(
          resolveBundledPluginPath({ bundledPlugin: plugin, localMarketplaceRoot: resourceRoot }),
        );
        return {
          browserExtensions: extensions,
          isExtensionInstalled: anyExtensionInstalled(extensions, isExtensionInstalled),
          pluginName: plugin.name,
        };
      }),
    );
  } catch (error) {
    return (
      logger.warning(`bundled_plugins_chrome_extension_sync_state_read_failed`, {
        safe: { marketplacePluginNames: options.marketplacePluginNames },
        sensitive: { error },
      }),
      null
    );
  }
}

/** 直接 reconcile 一个（远端）marketplace 根目录（原 `ore`）。 */
export async function reconcileMarketplaceRoot(options: {
  appServerConnection: any;
  beforeSendRequest?: () => void;
  devRuntimeRepoRoot?: string;
  marketplaceRoot: string;
  resourcesPath?: string;
}): Promise<boolean> {
  let platformFamily: string, materialized: Awaited<ReturnType<typeof materializeMarketplaceRootInPlace>> | null;
  try {
    platformFamily = await options.appServerConnection.platformFamily();
    materialized = await materializeMarketplaceRootInPlace({
      marketplaceRoot: options.marketplaceRoot,
      platformFamily,
    });
  } catch (error) {
    return (
      logger.warning(`bundled_plugins_marketplace_resolve_failed`, {
        safe: {},
        sensitive: { error, marketplaceRoot: options.marketplaceRoot },
      }),
      !1
    );
  }
  if (materialized == null)
    return (
      logger.warning(`bundled_plugins_marketplace_missing`, {
        safe: {},
        sensitive: { marketplaceRoot: options.marketplaceRoot },
      }),
      !1
    );
  let installed = (
      await listMarketplaceSafe({
        appServerConnection: options.appServerConnection,
        beforeSendRequest: options.beforeSendRequest,
        failOnError: !1,
        marketplaceName: materialized.marketplace.name,
        marketplacePluginNames: materialized.marketplace.plugins.map((plugin: any) => plugin.name),
      })
    ).marketplace,
    installResult = await installMaterializedMarketplace({
      appServerConnection: options.appServerConnection,
      beforeSendRequest: options.beforeSendRequest,
      devRuntimeRepoRoot: options.devRuntimeRepoRoot,
      throwOnReconcileFailure: !1,
      forceInstallPluginNames: new Set(),
      installWhenMissingPluginNames: new Set(
        materialized.marketplace.plugins.map((plugin: any) => plugin.name),
      ),
      isChromeExtensionInstalled: isChromiumExtensionInstalled,
      installedBundledMarketplace: installed,
      materializedMarketplace: materialized,
      platformFamily,
      refreshInstalledMarketplaceAfterAdd: !0,
      reconcilePluginNames: new Set(materialized.marketplace.plugins.map((plugin: any) => plugin.name)),
      resourcesPath: options.resourcesPath,
      syncInstallStateWithChromeExtensionPluginNames: new Set(),
    });
  return (
    installResult.installedPluginCountAfterWrite != null &&
    (logMarketplaceSyncCompleted({
      installedBundledMarketplace: installed,
      installedPluginCountAfterWrite: installResult.installedPluginCountAfterWrite,
      marketplaceName: materialized.marketplace.name,
      materializedMarketplace: materialized,
    }),
    !0)
  );
}

// ===========================================================================
// 5,702-5,831：远端同步（sre/cre/La）
// ===========================================================================

/** 把本地运行时 marketplace 同步到远端 SSH 宿主（原 `sre`）。 */
export async function syncMarketplaceToRemoteHost(options: {
  appServerConnection: any;
  localMarketplaceRoot: string;
  managedPluginNames: string[];
  marketplaceName: string;
  marketplacePluginNames: string[];
}): Promise<boolean> {
  let [codexHome, platformFamily] = await Promise.all([
      options.appServerConnection.codexHome(),
      options.appServerConnection.platformFamily(),
    ]),
    executionHostPath = getExecutionHostPathForPlatform(platformFamily),
    marketplace = filterMarketplacePlugins({
      marketplacePluginNames: options.marketplacePluginNames,
      marketplace: await readLocalMarketplaceManifest(options.localMarketplaceRoot),
    }),
    marketplaceRoot = executionHostPath.join(
      codexHome,
      `.tmp`,
      `bundled-marketplaces`,
      options.marketplaceName,
    ),
    materialized = {
      localMarketplaceRoot: options.localMarketplaceRoot,
      marketplace,
      marketplaceRoot,
      marketplaceWriteCounts: null,
    },
    installed = (
      await listMarketplaceSafe({
        appServerConnection: options.appServerConnection,
        failOnError: !1,
        marketplaceName: options.marketplaceName,
        marketplacePluginNames: options.managedPluginNames,
      })
    ).marketplace,
    pluginNameSet = new Set(options.marketplacePluginNames),
    managedNameSet = new Set(options.managedPluginNames),
    disabledManaged =
      installed?.plugins.filter(
        (plugin: any) => plugin.installed && managedNameSet.has(plugin.name) && !pluginNameSet.has(plugin.name),
      ) ?? [];
  await materializeMarketplaceOnHost({
    appServerConnection: options.appServerConnection,
    executionHostPath,
    materializedMarketplace: materialized,
  });
  let installResult = await installMaterializedMarketplace({
    appServerConnection: options.appServerConnection,
    throwOnReconcileFailure: !1,
    forceInstallPluginNames: new Set(),
    installWhenMissingPluginNames: pluginNameSet,
    isChromeExtensionInstalled: isChromiumExtensionInstalled,
    installedBundledMarketplace: installed,
    materializedMarketplace: materialized,
    platformFamily,
    reconcilePluginNames: pluginNameSet,
    syncInstallStateWithChromeExtensionPluginNames: new Set(),
  });
  return (
    await uninstallDisabledPlugins({
      appServerConnection: options.appServerConnection,
      disabledInstalledPlugins: disabledManaged,
      marketplaceName: options.marketplaceName,
    }),
    installResult.hadReconcileFailure ||
      (await options.appServerConnection.sendAppServerRequest(`skills/list`, { forceReload: !0 })),
    !installResult.hadReconcileFailure
  );
}

/** 把物化 marketplace 的全部文件写到（远端）宿主（原 `cre`）。 */
async function materializeMarketplaceOnHost(options: {
  appServerConnection: any;
  executionHostPath: any;
  materializedMarketplace: {
    localMarketplaceRoot: string;
    marketplace: any;
    marketplaceRoot: string;
  };
}) {
  let manifestContents = Buffer.from(
      `${JSON.stringify(options.materializedMarketplace.marketplace, null, 2)}\n`,
    ),
    pluginFiles = (
      await Promise.all(
        options.materializedMarketplace.marketplace.plugins.map(async (plugin: any) => {
          let localRoot = resolveBundledPluginPath({
              bundledPlugin: plugin,
              localMarketplaceRoot: options.materializedMarketplace.localMarketplaceRoot,
            }),
            remoteRoot = assertRemotePathWithinRoot({
              label: `bundled plugin source`,
              path: plugin.source.path,
              executionHostPath: options.executionHostPath,
              root: options.materializedMarketplace.marketplaceRoot,
            });
          return collectRemotePluginFiles({
            executionHostPath: options.executionHostPath,
            localRoot,
            remoteRoot,
          });
        }),
      )
    ).flat(),
    files = [
      {
        contents: manifestContents,
        path: getMarketplaceManifestPath({
          marketplaceRoot: options.materializedMarketplace.marketplaceRoot,
          executionHostPath: options.executionHostPath,
        }),
      },
      ...pluginFiles,
    ].sort((a, b) => a.path.localeCompare(b.path)),
    hasher = createHash(`sha256`);
  for (let file of files)
    hasher.update(file.path),
      hasher.update(`\0`),
      hasher.update(`${file.contents.byteLength}\0`),
      hasher.update(file.contents);
  let materializationKeyPath = options.executionHostPath.join(
      options.materializedMarketplace.marketplaceRoot,
      MATERIALIZATION_KEY_FILE_NAME,
    ),
    materializationKey = `${hasher.digest(`hex`)}\n`;
  try {
    if (
      (await readFileOnHost({ appServerConnection: options.appServerConnection, path: materializationKeyPath })) ===
      materializationKey
    )
      return;
  } catch (error) {
    let message = errorToMessage(error).toLowerCase();
    if (
      !message.includes(`enoent`) &&
      !message.includes(`no such file or directory`) &&
      !message.includes(`cannot find the file specified`)
    )
      throw error;
  }
  await options.appServerConnection.remove(options.materializedMarketplace.marketplaceRoot, {
      force: !0,
      recursive: !0,
    }),
    await Promise.all(
      [...new Set(files.map((file) => options.executionHostPath.dirname(file.path)))].map(
        (directory) => options.appServerConnection.createDirectory(directory, { recursive: !0 }),
      ),
    ),
    await Promise.all(
      files.map((file) => options.appServerConnection.writeFile(file.path, file.contents)),
    ),
    await options.appServerConnection.writeFile(materializationKeyPath, materializationKey);
}

/** 递归收集本地插件目录的全部文件（映射到远端路径；原 `La`）。 */
async function collectRemotePluginFiles({
  executionHostPath,
  localRoot,
  remoteRoot,
}: {
  executionHostPath: any;
  localRoot: string;
  remoteRoot: string;
}): Promise<{ contents: Buffer; path: string }[]> {
  let entries = await fsp.readdir(localRoot, { withFileTypes: !0 });
  return (
    await Promise.all(
      entries.map(async (entry) => {
        let localPath = path.join(localRoot, entry.name),
          remotePath = executionHostPath.join(remoteRoot, entry.name);
        return entry.isDirectory()
          ? collectRemotePluginFiles({ executionHostPath, localRoot: localPath, remoteRoot: remotePath })
          : [{ contents: await fsp.readFile(localPath), path: remotePath }];
      }),
    )
  ).flat();
}

// ===========================================================================
// 5,832-5,958：安装流水线（Ra/za/Ba/Va）
// ===========================================================================

/**
 * 安装物化好的 marketplace（原 `Ra`）：addMarketplace →（必要时重读已装
 * 状态）→ vre 逐插件 reconcile。失败按 throwOnReconcileFailure 决定上抛或
 * 记录失败返回。
 */
async function installMaterializedMarketplace(options: {
  appServerConnection: any;
  beforeSendRequest?: () => void;
  chromeExtensionSyncManagedPluginStore?: any;
  devRuntimeRepoRoot?: string;
  forceInstallPluginNames: Set<string>;
  installWhenMissingPluginNames: Set<string>;
  isChromeExtensionInstalled: (options: { browserFamily: string; extensionId: string }) => boolean;
  installedBundledMarketplace: any;
  materializedMarketplace: {
    localMarketplaceRoot: string;
    marketplace: any;
    marketplaceRoot: string;
  };
  platformFamily: string;
  refreshInstalledMarketplaceAfterAdd?: boolean;
  reconcilePluginNames: Set<string>;
  resourcesPath?: string;
  syncInstallStateWithChromeExtensionPluginNames: Set<string>;
  throwOnReconcileFailure?: boolean;
}): Promise<MarketplaceInstallResult> {
  let marketplaceName: string;
  try {
    marketplaceName = (
      await options.appServerConnection.addMarketplace(
        { source: options.materializedMarketplace.marketplaceRoot },
        ...(options.beforeSendRequest ? [options.beforeSendRequest] : []),
      )
    ).marketplaceName;
  } catch (error) {
    if (
      (logger.warning(`bundled_plugins_marketplace_add_failed`, {
        safe: { marketplaceName: options.materializedMarketplace.marketplace.name },
        sensitive: { error, marketplaceRoot: options.materializedMarketplace.marketplaceRoot },
      }),
      options.throwOnReconcileFailure)
    )
      throw error;
    return {
      hadReconcileFailure: !0,
      hadUnknownChromeExtensionSyncState: !1,
      installedChromePluginNames: null,
      installedPluginCountAfterWrite: null,
    };
  }
  logger.info(`bundled_plugins_marketplace_added`, {
    safe: {
      marketplacePluginNames: options.materializedMarketplace.marketplace.plugins.map(
        (plugin: any) => plugin.name,
      ),
      marketplaceName,
    },
    sensitive: { marketplaceRoot: options.materializedMarketplace.marketplaceRoot },
  });
  let refreshed =
      (options.refreshInstalledMarketplaceAfterAdd === !0 && options.installedBundledMarketplace != null) ||
      options.syncInstallStateWithChromeExtensionPluginNames.size > 0
        ? await listMarketplaceSafe({
            appServerConnection: options.appServerConnection,
            beforeSendRequest: options.beforeSendRequest,
            failOnError: options.throwOnReconcileFailure,
            marketplaceName,
            marketplacePluginNames: [...options.reconcilePluginNames],
          })
        : { hadReadFailure: !1, marketplace: options.installedBundledMarketplace },
    installedMarketplace = refreshed.hadReadFailure
      ? options.installedBundledMarketplace
      : refreshed.marketplace,
    reconcileResult: Awaited<ReturnType<typeof reconcilePlugins>>;
  try {
    reconcileResult = await reconcilePlugins({
      appServerConnection: options.appServerConnection,
      beforeSendRequest: options.beforeSendRequest,
      chromeExtensionSyncManagedPluginStore: options.chromeExtensionSyncManagedPluginStore,
      devRuntimeRepoRoot: options.devRuntimeRepoRoot,
      forceInstallPluginNames: options.forceInstallPluginNames,
      installWhenMissingPluginNames: options.installWhenMissingPluginNames,
      isChromeExtensionInstalled: options.isChromeExtensionInstalled,
      installedBundledMarketplace: installedMarketplace,
      localMarketplaceRoot: options.materializedMarketplace.localMarketplaceRoot,
      marketplace: options.materializedMarketplace.marketplace,
      marketplaceName,
      marketplaceRoot: options.materializedMarketplace.marketplaceRoot,
      platformFamily: options.platformFamily,
      reconcilePluginNames: options.reconcilePluginNames,
      resourcesPath: options.resourcesPath,
      syncInstallStateWithChromeExtensionPluginNames:
        options.syncInstallStateWithChromeExtensionPluginNames,
    });
  } catch (error) {
    if (
      (logger.warning(`bundled_plugins_marketplace_install_failed`, {
        safe: {
          errorCategory: classifyInstallError({
            error,
            platformFamily: options.platformFamily,
          }),
          marketplaceName,
          platformFamily: options.platformFamily,
        },
        sensitive: { error, marketplaceRoot: options.materializedMarketplace.marketplaceRoot },
      }),
      options.throwOnReconcileFailure)
    )
      throw error;
    return {
      hadReconcileFailure: !0,
      hadUnknownChromeExtensionSyncState: !1,
      installedChromePluginNames: null,
      installedPluginCountAfterWrite: null,
    };
  }
  let { firstFailure } = reconcileResult;
  if (firstFailure != null) {
    if (options.throwOnReconcileFailure) throw firstFailure.error;
    return {
      hadReconcileFailure: !0,
      hadUnknownChromeExtensionSyncState: reconcileResult.hadUnknownChromeExtensionSyncState,
      installedChromePluginNames: reconcileResult.installedChromePluginNames,
      installedPluginCountAfterWrite: null,
    };
  }
  return {
    hadReconcileFailure: refreshed.hadReadFailure,
    hadUnknownChromeExtensionSyncState: reconcileResult.hadUnknownChromeExtensionSyncState,
    installedChromePluginNames: reconcileResult.installedChromePluginNames,
    installedPluginCountAfterWrite: reconcileResult.installedPluginCountAfterWrite,
  };
}

/** 安装失败分类（原 `za`）。 */
function classifyInstallError({
  error,
  platformFamily,
}: {
  error: unknown;
  platformFamily: string;
}): string {
  let message = errorToMessage(error).toLowerCase();
  return message.includes(`codex plugins are disabled for this workspace`)
    ? `plugins_disabled`
    : platformFamily === `windows` &&
        (extractBundleOperationErrorCode(error) === `cache_overwrite_failure` ||
          message.includes(`access is denied`) ||
          message.includes(`being used by another process`) ||
          message.includes(`os error 32`) ||
          message.includes(`os error 5`))
      ? `plugin_cache_windows_file_lock`
      : message.includes(`plugin source path is not a directory`) ||
          message.includes(`missing plugin.json`) ||
          message.includes(`missing or invalid plugin.json`) ||
          message.includes(`local plugin source path`) ||
          message.includes(`failed to read plugin source directory`) ||
          message.includes(`failed to resolve local marketplace source path`) ||
          message.includes(`marketplace root does not contain a supported manifest`) ||
          message.includes(`marketplace file is not in a supported location`)
        ? `local_plugin_source`
        : `other`;
}

/** unknown → 错误消息字符串（原 `Ba`）。 */
function errorToMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** listPlugins 安全包装（失败仅 warning；原 `Va`）。 */
async function listMarketplaceSafe(options: {
  appServerConnection: any;
  beforeSendRequest?: () => void;
  failOnError?: boolean;
  marketplaceName: string;
  marketplacePluginNames: string[];
}): Promise<{ hadReadFailure: boolean; marketplace: any }> {
  try {
    let { marketplaces } = await options.appServerConnection.listPlugins(
      LOCAL_MARKETPLACE_LIST_FILTER,
      ...(options.beforeSendRequest ? [options.beforeSendRequest] : []),
    );
    return { hadReadFailure: !1, marketplace: marketplaces.find((m: any) => m.name === options.marketplaceName) };
  } catch (error) {
    if (
      (logger.warning(`bundled_plugins_list_failed`, {
        safe: {
          marketplaceName: options.marketplaceName,
          marketplacePluginNames: options.marketplacePluginNames,
        },
        sensitive: { error },
      }),
      options.failOnError)
    )
      throw error;
    return { hadReadFailure: !0, marketplace: void 0 };
  }
}

// ===========================================================================
// 5,981-6,044：物化 marketplace 解析（lre/Ha/Ua/ure）
// ===========================================================================

/** 物化「运行时 marketplace」到 codex home（原 `lre`）。 */
async function resolveMaterializedBundledMarketplace(options: {
  codexHome: string;
  liveVisualizationSkillVariant?: string | null;
  marketplaceName?: string;
  marketplacePluginNames: string[];
  packagedAppVersion?: string;
  platformFamily: string;
  resourcesPath?: string;
  runtimeMarketplaceRoot?: string;
  visualizeTreatment?: boolean;
}) {
  let resourceRoot = await findBundledResourceRoot({
    marketplaceName: options.marketplaceName,
    resourcesPath: options.resourcesPath,
  });
  if (resourceRoot == null) return null;
  let written = await writeRuntimeMarketplace({
      codexHome: options.codexHome,
      liveVisualizationSkillVariant: options.liveVisualizationSkillVariant,
      visualizeTreatment: !1,
      marketplacePluginNames: options.marketplacePluginNames,
      marketplaceName: options.marketplaceName,
      packagedAppVersion: options.packagedAppVersion,
      sourceMarketplaceRoot: resourceRoot,
      targetMarketplaceRoot: options.runtimeMarketplaceRoot,
    }),
    localRoot = await realpathOrNull(written.marketplaceRoot);
  return {
    localMarketplaceRoot: localRoot,
    marketplace: written.marketplace,
    marketplaceWriteCounts: written.marketplaceWriteCounts,
    marketplaceRoot: toRemotePath({ localPath: localRoot, platformFamily: options.platformFamily }),
  };
}

/** 查找 bundled 插件源目录与版本（原 `Ha`）。 */
export async function findBundledPluginRoot(options: {
  codexHome?: string;
  marketplaceName?: string;
  marketplaceRoot?: string;
  pluginName: string;
  resourcesPath?: string;
}): Promise<{ path: string; version: string } | null> {
  let marketplaceRoot = options.marketplaceRoot ?? (await findBundledResourceRoot(options));
  if (
    marketplaceRoot == null ||
    (options.marketplaceRoot != null &&
      !(await isBundledResourceMarketplaceValid({
        marketplaceName: options.marketplaceName,
        marketplaceRoot,
      })))
  )
    return null;
  let plugin = (await readBundledMarketplaceManifest(marketplaceRoot)).plugins.find(
      (plugin: any) => plugin.name === options.pluginName,
    );
  if (plugin == null) return null;
  let pluginPath = resolveBundledPluginPath({ bundledPlugin: plugin, localMarketplaceRoot: marketplaceRoot });
  return { path: pluginPath, version: (await readPluginManifest(pluginPath)).version };
}

/** 查找 bundled 资源里的 marketplace 根（resources 与 asar.unpacked 两处；原 `Ua`）。 */
async function findBundledResourceRoot(options: {
  marketplaceName?: string;
  resourcesPath?: string;
}): Promise<string | null> {
  let candidates = [options.marketplaceName, DEFAULT_MARKETPLACE_NAME]
    .filter((name, index, all) => all.indexOf(name) === index)
    .flatMap((name) => [
      { marketplaceName: name, marketplaceRoot: path.join(options.resourcesPath!, ...BUNDLED_PLUGINS_RESOURCE_SEGMENTS, name) },
      {
        marketplaceName: name,
        marketplaceRoot: path.join(
          options.resourcesPath!,
          `app.asar.unpacked`,
          ...BUNDLED_PLUGINS_RESOURCE_SEGMENTS,
          name,
        ),
      },
    ]);
  return (
    (
      await Promise.all(
        candidates.map(async ({ marketplaceName, marketplaceRoot }) =>
          (await isBundledResourceMarketplaceValid({ marketplaceName, marketplaceRoot }))
            ? marketplaceRoot
            : null,
        ),
      )
    ).find((root) => root != null) ?? null
  );
}

/** 就地校验（远端）marketplace 根（原 `ure`）。 */
async function materializeMarketplaceRootInPlace(options: {
  marketplaceRoot: string;
  platformFamily: string;
}) {
  if (!(await isRuntimeMarketplaceValid({ marketplaceRoot: options.marketplaceRoot }))) return null;
  let localRoot = await realpathOrNull(options.marketplaceRoot);
  return {
    localMarketplaceRoot: localRoot,
    marketplace: await readLocalMarketplaceManifest(options.marketplaceRoot),
    marketplaceWriteCounts: null,
    marketplaceRoot: toRemotePath({ localPath: localRoot, platformFamily: options.platformFamily }),
  };
}

// ===========================================================================
// 6,045-6,241：运行时 marketplace 写入（dre/fre/pre）
// ===========================================================================

/**
 * 把 bundled 资源物化为运行时 marketplace（原 `dre`）：
 * materialization-key 命中则复用；否则 staging 目录写入 manifest + 复制插件
 * （期间注入 bundledContentVariant）→ 停 chrome 原生宿主 → 原子替换目标目录。
 */
async function writeRuntimeMarketplace(options: {
  codexHome: string;
  liveVisualizationSkillVariant?: string | null;
  marketplaceName?: string;
  marketplacePluginNames: string[];
  packagedAppVersion?: string;
  sourceMarketplaceRoot: string;
  targetMarketplaceRoot?: string;
  visualizeTreatment?: boolean;
}) {
  let sourceMarketplace: any;
  try {
    sourceMarketplace = await readBundledMarketplaceManifest(options.sourceMarketplaceRoot);
  } catch (error) {
    throw (
      logManifestReadFailure({
        error,
        marketplaceName: options.marketplaceName,
        marketplaceRoot: options.sourceMarketplaceRoot,
        marketplaceRootKind: `bundled_resource`,
      }),
      error
    );
  }
  let marketplace = {
      ...filterMarketplacePlugins({
        marketplacePluginNames: options.marketplacePluginNames,
        marketplace: sourceMarketplace,
      }),
      name: options.marketplaceName,
    },
    visualizePlugin = marketplace.plugins.find((plugin: any) => plugin.name === VISUALIZE_PLUGIN_NAME),
    visualizeSkillContent =
      visualizePlugin == null
        ? void 0
        : await fsp.readFile(
            path.join(
              resolveBundledPluginPath({
                bundledPlugin: visualizePlugin,
                localMarketplaceRoot: options.sourceMarketplaceRoot,
              }),
              `skills`,
              `visualize`,
              `SKILL.md`,
            ),
            `utf8`,
          ),
    visualizeSkillContentHash =
      visualizeSkillContent == null
        ? void 0
        : createHash(`sha256`).update(visualizeSkillContent).digest(`hex`),
    bundleId = options.packagedAppVersion == null ? null : await readBundleId(options.sourceMarketplaceRoot),
    materializationKey =
      bundleId == null
        ? null
        : JSON.stringify({
            version: 1,
            appVersion: options.packagedAppVersion,
            bundleId,
            marketplaceName: options.marketplaceName,
            computerUseAudioEnabled:
              marketplace.plugins.some((plugin: any) => plugin.name === `computer-use`) &&
              isComputerAudioEnabled(),
            liveVisualizationSkillVariant: options.liveVisualizationSkillVariant ?? null,
            visualizeTreatment: !1,
            visualizeSkillContentHash,
            plugins: (
              await Promise.all(
                marketplace.plugins.map(async (plugin: any) => ({
                  name: plugin.name,
                  version: (
                    await readPluginManifest(
                      resolveBundledPluginPath({
                        bundledPlugin: plugin,
                        localMarketplaceRoot: options.sourceMarketplaceRoot,
                      }),
                    )
                  ).version,
                })),
              )
            ).sort((a: any, b: any) => a.name.localeCompare(b.name)),
          });
  if (
    materializationKey != null &&
    (await isMaterializationCurrent({
      expectedMarketplace: marketplace,
      expectedVisualizeSkillContent: visualizeSkillContent,
      materializationKey,
      targetMarketplaceRoot: options.targetMarketplaceRoot!,
    }))
  )
    return (
      logger.info(`bundled_plugins_runtime_marketplace_reused`, {
        safe: {
          pluginCount: marketplace.plugins.length,
          pluginNames: marketplace.plugins.map((plugin: any) => plugin.name),
        },
        sensitive: { targetMarketplaceRoot: options.targetMarketplaceRoot },
      }),
      {
        localMarketplaceRoot: options.targetMarketplaceRoot,
        marketplace,
        marketplaceWriteCounts: null,
        marketplaceRoot: options.targetMarketplaceRoot,
      }
    );
  let marketplaceWriteCounts = {
      pluginCountAfterWrite: marketplace.plugins.length,
      pluginCountBeforeWrite: await countPluginsInMarketplace({
        marketplaceName: options.marketplaceName,
        marketplaceRoot: options.targetMarketplaceRoot!,
        marketplaceRootKind: `runtime_marketplace`,
      }),
    },
    stagingRoot = `${options.targetMarketplaceRoot}.staging-${randomUUID()}`,
    folderWritePhase = `cleanup_staging_before_write`;
  try {
    await removeDirectoryWithRetries({
        directory: stagingRoot,
        directoryKind: `staging_marketplace`,
        marketplaceName: options.marketplaceName,
        marketplaceWriteCounts,
        removePhase: `cleanup_staging_before_write`,
      }),
      (folderWritePhase = `create_staging`),
      await fsp.mkdir(path.join(stagingRoot, ...MARKETPLACE_MANIFEST_SEGMENTS.slice(0, -1)), {
        recursive: !0,
      }),
      (folderWritePhase = `write_manifest`);
    try {
      await fsp.writeFile(
        path.join(stagingRoot, ...MARKETPLACE_MANIFEST_SEGMENTS),
        `${JSON.stringify(marketplace, null, 2)}\n`,
        `utf8`,
      );
    } catch (error) {
      throw (
        logger.warning(`plugin_marketplace_manifest_write_failed`, {
          safe: { marketplaceName: options.marketplaceName, ...marketplaceWriteCounts },
          sensitive: { error, marketplaceRoot: stagingRoot },
        }),
        error
      );
    }
    ((folderWritePhase = `copy_plugins`),
      await Promise.all(
        marketplace.plugins.map(async (plugin: any) => {
          let sourcePath = path.resolve(options.sourceMarketplaceRoot, plugin.source.path),
            targetPath = path.resolve(stagingRoot, plugin.source.path);
          assertLocalPathWithinRoot({ label: `bundled plugin target`, path: targetPath, root: stagingRoot }),
            await fsp.mkdir(path.dirname(targetPath), { recursive: !0 }),
            await copyPluginDirectory(sourcePath, targetPath),
            await applyBundledContentVariant({
              liveVisualizationSkillVariant: options.liveVisualizationSkillVariant,
              visualizeTreatment: !1,
              pluginName: plugin.name,
              pluginRoot: targetPath,
            });
        }),
      ),
      materializationKey != null &&
        ((folderWritePhase = `write_materialization_key`),
        await fsp.writeFile(
          path.join(stagingRoot, MATERIALIZATION_KEY_FILE_NAME),
          `${materializationKey}\n`,
          `utf8`,
        )),
      (folderWritePhase = `stop_chrome_native_host`),
      await stopChromeNativeHostsUnderRoot({
        force: !0,
        repointManifestsToPluginCache: {
          codexHome: options.codexHome,
          marketplaceName: options.marketplaceName,
        },
        root: options.targetMarketplaceRoot,
      }),
      (folderWritePhase = `replace_target`),
      await removeDirectoryWithRetries({
        directory: options.targetMarketplaceRoot!,
        directoryKind: `runtime_marketplace`,
        marketplaceName: options.marketplaceName,
        marketplaceWriteCounts,
        removePhase: `replace_target`,
      }),
      (folderWritePhase = `create_target_parent`),
      await fsp.mkdir(path.resolve(options.targetMarketplaceRoot!, `..`), { recursive: !0 }),
      (folderWritePhase = `rename_staging`),
      await fsp.rename(stagingRoot, options.targetMarketplaceRoot!));
  } catch (error) {
    throw (
      logger.warning(`plugin_marketplace_folder_write_failed`, {
        safe: {
          folderWritePhase,
          marketplaceName: options.marketplaceName,
          ...marketplaceWriteCounts,
        },
        sensitive: {
          error,
          sourceMarketplaceRoot: options.sourceMarketplaceRoot,
          targetMarketplaceRoot: options.targetMarketplaceRoot,
        },
      }),
      error
    );
  } finally {
    await removeDirectoryWithRetries({
      directory: stagingRoot,
      directoryKind: `staging_marketplace`,
      marketplaceName: options.marketplaceName,
      marketplaceWriteCounts,
      removePhase: `cleanup_staging_after_write`,
    });
  }
  return (
    logger.info(`plugin_marketplace_folder_write_succeeded`, {
      safe: { marketplaceName: options.marketplaceName, ...marketplaceWriteCounts },
      sensitive: {
        sourceMarketplaceRoot: options.sourceMarketplaceRoot,
        targetMarketplaceRoot: options.targetMarketplaceRoot,
      },
    }),
    logger.info(`bundled_plugins_runtime_marketplace_written`, {
      safe: {
        pluginCount: marketplace.plugins.length,
        pluginNames: marketplace.plugins.map((plugin: any) => plugin.name),
        visualizeSkillVariant: marketplace.plugins.some((plugin: any) => plugin.name === `visualize`)
          ? `proactive`
          : null,
      },
      sensitive: { targetMarketplaceRoot: options.targetMarketplaceRoot },
    }),
    {
      localMarketplaceRoot: options.targetMarketplaceRoot,
      marketplace,
      marketplaceWriteCounts,
      marketplaceRoot: options.targetMarketplaceRoot,
    }
  );
}

/** 读取 bundled 资源目录的 bundle id（原 `fre`）。 */
async function readBundleId(marketplaceRoot: string): Promise<string | null> {
  try {
    let contents = (await fsp.readFile(path.join(marketplaceRoot, BUNDLE_ID_FILE_NAME), `utf8`)).trim();
    return contents === `` ? null : contents;
  } catch {
    return null;
  }
}

/** 物化结果是否与期望一致（key + manifest + 完整性 + visualize SKILL.md；原 `pre`）。 */
async function isMaterializationCurrent(options: {
  expectedMarketplace: any;
  expectedVisualizeSkillContent: string | undefined;
  materializationKey: string;
  targetMarketplaceRoot: string;
}): Promise<boolean> {
  try {
    let visualizePlugin = options.expectedMarketplace.plugins.find(
        (plugin: any) => plugin.name === VISUALIZE_PLUGIN_NAME,
      ),
      [key, manifest, isValid, visualizeSkillContent] = await Promise.all([
        fsp.readFile(path.join(options.targetMarketplaceRoot, MATERIALIZATION_KEY_FILE_NAME), `utf8`),
        readLocalMarketplaceManifest(options.targetMarketplaceRoot),
        isRuntimeMarketplaceValid({ marketplaceRoot: options.targetMarketplaceRoot }),
        visualizePlugin == null
          ? Promise.resolve(void 0)
          : fsp.readFile(
              path.join(
                resolveBundledPluginPath({
                  bundledPlugin: visualizePlugin,
                  localMarketplaceRoot: options.targetMarketplaceRoot,
                }),
                `skills`,
                `visualize`,
                `SKILL.md`,
              ),
              `utf8`,
            ),
      ]);
    return (
      key === `${options.materializationKey}\n` &&
      JSON.stringify(manifest) === JSON.stringify(options.expectedMarketplace) &&
      isValid &&
      visualizeSkillContent === options.expectedVisualizeSkillContent
    );
  } catch {
    return !1;
  }
}

// ===========================================================================
// 6,242-6,349：原生宿主安装 + manifest/扩展读取（mre/Wa/Ga/Ka/qa/Ja/Ya/Xa）
// ===========================================================================

/** 安装插件的 chrome 原生宿主（latest 软链 + manifest；原 `mre`）。 */
async function installChromeNativeHostForPlugin(options: {
  bundledPlugin: any;
  codexHome: string;
  devRuntimeRepoRoot?: string;
  executionHostPath: any;
  localMarketplaceRoot: string;
  marketplaceName?: string;
  resourcesPath?: string;
}) {
  let nativeHostName = getChromeNativeHostName(options.bundledPlugin.name);
  if (nativeHostName == null) return;
  let pluginPath = resolveBundledPluginPath({
      bundledPlugin: options.bundledPlugin,
      localMarketplaceRoot: options.localMarketplaceRoot,
    }),
    latestRoot = getPluginLatestCacheRoot({
      bundledPluginName: options.bundledPlugin.name,
      codexHome: options.codexHome,
      marketplaceName: options.marketplaceName,
      executionHostPath: options.executionHostPath,
    }),
    manifest = await readPluginManifest(pluginPath);
  await pointLatestCacheAtVersion({
    latestRoot,
    versionRoot: getPluginCacheVersionRoot({
      bundledPluginName: options.bundledPlugin.name,
      codexHome: options.codexHome,
      marketplaceName: options.marketplaceName,
      executionHostPath: options.executionHostPath,
      version: manifest.version,
    }),
    waitForVersionRoot: !0,
  });
  let extensionIdsFile = await readExtensionIdsFile(latestRoot);
  await installChromeNativeHostManifest({
    codexHome: options.codexHome,
    devRuntimeRepoRoot: options.devRuntimeRepoRoot,
    extensionIds: extensionIdsFile.extensionIds,
    nativeHostName,
    pluginRoot: latestRoot,
    pluginVersion: manifest.version,
    resourcesPath: options.resourcesPath,
  });
}

/** bundled 插件源目录（越界校验；原 `Wa`）。 */
export function resolveBundledPluginPath({
  bundledPlugin,
  localMarketplaceRoot,
}: {
  bundledPlugin: { source: { path: string } };
  localMarketplaceRoot: string;
}): string {
  let pluginPath = path.resolve(localMarketplaceRoot, bundledPlugin.source.path);
  return (assertLocalPathWithinRoot({ label: `bundled plugin source`, path: pluginPath, root: localMarketplaceRoot }), pluginPath);
}

/** 读取插件 manifest（原 `Ga`）。 */
async function readPluginManifest(pluginRoot: string) {
  return pluginManifestSchema.parseAsync(
    JSON.parse(await fsp.readFile(path.join(pluginRoot, `.codex-plugin`, `plugin.json`), `utf8`)),
  );
}

/** 插件的浏览器扩展列表（extension-ids.json，按 family:id 去重；原 `Ka`）。 */
async function listPluginBrowserExtensions(
  pluginRoot: string,
): Promise<{ browserFamily: string; extensionId: string }[]> {
  let entries = (await readExtensionIdsFile(pluginRoot)).browserExtensions.flatMap(
      ({ browserFamily, extensionIds, storeExtensionId }: any) => [
        ...extensionIds.map((extensionId: string) => ({ browserFamily, extensionId })),
        ...(storeExtensionId == null
          ? []
          : [{ browserFamily, extensionId: storeExtensionId }]),
      ],
    );
  return [
    ...new Map<string, { browserFamily: string; extensionId: string }>(
      entries.map((entry: any) => [`${entry.browserFamily}:${entry.extensionId}`, entry]),
    ).values(),
  ];
}

/** 读取 extension-ids.json（原 `qa`）。 */
async function readExtensionIdsFile(pluginRoot: string) {
  return extensionIdsFileSchema.parse(
    JSON.parse(await fsp.readFile(path.join(pluginRoot, ...EXTENSION_IDS_SEGMENTS), `utf8`)),
  );
}

/** 任一扩展已安装（全部探测失败时抛「探测失败」；原 `Ja`）。 */
function anyExtensionInstalled(
  extensions: { browserFamily: string; extensionId: string }[],
  isExtensionInstalled: (options: { browserFamily: string; extensionId: string }) => boolean,
): boolean {
  let firstError: unknown;
  for (let extension of extensions)
    try {
      if (isExtensionInstalled(extension)) return !0;
    } catch (error) {
      firstError ??= error;
    }
  if (firstError != null) throw Error(`Chromium extension detection failed`, { cause: firstError });
  return !1;
}

/** 读取 bundled marketplace manifest（原 `Ya`）。 */
async function readBundledMarketplaceManifest(marketplaceRoot: string) {
  return bundledMarketplaceSchema.parseAsync(
    JSON.parse(
      await fsp.readFile(path.join(marketplaceRoot, ...MARKETPLACE_MANIFEST_SEGMENTS), `utf8`),
    ),
  );
}

/** 读取（运行时）marketplace manifest（原 `Xa`）。 */
async function readLocalMarketplaceManifest(marketplaceRoot: string) {
  return localMarketplaceReadSchema.parseAsync(
    JSON.parse(
      await fsp.readFile(path.join(marketplaceRoot, ...MARKETPLACE_MANIFEST_SEGMENTS), `utf8`),
    ),
  );
}

// ===========================================================================
// 6,350-6,428：目录操作与日志（hre/Za/Qa/gre/$a/_re/eo/to）
// ===========================================================================

/** 统计 marketplace 内插件数（失败记日志返回 null；原 `hre`）。 */
async function countPluginsInMarketplace(options: {
  marketplaceName?: string;
  marketplaceRoot: string;
  marketplaceRootKind: string;
}): Promise<number | null> {
  let manifestPath = path.join(options.marketplaceRoot, ...MARKETPLACE_MANIFEST_SEGMENTS);
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return (await readLocalMarketplaceManifest(options.marketplaceRoot)).plugins.length;
  } catch (error) {
    return (
      logManifestReadFailure({
        error,
        marketplaceName: options.marketplaceName,
        marketplaceRoot: options.marketplaceRoot,
        marketplaceRootKind: options.marketplaceRootKind,
      }),
      null
    );
  }
}

/** rm 带 5 次重试（失败记录并上抛；原 `Za`）。 */
async function removeDirectoryWithRetries(options: {
  directory: string;
  directoryKind: string;
  marketplaceName?: string;
  marketplaceWriteCounts?: { pluginCountAfterWrite: number; pluginCountBeforeWrite: number | null } | null;
  removePhase: string;
}) {
  try {
    await fsp.rm(options.directory, { force: !0, maxRetries: 5, recursive: !0, retryDelay: 100 });
  } catch (error) {
    throw (
      logger.warning(`plugin_marketplace_folder_remove_failed`, {
        safe: {
          directoryKind: options.directoryKind,
          marketplaceName: options.marketplaceName,
          removePhase: options.removePhase,
          ...options.marketplaceWriteCounts,
        },
        sensitive: { directory: options.directory, error },
      }),
      error
    );
  }
}

/** manifest 读取失败日志（原 `Qa`）。 */
export function logManifestReadFailure(options: {
  error: unknown;
  marketplaceName?: string;
  marketplaceRoot: string;
  marketplaceRootKind: string;
}) {
  logger.warning(`plugin_marketplace_manifest_read_failed`, {
    safe: {
      errorCategory: classifyManifestReadError(options.error),
      marketplaceName: options.marketplaceName,
      marketplaceRootKind: options.marketplaceRootKind,
    },
    sensitive: { error: options.error, marketplaceRoot: options.marketplaceRoot },
  });
}

/** manifest 读取失败分类（原 `gre`）。 */
function classifyManifestReadError(error: unknown): string {
  return error instanceof SyntaxError
    ? `corrupt_json`
    : error instanceof SchemaError
      ? `invalid_schema`
      : `read_failed`;
}

/** marketplace 同步完成日志（原 `$a`）。 */
function logMarketplaceSyncCompleted(options: {
  installedBundledMarketplace: any;
  installedPluginCountAfterWrite: number;
  marketplaceName?: string;
  materializedMarketplace: {
    marketplace: any;
    marketplaceWriteCounts: unknown;
  };
}) {
  let pluginNames = new Set<string>(
      options.materializedMarketplace.marketplace.plugins.map((plugin: any) => plugin.name as string),
    );
  logger.info(`plugin_marketplace_sync_completed`, {
    safe: {
      marketplaceName: options.marketplaceName,
      pluginCount: options.materializedMarketplace.marketplace.plugins.length,
      pluginsInstalledAfterWrite: options.installedPluginCountAfterWrite,
      pluginsInstalledBeforeWrite: countInstalledPlugins(
        options.installedBundledMarketplace,
        pluginNames,
      ),
      ...(options.materializedMarketplace.marketplaceWriteCounts as Record<string, unknown>),
    },
    sensitive: {},
  });
}

/** 已装且在名单内的插件计数（原 `_re`）。 */
function countInstalledPlugins(installedMarketplace: any, pluginNames: Set<string>): number {
  return (
    installedMarketplace?.plugins.filter((plugin: any) => plugin.installed && pluginNames.has(plugin.name))
      .length ?? 0
  );
}

/** realpath（失败返回原路径；原 `eo`）。 */
async function realpathOrNull(target: string): Promise<string> {
  try {
    return await fsp.realpath(target);
  } catch {
    return target;
  }
}

/** 按名单过滤 marketplace 插件（原 `to`）。 */
function filterMarketplacePlugins({
  marketplace,
  marketplacePluginNames,
}: {
  marketplace: any;
  marketplacePluginNames: string[];
}) {
  let pluginNameSet = new Set(marketplacePluginNames);
  return { ...marketplace, plugins: marketplace.plugins.filter((plugin: any) => pluginNameSet.has(plugin.name)) };
}

/** 本地路径越界校验（原 `vo`，7,092；被 dre/Wa 使用，随 marketplace 侧就近声明）。 */
function assertLocalPathWithinRoot(options: { label: string; path: string; root: string }) {
  let resolvedRoot = path.resolve(options.root),
    resolvedPath = path.resolve(options.path);
  if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(`${resolvedRoot}${path.sep}`))
    throw Error(`${options.label} path escapes marketplace root: ${resolvedPath}`);
}

// ===========================================================================
// 6,429-6,738：reconcile 核心（vre）
// ===========================================================================

/**
 * 逐插件 reconcile（原 `vre`）：
 *   - 前置：为每个 chrome 插件把 runtime 复制到 codex home
 *     （copy_chrome_plugin_app_server_codex_runtime 阶段）；
 *   - chrome 扩展同步插件：按扩展安装状态决定 安装/卸载/保留；
 *   - 其余插件：按 installedPluginStatus（current/missing/outdated/unknown）
 *     与 forceInstall/installWhenMissing 决定跳过或 installPlugin；
 *   - chrome 插件安装后重建原生宿主（latest 软链 + manifest）。
 */
async function reconcilePlugins(options: {
  appServerConnection: any;
  beforeSendRequest?: () => void;
  chromeExtensionSyncManagedPluginStore?: any;
  devRuntimeRepoRoot?: string;
  forceInstallPluginNames: Set<string>;
  installWhenMissingPluginNames: Set<string>;
  isChromeExtensionInstalled: (options: { browserFamily: string; extensionId: string }) => boolean;
  installedBundledMarketplace: any;
  localMarketplaceRoot: string;
  marketplace: any;
  marketplaceName: string;
  marketplaceRoot: string;
  platformFamily: string;
  reconcilePluginNames: Set<string>;
  resourcesPath?: string;
  syncInstallStateWithChromeExtensionPluginNames: Set<string>;
}): Promise<{
  firstFailure: { error: unknown; safe: any; sensitive: any } | null;
  hadUnknownChromeExtensionSyncState: boolean;
  installedChromePluginNames: string[];
  installedPluginCountAfterWrite: number;
}> {
  let codexHome = await options.appServerConnection.codexHome();
  options.beforeSendRequest?.();
  let executionHostPath = getExecutionHostPathForPlatform(options.platformFamily),
    marketplacePath = getMarketplaceManifestPath({
      marketplaceRoot: options.marketplaceRoot,
      executionHostPath,
    }),
    managedPluginIds =
      options.syncInstallStateWithChromeExtensionPluginNames.size === 0
        ? new Set()
        : await readChromeExtensionSyncManagedIds({
            chromeExtensionSyncManagedPluginStore: options.chromeExtensionSyncManagedPluginStore,
          }),
    pluginsToReconcile = options.marketplace.plugins.filter((plugin: any) =>
      options.reconcilePluginNames.has(plugin.name),
    ),
    allPluginNames = new Set(options.marketplace.plugins.map((plugin: any) => plugin.name)),
    installedPluginNames = new Set<string>(
      options.installedBundledMarketplace?.plugins
        .filter((plugin: any) => plugin.installed && allPluginNames.has(plugin.name))
        .map((plugin: any) => plugin.name) ?? [],
    ),
    pluginCount = pluginsToReconcile.length,
    firstFailure: { error: unknown; safe: any; sensitive: any } | null = null,
    hadUnknownChromeExtensionSyncState = !1,
    runtimeCopyFailure = (
      await Promise.all(
        pluginsToReconcile.map(async (plugin: any, pluginIndex: number) => {
          let nativeHostName = getChromeNativeHostName(plugin.name);
          if (nativeHostName == null) return null;
          try {
            return (
              await installChromePluginRuntime({
                codexHome,
                devRuntimeRepoRoot: options.devRuntimeRepoRoot,
                nativeHostName,
                resourcesPath: options.resourcesPath,
              }),
              null
            );
          } catch (error) {
            return {
              error,
              safe: {
                ...redactBundledPluginSourcePath(plugin.source.path),
                installPhase: `copy_chrome_plugin_app_server_codex_runtime`,
                pluginCount,
                pluginIndex,
                pluginName: plugin.name,
              },
              sensitive: {
                bundledPluginSourcePath: plugin.source.path,
                marketplacePath,
              },
            };
          }
        }),
      )
    ).find((failure) => failure != null);
  if (runtimeCopyFailure != null)
    return {
      firstFailure: runtimeCopyFailure,
      hadUnknownChromeExtensionSyncState: !1,
      installedChromePluginNames: [...installedPluginNames].filter(
        (name) => getChromeNativeHostName(name) != null,
      ),
      installedPluginCountAfterWrite: installedPluginNames.size,
    };
  for (let [pluginIndex, plugin] of pluginsToReconcile.entries()) {
    let installPhase = `read_bundled_manifest`,
      installedPluginStatus: string | undefined,
      installReason: string | undefined,
      installedPluginCacheRoot: string | undefined,
      bundledManifest: any = null,
      getBundledManifest = async () => {
        if (bundledManifest != null) return bundledManifest;
        let pluginRoot = assertRemotePathWithinRoot({
          label: `bundled plugin source`,
          path: plugin.source.path,
          executionHostPath,
          root: options.marketplaceRoot,
        });
        return (
          (bundledManifest = await readPluginManifestOnHost({
            appServerConnection: options.appServerConnection,
            executionHostPath,
            pluginRoot,
          })),
          bundledManifest
        );
      };
    try {
      let shouldWriteSyncMarker = !1,
        installedPlugin = options.installedBundledMarketplace?.plugins.find(
          (candidate: any) => candidate.name === plugin.name,
        ),
        forceInstall = options.forceInstallPluginNames.has(plugin.name),
        syncWithChromeExtension = options.syncInstallStateWithChromeExtensionPluginNames.has(plugin.name),
        isChromePlugin = getChromeNativeHostName(plugin.name) != null,
        reconcileChromeNativeHost = async () => {
          installPhase = `reconcile_chrome_native_host`;
          let resourcesPath = requireResourcesPathForChromeSync(options.resourcesPath, plugin.name);
          await installChromeNativeHostForPlugin({
            bundledPlugin: plugin,
            codexHome,
            devRuntimeRepoRoot: options.devRuntimeRepoRoot,
            localMarketplaceRoot: options.localMarketplaceRoot,
            marketplaceName: options.marketplaceName,
            executionHostPath,
            resourcesPath,
          });
        },
        installWhenMissing = options.installWhenMissingPluginNames.has(plugin.name);
      if (installedPlugin?.installed) {
        installPhase = `read_bundled_manifest`;
        let manifest = await getBundledManifest();
        (installPhase = `read_installed_manifest`),
          (installedPluginStatus = await readInstalledPluginStatus({
            appServerConnection: options.appServerConnection,
            bundledManifest: manifest,
            bundledPlugin: plugin,
            codexHome,
            installedPlugin,
            marketplaceName: options.marketplaceName,
            marketplaceRoot: options.marketplaceRoot,
            executionHostPath,
          }));
      } else installedPluginStatus = `missing`;
      if (syncWithChromeExtension) {
        installPhase = `read_chrome_extension_config`;
        let extensions = await listPluginBrowserExtensions(
            resolveBundledPluginPath({
              bundledPlugin: plugin,
              localMarketplaceRoot: options.localMarketplaceRoot,
            }),
          ),
          isExtensionInstalled: boolean | null = null;
        try {
          isExtensionInstalled = anyExtensionInstalled(extensions, options.isChromeExtensionInstalled);
        } catch (error) {
          (hadUnknownChromeExtensionSyncState = !0),
            logger.warning(`bundled_plugin_chrome_extension_sync_state_read_failed`, {
              safe: { pluginName: plugin.name },
              sensitive: { error },
            });
        }
        let isPluginInstalled = installedPlugin?.installed === !0,
          isSyncManaged = installedPlugin != null && managedPluginIds.has(installedPlugin.id),
          syncAction = `skip_unknown`;
        if (
          (isExtensionInstalled === !0
            ? (syncAction = isPluginInstalled ? `keep_installed` : `install_missing`)
            : isExtensionInstalled === !1 &&
              (syncAction = isPluginInstalled
                ? isSyncManaged
                  ? `uninstall_managed`
                  : `keep_user_managed`
                : `keep_missing`),
          logger.info(`bundled_plugin_chrome_extension_sync_decision`, {
            safe: {
              chromeExtensionSyncAction: syncAction,
              browserExtensions: extensions,
              installedPluginId: installedPlugin?.id ?? null,
              installedPluginStatus,
              isExtensionInstalled,
              isPluginInstalled,
              isPluginSyncManaged: isSyncManaged,
              pluginName: plugin.name,
            },
            sensitive: {},
          }),
          (installWhenMissing = isExtensionInstalled ?? !1),
          (shouldWriteSyncMarker = isExtensionInstalled === !0 && (!isPluginInstalled || isSyncManaged)),
          isExtensionInstalled === !1 && isPluginInstalled && isSyncManaged)
        ) {
          logger.info(`bundled_plugin_uninstall_requested`, {
              safe: {
                pluginId: installedPlugin.id,
                pluginName: installedPlugin.name,
                reason: `chrome_extension_uninstalled`,
              },
              sensitive: {},
            }),
            (installPhase = `sync_chrome_extension_state`),
            await options.appServerConnection.uninstallPlugin(
              { pluginId: installedPlugin.id },
              ...(options.beforeSendRequest ? [options.beforeSendRequest] : []),
            ),
            installedPluginNames.delete(plugin.name),
            isChromePlugin &&
              ((installPhase = `reconcile_chrome_native_host`),
              await uninstallChromePluginRuntime({
                codexHome,
                marketplaceName: options.marketplaceName,
                pluginName: plugin.name,
              })),
            (installPhase = `write_chrome_extension_sync_marker`),
            await writeChromeExtensionSyncManagedMarker({
              chromeExtensionSyncManagedPluginStore: options.chromeExtensionSyncManagedPluginStore,
              managed: !1,
              pluginId: installedPlugin.id,
            });
          continue;
        }
        isExtensionInstalled === !1 &&
          isPluginInstalled &&
          logger.info(`bundled_plugin_uninstall_skipped_user_managed`, {
            safe: {
              pluginId: installedPlugin.id,
              pluginName: installedPlugin.name,
              reason: `chrome_extension_uninstalled`,
            },
            sensitive: {},
          });
      }
      if (
        ((installReason = computePluginInstallReason({
          forceInstall,
          installWhenMissing,
          installedPluginStatus,
        })),
        installReason == null)
      ) {
        logger.info(
            installedPluginStatus === `missing`
              ? `bundled_plugin_install_skipped_missing`
              : `bundled_plugin_install_skipped_current`,
            { safe: { pluginName: plugin.name }, sensitive: {} },
          ),
          installedPluginStatus === `missing` &&
            isChromePlugin &&
            ((installPhase = `reconcile_chrome_native_host`),
            await uninstallChromePluginRuntime({
              codexHome,
              marketplaceName: options.marketplaceName,
              pluginName: plugin.name,
            })),
          installedPluginStatus === `current` &&
            isChromePlugin &&
            (await reconcileChromeNativeHost(),
            await pointLatestCacheAtVersionRoot({
              codexHome,
              getBundledManifest,
              marketplaceName: options.marketplaceName,
              executionHostPath,
              pluginName: plugin.name,
            }));
        continue;
      }
      if (
        ((installedPluginCacheRoot = getPluginCacheRoot({
          bundledPluginName: plugin.name,
          codexHome,
          marketplaceName: options.marketplaceName,
          executionHostPath,
        })),
        isChromePlugin)
      ) {
        installPhase = `stop_chrome_native_host`;
        try {
          await stopChromeNativeHostsUnderRoot({ root: installedPluginCacheRoot });
        } catch (error) {
          logger.warning(`bundled_plugin_chrome_native_host_stop_failed`, {
            safe: { pluginName: plugin.name },
            sensitive: { error },
          });
        }
      }
      logger.info(`bundled_plugin_install_requested`, {
          safe: { ...redactBundledPluginSourcePath(plugin.source.path), pluginName: plugin.name, reason: installReason },
          sensitive: {
            bundledPluginSourcePath: plugin.source.path,
            installedPluginCacheRoot,
            marketplacePath,
          },
        }),
        (installPhase = `install_plugin`),
        await options.appServerConnection.installPlugin(
          { marketplacePath, pluginName: plugin.name },
          ...(options.beforeSendRequest ? [options.beforeSendRequest] : []),
        ),
        installedPluginNames.add(plugin.name),
        isChromePlugin && (await reconcileChromeNativeHost()),
        (installPhase = `read_bundled_manifest`),
        await getBundledManifest(),
        isChromePlugin &&
          ((installPhase = `reconcile_chrome_native_host`),
          await pointLatestCacheAtVersionRoot({
            codexHome,
            getBundledManifest,
            marketplaceName: options.marketplaceName,
            executionHostPath,
            pluginName: plugin.name,
          })),
        shouldWriteSyncMarker &&
          ((installPhase = `write_chrome_extension_sync_marker`),
          await writeChromeExtensionSyncManagedMarker({
            chromeExtensionSyncManagedPluginStore: options.chromeExtensionSyncManagedPluginStore,
            managed: !0,
            pluginId: `${plugin.name}@${options.marketplaceName}`,
          })),
        installedPluginStatus !== `missing` &&
          installedPlugin?.enabled === !1 &&
          (logger.info(`bundled_plugin_enabled_config_write_requested`, {
            safe: {
              enabled: !1,
              pluginId: `${plugin.name}@${options.marketplaceName}`,
              pluginName: plugin.name,
            },
            sensitive: {},
          }),
          (installPhase = `restore_disabled_config`),
          await writePluginEnabledConfig({
            appServerConnection: options.appServerConnection,
            beforeSendRequest: options.beforeSendRequest,
            enabled: !1,
            pluginId: `${plugin.name}@${options.marketplaceName}`,
          }));
    } catch (error) {
      let safeDetails: any = {
        ...redactBundledPluginSourcePath(plugin.source.path),
        installPhase,
        pluginCount,
        pluginIndex,
        pluginName: plugin.name,
      };
      installReason != null && (safeDetails.installReason = installReason),
        installedPluginStatus != null && (safeDetails.installedPluginStatus = installedPluginStatus);
      let failure = {
        error,
        safe: safeDetails,
        sensitive: {
          bundledPluginSourcePath: plugin.source.path,
          installedPluginCacheRoot,
          marketplacePath,
        },
      };
      logger.warning(`bundled_plugins_marketplace_install_failed`, {
          safe: {
            errorCategory: classifyInstallError({
              error,
              platformFamily: options.platformFamily,
            }),
            marketplaceName: options.marketplaceName,
            platformFamily: options.platformFamily,
            ...safeDetails,
          },
          sensitive: { error, marketplaceRoot: options.marketplaceRoot, ...failure.sensitive },
        }),
        (firstFailure ??= failure);
    }
  }
  return {
    firstFailure,
    hadUnknownChromeExtensionSyncState,
    installedChromePluginNames: [...installedPluginNames].filter(
      (name) => getChromeNativeHostName(name) != null,
    ),
    installedPluginCountAfterWrite: installedPluginNames.size,
  };
}

// ===========================================================================
// 11,323-11,377：bundled 插件描述符清单（al）
// ===========================================================================

/** bundled 插件描述符（`n.Ll.*` 基描述 + 桌面侧附加字段）。 */
export interface BundledPluginDescriptor {
  name: string;
  autoInstallOptOutKey?: unknown;
  installWhenMissing?: boolean;
  installWhenMissingRequiresOptIn?: boolean;
  isAvailable(context: {
    buildFlavor: string;
    env: Record<string, string | undefined>;
    features: any;
    platform: NodeJS.Platform;
  }): boolean;
  migrate?(options: {
    appServerConnection: any;
    codexHome: string;
    marketplaceName?: string;
    trashItem(path: string): Promise<unknown>;
  }): Promise<void>;
  syncInstallStateWithChromeExtension?: boolean;
  syncToRemoteSshHosts?: boolean;
  [key: string]: unknown;
}

/** bundled 插件描述符清单（原 `al`，11,323-11,377）。 */
export const BUNDLED_PLUGIN_DESCRIPTORS: BundledPluginDescriptor[] = [
  { ...(BUNDLED_PLUGIN_DESCRIPTORS_BASE as any).codexAppTools, isAvailable: () => !0 },
  {
    ...(BUNDLED_PLUGIN_DESCRIPTORS_BASE as any).browser,
    autoInstallOptOutKey: buildAutoInstallOptOutKey((BUNDLED_PLUGIN_DESCRIPTORS_BASE as any).browser.name),
    isAvailable: ({ features }) => features.inAppBrowserUseAllowed || features.externalBrowserUseAllowed,
    migrate: migrateLocalBrowserUseToBundled,
  },
  {
    ...(BUNDLED_PLUGIN_DESCRIPTORS_BASE as any).unifiedComputerUse,
    isAvailable: ({ features }) =>
      features.browserUseTinysky && (features.inAppBrowserUse || features.externalBrowserUse || features.computerUse),
  },
  {
    ...(BUNDLED_PLUGIN_DESCRIPTORS_BASE as any).chromeDev,
    syncInstallStateWithChromeExtension: !0,
    isAvailable: ({ buildFlavor, env, features }) =>
      shouldUseDevChromePlugin(buildFlavor, env) && features.externalBrowserUseAllowed,
  },
  {
    ...(BUNDLED_PLUGIN_DESCRIPTORS_BASE as any).chromeInternal,
    syncInstallStateWithChromeExtension: !0,
    isAvailable: ({ buildFlavor, env, features }) =>
      shouldUseInternalChromePlugin(buildFlavor, env) && features.externalBrowserUseAllowed,
  },
  {
    ...(BUNDLED_PLUGIN_DESCRIPTORS_BASE as any).chrome,
    syncInstallStateWithChromeExtension: !0,
    isAvailable: ({ buildFlavor, features }) => features.externalBrowserUseAllowed && isProductionChannelFlavor(buildFlavor),
  },
  {
    ...(BUNDLED_PLUGIN_DESCRIPTORS_BASE as any).computerUse,
    autoInstallOptOutKey: buildAutoInstallOptOutKey((BUNDLED_PLUGIN_DESCRIPTORS_BASE as any).computerUse.name),
    isAvailable: ({ features, platform }) =>
      (platform === `darwin` || platform === `win32`) && features.computerUse,
  },
  {
    ...(BUNDLED_PLUGIN_DESCRIPTORS_BASE as any).messages,
    isAvailable: ({ features, platform }) => platform === `darwin` && features.messages,
  },
  {
    ...(BUNDLED_PLUGIN_DESCRIPTORS_BASE as any).recordAndReplay,
    isAvailable: ({ features, platform }) => platform === `darwin` && features.recordAndReplay,
  },
  {
    ...(BUNDLED_PLUGIN_DESCRIPTORS_BASE as any).computerHistory,
    isAvailable: ({ features, platform }) => platform === `darwin` && features.skysight,
  },
  { ...(BUNDLED_PLUGIN_DESCRIPTORS_BASE as any).latex, isAvailable: () => !0 },
  {
    ...(BUNDLED_PLUGIN_DESCRIPTORS_BASE as any).notebook,
    isAvailable: ({ buildFlavor }) => BuildFlavor.isInternal(buildFlavor),
  },
  {
    ...(BUNDLED_PLUGIN_DESCRIPTORS_BASE as any).pullRequests,
    isAvailable: ({ buildFlavor, features }) => BuildFlavor.isInternal(buildFlavor) && features.codeReviewPlugin,
  },
  { ...(BUNDLED_PLUGIN_DESCRIPTORS_BASE as any).deepResearch, isAvailable: ({ features }) => features.deepResearch },
  { ...(BUNDLED_PLUGIN_DESCRIPTORS_BASE as any).userWriting, isAvailable: ({ features }) => features.userWriting },
  {
    ...(BUNDLED_PLUGIN_DESCRIPTORS_BASE as any).visualize,
    syncToRemoteSshHosts: !0,
    isAvailable: () => !0,
  },
];
