import { SkysightServiceManager } from "../skysight/service-manager";
import { createChromeNativeHostCacheWatcher } from "./chrome-native-host-sync";
import {
  archiveLegacyChronicleSkill,
  createBundledPluginsOrchestrator,
  type BundledPluginsOrchestrator,
} from "./orchestrator";

interface FocusApp {
  on(event: `browser-window-focus`, listener: () => void): void;
  off(event: `browser-window-focus`, listener: () => void): void;
}

interface ConnectionRegistry {
  getAllHostIds(): string[];
  getConnection(hostId: string): any;
  subscribe(listener: (event: any) => void): { dispose(): void } | (() => void);
}

export interface PluginReconciliationStartOptions {
  appVersion: string;
  buildFlavor: string;
  codexHome: string;
  connectionRegistry: ConnectionRegistry;
  executionCodexHome: string;
  getLocalAppServerConnection(): any;
  globalState: any;
  isPackaged: boolean;
  isRemoteSshConnection(connection: any): boolean;
  onInstallStateObserved(observation: unknown): void;
  onPluginsReconciled(): void;
  onSkillsMayHaveChanged(): void;
  repoRoot: string;
  requestComputerUseWorker(input: any): Promise<any>;
  trashItem(path: string): Promise<unknown>;
}

export interface PluginReconciliationLifecycleOptions {
  app: FocusApp;
  isMacOS: boolean;
  registerDispose(dispose: { dispose(): void } | (() => void)): void;
  createCacheWatcher?: typeof createChromeNativeHostCacheWatcher;
  createOrchestrator?: typeof createBundledPluginsOrchestrator;
  createRecorder?: (dependencies: ConstructorParameters<typeof SkysightServiceManager>[0]) => SkysightServiceManager;
  archiveLegacySkill?: typeof archiveLegacyChronicleSkill;
}

/** Owns startup observers around bundled-plugin reconciliation and the optional Skysight recorder. */
export function createPluginReconciliationLifecycle(
  options: PluginReconciliationLifecycleOptions,
) {
  const {
    app,
    isMacOS,
    registerDispose,
    createCacheWatcher = createChromeNativeHostCacheWatcher,
    createOrchestrator = createBundledPluginsOrchestrator,
    createRecorder = (dependencies) => new SkysightServiceManager(dependencies),
    archiveLegacySkill = archiveLegacyChronicleSkill,
  } = options;
  let orchestrator: BundledPluginsOrchestrator | null = null;
  let recorder: SkysightServiceManager | null = null;

  const requireOrchestrator = () => {
    if (orchestrator == null) throw new Error(`Plugin reconciliation lifecycle has not started`);
    return orchestrator;
  };

  return {
    getRecorder: () => recorder,
    reloadBundledPlugins: () => requireOrchestrator().reloadBundledPlugins(),
    setDesktopFeatureAvailability: (availability: unknown, reasons: unknown) =>
      requireOrchestrator().setDesktopFeatureAvailability(availability, reasons),
    start(startOptions: PluginReconciliationStartOptions) {
      if (orchestrator != null) return orchestrator;
      const cacheWatcher = createCacheWatcher({
        buildFlavor: startOptions.buildFlavor,
        codexHome: startOptions.codexHome,
        executionCodexHome: startOptions.executionCodexHome,
        repoRoot: startOptions.repoRoot,
      });
      registerDispose(cacheWatcher.dispose);

      orchestrator = createOrchestrator({
        appVersion: startOptions.appVersion,
        buildFlavor: startOptions.buildFlavor,
        codexHome: startOptions.codexHome,
        getLocalAppServerConnection: startOptions.getLocalAppServerConnection,
        getConnectedRemoteSshAppServerConnections: () =>
          startOptions.connectionRegistry
            .getAllHostIds()
            .map((hostId) => startOptions.connectionRegistry.getConnection(hostId))
            .filter(
              (connection) =>
                startOptions.isRemoteSshConnection(connection) &&
                connection.getConnectionState() === `connected`,
            ),
        globalState: startOptions.globalState,
        isPackaged: startOptions.isPackaged,
        onChromePluginInstallStateChanged: cacheWatcher.setPluginInstallState,
        onInstallStateObserved: startOptions.onInstallStateObserved,
        onSkillsMayHaveChanged: startOptions.onSkillsMayHaveChanged,
        onReconcileComplete: startOptions.onPluginsReconciled,
        repoRoot: startOptions.repoRoot,
        trashItem: startOptions.trashItem,
      });

      registerDispose(
        startOptions.connectionRegistry.subscribe((event) => {
          if (event.type !== `added` || !startOptions.isRemoteSshConnection(event.connection))
            return;
          event.connection.registerInternalConnectionStateHandler((state: string) => {
            if (state === `connected`) orchestrator?.reconcileRemoteSshHost(event.connection);
          });
          if (event.connection.getConnectionState() === `connected`)
            orchestrator?.reconcileRemoteSshHost(event.connection);
        }),
      );

      if (isMacOS)
        recorder = createRecorder({
          request: startOptions.requestComputerUseWorker,
          reconcileComputerHistoryPluginInstallation: (installed) =>
            orchestrator?.reconcileComputerHistoryPluginInstallation(installed),
          archiveLegacyChronicleSkill: async () => {
            if (
              (await archiveLegacySkill({
                codexHome: startOptions.codexHome,
                reason: `skysight_gate_enabled`,
              })) != null
            )
              startOptions.onSkillsMayHaveChanged();
          },
        });

      const reconcileOnFocus = () => {
        orchestrator?.reconcileExternalPluginState(`focus`);
      };
      app.on(`browser-window-focus`, reconcileOnFocus);
      registerDispose(() => app.off(`browser-window-focus`, reconcileOnFocus));
      return orchestrator;
    },
    waitForPendingReconcile: () => requireOrchestrator().waitForPendingReconcile(),
  };
}
