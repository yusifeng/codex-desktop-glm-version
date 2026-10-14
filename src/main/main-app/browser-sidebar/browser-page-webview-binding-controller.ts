// @ts-nocheck

/** Owns the page-to-WebContents binding boundary for Browser sidebar pages. */
export function createBrowserPageWebviewBindingControllerClass(dependencies: Record<string, any>) {
  const { bindPageToWebview } = dependencies;

  return class BrowserPageWebviewBindingController {
    private readonly host: any;

    constructor(host: any) {
      this.host = host;
    }

    bindPageToWebview(
      helpers: any,
      windowState: any,
      page: any,
      webContents: any,
      themeVariant: unknown,
      initialNavigationOwner: unknown,
    ): void {
      // Keep the generated attachment implementation behind a stable owner boundary.
      // The lifecycle helper facade remains the first argument expected by the binding code.
      bindPageToWebview(
        helpers,
        windowState,
        page,
        webContents,
        themeVariant,
        initialNavigationOwner,
      );
    }
  };
}
