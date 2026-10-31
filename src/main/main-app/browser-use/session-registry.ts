interface BrowserSessionRegistryDependencies {
  bootstrap: any;
  electron: any;
  createLogger: any;
  BrowserUseApi: any;
  createNativePipeServer: any;
  createPeerAuthorizer: any;
  browserRouteKey: any;
  pageRecordKey: any;
  consumeAllowedDownloadSymbol: symbol;
  notifyDownloadChangeSymbol: symbol;
}

function createBrowserSessionRegistryRuntime({
  bootstrap: a,
  electron: l,
  createLogger,
  BrowserUseApi,
  createNativePipeServer,
  createPeerAuthorizer,
  browserRouteKey,
  pageRecordKey,
  consumeAllowedDownloadSymbol: zY,
  notifyDownloadChangeSymbol: BY,
}: BrowserSessionRegistryDependencies) {
  const registryLogger = createLogger(`browser-session-registry`);
  function normalizeWindowId(value: any) {
    return value;
  }
  function createBackendState(sessionId: string) {
    return { apiImpl: null, server: null, sessionId, starting: null };
  }
  const createBrowserUseNativePipeServer = createNativePipeServer;
  const createSocketPeerAuthorizer = createPeerAuthorizer;
  const MAX_DEBUG_EVENTS = 200;
  const LOCAL_WORK_SESSION_PREFIX = `local-chatgpt:`;
  class BrowserSessionRegistry {
    appSessionId;
    buildFlavor;
    errorReporter;
    delegate = null;
    browserUseNativePipeEnabled = !1;
    backendStatesBySessionId = new Map<any, any>();
    backendDisposalsBySessionId = new Map<any, any>();
    pendingLocalWorkSessionIds = new Set<any>();
    localWorkCodexSessionIds = new Map<any, any>();
    hostsByRouteKey = new Map<any, any>();
    debugEvents: any[] = [];
    nextDebugEventSequence = 1;
    sessionRoutes = new Map<any, any>();
    windows = new Map<any, any>();
    constructor(e = a.on, t = a.in.Dev, n = { reportNonFatal: () => void 0 }) {
      ((this.appSessionId = e), (this.buildFlavor = t), (this.errorReporter = n));
    }
    setDelegate(e) {
      this.delegate = e;
    }
    recordDebugEvent({ details: e = [], ...t }) {
      (this.debugEvents.push({
        ...t,
        details: [...e],
        sequence: this.nextDebugEventSequence,
        timestampMs: Date.now(),
      }),
        (this.nextDebugEventSequence += 1),
        this.debugEvents.length > MAX_DEBUG_EVENTS && this.debugEvents.shift());
    }
    getDebugSnapshot() {
      return {
        events: this.debugEvents.map((e) => ({ ...e, details: [...e.details] })),
        sessionRoutes: Array.from(this.sessionRoutes.values()).map((e) => {
          let t =
            Array.from<any>(this.windows.get(e.windowId)?.pages.values() ?? []).find(
              (t) => t.conversationId === e.browserConversationId,
            ) ?? null;
          return {
            conversationId: e.sessionId,
            disposeAfterSessionActivity: e.disposeAfterSessionActivity,
            ownerWebContentsId: e.ownerWebContentsId,
            page: t == null ? null : { ...t },
            windowId: e.windowId,
          };
        }),
      };
    }
    setBrowserUseNativePipeEnabled(e) {
      if (this.browserUseNativePipeEnabled !== e) {
        if (((this.browserUseNativePipeEnabled = e), !e)) {
          for (let e of this.backendStatesBySessionId.keys()) this.disposeBackendForSession(e);
          return;
        }
        for (let e of this.sessionRoutes.values()) this.ensureBackendForSession(e.sessionId);
      }
    }
    prepareLocalWorkSessionRoute({ browserConversationId: e, owner: t }) {
      let n = this.localWorkCodexSessionIds.get(e);
      (n != null &&
        (this.moveBackendSession(n, e),
        this.localWorkCodexSessionIds.delete(e),
        this.sessionRoutes.delete(n)),
        this.captureSessionRoute({ browserConversationId: e, conversationId: e, owner: t }));
      let r = this.sessionRoutes.get(e);
      r != null &&
        r.ownerWebContentsId === t.id &&
        (this.pendingLocalWorkSessionIds.add(e),
        registryLogger().info(`IAB_LIFECYCLE prepared local Work session route`, {
          safe: { conversationId: e, ownerWebContentsId: t.id, windowId: r.windowId },
          sensitive: {},
        }));
    }
    cancelPendingLocalWorkSessionRoute({ browserConversationId: e, owner: t }) {
      let n = this.sessionRoutes.get(e);
      n?.ownerWebContentsId === t.id &&
        this.pendingLocalWorkSessionIds.delete(e) &&
        (this.sessionRoutes.delete(e),
        this.disposeBackendForSession(e),
        registryLogger().info(`IAB_LIFECYCLE canceled local Work session route`, {
          safe: { conversationId: e, ownerWebContentsId: t.id, windowId: n.windowId },
          sensitive: {},
        }));
    }
    captureSessionRoute({
      conversationId: e,
      browserConversationId: t = e,
      disposeAfterSessionActivity: n = !1,
      owner: r,
    }) {
      let i = l.BrowserWindow.fromWebContents(r);
      if (i == null || i.isDestroyed()) {
        (this.recordDebugEvent({
          browserTabId: null,
          conversationId: e,
          guestWebContentsId: null,
          kind: `session-route-capture-failed`,
          message: `Failed to capture Browser Use session route`,
          ownerWebContentsId: r.id,
          pageKey: null,
          windowId: null,
        }),
          registryLogger().warning(`IAB_LIFECYCLE failed to capture session route`, {
            safe: { conversationId: e, ownerWebContentsId: r.id },
            sensitive: {},
          }));
        return;
      }
      let a = normalizeWindowId(i.id),
        o = this.sessionRoutes.get(e),
        s = {
          conversationId: t === e && o?.windowId === a ? o.browserConversationId : t,
          windowId: a,
        };
      if (o == null && t !== e) {
        let n = this.sessionRoutes.get(t);
        n?.browserConversationId === t &&
          n.windowId === a &&
          (this.sessionRoutes.delete(t),
          this.disposeBackendForSession(t),
          (n.sessionId = e),
          this.sessionRoutes.set(e, n),
          (o = n));
      }
      if (o != null) {
        if (o.windowId === a) {
          if (
            (this.ensureBackendForSession(e),
            o.browserConversationId !== s.conversationId &&
              this.reassignRoute(
                { conversationId: o.browserConversationId, windowId: o.windowId },
                s,
                void 0,
                void 0,
                e,
              ),
            o.ownerWebContentsId !== r.id)
          ) {
            let t = o.ownerWebContentsId;
            ((o.ownerWebContentsId = r.id),
              this.recordDebugEvent({
                browserTabId: null,
                conversationId: e,
                details: [{ label: `previousOwnerWebContentsId`, value: String(t) }],
                guestWebContentsId: null,
                kind: `session-route-owner-rebound`,
                message: `Rebound Browser Use session route owner`,
                ownerWebContentsId: r.id,
                pageKey: null,
                windowId: i.id,
              }),
              registryLogger().info(`IAB_LIFECYCLE rebound session route owner`, {
                safe: {
                  conversationId: e,
                  ownerWebContentsId: r.id,
                  previousOwnerWebContentsId: t,
                  windowId: i.id,
                },
                sensitive: {},
              }));
          }
          n &&
            !o.disposeAfterSessionActivity &&
            ((o.disposeAfterSessionActivity = !0),
            this.recordDebugEvent({
              browserTabId: null,
              conversationId: e,
              guestWebContentsId: null,
              kind: `session-route-disposal-updated`,
              message: `Marked Browser Use session route disposable`,
              ownerWebContentsId: r.id,
              pageKey: null,
              windowId: i.id,
            }),
            registryLogger().info(`IAB_LIFECYCLE updated session route disposal`, {
              safe: {
                conversationId: e,
                disposeAfterSessionActivity: n,
                ownerWebContentsId: r.id,
                windowId: i.id,
              },
              sensitive: {},
            }));
          return;
        }
        let t = { conversationId: o.browserConversationId, windowId: o.windowId },
          c = this.getPageRecordForConversation(t.windowId, o.browserConversationId);
        if (c == null) {
          let a = o.ownerWebContentsId,
            c = t.windowId;
          (this.reassignRoute(t, s, void 0, void 0, e),
            (o.ownerWebContentsId = r.id),
            n && !o.disposeAfterSessionActivity && (o.disposeAfterSessionActivity = !0),
            this.recordDebugEvent({
              browserTabId: null,
              conversationId: e,
              details: [
                { label: `previousOwnerWebContentsId`, value: String(a) },
                { label: `previousWindowId`, value: String(c) },
              ],
              guestWebContentsId: null,
              kind: `session-route-capture-reassigned`,
              message: `Reassigned duplicate Browser Use session route capture`,
              ownerWebContentsId: r.id,
              pageKey: null,
              windowId: i.id,
            }),
            registryLogger().info(`IAB_LIFECYCLE reassigned duplicate session route`, {
              safe: {
                conversationId: e,
                ownerWebContentsId: r.id,
                previousOwnerWebContentsId: a,
                previousWindowId: c,
                windowId: i.id,
              },
              sensitive: {},
            }));
          return;
        }
        (this.recordDebugEvent({
          browserTabId: null,
          conversationId: e,
          details: [
            { label: `existingOwnerWebContentsId`, value: String(o.ownerWebContentsId) },
            { label: `existingWindowId`, value: String(o.windowId) },
          ],
          guestWebContentsId: c.guestWebContentsId,
          kind: `session-route-capture-ignored`,
          message: `Ignored duplicate Browser Use session route capture`,
          ownerWebContentsId: r.id,
          pageKey: c.pageKey,
          windowId: i.id,
        }),
          registryLogger().warning(`IAB_LIFECYCLE ignored duplicate session route capture`, {
            safe: {
              conversationId: e,
              existingOwnerWebContentsId: o.ownerWebContentsId,
              existingWindowId: o.windowId,
              ownerWebContentsId: r.id,
              windowId: i.id,
            },
            sensitive: {},
          }));
        return;
      }
      this.captureSessionRouteForWindow({
        browserConversationId: t,
        disposeAfterSessionActivity: n,
        ownerWebContentsId: r.id,
        sessionId: e,
        windowId: a,
      });
    }
    bindSessionRouteOwner({ browserConversationId: e, owner: t, sessionId: n }) {
      let r = l.BrowserWindow.fromWebContents(t),
        i = this.sessionRoutes.get(n);
      if (
        r != null &&
        !r.isDestroyed() &&
        e !== n &&
        !n.startsWith(LOCAL_WORK_SESSION_PREFIX) &&
        (i == null || (i.windowId === r.id && i.ownerWebContentsId === t.id))
      ) {
        let i;
        for (let n of this.sessionRoutes.values())
          if (
            n.sessionId.startsWith(LOCAL_WORK_SESSION_PREFIX) &&
            n.browserConversationId === e &&
            n.windowId === r.id &&
            n.ownerWebContentsId === t.id &&
            !this.pendingLocalWorkSessionIds.has(n.sessionId)
          ) {
            i = n;
            break;
          }
        if (i != null) {
          let e = i.sessionId;
          (this.sessionRoutes.delete(e),
            this.sessionRoutes.has(n)
              ? this.disposeBackendForSession(e)
              : (this.moveBackendSession(e, n), (i.sessionId = n), this.sessionRoutes.set(n, i)));
        }
      }
      let a = this.sessionRoutes.get(n);
      if (a == null) {
        this.captureSessionRoute({ browserConversationId: e, conversationId: n, owner: t });
        return;
      }
      if (r == null || r.isDestroyed()) {
        (this.recordDebugEvent({
          browserTabId: null,
          conversationId: n,
          guestWebContentsId: null,
          kind: `session-route-bind-failed`,
          message: `Failed to bind Browser Use session route owner`,
          ownerWebContentsId: t.id,
          pageKey: null,
          windowId: null,
        }),
          registryLogger().warning(`IAB_LIFECYCLE failed to rebind session route`, {
            safe: { conversationId: n, ownerWebContentsId: t.id },
            sensitive: {},
          }));
        return;
      }
      let o = { conversationId: a.browserConversationId, windowId: a.windowId },
        s = { conversationId: e, windowId: normalizeWindowId(r.id) },
        c = this.sessionRoutes.get(e);
      if (
        (e !== n &&
          c?.sessionId === e &&
          c.browserConversationId === e &&
          (this.sessionRoutes.delete(e), this.disposeBackendForSession(e)),
        o.windowId === s.windowId &&
          o.conversationId === s.conversationId &&
          a.ownerWebContentsId === t.id)
      )
        return;
      let u = this.getPageRecordForConversation(o.windowId, a.browserConversationId);
      if (o.windowId !== s.windowId && u != null) {
        (this.recordDebugEvent({
          browserTabId: null,
          conversationId: n,
          details: [
            { label: `previousOwnerWebContentsId`, value: String(a.ownerWebContentsId) },
            { label: `previousWindowId`, value: String(o.windowId) },
          ],
          guestWebContentsId: u.guestWebContentsId,
          kind: `session-route-live-rebind-ignored`,
          message: `Ignored Browser Use session route rebind with existing page`,
          ownerWebContentsId: t.id,
          pageKey: u.pageKey,
          windowId: s.windowId,
        }),
          registryLogger().warning(`IAB_LIFECYCLE ignored session route rebind`, {
            safe: {
              conversationId: n,
              ownerWebContentsId: t.id,
              previousOwnerWebContentsId: a.ownerWebContentsId,
              previousWindowId: o.windowId,
              windowId: s.windowId,
            },
            sensitive: {},
          }));
        return;
      }
      let d = a.ownerWebContentsId,
        f = o.windowId;
      (this.reassignRoute(o, s, void 0, void 0, n),
        (a.ownerWebContentsId = t.id),
        this.recordDebugEvent({
          browserTabId: null,
          conversationId: n,
          details: [
            { label: `previousOwnerWebContentsId`, value: String(d) },
            { label: `previousWindowId`, value: String(f) },
          ],
          guestWebContentsId: null,
          kind: `session-route-owner-bound`,
          message: `Bound Browser Use session route to exact owner`,
          ownerWebContentsId: t.id,
          pageKey: null,
          windowId: s.windowId,
        }),
        registryLogger().info(`IAB_LIFECYCLE rebound captured session route`, {
          safe: {
            conversationId: n,
            ownerWebContentsId: t.id,
            previousOwnerWebContentsId: d,
            previousWindowId: f,
            windowId: s.windowId,
          },
          sensitive: {},
        }));
    }
    ensureSessionRoute(e) {
      let t = this.sessionRoutes.get(e.conversationId);
      if (t != null) {
        if (this.delegate?.isWindowAlive(t.windowId) === !0) return !0;
        (this.disposeBrowserUseRoute(
          { conversationId: t.browserConversationId, windowId: t.windowId },
          t.sessionId,
        ),
          this.recordDebugEvent({
            browserTabId: null,
            conversationId: e.conversationId,
            guestWebContentsId: null,
            kind: `session-route-stale-discarded`,
            message: `Discarded stale Browser Use session route`,
            ownerWebContentsId: t.ownerWebContentsId,
            pageKey: null,
            windowId: t.windowId,
          }),
          registryLogger().warning(`IAB_LIFECYCLE discarded stale session route`, {
            safe: {
              conversationId: e.conversationId,
              ownerWebContentsId: t.ownerWebContentsId,
              windowId: t.windowId,
            },
            sensitive: {},
          }));
      }
      return (
        this.recordDebugEvent({
          browserTabId: null,
          conversationId: e.conversationId,
          guestWebContentsId: null,
          kind: `session-route-missing`,
          message: `Missing exact Browser Use session route owner`,
          ownerWebContentsId: null,
          pageKey: null,
          windowId: null,
        }),
        registryLogger().warning(`IAB_LIFECYCLE missing exact session route owner`, {
          safe: { conversationId: e.conversationId },
          sensitive: {},
        }),
        !1
      );
    }
    captureSessionRouteForWindow({
      browserConversationId: e,
      disposeAfterSessionActivity: t,
      ownerWebContentsId: n,
      sessionId: r,
      windowId: i,
    }) {
      (this.sessionRoutes.set(r, {
        browserConversationId: e,
        disposeAfterSessionActivity: t,
        ownerWebContentsId: n,
        sessionId: r,
        windowId: i,
      }),
        this.ensureBackendForSession(r),
        this.recordDebugEvent({
          browserTabId: null,
          conversationId: r,
          details: [{ label: `disposeAfterSessionActivity`, value: String(t) }],
          guestWebContentsId: null,
          kind: `session-route-captured`,
          message: `Captured Browser Use session route`,
          ownerWebContentsId: n,
          pageKey: null,
          windowId: i,
        }),
        registryLogger().info(`IAB_LIFECYCLE captured session route`, {
          safe: {
            conversationId: r,
            disposeAfterSessionActivity: t,
            ownerWebContentsId: n,
            windowId: i,
          },
          sensitive: {},
        }));
    }
    getBrowserUseHost(e) {
      let t = this.resolveBrowserRoute(e);
      return this.getOrCreateBrowserUseHost(t);
    }
    async focusBrowserUseTab({ conversationId: e, tabId: t }) {
      let n = Number(t);
      if (!Number.isSafeInteger(n) || n <= 0) return !1;
      let r = this.getBrowserRouteForSession(e);
      if (r == null) return !1;
      let i = browserRouteKey(r);
      return (
        await Promise.all(
          [...this.backendStatesBySessionId.values()].map(
            async (e) => (await e.starting, (await e.apiImpl?.focusTabForBrowserRoute(i, n)) ?? !1),
          ),
        )
      ).some((e) => e);
    }
    endSessionActivity({ conversationId: e }) {
      let t = this.sessionRoutes.get(e);
      if (t == null) return;
      let n = { conversationId: t.browserConversationId, windowId: t.windowId },
        r = browserRouteKey(n);
      this.backendStatesBySessionId
        .get(e)
        ?.apiImpl?.releaseSessionControl({ conversationId: e })
        .catch(() => void 0);
      let i = this.hostsByRouteKey.get(r);
      (i == null ? this.delegate?.setBrowserUseActive(n, !1) : i.setBrowserUseActive(!1),
        t.disposeAfterSessionActivity && this.disposeBrowserUseRoute(n, t.sessionId),
        this.recordDebugEvent({
          browserTabId: null,
          conversationId: t.sessionId,
          guestWebContentsId: null,
          kind: `session-activity-ended`,
          message: `Ended Browser Use session activity`,
          ownerWebContentsId: t.ownerWebContentsId,
          pageKey: null,
          windowId: t.windowId,
        }),
        registryLogger().info(`IAB_LIFECYCLE ended browser use session activity`, {
          safe: {
            conversationId: t.sessionId,
            disposeAfterSessionActivity: t.disposeAfterSessionActivity,
            windowId: t.windowId,
          },
          sensitive: {},
        }));
    }
    notifyBrowserUseCursorArrived({ owner: e, payload: t }) {
      let n = this.sessionRoutes.get(t.conversationId);
      if (n != null) {
        if (
          n.ownerWebContentsId !== e.id &&
          !this.delegate?.isDetachedCursorOwner(
            { conversationId: n.browserConversationId, windowId: n.windowId },
            e,
          )
        ) {
          registryLogger().warning(`IAB_LIFECYCLE ignored cursor arrival from stale owner`, {
            safe: {
              conversationId: t.conversationId,
              expectedOwnerWebContentsId: n.ownerWebContentsId,
              moveSequence: t.moveSequence,
              ownerWebContentsId: e.id,
            },
            sensitive: {},
          });
          return;
        }
        this.backendStatesBySessionId.get(t.conversationId)?.apiImpl?.notifyCursorArrived(t);
      }
    }
    consumeAllowedBrowserUseDownload({ url: e, urlChain: t, webContentsId: n }) {
      for (let r of this.backendStatesBySessionId.values()) {
        let i = r.apiImpl?.[zY]({ url: e, urlChain: t, webContentsId: n });
        if (i != null) return i;
      }
      return null;
    }
    notifyBrowserUseDownloadChange(e) {
      e.session_id != null && this.backendStatesBySessionId.get(e.session_id)?.apiImpl?.[BY](e);
    }
    notifyPageEvent({ conversationId: e, event: t, webContentsId: n, windowId: r }) {
      let i = this.getCapturedSessionRouteForBrowserRoute({
        conversationId: e,
        windowId: r,
      })?.sessionId;
      i != null && this.backendStatesBySessionId.get(i)?.apiImpl?.notifyPageEvent(i, n, t);
    }
    getOrCreateBrowserUseHost(e) {
      this.assertWindowAlive(e);
      let t = browserRouteKey(e);
      this.ensureBackendForSession(this.getSessionIdForBrowserRoute(e));
      let n = this.hostsByRouteKey.get(t);
      if (n != null) return n;
      let r = new BrowserUseHost(this, e, t);
      return (
        this.hostsByRouteKey.set(t, r),
        registryLogger().info(`IAB_LIFECYCLE created browser use host`, {
          safe: { conversationId: e.conversationId, routeKey: t, windowId: e.windowId },
          sensitive: {},
        }),
        r
      );
    }
    handleWindowClosed(e) {
      let t = normalizeWindowId(e);
      this.windows.delete(t);
      for (let [e, n] of this.hostsByRouteKey)
        n.windowId === t &&
          (this.backendStatesBySessionId
            .get(
              this.getSessionIdForBrowserRoute({
                conversationId: n.conversationId,
                windowId: n.windowId,
              }),
            )
            ?.apiImpl?.disposeRoute(e),
          this.hostsByRouteKey.delete(e));
      for (let [e, n] of this.sessionRoutes)
        n.windowId === t &&
          (this.pendingLocalWorkSessionIds.delete(n.browserConversationId),
          this.localWorkCodexSessionIds.delete(n.browserConversationId),
          this.sessionRoutes.delete(e),
          this.disposeBackendForSession(e));
      (this.recordDebugEvent({
        browserTabId: null,
        conversationId: null,
        guestWebContentsId: null,
        kind: `browser-window-removed`,
        message: `Removed Browser session window`,
        ownerWebContentsId: null,
        pageKey: null,
        windowId: t,
      }),
        registryLogger().info(`IAB_LIFECYCLE removed browser session window`, {
          safe: { windowId: t },
          sensitive: {},
        }));
    }
    recordGuestAttached({
      browserTabId: e,
      conversationId: t,
      guestWebContentsId: n,
      pageKey: r,
      windowId: i,
    }) {
      let a = this.ensurePageRecord(
        { browserTabId: e, conversationId: t, windowId: i },
        { pageKey: r },
      );
      ((a.guestWebContentsId = n),
        this.recordDebugEvent({
          browserTabId: null,
          conversationId: t,
          guestWebContentsId: n,
          kind: `browser-guest-attached`,
          message: `Attached Browser sidebar guest`,
          ownerWebContentsId: this.windows.get(i)?.ownerWebContentsId ?? null,
          pageKey: r,
          windowId: i,
        }),
        registryLogger().info(`IAB_LIFECYCLE attached browser sidebar guest`, {
          safe: {
            conversationId: t,
            browserTabId: e,
            guestWebContentsId: n,
            pageKey: r,
            windowId: i,
          },
          sensitive: {},
        }));
    }
    recordPageClosed(e) {
      (this.forgetPageRecord(e),
        registryLogger().info(`IAB_LIFECYCLE closed browser sidebar page`, { safe: e, sensitive: {} }));
    }
    recordPageReleased(e) {
      (this.forgetPageRecord(e),
        registryLogger().info(`IAB_LIFECYCLE released browser sidebar page`, { safe: e, sensitive: {} }));
    }
    forgetPageRecord(e) {
      let t = this.windows.get(e.windowId) ?? null;
      (t?.pages.delete(pageRecordKey(e)),
        t != null &&
          !this.hasPageRecordForConversation(t, e.conversationId) &&
          t.conversations.delete(e.conversationId));
      let n = browserRouteKey(e),
        r = t != null && this.hasPageRecordForConversation(t, e.conversationId);
      (t == null || !r) &&
        (this.hostsByRouteKey.delete(n),
        this.backendStatesBySessionId
          .get(this.getSessionIdForBrowserRoute(e))
          ?.apiImpl?.disposeRoute(n));
    }
    recordPageCreated(e) {
      (this.ensurePageRecord(e),
        this.recordDebugEvent({
          browserTabId: null,
          conversationId: e.conversationId,
          guestWebContentsId: null,
          kind: `browser-page-created`,
          message: `Created Browser sidebar page state`,
          ownerWebContentsId: this.windows.get(e.windowId)?.ownerWebContentsId ?? null,
          pageKey: null,
          windowId: e.windowId,
        }),
        registryLogger().info(`IAB_LIFECYCLE created browser sidebar page state`, { safe: e, sensitive: {} }));
    }
    reassignRoute(e, t, n, r, i) {
      if (
        e.conversationId === t.conversationId &&
        e.windowId === t.windowId &&
        (r == null || n === r)
      )
        return;
      let a = browserRouteKey(e),
        o = browserRouteKey(t),
        s =
          this.sessionRoutes.get(i ?? e.conversationId) ??
          (i == null ? this.getCapturedSessionRouteForBrowserRoute(e) : null),
        c = i ?? null;
      (c == null && s != null && s.sessionId !== e.conversationId && (c = s.sessionId),
        c == null &&
          e.conversationId !== t.conversationId &&
          this.backendStatesBySessionId.get(e.conversationId)?.apiImpl?.disposeRoute(a));
      let l = this.windows.get(e.windowId) ?? null,
        u = this.ensureWindowRecord(t.windowId);
      for (let [i, a] of l?.pages ?? []) {
        if (a.conversationId !== e.conversationId || (n != null && a.browserTabId !== n)) continue;
        l?.pages.delete(i);
        let o = r ?? a.browserTabId;
        u.pages.set(
          pageRecordKey({ browserTabId: o, conversationId: t.conversationId, windowId: t.windowId }),
          { ...a, browserTabId: o, conversationId: t.conversationId, windowId: t.windowId },
        );
      }
      (l != null &&
        !this.hasPageRecordForConversation(l, e.conversationId) &&
        l.conversations.delete(e.conversationId),
        u.conversations.add(t.conversationId));
      let d = this.hostsByRouteKey.get(a) ?? null;
      (d != null &&
        (this.hostsByRouteKey.delete(a), d.reassignRoute(t, o), this.hostsByRouteKey.set(o, d)),
        s?.windowId === e.windowId &&
          s.browserConversationId === e.conversationId &&
          ((s.browserConversationId = t.conversationId),
          (s.windowId = t.windowId),
          c ??
            (this.sessionRoutes.delete(e.conversationId),
            (s.sessionId = t.conversationId),
            this.sessionRoutes.set(t.conversationId, s))),
        c == null
          ? a === o
            ? this.backendStatesBySessionId
                .get(e.conversationId)
                ?.apiImpl?.reassignRoute(a, o, n, r)
            : e.conversationId === t.conversationId
              ? this.backendStatesBySessionId.get(e.conversationId)?.apiImpl?.reassignRoute(a, o)
              : (this.disposeBackendForSession(e.conversationId),
                this.ensureBackendForSession(t.conversationId))
          : this.backendStatesBySessionId.get(c)?.apiImpl?.reassignRoute(a, o, n, r),
        registryLogger().info(`IAB_LIFECYCLE reassigned browser use route`, {
          safe: {
            sourceConversationId: e.conversationId,
            sourceWindowId: e.windowId,
            targetConversationId: t.conversationId,
            targetWindowId: t.windowId,
          },
          sensitive: {},
        }));
    }
    disposeConversation(e) {
      let t = new Map(),
        n = this.sessionRoutes.get(e) ?? null,
        r = n?.browserConversationId ?? e,
        i = this.localWorkCodexSessionIds.get(r) ?? null;
      (this.pendingLocalWorkSessionIds.delete(r), this.localWorkCodexSessionIds.delete(r));
      for (let e of this.windows.values()) {
        if (!e.conversations.has(r)) continue;
        let n = { conversationId: r, windowId: e.windowId };
        t.set(browserRouteKey(n), n);
      }
      for (let e of this.hostsByRouteKey.values()) {
        if (e.conversationId !== r) continue;
        let n = { conversationId: r, windowId: e.windowId };
        t.set(browserRouteKey(n), n);
      }
      if (n != null) {
        let e = { conversationId: r, windowId: n.windowId };
        t.set(browserRouteKey(e), e);
      }
      for (let e of t.values())
        this.disposeBrowserUseRoute(e, n?.sessionId, n?.disposeAfterSessionActivity);
      if (i != null)
        for (let e of [r, i])
          e !== n?.sessionId && (this.sessionRoutes.delete(e), this.disposeBackendForSession(e));
      (this.recordDebugEvent({
        browserTabId: null,
        conversationId: e,
        details: [{ label: `routeCount`, value: String(t.size) }],
        guestWebContentsId: null,
        kind: `browser-conversation-disposed`,
        message: `Disposed Browser Use conversation`,
        ownerWebContentsId: null,
        pageKey: null,
        windowId: null,
      }),
        registryLogger().info(`IAB_LIFECYCLE disposed browser use conversation`, {
          safe: { conversationId: e, routeCount: t.size },
          sensitive: {},
        }));
    }
    recordPageTornDown({ browserTabId: e, conversationId: t, guestWebContentsId: n, windowId: r }) {
      let i =
        this.windows.get(r)?.pages.get(pageRecordKey({ browserTabId: e, conversationId: t, windowId: r })) ??
        null;
      (i?.guestWebContentsId === n && (i.guestWebContentsId = null),
        this.recordDebugEvent({
          browserTabId: null,
          conversationId: t,
          guestWebContentsId: n,
          kind: `browser-guest-torn-down`,
          message: `Tore down Browser sidebar guest`,
          ownerWebContentsId: this.windows.get(r)?.ownerWebContentsId ?? null,
          pageKey: i?.pageKey ?? null,
          windowId: r,
        }),
        registryLogger().warning(`IAB_LIFECYCLE browser sidebar guest torn down`, {
          safe: { conversationId: t, browserTabId: e, guestWebContentsId: n, windowId: r },
          sensitive: {},
        }));
    }
    registerThread(e) {
      (this.ensureWindowRecord(e.windowId).conversations.add(e.conversationId),
        this.recordDebugEvent({
          browserTabId: null,
          conversationId: e.conversationId,
          guestWebContentsId: null,
          kind: `browser-thread-registered`,
          message: `Registered Browser sidebar thread`,
          ownerWebContentsId: this.windows.get(e.windowId)?.ownerWebContentsId ?? null,
          pageKey: null,
          windowId: e.windowId,
        }),
        registryLogger().info(`IAB_LIFECYCLE registered browser sidebar thread`, { safe: e, sensitive: {} }));
    }
    registerWindow({ ownerWebContentsId: e, windowId: t }) {
      let n = normalizeWindowId(t),
        r = (this.windows.get(n) ?? null)?.ownerWebContentsId,
        i = this.ensureWindowRecord(n);
      if (((i.ownerWebContentsId = e), r != null && r !== e))
        for (let t of this.sessionRoutes.values()) t.windowId === n && (t.ownerWebContentsId = e);
      (this.recordDebugEvent({
        browserTabId: null,
        conversationId: null,
        details: r == null ? [] : [{ label: `previousOwnerWebContentsId`, value: String(r) }],
        guestWebContentsId: null,
        kind: r == null ? `browser-window-registered` : `browser-window-owner-rebound`,
        message:
          r == null ? `Registered Browser sidebar window` : `Rebound Browser sidebar window owner`,
        ownerWebContentsId: e,
        pageKey: null,
        windowId: n,
      }),
        registryLogger().info(
          r == null
            ? `IAB_LIFECYCLE registered browser sidebar window`
            : `IAB_LIFECYCLE rebound browser sidebar window`,
          {
            safe: { ownerWebContentsId: e, previousOwnerWebContentsId: r, windowId: n },
            sensitive: {},
          },
        ));
    }
    resolveBrowserRoute(e) {
      let t = this.sessionRoutes.get(e.conversationId);
      if (t == null)
        throw (
          registryLogger().warning(`IAB_LIFECYCLE missing browser use session route`, {
            safe: e,
            sensitive: {},
          }),
          Error(`No ChatGPT browser route captured for browser session ${e.conversationId}`)
        );
      let n = { conversationId: t.browserConversationId, windowId: t.windowId };
      this.assertWindowAlive(n);
      let r = this.getPageRecordForConversation(t.windowId, t.browserConversationId);
      return (
        this.recordDebugEvent({
          browserTabId: null,
          conversationId: t.sessionId,
          guestWebContentsId: r?.guestWebContentsId ?? null,
          kind: `session-route-resolved`,
          message: `Resolved Browser Use route`,
          ownerWebContentsId: t.ownerWebContentsId,
          pageKey: r?.pageKey ?? null,
          windowId: t.windowId,
        }),
        n
      );
    }
    getBrowserRouteForSession(e) {
      let t = this.sessionRoutes.get(e);
      return t == null ? null : { conversationId: t.browserConversationId, windowId: t.windowId };
    }
    getCapturedSessionRouteForBrowserRoute(e) {
      for (let t of this.sessionRoutes.values())
        if (t.browserConversationId === e.conversationId && t.windowId === e.windowId) return t;
      return null;
    }
    getSessionIdForBrowserRoute(e) {
      return this.getCapturedSessionRouteForBrowserRoute(e)?.sessionId ?? e.conversationId;
    }
    isSubagentBrowserUseRoute(e) {
      return this.getCapturedSessionRouteForBrowserRoute(e)?.disposeAfterSessionActivity === !0;
    }
    recordPageSnapshot({
      browserTabId: e,
      conversationId: t,
      guestWebContentsId: n,
      isLoading: r,
      pageKey: i,
      url: a,
      windowId: o,
    }) {
      let s = this.ensurePageRecord(
          { browserTabId: e, conversationId: t, windowId: o },
          { pageKey: i },
        ),
        c = s.guestWebContentsId,
        l = s.isLoading,
        u = s.pageKey;
      ((s.guestWebContentsId = n),
        (s.isLoading = r),
        (s.pageKey = i),
        (s.url = a),
        (c !== n || l !== r || u !== i) &&
          this.recordDebugEvent({
            browserTabId: null,
            conversationId: t,
            details: [{ label: `isLoading`, value: String(r) }],
            guestWebContentsId: n,
            kind: `browser-page-snapshot-updated`,
            message: `Updated Browser sidebar page snapshot`,
            ownerWebContentsId: this.windows.get(o)?.ownerWebContentsId ?? null,
            pageKey: i,
            windowId: o,
          }));
    }
    getPageSnapshot(e) {
      let t = this.windows.get(e.windowId)?.pages.get(pageRecordKey(e)) ?? null;
      return t == null ? null : { ...t };
    }
    getWindowSnapshot(e) {
      let t = normalizeWindowId(e),
        n = this.windows.get(t) ?? null;
      return n == null
        ? null
        : {
            conversations: Array.from(n.conversations),
            ownerWebContentsId: n.ownerWebContentsId,
            pages: Array.from<any>(n.pages.values()).map((e) => ({ ...e })),
            windowId: t,
          };
    }
    getSnapshotFields() {
      let e = 0,
        t = 0,
        n = 0,
        r = 0;
      for (let i of this.windows.values()) {
        ((e += i.conversations.size), (r += i.pages.size));
        for (let e of i.pages.values())
          (e.guestWebContentsId != null && (t += 1), e.isLoading && (n += 1));
      }
      return {
        browser_use_window_count: this.windows.size,
        browser_use_conversation_count: e,
        browser_use_page_count: r,
        browser_use_guest_webcontents_count: t,
        browser_use_loading_page_count: n,
        browser_use_session_route_count: this.sessionRoutes.size,
      };
    }
    assertWindowAlive(e) {
      if (this.delegate?.isWindowAlive(e.windowId) !== !0)
        throw (
          registryLogger().warning(`IAB_LIFECYCLE browser use bound window unavailable`, {
            safe: e,
            sensitive: {},
          }),
          Error(
            `ChatGPT browser window ${e.windowId} is no longer available for browser session ${e.conversationId}`,
          )
        );
    }
    ensureBackendForSession(e) {
      if (!this.browserUseNativePipeEnabled) return;
      let t = this.backendStatesBySessionId.get(e) ?? createBackendState(e);
      if ((this.backendStatesBySessionId.set(e, t), t.server != null || t.starting != null)) return;
      let n = this.backendDisposalsBySessionId.get(e) ?? null;
      t.starting = (async () => {
        let e = null;
        try {
          if (
            (n != null && (await n),
            !this.browserUseNativePipeEnabled ||
              this.backendStatesBySessionId.get(t.sessionId) !== t)
          )
            return;
          (registryLogger().info(`browser_use_iab_backend_startup_started`, {
            safe: { backend: `iab`, platform: process.platform, release: l.app.getVersion() },
            sensitive: { appSessionId: this.appSessionId, sessionId: t.sessionId },
          }),
            (e = new BrowserUseApi(
              (e) => (this.canServeSession(e, t) ? this.getBrowserUseHost(e) : null),
              (e) => this.getDelegate().addBrowserUseNavigationBlockedListener(e),
              {
                appSessionId: this.appSessionId,
                buildFlavor: this.buildFlavor,
                ensureSessionRoute: (e) => this.canServeSession(e, t),
                getBrowserSession: () => this.getDelegate().getBrowserSession(),
              },
            )),
            (t.apiImpl = e),
            (t.server = await createBrowserUseNativePipeServer({
              apiImpl: e,
              socketPeerAuthorizer: createSocketPeerAuthorizer(),
            })),
            registryLogger().info(`browser_use_iab_backend_startup_ready`, {
              safe: { backend: `iab`, platform: process.platform, release: l.app.getVersion() },
              sensitive: { pipePath: t.server.pipePath, sessionId: t.sessionId },
            }));
        } catch (n) {
          (registryLogger().warning(`browser_use_iab_backend_startup_failed`, {
            safe: {
              backend: `iab`,
              phase: `native-pipe-startup`,
              platform: process.platform,
              reason: n instanceof Error ? n.name || `Error` : typeof n,
              release: l.app.getVersion(),
            },
            sensitive: { error: n, sessionId: t.sessionId },
          }),
            e?.dispose(),
            (t.apiImpl = null),
            this.errorReporter.reportNonFatal(n instanceof Error ? n : Error(String(n)), {
              kind: `browser-use-native-pipe-startup`,
            }));
        } finally {
          t.starting = null;
        }
      })();
    }
    moveBackendSession(e, t) {
      let n = this.backendStatesBySessionId.get(e);
      n != null &&
        (this.backendStatesBySessionId.delete(e),
        (n.sessionId = t),
        this.backendStatesBySessionId.set(t, n));
    }
    canServeSession(e, t) {
      let { sessionId: n } = t;
      if (this.backendStatesBySessionId.get(n) !== t) return !1;
      if (e.conversationId === n) return this.ensureSessionRoute(e);
      if (
        this.pendingLocalWorkSessionIds.size !== 1 ||
        !this.pendingLocalWorkSessionIds.has(n) ||
        this.sessionRoutes.has(e.conversationId)
      )
        return !1;
      let r = this.sessionRoutes.get(n);
      return r == null || this.delegate?.isWindowAlive(r.windowId) !== !0
        ? !1
        : (this.pendingLocalWorkSessionIds.delete(n),
          this.localWorkCodexSessionIds.set(n, e.conversationId),
          this.moveBackendSession(n, e.conversationId),
          this.captureSessionRouteForWindow({
            browserConversationId: r.browserConversationId,
            disposeAfterSessionActivity: r.disposeAfterSessionActivity,
            ownerWebContentsId: r.ownerWebContentsId,
            sessionId: e.conversationId,
            windowId: r.windowId,
          }),
          this.sessionRoutes.delete(n),
          registryLogger().info(`IAB_LIFECYCLE bound local Work Codex session route`, {
            safe: {
              browserConversationId: r.browserConversationId,
              conversationId: e.conversationId,
              ownerWebContentsId: r.ownerWebContentsId,
              windowId: r.windowId,
            },
            sensitive: {},
          }),
          this.ensureSessionRoute(e));
    }
    async disposeBackendForSession(e) {
      let t = this.backendStatesBySessionId.get(e);
      if (t == null) {
        await this.backendDisposalsBySessionId.get(e);
        return;
      }
      this.backendStatesBySessionId.delete(e);
      let n = (async () => {
        (t.starting != null && (await t.starting),
          await t.server?.dispose(),
          (t.server = null),
          (t.apiImpl = null));
      })();
      this.backendDisposalsBySessionId.set(e, n);
      try {
        await n;
      } finally {
        this.backendDisposalsBySessionId.get(e) === n && this.backendDisposalsBySessionId.delete(e);
      }
    }
    disposeBrowserUseRoute(
      e,
      t = this.getSessionIdForBrowserRoute(e),
      n = this.sessionRoutes.get(t)?.disposeAfterSessionActivity === !0,
    ) {
      let r = browserRouteKey(e);
      (this.backendStatesBySessionId.get(t)?.apiImpl?.disposeRoute(r),
        this.disposeBackendForSession(t),
        this.hostsByRouteKey.delete(r));
      let i = this.sessionRoutes.get(t);
      (i?.browserConversationId === e.conversationId &&
        i.windowId === e.windowId &&
        this.sessionRoutes.delete(t),
        this.delegate?.disposeBrowserUseRoute(e, n));
      let a = this.windows.get(e.windowId) ?? null;
      if ((a?.conversations.delete(e.conversationId), a != null))
        for (let [t, n] of a.pages) n.conversationId === e.conversationId && a.pages.delete(t);
      registryLogger().info(`IAB_LIFECYCLE disposed browser use route`, { safe: e, sensitive: {} });
    }
    getDelegate() {
      if (this.delegate == null) throw Error(`Browser session registry is not attached`);
      return this.delegate;
    }
    ensureWindowRecord(e) {
      let t = this.windows.get(e);
      if (t != null) return t;
      let n = { conversations: new Set<any>(), ownerWebContentsId: -1, pages: new Map<any, any>(), windowId: e };
      return (this.windows.set(e, n), n);
    }
    ensurePageRecord(e, t: any = {}) {
      let n = this.ensureWindowRecord(e.windowId);
      n.conversations.add(e.conversationId);
      let r = pageRecordKey(e),
        i = n.pages.get(r);
      if (i != null) return (t.pageKey !== void 0 && (i.pageKey = t.pageKey), i);
      let a = {
        browserTabId: e.browserTabId,
        conversationId: e.conversationId,
        guestWebContentsId: null,
        isLoading: !1,
        pageKey: t.pageKey ?? null,
        url: ``,
        windowId: e.windowId,
      };
      return (n.pages.set(r, a), a);
    }
    hasPageRecordForConversation(e, t) {
      for (let n of e.pages.values()) if (n.conversationId === t) return !0;
      return !1;
    }
    getPageRecordForConversation(e, t) {
      return (
        this.windows
          .get(e)
          ?.pages.values()
          .find((e) => e.conversationId === t) ?? null
      );
    }
  }
  class BrowserUseHost {
    registry;
    conversationId;
    windowId;
    openingPagePromisesByBrowserTabId = new Map();
    routeKey;
    constructor(e, t, n) {
      ((this.registry = e),
        (this.conversationId = t.conversationId),
        (this.windowId = t.windowId),
        (this.routeKey = n));
    }
    reassignRoute(e, t) {
      ((this.conversationId = e.conversationId), (this.windowId = e.windowId), (this.routeKey = t));
    }
    getPageForBrowserUse(e) {
      return this.registry.getDelegate().getPageForBrowserUse(this.route, e);
    }
    getTabsForBrowserUse() {
      return this.registry.getDelegate().getTabsForBrowserUse(this.route);
    }
    async openPageForBrowserUse(e) {
      let t = e.browserTabId;
      this.setBrowserUseActive(!0, t);
      let n = this.openingPagePromisesByBrowserTabId.get(t) ?? null;
      if (n != null) return n;
      let r = this.registry
        .getDelegate()
        .openPageForBrowserUse(this.route, {
          browserTabId: t,
          createPanelTab: e.createPanelTab,
          startingUrl: e.startingUrl,
        })
        .catch((e) => {
          this.setBrowserUseActive(!1, t);
          let n = this.getTabsForBrowserUse().find((e) => e.browserTabId === t);
          throw (
            n?.lifetime === `persistent`
              ? n.sessionControlled && this.releasePageForBrowserUse(t)
              : this.closePageForBrowserUse(t),
            e
          );
        })
        .finally(() => {
          this.openingPagePromisesByBrowserTabId.delete(t);
        });
      this.openingPagePromisesByBrowserTabId.set(t, r);
      let i = await r;
      return (
        registryLogger().info(`IAB_LIFECYCLE host opened page`, {
          safe: {
            conversationId: this.conversationId,
            pageKey: i.pageKey,
            routeKey: this.routeKey,
            webContentsId: i.webContents.id,
            windowId: this.windowId,
          },
          sensitive: {},
        }),
        i
      );
    }
    setBrowserVisibleForBrowserUse(e, t) {
      if (this.registry.isSubagentBrowserUseRoute(this.route))
        throw Error(`IAB visibility is not supported in a subagent thread`);
      (e && this.setBrowserUseActive(!0, t),
        this.registry.getDelegate().setBrowserVisibleForBrowserUse(this.route, e, t));
    }
    isBrowserVisibleForBrowserUse(e) {
      return this.registry.getDelegate().isBrowserVisibleForBrowserUse(this.route, e);
    }
    setViewportForBrowserUse(e, t) {
      (this.setBrowserUseActive(!0, t),
        this.registry.getDelegate().setViewportForBrowserUse(this.route, e, t));
    }
    setCaptureSurfaceForBrowserUse(e, t) {
      this.registry.getDelegate().setCaptureSurfaceForBrowserUse(this.route, e, t);
    }
    waitForPendingDebuggerSync(e) {
      return this.registry.getDelegate().waitForPendingDebuggerSync(this.route, e);
    }
    waitForPageReady(e) {
      return this.registry.getDelegate().waitForPageReady(this.route, e);
    }
    activateBrowserUseNavigationRestriction(e) {
      this.registry.getDelegate().activateBrowserUseNavigationRestriction(e);
    }
    assertBrowserUseNavigationAllowed(e, t) {
      this.registry.getDelegate().assertBrowserUseNavigationAllowed(e, t);
    }
    trackPendingBrowserUseNavigation(e, t) {
      this.registry.getDelegate().trackPendingBrowserUseNavigation(e, t);
    }
    clearPendingBrowserUseNavigation(e) {
      this.registry.getDelegate().clearPendingBrowserUseNavigation(e);
    }
    setBrowserUseActive(e, t) {
      this.registry.getDelegate().setBrowserUseActive(this.route, e, t);
    }
    setWebMcpToolActivity(e, t, n) {
      this.registry.getDelegate().setWebMcpToolActivity(this.route, e, t, n);
    }
    setBrowserUseCursor(e, t) {
      return this.registry.getDelegate().setBrowserUseCursor(this.route, e, t);
    }
    closePageForBrowserUse(e) {
      this.registry.getDelegate().closePageForBrowserUse(this.route, e);
    }
    releasePageForBrowserUse(e) {
      this.registry.getDelegate().releasePageForBrowserUse(this.route, e);
    }
    get route() {
      return { conversationId: this.conversationId, windowId: this.windowId };
    }
  }

  return { BrowserSessionRegistry, BrowserUseHost };
}

export { createBrowserSessionRegistryRuntime };
