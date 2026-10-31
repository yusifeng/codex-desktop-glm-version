// @ts-nocheck

const APP_ENTRY_MESSAGE_TYPE = `desktop-app-entry-received`;

/** Owns app-entry attribution together with queued delivery to the primary window. */
export function createAppEntryDeliveryRuntime({
  AppEntryAttributionTracker,
  initialInstallerId,
  primaryWindowMessages,
}: Record<string, any>) {
  const deliverReceipt = (receipt: Record<string, any>, webContents?: any) => {
    const message = { type: APP_ENTRY_MESSAGE_TYPE, receipt };
    if (webContents != null) {
      primaryWindowMessages.sendToWebContents(webContents, message);
      return;
    }
    primaryWindowMessages.enqueue(message);
  };

  const attribution = new AppEntryAttributionTracker(
    deliverReceipt,
    undefined,
    undefined,
    undefined,
    initialInstallerId,
  );

  return {
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
