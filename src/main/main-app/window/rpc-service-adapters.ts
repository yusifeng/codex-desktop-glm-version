export type WindowRpcServiceAdapterDependencies = {
  RpcHandlerBase: new (...args: any[]) => any;
  watchKeyboardRelease(keys: string[], callback: () => void): unknown;
  listLocalEnvironments(workspaceRoot: unknown, executionHost: unknown): Promise<any>;
  readLocalEnvironment(configPath: unknown, executionHost: unknown): Promise<any>;
  saveLocalEnvironment(
    executionHost: unknown,
    options: Record<string, any>,
  ): Promise<Record<string, any>>;
  getUseWslPaths(hostConfig: unknown): boolean;
  isRemoteHostConfig(hostConfig: unknown): boolean;
  convertPathForDesktopHost(path: unknown, useWslPaths: boolean): unknown;
  convertPathForAgentEnvironment(path: unknown, useWslPaths: boolean): unknown;
  app: {
    isRuntimeFeatureEnabled(name: string): boolean;
    setRuntimeFeatures(features: Record<string, boolean>): void;
  };
  runtimeFeatureNames: string[];
  getFeatureFlags(): Record<string, any>;
  getCanonicalMarketplaceName(buildFlavor: unknown): string;
  isOfficialMarketplaceName(name: string): boolean;
  listMarketplaceGroups(options: Record<string, any>): Promise<any>;
};

/** Builds the small stateful RPC services installed by WindowContext. */
export function createWindowRpcServiceAdapters(
  dependencies: WindowRpcServiceAdapterDependencies,
) {
  class HotkeyWindowService extends dependencies.RpcHandlerBase {
    lifecycleManager: any;
    origin: any;

    constructor(lifecycleManager: any, origin: any) {
      super();
      this.lifecycleManager = lifecycleManager;
      this.origin = origin;
    }

    getState() {
      return this.lifecycleManager.getState();
    }
    setEnabled(enabled: boolean) {
      this.lifecycleManager.setGateEnabled(enabled);
    }
    toggle() {
      return this.lifecycleManager.toggle();
    }
    open(options: unknown) {
      return this.lifecycleManager.openFromRenderer(this.origin, options);
    }
    collapseToHome() {
      return this.lifecycleManager.collapseToHome();
    }
    dismiss() {
      this.lifecycleManager.dismiss();
    }
    setHotkey(hotkey: unknown) {
      return this.lifecycleManager.setHotkey(hotkey);
    }
    setDevOverrideEnabled(enabled: boolean) {
      return this.lifecycleManager.setDevOverrideEnabled(enabled);
    }
    transitionDone(event: unknown) {
      this.lifecycleManager.handleTransitionDone(this.origin, event);
    }
    homePointerInteractionChanged(event: unknown) {
      this.lifecycleManager.handleHomePointerInteractionChanged(this.origin, event);
    }
    homeLayoutChanged(layout: unknown) {
      this.lifecycleManager.handleHomeLayoutChanged(this.origin, layout);
    }
    homeDragStart(event: unknown) {
      this.lifecycleManager.handleHomeDragStart(this.origin, event);
    }
    homeDragMove() {
      this.lifecycleManager.handleHomeDragMove(this.origin);
    }
    homeDragEnd() {
      this.lifecycleManager.handleHomeDragEnd(this.origin);
    }
  }

  class KeyboardModifierService extends dependencies.RpcHandlerBase {
    watchRelease(modifier: `meta` | `control` | `alt`) {
      const nativeModifiers = { meta: `command`, control: `control`, alt: `alternate` };
      return new Promise<void>((resolve) => {
        dependencies.watchKeyboardRelease([nativeModifiers[modifier]], resolve) ?? resolve();
      });
    }
  }

  class LocalEnvironmentsService extends dependencies.RpcHandlerBase {
    executionHostRegistry: any;

    constructor(executionHostRegistry: any) {
      super();
      this.executionHostRegistry = executionHostRegistry;
    }

    async list({ hostId, workspaceRoot }: { hostId: string; workspaceRoot: unknown }) {
      const executionHost = this.executionHostRegistry.get(hostId);
      return {
        environments: await dependencies.listLocalEnvironments(workspaceRoot, executionHost),
      };
    }

    async read({ configPath, hostId }: { configPath: unknown; hostId: string }) {
      const executionHost = this.executionHostRegistry.get(hostId);
      return {
        environment: await dependencies.readLocalEnvironment(configPath, executionHost),
      };
    }

    async saveConfig({
      configPath,
      expectedRevision,
      hostId,
      raw,
    }: {
      configPath: unknown;
      expectedRevision: unknown;
      hostId: string;
      raw: unknown;
    }) {
      const executionHost = this.executionHostRegistry.get(hostId);
      const useWslPaths = dependencies.getUseWslPaths(executionHost.hostConfig);
      const hostConfigPath = dependencies.isRemoteHostConfig(executionHost.hostConfig)
        ? configPath
        : dependencies.convertPathForDesktopHost(configPath, useWslPaths);
      return {
        configPath: dependencies.convertPathForAgentEnvironment(hostConfigPath, useWslPaths),
        ...(await dependencies.saveLocalEnvironment(executionHost, {
          configPath: hostConfigPath,
          expectedRevision,
          raw,
        })),
      };
    }
  }

  let runtimeFeatures: Record<string, boolean> = {};
  class OwlRuntimeFeaturesService extends dependencies.RpcHandlerBase {
    async isOwlFeatureEnabled(featureName: string) {
      try {
        return dependencies.app.isRuntimeFeatureEnabled(featureName);
      } catch (error) {
        if (error instanceof Error && error.message.startsWith(`Unsupported Owl feature:`))
          return false;
        throw error;
      }
    }

    async setRuntimeFeatures(features: Record<string, unknown>) {
      const nextFeatures = { ...runtimeFeatures };
      let changed = false;
      for (const featureName of dependencies.runtimeFeatureNames) {
        const enabled = features[featureName];
        if (typeof enabled === `boolean`) {
          nextFeatures[featureName] = enabled;
          changed = true;
        }
      }
      if (changed) {
        dependencies.app.setRuntimeFeatures(nextFeatures);
        runtimeFeatures = nextFeatures;
      }
    }
  }

  const resetRuntimeFeatures = () => {
    runtimeFeatures = {};
    dependencies.app.setRuntimeFeatures({});
  };

  class PerformanceTelemetryService extends dependencies.RpcHandlerBase {
    messageHandler: any;
    origin: any;

    constructor(messageHandler: any, origin: any) {
      super();
      this.messageHandler = messageHandler;
      this.origin = origin;
    }
    startSpanCpuSampling(options: unknown) {
      this.messageHandler.startPerformanceSpanCpuSampling(this.origin, options);
    }
    cancelSpanCpuSampling(requestId: unknown) {
      this.messageHandler.cancelPerformanceSpanCpuSampling(requestId);
    }
    finishSpanCpuSampling(requestId: unknown) {
      return this.messageHandler.finishPerformanceSpanCpuSampling(requestId);
    }
  }

  class PluginMarketplaceListingService extends dependencies.RpcHandlerBase {
    appServer: any;

    constructor(appServer: any) {
      super();
      this.appServer = appServer;
    }

    async list({
      buildFlavor,
      cwds,
      hiddenMarketplaceNames,
      marketplaceKinds,
    }: {
      buildFlavor: unknown;
      cwds: unknown[];
      hiddenMarketplaceNames: string[];
      marketplaceKinds?: unknown;
    }) {
      try {
        const [{ marketplaces }, codexHome, platformPath] = await Promise.all([
          dependencies.getFeatureFlags().noPluginListPhase4
            ? this.appServer.sendAppServerRequest(
                `plugin/installed`,
                cwds.length > 0 ? { cwds } : {},
              )
            : this.appServer.listPlugins({
                ...(cwds.length > 0 ? { cwds } : {}),
                ...(marketplaceKinds == null ? {} : { marketplaceKinds }),
              }),
          this.appServer.codexHome(),
          this.appServer.platformPath(),
        ]);
        const canonicalMarketplaceName =
          dependencies.getCanonicalMarketplaceName(buildFlavor);
        return await dependencies.listMarketplaceGroups({
          codexHome,
          filesystem: this.appServer,
          marketplaces: marketplaces.filter(
            (marketplace: any) =>
              !hiddenMarketplaceNames.includes(marketplace.name) &&
              (!dependencies.isOfficialMarketplaceName(marketplace.name) ||
                marketplace.name === canonicalMarketplaceName),
          ),
          path: platformPath,
        });
      } catch {
        return { groups: [] };
      }
    }
  }

  return {
    HotkeyWindowService,
    KeyboardModifierService,
    LocalEnvironmentsService,
    OwlRuntimeFeaturesService,
    PerformanceTelemetryService,
    PluginMarketplaceListingService,
    resetRuntimeFeatures,
  };
}

if (typeof module !== `undefined`) {
  module.exports = { createWindowRpcServiceAdapters };
}
