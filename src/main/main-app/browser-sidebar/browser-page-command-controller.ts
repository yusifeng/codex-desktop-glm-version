// @ts-nocheck

/** Owns browser page command routing and host/page lifecycle orchestration. */
export function createBrowserPageCommandControllerClass(dependencies: Record<string, any>) {
  const { a, l, n, crypto, hX, mU, pU, hU, QU, ZZe, sq, cq, lq, uq, fq, sW, XZe, GXe, iK, pX, DU, oX, PHe, GU, rW, WX, GX } = dependencies;
  const thumbnailCaptures = new WeakMap();
  const thumbnailWidth = 608;
  const thumbnailHeight = 320;
  const thumbnailCacheLifetimeMs = 1_000;

  function pageInfoAnchorBounds(origin, bounds) {
    if (
      bounds == null ||
      !Number.isFinite(bounds.x) ||
      !Number.isFinite(bounds.y) ||
      !Number.isFinite(bounds.width) ||
      !Number.isFinite(bounds.height) ||
      bounds.width <= 0 ||
      bounds.height <= 0
    )
      return;
    const browserWindow = l.BrowserWindow.fromWebContents(origin);
    if (browserWindow == null || browserWindow.isDestroyed()) return;
    const contentBounds = browserWindow.getContentBounds();
    return {
      height: Math.round(bounds.height),
      width: Math.round(bounds.width),
      x: contentBounds.x + Math.round(bounds.x),
      y: contentBounds.y + Math.round(bounds.y),
    };
  }

  function thumbnailCropBounds({ width, height }) {
    const croppedWidth = Math.max(
      1,
      Math.min(width, Math.round((height * thumbnailWidth) / thumbnailHeight)),
    );
    const croppedHeight = Math.max(
      1,
      Math.min(height, Math.round((width * thumbnailHeight) / thumbnailWidth)),
    );
    return {
      x: Math.floor((width - croppedWidth) / 2),
      y: 0,
      width: croppedWidth,
      height: croppedHeight,
    };
  }

  function serializeThumbnail(image) {
    const scaleFactors = image
      .getScaleFactors()
      .filter((value) => Number.isFinite(value) && value > 0);
    const scaleFactor = scaleFactors.length === 0 ? 1 : Math.min(2, Math.max(...scaleFactors));
    const cropped = image.crop(thumbnailCropBounds(image.getSize()));
    const { width, height } = cropped.getSize();
    const resizeFactor = Math.min(
      1,
      thumbnailWidth / (width * scaleFactor),
      thumbnailHeight / (height * scaleFactor),
    );
    return cropped
      .resize({
        width: Math.max(1, Math.round(width * resizeFactor)),
        height: Math.max(1, Math.round(height * resizeFactor)),
        quality: `good`,
      })
      .toDataURL({ scaleFactor });
  }

  async function captureThumbnail(threadState, isCurrent) {
    const page = threadState.page;
    if (page == null) return null;
    const webContents = page.view.webContents;
    if (page.isSuspended || webContents == null || webContents.isDestroyed()) return null;
    const hostGeneration = threadState.hostGeneration;
    const navigationVersion = page.navigationVersion;
    const url = webContents.getURL();
    const remainsCurrent = () =>
      isCurrent() &&
      threadState.page === page &&
      threadState.hostGeneration === hostGeneration &&
      threadState.pendingTeardown == null &&
      threadState.pendingWindowTransfer !== true &&
      !page.isSuspended &&
      page.navigationVersion === navigationVersion &&
      page.view.webContents === webContents &&
      !webContents.isDestroyed() &&
      webContents.getURL() === url;
    if (!remainsCurrent()) return null;
    const cached = thumbnailCaptures.get(page);
    if (
      cached?.navigationVersion === navigationVersion &&
      cached.webContents === webContents &&
      cached.url === url &&
      (cached.completedAt == null ||
        (threadState.presented
          ? Date.now() - cached.completedAt < thumbnailCacheLifetimeMs
          : !cached.presented &&
            cached.lastPresentedSequence === threadState.lastPresentedSequence))
    ) {
      const result = await cached.result;
      return remainsCurrent() ? result : null;
    }
    const result = (async () => {
      try {
        const image = await webContents.capturePage(undefined, { stayHidden: true });
        return !remainsCurrent() || image.isEmpty() ? null : serializeThumbnail(image);
      } catch {
        return null;
      }
    })();
    const capture = {
      navigationVersion,
      webContents,
      url,
      completedAt: null,
      lastPresentedSequence: threadState.lastPresentedSequence,
      presented: threadState.presented,
      result,
    };
    thumbnailCaptures.set(page, capture);
    result.then((value) => {
      capture.completedAt = Date.now();
      if (value == null && thumbnailCaptures.get(page) === capture) thumbnailCaptures.delete(page);
    });
    return result;
  }
  return class BrowserPageCommandController {
    constructor(host: any) { this.host = host; }
    host: any;
    goBack(e, t, n) {
      this.host.navigateCurrentPageHistory(e, t, `back`, n);
    }
    cloneTab(
      e,
      {
        active: t,
        browserHostDisplayName: n,
        browserTabId: r,
        conversationId: i,
        cwd: o,
        navigation: s,
      },
    ) {
      let c = this.host.getCurrentPageCommandContext(e, i, r);
      if (c == null) return;
      let { page: l, windowState: u } = c;
      if (u.owner !== e) return;
      let d = l.view.webContents;
      if (
        d?.isDestroyed() ||
        (d == null && s !== `reload`) ||
        (s === `back` && !d?.canGoBack()) ||
        (s === `forward` && !d?.canGoForward()) ||
        !this.host.admitBrowserTab(`history-clone`)
      )
        return;
      let f = u.tabSourceWindow ?? u,
        p = a.bn(crypto.randomUUID()),
        m,
        h;
      if (d == null) {
        let e = this.host.ensureThreadStateForCommand(f.owner, i, p);
        if (e == null) return;
        let t = rW(l.serializedPageState),
          n = this.host.materializeThreadPageState(
            f,
            e,
            t == null
              ? { kind: `fresh`, page: { title: l.title, url: l.pendingUrl || l.url } }
              : { kind: `cold-restore`, snapshot: structuredClone(t) },
          );
        n.errorPagesByUrl = new Map(l.errorPagesByUrl);
      } else {
        if (((h = d.clone()), h.isDestroyed())) return;
        if (!WX(h)) throw (h.close(), Error(`Owl history clone cannot be adopted by a webview`));
        m = GX(
          f,
          h,
          { browserTabId: p, conversationId: i },
          { navigation: s, errorPagesByUrl: new Map(l.errorPagesByUrl) },
        );
      }
      this.host.windowManager.sendMessageToWebContents(f.owner, {
        type: `open-browser-tab`,
        active: t,
        browserHostDisplayName: n,
        browserTabId: p,
        conversationId: i,
        cwd: o,
        initialUrl: h == null ? void 0 : l.url,
        adoptionLease: m,
        adoptedWebContentsId: h?.id,
        insertToRightOfTabId: r,
        source: `manual`,
      });
    }
    goForward(e, t, n) {
      this.host.navigateCurrentPageHistory(e, t, `forward`, n);
    }
    getActiveVisiblePageForWindow(e) {
      if (e.isDestroyed()) return null;
      let t = this.host.windows.get(e.id) ?? null,
        n = t?.activeConversationId ?? null,
        r = t?.activeBrowserTabId ?? null;
      if (t == null || n == null || r == null) return null;
      let i = hX(t, n, r),
        a = i?.page ?? null;
      return i == null || !i.visible || i.bounds == null || a?.view.webContents == null
        ? null
        : { conversationId: n, page: a, threadState: i, windowState: t };
    }
    getVisiblePageForWebContents(e, t) {
      let n = this.host.browserPageHostLifecycle.findPageStateForWebContentsId(t.id);
      return n == null ||
        n.windowState.window !== e ||
        !n.threadState.presented ||
        !n.threadState.visible ||
        n.threadState.bounds == null
        ? null
        : n;
    }
    getReloadTargetForWindow(e, t) {
      return (
        (t == null ? null : this.host.getVisiblePageForWebContents(e, t)) ??
        this.host.getActiveVisiblePageForWindow(e)
      );
    }
    canReloadActiveVisiblePage(e, t = null) {
      return this.host.getReloadTargetForWindow(e, t) != null;
    }
    getFocusedVisibleBrowserTabPanel(e, t) {
      if (t == null) return null;
      let n = this.host.getVisiblePageForWebContents(e, t);
      return n == null
        ? null
        : mU(
            this.host.windowManager.getAppShellShortcutState(n.windowState.owner.id),
            n.conversationId,
            n.threadState.browserTabId,
            hU(n.threadState.hostKind),
          );
    }
    runFocusedVisiblePageCommand(e, t, n) {
      let r = t == null ? null : this.host.getVisiblePageForWebContents(e, t),
        i = r == null ? null : hU(r.threadState.hostKind),
        a =
          r == null
            ? null
            : this.host.windowManager.getAppShellShortcutState(r.windowState.owner.id)?.focusArea,
        o = r;
      if (
        (a != null &&
          !((i === `bottom` && a === `bottom-panel`) || (i === `right` && a === `right-panel`)) &&
          (o = null),
        o == null)
      )
        return !1;
      let {
        conversationId: s,
        page: c,
        threadState: { browserTabId: u },
        windowState: { owner: d },
      } = o;
      switch (n.type) {
        case `copy-url`:
          (l.clipboard.writeText(QU(c)),
            this.host.windowManager.sendMessageToWebContents(d, {
              type: `browser-sidebar-url-copied`,
              conversationId: s,
              browserTabId: u,
            }));
          break;
        case `find-next`:
          this.host.findNext(d, s, u);
          break;
        case `find-previous`:
          this.host.findPrevious(d, s, u);
          break;
        case `go-back`:
          this.host.goBack(d, s, u);
          break;
        case `go-forward`:
          this.host.goForward(d, s, u);
          break;
        case `open-find`:
          (d.focus(), this.host.openFind(d, s, u));
          break;
        case `reset-zoom`:
          this.host.resetZoom(d, s, u);
          break;
        case `step-zoom`:
          this.host.stepZoom(d, s, n.delta, u);
      }
      return !0;
    }
    closeFocusedVisibleBrowserTab(e, t) {
      if (t == null) return !1;
      let n = this.host.getVisiblePageForWebContents(e, t);
      if (n == null) return !1;
      let r = pU(
        this.host.windowManager.getAppShellShortcutState(n.windowState.owner.id),
        n.conversationId,
        n.threadState.browserTabId,
        hU(n.threadState.hostKind),
      );
      return r != null && (this.host.windowManager.sendMessageToWebContents(n.windowState.owner, r), !0);
    }
    reloadActiveVisiblePage(e, t = null) {
      this.host.reloadActiveVisiblePageWithOptions(e, {}, t);
    }
    reloadActiveVisiblePageWithOptions(e, t = {}, n = null) {
      let r = this.host.getReloadTargetForWindow(e, n);
      r != null &&
        this.host.reload(r.windowState.owner, r.conversationId, t, r.threadState.browserTabId);
    }
    reloadOpenPages() {
      for (let { owner: e, threads: t } of this.host.windows.values())
        for (let { browserTabId: n, conversationId: r, page: i } of t.values())
          i?.view.webContents != null && this.host.reload(e, r, void 0, n);
    }
    async clearBrowsingData(e) {
      let t = this.host.getBrowserSession();
      if (t == null) throw Error(DZ);
      await Zc(t, e);
    }
    scroll(e, t, r, i) {
      let a = this.host.getPageState(e, t, i)?.view.webContents ?? null;
      a != null &&
        ZZe(a, r).catch((e) => {
          (this.host.logger().warning(`failed to scroll browser sidebar page`, {
            safe: { conversationId: t },
            sensitive: { error: e },
          }),
            this.host.errorReporter.reportNonFatal(e instanceof Error ? e : n.Zo(e), {
              kind: `browser-sidebar-scroll`,
            }));
        });
    }
    runPageCommand(e, t, n) {
      const resolveContext = () =>
        this.host.getCurrentPageCommandContext(e, t.conversationId, t.browserTabId);
      const context = resolveContext();
      if (context == null) return `page-unavailable`;
      if (context.windowState.owner !== e) return `wrong-window`;
      if (
        context.threadState.pendingTeardown != null ||
        context.page.view.webContents?.isDestroyed() !== false
      )
        return `page-unavailable`;
      const { threadState } = context;
      const command = t.command;
      switch (command.type) {
        case `navigate`: {
          if (n == null) return `navigation-unavailable`;
          const mountGeneration = threadState.mountGeneration;
          return (async () => {
            const url = await n(command.url, command.hostId);
            const current = resolveContext();
            if (current == null) return `page-unavailable`;
            if (current.windowState.owner !== e) return `wrong-window`;
            if (
              current.page !== context.page ||
              current.threadState !== context.threadState ||
              current.windowState !== context.windowState ||
              current.threadState.mountGeneration !== mountGeneration ||
              current.threadState.pendingTeardown != null ||
              current.page.view.webContents?.isDestroyed() !== false
            )
              return `page-unavailable`;
            if (url == null) return `navigation-unavailable`;
            this.navigate(
              e,
              t.conversationId,
              url,
              command.source,
              command.initiator,
              threadState.browserTabId,
            );
            return `accepted`;
          })();
        }
        case `go-back`:
          this.goBack(e, t.conversationId, threadState.browserTabId);
          break;
        case `go-forward`:
          this.goForward(e, t.conversationId, threadState.browserTabId);
          break;
        case `reload`:
          this.reload(e, t.conversationId, { ignoreCache: command.ignoreCache }, threadState.browserTabId);
          break;
        case `stop`:
          this.stop(e, t.conversationId, threadState.browserTabId);
          break;
        case `print`:
          this.print(e, t.conversationId, threadState.browserTabId);
          break;
        case `capture-screenshot`:
          return this.captureScreenshotToClipboard(e, t.conversationId, threadState.browserTabId).then(
            () => `accepted`,
          );
        case `step-zoom`:
          this.stepZoom(e, t.conversationId, command.delta, threadState.browserTabId);
          break;
        case `reset-zoom`:
          this.resetZoom(e, t.conversationId, threadState.browserTabId);
          break;
        case `set-zoom-percent`:
          this.setZoomPercent(e, t.conversationId, command.zoomPercent, threadState.browserTabId);
          break;
        case `open-find`:
          sq(this.host.windowManager, e, t.conversationId, threadState);
          break;
        case `set-find-query`:
          cq(this.host.windowManager, e, t.conversationId, threadState, command.query);
          break;
        case `find-next`:
          lq(threadState);
          break;
        case `find-previous`:
          uq(threadState);
          break;
        case `close-find`:
          fq(this.host.windowManager, e, t.conversationId, threadState);
          break;
        case `set-interaction-mode`:
          this.host.setInteractionMode(
            e,
            t.conversationId,
            command.interactionMode,
            threadState.browserTabId,
            command.annotationModeEntrySource,
          );
          break;
        case `set-design-modifier-pressed`:
          this.host.setDesignModifierPressed(
            e,
            t.conversationId,
            command.pressed,
            threadState.browserTabId,
          );
          break;
        case `set-original-view-enabled`:
          this.host.setOriginalViewEnabled(
            e,
            t.conversationId,
            command.enabled,
            threadState.browserTabId,
          );
          break;
        case `discard-pending-annotations`:
          this.host.discardPendingAnnotations(e, t.conversationId, threadState.browserTabId);
          break;
        case `add-annotations-to-composer`:
          this.host.addAnnotationsToComposer(e, t.conversationId, threadState.browserTabId);
          break;
        case `select-comment`:
          this.host.selectComment(
            e,
            t.conversationId,
            command.commentId,
            threadState.browserTabId,
          );
      }
      return `accepted`;
    }
    openFind(e, t, n) {
      let r = this.host.ensureThreadCommandContext(e, t, n);
      r != null && sq(this.host.windowManager, r.windowState.owner, t, r.threadState);
    }
    openSiteInfo(e, t, n, r, i) {
      let a = this.host.getPageState(e, t, n)?.view.webContents;
      return a == null || a.isDestroyed()
        ? false
        : a.showPageInfoDialog({ anchorBounds: pageInfoAnchorBounds(e, r), siteUrl: i });
    }
    setFindQuery(e, t, n, r) {
      let i = this.host.ensureThreadCommandContext(e, t, r);
      i != null && cq(this.host.windowManager, i.windowState.owner, t, i.threadState, n);
    }
    findNext(e, t, n) {
      let r = this.host.ensureThreadStateForCommand(e, t, n);
      r != null && lq(r);
    }
    findPrevious(e, t, n) {
      let r = this.host.ensureThreadStateForCommand(e, t, n);
      r != null && uq(r);
    }
    closeFind(e, t, n) {
      let r = this.host.getCurrentWindowState(e);
      if (r == null) return;
      let i = hX(r, t, n);
      i != null && fq(this.host.windowManager, r.owner, t, i);
    }
    reload(e, t, { ignoreCache: n = !1 } = {}, r) {
      let i = this.host.getCurrentPageCommandContext(e, t, r);
      if (i == null) return;
      let { page: a, threadState: o, windowState: s } = i;
      if ((fq(this.host.windowManager, s.owner, t, o), a.loadError != null)) {
        this.host.navigatePageToUrl(a, a.loadError.failedUrl);
        return;
      }
      if (a.url.length === 0 && a.pendingUrl.length > 0) {
        if ((this.host.navigatePageToUrl(a, a.pendingUrl), a.view.webContents == null)) {
          let n = this.host.getThreadState(e, t, r);
          n != null && this.host.syncThreadStateFromOrigin(e, t, n);
        }
        return;
      }
      if ((sW(a), n)) {
        a.view.webContents?.reloadIgnoringCache();
        return;
      }
      a.view.webContents?.reload();
    }
    reset(e, t, n) {
      let r = this.host.ensureThreadStateForCommand(e, t, n);
      if (r == null) return;
      let i = this.host.ensureCurrentWindowState(e);
      if (i == null) return;
      (this.host.comments.close(e, t, r.browserTabId),
        (r.pendingBrowserUsePanelOpen = !1),
        (r.pendingCommentModeActivation = null),
        (r.commentModeBlockCheckUrl = null),
        (r.commentModeBlockCheckRequestId += 1),
        this.host.browserPageSnapshots.deleteAndFlush(r),
        fq(this.host.windowManager, i.owner, t, r));
      let a = this.host.browserPageHostLifecycle.isBrowserUseManagedBrowserTab(t, r.browserTabId);
      (r.page != null && this.host.browserPageHostLifecycle.disposePage(r.page),
        this.host.browserPageHostLifecycle.cancelPendingWebviewAttaches(i, r),
        (r.page = null),
        (r.isBrowserUsePage = !1),
        (r.browserUseTabLifetime = `persistent`),
        (r.isBrowserUseNavigationRestrictionActive = !1),
        (r.snapshot = {
          ...pX(),
          areAnnotationMarkersVisible: r.snapshot.areAnnotationMarkersVisible,
        }),
        a &&
          this.host.setBrowserUseActiveForRoute(
            { conversationId: t, windowId: oX(i.window.id) },
            !1,
            r.browserTabId,
          ),
        this.host.syncThreadState(i, t, r));
    }
    stop(e, t, n) {
      let r = this.host.getPageState(e, t, n);
      r && (sW(r), (r.pendingNavigationUsage = null), r.view.webContents?.stop());
    }
    getCurrentPageWebContents(e, t, n) {
      return this.host.getCurrentPageCommandContext(e, t, n)?.page.view.webContents;
    }
    getExtensionActionMenuTarget(e, t, n) {
      let r = this.host.getCurrentPageCommandContext(e, t, n),
        i = r?.page.view.webContents;
      return {
        webContents: i,
        allowHiddenBlankTab: (() => {
          if (r == null || i == null || i.isDestroyed()) return false;
          const activeWindow = this.host.getCurrentWindowState(e);
          const attachedHost = this.host.browserPageHostLifecycle.attachedWebviewHosts.get(i);
          return attachedHost?.route.conversationId === r.threadState.conversationId &&
            attachedHost.route.browserTabId === r.threadState.browserTabId &&
            attachedHost.hostGeneration === r.threadState.hostGeneration &&
            attachedHost.rendererInstanceId === r.windowState.rendererInstanceId &&
            activeWindow?.activeConversationId === r.threadState.conversationId &&
            activeWindow.activeBrowserTabId === r.threadState.browserTabId &&
            r.threadState.presented && r.threadState.visible &&
            r.threadState.snapshot.tabType === dependencies.n.lu.NEW_TAB_PAGE && r.threadState.snapshot.url === ``;
        })(),
      };
    }
    async captureTabThumbnail(e, t, n) {
      let r = () => this.host.getCurrentPageCommandContext(e, t, n),
        i = r();
      if (i == null) return null;
      let { threadState: a, windowState: o } = i,
        s = o.rendererInstanceId;
      return captureThumbnail(a, () => {
        let e = r();
        return e?.threadState === a && e.windowState === o && o.rendererInstanceId === s;
      });
    }
    getWebMcpInspectorData(e, t, n) {
      let r = this.host.getPageState(e, t, n);
      return r == null ? null : { tools: r.webMcpTools };
    }
    setAudioMuted(e, t, n, r) {
      let i = this.host.getCurrentPageCommandContext(e, t, n),
        a = i?.page.view.webContents;
      i == null ||
        a == null ||
        a.isDestroyed() ||
        (a.setAudioMuted(r), this.host.syncThreadState(i.windowState, t, i.threadState));
    }
    print(e, t, n) {
      let r = this.host.getCurrentPageCommandContext(e, t, n);
      if (r == null) return;
      let i = r.page.view.webContents;
      i == null || i.isDestroyed() || i.print();
    }
    suspend(e, t, n, r) {
      let i = this.host.getCurrentPageCommandContext(e, t, r);
      return i != null && this.host.browserPageHostLifecycle.suspendPage(i.threadState, n);
    }
    browserWebviewDestroyed(e, t, n, r) {
      let i = this.host.getCurrentWindowState(e);
      if (i == null) return;
      let a = hX(i, t, n) ?? this.host.browserPageHostLifecycle.findThreadStateForPendingTeardown(i, r);
      a != null && this.host.browserPageHostLifecycle.finalizeThreadTeardown(i, a.conversationId, a, r);
    }
    registerWebviewHostSession(e, t) {
      let n = this.host.ensureCurrentWindowState(e);
      return n != null && this.host.browserPageHostLifecycle.registerRendererSession(n, t);
    }
    registerWebviewHost(e, t, n, r, i, a) {
      let o = this.host.ensureCurrentWindowState(e);
      return o != null && this.host.browserPageHostLifecycle.registerHost(o, t, n, r, i, a);
    }
    async moveTabToWindow(e) {
      let t = this.host.ensureCurrentWindowState(e.sourceWindow.webContents),
        n = this.host.ensureCurrentWindowState(e.destinationWindow.webContents);
      if (
        (t != null &&
          n != null &&
          this.host.siteAnnotationPermissions.cancel(
            hX(t, e.content.conversationId, e.content.browserTabId)?.page?.view.webContents,
          ),
        t == null || n == null)
      )
        return `not-moved`;
      let r = await this.host.browserPageHostLifecycle.transferToWindow(t, n, e);
      return (r === `moved` && this.host.permissionPrompts.transferPresentation(t, n, e.content), r);
    }
    setZoomPercent(e, t, r, i) {
      let a = this.host.ensureThreadStateForCommand(e, t, i);
      a != null && this.host.setThreadZoomPercent(e, t, a, n.Yc(r));
    }
    stepZoom(e, t, r, i) {
      let a = this.host.ensureThreadStateForCommand(e, t, i);
      a != null && this.host.setThreadZoomPercent(e, t, a, n.Zc(a.snapshot.zoomPercent, r));
    }
    resetZoom(e, t, n) {
      let r = this.host.ensureThreadStateForCommand(e, t, n);
      r != null && this.host.setThreadZoomPercent(e, t, r, 100);
    }
    navigate(e, t, n, r, i, a, o) {
      let s = this.host.ensureThreadCommandContext(e, t, a);
      if (s == null) return;
      let { threadState: c, windowState: l } = s,
        u = this.host.browserPersistence.getPagePersistence(l.window, o);
      if (
        GXe(this.host.windowManager, l, c, n, this.host.isRestrictedBrowserNavigation.bind(this)) ||
        !this.host.browserPersistence.reconcileBrowserStorageId(l, c, u)
      )
        return;
      r === `browser_use` && (c.isBrowserUsePage = !0);
      let d =
        c.page ??
        this.host.ensureThreadPageForCommand(
          l.owner,
          t,
          a,
          { title: c.snapshot.title, url: c.snapshot.url },
          u,
        );
      d &&
        (fq(this.host.windowManager, l.owner, t, c),
        iK(QU(d), n) || this.host.comments.dismiss(l.owner, t, c.browserTabId, c),
        this.host.navigatePageToUrl(d, n, r, i),
        d.view.webContents ?? this.host.syncThreadStateFromOrigin(l.owner, t, c));
    }
    async captureScreenshotToClipboard(e, t, n) {
      this.host.getThreadState(e, t, n)?.isAnnotationModeEnabled !== !1 &&
        (await XZe({
          browserTabId: n,
          conversationId: t,
          errorReporter: this.host.errorReporter,
          origin: e,
          pageState: this.host.getPageState(e, t, n),
          windowManager: this.host.windowManager,
        }));
    }
    refreshCursor(e, t, n) {
      let r = this.host.getCurrentPageCommandContext(e, t, n);
      r != null && LHe(r.windowState.window, r.threadState.bounds, r.page.view.webContents);
    }
    setThreadZoomPercent(e, t, n, r) {
      let i = n.snapshot.zoomPercent !== r;
      if (
        (i && (n.snapshot = { ...n.snapshot, zoomPercent: r }),
        n.page != null &&
          (this.host.syncPageZoomPercent(n.page, r), this.host.syncRuntimeStateToPage(n.page, n)),
        !i)
      )
        return;
      let a = l.BrowserWindow.fromWebContents(e);
      if (a == null || a.isDestroyed()) return;
      let o = this.host.ensureWindowState(a, e);
      this.host.syncThreadState(o, t, n);
    }
    syncPageZoomPercent(e, t) {
      let r = e.view.webContents;
      r == null || r.isDestroyed() || r.setZoomFactor(n.Xc(t));
    }
    queuePageDeviceMetricsSync(e, t) {
      e.deviceMetricsSyncVersion += 1;
      let n = e.deviceMetricsSyncVersion;
      this.host.queuePageDebuggerSync(e, async () => {
        n === e.deviceMetricsSyncVersion && (await PHe(e, t));
      });
    }
    queuePageDebuggerSync(e, t) {
      return ((e.debuggerSync = e.debuggerSync.catch(() => void 0).then(t)), e.debuggerSync);
    }
    queuePageColorSchemeSync(e, t, n) {
      return this.host.queuePageDebuggerSync(e, async () => {
        await GU(t, n);
      });
    }

  };
}
if (typeof module !== "undefined") module.exports = { createBrowserPageCommandControllerClass };
