// @ts-nocheck

/** Owns Browser sidebar window and thread-state lookup/materialization. */
export function createBrowserWindowThreadStateControllerClass(
  dependencies: Record<string, any>,
) {
  const {
    hX,
    fq,
    gXe,
    oX,
    installBrowserWebviewListeners,
    aXe,
    gX,
    qU,
    oXe,
    vX,
    tq,
    KU,
    l,
    EZ,
  } = dependencies;
  const logger = dependencies.logger ?? (() => ({ warning() {} }));

  return class BrowserWindowThreadStateController {
    host: any;

    constructor(host: any) {
      this.host = host;
    }

    closePage(
      ownerWebContents: any,
      conversationId: any,
      browserTabId: any,
      browserStorageId: any,
    ) {
      const windowState = this.host.getCurrentWindowState(ownerWebContents);
      if (windowState == null) return;
      const threadState = hX(windowState, conversationId, browserTabId);
      if (
        threadState == null ||
        (browserStorageId != null &&
          threadState.browserStorageId !== browserStorageId)
      ) {
        if (threadState == null && browserTabId != null)
          this.host.browserPageHostLifecycle.cancelPendingWebviewAttaches(
            windowState,
            { browserTabId, conversationId },
          );
        if (
          browserTabId != null &&
          browserStorageId != null &&
          !this.host.browserPersistence.hasBrowserStorageOwner(browserStorageId)
        )
          this.host.browserPageSnapshots.deleteClosedPageAndFlush({
            browserStorageId,
            browserTabId,
            conversationId,
          });
        return;
      }
      fq(
        this.host.windowManager,
        windowState.owner,
        conversationId,
        threadState,
      );
      if (
        windowState.activeConversationId === conversationId &&
        windowState.activeBrowserTabId === threadState.browserTabId
      )
        windowState.activeBrowserTabId = null;
      if (threadState.isBrowserUseActive)
        this.host.setBrowserUseActiveForRoute(
          { conversationId, windowId: oX(windowState.window.id) },
          false,
          threadState.browserTabId,
        );
      this.host.browserUseOpenRequests.rejectForRoute({
        browserTabId: threadState.browserTabId,
        conversationId,
        error: Error(`ChatGPT browser tab was closed by the user`),
        owner: windowState.owner,
      });
      this.host.browserPageHostLifecycle.requestThreadTeardown(
        windowState,
        conversationId,
        threadState,
        `closed`,
      );
    }

    transferConversation(
      ownerWebContents,
      sourceConversationId,
      sourceBrowserTabId,
      targetConversationId,
      targetBrowserTabId,
    ) {
      const windowState = this.host.ensureCurrentWindowState(ownerWebContents);
      if (windowState != null)
        this.transferConversationState(
          windowState,
          sourceConversationId,
          sourceBrowserTabId,
          targetConversationId,
          targetBrowserTabId,
        );
    }

    transferConversationState(
      windowState: any,
      sourceConversationId: any,
      sourceBrowserTabId: any,
      targetConversationId: any,
      targetBrowserTabId: any,
    ) {
      this.host.siteAnnotationPermissions.cancel(
        hX(windowState, sourceConversationId, sourceBrowserTabId)?.page?.view
          .webContents,
      );
      gXe({
        browserSessionRegistry: this.host.browserSessionRegistry,
        comments: this.host.comments,
        downloadStore: this.host.downloadStore,
        disposeThreadState: this.host.disposeThreadState.bind(this.host),
        isBrowserUseManagedBrowserTab:
          this.host.browserPageHostLifecycle.isBrowserUseManagedBrowserTab.bind(
            this.host.browserPageHostLifecycle,
          ),
        getThreadStateForWindow: hX,
        setBrowserUseActiveForRoute: this.host.setBrowserUseActiveForRoute.bind(
          this.host,
        ),
        sourceBrowserTabId,
        sourceConversationId,
        syncRuntimeStateToPage: this.host.syncRuntimeStateToPage.bind(
          this.host,
        ),
        syncThreadState: this.host.syncThreadState.bind(this.host),
        targetBrowserTabId,
        targetConversationId,
        windowState,
      });
      const target = hX(windowState, targetConversationId, targetBrowserTabId);
      if (target != null) {
        this.host.browserPageSnapshots.reassociateAndFlush(target);
        if (
          windowState.activeConversationId === targetConversationId &&
          windowState.activeBrowserTabId === target.browserTabId
        )
          this.host.tabBudget.markTabSelected(windowState, target);
      }
      this.host.iabTabMentions.notifyInvalidated();
    }

    ensureWindowState(window: any, owner: any) {
      const windowId = window.id;
      const existing = this.host.windows.get(windowId);
      if (existing) {
        existing.owner = owner;
        this.host.browserSessionRegistry.registerWindow({
          ownerWebContentsId: owner.id,
          windowId,
        });
        return existing;
      }
      const state: any = {
        owner,
        isClosing: false,
        window,
        contentBounds: null,
        threads: new Map(),
        activeConversationId: null,
        activeBrowserTabId: null,
        ignoredConversationIds: new Set(),
        rendererInstanceId: null,
        registeredWebviewHostsByRoutePartition: new Map(),
        browserSettingsWebviewMountIds: new Set(),
        browserSettingsWebviewThemeVariant: `light`,
        pendingBrowserSettingsWebviewsByInstanceId: new Map(),
        browserSettingsWebviewAllowedNavigationUrlsByWebContentsId: new Map(),
        browserSettingsWebContentsByWebContentsId: new Map(),
        browserSettingsWebviewNavigationDisposersByWebContentsId: new Map(),
        pendingAdoptedWebviewsByWebContentsId: new Map(),
        pendingWebviewRoutesByInstanceId: new Map(),
        transferredConversationStateKeys: new Set(),
        disposeWindowListeners: () => void 0,
        disposeWebviewListeners: () => void 0,
      };
      const updateBounds = () => {
        if (state.contentBounds != null)
          state.contentBounds = window.getContentBounds();
      };
      const restoreAnnotationPresentation = () => {
        for (const thread of state.threads.values())
          if (thread.snapshot.isAnnotationSuspended)
            this.host.setAnnotationPresentation(state.owner, {
              browserTabId: thread.browserTabId,
              conversationId: thread.conversationId,
              suspended: false,
            });
      };
      window.on(`blur`, restoreAnnotationPresentation);
      window.on(`move`, updateBounds);
      window.on(`resize`, updateBounds);
      window.on(`enter-full-screen`, updateBounds);
      window.on(`leave-full-screen`, updateBounds);
      window.on(`maximize`, updateBounds);
      window.on(`unmaximize`, updateBounds);
      window.on(`restore`, updateBounds);
      state.disposeWindowListeners = () => {
        if (window.isDestroyed()) return;
        window.removeListener(`blur`, restoreAnnotationPresentation);
        window.removeListener(`move`, updateBounds);
        window.removeListener(`resize`, updateBounds);
        window.removeListener(`enter-full-screen`, updateBounds);
        window.removeListener(`leave-full-screen`, updateBounds);
        window.removeListener(`maximize`, updateBounds);
        window.removeListener(`unmaximize`, updateBounds);
        window.removeListener(`restore`, updateBounds);
      };
      state.disposeWebviewListeners = installBrowserWebviewListeners({
        admitBrowserTab: () => this.host.admitBrowserTab(`webview-attach`),
        cancelPendingWebviewAttaches: () =>
          this.host.browserPageHostLifecycle.cancelPendingWebviewAttaches(
            state,
          ),
        reconcileBrowserStorageId: (thread, persistence) =>
          this.host.browserPersistence.reconcileBrowserStorageId(
            state,
            thread,
            persistence,
          ),
        attachWebview: (thread, persistence) =>
          this.host.browserPageHostLifecycle.attachWebview(
            state,
            thread,
            persistence,
          ),
        attachedWebviewHosts:
          this.host.browserPageHostLifecycle.attachedWebviewHosts,
        configureBrowserSession: () => this.host.getBrowserSession(),
        getAnnotationApiPolicy: (webContents, route) =>
          this.host.siteAnnotationFeatures.getPolicy(
            this.host.findPageStateForRuntimeSender(webContents),
            route,
            this.host.isTweaksFeatureEnabled,
          ),
        subscribeAnnotationApiAvailability: (listener) =>
          this.host.siteAnnotationFeatures.subscribeAvailability(listener),
        ensureThreadStateForWindow: (route, input) =>
          this.host.ensureThreadStateForWindow(state, route, input),
        handleWebviewDestroyedBeforeAttach: (route) =>
          this.host.browserUseOpenRequests.rejectForRoute({
            error: Error(
              `Browser webview was destroyed before page attachment completed`,
            ),
            owner,
            ...route,
          }),
        isPagePersistenceAllowed: () =>
          this.host.browserPersistence.isPersistenceOwner(state.window),
        openBrowserSettingsUrlInTab: (url) =>
          this.host.windowManager.sendMessageToWebContents(owner, {
            type: `toggle-browser-panel`,
            open: true,
            returnToSettingsOrigin: true,
            url,
            source: `manual`,
            initiator: `window_open`,
          }),
        owner,
        prepareWebviewAttach: (thread, input, persistence) =>
          this.host.browserPersistence.prepareWebviewAttach(
            state,
            thread,
            input,
            persistence,
          ),
        preloadPath: EZ,
        recordDebugEvent: (event) =>
          this.host.browserSessionRegistry.recordDebugEvent(event),
        state,
        windowId,
      });
      this.host.windows.set(windowId, state);
      this.host.browserSessionRegistry.registerWindow({
        ownerWebContentsId: owner.id,
        windowId,
      });
      this.host.browserPageSnapshots.registerWindowShutdown(
        state,
        () => {
          for (const thread of state.threads.values()) {
            if (thread.page != null) {
              this.host.browserPageHostLifecycle.reportIncompleteNavigationOnClose(
                thread.page,
                `window-closed`,
              );
            }
          }
        },
        () => this.disposeWindowState(windowId),
      );
      return state;
    }

    ensureCurrentWindowState(ownerWebContents: any) {
      const window = this.getCurrentWindow(ownerWebContents);
      return window == null
        ? null
        : this.ensureWindowState(window, ownerWebContents);
    }

    getCurrentWindowState(ownerWebContents: any) {
      const window = this.getCurrentWindow(ownerWebContents);
      return window == null ? null : (this.host.windows.get(window.id) ?? null);
    }

    getCurrentWindow(ownerWebContents: any) {
      const window = l?.BrowserWindow?.fromWebContents?.(ownerWebContents);
      return window == null || window.isDestroyed() ? null : window;
    }

    getThreadState(
      ownerWebContents: any,
      conversationId: any,
      browserTabId: any,
    ) {
      const windowState = this.getCurrentWindowState(ownerWebContents);
      return windowState == null
        ? null
        : hX(windowState, conversationId, browserTabId);
    }

    ensureThreadStateForWindow(
      windowState: any,
      conversationId: any,
      browserTabId: any,
      options: any = {},
    ) {
      return oXe({
        browserSessionRegistry: this.host.browserSessionRegistry,
        browserTabId,
        conversationId,
        options,
        tabBudget: this.host.tabBudget,
        windowManager: this.host.windowManager,
        windows: this.host.windows,
        windowState,
      });
    }

    disposeThreadState(
      windowState: any,
      conversationId: any,
      threadState: any,
    ) {
      this.host.comments.close(
        windowState.owner,
        conversationId,
        threadState.browserTabId,
      );
      const page = threadState.page;
      this.host.browserPageHostLifecycle.cancelPendingWebviewAttaches(
        windowState,
        threadState,
      );
      if (page != null) {
        this.host.browserPageHostLifecycle.disposePage(page);
        if (
          this.host.browserPageHostLifecycle.isBrowserUseManagedBrowserTab(
            conversationId,
            threadState.browserTabId,
          )
        )
          this.host.browserSessionRegistry.recordPageClosed({
            conversationId,
            browserTabId: threadState.browserTabId,
            windowId: oX(
              (windowState.tabSourceWindow ?? windowState).window.id,
            ),
          });
      }
      if (threadState.isBrowserUseActive)
        this.host.setBrowserUseActiveForRoute(
          {
            conversationId,
            windowId: oX(
              (windowState.tabSourceWindow ?? windowState).window.id,
            ),
          },
          false,
          threadState.browserTabId,
        );
    }

    disposeWindowState(windowId: number) {
      const windowState = this.host.windows.get(windowId);
      if (windowState == null) return;
      if (!windowState.isClosing)
        this.host.browserPageSnapshots.persistWindowBeforeShutdown(windowState);
      windowState.isClosing = true;
      this.host.browserUseOpenRequests.rejectForOwner(
        windowState.owner,
        Error(
          `The ChatGPT window closed while waiting for a Browser webview to attach`,
        ),
      );
      for (const threadState of windowState.threads.values()) {
        this.disposeThreadState(
          windowState,
          threadState.conversationId,
          threadState,
        );
      }
      windowState.disposeWindowListeners();
      windowState.disposeWebviewListeners();
      windowState.threads.clear();
      this.host.windows.delete(windowId);
      this.host.tabBudget.handleWindowClosed(windowId);
      if (this.host.lastSyncedWindowId === windowId)
        this.host.lastSyncedWindowId = null;
      this.host.browserSessionRegistry.handleWindowClosed(windowId);
    }

    findPageStateForRuntimeSender(webContents: any) {
      for (const windowState of this.host.windows.values())
        for (const threadState of windowState.threads.values()) {
          const page = threadState.page;
          if (page?.view.webContents?.id === webContents.id)
            return { owner: windowState.owner, page, threadState, windowState };
        }
      return null;
    }

    findPageStateForPageKey(pageKey: any) {
      for (const windowState of this.host.windows.values())
        for (const threadState of windowState.threads.values()) {
          const page = threadState.page;
          if (
            page != null &&
            KU(
              (windowState.tabSourceWindow ?? windowState).owner.id,
              threadState.conversationId,
              threadState.browserTabId,
            ) === pageKey
          )
            return {
              conversationId: threadState.conversationId,
              page,
              threadState,
              windowState,
            };
        }
      return null;
    }

    getThreadStateForWindow(
      windowState: any,
      conversationId: any,
      browserTabId: any,
    ) {
      return hX(windowState, conversationId, browserTabId);
    }

    getDetachedWindowStates(windowId: any) {
      return [...this.host.windows.values()].filter(
        (windowState: any) =>
          windowState.tabSourceWindow?.window.id === windowId &&
          !windowState.window.isDestroyed() &&
          !windowState.owner.isDestroyed(),
      );
    }

    getPageWindowState(route: any, browserTabId: any) {
      return (
        (browserTabId == null
          ? undefined
          : this.getDetachedWindowStates(route.windowId).find(
              (windowState: any) =>
                hX(windowState, route.conversationId, browserTabId) != null,
            )) ?? this.host.getLiveWindowState(route.windowId)
      );
    }

    getLiveWindowState(windowId: any) {
      let windowState = this.host.windows.get(windowId) ?? null;
      if (windowState == null) {
        const window = l.BrowserWindow.fromId(windowId);
        if (
          window != null &&
          !window.isDestroyed() &&
          !window.webContents.isDestroyed()
        ) {
          windowState = this.host.ensureWindowState(window, window.webContents);
        }
      }
      if (
        windowState == null ||
        windowState.window.isDestroyed() ||
        windowState.owner.isDestroyed()
      ) {
        logger().warning(`IAB_LIFECYCLE route window is not live`, {
          safe: {
            hasWindowState: windowState != null,
            ownerDestroyed: windowState?.owner.isDestroyed() ?? null,
            windowDestroyed: windowState?.window.isDestroyed() ?? null,
            windowId,
          },
          sensitive: {},
        });
        return null;
      }
      return windowState;
    }

    getFocusedOwnerWebContents() {
      const focusedWindow = l.BrowserWindow.getFocusedWindow();
      if (focusedWindow != null && !focusedWindow.isDestroyed())
        return focusedWindow.webContents;
      const liveWindows = l.BrowserWindow.getAllWindows().filter(
        (window: any) => !window.isDestroyed(),
      );
      if (liveWindows.length === 1) return liveWindows[0]?.webContents ?? null;
      if (this.host.lastSyncedWindowId != null) {
        const lastSynced = this.host.getLiveWindowState(
          this.host.lastSyncedWindowId,
        );
        if (lastSynced != null) return lastSynced.owner;
      }
      for (const windowState of this.host.windows.values()) {
        const live = this.host.getLiveWindowState(windowState.window.id);
        if (live != null) return live.owner;
      }
      return null;
    }

    getFocusedWindowState() {
      const focusedWindow = l.BrowserWindow.getFocusedWindow();
      return focusedWindow == null ||
        focusedWindow.isDestroyed() ||
        !this.host.windows.has(focusedWindow.id)
        ? null
        : this.host.getLiveWindowState(focusedWindow.id);
    }

    getPreferredWindowStateForConversation(conversationId: any) {
      let state = this.host.getFocusedWindowState();
      if (
        state == null ||
        state.owner.isDestroyed() ||
        !aXe(state, conversationId)
      )
        state = null;
      if (state == null && this.host.lastSyncedWindowId != null) {
        const lastSynced =
          this.host.windows.get(this.host.lastSyncedWindowId) ?? null;
        if (
          lastSynced != null &&
          !lastSynced.owner.isDestroyed() &&
          aXe(lastSynced, conversationId)
        )
          state = lastSynced;
      }
      if (state == null) {
        for (const candidate of this.host.windows.values()) {
          if (
            !candidate.owner.isDestroyed() &&
            aXe(candidate, conversationId)
          ) {
            state = candidate;
            break;
          }
        }
      }
      return state?.tabSourceWindow ?? state;
    }
    resolveBrowserUseOpenRequests(windowState: any) {
      this.host.browserUseOpenRequests.resolveForWindow(
        windowState,
        (request: any) =>
          gX(windowState, request.conversationId, request.browserTabId),
      );
    }
  };
}
