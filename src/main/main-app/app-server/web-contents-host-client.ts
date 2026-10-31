// @ts-nocheck

/** Adapts a WebContents into an app-server host client with background-thread filtering. */
export class WebContentsHostClient {
  webContents: any;
  chunkedMessageSender: any;
  browserWindow: any;
  ownsBackgroundThread: any;
  id: any;
  destroyedListeners = new Set<() => void>();
  focusChangedListeners = new Set<(focused: boolean) => void>();

  constructor(
    webContents: any,
    chunkedMessageSender: any,
    browserWindow: any = null,
    ownsBackgroundThread: any = null,
  ) {
    this.webContents = webContents;
    this.chunkedMessageSender = chunkedMessageSender;
    this.browserWindow = browserWindow;
    this.ownsBackgroundThread = ownsBackgroundThread;
    this.id = webContents.id;
  }

  send(channel: string, message: any) {
    if (
      this.ownsBackgroundThread != null &&
      this.webContents.getBackgroundThrottling() &&
      message.type !== `mcp-response` &&
      message.type !== `codex-app-server-initialized` &&
      message.type !== `codex-app-server-connection-changed`
    ) {
      let params = message.params;
      if (message.type === `mcp-request`) {
        if (
          message.request == null ||
          typeof message.request !== `object` ||
          !(`params` in message.request)
        )
          return;
        params = message.request.params;
      } else if (message.type !== `mcp-notification`) {
        return;
      }
      if (
        typeof message.hostId !== `string` ||
        typeof params !== `object` ||
        !params ||
        !(`threadId` in params) ||
        typeof params.threadId !== `string` ||
        !this.ownsBackgroundThread(message.hostId, params.threadId)
      )
        return;
    }
    this.chunkedMessageSender.send(this.webContents, channel, message);
  }

  sendCritical(channel: string, message: any) {
    this.chunkedMessageSender.sendCritical(this.webContents, channel, message);
  }

  isDestroyed() {
    return this.webContents.isDestroyed();
  }

  isFocused() {
    return this.browserWindow?.isFocused() === true;
  }

  onDestroyed(listener: () => void) {
    const wrapped = () => listener();
    if (this.destroyedListeners.size === 0)
      this.webContents.once(`destroyed`, this.handleDestroyed);
    this.destroyedListeners.add(wrapped);
    return {
      dispose: () => {
        if (!this.destroyedListeners.delete(wrapped)) return;
        if (this.destroyedListeners.size === 0)
          this.webContents.removeListener(`destroyed`, this.handleDestroyed);
      },
    };
  }

  onFocusChanged(listener: (focused: boolean) => void) {
    if (this.browserWindow == null) return { dispose: () => {} };
    const wrapped = (focused: boolean) => listener(focused);
    if (this.focusChangedListeners.size === 0) {
      this.browserWindow.on(`focus`, this.handleFocus);
      this.browserWindow.on(`blur`, this.handleBlur);
    }
    this.focusChangedListeners.add(wrapped);
    return {
      dispose: () => {
        if (!this.focusChangedListeners.delete(wrapped)) return;
        if (this.focusChangedListeners.size === 0) {
          this.browserWindow?.removeListener(`focus`, this.handleFocus);
          this.browserWindow?.removeListener(`blur`, this.handleBlur);
        }
      },
    };
  }

  handleDestroyed = () => {
    const listeners = Array.from(this.destroyedListeners);
    this.destroyedListeners.clear();
    for (const listener of listeners) listener();
  };

  handleFocus = () => {
    this.notifyFocusChanged(true);
  };

  handleBlur = () => {
    this.notifyFocusChanged(false);
  };

  notifyFocusChanged(focused: boolean) {
    for (const listener of Array.from(this.focusChangedListeners)) listener(focused);
  }
}

if (typeof module !== `undefined`) module.exports = { WebContentsHostClient };
