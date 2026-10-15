// @ts-nocheck

/** Owns the complete page-to-WebContents binding lifecycle for Browser sidebar pages. */
export function createBrowserPageWebviewBindingControllerClass(dependencies: Record<string, any>) {
  const { e, id, c, d, p, mZe, mZ, h, _, dZ, WU, v, b, KX, KU, oX, S, w, TU, XU, Ze, eW, QU, D, k, j, M, N, YX, Xe, L, fq, XX, EHe, wHe, JU, xu, MU, sW, re, ie, fZ, ae, oe, se, ce, THe, le, X, ue, de, fe, W, zGe, G, me, pU, hU, he, At, ge, HGe, zX, mU, run, _e, on, Xc, LXe, xU, be, to, al, xe, ul, audio, WX, bn, GX, pZe, pZ, Se, JXe, YXe, Te, EXe, n, a, iZ, tZ, eZ, nZ, rZ } = dependencies;

  function bindPageToWebview(helpers: any, windowState: any, page: any, webContents: any, themeVariant: unknown, initialNavigationOwner: unknown): void {
    const e = helpers;
    const t = windowState;
    const r = page;
    const i = webContents;
    const o = themeVariant;
    const s = initialNavigationOwner;
      if (r.view.webContents?.id === i.id && s !== `transfer`) return;
      let c = t.tabSourceWindow ?? t,
        u = i,
        d = i,
        f = r.isSuspended,
        p = r.isColdRestore;
      (r.dispose(),
        (r.isRestoring = f),
        (r.isSuspended = !1),
        (r.pendingSuspensionId = null),
        (r.view.webContents = i),
        (r.isMainFrameLoading = i.isLoadingMainFrame()),
        (r.isWaitingForResponse = !1));
      let m = mZe(i) ?? mZ(i);
      r.takeIncompleteNavigationObservation = m.takeObservation;
      let h = () => void 0;
      r.initialNavigationSync = new Promise((e) => {
        h = e;
      });
      let g = () => {
          (h(), (h = () => void 0));
        },
        _ = (n, i = {}) => {
          let a = e.getThreadStateForWindow(t, r.conversationId, r.browserTabId);
          (a != null &&
            (a.isTabCaptureActive !== n &&
              ((a.isTabCaptureActive = n), i.enforceBudget !== !1 && e.enforceDetachedPageBudget(t)),
            dZ(t, a)),
            WU(e.windowManager, t, {
              type: `browser-sidebar-tab-capture-state`,
              conversationId: r.conversationId,
              browserTabId: r.browserTabId,
              isActive: n,
            }));
        },
        v = () => {
          let n = e.getThreadStateForWindow(t, r.conversationId, r.browserTabId);
          n != null && e.syncThreadState(t, r.conversationId, n);
        },
        y = () => {
          e.getThreadStateForWindow(t, r.conversationId, r.browserTabId) != null &&
            e.enforceDetachedPageBudget(t);
        };
      ((r.isAudible = i.isCurrentlyAudible()),
        (r.isCapturingUserMedia = i.isCapturingUserMedia()),
        (r.isCapturingCamera = i.isCapturingCamera()),
        (r.isCapturingMicrophone = i.isCapturingMicrophone()));
      let b = KX({
        initialState: {
          isAudible: r.isAudible,
          isCapturingUserMedia: r.isCapturingUserMedia,
          isCapturingCamera: r.isCapturingCamera,
          isCapturingMicrophone: r.isCapturingMicrophone,
        },
        onStateChanged: () => {
          r.mediaIndicator === b && r.view.webContents?.id === i.id && v();
        },
      });
      ((r.mediaIndicator = b),
        _(i.isBeingCaptured()),
        e.onBrowserStateChanged(),
        e.isBrowserUseManagedBrowserTab(r.conversationId, r.browserTabId) &&
          e.browserSessionRegistry.recordGuestAttached({
            browserTabId: r.browserTabId,
            conversationId: r.conversationId,
            guestWebContentsId: i.id,
            pageKey: KU(c.owner.id, r.conversationId, r.browserTabId),
            windowId: oX(c.window.id),
          }));
      let x = e.getThreadStateForWindow(t, r.conversationId, r.browserTabId);
      x != null &&
        (e.updateThreadSessionState(x),
        e.syncPageZoomPercent(r, x.snapshot.zoomPercent),
        e.queuePageDeviceMetricsSync(r, x.emulatedViewportSize),
        e.windowManager.sendMessageToWebContents(t.owner, {
          type: `browser-sidebar-webview-attached`,
          browserTabId: r.browserTabId,
          conversationId: r.conversationId,
          mountGeneration: x.mountGeneration,
        }));
      let S = !1,
        C = r.navigationVersion,
        w = ({ enforceBudget: n = !0 } = {}) => {
          if (!r.isRestoring || S) return;
          r.isRestoring = !1;
          let i = e.getThreadStateForWindow(t, r.conversationId, r.browserTabId);
          i != null && (e.updateThreadSessionState(i), n && e.enforceDetachedPageBudget(t));
        },
        T = (n, a = !1) => {
          let o = TU(n ?? i.getURL()),
            s = $U(r, o);
          s == null
            ? (n != null || o.length > 0 || r.url.length === 0) &&
              (n != null || o !== r.url) &&
              (XU(r.url, o) && (r.faviconUrl = null),
              (r.url = o),
              (r.pendingUrl = o),
              n != null && (r.loadError = null))
            : a &&
              ((r.loadError = s),
              (r.url = s.failedUrl),
              (r.pendingUrl = s.failedUrl),
              (r.faviconUrl = null));
          let c = i.getTitle(),
            l = i.isLoading();
          ((r.title = c || r.loadError?.title || (l && Ze(o).length > 0 ? r.title : r.fallbackTitle)),
            (r.isLoading = l),
            (r.canGoBack = i.canGoBack()),
            (r.canGoForward = i.canGoForward()),
            !r.isRestoring &&
              !r.isColdRestore &&
              (r.serializedPageState = eW({ faviconUrl: r.faviconUrl, title: r.title, url: QU(r) })));
          let u = e.getThreadStateForWindow(t, r.conversationId, r.browserTabId);
          if (u != null) {
            let n = u.snapshot.interactionMode;
            (e.syncThreadState(t, r.conversationId, u),
              u.page != null && u.snapshot.interactionMode !== n && e.syncRuntimeStateToPage(r, u));
          }
        },
        E = (n) => {
          let i = e.getThreadStateForWindow(t, r.conversationId, r.browserTabId);
          i != null && dZ(t, i, n);
        },
        D = () => {
          T();
        },
        O = (n) => {
          ((r.faviconUrl = n),
            !r.isRestoring &&
              !r.isColdRestore &&
              (r.serializedPageState = eW({ faviconUrl: n, title: r.title, url: QU(r) })));
          let i = e.getThreadStateForWindow(t, r.conversationId, r.browserTabId);
          i != null && e.syncThreadState(t, r.conversationId, i);
        },
        k = (e) => {
          O(e.isEmpty() ? null : e.toDataURL({ scaleFactor: 2 }));
        },
        A = () => {
          let e = d.getFaviconImage?.();
          e != null && k(e);
        },
        j = (e, t) => {
          d.getFaviconImage ?? O(t.find((e) => e.length > 0) ?? null);
        },
        M = (e, t) => {
          k(t);
        },
        N = (n, i, a, o) => {
          o &&
            !a &&
            ((r.isAgentInitiatedLoad =
              e.getThreadStateForWindow(t, r.conversationId, r.browserTabId)?.isBrowserUseActive ?? !1),
            YX(r),
            (r.isMainFrameLoading = !0),
            (r.isWaitingForResponse = !0),
            T());
        },
        P = () => {
          (w({ enforceBudget: !1 }),
            (r.isMainFrameLoading = !1),
            (r.isWaitingForResponse = !1),
            $Xe(r),
            T(),
            e.enforceDetachedPageBudget(t),
            i.getURL().length > 0 && i.navigationHistory.getActiveIndex() >= 0 && g());
          let n = r.pendingNavigationUsage;
          n?.source === `browser_use` &&
            Ze(i.getURL()) === n.expectedUrl &&
            (e.notifyBrowserNavigationUsage(
              r.conversationId,
              r.browserTabId,
              `browser_use`,
              n.initiator,
              n.urlKind,
            ),
            (r.pendingNavigationUsage = null));
        },
        F = () => {
          ((r.isMainFrameLoading = !1), (r.isWaitingForResponse = !1), T());
          let t = TU(i.mainFrame.url);
          t.length !== 0 &&
            $U(r, t) == null &&
            e.windowManager.sendMessageToWebContents(c.owner, {
              type: `browser-sidebar-page-loaded`,
              agentInitiated: r.isAgentInitiatedLoad,
              url: t,
            });
        },
        I = (e) => {
          r.isAudible !== e.audible &&
            ((r.isAudible = e.audible), y(), r.mediaIndicator.updateAudible(e.audible));
        },
        L = (e) => {
          (r.isCapturingUserMedia !== e.capturing ||
            r.isCapturingCamera !== e.camera ||
            r.isCapturingMicrophone !== e.microphone) &&
            ((r.isCapturingUserMedia = e.capturing),
            (r.isCapturingCamera = e.camera),
            (r.isCapturingMicrophone = e.microphone),
            y(),
            r.mediaIndicator.updateUserMediaCapture({
              isCapturingUserMedia: e.capturing,
              isCapturingCamera: e.camera,
              isCapturingMicrophone: e.microphone,
            }));
        },
        R = (e) => {
          _(e.captured);
        },
        z = (n, i) => {
          let a = e.getThreadStateForWindow(t, r.conversationId, r.browserTabId);
          if (a != null) {
            if (a.pendingTeardown != null) {
              e.finalizeThreadTeardown(t, a.conversationId, a, a.pendingTeardown.teardownId);
              return;
            }
            fq(e.windowManager, t.owner, r.conversationId, a);
          }
          (e.dismissCommentEditorForCommittedNavigation(t, r, n), T(n, i === `commit`));
        },
        B = (e, t) => {
          (m.finishCurrentNavigation(),
            g(),
            (r.isWaitingForResponse = !1),
            YX(r),
            XX(r),
            z(t, `commit`));
        },
        V = (e, t, n) => {
          n && (g(), (r.isWaitingForResponse = !1), z(t, `commit`));
        },
        ee = (e) => {
          e.isMainFrame &&
            (r.pendingNavigationUsage?.source === `browser_use` && (r.pendingNavigationUsage = null),
            z(e.url, `redirect`));
        },
        te = (a, o, s, c, l) => {
          let u = TU(c);
          if (
            (l && c === `about:blank`) ||
            $U(r, u) != null ||
            EHe({ errorCode: o, errorDescription: s, isMainFrame: l })
          )
            return;
          l && (r.isWaitingForResponse = !1);
          let d = u || r.pendingUrl || r.url || TU(i.getURL());
          if (d.length === 0) return;
          let f = wHe({
            errorDescription: s,
            failedUrl: d,
            formatMessage: JU,
            runtimeIntlConfig:
              e.getThreadStateForWindow(t, r.conversationId, r.browserTabId)?.runtimeIntlConfig ?? n.xu,
          });
          (e.loadBrowserErrorPage(t, r, i, {
            failedUrl: d,
            kind: `load-error`,
            loadError: MU({ content: f, errorCode: o, errorDescription: s, failedUrl: d }),
          }),
            w());
        },
        ne = (t) =>
          t.startsWith(`${a.g(l.app.isPackaged)}://`) &&
          a._(t)?.kind === `connectorOAuthCallback` &&
          e.windowManager.queueCodexDeepLinkUrl(t),
        H = (t) => {
          if (t.isMainFrame && ne(t.url)) {
            t.preventDefault();
            return;
          }
          if (
            (t.isMainFrame && sW(r),
            e.openBrowserExternalUrl({
              initiatorUrl: t.initiator?.url ?? null,
              pageState: r,
              url: t.url,
              webContents: i,
            }))
          ) {
            t.preventDefault();
            return;
          }
          if (e.isRestrictedBrowserNavigation(i.id, t.url, t.isMainFrame ? `mainFrame` : `subFrame`)) {
            t.preventDefault();
            return;
          }
          t.isMainFrame && E(t.url);
        },
        re = (n, a) => {
          sW(r);
          let o = n.url ?? a;
          if (
            e.openBrowserExternalUrl({
              initiatorUrl: n.initiator?.url ?? null,
              pageState: r,
              url: o,
              webContents: i,
            })
          ) {
            n.preventDefault();
            return;
          }
          if (e.isRestrictedBrowserNavigation(i.id, o)) {
            n.preventDefault();
            return;
          }
          let s = e.getThreadStateForWindow(t, r.conversationId, r.browserTabId);
          if (s != null) {
            if ((fq(e.windowManager, t.owner, r.conversationId, s), s.pendingTeardown != null)) {
              e.finalizeThreadTeardown(t, r.conversationId, s, s.pendingTeardown.teardownId);
              return;
            }
            (e.updateThreadSessionState(s), e.syncThreadState(t, r.conversationId, s, o));
          }
        },
        U = (n, a) => {
          if (n.isMainFrame && ne(n.url ?? a)) {
            n.preventDefault();
            return;
          }
          n.isMainFrame && (r.navigationVersion += 1);
          let o = n.url ?? a;
          if (e.isRestrictedBrowserNavigation(i.id, o, n.isMainFrame ? `mainFrame` : `subFrame`)) {
            n.preventDefault();
            return;
          }
          if (n.isMainFrame) {
            E(o);
            let n = e.getThreadStateForWindow(t, r.conversationId, r.browserTabId);
            n != null && fq(e.windowManager, t.owner, r.conversationId, n);
          }
        },
        ie = () => {
          (m.dispose(),
            r.view.webContents?.id === i.id &&
              ((r.managedNavigation = void 0),
              (r.pendingSuspensionId = null),
              (r.isRestoring = !1),
              (r.isAudible = !1),
              fZ(r),
              r.mediaIndicator.dispose(),
              (r.isMainFrameLoading = !1),
              (r.isWaitingForResponse = !1),
              (r.takeIncompleteNavigationObservation = () => null),
              XX(r),
              (r.lastWebMcpToolCall = null),
              r.webMcpParentCallIds?.clear(),
              _(!1, { enforceBudget: !1 }),
              (r.view.webContents = null),
              (r.dispose = () => void 0),
              e.onBrowserStateChanged(),
              e.browserSessionRegistry.recordPageTornDown({
                browserTabId: r.browserTabId,
                conversationId: r.conversationId,
                guestWebContentsId: i.id,
                windowId: oX(t.window.id),
              })));
          let n = e.getThreadStateForWindow(t, r.conversationId, r.browserTabId);
          n != null &&
            (e.syncThreadState(t, r.conversationId, n),
            fq(e.windowManager, t.owner, r.conversationId, n));
        },
        ae = () => {
          t.isClosing ||
            e.windowManager.sendMessageToWebContents(t.owner, {
              type: `close-browser-tab`,
              browserTabId: r.browserTabId,
              conversationId: r.conversationId,
            });
        },
        oe = null,
        se = () => oe === r.navigationVersion,
        ce = (a) => {
          oe = r.navigationVersion;
          let o = e.getThreadStateForWindow(t, r.conversationId, r.browserTabId);
          e.loadBrowserErrorPage(t, r, i, {
            failedUrl: a,
            kind: `crash`,
            loadError: THe({
              failedUrl: a,
              formatMessage: JU,
              isDefaultBrowser: e.isDefaultBrowser(),
              runtimeIntlConfig: o?.runtimeIntlConfig ?? n.xu,
            }),
          });
        },
        le = (n, a) => {
          if ((m.finishCurrentNavigation(), a.reason === `clean-exit` || se())) return;
          (e.windowManager.sendMessageToWebContents(t.owner, {
            type: `browser-sidebar-tab-render-process-gone`,
          }),
            $X().warning(`browser sidebar render process gone`, {
              safe: { conversationId: r.conversationId, exitCode: a.exitCode, reason: a.reason },
              sensitive: { url: i.getURL() },
            }));
          let o = r.pendingUrl || r.url || TU(i.getURL());
          o.length !== 0 && ce(o);
        },
        ue = () => {
          if (se()) return;
          $X().warning(`IAB browser page unresponsive`, {
            safe: { conversationId: r.conversationId },
            sensitive: { url: i.getURL() },
          });
          let e = r.pendingUrl || r.url || TU(i.getURL());
          e.length !== 0 && ce(e);
        },
        de = () => {
          let n = e.getThreadStateForWindow(t, r.conversationId, r.browserTabId);
          n &&
            ($X().info(`browser sidebar dom-ready`, {
              safe: { conversationId: r.conversationId, interactionMode: n.snapshot.interactionMode },
              sensitive: { url: i.getURL() },
            }),
            e.syncRuntimeStateToPage(r, n),
            e.comments.restoreRuntimeEditor(
              t.owner,
              r.conversationId,
              r.browserTabId,
              r.view.webContents,
            ));
        },
        fe = (t, n, i) => {
          ($X().error(`browser sidebar preload failed`, {
            safe: { conversationId: r.conversationId, preloadPath: n },
            sensitive: { error: i },
          }),
            e.errorReporter.reportNonFatal(i, { kind: `browser-sidebar-preload-error` }));
        },
        W = (n, i) => {
          let a = e.getThreadStateForWindow(t, r.conversationId, r.browserTabId);
          a != null && zGe(e.windowManager, t.owner, r.conversationId, a, i);
        },
        G = () => e.getThreadStateForWindow(t, r.conversationId, r.browserTabId),
        pe = t.tabSourceWindow ?? t,
        me = () => {
          let n = G();
          return pU(
            e.windowManager.getAppShellShortcutState(t.owner.id),
            r.conversationId,
            r.browserTabId,
            hU(n?.hostKind ?? null),
          );
        },
        he = () => {
          i.send(a.At, { type: `browser-sidebar-runtime-capture-text-selection` });
        },
        ge = HGe({
          captureTextSelection: he,
          closeBrowserTab: () => {
            if (t.tabSourceWindow != null) {
              t.window.close();
              return;
            }
            let n = me();
            n != null && e.windowManager.sendMessageToWebContents(t.owner, n);
          },
          getCanCloseBrowserTab: () => t.tabSourceWindow != null || me() != null,
          getInteractionMode: () => G()?.snapshot.interactionMode ?? `browse`,
          getOwnerCommandAccelerators: (t) => e.getOwnerCommandAccelerators(t),
          getThreadNavigationShortcutLocked: () =>
            e.windowManager.getAppShellShortcutState(pe.owner.id)?.threadNavigationShortcutLocked ===
            !0,
          isCommentModeAvailable: () => {
            let e = G();
            return e != null && e.isAnnotationModeEnabled && zX(e.snapshot);
          },
          owner: pe.owner,
          runCommandInOwner: (n, i, a) => {
            let o = G(),
              s = mU(
                e.windowManager.getAppShellShortcutState(pe.owner.id),
                r.conversationId,
                r.browserTabId,
                hU(o?.hostKind ?? null),
              );
            (pe !== t &&
              n !== `closeOtherTabs` &&
              e.windowManager.showWindow(pe.window, { stealFocus: !0 }),
              e.windowManager.sendMessageToWebContents(pe.owner, {
                type: `run-command`,
                id: n,
                ...(a?.allowAppShellTabShortcut === !0 ? { allowAppShellTabShortcut: !0 } : {}),
                keyboardEvent: i,
                keyboardOrigin: `browser-web-contents`,
                originBrowserTab: { conversationId: r.conversationId, browserTabId: r.browserTabId },
                originPanel: s ?? void 0,
              }));
          },
          setInteractionMode: (n, i) => {
            e.setInteractionMode(t.owner, r.conversationId, n, r.browserTabId, i);
          },
        }),
        _e = (n, a) => {
          let o = G();
          if (
            a.code === `Space` &&
            (a.type === `keyDown` || a.type === `keyUp`) &&
            o?.snapshot.interactionMode === `comment` &&
            (o.snapshot.isAnnotationSuspended === !0 ||
              (!a.isComposing && !a.alt && !a.control && !a.meta && !a.shift))
          ) {
            e.setAnnotationPresentation(t.owner, {
              browserTabId: r.browserTabId,
              conversationId: r.conversationId,
              suspended: a.type === `keyDown`,
            });
            return;
          }
          ((((a.type === `keyDown` || a.type === `keyUp`) &&
            !a.isAutoRepeat &&
            [`Alt`, `Control`, `Meta`, `Shift`].includes(a.key)) ||
            (a.type === `keyUp` &&
              (a.meta !== !0 || a.shift !== !0) &&
              e.windowManager.getAppShellShortcutState(t.owner.id)?.threadNavigationShortcutLocked ===
                !0)) &&
            e.windowManager.sendMessageToWebContents(t.owner, {
              type: `keyboard-modifier-state-changed`,
              altKey: a.alt === !0,
              ctrlKey: a.control === !0,
              metaKey: a.meta === !0,
              shiftKey: a.shift === !0,
            }),
            !e.comments.handlePageAnnotationSelectionInput(i, n, a) &&
              (e.setDesignModifierPressed(t.owner, r.conversationId, a.alt === !0, r.browserTabId),
              ge(n, a)));
        },
        ve = (n, i) => {
          let a = G();
          if (
            (i.type !== `mouseDown` &&
              ((i.type !== `mouseMove` && i.type !== `mouseLeave`) ||
                a?.floatingComposerRevealTracking == null)) ||
            t.owner.isDestroyed() ||
            t.activeConversationId !== r.conversationId ||
            t.activeBrowserTabId !== r.browserTabId ||
            a?.visible !== !0 ||
            a.presented !== !0
          )
            return;
          let o = a.floatingComposerRevealTracking;
          if ((i.type === `mouseMove` || i.type === `mouseLeave`) && o != null) {
            let n = a.bounds,
              { x: s, y: c } = i,
              l = t.contentBounds;
            n != null &&
              l != null &&
              i.globalX != null &&
              i.globalY != null &&
              ((s = i.globalX - l.x - n.x), (c = i.globalY - l.y - n.y));
            let u =
              n != null &&
              c >= 0 &&
              c <= n.height &&
              n.height - c <= o.activationHeightPx &&
              (i.type !== `mouseLeave` || (s >= 0 && s < n.width && c < n.height));
            u !== o.isPointerNearBottom &&
              ((o.isPointerNearBottom = u),
              e.windowManager.sendMessageToWebContents(t.owner, {
                type: `browser-sidebar-floating-composer-reveal`,
                browserTabId: r.browserTabId,
                conversationId: r.conversationId,
                isPointerNearBottom: u,
              }));
            return;
          }
          i.type === `mouseDown` &&
            e.windowManager.sendMessageToWebContents(t.owner, {
              type: `browser-sidebar-web-contents-pointer-down`,
              conversationId: r.conversationId,
              browserTabId: r.browserTabId,
            });
        };
      i.on(`before-mouse-event`, ve);
      let ye = (a, o) => {
          if (i.isDestroyed() || t.window.isDestroyed()) return;
          let s = r.loadError != null || r.url.length > 0 || r.pendingUrl.length > 0,
            l = G(),
            u = !c.owner.isDestroyed() && (l?.isAnnotationModeEnabled ?? t.tabSourceWindow == null),
            d = l?.snapshot ?? null,
            f = n.Xc(d?.zoomPercent ?? 100);
          (o.selectionText.trim().length > 0 && u && d != null && zX(d) && he(),
            LXe({
              canAttachImage: !c.owner.isDestroyed() && l?.page === r && r.view.webContents === i,
              canReload: s,
              isAnnotationModeEnabled: u,
              isDefaultBrowser: e.isDefaultBrowser(),
              snapshot: d,
              params: o,
              webContents: i,
              window: t.window,
              onBack: () => {
                e.goBack(t.owner, r.conversationId, r.browserTabId);
              },
              onAttachImage: (n) => {
                G()?.page !== r ||
                  r.view.webContents !== i ||
                  c.owner.isDestroyed() ||
                  xU({
                    browserTabId: r.browserTabId,
                    browserPageUrl: r.url,
                    conversationId: r.conversationId,
                    getCurrentOwner: () => {
                      let t = e.findPageForRuntimeSender(i);
                      return t?.page === r &&
                        t.threadState.page === r &&
                        (t.windowState.tabSourceWindow ?? t.windowState) === c
                        ? t.owner
                        : null;
                    },
                    owner: t.owner,
                    sourceUrl: n,
                    webContents: i,
                    windowManager: e.windowManager,
                  });
              },
              onComment: (n, a, o) => {
                if (G()?.page !== r || r.view.webContents !== i || c.owner.isDestroyed()) return;
                let { action: s, annotationModeEntrySource: l } = aZe[a];
                (e.windowManager.sendMessageToWebContents(c.owner, {
                  type: `browser-sidebar-context-menu-action`,
                  action: s,
                }),
                  e.startCommentAtPoint(t.owner, r, { x: n.x / f, y: n.y / f }, a, l, o));
              },
              onForward: () => {
                e.goForward(t.owner, r.conversationId, r.browserTabId);
              },
              onInspect: (e) => {
                i.inspectElement(e.x, e.y);
              },
              onOpenInBrowser: (t) => {
                e.windowManager.sendMessageToWebContents(c.owner, {
                  type: `open-browser-tab`,
                  conversationId: r.conversationId,
                  initialUrl: t,
                  insertToRightOfTabId: r.browserTabId,
                  source: `manual`,
                  initiator: `side_panel_menu`,
                });
              },
              onOpenExternal: (t) => {
                e.openBrowserUrlExternally(r.conversationId, t);
              },
              onReload: () => {
                e.reload(t.owner, r.conversationId, void 0, r.browserTabId);
              },
            }));
        },
        be = () => {
          t.owner.isDestroyed() ||
            e.windowManager.sendMessageToWebContents(c.owner, {
              type: `navigate-to-route`,
              path: n.al,
            });
        },
        xe = (i, a) => {
          t.owner.isDestroyed() ||
            e.windowManager.sendMessageToWebContents(c.owner, {
              type: `open-browser-tab`,
              conversationId: r.conversationId,
              initialUrl: n.ul(a ?? null) ?? `chrome://settings/content`,
              insertToRightOfTabId: r.browserTabId,
              source: `manual`,
              initiator: `app_menu`,
            });
        };
      if (
        (i.on(`page-title-updated`, D),
        i.on(`page-favicon-updated`, j),
        u.on(iZ, M),
        i.on(`audio-state-changed`, I),
        i.on(`user-media-capture-state-changed`, L),
        u.on(tZ, R),
        i.on(`did-start-loading`, D),
        i.on(`did-start-navigation`, N),
        i.on(`did-stop-loading`, P),
        i.on(`did-finish-load`, F),
        i.on(`did-navigate`, B),
        i.on(`did-navigate-in-page`, V),
        i.on(`did-redirect-navigation`, ee),
        i.on(`did-fail-load`, te),
        i.on(`will-frame-navigate`, H),
        i.on(`will-navigate`, re),
        i.on(`will-redirect`, U),
        i.on(`destroyed`, ie),
        u.on(eZ, ae),
        i.on(`render-process-gone`, le),
        i.on(`unresponsive`, ue),
        i.on(`dom-ready`, de),
        i.on(`preload-error`, fe),
        i.on(`found-in-page`, W),
        i.on(`before-input-event`, _e),
        i.on(`context-menu`, ye),
        u.on(nZ, be),
        u.on(rZ, xe),
        i.setWindowOpenHandler(({ disposition: t, referrer: n, url: o }) => {
          if (ne(o)) return { action: `deny` };
          let s = a.h(o);
          return (s != null && e.windowManager.queueCodexDeepLinkUrl(s)) ||
            e.openBrowserExternalUrl({
              initiatorUrl: n?.url ?? null,
              pageState: r,
              url: o,
              webContents: i,
            }) ||
            e.isRestrictedBrowserNavigation(i.id, o) ||
            t === `other`
            ? { action: `deny` }
            : WX(i) && (t === `foreground-tab` || t === `background-tab`)
              ? e.admitBrowserTab()
                ? {
                    action: `allow`,
                    outlivesOpener: !0,
                    overrideBrowserWindowOptions: {
                      webPreferences: { navigateOnDragDrop: !0, preload: e.browserPagePreloadPath },
                    },
                    createWindow: (n) => {
                      let i = a.bn(crypto.randomUUID()),
                        s = `webContents` in n && WX(n.webContents) ? n.webContents : null;
                      if (s == null)
                        throw Error(`Owl browser sidebar window.open child WebContents missing`);
                      let l = GX(c, s, { browserTabId: i, conversationId: r.conversationId }, null);
                      return (
                        pZe(s),
                        e.windowManager.sendMessageToWebContents(
                          c.owner,
                          pZ({
                            ...(t === `background-tab` ? { active: !1 } : {}),
                            adoptionLease: l,
                            adoptedWebContentsId: s.id,
                            browserTabId: i,
                            conversationId: r.conversationId,
                            initialUrl: o,
                            insertToRightOfTabId: r.browserTabId,
                          }),
                        ),
                        s
                      );
                    },
                  }
                : { action: `deny` }
              : t === `background-tab`
                ? (e.windowManager.sendMessageToWebContents(
                    c.owner,
                    pZ({
                      active: !1,
                      conversationId: r.conversationId,
                      initialUrl: o,
                      insertToRightOfTabId: r.browserTabId,
                    }),
                  ),
                  { action: `deny` })
                : (e.windowManager.sendMessageToWebContents(c.owner, {
                    ...pZ({
                      conversationId: r.conversationId,
                      initialUrl: o,
                      insertToRightOfTabId: r.browserTabId,
                    }),
                  }),
                  { action: `deny` });
        }),
        (r.dispose = () => {
          (m.dispose(),
            (r.takeIncompleteNavigationObservation = () => null),
            (r.lastWebMcpToolCall = null),
            r.webMcpParentCallIds?.clear(),
            g(),
            i.removeListener(`page-title-updated`, D),
            i.removeListener(`page-favicon-updated`, j),
            u.removeListener(iZ, M),
            i.removeListener(`audio-state-changed`, I),
            i.removeListener(`user-media-capture-state-changed`, L),
            u.removeListener(tZ, R),
            i.removeListener(`did-start-loading`, D),
            i.removeListener(`did-start-navigation`, N),
            i.removeListener(`did-stop-loading`, P),
            i.removeListener(`did-finish-load`, F),
            i.removeListener(`did-navigate`, B),
            i.removeListener(`did-navigate-in-page`, V),
            i.removeListener(`did-redirect-navigation`, ee),
            i.removeListener(`did-fail-load`, te),
            i.removeListener(`will-frame-navigate`, H),
            i.removeListener(`will-navigate`, re),
            i.removeListener(`will-redirect`, U),
            i.removeListener(`destroyed`, ie),
            u.removeListener(eZ, ae),
            i.removeListener(`render-process-gone`, le),
            i.removeListener(`unresponsive`, ue),
            i.removeListener(`dom-ready`, de),
            i.removeListener(`preload-error`, fe),
            i.removeListener(`found-in-page`, W),
            i.removeListener(`before-input-event`, _e),
            i.removeListener(`before-mouse-event`, ve),
            i.removeListener(`context-menu`, ye),
            u.removeListener(nZ, be),
            u.removeListener(rZ, xe),
            r.view.webContents?.id === i.id &&
              ((r.managedNavigation = void 0),
              (r.isRestoring = !1),
              (r.isAudible = !1),
              fZ(r),
              r.mediaIndicator.dispose(),
              (r.isMainFrameLoading = !1),
              (r.isWaitingForResponse = !1),
              _(!1),
              (r.view.webContents = null),
              e.onBrowserStateChanged()));
        }),
        s === `transfer` || s === `history-clone`)
      ) {
        (T(), A(), s === `transfer` && g());
        return;
      }
      let Se = JXe({ errorReporter: e.errorReporter, pageState: r, webContents: i });
      S = Se != null;
      let Ce =
          s === `app` &&
          Se == null &&
          !f &&
          !p &&
          i.navigationHistory.getActiveIndex() < 0 &&
          Ze(r.pendingUrl).length > 0,
        we = () => {
          if (r.view.webContents?.id !== i.id || i.isDestroyed()) return (g(), !1);
          if (s === `owl` && i.navigationHistory.getActiveIndex() < 0 && Ze(r.pendingUrl).length > 0)
            return (w(), !1);
          let t = YXe({
            navigatePageToUrl: (t, n, i) => e.navigatePageToUrl(r, t, n, i),
            pageState: r,
            requiresInitialManagedNavigation: Ce,
            webContents: i,
          });
          return (t || (w(), g()), t);
        },
        Te = (n, a, o) => {
          EXe(e.browserSessionRegistry, t, r, i.id, n, a, o);
        };
      (Se == null
        ? ((r.isColdRestore = !1), T(), A(), p ? (w(), g()) : we())
        : (A(),
          p &&
            (Te(`browser-restore-page-attached`, `Attached persisted Browser page`),
            Te(`browser-restore-history-started`, `Started Browser navigation history restore`)),
          Se.then((t) => {
            if (((S = !1), r.view.webContents?.id !== i.id || i.isDestroyed())) {
              g();
              return;
            }
            if (r.navigationVersion !== C) {
              (p &&
                Te(
                  `browser-restore-history-failed`,
                  `Browser navigation history restore was superseded`,
                  [{ label: `reason`, value: `navigation-version-changed` }],
                ),
                r.isColdRestore &&
                  ((r.isColdRestore = !1),
                  (r.serializedPageState = null),
                  e.deletePersistedPageState(r),
                  T()),
                w(),
                i.getURL().length > 0 && g());
              return;
            }
            (t
              ? (p && Te(`browser-restore-history-succeeded`, `Restored Browser navigation history`),
                (r.isColdRestore = !1),
                T(),
                A(),
                r.pendingUrl.length > 0 ? we() : g())
              : p
                ? (Te(`browser-restore-history-failed`, `Failed to restore Browser navigation history`),
                  (r.isColdRestore = !1),
                  (r.serializedPageState = null),
                  e.deletePersistedPageState(r),
                  g(),
                  ae())
                : p || ((r.isColdRestore = !1), we()),
              w());
          })),
        e.finishPageAttach(t, r, i, o),
        e.enforceDetachedPageBudget(t));
    }
  }

  return class BrowserPageWebviewBindingController {
    private readonly bindings = new WeakMap<object, any>();

    bindPageToWebview(helpers: any, windowState: any, page: any, webContents: any, themeVariant: unknown, initialNavigationOwner: unknown): void {
      bindPageToWebview(helpers, windowState, page, webContents, themeVariant, initialNavigationOwner);
      this.bindings.set(webContents, { helpers, windowState, page });
    }

    getBinding(webContents: object): any {
      return this.bindings.get(webContents) ?? null;
    }

    disposeBinding(webContents: object): void {
      this.bindings.delete(webContents);
    }
  };
}

if (typeof module !== `undefined`) module.exports = { createBrowserPageWebviewBindingControllerClass };
