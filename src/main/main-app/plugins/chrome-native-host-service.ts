type ChromeNativeHostServiceDependencies = {
  RpcHandlerBase: new (...args: any[]) => any;
  resolveResourcesPath(options: { env: NodeJS.ProcessEnv; resourcesPath?: string }): string | null | undefined;
  reconcileChromeNativeHost(options: {
    codexHome: string;
    devRuntimeRepoRoot?: string;
    marketplacePath: string | null;
    pluginName: string;
    resourcesPath: string;
  }): Promise<unknown>;
  uninstallChromePluginRuntime(options: {
    codexHome: string;
    marketplaceName: string;
    pluginName: string;
  }): Promise<unknown>;
  env: NodeJS.ProcessEnv;
  resourcesPath?: string;
  isRemoteHostConfig(hostConfig: unknown): boolean;
};

function requiredTrimmedString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function parseChromeNativeHostInstallRequest(input: unknown) {
  if (input == null || typeof input !== "object") return null;
  const request = input as Record<string, unknown>;
  const hostId = requiredTrimmedString(request.hostId);
  const pluginName = requiredTrimmedString(request.pluginName);
  const marketplacePath = request.marketplacePath;
  return hostId == null || pluginName == null || (marketplacePath !== null && typeof marketplacePath !== "string")
    ? null
    : { hostId, marketplacePath: marketplacePath as string | null, pluginName };
}

export function parseChromeNativeHostUninstallRequest(input: unknown) {
  if (input == null || typeof input !== "object") return null;
  const request = input as Record<string, unknown>;
  const hostId = requiredTrimmedString(request.hostId);
  const marketplaceName = requiredTrimmedString(request.marketplaceName);
  const pluginName = requiredTrimmedString(request.pluginName);
  return hostId == null || marketplaceName == null || pluginName == null
    ? null
    : { hostId, marketplaceName, pluginName };
}

export function createChromeNativeHostServiceClass(dependencies: ChromeNativeHostServiceDependencies) {
  return class ChromeNativeHostService extends dependencies.RpcHandlerBase {
    constructor(
      private readonly executionHostRegistry: any,
      private readonly devRuntimeRepoRoot?: string,
    ) {
      super();
    }

    async install(input: unknown) {
      const request = parseChromeNativeHostInstallRequest(input);
      if (request == null) throw Error("Invalid Chrome native host install request");
      const executionHost = this.executionHostRegistry.getMaybe(request.hostId);
      if (executionHost == null || dependencies.isRemoteHostConfig(executionHost.hostConfig)) return;
      const resourcesPath = dependencies.resolveResourcesPath({
        env: dependencies.env,
        resourcesPath: dependencies.resourcesPath,
      });
      if (resourcesPath == null) throw Error("Chrome native host resource sync requires resourcesPath");
      await dependencies.reconcileChromeNativeHost({
        codexHome: await executionHost.codexHome(),
        devRuntimeRepoRoot: this.devRuntimeRepoRoot,
        marketplacePath: request.marketplacePath,
        pluginName: request.pluginName,
        resourcesPath,
      });
    }

    async uninstall(input: unknown) {
      const request = parseChromeNativeHostUninstallRequest(input);
      if (request == null) throw Error("Invalid Chrome native host uninstall request");
      const executionHost = this.executionHostRegistry.getMaybe(request.hostId);
      if (executionHost == null || dependencies.isRemoteHostConfig(executionHost.hostConfig)) return;
      await dependencies.uninstallChromePluginRuntime({
        codexHome: await executionHost.codexHome(),
        marketplaceName: request.marketplaceName,
        pluginName: request.pluginName,
      });
    }
  };
}
