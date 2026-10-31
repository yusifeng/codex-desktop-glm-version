// @ts-nocheck

/** Preserves startup message ordering until a live primary window can receive it. */
export function createPrimaryWindowMessageQueue({ BrowserWindow }: Record<string, any>) {
  let windowServices: any = null;
  const pendingMessages: Array<Record<string, any>> = [];

  const flush = () => {
    if (windowServices == null) return;
    const primaryWindow = windowServices.getPrimaryWindow();
    if (primaryWindow == null || primaryWindow.isDestroyed()) return;
    for (const message of pendingMessages.splice(0, pendingMessages.length))
      windowServices.sendMessageToWindow(primaryWindow, message);
  };

  return {
    setWindowServices(nextWindowServices: any) {
      windowServices = nextWindowServices;
      flush();
    },
    handleWindowRegistered() {
      flush();
    },
    enqueue(message: Record<string, any>) {
      pendingMessages.push(message);
      flush();
    },
    sendToWebContents(webContents: any, message: Record<string, any>) {
      const window = BrowserWindow.fromWebContents(webContents);
      if (windowServices != null && window != null && !window.isDestroyed())
        windowServices.sendMessageToWindow(window, message);
    },
  };
}

if (typeof module !== `undefined`) module.exports = { createPrimaryWindowMessageQueue };
