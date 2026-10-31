type AdapterDependencies = {
  buildErrorPage(appName: string): string;
  getAppName(): string;
  getWebviewEntryPath(moduleDirectory: string): string;
  mainUrlTrust: any;
  packagedRendererUrl: string;
  prefersDarkColors(): boolean;
  rendererEnvironmentUrl?: string;
  rendererFrameTrust: any;
  windowAppearance: any;
};

/** Binds process/Electron environment once for the browser-window lifecycle owner. */
export function createBrowserWindowPolicyAdapters(dependencies: AdapterDependencies) {
  const rendererEntryUrl = () =>
    dependencies.rendererFrameTrust.resolveRendererEntryUrl(
      dependencies.rendererEnvironmentUrl,
      dependencies.packagedRendererUrl,
    );
  const rendererOptions = (moduleDirectory: string) => ({
    rendererUrl: rendererEntryUrl(),
    webviewEntryPath: dependencies.getWebviewEntryPath(moduleDirectory),
  });

  return {
    buildWindowErrorPage: () => dependencies.buildErrorPage(dependencies.getAppName()),
    isAppProtocolUrl: dependencies.mainUrlTrust.isAppProtocolUrl,
    isLargeEnoughForNativeWindow: dependencies.windowAppearance.isLargeEnoughForNativeWindow,
    isOverlayAppearance: dependencies.windowAppearance.isOverlayAppearance,
    isTrustedRendererFrameUrl(frameUrl: string, moduleDirectory: string) {
      return dependencies.rendererFrameTrust.isTrustedRendererFrameUrl(
        frameUrl,
        rendererOptions(moduleDirectory),
      );
    },
    isTrustedRendererSenderFrame({ sender, senderFrame, moduleDir }: any) {
      return dependencies.rendererFrameTrust.isTrustedRendererSenderFrame(
        sender,
        senderFrame,
        rendererOptions(moduleDir),
      );
    },
    minimumWindowSize: dependencies.windowAppearance.minimumWindowSize,
    rendererEntryUrl,
    rendererOrigin: () => dependencies.rendererFrameTrust.rendererOrigin(rendererEntryUrl()),
    resolveAppearanceTheme(appearance: string) {
      return dependencies.windowAppearance.resolveAppearanceTheme(
        appearance,
        dependencies.prefersDarkColors(),
      );
    },
    sameOrigin: dependencies.mainUrlTrust.sameOrigin,
    sameTrustedPath: dependencies.mainUrlTrust.sameTrustedPath,
    shouldHideInactiveWindow: dependencies.windowAppearance.shouldHideInactiveWindow,
    shouldUseOpaqueWindows: dependencies.windowAppearance.shouldUseOpaqueWindows,
    supportsEmbeddedWebview: dependencies.windowAppearance.supportsEmbeddedWebview,
    titleBarOverlay(windowZoom = 1) {
      return dependencies.windowAppearance.titleBarOverlay(
        windowZoom,
        dependencies.prefersDarkColors(),
      );
    },
    trafficLightPosition: dependencies.windowAppearance.trafficLightPosition,
    vibrancyForAppearance: dependencies.windowAppearance.vibrancyForAppearance,
    windowOptions: dependencies.windowAppearance.windowOptions,
    windowSurfaceColors: dependencies.windowAppearance.windowSurfaceColors,
  };
}

if (typeof module !== "undefined") {
  module.exports = { createBrowserWindowPolicyAdapters };
}
