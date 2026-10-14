// @ts-nocheck

/** Owns the page-to-WebContents binding boundary for Browser sidebar pages. */
export function createBrowserPageWebviewBindingControllerClass(dependencies: Record<string, any>) {
  const { bindPageToWebview: generatedBindPageToWebview } = dependencies;

  return class BrowserPageWebviewBindingController {
    private readonly host: any;
    private readonly bindings = new WeakMap<object, any>();

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
      // The generated implementation owns the full listener graph (navigation, media, input,
      // context-menu, crash, teardown and restore). This controller owns the attachment registry
      // so host lifecycle code can inspect and explicitly release the binding it created.
      generatedBindPageToWebview(
        helpers,
        windowState,
        page,
        webContents,
        themeVariant,
        initialNavigationOwner,
      );
      this.bindings.set(webContents, { helpers, windowState, page });
    }

    getBinding(webContents: object): any {
      return this.bindings.get(webContents) ?? null;
    }

    disposeBinding(webContents: object): void {
      this.bindings.delete(webContents);
    }
  };
}
