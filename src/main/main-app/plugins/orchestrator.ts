// bundled 插件编排器 —— 原 main-C-Mhak1n.ts 11,378-11,960 行
// （`eoe`→安装期望描述、`toe`→sites 插件退役、`ol/noe/sl/cl/roe`、
//   `ioe`→大工厂、`ll/ul`）+ 12,047-12,113 行（`ooe/soe/coe/loe/fl/uoe/pl/ml/hl`
//   →旧 chronicle skill 归档）。
//
// 职责（深析 §3.3）：
//   - `createBundledPluginsOrchestrator`（ioe）：按 build flavor / 特性开关 /
//     chrome 扩展安装状态编排 bundled 插件的安装与卸载；reconcile 链按
//     connection 串行（Zo 注册 pending），远端 SSH 宿主同步（sre）单独
//     排队；skills 可能变化时通知上层（onSkillsMayHaveChanged）。
//   - dev flavor（未设 CODEX_ENABLE_DEV_BUNDLED_PLUGINS=1）走精简路径：
//     仅维持 browser 插件可用 + thread config 同步。
//   - chronicle 归档：skysight 门控启用时把旧 `skills/chronicle` 与安装
//     标记移入 `skysight/migration/legacy-chronicle-skill/<ts>-<uuid>/`，
//     附内容哈希与 metadata.json。
//
// 可变状态：除闭包内状态外，本模块无模块级可变状态；logger 为 memoized
// tag logger（ol）。

import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

import {
  Al as CHROME_INTERNAL_PLUGIN_NAME,
  Fl as COMPUTER_USE_PLUGIN_NAME,
  jl as CHROME_DEV_PLUGIN_NAME,
  kl as BROWSER_PLUGIN_NAME,
  Ml as CHROME_PLUGIN_NAME,
  Nl as CODEX_APP_TOOLS_PLUGIN_NAME,
  Pl as COMPUTER_HISTORY_PLUGIN_NAME,
  Ul as marketplaceNameForFlavor,
  zl as USER_WRITING_PLUGIN_NAME,
} from "@chunk/shared";
import {
  in as BuildFlavor,
  R as CHROME_EXTENSION_SYNC_MANAGED_PLUGIN_IDS_KEY,
} from "@chunk/bootstrap";
import { memoizedTaggedLogger } from "@chunk/logger";
import {
  BUNDLED_PLUGIN_DESCRIPTORS,
  LOCAL_MARKETPLACE_LIST_FILTER,
  findBundledPlugin,
  readChromeExtensionSyncState,
  reconcileBundledPluginsMarketplace,
  serializeChromeExtensionSyncState,
  syncMarketplaceToRemoteHost,
} from "./marketplace";
import { removeStaleBundledMarketplaces } from "./chrome-native-host-sync";
import {
  getBundledPluginsResourcesPath,
  getForcedReloadPluginNames,
  getRuntimeMarketplaceRoot,
} from "./browser-runtime-resolution";
import {
  registerPendingReconcile,
  syncBrowserUseThreadConfig,
} from "../browser-use/thread-config";
// 并行/未完成模块（按深析压缩名导入；tsc 缺导出先忽略，见重写报告）：
import {
  DEFAULT_DESKTOP_FEATURE_AVAILABILITY,
  isValidDesktopFeatureAvailability as isDesktopFeatureAvailability,
} from "../misc/availability";
// Zie（8,483 行，codex-app-tools .mcp.json 同步）位于尚未落地的
// computer-use/codex-app-tools-config 模块；缺导出待该模块完成后对齐。
import { syncCodexAppToolsMcpConfig } from "../computer-use/codex-app-tools-config";

const logger = memoizedTaggedLogger(`bundled-plugins`);

/** 环境变量：dev flavor 下显式启用完整 bundled 插件编排（原 `noe`）。 */
const CODEX_ENABLE_DEV_BUNDLED_PLUGINS = `CODEX_ENABLE_DEV_BUNDLED_PLUGINS`;
/** chrome 系插件名集合（原 `sl`）。 */
const CHROME_PLUGIN_SURFACE_NAMES = new Set([
  BROWSER_PLUGIN_NAME,
  CHROME_INTERNAL_PLUGIN_NAME,
  CHROME_DEV_PLUGIN_NAME,
  CHROME_PLUGIN_NAME,
]);
/** 安装状态观察覆盖的插件名集合（原 `cl`）。 */
const OBSERVED_PLUGIN_NAMES = new Set([
  ...CHROME_PLUGIN_SURFACE_NAMES,
  COMPUTER_HISTORY_PLUGIN_NAME,
  COMPUTER_USE_PLUGIN_NAME,
  USER_WRITING_PLUGIN_NAME,
]);
/** 需要同步到远端 SSH 宿主的插件名（原 `roe`）。 */
const REMOTE_SYNC_PLUGIN_NAMES = BUNDLED_PLUGIN_DESCRIPTORS.filter(
  (descriptor) => descriptor.syncToRemoteSshHosts === !0,
).map((descriptor) => descriptor.name);

// ===========================================================================
// 11,378-11,411：安装期望描述与 sites 退役
// ===========================================================================

/** 生成插件安装期望描述（原 `eoe`）。 */
function describePluginInstallExpectation(input: {
  autoInstallWhenMissing: boolean;
  availableInMarketplace: boolean;
  chromeExtensionInstalled: boolean | null;
  chromeExtensionSyncManaged: boolean;
  eligibilityReason: unknown;
  installedAfter: boolean;
  installedBefore: boolean;
  pluginName: string;
  reconcileReason: string;
}) {
  let expectationReason: string;
  expectationReason = input.availableInMarketplace
    ? input.chromeExtensionInstalled === !1 && input.chromeExtensionSyncManaged
      ? `chrome_extension_removed`
      : input.installedBefore
        ? `installed_before`
        : input.chromeExtensionInstalled === !0
          ? `chrome_extension_installed`
          : input.autoInstallWhenMissing
            ? `auto_install`
            : `not_installed`
    : `not_installed`;
  return {
    eligibilityReason: input.eligibilityReason,
    expectationReason,
    expectedInstalled:
      expectationReason === `installed_before` ||
      expectationReason === `chrome_extension_installed` ||
      expectationReason === `auto_install`,
    installedAfter: input.installedAfter,
    installedBefore: input.installedBefore,
    pluginName: input.pluginName,
    reconcileReason: input.reconcileReason,
  };
}

/** 退役旧的 sites@openai-bundled 插件（原 `toe`）。 */
async function retireSitesPlugin(connection: {
  getUserSavedConfiguration(): Promise<{ plugins: unknown }>;
  uninstallPlugin(input: { pluginId: string }): Promise<unknown>;
}) {
  let { plugins } = await connection.getUserSavedConfiguration();
  typeof plugins == `object` &&
    plugins &&
    !Array.isArray(plugins) &&
    Object.hasOwn(plugins as object, `sites@openai-bundled`) &&
    (await connection.uninstallPlugin({ pluginId: `sites@openai-bundled` }));
}

// ===========================================================================
// 11,412-11,947：编排器工厂（ioe）
// ===========================================================================

/** 编排器选项（ioe 入参）。 */
export interface BundledPluginsOrchestratorOptions {
  appVersion: string;
  buildFlavor: string;
  codexHome: string;
  env?: Record<string, string | undefined>;
  getConnectedRemoteSshAppServerConnections?(): any[];
  getLocalAppServerConnection(): any;
  globalState: {
    get<T = unknown>(key: string): T | undefined;
    set(key: string, value: unknown): unknown;
  };
  isPackaged?: boolean;
  onChromePluginInstallStateChanged?(pluginName: string, installed: boolean): void;
  onInstallStateObserved?(observation: ReturnType<typeof describePluginInstallExpectation>): void;
  onReconcileComplete?(): void;
  onSkillsMayHaveChanged?(): void;
  platform?: NodeJS.Platform;
  repoRoot?: string;
  resourcesPath?: string;
  runtimeMarketplaceRoot?: string;
  trashItem(path: string): Promise<unknown>;
}

/** 编排器返回面。 */
export interface BundledPluginsOrchestrator {
  reconcileComputerHistoryPluginInstallation(installed: boolean): Promise<void>;
  reconcileExternalPluginState(reason?: string): Promise<void>;
  reconcileRemoteSshHost(connection: any): Promise<void>;
  reloadBundledPlugins(): Promise<void>;
  setDesktopFeatureAvailability(availability: any, eligibilityReasons?: any): Promise<void>;
  waitForPendingReconcile(): Promise<void>;
}

/**
 * bundled 插件编排器工厂（原 `ioe`，11,417-11,947）。
 * 启动装配区（原 176,453 行）消费。
 */
export function createBundledPluginsOrchestrator(
  options: BundledPluginsOrchestratorOptions,
): BundledPluginsOrchestrator {
  let env = options.env ?? process.env,
    resourcesPath = options.resourcesPath ?? getBundledPluginsResourcesPath({ env }),
    marketplaceName = marketplaceNameForFlavor(options.buildFlavor),
    runtimeMarketplaceRoot =
      options.runtimeMarketplaceRoot ??
      getRuntimeMarketplaceRoot({ codexHome: options.codexHome, marketplaceName }),
    devRuntimeRepoRoot = env.NODE_ENV === `development` ? options.repoRoot : void 0,
    forceReloadPluginNames = getForcedReloadPluginNames({ env }),
    chromeExtensionSyncManagedPluginStore = {
      getManagedPluginIds: () =>
        new Set(
          (options.globalState.get(`electron-chrome-extension-sync-managed-plugin-ids`) as
            | string[]
            | undefined) ?? [],
        ),
      setManagedPluginId: (pluginId: string, managed: boolean) => {
        let managedIds = new Set(
          (options.globalState.get(`electron-chrome-extension-sync-managed-plugin-ids`) as
            | string[]
            | undefined) ?? [],
        );
        (managed ? managedIds.add(pluginId) : managedIds.delete(pluginId),
          options.globalState.set(
            CHROME_EXTENSION_SYNC_MANAGED_PLUGIN_IDS_KEY,
            managedIds.size === 0 ? void 0 : [...managedIds].sort(),
          ));
      },
    },
    platform = options.platform ?? process.platform,
    availability: any = null,
    syncThreadConfig = async () => {
      await syncCodexAppToolsMcpConfig({
          appServerConnection: options.getLocalAppServerConnection(),
          resourcesPath: options.resourcesPath,
        }),
        await syncBrowserUseThreadConfig({
          appServerConnection: options.getLocalAppServerConnection(),
          appVersion: options.appVersion,
          getDesktopFeatureAvailability: () => availability ?? DEFAULT_DESKTOP_FEATURE_AVAILABILITY,
          isPackaged: options.isPackaged,
          platform,
          repoRoot: options.repoRoot,
          resourcesPath,
        });
    };
  if (options.buildFlavor === BuildFlavor.Dev && env[CODEX_ENABLE_DEV_BUNDLED_PLUGINS]?.trim() !== `1`) {
    let reconcileChain: Promise<void> = Promise.resolve(),
      lastAvailabilityKey: string | null = null;
    return {
      reconcileComputerHistoryPluginInstallation: async () => {},
      reconcileExternalPluginState: async () => {},
      reconcileRemoteSshHost: async () => {},
      reloadBundledPlugins: async () => {},
      setDesktopFeatureAvailability: (partial) => {
        if (availability == null) {
          if (!isDesktopFeatureAvailability(partial)) return reconcileChain;
          availability = partial;
        } else availability = { ...availability, ...partial };
        let current = availability,
          availabilityKey = JSON.stringify({
            browserUseTinysky: current.browserUseTinysky,
            computerUse: current.computerUse,
            externalBrowserUse: current.externalBrowserUse,
            inAppBrowserUse: current.inAppBrowserUse,
          });
        if (lastAvailabilityKey === availabilityKey) return reconcileChain;
        lastAvailabilityKey = availabilityKey;
        let next = reconcileChain
          .catch(() => {})
          .then(async () => {
            try {
              await reconcileBundledPluginsMarketplace({
                  appServerConnection: options.getLocalAppServerConnection(),
                  marketplacePluginNames: BUNDLED_PLUGIN_DESCRIPTORS.map(
                    (descriptor) => descriptor.name,
                  ),
                  reconcilePluginNames: [CODEX_APP_TOOLS_PLUGIN_NAME],
                  uninstallDisabledPlugins: !1,
                  installWhenMissingPluginNames: [CODEX_APP_TOOLS_PLUGIN_NAME],
                  marketplaceName,
                  resourcesPath,
                  runtimeMarketplaceRoot,
                }),
                await syncThreadConfig();
            } catch (error) {
              throw (lastAvailabilityKey === availabilityKey && (lastAvailabilityKey = null), error);
            }
          });
        return (
          registerPendingReconcile(options.getLocalAppServerConnection(), next),
          (reconcileChain = next.catch(() => {})),
          reconcileChain
        );
      },
      waitForPendingReconcile: () => reconcileChain,
    };
  }
  let eligibilityReasons: any = {
      browser: `unknown`,
      chrome: `unknown`,
      computerUse: `unknown`,
      skysight: `unknown`,
      userWriting: `unknown`,
    },
    retireSitesForConnection = async (connection: any) => {
      if (options.isPackaged === !0 && options.buildFlavor !== BuildFlavor.Dev)
        try {
          await retireSitesPlugin(connection);
        } catch (error) {
          logger().warning(`bundled_sites_retirement_failed`, { safe: {}, sensitive: { error } });
        }
    },
    reconcileStateKey: string | null = null,
    chromeExtensionSyncStateKey: string | null = null,
    externalSyncStateKey: string | null = null,
    reconcileChain: Promise<void> = Promise.resolve(),
    remoteSyncChain: Promise<void> = Promise.resolve(),
    reconcileInProgress = !1,
    skillsStateKey = ``,
    skillsChangedSinceLastReconcile = !1,
    liveVisualizationVariantMemo: string | null | undefined,
    autoInstallPrefsInitialized = new Set<unknown>(),
    availablePluginsFor = (features: any) =>
      BUNDLED_PLUGIN_DESCRIPTORS.filter((descriptor) =>
        descriptor.isAvailable({
          buildFlavor: options.buildFlavor,
          env,
          features,
          platform,
        }),
      ),
    syncRemoteHosts = (
      descriptors: typeof BUNDLED_PLUGIN_DESCRIPTORS,
      connections = options.getConnectedRemoteSshAppServerConnections?.() ?? [],
    ) => {
      let pluginNames = descriptors
        .filter((descriptor) => descriptor.syncToRemoteSshHosts === !0)
        .map((descriptor) => descriptor.name);
      return (
        connections.length === 0 ||
          (remoteSyncChain = remoteSyncChain
            .then(async () => {
              try {
                let results = await Promise.allSettled(
                    connections.map(async (connection) => {
                      let synced = await syncMarketplaceToRemoteHost({
                        appServerConnection: connection,
                        localMarketplaceRoot: runtimeMarketplaceRoot,
                        managedPluginNames: REMOTE_SYNC_PLUGIN_NAMES,
                        marketplaceName,
                        marketplacePluginNames: pluginNames,
                      });
                      return (synced && (await retireSitesForConnection(connection)), synced);
                    }),
                  ),
                  firstRejected = results.find((result) => result.status === `rejected`);
                ((firstRejected != null ||
                  results.some((result) => result.status === `fulfilled` && !result.value)) &&
                  logger().warning(`bundled_plugins_remote_ssh_reconcile_failed`, {
                    safe: { hostCount: connections.length },
                    sensitive: { error: (firstRejected as PromiseRejectedResult | undefined)?.reason },
                  }),
                  results.some((result) => result.status === `fulfilled` && result.value) &&
                    options.onSkillsMayHaveChanged?.());
              } catch (error) {
                logger().warning(`bundled_plugins_remote_ssh_reconcile_failed`, {
                  safe: { hostCount: connections.length },
                  sensitive: { error },
                });
              }
              options.onReconcileComplete?.();
            })
            .catch(() => {})),
        remoteSyncChain
      );
    },
    notifyChromePluginInstallState = (installedPluginNames: string[] | null) => {
      if (installedPluginNames == null || options.onChromePluginInstallStateChanged == null) return;
      let installed = new Set(installedPluginNames);
      for (let pluginName of [
        CHROME_INTERNAL_PLUGIN_NAME,
        CHROME_DEV_PLUGIN_NAME,
        CHROME_PLUGIN_NAME,
      ])
        options.onChromePluginInstallStateChanged(pluginName, installed.has(pluginName));
    },
    observeInstallState = async (input: {
      eligibilityReasons: any;
      installWhenMissingPluginNames: string[];
      marketplacePluginDescriptors: typeof BUNDLED_PLUGIN_DESCRIPTORS;
      marketplacePluginNames: string[];
      reason: string;
    }) => {
      if (options.onInstallStateObserved == null) return async () => {};
      let connection = options.getLocalAppServerConnection(),
        before: Map<string, any>,
        beforeChromeExtensionState: Awaited<ReturnType<typeof readChromeExtensionSyncState>>;
      try {
        [before, beforeChromeExtensionState] = await Promise.all([
          listObservedPluginStates({ appServerConnection: connection, marketplaceName }),
          readChromeExtensionSyncState({
            marketplacePluginNames: chromeSyncPluginNames(input.marketplacePluginDescriptors),
            marketplaceName,
            resourcesPath,
          }),
        ]);
      } catch (error) {
        return (
          logger().warning(`bundled_plugin_install_state_observation_failed`, {
            safe: { phase: `before`, reason: input.reason },
            sensitive: { error },
          }),
          async () => {}
        );
      }
      let managedPluginIds = chromeExtensionSyncManagedPluginStore.getManagedPluginIds();
      return async () => {
        try {
          let after = await listObservedPluginStates({
              appServerConnection: connection,
              marketplaceName,
            }),
            observedNames = input.marketplacePluginDescriptors
              .map((descriptor) => descriptor.name)
              .filter((name) => OBSERVED_PLUGIN_NAMES.has(name)),
            allObserved = new Set([
              ...observedNames,
              ...[...before].filter(([, plugin]) => plugin.installed).map(([name]) => name),
            ]),
            chromeExtensionInstalledByPlugin = new Map(
              beforeChromeExtensionState?.map((state) => [state.pluginName, state.isExtensionInstalled]),
            );
          for (let pluginName of allObserved) {
            let beforePlugin = before.get(pluginName),
              eligibilityReason = input.eligibilityReasons.chrome;
            switch (pluginName) {
              case BROWSER_PLUGIN_NAME:
                eligibilityReason = input.eligibilityReasons.browser;
                break;
              case COMPUTER_USE_PLUGIN_NAME:
                eligibilityReason = input.eligibilityReasons.computerUse;
                break;
              case COMPUTER_HISTORY_PLUGIN_NAME:
                eligibilityReason = input.eligibilityReasons.skysight;
                break;
              case USER_WRITING_PLUGIN_NAME:
                eligibilityReason = input.eligibilityReasons.userWriting;
                break;
            }
            options.onInstallStateObserved?.(
              describePluginInstallExpectation({
                autoInstallWhenMissing: input.installWhenMissingPluginNames.includes(pluginName),
                availableInMarketplace: input.marketplacePluginNames.includes(pluginName),
                chromeExtensionInstalled: chromeExtensionInstalledByPlugin.get(pluginName) ?? null,
                chromeExtensionSyncManaged:
                  beforePlugin != null && managedPluginIds.has(beforePlugin.id),
                eligibilityReason,
                installedAfter: after.get(pluginName)?.installed === !0,
                installedBefore: beforePlugin?.installed === !0,
                pluginName,
                reconcileReason: input.reason,
              }),
            );
          }
        } catch (error) {
          logger().warning(`bundled_plugin_install_state_observation_failed`, {
            safe: { phase: `after`, reason: input.reason },
            sensitive: { error },
          });
        }
      };
    },
    reconcileCore = async (input: {
      desktopFeatureAvailability: any;
      eligibilityReasons: any;
      forceInstall: boolean;
      marketplacePluginDescriptors: typeof BUNDLED_PLUGIN_DESCRIPTORS;
      marketplacePluginNames: string[];
      reason: string;
    }) => {
      let connection = options.getLocalAppServerConnection();
      await initializeAutoInstallPreferences(connection, input.marketplacePluginDescriptors);
      let forceInstallPluginNames = input.marketplacePluginDescriptors
          .filter(
            (descriptor) => input.forceInstall || forceReloadPluginNames.has(descriptor.name),
          )
          .map((descriptor) => descriptor.name),
        installWhenMissingPluginNames = input.marketplacePluginDescriptors
          .filter((descriptor) => descriptor.installWhenMissing === !0)
          .filter((descriptor) => {
            if (descriptor.autoInstallOptOutKey == null) return !0;
            let preference = options.globalState.get(descriptor.autoInstallOptOutKey as string);
            return descriptor.installWhenMissingRequiresOptIn === !0 &&
              !(
                descriptor.name === `computer-use` &&
                input.desktopFeatureAvailability.computerUseAutoInstall
              )
              ? preference === !1
              : preference !== !0;
          })
          .map((descriptor) => descriptor.name),
        chromeSyncNames = input.marketplacePluginDescriptors
          .filter((descriptor) => descriptor.syncInstallStateWithChromeExtension === !0)
          .map((descriptor) => descriptor.name),
        nextSkillsStateKey = input.marketplacePluginNames
          .filter((name) => CHROME_PLUGIN_SURFACE_NAMES.has(name) || name === `computer-use`)
          .join(`,`),
        liveVisualizationVariant = resolveLiveVisualizationSkillVariant({
          desktopFeatureAvailability: input.desktopFeatureAvailability,
          marketplacePluginNames: input.marketplacePluginNames,
        });
      switch (options.buildFlavor) {
        case BuildFlavor.Agent:
        case BuildFlavor.Dev:
        case BuildFlavor.InternalAlpha:
        case BuildFlavor.Nightly:
        case BuildFlavor.PublicBeta:
          await removeStaleBundledMarketplaces({
            appServerConnection: connection,
            marketplaceName,
          });
          break;
        case BuildFlavor.Prod:
      }
      let finishObservation = await observeInstallState({
          eligibilityReasons: input.eligibilityReasons,
          installWhenMissingPluginNames,
          marketplacePluginDescriptors: input.marketplacePluginDescriptors,
          marketplacePluginNames: input.marketplacePluginNames,
          reason: input.reason,
        }),
        reconcileResult: Awaited<ReturnType<typeof reconcileBundledPluginsMarketplace>>;
      try {
        reconcileResult = await reconcileBundledPluginsMarketplace({
            appServerConnection: connection,
            liveVisualizationSkillVariant: liveVisualizationVariant,
            visualizeTreatment: !1,
            chromeExtensionSyncManagedPluginStore,
            devRuntimeRepoRoot,
            marketplacePluginNames: input.marketplacePluginNames,
            forceInstallPluginNames,
            installWhenMissingPluginNames,
            syncInstallStateWithChromeExtensionPluginNames: chromeSyncNames,
            marketplaceName,
            packagedAppVersion: options.isPackaged === !0 ? options.appVersion : void 0,
            resourcesPath,
            runtimeMarketplaceRoot,
          }),
          notifyChromePluginInstallState(reconcileResult.installedChromePluginNames),
          await Promise.all(
            input.marketplacePluginDescriptors.map(async (descriptor) => {
              descriptor.migrate != null &&
                (await descriptor.migrate({
                  appServerConnection: connection,
                  codexHome: options.codexHome,
                  marketplaceName,
                  trashItem: options.trashItem,
                }));
            }),
          );
      } finally {
        await finishObservation();
      }
      await syncThreadConfig(),
        reconcileResult.hadReconcileFailure || (await retireSitesForConnection(connection)),
        !reconcileResult.hadReconcileFailure &&
          !reconcileResult.hadUnknownChromeExtensionSyncState &&
          (chromeExtensionSyncStateKey = await computeExternalSyncState(
            input.marketplacePluginDescriptors,
          )),
        (skillsStateKey !== nextSkillsStateKey ||
          liveVisualizationVariant !== liveVisualizationVariantMemo ||
          skillsChangedSinceLastReconcile !== !1) &&
          options.onSkillsMayHaveChanged?.(),
        (skillsStateKey = nextSkillsStateKey),
        (liveVisualizationVariantMemo = liveVisualizationVariant),
        (skillsChangedSinceLastReconcile = !1),
        syncRemoteHosts(input.marketplacePluginDescriptors),
        options.onReconcileComplete?.();
    };
  let chromeSyncPluginNames = (descriptors: typeof BUNDLED_PLUGIN_DESCRIPTORS) =>
      descriptors
        .filter((descriptor) => descriptor.syncInstallStateWithChromeExtension === !0)
        .map((descriptor) => descriptor.name),
    computeExternalSyncState = async (descriptors: typeof BUNDLED_PLUGIN_DESCRIPTORS) =>
      serializeChromeExtensionSyncState({
        marketplacePluginNames: chromeSyncPluginNames(descriptors),
        marketplaceName,
        resourcesPath,
      }),
    reconcileExternalPluginState = async (reason = `focus`) => {
      if (availability == null)
        return (
          logger().info(`bundled_plugins_reconcile_skipped_features_unavailable`, {
            safe: { reason },
            sensitive: {},
          }),
          reconcileChain
        );
      let descriptors = availablePluginsFor(availability),
        currentEligibilityReasons = eligibilityReasons,
        pluginNames = descriptors.map((descriptor) => descriptor.name),
        liveVisualizationVariant = resolveLiveVisualizationSkillVariant({
          desktopFeatureAvailability: availability,
          marketplacePluginNames: pluginNames,
        }),
        chromeSyncNames = chromeSyncPluginNames(descriptors),
        chromeSyncDescriptors = descriptors.filter(
          (descriptor) => descriptor.syncInstallStateWithChromeExtension === !0,
        ),
        externalSyncState = await computeExternalSyncState(descriptors);
      if (
        externalSyncState == null ||
        externalSyncState === chromeExtensionSyncStateKey ||
        externalSyncState === externalSyncStateKey
      )
        return reconcileChain;
      externalSyncStateKey = externalSyncState;
      let queued = reconcileInProgress,
        next = reconcileChain
          .catch(() => {})
          .then(async () => {
            (reconcileInProgress = !0),
              logger().info(`bundled_plugins_reconcile_started`, {
                safe: { hasExternalPluginStateSync: !0, queued, reason },
                sensitive: {},
              });
            try {
              let finishObservation = await observeInstallState({
                  eligibilityReasons: currentEligibilityReasons,
                  installWhenMissingPluginNames: [],
                  marketplacePluginDescriptors: chromeSyncDescriptors,
                  marketplacePluginNames: pluginNames,
                  reason,
                }),
                reconcileResult: Awaited<ReturnType<typeof reconcileBundledPluginsMarketplace>>;
              try {
                reconcileResult = await reconcileBundledPluginsMarketplace({
                    appServerConnection: options.getLocalAppServerConnection(),
                    liveVisualizationSkillVariant: liveVisualizationVariant,
                    visualizeTreatment: !1,
                    chromeExtensionSyncManagedPluginStore,
                    devRuntimeRepoRoot,
                    marketplacePluginNames: pluginNames,
                    throwOnReconcileFailure: !0,
                    forceInstallPluginNames: [],
                    installWhenMissingPluginNames: [],
                    reconcilePluginNames: chromeSyncNames,
                    syncInstallStateWithChromeExtensionPluginNames: chromeSyncNames,
                    marketplaceName,
                    packagedAppVersion:
                      options.isPackaged === !0 ? options.appVersion : void 0,
                    resourcesPath,
                    runtimeMarketplaceRoot,
                  }),
                  notifyChromePluginInstallState(reconcileResult.installedChromePluginNames);
              } finally {
                await finishObservation();
              }
              availability != null && (await syncThreadConfig()),
                reconcileResult.hadReconcileFailure ||
                  (await retireSitesForConnection(options.getLocalAppServerConnection())),
                !reconcileResult.hadReconcileFailure &&
                  !reconcileResult.hadUnknownChromeExtensionSyncState &&
                  (chromeExtensionSyncStateKey = externalSyncState),
                options.onReconcileComplete?.(),
                logger().info(`bundled_plugins_reconcile_completed`, {
                  safe: { hasExternalPluginStateSync: !0, reason },
                  sensitive: {},
                });
            } catch (error) {
              throw (
                logger().warning(`bundled_plugins_reconcile_failed`, {
                  safe: { hasExternalPluginStateSync: !0, reason },
                  sensitive: { error },
                }),
                error
              );
            } finally {
              (externalSyncStateKey === externalSyncState && (externalSyncStateKey = null)),
                (reconcileInProgress = !1);
            }
          });
      return (
        registerPendingReconcile(options.getLocalAppServerConnection(), next),
        (reconcileChain = next.catch(() => {})),
        reconcileChain
      );
    },
    initializeAutoInstallPreferences = async (
      connection: any,
      descriptors: typeof BUNDLED_PLUGIN_DESCRIPTORS,
    ) => {
      let optInCandidates = descriptors.flatMap((descriptor) => {
        let optOutKey = descriptor.autoInstallOptOutKey;
        return descriptor.installWhenMissingRequiresOptIn === !0 &&
          optOutKey != null &&
          !autoInstallPrefsInitialized.has(optOutKey)
          ? [[descriptor.name, optOutKey] as const]
          : [];
      });
      try {
        let marketplaces = optInCandidates.some(([, optOutKey]) => options.globalState.get(optOutKey as string) == null)
          ? (await connection.listPlugins(LOCAL_MARKETPLACE_LIST_FILTER)).marketplaces
          : [];
        for (let [pluginName, optOutKey] of optInCandidates)
          (options.globalState.get(optOutKey as string) == null &&
            findBundledPlugin({
              marketplaceName,
              marketplaces,
              pluginName,
            })?.plugin.installed === !0 &&
            options.globalState.set(optOutKey as string, !1),
            autoInstallPrefsInitialized.add(optOutKey));
      } catch (error) {
        logger().warning(`bundled_plugins_auto_install_preference_initialize_failed`, {
          safe: {},
          sensitive: { error },
        });
      }
    },
    reconcileAll = ({ force, reason }: { force: boolean; reason: string }) => {
      if (availability == null)
        return (
          logger().info(`bundled_plugins_reconcile_skipped_features_unavailable`, {
            safe: { reason },
            sensitive: {},
          }),
          reconcileChain
        );
      let features = availability,
        currentEligibilityReasons = eligibilityReasons,
        descriptors = availablePluginsFor(features),
        pluginNames = descriptors.map((descriptor) => descriptor.name),
        liveVisualizationVariant = resolveLiveVisualizationSkillVariant({
          desktopFeatureAvailability: features,
          marketplacePluginNames: pluginNames,
        }),
        stateKey = JSON.stringify({
          computerUseAutoInstall: features.computerUseAutoInstall,
          liveVisualizationSkillVariant: liveVisualizationVariant,
          visualizeTreatment: !1,
          browserUseConfig: {
            browserUseTinysky: features.browserUseTinysky,
            computerUse: features.computerUse,
            externalBrowserUse: features.externalBrowserUse,
            inAppBrowserUse: features.inAppBrowserUse,
          },
          marketplacePluginNames: pluginNames,
        });
      if (!force && reconcileStateKey === stateKey) return reconcileChain;
      reconcileStateKey = stateKey;
      let hasExternalPluginStateSync = descriptors.some(
          (descriptor) => descriptor.syncInstallStateWithChromeExtension === !0,
        ),
        queued = reconcileInProgress,
        next = reconcileChain
          .catch(() => {})
          .then(async () => {
            (reconcileInProgress = !0),
              logger().info(`bundled_plugins_reconcile_started`, {
                safe: {
                  computerUseAutoInstall: features.computerUseAutoInstall,
                  hasExternalPluginStateSync,
                  queued,
                  reason,
                },
                sensitive: {},
              });
            try {
              await reconcileCore({
                  desktopFeatureAvailability: features,
                  eligibilityReasons: currentEligibilityReasons,
                  forceInstall: force,
                  marketplacePluginDescriptors: descriptors,
                  marketplacePluginNames: pluginNames,
                  reason,
                }),
                logger().info(`bundled_plugins_reconcile_completed`, {
                  safe: { hasExternalPluginStateSync, reason },
                  sensitive: {},
                });
            } catch (error) {
              throw (
                logger().warning(`bundled_plugins_reconcile_failed`, {
                  safe: { hasExternalPluginStateSync, reason },
                  sensitive: { error },
                }),
                error
              );
            } finally {
              reconcileInProgress = !1;
            }
          });
      return (
        registerPendingReconcile(options.getLocalAppServerConnection(), next),
        (reconcileChain = next.catch(() => {})),
        reconcileChain
      );
    };
  return {
    reconcileComputerHistoryPluginInstallation: (installed) => (
      (reconcileChain = reconcileChain
        .then(async () => {
          try {
            let connection = options.getLocalAppServerConnection(),
              { marketplaces } = await connection.listPlugins(LOCAL_MARKETPLACE_LIST_FILTER),
              plugin = findBundledPlugin({
                marketplaceName,
                marketplaces,
                pluginName: COMPUTER_HISTORY_PLUGIN_NAME,
              });
            if (plugin == null || plugin.plugin.installed === installed) return;
            installed
              ? await connection.installPlugin({
                  marketplacePath: plugin.marketplace.path,
                  pluginName: COMPUTER_HISTORY_PLUGIN_NAME,
                })
              : await connection.uninstallPlugin({ pluginId: plugin.plugin.id }),
              options.onInstallStateObserved?.({
                eligibilityReason: eligibilityReasons.skysight,
                expectationReason: installed
                  ? `computer_history_enabled`
                  : `computer_history_disabled`,
                expectedInstalled: installed,
                installedAfter: installed,
                installedBefore: plugin.plugin.installed,
                pluginName: COMPUTER_HISTORY_PLUGIN_NAME,
                reconcileReason: `computer-history-lifecycle`,
              }),
              options.onSkillsMayHaveChanged?.(),
              options.onReconcileComplete?.();
          } catch (error) {
            logger().warning(`computer_history_plugin_reconcile_failed`, {
              safe: { installed },
              sensitive: { error },
            });
          }
        })
        .catch(() => {})),
      reconcileChain
    ),
    reconcileExternalPluginState: (reason = `focus`) => reconcileExternalPluginState(reason),
    reloadBundledPlugins: () => reconcileAll({ force: !0, reason: `debug-reload` }),
    reconcileRemoteSshHost: (connection) =>
      reconcileChain.then(() => {
        if (availability != null)
          return syncRemoteHosts(availablePluginsFor(availability), [connection]);
      }),
    setDesktopFeatureAvailability: (partial, nextEligibilityReasons) => {
      if ((nextEligibilityReasons != null && (eligibilityReasons = nextEligibilityReasons), availability == null)) {
        if (!isDesktopFeatureAvailability(partial)) return reconcileChain;
        availability = partial;
      } else availability = { ...availability, ...partial };
      return reconcileAll({ force: !1, reason: `startup` });
    },
    waitForPendingReconcile: () => reconcileChain,
  };
}

// ===========================================================================
// 11,948-11,960：变体解析与状态读取（ll/ul）
// ===========================================================================

/** visualize 插件的 live 技能变体（原 `ll`）。 */
function resolveLiveVisualizationSkillVariant({
  desktopFeatureAvailability,
  marketplacePluginNames,
}: {
  desktopFeatureAvailability: any;
  marketplacePluginNames: string[];
}): string | null | undefined {
  if (marketplacePluginNames.includes(`visualize`))
    return desktopFeatureAvailability.visualizeLive ? `live-enabled` : `live-disabled`;
}

/** 读取观察名单内插件的已装状态（原 `ul`）。 */
async function listObservedPluginStates({
  appServerConnection,
  marketplaceName,
}: {
  appServerConnection: any;
  marketplaceName?: string;
}): Promise<Map<string, any>> {
  let { marketplaces } = await appServerConnection.listPlugins(LOCAL_MARKETPLACE_LIST_FILTER);
  return new Map(
    [...OBSERVED_PLUGIN_NAMES].flatMap((pluginName) => {
      let plugin = findBundledPlugin({
        marketplaceName,
        marketplaces,
        pluginName,
      })?.plugin;
      return plugin == null ? [] : [[pluginName, plugin] as const];
    }),
  );
}

// ===========================================================================
// 12,047-12,113：旧 chronicle skill 归档（ooe/soe/coe/loe/fl/uoe/pl/ml/hl）
// ===========================================================================

/** 旧 chronicle skill 目录段（原 `ooe`）。 */
const CHRONICLE_SKILL_SEGMENTS = [`skills`, `chronicle`];
/** chronicle 安装标记文件名（原 `soe`）。 */
const CHRONICLE_MARKER_FILE_NAME = `.codex-chronicle-assets-to-install.marker`;
/** 归档目标目录段（原 `coe`）。 */
const CHRONICLE_ARCHIVE_SEGMENTS = [`skysight`, `migration`, `legacy-chronicle-skill`];

/** 归档元数据。 */
export interface ChronicleArchiveMetadata {
  originalPath: string;
  moveTimestamp: string;
  contentHash: string | null;
  markerExisted: boolean;
  markerContents: string | null;
  migrationReason: string;
}

/**
 * 归档旧 chronicle skill 与安装标记（原 `loe`）：都不存在返回 null；否则
 * 移入 `<codexHome>/skysight/migration/legacy-chronicle-skill/<ts>-<uuid>/`
 * 并写 metadata.json（含目录内容哈希）。启动装配区（原 176,501 行）消费。
 */
export async function archiveLegacyChronicleSkill({
  codexHome,
  reason,
}: {
  codexHome: string;
  reason: string;
}): Promise<{ archivePath: string; metadata: ChronicleArchiveMetadata } | null> {
  let skillPath = path.join(codexHome, ...CHRONICLE_SKILL_SEGMENTS),
    markerPath = path.join(codexHome, CHRONICLE_MARKER_FILE_NAME),
    [skillExists, markerExists] = await Promise.all([
      pathExists(skillPath),
      pathExists(markerPath),
    ]);
  if (!skillExists && !markerExists) return null;
  let moveTimestamp = new Date().toISOString(),
    archivePath = path.join(
      codexHome,
      ...CHRONICLE_ARCHIVE_SEGMENTS,
      `${Date.now()}-${randomUUID()}`,
    ),
    markerContents = markerExists ? await fs.readFile(markerPath, `utf8`) : null,
    metadata: ChronicleArchiveMetadata = {
      originalPath: skillPath,
      moveTimestamp,
      contentHash: skillExists ? await hashTree(skillPath) : null,
      markerExisted: markerExists,
      markerContents,
      migrationReason: reason,
    };
  return (
    await fs.mkdir(archivePath, { recursive: !0 }),
    skillExists && (await movePathCrossDevice(skillPath, path.join(archivePath, `skill`))),
    markerExists && (await movePathCrossDevice(markerPath, path.join(archivePath, `marker`))),
    await fs.writeFile(
      path.join(archivePath, `metadata.json`),
      `${JSON.stringify(metadata, null, 2)}\n`,
      `utf8`,
    ),
    { archivePath, metadata }
  );
}

/** rename（EXDEV 回退 cp+rm；原 `fl`）。 */
async function movePathCrossDevice(source: string, destination: string) {
  try {
    await fs.rename(source, destination);
  } catch (error) {
    if (!isNodeErrorCode(error, `EXDEV`)) throw error;
    await fs.cp(source, destination, { recursive: !0 }),
      await fs.rm(source, { force: !0, recursive: !0 });
  }
}

/** 目录树内容哈希（路径 + 模式 + 内容；原 `uoe`）。 */
async function hashTree(root: string): Promise<string> {
  let hasher = createHash(`sha256`);
  return (await hashTreeEntry(root, ``, hasher), hasher.digest(`hex`));
}

/** 单条目哈希递归（目录/符号链接/文件分别处理；原 `pl`）。 */
async function hashTreeEntry(entryPath: string, relativePath: string, hasher: { update(data: string): void }) {
  let stat = await fs.lstat(entryPath);
  if ((hasher.update(`${relativePath}\0${stat.mode}\0`), stat.isDirectory())) {
    let children = (await fs.readdir(entryPath)).sort();
    for (let child of children)
      await hashTreeEntry(path.join(entryPath, child), path.join(relativePath, child), hasher);
    return;
  }
  if (stat.isSymbolicLink()) {
    hasher.update(await fs.readlink(entryPath));
    return;
  }
  hasher.update((await fs.readFile(entryPath)).toString());
}

/** 路径存在（lstat；ENOENT 为 false；原 `ml`）。 */
async function pathExists(target: string): Promise<boolean> {
  try {
    return (await fs.lstat(target), !0);
  } catch (error) {
    if (isNodeErrorCode(error, `ENOENT`)) return !1;
    throw error;
  }
}

/** 判定 Node 错误码（原 `hl`）。 */
function isNodeErrorCode(error: unknown, code: string): boolean {
  return typeof error == `object` && !!error && `code` in error && (error as any).code === code;
}
