// @ts-nocheck
type IabBrowserUseApiDependencies = Record<string, any>;

const IAB_ABOUT_BLANK = `about:blank`;
const IAB_PAGE_READY_TIMEOUT_MS = 15e3;
const IAB_CDP_COMMAND_TIMEOUT_MS = 2e4;
const IAB_CURSOR_ARRIVAL_TIMEOUT_MS = 1500;
const IAB_CLIPBOARD_CLEANUP_TIMEOUT_MS = 3e3;
const IAB_CAPTURE_SURFACE_TIMEOUT_MS = 1e3;
const IAB_CAPTURE_SURFACE_POLL_MS = 16;
const IAB_DOWNLOAD_GRANT_TTL_MS = 1e4;
const IAB_SESSION_CONTENT_KEY = `tabs_content`;

const ADD_BROWSER_USE_DOWNLOAD_CHANGE_LISTENER = Symbol(`addBrowserUseDownloadChangeListener`);
const CONSUME_ALLOWED_BROWSER_USE_DOWNLOAD = Symbol(`consumeAllowedBrowserUseDownload`);
const NOTIFY_BROWSER_USE_DOWNLOAD_CHANGE = Symbol(`notifyBrowserUseDownloadChange`);

function createIabBrowserUseApiClass(dependencies: IabBrowserUseApiDependencies) {
  const {
    $Y, AYe, BYe, FYe, GY, HYe, HY, IYe,
    JY, KY, LY, LYe, MYe, NYe, OYe, PYe,
    QY, RYe, UY, UYe, VY, VYe, WY, WYe,
    XY, YY, ZY, a, dYe, eX, gYe, hYe,
    jYe, kYe, l, mYe, n, nX, pYe, qY,
    rX, tX, vYe, zYe, _, _Ye, Tr,
  } = dependencies;
  const IY = IAB_ABOUT_BLANK,
    yYe = IAB_PAGE_READY_TIMEOUT_MS,
    bYe = IAB_CDP_COMMAND_TIMEOUT_MS,
    xYe = IAB_CURSOR_ARRIVAL_TIMEOUT_MS,
    SYe = IAB_CLIPBOARD_CLEANUP_TIMEOUT_MS,
    CYe = IAB_CAPTURE_SURFACE_TIMEOUT_MS,
    wYe = IAB_CAPTURE_SURFACE_POLL_MS,
    TYe = IAB_DOWNLOAD_GRANT_TTL_MS,
    EYe = IAB_SESSION_CONTENT_KEY,
    RY = ADD_BROWSER_USE_DOWNLOAD_CHANGE_LISTENER,
    zY = CONSUME_ALLOWED_BROWSER_USE_DOWNLOAD,
    BY = NOTIFY_BROWSER_USE_DOWNLOAD_CHANGE;
  return class IabBrowserUseApi {
    getBrowserHost;
    options;
    tabsById = new Map();
    tabRuntimesById = new Map();
    tabIdsByPageKey = new Map();
    tabIdsByRouteTabKey = new Map();
    debuggerListeners = new Map();
    pageStateListeners = new Map();
    debuggerTargetSessionsByTabId = new Map();
    debuggerTargetIdsBySessionId = new Map();
    pageCapturePaintLeaseWebContentsByTabId = new Map();
    cachedCdpExpressions = new Map();
    cdpEventListeners = new Set();
    cdpDetachListeners = new Set();
    downloadChangeListeners = new Set();
    pageEventListeners = new Set();
    allowedDownloadGrantsByWebContentsId = new Map();
    disposeBrowserUseNavigationBlockedListener;
    cdpCommandTimeoutMs;
    cursorArrivalTimeoutMs;
    initialPageUrl;
    pageReadyTimeoutMs;
    cursorArrivalWaitersByMoveSequence = new Map();
    selectedTabIdsByRouteKey = new Map();
    hostsByRouteKey = new Map();
    pendingVisibilityRouteKeys = new Set();
    pendingViewportSizesByRouteKey = new Map();
    usedTurnIdsByConversationId = new Map();
    nextCdpTabId = 1;
    nextCursorMoveSequence = 1;
    constructor(e, t, n = {}) {
      ((this.getBrowserHost = e),
        (this.options = n),
        (this.disposeBrowserUseNavigationBlockedListener = t((e) => {
          this.emitBrowserUseNavigationBlockedEvent(e);
        })),
        (this.cdpCommandTimeoutMs = n.cdpCommandTimeoutMs ?? bYe),
        (this.cursorArrivalTimeoutMs = n.cursorArrivalTimeoutMs ?? xYe),
        (this.initialPageUrl = n.initialPageUrl ?? IY),
        (this.pageReadyTimeoutMs = n.pageReadyTimeoutMs ?? yYe));
    }
    ping() {
      return `pong`;
    }
    async focusTab(e) {
      let t = e.session_id == null ? null : this.requireBrowserUseSession(e);
      if (!Number.isSafeInteger(e.tabId) || e.tabId <= 0)
        throw Error(`focusTab requires a positive integer tabId`);
      t != null && this.requireBrowserUseTab(t, e.tabId);
      let n = this.tabsById.get(e.tabId);
      if (n == null) throw Error(`Unknown tab: ${e.tabId}`);
      let r = t == null ? this.hostsByRouteKey.get(n.routeKey) : this.getRequiredBrowserHost(t);
      if (r == null) throw Error(`No in-app Browser host is available for this tab`);
      let i = await r.openPageForBrowserUse({ browserTabId: n.browserTabId }),
        a = this.updateTabForPage(i, n.routeKey, n.lifetime);
      return (this.selectedTabIdsByRouteKey.set(a.routeKey, a.cdpTabId), t != null || void 0);
    }
    async focusTabForBrowserRoute(e, t) {
      let n = this.tabsById.get(t),
        r = this.hostsByRouteKey.get(e);
      return n?.routeKey !== e || r == null
        ? !1
        : (await this.focusTab({ tabId: t }),
          r.setBrowserVisibleForBrowserUse(!0, n.browserTabId),
          !0);
    }
    async getTabs(e) {
      return this.runLoggedRequest(e, `getTabs`, (e) => this.getTabsForBrowserUse(e));
    }
    async createTab(e) {
      return this.runLoggedRequest(
        e,
        `createTab`,
        async (t) => (this.recordBrowserUseTurn(t, e), this.createTabForBrowserUse(t)),
      );
    }
    async nameSession(e) {
      await this.nameSessionForBrowserUse(this.requireBrowserUseSession(e), e);
    }
    async attach(e) {
      let t = this.requireBrowserUseSession(e);
      (this.recordBrowserUseTurn(t, e), await this.attachForBrowserUse(t, e));
    }
    async attachTarget(e) {
      let t = this.requireBrowserUseSession(e);
      this.recordBrowserUseTurn(t, e);
      let n = await this.getTab(t, e.tabId);
      (await this.attachForBrowserUse(t, e),
        e.targetId !== VY(n) && (await this.attachDebuggerTarget(n, e.targetId)));
    }
    async detach(e) {
      let t = this.requireBrowserUseSession(e);
      (this.recordBrowserUseTurn(t, e), await this.detachForBrowserUse(t, e));
    }
    async detachTarget(e) {
      let t = this.requireBrowserUseSession(e);
      this.recordBrowserUseTurn(t, e);
      let n = await this.getTab(t, e.tabId);
      if (e.targetId !== VY(n)) {
        await this.detachDebuggerTarget(n, e.targetId);
        return;
      }
      await this.detachForBrowserUse(t, e);
    }
    async executeCdp(e) {
      return this.runLoggedRequest(
        e,
        `executeCdp:${e.method}`,
        (t) => (this.recordBrowserUseTurn(t, e), this.executeCdpForBrowserUse(t, e)),
      );
    }
    async executeCdpWithCachedExpression(e) {
      this.requireBrowserUseSession(e);
      let { expressionCacheKey: t, ...n } = e,
        r = JY(n.commandParams) ? n.commandParams : {},
        i = typeof r.expression == `string` ? r.expression : void 0;
      i != null && this.cachedCdpExpressions.set(t, i);
      let a = i ?? this.cachedCdpExpressions.get(t);
      return a == null
        ? { kind: `cache-miss` }
        : {
            kind: `executed`,
            result: await this.executeCdp({ ...n, commandParams: { ...r, expression: a } }),
          };
    }
    async allowDownload(e) {
      return this.runLoggedRequest(e, `allowDownload`, async (t) => {
        if (!Number.isInteger(e.tabId)) throw Error(`allowDownload requires an integer tabId`);
        if (typeof e.url != `string` || e.url.length === 0)
          throw Error(`allowDownload requires a non-empty url`);
        let n = await this.getTab(t, e.tabId);
        (this.recordBrowserUseTurn(t, e),
          this.markBrowserUseCommandForTab(t, n),
          this.assertCurrentPageAllowed(t, n),
          this.pruneExpiredAllowedDownloadGrants(),
          this.allowedDownloadGrantsByWebContentsId.set(n.webContents.id, {
            grantedAtMs: Date.now(),
            sessionId: t.conversationId,
            url: e.url,
          }));
      });
    }
    async executeUnhandledCommand(e) {
      return this.runLoggedRequest(e, `executeUnhandledCommand:${e.type}`, (t) => {
        if (e.type === EYe)
          throw Error(
            `browser.tabs.content is not supported in Codex in-app browser. Open tabs with browser.tabs.new(), navigate them, then read each tab directly.`,
          );
        let n = this.getRequiredBrowserHost(t),
          r = this.getSelectedOrFirstControlledTabForSession(t);
        if (r == null && gYe(e)) {
          let t = _Ye(e);
          if (t != null) return (this.setPendingCapabilityIntent(n.routeKey, t), {});
        }
        return (
          this.recordBrowserUseTurn(t, e),
          hYe({ browserTabId: r?.browserTabId, host: n, payload: e })
        );
      });
    }
    addCdpEventListener(e) {
      return (
        this.cdpEventListeners.add(e),
        () => {
          this.cdpEventListeners.delete(e);
        }
      );
    }
    addCdpDetachListener(e) {
      return (
        this.cdpDetachListeners.add(e),
        () => {
          this.cdpDetachListeners.delete(e);
        }
      );
    }
    addPageEventListener(e) {
      return (
        this.pageEventListeners.add(e),
        () => {
          this.pageEventListeners.delete(e);
        }
      );
    }
    notifyWebMcpToolInvoked(e) {
      let t = { conversationId: e.session_id },
        n = this.getBrowserHost(t),
        r = this.tabsById.get(e.tabId);
      n != null &&
        r != null &&
        r.routeKey === n.routeKey &&
        (this.recordBrowserUseTurn(t, e),
        this.markBrowserUseCommandForTab(t, r),
        n.setWebMcpToolActivity(e.toolName, r.browserTabId, e.parentCallId));
    }
    notifyPageEvent(e, t, n) {
      let r = this.getTabIdForWebContentsId(t);
      if (r != null) for (let t of this.pageEventListeners) t({ ...n, session_id: e, tabId: r });
    }
    [RY](e) {
      return (
        this.downloadChangeListeners.add(e),
        () => {
          this.downloadChangeListeners.delete(e);
        }
      );
    }
    [zY]({ url: e, urlChain: t, webContentsId: n }) {
      this.pruneExpiredAllowedDownloadGrants();
      let r = this.allowedDownloadGrantsByWebContentsId.get(n) ?? null;
      return r == null || r.url !== e
        ? null
        : (this.allowedDownloadGrantsByWebContentsId.delete(n),
          { sessionId: r.sessionId, url: r.url });
    }
    [BY](e) {
      for (let t of this.downloadChangeListeners) t(e);
    }
    async getInfo(e) {
      if (e == null) throw Error(`Missing required browser session_id`);
      let t = this.getBrowserUseSession(e);
      LY().info(`IAB_LIFECYCLE iab backend info request received`, {
        safe: this.getRequestSafeFields(t, e, `getInfo`),
        sensitive: {},
      });
      try {
        this.ensureBrowserUseSessionRoute(t);
        let r = this.getMetadata(t),
          i = {
            apiSupportOverrides: {
              "Browser.user": !1,
              ...(Tr().inAppBrowserUseHistory ? { "Browser.history": !0 } : {}),
              "Tab.markDeliverable": !0,
              "Tab.markHandoff": !0,
            },
            name: `Codex In-app Browser`,
            version: n.Ru(n.Uu(l.app.getVersion())),
            type: `iab`,
            capabilities: { browser: dYe, tab: pYe(this.options.buildFlavor, Tr()) },
            metadata: r,
          };
        return (
          LY().info(`IAB_LIFECYCLE iab backend info request completed`, {
            safe: {
              ...this.getRequestSafeFields(t, e, `getInfo`),
              metadataCodexSessionId: r.codexSessionId,
            },
            sensitive: {},
          }),
          i
        );
      } catch (n) {
        throw (
          LY().warning(`IAB_LIFECYCLE iab backend info request failed`, {
            safe: this.getRequestSafeFields(t, e, `getInfo`),
            sensitive: { error: n },
          }),
          n
        );
      }
    }
    async getUserHistory(e) {
      if (!Tr().inAppBrowserUseHistory) throw Error(`browser.history is unavailable.`);
      this.requireBrowserUseSession(e);
      let t = e.limit ?? 100,
        n = this.options.getBrowserSession?.();
      if (n == null) throw Error(`In-app browser is unavailable.`);
      let r = await Promise.all(
        (e.queries ?? [``]).map((r) =>
          n.searchHistory({
            endTime: e.to == null ? void 0 : Date.parse(e.to),
            maxResults: t,
            startTime: e.from == null ? 0 : Date.parse(e.from),
            text: r,
          }),
        ),
      ).catch(() => null);
      if (r == null) return [];
      let i = r
          .flat()
          .flatMap((e) =>
            e.url == null || e.lastVisitTime == null
              ? []
              : [
                  {
                    url: e.url,
                    title: e.title,
                    dateVisited: new Date(e.lastVisitTime).toISOString(),
                  },
                ],
          )
          .sort((e, t) => t.dateVisited.localeCompare(e.dateVisited)),
        a = new Set();
      return i.filter((e) => !a.has(e.url) && (a.add(e.url), !0)).slice(0, t);
    }
    async markTab(e) {
      let t = this.requireBrowserUseSession(e);
      if (!Number.isInteger(e.tabId)) throw Error(`markTab requires an integer tabId`);
      if (e.status !== `handoff` && e.status !== `deliverable`)
        throw Error(`markTab received invalid status ${String(e.status)}`);
      if (typeof e.turn_id != `string`) throw Error(`markTab requires a turn_id`);
      this.requireBrowserUseTab(t, e.tabId);
      let n = this.tabsById.get(e.tabId);
      if (n == null) throw Error(`Unknown tab: ${e.tabId}`);
      ((n.mark = { status: e.status, turnId: e.turn_id }), this.recordBrowserUseTurn(t, e));
    }
    async moveMouse(e) {
      UYe(`moveMouse`, e);
      let t = this.requireBrowserUseSession(e),
        n = await this.getTab(t, e.tabId);
      (this.recordBrowserUseTurn(t, e), this.markBrowserUseCommandForTab(t, n));
      let r = this.nextCursorMoveSequence;
      this.nextCursorMoveSequence += 1;
      let i = !1;
      for (let a of this.getBrowserHostsForSession(t))
        i =
          a.setBrowserUseCursor(
            { moveSequence: r, sessionConversationId: t.conversationId, x: e.x, y: e.y },
            n.browserTabId,
          ) || i;
      e.waitForArrival !== !1 && i && (await this.waitForCursorArrival(r));
    }
    notifyCursorArrived(e) {
      Number.isInteger(e.moveSequence) &&
        this.options.ensureSessionRoute?.(e) === !0 &&
        this.resolveCursorArrivalWaiter(e.moveSequence);
    }
    async releaseSessionControl(e) {
      let t = this.getBrowserHostsForSession(e);
      await this.detachBrowserUseTabsForHostsBestEffort(t);
      for (let e of t)
        (e.setBrowserUseCursor(null),
          e.setBrowserUseActive(!1),
          this.clearPendingCapabilityIntents(e.routeKey));
    }
    async turnEnded(e) {
      let t = this.getBrowserUseSession(e);
      this.ensureBrowserUseSessionRoute(t);
      let n = e.turn_id;
      if (typeof n != `string` || this.usedTurnIdsByConversationId.get(t.conversationId) !== n)
        return;
      let r = this.updateTabsForSession(t).filter((e) => e.sessionControlled);
      await Promise.allSettled(
        r.map(async (e) => {
          (await this.restorePageClipboards(e),
            await this.cleanupDebuggerForTabBestEffort(e, `turn-ended`));
          let t = e.mark?.turnId === n ? e.mark.status : null;
          if (t === `handoff` && e.lifetime === `temporary`) {
            delete e.mark;
            return;
          }
          if (t != null || e.lifetime === `persistent`) {
            this.releaseTab(e);
            return;
          }
          this.closeTab(e);
        }),
      );
      for (let e of this.getBrowserHostsForSession(t))
        (e.setBrowserUseActive(!1), this.clearPendingCapabilityIntents(e.routeKey));
      this.clearRecordedBrowserUseTurn(t, e);
    }
    disposeRoute(e) {
      let t = this.hostsByRouteKey.get(e) ?? null;
      (this.hostsByRouteKey.delete(e),
        this.selectedTabIdsByRouteKey.delete(e),
        this.usedTurnIdsByConversationId.delete(YY(e)),
        t != null &&
          (t.setBrowserUseCursor(null),
          t.setBrowserUseActive(!1),
          this.clearPendingCapabilityIntents(t.routeKey)));
      for (let t of Array.from(this.tabsById.values()))
        t.routeKey === e &&
          (this.cleanupDebuggerForTabBestEffort(t, `route-disposed`), this.removeTab(t));
    }
    reassignRoute(e, t, n, r) {
      for (let t of this.tabsById.values())
        t.routeKey === e &&
          (n == null || t.browserTabId === n) &&
          this.releasePageCapturePaintLease(t);
      let i = this.selectedTabIdsByRouteKey.get(e) ?? null,
        a = i == null ? null : (this.tabsById.get(i) ?? null);
      i != null &&
        (n == null || a?.browserTabId === n) &&
        (this.selectedTabIdsByRouteKey.delete(e), this.selectedTabIdsByRouteKey.set(t, i));
      let o = this.hostsByRouteKey.get(e) ?? null;
      o != null && (this.hostsByRouteKey.delete(e), this.hostsByRouteKey.set(t, o));
      for (let [i, a] of this.tabsById)
        a.routeKey !== e ||
          (n != null && a.browserTabId !== n) ||
          this.tabsById.set(i, { ...a, browserTabId: r ?? a.browserTabId, routeKey: t });
      for (let [i, a] of Array.from(this.tabIdsByRouteTabKey.entries())) {
        let o = zYe(e, i);
        o == null || (n != null && o !== n) || this.moveRouteTabId(i, XY(t, r ?? o), a);
      }
    }
    dispose() {
      (this.resolveAllCursorArrivalWaiters(), this.disposeBrowserUseNavigationBlockedListener());
      for (let e of this.hostsByRouteKey.values()) e.setBrowserUseActive(!1);
      for (let e of this.tabsById.values())
        (this.releasePageCapturePaintLease(e),
          this.unregisterPageStateListener(e),
          this.unregisterDebuggerListener(e),
          this.detachTab(e));
      (this.tabsById.clear(),
        this.tabRuntimesById.clear(),
        this.tabIdsByPageKey.clear(),
        this.tabIdsByRouteTabKey.clear(),
        this.allowedDownloadGrantsByWebContentsId.clear(),
        this.pageCapturePaintLeaseWebContentsByTabId.clear(),
        this.pageEventListeners.clear(),
        this.selectedTabIdsByRouteKey.clear(),
        this.hostsByRouteKey.clear(),
        this.pendingVisibilityRouteKeys.clear(),
        this.pendingViewportSizesByRouteKey.clear(),
        this.usedTurnIdsByConversationId.clear());
    }
    requireBrowserUseSession(e) {
      let t = this.getBrowserUseSession(e);
      return (this.ensureBrowserUseSessionRoute(t), t);
    }
    getBrowserUseSession(e) {
      let t = e?.session_id;
      if (typeof t != `string`) throw Error(`Missing required browser session_id`);
      return { conversationId: t };
    }
    ensureBrowserUseSessionRoute(e) {
      if (this.options.ensureSessionRoute?.(e) !== !0)
        throw Error(
          `No ChatGPT browser route is available for browser session ${e.conversationId}`,
        );
    }
    async runLoggedRequest(e, t, n) {
      let r = this.getBrowserUseSession(e);
      try {
        return (this.ensureBrowserUseSessionRoute(r), await n(r));
      } catch (n) {
        throw (
          LY().warning(`IAB_LIFECYCLE iab backend request failed`, {
            safe: this.getRequestSafeFields(r, e, t),
            sensitive: { error: n },
          }),
          n
        );
      }
    }
    getRequestSafeFields(e, t, n) {
      return { conversationId: e.conversationId, request: n, turnId: t.turn_id ?? null };
    }
    async waitForCursorArrival(e) {
      this.cursorArrivalTimeoutMs <= 0 ||
        (await new Promise((t) => {
          let n = null,
            r = () => {
              (n != null && clearTimeout(n),
                this.cursorArrivalWaitersByMoveSequence.delete(e),
                t());
            };
          ((n = setTimeout(r, this.cursorArrivalTimeoutMs)),
            eX(n),
            this.cursorArrivalWaitersByMoveSequence.set(e, r));
        }));
    }
    resolveCursorArrivalWaiter(e) {
      this.cursorArrivalWaitersByMoveSequence.get(e)?.();
    }
    resolveAllCursorArrivalWaiters() {
      for (let e of Array.from(this.cursorArrivalWaitersByMoveSequence.values())) e();
    }
    getMetadata(e) {
      let t = {};
      return (
        this.options.buildFlavor != null && (t.codexAppBuildFlavor = this.options.buildFlavor),
        this.options.appSessionId != null && (t.codexAppSessionId = this.options.appSessionId),
        (t.codexSessionId = e.conversationId),
        t
      );
    }
    async getTabsForBrowserUse(e) {
      let t = this.updateTabsForSession(e),
        n = this.getRequiredBrowserHost(e),
        r = this.selectedTabIdsByRouteKey.get(n.routeKey) ?? null,
        i = t.find((e) => e.active),
        a = t.find((e) => e.cdpTabId === r),
        o = i?.sessionControlled === !1 ? i : (a ?? i ?? t[0]);
      return t.map((e) => ({ ...this.serializeTab(e), active: e === o }));
    }
    async createTabForBrowserUse(e) {
      let t = this.getRequiredBrowserHost(e),
        n = a.bn(`browser-use:${(0, _.randomUUID)()}`),
        r = !1,
        i = !1,
        o = null;
      try {
        (t.setBrowserUseActive(!0, n), this.applyPendingCapabilityIntents(t, n));
        let a = t.openPageForBrowserUse({
          browserTabId: n,
          createPanelTab: !0,
          startingUrl: this.initialPageUrl,
        });
        r = !0;
        let s = await a;
        return (
          (i = !0),
          (o = this.updateTabForPage(s, t.routeKey, `temporary`)),
          LY().info(`IAB_LIFECYCLE iab createTab mapped page to tab`, {
            safe: {
              ...e,
              browserTabId: n,
              pageKey: s.pageKey,
              routeKey: t.routeKey,
              tabId: o.cdpTabId,
              webContentsId: s.webContents.id,
            },
            sensitive: {},
          }),
          this.markBrowserUseCommandForTab(e, o),
          this.selectedTabIdsByRouteKey.set(t.routeKey, o.cdpTabId),
          this.serializeTab(o)
        );
      } catch (e) {
        throw (
          o != null && this.releasePageCapturePaintLease(o),
          (!r || i) && (t.setBrowserUseActive(!1, n), t.closePageForBrowserUse(n)),
          e
        );
      }
    }
    async nameSessionForBrowserUse(e, t) {
      if ((this.getRequiredBrowserHost(e), typeof t.name != `string`))
        throw Error(`nameSession requires a name`);
    }
    async attachForBrowserUse(e, t) {
      let n = await this.getTab(e, t.tabId);
      this.markBrowserUseCommandForTab(e, n);
      try {
        (this.assertCurrentPageAllowed(e, n),
          await this.attachTab(n),
          this.registerDebuggerListener(n));
      } catch (e) {
        throw (this.releasePageCapturePaintLease(n), e);
      }
    }
    async detachForBrowserUse(e, t) {
      this.requireBrowserUseTab(e, t.tabId);
      let n = this.tabsById.get(t.tabId);
      n != null &&
        (this.markBrowserUseCommandForTab(e, n),
        this.releasePageCapturePaintLease(n),
        this.unregisterDebuggerListener(n),
        await this.detachTab(n));
    }
    async executeCdpForBrowserUse(e, t) {
      let n = await this.getTabForCommand(e, t),
        r = this.getBrowserHost(e),
        i = await this.getCdpNavigationUrl(e, n, t),
        a = !1;
      this.markBrowserUseCommandForTab(e, n);
      try {
        if (t.method === `Target.closeTarget`) return await this.executeEmulatedTargetCommand(n, t);
        (this.assertCurrentPageAllowed(e, n),
          r != null &&
            i != null &&
            (r.assertBrowserUseNavigationAllowed(n.pageKey, i),
            r.trackPendingBrowserUseNavigation(n.pageKey, i),
            (a = !0)));
        let o = OYe(t.method);
        if (
          (o || GY(t.method),
          t.method !== `Target.getTargetInfo` &&
            (await this.attachForBrowserUse(e, { tabId: n.cdpTabId })),
          await this.waitForTabReadyForCdp(e, n),
          this.assertTabMatchesCurrentBrowserUsePage(e, n),
          this.assertCurrentPageAllowed(e, n),
          o)
        )
          return await this.executeEmulatedTargetCommand(n, t);
        if (t.method === `Page.reload`)
          return (
            JY(t.commandParams) && t.commandParams.ignoreCache === !0
              ? n.webContents.reloadIgnoringCache()
              : n.webContents.reload(),
            {}
          );
        try {
          let i = nX(t.timeoutMs, this.cdpCommandTimeoutMs),
            a = Date.now() + i;
          return (
            r?.waitForPendingDebuggerSync != null &&
              (await rX(
                r.waitForPendingDebuggerSync(n.browserTabId),
                i,
                `Timed out waiting for debugger synchronization for tab ${n.cdpTabId}`,
              )),
            t.method.startsWith(`Input.`) &&
              (this.assertTabMatchesCurrentBrowserUsePage(e, n),
              this.assertCurrentPageAllowed(e, n),
              await this.sendDebuggerCommand(
                n,
                `Emulation.setFocusEmulationEnabled`,
                { enabled: !0 },
                t.target,
                Math.max(1, a - Date.now()),
              ),
              this.assertTabMatchesCurrentBrowserUsePage(e, n),
              this.assertCurrentPageAllowed(e, n)),
            await this.executeCdpCommandWithCaptureSurface(n, r, {
              ...t,
              timeoutMs: Math.max(1, a - Date.now()),
            })
          );
        } finally {
          t.method === `Page.close` &&
            (await this.cleanupDebuggerForTabBestEffort(n, `page-close`));
        }
      } catch (e) {
        throw (
          r != null && a && r.clearPendingBrowserUseNavigation(n.pageKey),
          tX(e)
            ? t.preserveDebuggerOnTimeout === !0
              ? this.releasePageCapturePaintLease(n)
              : await this.cleanupDebuggerForTabBestEffort(n, `cdp-timeout`)
            : this.releasePageCapturePaintLease(n),
          e
        );
      }
    }
    getRequiredBrowserHost(e) {
      let t = this.getBrowserHost(e);
      if (t == null)
        throw (
          LY().warning(`IAB_LIFECYCLE iab host lookup returned null`, { safe: e, sensitive: {} }),
          Error(`No in-app Browser host is available for this browser-use session`)
        );
      return this.rememberBrowserHost(t);
    }
    rememberBrowserHost(e) {
      return (this.hostsByRouteKey.set(e.routeKey, e), e);
    }
    setPendingCapabilityIntent(e, t) {
      switch (t.kind) {
        case `visibility`:
          t.visible
            ? this.pendingVisibilityRouteKeys.add(e)
            : this.pendingVisibilityRouteKeys.delete(e);
          return;
        case `viewport`:
          t.viewportSize == null
            ? this.pendingViewportSizesByRouteKey.delete(e)
            : this.pendingViewportSizesByRouteKey.set(e, t.viewportSize);
          return;
      }
    }
    applyPendingCapabilityIntents(e, t) {
      let n = this.pendingViewportSizesByRouteKey.get(e.routeKey) ?? null;
      (n != null &&
        (this.pendingViewportSizesByRouteKey.delete(e.routeKey), e.setViewportForBrowserUse(n, t)),
        this.pendingVisibilityRouteKeys.has(e.routeKey) &&
          (this.pendingVisibilityRouteKeys.delete(e.routeKey),
          e.setBrowserVisibleForBrowserUse(!0, t)));
    }
    clearPendingCapabilityIntents(e) {
      (this.pendingVisibilityRouteKeys.delete(e), this.pendingViewportSizesByRouteKey.delete(e));
    }
    getBrowserHostsForSession(e) {
      let t = new Set(),
        n = this.getBrowserHost(e);
      n != null && t.add(this.rememberBrowserHost(n));
      for (let [n, r] of this.hostsByRouteKey.entries()) YY(n) === e.conversationId && t.add(r);
      return [...t];
    }
    updateTabsForSession(e) {
      this.clearDestroyedTabRuntimes();
      let t = this.getRequiredBrowserHost(e),
        n = t.getTabsForBrowserUse(),
        r = new Set(),
        i = n.map((e) => {
          let n = XY(t.routeKey, e.browserTabId);
          r.add(n);
          let i = this.updateTabForInfo(e, t.routeKey);
          if (!e.sessionControlled) return i;
          let a = t.getPageForBrowserUse(e.browserTabId);
          return a == null || a.webContents.isDestroyed()
            ? i
            : this.updateTabForPage(a, t.routeKey, e.lifetime);
        });
      return (this.pruneMissingTabs(t.routeKey, r), this.clearDestroyedTabRuntimes(), i);
    }
    pruneMissingTabs(e, t) {
      for (let n of Array.from(this.tabsById.values())) {
        if (n.routeKey !== e) continue;
        let r = XY(n.routeKey, n.browserTabId);
        t.has(r) ||
          (this.forgetRouteTabId(n),
          this.cleanupDebuggerForTabBestEffort(n, `tab-inventory-pruned`),
          this.removeTab(n));
      }
    }
    moveRouteTabId(e, t, n) {
      e !== t && this.tabIdsByRouteTabKey.delete(e);
      let r = this.tabIdsByRouteTabKey.get(t) ?? null;
      if (r != null && r !== n) {
        let e = this.tabsById.get(r) ?? null;
        e != null && this.removeTab(e);
      }
      this.tabIdsByRouteTabKey.set(t, n);
    }
    getSelectedOrFirstControlledTabForSession(e) {
      let t = this.getRequiredBrowserHost(e),
        n = this.updateTabsForSession(e).filter((e) => e.sessionControlled),
        r = this.selectedTabIdsByRouteKey.get(t.routeKey) ?? null;
      return (
        (r == null ? null : (n.find((e) => e.cdpTabId === r) ?? null)) ??
        n.find((e) => e.active) ??
        n[0] ??
        null
      );
    }
    updateTabForPage(e, t, n) {
      let r = this.tabIdsByRouteTabKey.get(XY(t, e.browserTabId)),
        i = r == null ? null : (this.tabsById.get(r) ?? null),
        a = this.updateTabForInfo(
          {
            active: e.active,
            browserTabId: e.browserTabId,
            lifetime: n,
            sessionControlled: i?.sessionControlled ?? !1,
            title: e.title,
            url: ZY(e.url, e.webContents.isDestroyed() ? `` : e.webContents.getURL(), i?.url, n),
          },
          t,
        ),
        o = this.tabRuntimesById.get(a.cdpTabId) ?? null,
        s = this.pageCapturePaintLeaseWebContentsByTabId.has(a.cdpTabId),
        c = o?.pageKey ?? null,
        l = o?.webContents ?? null;
      (c != null && c !== e.pageKey && this.tabIdsByPageKey.delete(c),
        l != null &&
          l !== e.webContents &&
          (this.cleanupDebuggerForTabBestEffort(a, `page-replaced`),
          this.unregisterPageStateListener(a)));
      let u = { ...a, pageKey: e.pageKey, webContents: e.webContents };
      return (
        this.tabRuntimesById.set(u.cdpTabId, { pageKey: u.pageKey, webContents: u.webContents }),
        this.tabIdsByPageKey.set(e.pageKey, u.cdpTabId),
        s && this.acquirePageCapturePaintLease(u),
        this.registerPageStateListener(u),
        u
      );
    }
    updateTabForInfo(e, t) {
      let n = XY(t, e.browserTabId),
        r = this.tabIdsByRouteTabKey.get(n) ?? null,
        i = r ?? this.nextCdpTabId;
      r ?? (this.nextCdpTabId += 1);
      let a = this.tabsById.get(i) ?? null;
      this.tabIdsByRouteTabKey.set(n, i);
      let o = {
        browserTabId: e.browserTabId,
        cdpTabId: i,
        lifetime: e.lifetime,
        routeKey: t,
        sessionControlled: e.sessionControlled,
        title: e.title,
        url: e.url,
        active: e.active,
        mark: a?.mark,
      };
      return (this.tabsById.set(i, o), o);
    }
    getTabIdForWebContentsId(e) {
      for (let [t, n] of this.tabRuntimesById.entries()) if (n.webContents.id === e) return t;
      return null;
    }
    serializeTab(e) {
      let t = this.tabRuntimesById.get(e.cdpTabId) ?? null,
        n = t == null || t.webContents.isDestroyed() ? `` : t.webContents.getTitle(),
        r = t == null || t.webContents.isDestroyed() ? `` : t.webContents.getURL();
      return {
        id: e.cdpTabId,
        providerTabId: e.browserTabId,
        sessionControlled: e.sessionControlled,
        title: HYe(n, r, e.title, e.url),
        active: e.cdpTabId === this.selectedTabIdsByRouteKey.get(e.routeKey),
        url: BYe(r, e.url, e.lifetime),
      };
    }
    markBrowserUseCommandForTab(e, t) {
      let n = this.getBrowserHost(e);
      if (n == null) return;
      this.rememberBrowserHost(n);
      let r = this.tabRuntimesById.get(t.cdpTabId) ?? null;
      (r != null && n.activateBrowserUseNavigationRestriction(r.pageKey),
        n.setBrowserUseActive(!0, t.browserTabId),
        (t.sessionControlled = !0),
        this.applyPendingCapabilityIntents(n, t.browserTabId),
        this.acquirePageCapturePaintLease(t));
    }
    acquirePageCapturePaintLease(e) {
      let t = this.tabRuntimesById.get(e.cdpTabId) ?? null;
      if (!(t == null || t.webContents.isDestroyed())) {
        for (let t of this.pageCapturePaintLeaseWebContentsByTabId.keys()) {
          let n = this.tabsById.get(t) ?? null;
          t !== e.cdpTabId && n?.routeKey === e.routeKey && this.releasePageCapturePaintLease(n);
        }
        if (
          (this.pageCapturePaintLeaseWebContentsByTabId.get(e.cdpTabId) ?? null) !== t.webContents
        ) {
          this.releasePageCapturePaintLease(e);
          try {
            (t.webContents.setPageCapturePaintLeaseEnabled(!0),
              this.pageCapturePaintLeaseWebContentsByTabId.set(e.cdpTabId, t.webContents));
          } catch (n) {
            LY().warning(`IAB_LIFECYCLE failed to acquire page capture paint lease`, {
              safe: {
                pageKey: t.pageKey,
                routeKey: e.routeKey,
                tabId: e.cdpTabId,
                webContentsId: t.webContents.id,
              },
              sensitive: { error: n },
            });
          }
        }
      }
    }
    releasePageCapturePaintLease(e) {
      let t = this.pageCapturePaintLeaseWebContentsByTabId.get(e.cdpTabId) ?? null;
      if (
        t != null &&
        (this.pageCapturePaintLeaseWebContentsByTabId.delete(e.cdpTabId), !t.isDestroyed())
      )
        try {
          t.setPageCapturePaintLeaseEnabled(!1);
        } catch (n) {
          LY().warning(`IAB_LIFECYCLE failed to release page capture paint lease`, {
            safe: { routeKey: e.routeKey, tabId: e.cdpTabId, webContentsId: t.id },
            sensitive: { error: n },
          });
        }
    }
    recordBrowserUseTurn(e, t) {
      typeof t.turn_id == `string` &&
        this.usedTurnIdsByConversationId.set(e.conversationId, t.turn_id);
    }
    clearRecordedBrowserUseTurn(e, t) {
      typeof t.turn_id == `string` &&
        this.usedTurnIdsByConversationId.get(e.conversationId) === t.turn_id &&
        this.usedTurnIdsByConversationId.delete(e.conversationId);
    }
    emitBrowserUseNavigationBlockedEvent(e) {
      let t = this.tabIdsByPageKey.get(e.pageKey);
      t != null &&
        this.emitCdpEvent({
          source: { tabId: t },
          method: `Page.navigationBlocked`,
          params: { errorText: e.error.message, resourceType: e.resourceType, url: e.url },
        });
    }
    assertCurrentPageAllowed(e, t) {
      let n = this.tabRuntimesById.get(t.cdpTabId) ?? null;
      n != null &&
        this.getBrowserHost(e)?.assertBrowserUseNavigationAllowed(
          n.pageKey,
          n.webContents.getURL() || t.url,
        );
    }
    assertTabMatchesCurrentBrowserUsePage(e, t) {
      let n = this.getRequiredBrowserHost(e).getPageForBrowserUse(t.browserTabId);
      if (
        n == null ||
        n.pageKey !== t.pageKey ||
        n.webContents !== t.webContents ||
        t.webContents.isDestroyed()
      )
        throw (
          LY().warning(`IAB_LIFECYCLE iab rejected stale input tab`, {
            safe: {
              ...e,
              expectedPageKey: n?.pageKey ?? null,
              pageWebContentsDestroyed: n?.webContents.isDestroyed() ?? null,
              tabId: t.cdpTabId,
              tabPageKey: t.pageKey,
              tabWebContentsDestroyed: t.webContents.isDestroyed(),
            },
            sensitive: {},
          }),
          Error(
            `Tab ${t.cdpTabId} is no longer attached to the browser page for session ${e.conversationId}`,
          )
        );
    }
    async getCdpNavigationUrl(e, t, n) {
      let r = KY(n);
      if (r != null) return r;
      let i = NYe(n);
      return i == null ? null : this.getHistoryNavigationUrl(e, t, i);
    }
    async getHistoryNavigationUrl(e, t, n) {
      let r = t.webContents.debugger.isAttached();
      (await this.attachTab(t), await this.waitForTabReadyForCdp(e, t));
      try {
        let e = await rX(
            t.webContents.debugger.sendCommand(`Page.getNavigationHistory`, {}),
            this.cdpCommandTimeoutMs,
            `Timed out reading navigation history for tab ${t.cdpTabId}`,
          ),
          r = (Array.isArray(e.entries) ? e.entries : []).find((e) => e.id === n)?.url;
        if (typeof r != `string`)
          throw Error(`Unable to resolve navigation history entry ${n} for tab ${t.cdpTabId}`);
        return r;
      } finally {
        r || (await this.detachTab(t));
      }
    }
    async getTab(e, t) {
      (this.updateTabsForSession(e), this.requireBrowserUseTab(e, t));
      let n = this.tabsById.get(t);
      if (n == null) throw Error(`Unknown tab: ${t}`);
      let r = n.sessionControlled,
        i = await this.requireLiveTab(e, n);
      return (
        this.assertTabMatchesCurrentBrowserUsePage(e, i),
        r || this.selectedTabIdsByRouteKey.set(i.routeKey, i.cdpTabId),
        i
      );
    }
    async requireLiveTab(e, t) {
      let n = this.getRequiredBrowserHost(e),
        r = n.getPageForBrowserUse(t.browserTabId),
        i =
          r == null || r.webContents.isDestroyed()
            ? await n.openPageForBrowserUse({ browserTabId: t.browserTabId })
            : r;
      return this.updateTabForPage(i, t.routeKey, t.lifetime);
    }
    async getTabForCommand(e, t) {
      if (t.target.tabId != null) return this.getTab(e, t.target.tabId);
      if (
        !this.shouldAutoBootstrapNavigateCommand(t) ||
        this.getSelectedOrFirstControlledTabForSession(e) != null
      )
        throw Error(`executeCdp requires a tabId target`);
      let n = await this.createTabForBrowserUse(e);
      return this.getTab(e, n.id);
    }
    shouldAutoBootstrapNavigateCommand(e) {
      return KY(e) != null;
    }
    clearDestroyedTabRuntimes() {
      for (let e of this.tabsById.values()) {
        let t = this.tabRuntimesById.get(e.cdpTabId) ?? null;
        t != null &&
          t.webContents.isDestroyed() &&
          (this.unregisterDebuggerListener(e),
          this.unregisterPageStateListener(e),
          this.pageCapturePaintLeaseWebContentsByTabId.delete(e.cdpTabId),
          this.tabIdsByPageKey.get(t.pageKey) === e.cdpTabId &&
            this.tabIdsByPageKey.delete(t.pageKey),
          this.allowedDownloadGrantsByWebContentsId.delete(t.webContents.id),
          this.tabRuntimesById.delete(e.cdpTabId));
      }
    }
    closeTab(e) {
      let t = this.hostsByRouteKey.get(e.routeKey) ?? null,
        n = this.tabRuntimesById.get(e.cdpTabId) ?? null;
      (t == null && n != null ? n.webContents.close() : t?.closePageForBrowserUse(e.browserTabId),
        this.forgetRouteTabId(e),
        this.removeTab(e));
    }
    releaseTab(e) {
      (this.hostsByRouteKey.get(e.routeKey)?.releasePageForBrowserUse(e.browserTabId),
        this.removeTab(e));
    }
    removeTab(e) {
      (this.releasePageCapturePaintLease(e),
        this.unregisterPageStateListener(e),
        this.unregisterDebuggerListener(e, `tab-removed`),
        this.tabsById.delete(e.cdpTabId));
      let t = this.tabRuntimesById.get(e.cdpTabId) ?? null;
      (t != null &&
        this.tabIdsByPageKey.get(t.pageKey) === e.cdpTabId &&
        this.tabIdsByPageKey.delete(t.pageKey),
        t != null && this.allowedDownloadGrantsByWebContentsId.delete(t.webContents.id),
        this.tabRuntimesById.delete(e.cdpTabId),
        this.selectedTabIdsByRouteKey.get(e.routeKey) === e.cdpTabId &&
          this.selectedTabIdsByRouteKey.delete(e.routeKey));
    }
    forgetRouteTabId(e) {
      let t = XY(e.routeKey, e.browserTabId);
      this.tabIdsByRouteTabKey.get(t) === e.cdpTabId && this.tabIdsByRouteTabKey.delete(t);
    }
    requireBrowserUseTab(e, t) {
      let n = this.getRequiredBrowserHost(e);
      if (
        this.tabsById.get(t)?.routeKey !== n.routeKey &&
        (this.updateTabsForSession(e), this.tabsById.get(t)?.routeKey !== n.routeKey)
      )
        throw (
          LY().warning(`IAB_LIFECYCLE iab rejected tab for route`, {
            safe: {
              ...e,
              expectedRouteKey: n.routeKey,
              tabId: t,
              tabRouteKey: this.tabsById.get(t)?.routeKey ?? null,
            },
            sensitive: {},
          }),
          Error(`Tab ${t} is not part of browser session ${e.conversationId}`)
        );
    }
    async detachBrowserUseTabsForHostsBestEffort(e) {
      let t = new Set([...e].map((e) => e.routeKey));
      await Promise.allSettled(
        [...this.tabsById.values()]
          .filter((e) => t.has(e.routeKey))
          .map(async (e) => {
            (await this.restorePageClipboards(e),
              await this.cleanupDebuggerForTabBestEffort(e, `session-activity-ended`));
          }),
      );
    }
    async restorePageClipboards(e) {
      let t = this.tabRuntimesById.get(e.cdpTabId);
      if (t == null || t.webContents.isDestroyed() || !t.webContents.debugger.isAttached()) return;
      let n = { ...e, ...t };
      await Promise.allSettled(
        [void 0, ...(this.debuggerTargetSessionsByTabId.get(e.cdpTabId)?.values() ?? [])].map((e) =>
          this.sendDebuggerCommand(
            n,
            `Runtime.evaluate`,
            { expression: `globalThis.__browserUseClipboardBridge?.cleanup()` },
            { sessionId: e },
            Math.min(this.cdpCommandTimeoutMs, SYe),
          ),
        ),
      );
    }
    async cleanupDebuggerForTabBestEffort(e, t) {
      let n = this.tabRuntimesById.get(e.cdpTabId) ?? null;
      (this.releasePageCapturePaintLease(e), this.unregisterDebuggerListener(e, t));
      try {
        await this.detachTab(e, n);
      } catch (r) {
        LY().warning(`IAB_LIFECYCLE failed to detach debugger`, {
          safe: {
            pageKey: n?.pageKey ?? null,
            reason: t,
            routeKey: e.routeKey,
            tabId: e.cdpTabId,
            webContentsDestroyed: n?.webContents.isDestroyed() ?? null,
            webContentsId: n?.webContents.id ?? null,
          },
          sensitive: { error: r },
        });
      }
    }
    registerPageStateListener(e) {
      let t = this.pageStateListeners.get(e.cdpTabId) ?? null;
      if (t?.webContents === e.webContents) return;
      t != null && this.unregisterPageStateListener(e);
      let n = (t, n) => {
          this.updateTabNavigationState(e.cdpTabId, n);
        },
        r = (t, n, r) => {
          r && this.updateTabNavigationState(e.cdpTabId, n);
        },
        i = (t, n) => {
          let r = this.tabsById.get(e.cdpTabId) ?? null;
          r != null && (r.title = VYe(n, r));
        },
        a = () => {
          this.unregisterPageStateListener(e);
        };
      (e.webContents.on(`did-navigate`, n),
        e.webContents.on(`did-navigate-in-page`, r),
        e.webContents.on(`page-title-updated`, i),
        e.webContents.on(`destroyed`, a),
        this.pageStateListeners.set(e.cdpTabId, {
          destroyedListener: a,
          didNavigateInPageListener: r,
          didNavigateListener: n,
          pageTitleUpdatedListener: i,
          webContents: e.webContents,
        }));
    }
    unregisterPageStateListener(e) {
      let t = this.pageStateListeners.get(e.cdpTabId);
      t != null &&
        (this.pageStateListeners.delete(e.cdpTabId),
        t.webContents.isDestroyed() ||
          (t.webContents.removeListener(`did-navigate`, t.didNavigateListener),
          t.webContents.removeListener(`did-navigate-in-page`, t.didNavigateInPageListener),
          t.webContents.removeListener(`page-title-updated`, t.pageTitleUpdatedListener)),
        t.webContents.removeListener(`destroyed`, t.destroyedListener));
    }
    updateTabNavigationState(e, t) {
      let n = this.tabsById.get(e) ?? null;
      n != null && t.length !== 0 && (n.url = ZY(n.url, t, n.url, n.lifetime));
    }
    registerDebuggerListener(e) {
      if (this.debuggerListeners.has(e.cdpTabId)) return;
      let t = (n, r, i, a) => {
          if (this.debuggerListeners.get(e.cdpTabId)?.listener !== t) return;
          let o = typeof a == `string` && a.length > 0 ? a : void 0,
            s = o == null ? void 0 : this.debuggerTargetIdsBySessionId.get(o),
            c = { source: { tabId: e.cdpTabId, sessionId: o, targetId: s }, method: r };
          (JY(i) && ((c.params = i), this.recordDebuggerTargetEvent(e, r, i)),
            this.emitCdpEvent(c));
        },
        n = () => {
          this.unregisterDebuggerListener(e, `webcontents-destroyed`);
        },
        r = (t, n) => {
          (LY().info(`IAB_LIFECYCLE debugger render process gone`, {
            safe: {
              exitCode: RYe(n),
              pageKey: e.pageKey,
              reason: LYe(n),
              routeKey: e.routeKey,
              tabId: e.cdpTabId,
              webContentsId: e.webContents.id,
            },
            sensitive: {},
          }),
            this.cleanupDebuggerForTabBestEffort(e, `render-process-gone`));
        };
      (e.webContents.debugger.on(`message`, t),
        e.webContents.once(`destroyed`, n),
        e.webContents.once(`render-process-gone`, r),
        this.debuggerListeners.set(e.cdpTabId, {
          destroyedListener: n,
          listener: t,
          renderProcessGoneListener: r,
          webContents: e.webContents,
          webContentsId: e.webContents.id,
        }),
        LY().info(`IAB_LIFECYCLE registered debugger listener`, {
          safe: {
            pageKey: e.pageKey,
            routeKey: e.routeKey,
            tabId: e.cdpTabId,
            webContentsId: e.webContents.id,
          },
          sensitive: {},
        }));
    }
    unregisterDebuggerListener(e, t = `manual`) {
      this.forgetDebuggerTargetSessionsForTab(e);
      let n = this.debuggerListeners.get(e.cdpTabId);
      if (n == null) return;
      this.debuggerListeners.delete(e.cdpTabId);
      let r = n.webContents.isDestroyed();
      (r || n.webContents.debugger.removeListener(`message`, n.listener),
        n.webContents.removeListener(`destroyed`, n.destroyedListener),
        n.webContents.removeListener(`render-process-gone`, n.renderProcessGoneListener),
        LY().info(`IAB_LIFECYCLE unregistered debugger listener`, {
          safe: {
            pageKey: this.tabRuntimesById.get(e.cdpTabId)?.pageKey ?? null,
            reason: t,
            routeKey: e.routeKey,
            tabId: e.cdpTabId,
            webContentsDestroyed: r,
            webContentsId: n.webContentsId,
          },
          sensitive: {},
        }));
    }
    recordDebuggerTargetEvent(e, t, n) {
      if (t === `Target.attachedToTarget`) {
        let t = WY(n, `sessionId`),
          r = UY(MYe(n, `targetInfo`));
        t != null && r != null && this.rememberDebuggerTargetSession(e, r, t);
        return;
      }
      if (t === `Target.detachedFromTarget`) {
        let e = WY(n, `sessionId`);
        e != null && this.forgetDebuggerTargetSession(e);
      }
    }
    emitCdpEvent(e) {
      for (let t of this.cdpEventListeners) t(e);
    }
    async attachTab(e) {
      if (e.webContents.isDestroyed()) throw Error(`Unknown tab: ${e.cdpTabId}`);
      if (!e.webContents.debugger.isAttached())
        try {
          e.webContents.debugger.attach(`1.3`);
        } catch (e) {
          if ((e instanceof Error ? e.message : String(e)).includes(`already attached`)) return;
          throw e;
        }
    }
    async attachDebuggerTarget(e, t) {
      if (this.debuggerSessionIdForTarget(e, t) != null) return;
      let n = await this.sendDebuggerCommand(e, `Target.attachToTarget`, {
        flatten: !0,
        targetId: t,
      });
      if (typeof n.sessionId != `string`)
        throw Error(`Target.attachToTarget did not return a sessionId`);
      this.rememberDebuggerTargetSession(e, t, n.sessionId);
    }
    async detachDebuggerTarget(e, t) {
      let n = this.debuggerSessionIdForTarget(e, t);
      if (n != null)
        try {
          await this.sendDebuggerCommand(e, `Target.detachFromTarget`, { sessionId: n });
        } finally {
          this.forgetDebuggerTargetSession(n);
        }
    }
    debuggerSessionIdForTarget(e, t) {
      return this.debuggerTargetSessionsByTabId.get(e.cdpTabId)?.get(t) ?? null;
    }
    rememberDebuggerTargetSession(e, t, n) {
      let r = this.debuggerTargetSessionsByTabId.get(e.cdpTabId) ?? new Map();
      (this.debuggerTargetSessionsByTabId.set(e.cdpTabId, r),
        r.set(t, n),
        this.debuggerTargetIdsBySessionId.set(n, t));
    }
    forgetDebuggerTargetSession(e) {
      this.debuggerTargetIdsBySessionId.delete(e);
      for (let t of this.debuggerTargetSessionsByTabId.values())
        for (let [n, r] of t.entries()) r === e && t.delete(n);
    }
    forgetDebuggerTargetSessionsForTab(e) {
      let t = this.debuggerTargetSessionsByTabId.get(e.cdpTabId);
      if (t != null) {
        for (let e of t.values()) this.debuggerTargetIdsBySessionId.delete(e);
        this.debuggerTargetSessionsByTabId.delete(e.cdpTabId);
      }
    }
    async detachTab(e, t = this.tabRuntimesById.get(e.cdpTabId) ?? null) {
      if (t == null || t.webContents.isDestroyed()) {
        this.forgetDebuggerTargetSessionsForTab(e);
        return;
      }
      if (!t.webContents.debugger.isAttached()) {
        this.forgetDebuggerTargetSessionsForTab(e);
        return;
      }
      (t.webContents.debugger.detach(), this.forgetDebuggerTargetSessionsForTab(e));
      for (let t of this.cdpDetachListeners) t({ tabId: e.cdpTabId });
    }
    async ensureTabReadyForCdp(e) {
      if (e.webContents.isDestroyed()) throw Error(`Unknown tab: ${e.cdpTabId}`);
      e.webContents.getURL().length > 0 ||
        (await rX(
          e.webContents.loadURL(this.initialPageUrl),
          this.pageReadyTimeoutMs,
          `Timed out loading initial page "${this.initialPageUrl}" for tab ${e.cdpTabId}`,
        ));
    }
    async waitForTabReadyForCdp(e, t) {
      let n = this.getBrowserHost(e);
      (n?.waitForPageReady != null &&
        (await rX(
          n.waitForPageReady(t.browserTabId),
          this.pageReadyTimeoutMs,
          `Timed out waiting for tab ${t.cdpTabId} to finish its initial navigation`,
        ),
        this.assertTabMatchesCurrentBrowserUsePage(e, t)),
        await this.ensureTabReadyForCdp(t));
    }
    async executeEmulatedTargetCommand(e, t) {
      if (t.method === `Target.getTargetInfo`) {
        if (
          kYe(e, t.target) ||
          (JY(t.commandParams) &&
            t.commandParams.targetId !== void 0 &&
            t.commandParams.targetId !== VY(e))
        )
          throw Error(`Target.getTargetInfo can only read the current in-app browser tab`);
        return {
          targetInfo: {
            ...HY(e),
            attached: e.webContents.debugger.isAttached(),
            url: e.webContents.getURL(),
          },
        };
      }
      if (t.method === `Target.getTargets`)
        return {
          targetInfos: [
            ...[...this.tabsById.values()]
              .filter((t) => t.routeKey === e.routeKey)
              .map((e) => HY(e)),
            ...(await this.getDebuggerFrameTargetInfos(e)),
          ],
        };
      if (t.method === `Target.closeTarget`) {
        if (AYe(t) !== VY(e))
          throw Error(`Target.closeTarget can only close the current in-app browser tab`);
        return (
          await this.cleanupDebuggerForTabBestEffort(e, `target-close`),
          this.closeTab(e),
          { success: !0 }
        );
      }
      throw Error(`Browser Use CDP method is not supported in the in-app browser: ${t.method}`);
    }
    async executeCdpCommandWithCaptureSurface(e, t, n) {
      let r = PYe(n);
      if (t == null || r == null) return this.executeCdpCommand(e, n);
      t.setCaptureSurfaceForBrowserUse(r, e.browserTabId);
      try {
        return (await this.waitForCaptureSurface(e, r), await this.executeCdpCommand(e, n));
      } finally {
        t.setCaptureSurfaceForBrowserUse(null, e.browserTabId);
      }
    }
    async executeCdpCommand(e, t) {
      return (
        GY(t.method),
        this.sendDebuggerCommand(
          e,
          t.method,
          t.commandParams ?? {},
          t.target,
          nX(t.timeoutMs, this.cdpCommandTimeoutMs),
        )
      );
    }
    async sendDebuggerCommand(e, t, n, r = {}, i = this.cdpCommandTimeoutMs) {
      let a =
        r.sessionId ??
        (r.targetId == null ? void 0 : (this.debuggerSessionIdForTarget(e, r.targetId) ?? void 0));
      if (r.targetId != null && r.targetId !== VY(e) && a == null)
        throw Error(`No in-app browser debugger session is attached for target ${r.targetId}`);
      return await rX(
        e.webContents.debugger.sendCommand(t, n, a),
        i,
        `Timed out running CDP command "${t}" for tab ${e.cdpTabId}`,
      );
    }
    async getDebuggerFrameTargetInfos(e) {
      let t = await this.sendDebuggerCommand(e, `Target.getTargets`, {}).catch(
        async (t) => (
          tX(t) && (await this.cleanupDebuggerForTabBestEffort(e, `cdp-timeout`)),
          null
        ),
      );
      return !JY(t) || !Array.isArray(t.targetInfos)
        ? []
        : t.targetInfos.filter(jYe).map((t) => ({ ...t, tabId: e.cdpTabId }));
    }
    async waitForCaptureSurface(e, t) {
      let n = Date.now() + CYe;
      do {
        let r;
        try {
          r = await rX(
            e.webContents.debugger.sendCommand(`Page.getLayoutMetrics`, {}),
            Math.max(1, n - Date.now()),
            `Timed out reading layout metrics for tab ${e.cdpTabId}`,
          );
        } catch {
          return;
        }
        if (FYe(r, t)) return;
        await WYe(wYe);
      } while (Date.now() < n);
    }
    pruneExpiredAllowedDownloadGrants() {
      let e = Date.now() - TYe;
      for (let [t, n] of this.allowedDownloadGrantsByWebContentsId)
        n.grantedAtMs < e && this.allowedDownloadGrantsByWebContentsId.delete(t);
    }
  };
}

export {
  ADD_BROWSER_USE_DOWNLOAD_CHANGE_LISTENER,
  CONSUME_ALLOWED_BROWSER_USE_DOWNLOAD,
  IAB_ABOUT_BLANK,
  IAB_CAPTURE_SURFACE_POLL_MS,
  IAB_CAPTURE_SURFACE_TIMEOUT_MS,
  IAB_CDP_COMMAND_TIMEOUT_MS,
  IAB_CLIPBOARD_CLEANUP_TIMEOUT_MS,
  IAB_CURSOR_ARRIVAL_TIMEOUT_MS,
  IAB_DOWNLOAD_GRANT_TTL_MS,
  IAB_PAGE_READY_TIMEOUT_MS,
  IAB_SESSION_CONTENT_KEY,
  NOTIFY_BROWSER_USE_DOWNLOAD_CHANGE,
  createIabBrowserUseApiClass,
};
export type { IabBrowserUseApiDependencies };
if (typeof module !== `undefined`) module.exports = {
  ADD_BROWSER_USE_DOWNLOAD_CHANGE_LISTENER,
  CONSUME_ALLOWED_BROWSER_USE_DOWNLOAD,
  IAB_ABOUT_BLANK,
  IAB_CAPTURE_SURFACE_POLL_MS,
  IAB_CAPTURE_SURFACE_TIMEOUT_MS,
  IAB_CDP_COMMAND_TIMEOUT_MS,
  IAB_CLIPBOARD_CLEANUP_TIMEOUT_MS,
  IAB_CURSOR_ARRIVAL_TIMEOUT_MS,
  IAB_DOWNLOAD_GRANT_TTL_MS,
  IAB_PAGE_READY_TIMEOUT_MS,
  IAB_SESSION_CONTENT_KEY,
  NOTIFY_BROWSER_USE_DOWNLOAD_CHANGE,
  createIabBrowserUseApiClass,
};
