// @ts-nocheck

/** Owns page identity checks that sit above the browser page host lifecycle. */
export function createBrowserPageLookupControllerClass(_dependencies: Record<string, any>) {
  return class BrowserPageLookupController {
    host: any;

    constructor(host: any) {
      this.host = host;
    }

    isBrowserPageWebContents(webContents: any): boolean {
      return (
        this.host.browserPageHostLifecycle.findPageStateForWebContentsId(webContents.id)?.page?.view
          ?.webContents === webContents
      );
    }
  };
}
