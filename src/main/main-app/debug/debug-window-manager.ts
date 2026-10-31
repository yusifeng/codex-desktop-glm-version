// @ts-nocheck

/** Builds the debug-window owner and its conversation subscription registry. */
export function createDebugWindowRuntime(dependencies: Record<string, any>) {
  const { RpcHandlerBase, DisposableCallback, createUsingScope, initialRoute } = dependencies;

  class UnsubscribeHandle extends RpcHandlerBase {
    cleanup;
    constructor(cleanup: () => void) {
      super();
      this.cleanup = cleanup;
    }
    unsubscribe() {
      this.cleanup();
    }
    [Symbol.dispose]() {
      this.unsubscribe();
    }
  }

  class ChatGptConversationRegistry {
    sources = new Map();
    listeners = new Set();

    forgetWebContents(webContentsId: number) {
      this.forgetSource(webContentsId);
      for (const listener of this.listeners) {
        if (
          listener.webContentsId === webContentsId ||
          listener.ownerWebContentsId === webContentsId
        ) {
          this.removeListener(listener);
        }
      }
    }

    registerSource(ownerWebContentsId: number, source: any) {
      this.forgetSource(ownerWebContentsId);
      const duplicatedSource = source.dup();
      this.sources.set(ownerWebContentsId, duplicatedSource);
      const cleanup = () => {
        if (this.sources.get(ownerWebContentsId) === duplicatedSource) {
          this.forgetSource(ownerWebContentsId);
        }
      };
      duplicatedSource.onRpcBroken(cleanup);
      for (const listener of this.listeners) {
        if (listener.ownerWebContentsId === ownerWebContentsId) {
          this.connectListener(listener);
        }
      }
      return new UnsubscribeHandle(cleanup);
    }

    async runAction(ownerWebContentsId: number, action: unknown) {
      const source = this.sources.get(ownerWebContentsId);
      if (source == null) return false;
      try {
        return await source.runAction(action);
      } catch {
        return false;
      }
    }

    setDebugWindowOwner(webContentsId: number, ownerWebContentsId: number) {
      for (const listener of this.listeners) {
        if (
          listener.webContentsId === webContentsId &&
          listener.ownerWebContentsId !== ownerWebContentsId
        ) {
          listener.ownerWebContentsId = ownerWebContentsId;
          this.connectListener(listener);
        }
      }
    }

    subscribe(ownerWebContentsId: number, webContentsId: number, callback: any) {
      const listener = {
        callback: callback.dup(),
        ownerWebContentsId,
        source: null,
        subscription: null,
        webContentsId,
      };
      this.listeners.add(listener);
      listener.callback.onRpcBroken(() => this.removeListener(listener));
      this.connectListener(listener);
      return new UnsubscribeHandle(() => this.removeListener(listener));
    }

    connectListener(listener: Record<string, any>) {
      let scope;
      try {
        scope = createUsingScope();
        listener.subscription?.[Symbol.dispose]();
        listener.subscription = null;
        const source = this.sources.get(listener.ownerWebContentsId) ?? null;
        listener.source = source;
        if (source == null) {
          listener.callback(null).catch(() => this.removeListener(listener));
          return;
        }
        const subscriptionCallback = scope.u(
          new DisposableCallback((value: unknown) => {
            if (this.listeners.has(listener) && listener.source === source) {
              listener.callback(value).catch(() => this.removeListener(listener));
            }
          }),
        );
        source.subscribe(subscriptionCallback).then(
          (subscription: any) => {
            if (!this.listeners.has(listener) || listener.source !== source) {
              subscription[Symbol.dispose]();
              return;
            }
            listener.subscription = subscription;
          },
          () => {
            if (this.listeners.has(listener) && listener.source === source) {
              listener.callback(null).catch(() => this.removeListener(listener));
            }
          },
        );
      } catch (error) {
        scope.e = error;
      } finally {
        scope.d();
      }
    }

    removeListener(listener: Record<string, any>) {
      if (this.listeners.delete(listener)) {
        listener.source = null;
        listener.subscription?.[Symbol.dispose]();
        listener.callback[Symbol.dispose]();
      }
    }

    forgetSource(ownerWebContentsId: number) {
      const source = this.sources.get(ownerWebContentsId);
      if (source == null) return;
      this.sources.delete(ownerWebContentsId);
      for (const listener of this.listeners) {
        if (listener.ownerWebContentsId === ownerWebContentsId) {
          this.connectListener(listener);
        }
      }
      source[Symbol.dispose]();
    }
  }

  class DebugWindowManager {
    options;
    chatGptConversations = new ChatGptConversationRegistry();
    windowsByOwnerWebContentsId = new Map();
    originConversationIdsByOwnerWebContentsId = new Map();
    pendingWindowsByOwnerWebContentsId = new Map();
    clientAnalyticsHistoryByOwnerWebContentsId = new Map();

    constructor(options: Record<string, any>) {
      this.options = options;
    }

    forgetWebContents(webContentsId: number) {
      this.chatGptConversations.forgetWebContents(webContentsId);
      this.originConversationIdsByOwnerWebContentsId.delete(webContentsId);
      this.clientAnalyticsHistoryByOwnerWebContentsId.delete(webContentsId);
      const window = this.windowsByOwnerWebContentsId.get(webContentsId);
      this.windowsByOwnerWebContentsId.delete(webContentsId);
      if (window != null && !window.isDestroyed()) window.close();
    }

    getOwnerWebContentsId(webContentsId: number) {
      for (const [ownerWebContentsId, window] of this.windowsByOwnerWebContentsId) {
        if (!window.isDestroyed() && window.webContents.id === webContentsId) {
          return ownerWebContentsId;
        }
      }
      return null;
    }

    setOriginConversation(webContents: any, conversationId: string | null) {
      this.originConversationIdsByOwnerWebContentsId.set(webContents.id, conversationId);
      this.sendOriginConversation(webContents.id);
    }

    setClientAnalyticsHistory(webContents: any, events: unknown[]) {
      this.clientAnalyticsHistoryByOwnerWebContentsId.set(webContents.id, events);
      this.sendClientAnalyticsHistory(webContents.id);
    }

    async show(webContents: any) {
      const ownerWebContentsId = this.getOwnerWebContentsId(webContents.id) ?? webContents.id;
      const existingWindow = this.windowsByOwnerWebContentsId.get(ownerWebContentsId);
      if (existingWindow != null && !existingWindow.isDestroyed()) {
        this.sendOriginConversation(ownerWebContentsId);
        this.sendClientAnalyticsHistory(ownerWebContentsId);
        this.options.showWindow(existingWindow, { stealFocus: true });
        return;
      }
      const pendingWindow = this.pendingWindowsByOwnerWebContentsId.get(webContents.id);
      if (pendingWindow != null) {
        await pendingWindow;
        return;
      }
      const creation = this.createDebugWindow(webContents);
      this.pendingWindowsByOwnerWebContentsId.set(webContents.id, creation);
      try {
        await creation;
      } finally {
        this.pendingWindowsByOwnerWebContentsId.delete(webContents.id);
      }
    }

    async createDebugWindow(ownerWebContents: any) {
      const window = await this.options.createWindow({
        title: `Debug`,
        width: 920,
        height: 840,
        appearance: `secondary`,
        initialRoute,
        lockTitle: true,
      });
      if (ownerWebContents.isDestroyed()) {
        window.close();
        return;
      }
      this.windowsByOwnerWebContentsId.set(ownerWebContents.id, window);
      const debugWebContentsId = window.webContents.id;
      this.chatGptConversations.setDebugWindowOwner(
        debugWebContentsId,
        ownerWebContents.id,
      );
      window.setMenuBarVisibility(false);
      window.center();
      const forgetWindow = () => {
        if (this.windowsByOwnerWebContentsId.get(ownerWebContents.id) === window) {
          this.windowsByOwnerWebContentsId.delete(ownerWebContents.id);
        }
      };
      const ownerDestroyed = () => {
        forgetWindow();
        this.originConversationIdsByOwnerWebContentsId.delete(ownerWebContents.id);
        this.clientAnalyticsHistoryByOwnerWebContentsId.delete(ownerWebContents.id);
        if (!window.isDestroyed()) window.close();
      };
      window.on(`closed`, () => {
        this.chatGptConversations.forgetWebContents(debugWebContentsId);
        forgetWindow();
        ownerWebContents.removeListener(`destroyed`, ownerDestroyed);
      });
      ownerWebContents.once(`destroyed`, ownerDestroyed);
      this.sendOriginConversation(ownerWebContents.id);
      this.sendClientAnalyticsHistory(ownerWebContents.id);
      this.options.showWindow(window, { stealFocus: true });
    }

    sendOriginConversation(ownerWebContentsId: number) {
      const window = this.windowsByOwnerWebContentsId.get(ownerWebContentsId);
      if (window == null || window.isDestroyed()) return;
      this.options.sendMessageToWindow(window, {
        type: `debug-window-origin-conversation-changed`,
        conversationId:
          this.originConversationIdsByOwnerWebContentsId.get(ownerWebContentsId) ?? null,
      });
    }

    sendClientAnalyticsHistory(ownerWebContentsId: number) {
      const window = this.windowsByOwnerWebContentsId.get(ownerWebContentsId);
      if (window == null || window.isDestroyed()) return;
      this.options.sendMessageToWindow(window, {
        type: `debug-window-client-analytics-history-changed`,
        events: this.clientAnalyticsHistoryByOwnerWebContentsId.get(ownerWebContentsId) ?? [],
      });
    }
  }

  return { ChatGptConversationRegistry, DebugWindowManager, UnsubscribeHandle };
}

if (typeof module !== "undefined") {
  module.exports = { createDebugWindowRuntime };
}
