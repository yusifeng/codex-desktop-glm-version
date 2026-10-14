// @ts-nocheck

/** Owns Browser Use route actions and the route-scoped page state transitions. */
export function createBrowserUseRouteControllerClass(dependencies: Record<string, any>) {
  const {
    hX, n, qU, oX, QU, iW, wU, aW, mX, mXe, lW, OX, hXe, dZ, WU, fq, gX,
    logger,
  } = dependencies;
  const yX = logger ?? (() => ({ warning() {}, info() {} }));

  function getPage(e, { conversationId: t, windowId: n }, r) {
    const i = e.getPageWindowState({ conversationId: t, windowId: n }, r);
    return i == null
      ? (yX().warning(`IAB_LIFECYCLE browser use route window missing for page lookup`, {
          safe: { conversationId: t, windowId: n }, sensitive: {},
        }), null)
      : e.getPageHandleForConversation(i, t, r);
  }

  function getTabs(e, { conversationId: t, windowId: r }) {
    const i = e.getLiveWindowState(r);
    if (i == null) {
      yX().warning(`IAB_LIFECYCLE browser use route window missing for tab list`, {
        safe: { conversationId: t, windowId: r }, sensitive: {},
      });
      return [];
    }
    const a = e.getDetachedWindowStates(r);
    const o = a.flatMap((n) => getTabs(e, { conversationId: t, windowId: oX(n.window.id) }));
    for (const e of i.threads.values()) {
      if (e.conversationId !== t || e.pendingTeardown?.reason === `closed`) continue;
      const r = e.snapshot.title;
      const a = e.snapshot.url;
      if (e.isBrowserUsePage || a.length !== 0 || e.snapshot.tabType !== n.lu.NEW_TAB_PAGE)
        o.push({
          active: i.activeConversationId === t && i.activeBrowserTabId === e.browserTabId,
          browserTabId: e.browserTabId,
          lifetime: e.browserUseTabLifetime,
          sessionControlled: e.isBrowserUsePage,
          title: r.length > 0 ? r : (e.page?.title ?? ``),
          url: a || (e.page == null ? `` : QU(e.page)),
        });
    }
    const s = a.find((e) => e.window.isFocused() && e.activeConversationId === t)?.activeBrowserTabId ??
      (i.activeConversationId === t ? i.activeBrowserTabId : null);
    return o.map((e) => ({ ...e, active: e.browserTabId === s }));
  }

  async function openPage(e, { conversationId: t, browserTabId: n, createPanelTab: r, startingUrl: i, windowId: a }) {
    const o = e.getPageWindowState({ conversationId: t, windowId: a }, n);
    if (o == null) {
      yX().warning(`IAB_LIFECYCLE browser use route window missing for page open`, {
        safe: { conversationId: t, windowId: a }, sensitive: {},
      });
      throw Error(`ChatGPT browser window ${a} is no longer available for browser session ${t}`);
    }
    yX().info(`IAB_LIFECYCLE opening route page`, {
      safe: {
        activeConversationId: o.activeConversationId, browserTabId: n, conversationId: t,
        hasStartingUrl: i != null, ownerWebContentsId: o.owner.id,
        threadExists: e.getThreadStateForWindow(o, t, n) != null, windowId: a,
      }, sensitive: {},
    });
    const s = e.ensureThreadStateForWindow(o, t, n, { isBrowserUseTab: !0 });
    s.isBrowserUsePage = !0;
    const c = s.page ?? e.createThreadPageState(o, s, { title: s.snapshot.title, url: s.snapshot.url });
    if (i != null && QU(c) !== i) e.navigatePageToUrl(c, i, `browser_use`, `browser_use`);
    e.syncThreadState(o, t, s);
    if (r === !0)
      e.windowManager.sendMessageToWebContents(o.owner, {
        type: `open-browser-tab`, active: !1, browserTabId: n, conversationId: t,
        deferUntilPanelVisible: !0, initiator: `browser_use`, source: `browser_use`,
      });
    return lW(o, t, c) ?? e.browserUseOpenRequests.waitForOpen(o.owner, t, n);
  }

  function closePage(e, t, n) {
    const { conversationId: r, windowId: i } = t;
    const a = e.getPageWindowState({ conversationId: r, windowId: i }, n);
    if (a == null) {
      yX().warning(`IAB_LIFECYCLE browser use route window missing for page close`, {
        safe: { browserTabId: n, conversationId: r, windowId: i }, sensitive: {},
      }); return;
    }
    const o = e.getThreadStateForWindow(a, r, n) ?? null;
    if (o == null) return;
    fq(e.windowManager, a.owner, r, o);
    if (o.isBrowserUseActive) setActive(e, t, !1, n);
    e.browserUseOpenRequests.rejectForRoute({ browserTabId: n, conversationId: r,
      error: Error(`ChatGPT browser tab was closed by Browser Use`), owner: a.owner });
    e.requestThreadTeardown(a, r, o, `closed`);
    e.windowManager.sendMessageToWebContents(a.owner, { type: `close-browser-tab`, browserTabId: n, conversationId: r });
  }

  function releasePage(e, t, n) {
    const { conversationId: r, windowId: i } = t;
    const a = e.getPageWindowState({ conversationId: r, windowId: i }, n);
    if (a == null) {
      yX().warning(`IAB_LIFECYCLE browser use route window missing for page release`, {
        safe: { browserTabId: n, conversationId: r, windowId: i }, sensitive: {},
      }); return;
    }
    const o = e.getThreadStateForWindow(a, r, n) ?? null;
    if (o == null) return;
    const s = o.isBrowserUseActive;
    if (o.page != null) { o.page.lastWebMcpToolCall = null; o.page.webMcpParentCallIds?.clear(); }
    setViewport(e, t, null, n); setCaptureSurface(e, t, null, n); o.isBrowserUsePage = !1;
    o.isBrowserUseActive = !1;
    if (a.tabSourceWindow != null) o.isAgentControllingBrowser = !1;
    o.browserUseTabLifetime = `persistent`; o.pendingBrowserUsePanelOpen = !1;
    o.hasPendingBrowserUseVisibilityRequest = !1; o.isBrowserUseNavigationRestrictionActive = !1;
    setCursor(e, t, null, n); e.syncThreadState(a, r, o);
    WU(e.windowManager, a, { type: `browser-sidebar-browser-use-state`, conversationId: r, browserTabId: n, isActive: !1 });
    WU(e.windowManager, a, { type: `browser-sidebar-browser-use-page-released`, conversationId: r, browserTabId: n });
    e.browserSessionRegistry.recordPageReleased({ conversationId: r, browserTabId: n, windowId: oX(a.tabSourceWindow?.window.id ?? i) });
    if (s) e.enforceDetachedPageBudget(a);
  }

  function disposeRoute(e, { conversationId: t, windowId: n }, r) {
    const i = e.getLiveWindowState(n);
    if (i == null) {
      yX().warning(`IAB_LIFECYCLE browser use route window missing for route disposal`, {
        safe: { conversationId: t, windowId: n }, sensitive: {},
      }); return;
    }
    for (const i of e.getDetachedWindowStates(n)) disposeRoute(e, { conversationId: t, windowId: oX(i.window.id) }, r);
    for (const a of Array.from(i.threads.values())) if (a.conversationId === t && a.isBrowserUsePage) {
      e.browserUseOpenRequests.rejectForRoute({ browserTabId: a.browserTabId, conversationId: t,
        error: Error(`ChatGPT browser route was disposed before the browser pane attached`), owner: i.owner });
      if (a.browserUseTabLifetime === `persistent` && !r) { releasePage(e, { conversationId: t, windowId: n }, a.browserTabId); continue; }
      e.comments.close(i.owner, t, a.browserTabId); fq(e.windowManager, i.owner, t, a);
      e.windowManager.sendMessageToWebContents(i.owner, { type: `browser-sidebar-clear-pending-panel-open`, browserTabId: a.browserTabId, conversationId: t, reason: `close` });
      e.requestThreadTeardown(i, t, a, `closed`);
    }
  }

  function setVisible(e, t, n, r) {
    const { conversationId: i, windowId: a } = t;
    const o = e.getPageWindowState({ conversationId: i, windowId: a }, r);
    if (o == null) { yX().warning(`IAB_LIFECYCLE browser use route window missing for browser visibility`, { safe: { conversationId: i, windowId: a }, sensitive: {} }); throw Error(`ChatGPT browser window ${a} is no longer available for browser session ${i}`); }
    const s = mX(o, i, r);
    if (s == null) { if (n) throw Error(`A browser tab id is required to show the browser`); return; }
    const c = e.getThreadStateForWindow(o, i, s);
    if (!n) { const e = c?.page?.view.webContents; if (e != null && !e.isDestroyed()) e.closeExtensionActionContextMenu(); }
    if (o.tabSourceWindow != null) { n ? o.window.show() : o.window.hide(); return; }
    if (n) { e.ensureThreadStateForWindow(o, i, s, { isBrowserUseTab: !0 }); mXe(e, o, i, s); return; }
    if (c != null) { c.pendingBrowserUsePanelOpen = !1; c.hasPendingBrowserUseVisibilityRequest = !1; c.presented = !1; c.visible = !1; c.bounds = null; e.updateThreadSessionState(c); }
    e.windowManager.sendMessageToWebContents(o.owner, { type: `browser-sidebar-clear-pending-panel-open`, browserTabId: s, conversationId: i, reason: `hide` });
    if (o.activeConversationId === i && o.activeBrowserTabId === s) e.windowManager.sendMessageToWebContents(o.owner, { type: `toggle-browser-panel`, browserTabId: s, open: !1, source: `browser_use` });
  }

  function isVisible(e, { conversationId: t, windowId: n }, r) {
    const i = e.getPageWindowState({ conversationId: t, windowId: n }, r);
    if (i == null) { yX().warning(`IAB_LIFECYCLE browser use route window missing for browser visibility read`, { safe: { conversationId: t, windowId: n }, sensitive: {} }); throw Error(`ChatGPT browser window ${n} is no longer available for browser session ${t}`); }
    const a = mX(i, t, r); if (a == null) return !1;
    const o = e.getThreadStateForWindow(i, t, a) ?? null;
    return (i.tabSourceWindow == null || i.window.isVisible()) && i.activeConversationId === t && i.activeBrowserTabId === a && (o?.hasPendingBrowserUseVisibilityRequest === !0 || (o?.visible === !0 && o.bounds != null));
  }

  function setViewport(e, { conversationId: t, windowId: n }, r, i) {
    const a = e.getPageWindowState({ conversationId: t, windowId: n }, i);
    if (a == null) { yX().warning(`IAB_LIFECYCLE browser use route window missing for viewport set`, { safe: { conversationId: t, windowId: n }, sensitive: {} }); throw Error(`ChatGPT browser window ${n} is no longer available for browser session ${t}`); }
    const o = r == null ? null : { width: iW(r.width, wU.minWidth, wU.maxWidth), height: iW(r.height, wU.minHeight, wU.maxHeight) }, s = mX(a, t, i);
    if (s == null) { if (o != null) throw Error(`A browser tab id is required to set the viewport`); return; }
    const c = o == null ? e.getThreadStateForWindow(a, t, s) : e.ensureThreadStateForWindow(a, t, s, { isBrowserUseTab: !0 }); if (c == null) return;
    const l = c.emulatedViewportSize?.width !== o?.width || c.emulatedViewportSize?.height !== o?.height;
    c.emulatedViewportSize = o; e.syncThreadState(a, t, c); if (c.page != null && l) e.queuePageDeviceMetricsSync(c.page, o);
    WU(e.windowManager, a, { type: `browser-sidebar-browser-use-viewport`, conversationId: t, browserTabId: c.browserTabId, viewportSize: o });
  }

  function setCaptureSurface(e, { conversationId: t, windowId: n }, r, i) {
    const a = e.getPageWindowState({ conversationId: t, windowId: n }, i); if (a == null) throw Error(`ChatGPT browser window ${n} is no longer available for browser session ${t}`);
    const o = mX(a, t, i); if (o == null) { if (r != null) throw Error(`A browser tab id is required to set the capture surface`); return; }
    WU(e.windowManager, a, { type: `browser-sidebar-browser-use-capture-surface`, conversationId: t, browserTabId: o, surfaceSize: r == null ? null : { width: aW(r.width), height: aW(r.height) } });
  }

  function openPanel(e, t, n, r) {
    const i = e.getThreadStateForWindow(t, n, r) ?? null;
    if (i?.visible !== !0 || i.bounds == null) { if (i != null) { i.pendingBrowserUsePanelOpen = !1; i.hasPendingBrowserUseVisibilityRequest = t.activeConversationId === n; } e.windowManager.sendMessageToWebContents(t.owner, { type: `browser-sidebar-open-panel-without-animation`, conversationId: n, browserTabId: r, source: `browser_use`, initiator: `browser_use` }); }
  }

  function setActive(e, t, n, r) {
    const i = e.getPageWindowState(t, r); if (i == null) { yX().warning(`IAB_LIFECYCLE browser use route window missing for active state`, { safe: t, sensitive: {} }); return; }
    if (r == null) for (const r of e.getDetachedWindowStates(t.windowId)) setActive(e, { ...t, windowId: oX(r.window.id) }, n);
    if (n && r == null) throw Error(`A browser tab id is required to activate Browser Use`);
    const a = r == null ? OX(i, t.conversationId) : [r];
    for (const r of a) { const a = e.getThreadStateForWindow(i, t.conversationId, r) ?? (n ? e.ensureThreadStateForWindow(i, t.conversationId, r, { isBrowserUseTab: !0 }) : null), o = a?.isBrowserUseActive ?? !1;
      if (n && !o && a != null && a.emulatedViewportSize == null && e.defaultBrowserUseViewportSize != null) setViewport(e, t, e.defaultBrowserUseViewportSize, r);
      const s = a != null && !n && a.isBrowserUseNavigationRestrictionActive;
      if (a == null || o !== n || s) { if (a != null) { a.isBrowserUseActive = n; if (i.tabSourceWindow != null) a.isAgentControllingBrowser = n; if (n) { if (a.page != null) a.page.pendingSuspensionId = null; a.isBrowserUsePage = !0; } else a.isBrowserUseNavigationRestrictionActive = !1; }
        yX().info(`IAB_LIFECYCLE syncing browser use active state`, { safe: { browserTabId: r, conversationId: t.conversationId, isActive: n, ownerWebContentsId: i.owner.id, windowId: t.windowId }, sensitive: {} });
        WU(e.windowManager, i, { type: `browser-sidebar-browser-use-state`, conversationId: t.conversationId, browserTabId: r, isActive: n }); if (!n) setCursor(e, t, null, r); }
    }
  }

  function setWebMcpActivity(e, t, n, r, i) {
    const a = e.getPageWindowState(t, r); if (a == null) return; const o = e.getThreadStateForWindow(a, t.conversationId, r); if (o?.page == null || !o.isBrowserUseActive) return;
    const s = o.page; s.webMcpParentCallIds = s.webMcpParentCallIds ?? new Set(); s.webMcpParentCallIds.add(i);
    if (s.lastWebMcpToolCall?.toolName !== n || s.lastWebMcpToolCall?.faviconUrl !== s.faviconUrl) { s.lastWebMcpToolCall = { toolName: n, faviconUrl: s.faviconUrl }; e.syncThreadState(a, t.conversationId, o); }
  }

  function setCursor(e, t, n, r) {
    const i = e.getPageWindowState(t, r); if (i == null) { yX().warning(`IAB_LIFECYCLE browser use route window missing for cursor state`, { safe: t, sensitive: {} }); return !1; }
    if (n != null && r == null) throw Error(`A browser tab id is required to show the Browser Use cursor`);
    const a = r == null ? OX(i, t.conversationId) : [r]; let o = !1;
    if (r == null) for (const r of e.getDetachedWindowStates(t.windowId)) o = setCursor(e, { ...t, windowId: oX(r.window.id) }, n) || o;
    for (const r of a) { const a = (n == null ? (e.getThreadStateForWindow(i, t.conversationId, r) ?? null) : e.ensureThreadStateForWindow(i, t.conversationId, r, { isBrowserUseTab: !0 }))?.browserTabId ?? r, s = n != null && hXe(e, i, t.conversationId, a), c = n == null ? { visible: !1, x: 0, y: 0 } : { ...(s ? {} : { animateMovement: !1 }), moveSequence: n.moveSequence, sessionConversationId: n.sessionConversationId, visible: !0, x: n.x, y: n.y };
      WU(e.windowManager, i, { type: `browser-sidebar-browser-use-cursor-state`, conversationId: t.conversationId, browserTabId: a, ...c }); o = s || o; }
    return o;
  }

  return class BrowserUseRouteController {
    constructor(host: any) { this.host = host; }
    host: any;
    getBrowserUseRouteActionHelpers() {
      const h = this.host;
      return { browserSessionRegistry: h.browserSessionRegistry, browserUseOpenRequests: h.browserUseOpenRequests, comments: h.comments,
        createThreadPageState: (e, t, n) => h.materializeThreadPageState(e, t, { kind: `fresh`, page: n }), defaultBrowserUseViewportSize: h.defaultBrowserUseViewportSize,
        ensureThreadStateForWindow: h.ensureThreadStateForWindow.bind(h), enforceDetachedPageBudget: h.tabBudget.enforceDetachedPageBudget.bind(h), markTabActivity: h.tabBudget.markTabActivity.bind(h.tabBudget),
        getLiveWindowState: h.getLiveWindowState.bind(h), getDetachedWindowStates: h.getDetachedWindowStates.bind(h), getPageWindowState: h.getPageWindowState.bind(h),
        getPageHandleForConversation: gX, getThreadStateForWindow: hX, navigatePageToUrl: h.navigatePageToUrl.bind(h), queuePageDeviceMetricsSync: h.queuePageDeviceMetricsSync.bind(h),
        requestThreadTeardown: h.browserPageHostLifecycle.requestThreadTeardown.bind(h.browserPageHostLifecycle), syncThreadState: h.syncThreadState.bind(h),
        updateThreadSessionState: h.browserPageHostLifecycle.updateThreadSessionState.bind(h.browserPageHostLifecycle), windowManager: h.windowManager };
    }
    getPageForBrowserUseForRoute(e, t) { return getPage(this.getBrowserUseRouteActionHelpers(), e, t); }
    getTabsForBrowserUseForRoute(e) { return getTabs(this.getBrowserUseRouteActionHelpers(), e); }
    async openPageForBrowserUseForRoute({ browserTabId: e, conversationId: t, createPanelTab: n, startingUrl: r, windowId: i }) { if (!this.host.inAppBrowserFeatureEnabled) throw Error(`In-app browser is unavailable.`); return openPage(this.getBrowserUseRouteActionHelpers(), { browserTabId: e, conversationId: t, createPanelTab: n, startingUrl: r, windowId: i }); }
    closePageForBrowserUseForRoute(e, t) { closePage(this.getBrowserUseRouteActionHelpers(), e, t); }
    releasePageForBrowserUseForRoute(e, t) { releasePage(this.getBrowserUseRouteActionHelpers(), e, t); }
    disposeBrowserUseRouteForRoute(e, t) { disposeRoute(this.getBrowserUseRouteActionHelpers(), e, t); }
    setBrowserVisibleForBrowserUseForRoute(e, t, n) { setVisible(this.getBrowserUseRouteActionHelpers(), e, t, n); }
    isBrowserVisibleForBrowserUseForRoute(e, t) { return isVisible(this.getBrowserUseRouteActionHelpers(), e, t); }
    setViewportForBrowserUseForRoute(e, t, n) { setViewport(this.getBrowserUseRouteActionHelpers(), e, t, n); }
    setCaptureSurfaceForBrowserUseForRoute(e, t, n) { setCaptureSurface(this.getBrowserUseRouteActionHelpers(), e, t, n); }
    async waitForPendingDebuggerSyncForRoute(e, t) { const n = this.host.getPageWindowState(e, t); if (n == null || t == null) return; const r = (hX(n, e.conversationId, t) ?? null)?.page ?? null; if (r != null) await r.debuggerSync.catch(() => void 0); }
    async waitForPageReadyForRoute(e, t) { if (t == null) return; const n = this.host.getPageWindowState(e, t); await (n == null ? null : (hX(n, e.conversationId, t)?.page ?? null))?.initialNavigationSync; }
    openBrowserPanelWithoutAnimation(e, t, n) { openPanel(this.getBrowserUseRouteActionHelpers(), e, t, n); }
    setBrowserUseActiveForRoute(e, t, n) {
      const h = this.host;
      const r = h.getPageWindowState(e, n);
      const i = r == null ? [] : [r, ...(n == null ? h.getDetachedWindowStates(e.windowId) : [])];
      const a = new Set(i.flatMap((t) => Array.from(t.threads.values()).filter((t) => t.conversationId === e.conversationId && t.isBrowserUseActive)));
      setActive(this.getBrowserUseRouteActionHelpers(), e, t, n);
      for (const t of i) {
        let n = !1;
        for (const r of t.threads.values())
          r.conversationId === e.conversationId && a.has(r) !== r.isBrowserUseActive &&
            (!r.isBrowserUseActive && r.page?.lastWebMcpToolCall != null &&
              ((r.page.lastWebMcpToolCall = null), r.page.webMcpParentCallIds?.clear(), h.syncThreadState(t, e.conversationId, r)),
            dZ(t, r), (n = !0), r.isBrowserUseActive && h.tabBudget.markTabActivity(r));
        n && h.tabBudget.enforceDetachedPageBudget(t);
      }
    }
    setWebMcpToolActivity(e, t, n, r) { setWebMcpActivity(this.getBrowserUseRouteActionHelpers(), e, t, n, r); }
    setBrowserUseCursorForRoute(e, t, n) { return setCursor(this.getBrowserUseRouteActionHelpers(), e, t, n); }
    setBrowserUseActiveForConversation(e, t) { const n = this.host.getPreferredWindowStateForConversation(e); if (n != null) this.setBrowserUseActiveForRoute({ conversationId: e, windowId: oX(n.window.id) }, t); }
  };
}

if (typeof module !== `undefined`) module.exports = { createBrowserUseRouteControllerClass };
