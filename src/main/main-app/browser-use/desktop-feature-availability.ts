export class BrowserUseDesktopFeatureAvailability {
  constructor(private readonly browserSessionRegistry: {
    setBrowserUseNativePipeEnabled(enabled: boolean): void;
  }) {}

  setDesktopFeatureAvailability(availability: { inAppBrowserUse?: boolean }): void {
    if (availability.inAppBrowserUse != null) {
      this.browserSessionRegistry.setBrowserUseNativePipeEnabled(availability.inAppBrowserUse);
    }
  }

  dispose(): void {
    this.browserSessionRegistry.setBrowserUseNativePipeEnabled(false);
  }
}
