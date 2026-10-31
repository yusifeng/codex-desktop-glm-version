// @ts-nocheck

const APP_ENTRY_MESSAGE_TYPE = `desktop-app-entry-received`;

/** Owns app-entry attribution together with queued delivery to the primary window. */
export function createAppEntryDeliveryRuntime({
  AppEntryAttributionTracker,
  BrowserWindow,
  initialInstallerId,
}: Record<string, any>) {
  let windowServices: any = null;
  const pendingMessages: Array<Record<string, any>> = [];

  const flush = () => {
    if (windowServices == null) return;
    const primaryWindow = windowServices.getPrimaryWindow();
    if (primaryWindow == null || primaryWindow.isDestroyed()) return;
    for (const message of pendingMessages.splice(0, pendingMessages.length))
      windowServices.sendMessageToWindow(primaryWindow, message);
  };

  const deliverReceipt = (receipt: Record<string, any>, webContents?: any) => {
    const message = { type: APP_ENTRY_MESSAGE_TYPE, receipt };
    if (webContents != null) {
      const window = BrowserWindow.fromWebContents(webContents);
      if (windowServices != null && window != null && !window.isDestroyed())
        windowServices.sendMessageToWindow(window, message);
      return;
    }
    pendingMessages.push(message);
    flush();
  };

  const attribution = new AppEntryAttributionTracker(
    deliverReceipt,
    undefined,
    undefined,
    undefined,
    initialInstallerId,
  );

  return {
    setWindowServices(nextWindowServices: any) {
      windowServices = nextWindowServices;
      flush();
    },
    handleWindowRegistered() {
      flush();
    },
    onAppEntrySource(source: Record<string, any>, webContents?: any) {
      attribution.handleSourceActivation(source, (receipt: Record<string, any>) => {
        deliverReceipt(receipt, webContents);
      });
    },
    onDeepLinkReceived(url?: string | null) {
      if (url == null) attribution.handleUnloggableDeepLinkActivation();
      else attribution.handleDeepLink(url);
    },
    handleAppEvent(event: Record<string, any>) {
      if (event.type === `background`) attribution.handleBackground();
      else if (event.type === `foreground`) attribution.handleForeground();
    },
    handleInitialWindowVisible() {
      attribution.handleInitialWindowVisible();
    },
    canAttributeRuntimeActivation() {
      return attribution.canAttributeRuntimeActivation();
    },
  };
}

if (typeof module !== `undefined`) module.exports = { createAppEntryDeliveryRuntime };
