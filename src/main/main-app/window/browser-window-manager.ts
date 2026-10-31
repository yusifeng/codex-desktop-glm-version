// @ts-nocheck

/**
 * Creates the BrowserWindow manager while Electron and bundled runtime helpers remain adapters.
 * The returned class owns window registries, message queues, primary selection, creation, and cleanup.
 */
export function createBrowserWindowManagerClass(dependencies: Record<string, any>) {
  const { n, l, a, xot, IH, trafficLightPosition, titleBarOverlay, Yot, Xot, Zot, installDisplayChangeGeometryRefresh, isTrustedRendererSenderFrame, U, J, O9, initializeMcpSandbox, kot, Cot, r9, minimumWindowSize, windowOptions, supportsEmbeddedWebview, windowSurfaceColors, buildBrowserWindowOptions, S2e, RUe, uWe, lUe, uVe, installWindowTitlebarOverlaySync, rendererEntryUrl, rendererOrigin, Oe, De, isTrustedRendererFrameUrl, sameOrigin, MH, sameTrustedPath, isAppProtocolUrl, h, v, buildWindowErrorPage, installPrimaryWindowTracking, resolveAppearanceTheme, shouldHideInactiveWindow, isLargeEnoughForNativeWindow, shouldUseOpaqueWindows, BH, isOverlayAppearance, vibrancyForAppearance, bot, Not, installNativeContextMenu, installWebContentsDiagnostics, shouldRecoverRendererCrash, fT } = dependencies;
  return class BrowserWindowManager {
  applicationNetwork;
  options;
  browserCommentPopupWindowCreatedHandlers = new Set();
  browserCommentPopupOwnerResolver = null;
  primaryWindowChangedHandlers = new Set();
  readyWebContentsIds = new Set();
  pendingMessages = new Map();
  primaryWindows = new Set();
  primaryWindowLastActiveAtMs = new WeakMap();
  lastActivePrimaryWindow = null;
  lastNotifiedPrimaryWindow = null;
  windowAppearances = new Map();
  registeredWindowIds = new Set();
  registeredWebContentsIds = new Set();
  appServiceWindowIds = new Set();
  webContentsHostIds = new Map();
  opaqueWindowSurfaceModes = new Map();
  windowZooms = new Map();
  appShellShortcutStates = new Map();
  historySwipeNavigationStates = new WeakMap();
  appShellCommandKeymapState = n.Ct();
  appShellCloseTabAccelerators = n.At({
    commandId: `closeTab`,
    keymapState: this.appShellCommandKeymapState,
    isMacOS: process.platform === `darwin`,
  });
  debugWindowManager;
  isAppQuitting = !1;
  isSystemFocusSuppressed = !1;
  clearPendingActiveSpaceRefocus = null;
  pendingAuxiliaryActivationTarget = null;
  pendingAuxiliaryActivationTargetCleanup = null;
  rendererRecoveryAttempts = new Set();
  threadMetadataService;
  constructor(e, t) {
    ((this.applicationNetwork = e),
      (this.options = t),
      initializeMcpSandbox(),
      (this.threadMetadataService = new kot(t.globalState, () =>
        this.sendMessageToAllWindows({
          type: `global-state-updated`,
          keys: [n.iu.SIDEBAR_THREAD_METADATA],
        }),
      )),
      (this.debugWindowManager = this.options.allowDebugMenu
        ? new Cot({
            createWindow: (e) => this.createWindow(e),
            sendMessageToWindow: (e, t) => this.sendMessageToWindow(e, t),
            showWindow: (e, t) => this.showWindow(e, t),
          })
        : null));
  }
  setOnMainProcessInspectorStateChanged(e) {
    this.options.onMainProcessInspectorStateChanged = e;
  }
  setSystemFocusSuppressed(e) {
    this.isSystemFocusSuppressed = e;
  }
  setQueueCodexDeepLinkUrl(e) {
    this.options.queueCodexDeepLinkUrl = e;
  }
  subscribePrimaryWindowChanges(e) {
    return (
      this.primaryWindowChangedHandlers.add(e),
      e(this.getPrimaryWindow()),
      () => {
        this.primaryWindowChangedHandlers.delete(e);
      }
    );
  }
  refreshAppShellCommandAccelerators() {
    ((this.appShellCommandKeymapState = n.Ct()),
      (this.appShellCloseTabAccelerators = n.At({
        commandId: `closeTab`,
        keymapState: this.appShellCommandKeymapState,
        isMacOS: process.platform === `darwin`,
      })));
  }
  queueCodexDeepLinkUrl(e, t) {
    return this.options.queueCodexDeepLinkUrl?.(e, t) === !0;
  }
  async openLinkInPreferredTarget(e, t, n) {
    return IH({
      request: t,
      targetWebContents: e,
      windowManager: this,
      isDefaultBrowser: this.options.isDefaultBrowser?.() === !0,
      settingsStore: this.options.settingsStore,
      queueCodexDeepLinkUrl: this.queueCodexDeepLinkUrl.bind(this),
      errorKind: n,
      errorReporter: this.options.errorReporter,
    });
  }
  markWebContentsReady(e) {
    (this.readyWebContentsIds.add(e.id), this.flushPendingMessages(e));
  }
  forgetWebContents(e) {
    (this.readyWebContentsIds.delete(e),
      this.pendingMessages.delete(e),
      this.appShellShortcutStates.delete(e),
      this.debugWindowManager?.forgetWebContents(e));
  }
  isWebContentsReady(e) {
    return this.readyWebContentsIds.has(e);
  }
  setAppShellShortcutState(e, t) {
    this.appShellShortcutStates.set(e, t);
  }
  setWindowZoom(e, t) {
    let n = l.BrowserWindow.fromWebContents(e),
      r = n && this.windowAppearances.get(n.id);
    n == null ||
      (r !== `primary` && r !== `quickChat`) ||
      (process.platform === `darwin`
        ? n.setWindowButtonPosition(trafficLightPosition(t))
        : (process.platform === `win32` || process.platform === `linux`) &&
          (this.windowZooms.set(n.id, t), n.setTitleBarOverlay(titleBarOverlay(t))));
  }
  setHistorySwipeNavigationState(e, t) {
    let n = l.BrowserWindow.fromWebContents(e);
    n != null &&
      this.windowAppearances.get(n.id) === `primary` &&
      (this.historySwipeNavigationStates.set(n, t),
      process.platform === `darwin` &&
        n.setHistorySwipeNavigationState({
          ...t,
          overlayBounds: t.overlayBounds ?? void 0,
          overlayColor: t.overlayColor ?? void 0,
        }));
  }
  getAppShellShortcutState(e) {
    return this.appShellShortcutStates.get(e) ?? null;
  }
  get appQuitting() {
    return this.isAppQuitting;
  }
  markAppQuitting() {
    this.isAppQuitting = !0;
    let e = this.getPrimaryWindow();
    e && this.persistPrimaryWindowBounds(e);
  }
  showPrimaryWindow(e) {
    let t = this.getPrimaryWindow();
    return this.showWindow(t, e);
  }
  showLastActivePrimaryWindow() {
    let e = this.lastActivePrimaryWindow;
    if (e != null && !e.isDestroyed()) return this.showWindow(e) ? e : null;
    this.lastActivePrimaryWindow = null;
    let t = this.getPrimaryWindow();
    return this.showWindow(t) ? t : null;
  }
  isHotkeyWindowThread(e) {
    return this.windowAppearances.get(e.id) === `hotkeyWindowThread`;
  }
  isAvatarOverlayWindow(e) {
    return this.windowAppearances.get(e.id) === `avatarOverlay`;
  }
  showWindow(e, t) {
    if (!e) return !1;
    e.isMinimized() && e.restore();
    let n = t?.stealFocus === !0 && process.platform === `win32` && !e.isAlwaysOnTop();
    return (
      n && e.setAlwaysOnTop(!0),
      t?.focusComposer === !0 &&
        t.stealFocus === !0 &&
        process.platform === `darwin` &&
        (!e.isFocused() || e.isFullScreen()) &&
        this.refocusAfterActiveSpaceChange(e),
      e.show(),
      t?.stealFocus === !0 && process.platform === `darwin` && l.app.focus({ steal: !0 }),
      e.focus(),
      t?.focusComposer === !0 && this.sendMessageToWindow(e, { type: `focus-composer` }),
      n && e.setAlwaysOnTop(!1),
      !0
    );
  }
  refocusAfterActiveSpaceChange(e) {
    this.clearPendingActiveSpaceRefocus?.();
    let t = null,
      n = null,
      r = !0,
      i = () => {
        r &&
          ((r = !1),
          n != null && clearTimeout(n),
          t?.(),
          (t = null),
          e.off(`closed`, i),
          this.clearPendingActiveSpaceRefocus === i &&
            (this.clearPendingActiveSpaceRefocus = null));
      },
      a = () => {
        if (!r || (i(), e.isDestroyed())) return;
        let t = e.webContents;
        t.isDestroyed() ||
          (l.app.focus({ steal: !0 }),
          e.focus(),
          t.focus(),
          this.sendMessageToWindow(e, { type: `focus-composer` }));
      };
    if (
      typeof l.systemPreferences.subscribeWorkspaceNotification == `function` &&
      typeof l.systemPreferences.unsubscribeWorkspaceNotification == `function`
    ) {
      let e = l.systemPreferences.subscribeWorkspaceNotification(
        `NSWorkspaceActiveSpaceDidChangeNotification`,
        a,
      );
      ((t = () => {
        l.systemPreferences.unsubscribeWorkspaceNotification(e);
      }),
        (n = setTimeout(i, Yot)));
    } else n = setTimeout(a, Xot);
    (e.on(`closed`, i), (this.clearPendingActiveSpaceRefocus = i));
  }
  sendMessageToWindow(e, t) {
    this.sendMessageToWebContents(e.webContents, t);
  }
  shouldSyncPersistedAtom(e, t) {
    if (!xot.has(t)) return !0;
    let n = l.BrowserWindow.fromWebContents(e);
    return n == null || !this.isAvatarOverlayWindow(n);
  }
  sendMessageToAllRegisteredWindows(e) {
    this.sendMessageToAllWindows(e);
  }
  sendMessageToAllWindows(e) {
    for (let t of l.BrowserWindow.getAllWindows())
      t.isDestroyed() ||
        (this.appServiceWindowIds.has(t.id) &&
          (!this.isAvatarOverlayWindow(t) ||
            t.isVisible() ||
            e.type === `avatar-overlay-open-state-changed`) &&
          this.sendMessageToWindow(t, e));
  }
  sendMessageToWebContents(e, t, n) {
    if (
      e.isDestroyed() ||
      (t.type === `persisted-atom-updated` && !this.shouldSyncPersistedAtom(e, t.key))
    )
      return;
    if (this.isWebContentsReady(e.id)) {
      if (n?.priority === `critical` && this.options.chunkedMessageSender != null) {
        this.options.chunkedMessageSender.sendCritical(e, a.At, t);
        return;
      }
      this.sendInlineMessageForView(e, t);
      return;
    }
    let r = this.pendingMessages.get(e.id) ?? [];
    (r.push({ message: t, priority: n?.priority }), this.pendingMessages.set(e.id, r));
  }
  sendInlineMessageForView(e, t) {
    if (this.options.chunkedMessageSender != null) {
      this.options.chunkedMessageSender.sendInlineMessageForView(e, t);
      return;
    }
    e.isDestroyed() || e.send(a.At, t);
  }
  sendMessageToWebContentsId(e, t) {
    for (let n of l.BrowserWindow.getAllWindows())
      if (!(n.isDestroyed() || n.webContents.id !== e)) {
        this.sendMessageToWebContents(n.webContents, t);
        return;
      }
  }
  getPrimaryWindow() {
    let e = this.lastActivePrimaryWindow;
    if (e != null && !e.isDestroyed() && this.primaryWindows.has(e)) return e;
    let t = this.getPrimaryWindows(),
      n = t.at(-1) ?? null,
      r = -1;
    for (let e of t) {
      let t = this.primaryWindowLastActiveAtMs.get(e) ?? -1;
      t > r && ((n = e), (r = t));
    }
    return n
      ? ((this.lastActivePrimaryWindow = n), n)
      : ((this.lastActivePrimaryWindow = null), null);
  }
  getPrimaryWindows() {
    return this.getTrackedPrimaryWindows();
  }
  wasPrimaryWindowFocusedWithin(e, t) {
    if (!this.primaryWindows.has(e) || e.isDestroyed()) return !1;
    if (e.isFocused()) return !0;
    let n = this.primaryWindowLastActiveAtMs.get(e);
    return n != null && Date.now() - n <= t;
  }
  refreshWindowBackdrops() {
    for (let e of l.BrowserWindow.getAllWindows()) {
      if (e.isDestroyed() || !this.registeredWindowIds.has(e.id)) continue;
      let t = this.windowAppearances.get(e.id);
      t != null && this.applyWindowBackdrop(e, t, !0);
    }
  }
  refreshWindowGeometryAfterDisplayChange(e) {
    if (e.isDestroyed() || !this.appServiceWindowIds.has(e.id)) return;
    let t = e.webContents;
    t.isDestroyed() ||
      (t.invalidate?.(),
      !(e.isMinimized() || e.isMaximized() || e.isFullScreen()) && e.setBounds(e.getBounds(), !1));
  }
  installDisplayChangeGeometryRefresh(e) {
    return installDisplayChangeGeometryRefresh({
      platform: process.platform,
      screen: l.screen,
      refresh: () => this.refreshWindowGeometryAfterDisplayChange(e),
    });
  }
  hasRegisteredWebContents(e) {
    return this.registeredWebContentsIds.has(e.id);
  }
  isAppServiceWindow(e) {
    return this.appServiceWindowIds.has(e.id);
  }
  setPendingAuxiliaryActivationTarget(e) {
    if ((this.pendingAuxiliaryActivationTargetCleanup?.(), e.isDestroyed() || e.isFocused()))
      return;
    let t = null,
      n = () => {
        (t != null && (clearTimeout(t), (t = null)),
          e.off(`focus`, r),
          e.off(`closed`, i),
          this.pendingAuxiliaryActivationTargetCleanup === n &&
            ((this.pendingAuxiliaryActivationTargetCleanup = null),
            (this.pendingAuxiliaryActivationTarget = null)));
      },
      r = () => n(),
      i = () => n();
    ((this.pendingAuxiliaryActivationTarget = e),
      (this.pendingAuxiliaryActivationTargetCleanup = n),
      e.on(`focus`, r),
      e.on(`closed`, i),
      (t = setTimeout(() => {
        n();
      }, Zot)));
  }
  clearPendingAuxiliaryActivationTarget(e) {
    this.pendingAuxiliaryActivationTarget === e && this.pendingAuxiliaryActivationTargetCleanup?.();
  }
  hasPendingAuxiliaryActivationTarget() {
    let e = this.pendingAuxiliaryActivationTarget;
    return e == null
      ? !1
      : e.isDestroyed() || e.webContents.isDestroyed()
        ? (this.pendingAuxiliaryActivationTargetCleanup?.(), !1)
        : !0;
  }
  registerAuxiliaryWindow(e, t, n) {
    this.registerWindow(e, J, !1, t, n);
  }
  getHostIdForWebContents(e) {
    return this.webContentsHostIds.get(e.id) ?? null;
  }
  getRendererWindowLogFields(e) {
    let t = l.BrowserWindow.fromWebContents(e),
      n = t != null && !t.isDestroyed();
    return {
      rendererWebContentsId: e.id,
      rendererWindowId: n ? t.id : null,
      rendererWindowAppearance: n ? (this.windowAppearances.get(t.id) ?? null) : null,
      rendererWindowVisible: n ? t.isVisible() : null,
      rendererWindowFocused: n ? t.isFocused() : null,
    };
  }
  isTrustedIpcSender(e, t) {
    return e.id != null && !this.registeredWebContentsIds.has(e.id)
      ? !1
      : isTrustedRendererSenderFrame({ sender: e, senderFrame: t, moduleDir: this.options.moduleDir });
  }
  isMainProcessInspectorEnabled() {
    return U.url() != null;
  }
  async toggleMainProcessInspector() {
    throw Error(`Feature unavailable.`);
  }
  async createWindow(e = {}) {
    let t =
        process.platform === `win32` && (e.appearance ?? `primary`) === `primary`
          ? l.screen.getPrimaryDisplay().workArea
          : null,
      {
        title: r,
        width: i = t == null ? r9 : Math.max(480, Math.min(r9, Math.round(t.width * 0.85))),
        height: o = t == null ? 820 : Math.max(600, Math.min(820, Math.round(t.height * 0.8))),
        appearance: s = `primary`,
        show: c = !0,
        initialRoute: u,
        hostId: d = J,
        parent: f,
        focusable: p,
        lockTitle: m = !1,
        supportsWindowTiling: g,
      } = e,
      _ = Date.now(),
      y = s === `primary` ? J : d,
      b = s === `primary`,
      x = b ? this.restorePrimaryWindowBounds() : null,
      S = x?.width ?? i,
      C = x?.height ?? o,
      w = x?.x ?? (t == null ? void 0 : t.x + Math.round((t.width - S) / 2)),
      T = x?.y ?? (t == null ? void 0 : t.y + Math.round((t.height - C) / 2)),
      E = x?.isMaximized === !0,
      D = minimumWindowSize(s, this.getPrimaryMinimumSize()),
      O = this.shouldAlwaysUseOpaqueWindowSurface(s),
      k = windowOptions({ appearance: s, opaqueWindowSurfaceEnabled: O, platform: process.platform }),
      A = supportsEmbeddedWebview(s),
      j = A && this.options.allowMcpAppSandboxLocalDevelopment === !0,
      M = {
        preload: this.options.preloadPath,
        backgroundThrottling: s !== `avatarOverlay` && void 0,
        contextIsolation: !0,
        nodeIntegration: !1,
        spellcheck: !0,
        scrollBounce: process.platform === `darwin` && s === `primary`,
        devTools: this.options.allowDevtools,
        ...(A ? { webviewTag: !0 } : {}),
      },
      { backgroundColor: N, backgroundMaterial: P } = windowSurfaceColors({
        platform: process.platform,
        appearance: s,
        opaqueWindowSurfaceEnabled: O,
        prefersDarkColors: l.nativeTheme.shouldUseDarkColors,
      }),
      F = buildBrowserWindowOptions({
        width: S,
        height: C,
        x: w,
        y: T,
        title: r ?? l.app.getName(),
        icon: this.options.windowIconPath,
        backgroundColor: N,
        show: c,
        parent: f,
        focusable: p,
        autoHideMenuBar: process.platform === `win32` || process.platform === `linux`,
        backgroundMaterial: P,
        hasNativeGlass: process.platform === `darwin` && s === `avatarOverlay`,
        supportsWindowTiling: g,
        appearanceOptions: k,
        minWidth: D?.width,
        minHeight: D?.height,
        webPreferences: M,
      }),
      I = new l.BrowserWindow(F);
    this.applyWindowBackdrop(I, s, !0);
    let L = I.webContents;
    s === `avatarOverlay` && L.setBackgroundThrottling(!1);
    let R = L.id;
    (A &&
      (S2e(L, j, {
        applicationNetwork: this.applicationNetwork,
        allowNonMcpAppSandboxWebviews: s === `primary` || s === `detached`,
        navigation: {
          getAccelerators: (e) =>
            n.At({
              commandId: e,
              keymapState: this.appShellCommandKeymapState,
              isMacOS: process.platform === `darwin`,
            }),
          run: (e) => {
            this.sendMessageToWebContents(L, { type: `run-command`, id: e });
          },
        },
      }),
      s === `primary` &&
        (RUe({
          getAuthToken: this.options.getChatGptWebviewAuthToken,
          onBusinessCheckoutComplete: (e) => {
            L.isDestroyed() ||
              this.sendInlineMessageForView(L, {
                type: `business-checkout-complete`,
                workspaceId: e,
              });
          },
          onPersonalCheckoutComplete: (e) => {
            L.isDestroyed() ||
              this.sendInlineMessageForView(L, { type: `personal-checkout-complete`, planType: e });
          },
          onPurchaseCheckoutComplete: (e) => {
            L.isDestroyed() ||
              (e.kind === `rate-limit-reset`
                ? this.sendInlineMessageForView(L, {
                    type: `rate-limit-reset-checkout-complete`,
                    outcome: e.outcome,
                  })
                : this.sendInlineMessageForView(L, { type: `credit-purchase-checkout-complete` }));
          },
          onReturnToCodex: () => {
            L.isDestroyed() || this.sendInlineMessageForView(L, { type: `navigate-back` });
          },
          owner: L,
        }),
        uWe({
          getAuthToken: this.options.getChatGptWebviewAuthToken,
          onReturnToCodex: () => {
            L.isDestroyed() || this.sendInlineMessageForView(L, { type: `navigate-back` });
          },
          owner: L,
        }),
        lUe({ getAuthToken: this.options.getChatGptWebviewAuthToken, owner: L }))),
      I.webContents.once(`did-finish-load`, () => {
        (I.webContents.setZoomLevel(0),
          O9().info(`window main frame finished load`, {
            safe: {
              hostId: y,
              windowId: I.id,
              webContentsId: I.webContents.id,
              appearance: s,
              startupElapsedMs: Date.now() - _,
            },
          }));
      }),
      I.once(`ready-to-show`, () => {
        O9().info(`window ready-to-show`, {
          safe: {
            hostId: y,
            windowId: I.id,
            webContentsId: I.webContents.id,
            appearance: s,
            startupElapsedMs: Date.now() - _,
          },
        });
      }));
    let z = this.installApplicationMenuTitleBarOverlaySync(I, s),
      B = this.installDisplayChangeGeometryRefresh(I),
      V = () => {
        this.applyWindowBackdrop(I, s, !1);
      },
      ee = () => {
        this.sendMessageToWindow(I, { type: `electron-window-position-changed` });
      };
    if (
      (I.on(`move`, ee),
      process.platform === `darwin` &&
        (I.on(`move`, V),
        I.on(`resize`, V),
        s === `primary` &&
          I.on(`swipe`, (e, t) => {
            let n = this.historySwipeNavigationStates.get(I);
            t === `left` && n?.canGoBack === !0
              ? this.sendMessageToWindow(I, { type: `navigate-back` })
              : t === `right` &&
                n?.canGoForward === !0 &&
                this.sendMessageToWindow(I, { type: `navigate-forward` });
          })),
      (process.platform === `win32` || process.platform === `linux`) && I.removeMenu(),
      I.on(`closed`, () => {
        (z?.(),
          B?.(),
          I.removeListener(`move`, ee),
          process.platform === `darwin` &&
            (I.removeListener(`move`, V), I.removeListener(`resize`, V)));
      }),
      (m ||
        s === `primary` ||
        s === `hud` ||
        s === `hotkeyWindowHome` ||
        s === `hotkeyWindowThread`) &&
        I.on(`page-title-updated`, (e) => {
          (e.preventDefault(), I.isDestroyed() || I.setTitle(I.getTitle()));
        }),
      this.installWebContentsDiagnostics(I, s),
      this.registerWindow(I, y, b, s, `register`),
      e.onCreated?.(I),
      I.isDestroyed())
    )
      return I;
    b &&
      I.on(`close`, (e) => {
        this.persistPrimaryWindowBounds(I);
        let t = this.getPrimaryWindows().some((e) => e !== I);
        if (
          (process.platform === `win32` || process.platform === `linux`) &&
          !this.isAppQuitting &&
          this.options.canHideLastWindowToTray?.() === !0 &&
          !t
        ) {
          (e.preventDefault(), I.hide());
          return;
        }
        if (process.platform === `darwin` && !this.isAppQuitting && !t) {
          if (I.isFullScreen()) {
            (e.preventDefault(),
              I.once(`leave-full-screen`, () => {
                I.isDestroyed() || I.hide();
              }),
              I.setFullScreen(!1));
            return;
          }
          (e.preventDefault(), I.hide());
        }
      });
    let te = () => {
      this.sendMessageToWindow(I, {
        type: `window-fullscreen-changed`,
        isFullScreen: I.isFullScreen(),
      });
    };
    (I.on(`enter-full-screen`, te), I.on(`leave-full-screen`, te), te());
    let ne = () => {
        this.applyWindowBackdrop(I, s, !1);
        let e = !this.isSystemFocusSuppressed && I.isFocused();
        this.sendMessageToWindow(I, {
          type: `electron-window-focus-changed`,
          isFocused: e,
          ...(e ? {} : { occurredAtMs: Date.now() }),
        });
      },
      H = uVe({
        allowDebugMenu: this.options.allowDebugMenu,
        getCloseTabAccelerators: () => this.appShellCloseTabAccelerators,
        getCommandKeymapState: () => this.appShellCommandKeymapState,
        getState: () => this.appShellShortcutStates.get(R) ?? null,
        sendAction: (e) => {
          this.sendMessageToWebContents(L, e);
        },
      });
    (I.on(`focus`, ne),
      I.on(`blur`, ne),
      I.on(`show`, ne),
      I.on(`hide`, ne),
      L.on(`before-input-event`, H),
      ne(),
      E &&
        I.once(`ready-to-show`, () => {
          I.isDestroyed() || I.maximize();
        }));
    let re = rendererOrigin();
    (I.webContents.setWindowOpenHandler(({ disposition: e, url: t, frameName: n }) => {
      let r = Oe(n);
      if (
        r?.windowId === De.BROWSER_COMMENT_POPUP &&
        this.browserCommentPopupWindowCreatedHandlers.size > 0 &&
        t === `about:blank` &&
        s === `primary` &&
        isTrustedRendererFrameUrl(I.webContents.getURL(), this.options.moduleDir)
      ) {
        let e = this.getBrowserCommentPopupOwner(I.webContents, r.conversationId, r.browserTabId),
          t = e == null ? null : l.BrowserWindow.fromWebContents(e);
        return t == null || t.isDestroyed()
          ? { action: `deny` }
          : {
              action: `allow`,
              outlivesOpener: !1,
              overrideBrowserWindowOptions: this.createBrowserCommentPopupWindowOptions(t),
            };
      }
      return re && sameOrigin(t, re)
        ? { action: `allow` }
        : (MH(t) &&
            this.openLinkInPreferredTarget(
              I.webContents,
              {
                url: t,
                disposition: e === `background-tab` ? `new-background-tab` : void 0,
                openTargetIntent:
                  e === `foreground-tab` || e === `background-tab` ? `default` : void 0,
                source: `manual`,
                initiator: `window_open`,
              },
              `open-external-window`,
            ),
          { action: `deny` });
    }),
      I.webContents.on(`did-create-window`, (e, t) => {
        let n = Oe(t.frameName);
        if (n?.windowId !== De.BROWSER_COMMENT_POPUP || t.url !== `about:blank` || s !== `primary`)
          return;
        let r = this.getBrowserCommentPopupOwner(I.webContents, n.conversationId, n.browserTabId),
          i = r == null ? null : l.BrowserWindow.fromWebContents(r);
        if (r == null || i == null || i.isDestroyed() || e.getParentWindow() !== i) {
          e.close();
          return;
        }
        (e.setMenuBarVisibility(!1),
          e.setVisibleOnAllWorkspaces(!1),
          process.platform === `win32` && e.removeMenu(),
          e.hide(),
          this.installNativeContextMenu(e));
        for (let t of this.browserCommentPopupWindowCreatedHandlers)
          t({
            browserTabId: n.browserTabId,
            conversationId: n.conversationId,
            hostId: this.getHostIdForWebContents(r) ?? y,
            owner: r,
            sessionId: n.sessionId,
            window: e,
          });
      }),
      I.on(`closed`, () => {
        (this.appShellShortcutStates.delete(R),
          !L.isDestroyed() && L.removeListener(`before-input-event`, H));
      }),
      I.webContents.on(`will-navigate`, (e, t) => {
        sameTrustedPath(t, I.webContents.getURL(), re) ||
          (e.preventDefault(),
          MH(t) &&
            this.openLinkInPreferredTarget(
              I.webContents,
              { url: t, source: `manual`, initiator: `window_open` },
              `open-external-navigation`,
            ));
      }),
      I.webContents.on(`will-frame-navigate`, (e) => {
        !e.isMainFrame && isAppProtocolUrl(e.url) && e.preventDefault();
      }),
      I.webContents.on(`will-redirect`, (e, t) => {
        let n = e.url ?? t;
        !e.isMainFrame && isAppProtocolUrl(n) && e.preventDefault();
      }),
      this.installNativeContextMenu(I));
    let U = a.dn(u);
    if (!l.app.isPackaged) {
      let e = new URL(rendererEntryUrl());
      return (
        U !== `index.html` && (e.pathname = new URL(U, e).pathname),
        u && e.searchParams.set(`initialRoute`, u),
        j && e.searchParams.set(`mcpAppSandboxLocalDevelopment`, `1`),
        I.loadURL(e.toString()),
        I
      );
    }
    let ie = a.ln(this.options.moduleDir),
      ae = (0, h.join)(ie, U);
    if ((0, v.existsSync)(ae))
      try {
        return (await I.loadURL(a.cn(u, { mcpAppSandboxLocalDevelopment: j })), I);
      } catch (e) {
        O9().warning(`Failed to load bundle at`, {
          safe: {},
          sensitive: { documentPath: ae, error: e },
        });
      }
    let oe = `data:text/html;charset=utf-8,${encodeURIComponent(buildWindowErrorPage())}`;
    return (await I.loadURL(oe), I);
  }
  async createPrimaryWindow(e = {}) {
    return this.createWindow({ ...e, appearance: `primary` });
  }
  addBrowserCommentPopupWindowCreatedHandler(e) {
    return (
      this.browserCommentPopupWindowCreatedHandlers.add(e),
      () => {
        this.browserCommentPopupWindowCreatedHandlers.delete(e);
      }
    );
  }
  setBrowserCommentPopupOwnerResolver(e) {
    this.browserCommentPopupOwnerResolver = e;
  }
  getBrowserCommentPopupOwner(e, t, n) {
    let r = this.browserCommentPopupOwnerResolver?.(e, t, n);
    if (r == null) return e;
    let i = l.BrowserWindow.fromWebContents(r);
    return r.isDestroyed() ||
      i == null ||
      i.isDestroyed() ||
      this.windowAppearances.get(i.id) !== `detached` ||
      !this.registeredWebContentsIds.has(r.id)
      ? null
      : r;
  }
  createBrowserCommentPopupWindowOptions(e) {
    let t = `browserCommentPopup`,
      n = this.shouldAlwaysUseOpaqueWindowSurface(t),
      { backgroundColor: r, backgroundMaterial: i } = windowSurfaceColors({
        platform: process.platform,
        appearance: t,
        opaqueWindowSurfaceEnabled: n,
        prefersDarkColors: l.nativeTheme.shouldUseDarkColors,
      });
    return {
      title: ``,
      width: 294,
      height: 208,
      parent: e,
      show: !1,
      backgroundColor: r,
      backgroundMaterial: i ?? void 0,
      ...windowOptions({ appearance: t, opaqueWindowSurfaceEnabled: n, platform: process.platform }),
      webPreferences: {
        contextIsolation: !0,
        nodeIntegration: !1,
        spellcheck: !0,
        devTools: this.options.allowDevtools,
      },
    };
  }
  registerWindow(e, t, n, r, i) {
    let a = e.id,
      o = e.webContents.id;
    (this.windowAppearances.set(a, r),
      this.registeredWindowIds.add(a),
      this.registeredWebContentsIds.add(o),
      i === `register` && this.appServiceWindowIds.add(a),
      this.webContentsHostIds.set(o, t),
      n && this.trackPrimaryWindow(e),
      e.on(`closed`, () => {
        (this.forgetWebContents(o),
          this.windowAppearances.delete(a),
          this.registeredWindowIds.delete(a),
          this.registeredWebContentsIds.delete(o),
          this.appServiceWindowIds.delete(a),
          this.webContentsHostIds.delete(o),
          this.opaqueWindowSurfaceModes.delete(a),
          this.windowZooms.delete(a),
          n &&
            (this.primaryWindows.delete(e),
            this.lastActivePrimaryWindow === e && (this.lastActivePrimaryWindow = null),
            this.emitPrimaryWindowChangeIfNeeded()));
      }),
      i === `register` && this.options.onWindowRegistered?.(e));
  }
  trackPrimaryWindow(e) {
    installPrimaryWindowTracking({
      isFocused: () => e.isFocused(),
      now: () => Date.now(),
      addPrimaryWindow: () => this.primaryWindows.add(e),
      setLastActiveWindow: () => { this.lastActivePrimaryWindow = e; },
      setLastActiveAt: (timestamp) => this.primaryWindowLastActiveAtMs.set(e, timestamp),
      hasLastActiveWindow: () => this.lastActivePrimaryWindow != null,
      emitChange: () => this.emitPrimaryWindowChangeIfNeeded(),
      on: (event, listener) => e.on(event, listener),
    });
  }
  emitPrimaryWindowChangeIfNeeded() {
    let e = this.getPrimaryWindow();
    if (e !== this.lastNotifiedPrimaryWindow) {
      this.lastNotifiedPrimaryWindow = e;
      for (let t of this.primaryWindowChangedHandlers) t(e);
    }
  }
  getTrackedPrimaryWindows() {
    let e = [];
    for (let t of this.primaryWindows) {
      if (t.isDestroyed()) {
        this.primaryWindows.delete(t);
        continue;
      }
      e.push(t);
    }
    return this.primaryWindows.size === 0
      ? ((this.lastActivePrimaryWindow = null), [])
      : (this.lastActivePrimaryWindow?.isDestroyed() && (this.lastActivePrimaryWindow = null), e);
  }
  restorePrimaryWindowBounds() {
    let e = this.options.globalState.get(`electron-main-window-bounds`) ?? null;
    if (!e) return null;
    let t = this.clampPrimaryWindowBounds(e);
    return this.isWithinDisplayWorkArea(t) ? t : null;
  }
  getPrimaryMinimumSize() {
    return { width: 480, height: 600 };
  }
  syncPrimaryMinimumSize() {
    let e = this.getPrimaryWindows();
    if (e.length === 0) return;
    let t = this.getPrimaryMinimumSize();
    for (let n of e) {
      if ((n.setMinimumSize(t.width, t.height), n.isMaximized() || n.isFullScreen())) continue;
      let e = n.getNormalBounds(),
        r = Math.max(e.width, t.width),
        i = Math.max(e.height, t.height);
      (r !== e.width || i !== e.height) && n.setBounds({ ...e, width: r, height: i });
    }
    let n = this.getPrimaryWindow();
    n && this.persistPrimaryWindowBounds(n);
  }
  persistPrimaryWindowBounds(e) {
    if (e.isDestroyed()) return;
    let t = e.getNormalBounds(),
      n = this.getPrimaryMinimumSize(),
      r = {
        x: t.x,
        y: t.y,
        width: Math.max(t.width, n.width),
        height: Math.max(t.height, n.height),
        isMaximized: e.isMaximized(),
      };
    this.options.globalState.set(`electron-main-window-bounds`, r);
  }
  clampPrimaryWindowBounds(e) {
    let t = this.getPrimaryMinimumSize();
    return { ...e, width: Math.max(e.width, t.width), height: Math.max(e.height, t.height) };
  }
  flushPendingMessages(e) {
    let t = this.pendingMessages.get(e.id);
    if (!t || t.length === 0) {
      this.pendingMessages.delete(e.id);
      return;
    }
    if ((this.pendingMessages.delete(e.id), !e.isDestroyed()))
      for (let { message: n, priority: r } of t)
        this.sendMessageToWebContents(e, n, { priority: r });
  }
  isWithinDisplayWorkArea(e) {
    let t = l.screen.getAllDisplays();
    if (t.length === 0) return !0;
    let n = { x: e.x, y: e.y, width: e.width, height: e.height };
    return t.some((e) => {
      let t = e.workArea;
      return (
        t.x < n.x + n.width && t.x + t.width > n.x && t.y < n.y + n.height && t.y + t.height > n.y
      );
    });
  }
  installApplicationMenuTitleBarOverlaySync(e, t) {
    return installWindowTitlebarOverlaySync({
      platform: process.platform,
      appearance: t,
      eligibleAppearances: new Set([`primary`, `quickChat`, `detached`]),
      nativeTheme: l.nativeTheme,
      isDestroyed: () => e.isDestroyed(),
      setTitleBarOverlay: (options) => e.setTitleBarOverlay(options),
      getOverlay: () => titleBarOverlay(this.windowZooms.get(e.id)),
    });
  }
  isOpaqueWindowsEnabled() {
    return (
      (resolveAppearanceTheme(this.options.settingsStore.getEffective(n.Ha.theme.key) ?? `system`) === `light`
        ? this.options.settingsStore.getEffective(n.Ha.lightChromeTheme.key)
        : this.options.settingsStore.getEffective(n.Ha.darkChromeTheme.key)
      )?.opaqueWindows === !0
    );
  }
  shouldUseOpaqueWindowSurface(e, t, n) {
    let r = l.screen.getDisplayMatching(t);
    return (
      this.shouldAlwaysUseOpaqueWindowSurface(e) ||
      shouldHideInactiveWindow({ appearance: e, isFocused: n, platform: process.platform }) ||
      isLargeEnoughForNativeWindow({
        appearance: e,
        platform: process.platform,
        scaleFactor: r.scaleFactor,
        windowBounds: t,
      })
    );
  }
  shouldAlwaysUseOpaqueWindowSurface(e) {
    return (
      shouldUseOpaqueWindows({
        appearance: e,
        opaqueWindowsEnabled: this.isOpaqueWindowsEnabled(),
        platform: process.platform,
      }) ||
      (!BH() && !isOverlayAppearance(e))
    );
  }
  applyWindowBackdrop(e, t, n) {
    let r = e.getBounds(),
      i = this.shouldUseOpaqueWindowSurface(t, r, e.isFocused());
    if (!n && this.opaqueWindowSurfaceModes.get(e.id) === i) return;
    let { backgroundColor: a, backgroundMaterial: o } = windowSurfaceColors({
      platform: process.platform,
      appearance: t,
      opaqueWindowSurfaceEnabled: i,
      prefersDarkColors: l.nativeTheme.shouldUseDarkColors,
    });
    (e.setBackgroundColor(a),
      o != null && e.setBackgroundMaterial(o),
      process.platform === `darwin` && e.setVibrancy(vibrancyForAppearance(t, i)),
      this.opaqueWindowSurfaceModes.set(e.id, i),
      this.sendMessageToWindow(e, {
        type: `electron-window-opaque-surface-changed`,
        opaqueWindowSurfaceEnabled: i,
      }));
  }
  installNativeContextMenu(e) {
    return installNativeContextMenu({
      window: e,
      createContextMenu: bot,
      revealLabel: Not,
      showItemInFolder: (path) => l.shell.showItemInFolder(path),
      sendVisualContentAction: (action) =>
        this.sendMessageToWindow(e, {
          type: `visual-content-action-clicked`,
          action,
          surface: `native-image-context-menu`,
        }),
      allowInspectElement: this.options.allowInspectElement,
    });
  }
  installWebContentsDiagnostics(e, t) {
    const webContents = e.webContents;
    installWebContentsDiagnostics({
      webContents,
      windowId: e.id,
      webContentsId: webContents.id,
      appearance: t,
      errorReporter: this.options.errorReporter,
      isAppQuitting: () => this.isAppQuitting,
      maybeRecoverFromRendererCrash: (reason) => this.maybeRecoverFromRendererCrash(e, reason),
      clearRecoveryAttempt: () => this.rendererRecoveryAttempts.delete(webContents.id),
      onPrimaryRendererGone: () => {
        this.readyWebContentsIds.delete(webContents.id);
        this.sendMessageToWindow(e, { type: `codex-ui-render-process-gone` });
      },
      formatUrl: (url) => fT(url),
    });
  }
  maybeRecoverFromRendererCrash(e, t) {
    let n = e.webContents;
    if (!shouldRecoverRendererCrash({ isAppQuitting: this.isAppQuitting, reason: t, isWindowDestroyed: e.isDestroyed(), isWebContentsDestroyed: n.isDestroyed(), alreadyAttempted: this.rendererRecoveryAttempts.has(n.id) })) return !1;
    return (this.rendererRecoveryAttempts.add(n.id),
        setTimeout(() => {
          if (!e.isDestroyed() && !e.webContents.isDestroyed())
            try {
              e.webContents.reload();
            } catch (e) {
              O9().warning(`Failed to reload crashed window`, {
                safe: {},
                sensitive: { error: e },
              });
            }
        }, 500),
        !0);
  }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createBrowserWindowManagerClass };
}
