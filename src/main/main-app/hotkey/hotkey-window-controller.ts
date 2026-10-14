// @ts-nocheck

/**
 * Owns Hotkey Window presentation: paired BrowserWindows, transition protocol,
 * placement, pointer passthrough, drag snapping, guides, and haptics.
 */
export function createHotkeyWindowControllerClass(
  dependencies: Record<string, any>,
) {
  const { BrowserWindow, app, geometry, logger, randomUUID, screen, shared } =
    dependencies;
  const platform = dependencies.platform ?? process.platform;
  const now = dependencies.now ?? (() => performance.now());
  const setIntervalFn = dependencies.setInterval ?? globalThis.setInterval;
  const clearIntervalFn =
    dependencies.clearInterval ?? globalThis.clearInterval;
  const setTimeoutFn = dependencies.setTimeout ?? globalThis.setTimeout;
  const clearTimeoutFn = dependencies.clearTimeout ?? globalThis.clearTimeout;
  const loadObjcLibrary =
    dependencies.loadObjcLibrary ?? (() => import("objc-js"));

  function pat({
    currentBounds: e,
    desiredComposerTopOnScreenPx: t,
    minimumComposerTopInsetPx: n,
    restingComposerTopInsetPx: r,
    workArea: i,
  }) {
    let a = Math.min(n, r),
      o = i.y,
      s = i.y + i.height - e.height,
      c = K7(t, o + a, s + r),
      l = K7(r, Math.max(a, c - s), Math.min(r, c - o));
    return { composerTopInsetPx: l, windowBounds: { ...e, y: c - l } };
  }
  function K7(e, t, n) {
    return Math.max(t, Math.min(e, n));
  }
  var mat = `data:text/html;charset=utf-8,%0A%3C!doctype%20html%3E%3Cmeta%20charset%3D%22utf-8%22%3E%0A%3Cmeta%20http-equiv%3D%22Content-Security-Policy%22%20content%3D%22default-src%20'none'%3B%20style-src%20'unsafe-inline'%22%3E%0A%3Cstyle%3E%0Ahtml%2Cbody%2Csvg%7Bmargin%3A0%3Bwidth%3A100%25%3Bheight%3A100%25%3Boverflow%3Ahidden%3Bbackground%3Atransparent%7D%0Ag%7Bstroke%3AGrayText%3Bstroke-width%3A1%3Bopacity%3A.65%7D%0Apath%7Bfill%3Anone%7D%0A%23y2%7Bdisplay%3Anone%7D%0A%3C%2Fstyle%3E%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20aria-hidden%3D%22true%22%3E%0A%3Cg%20id%3D%22x0%22%20data-snaps-x%3D%220%203%205%202%207%22%3E%3Cpath%2F%3E%3Cpath%2F%3E%3Cpath%2F%3E%3Cpath%2F%3E%3C%2Fg%3E%0A%3Cg%20id%3D%22x1%22%20data-snaps-x%3D%221%204%206%202%208%22%3E%3Cpath%2F%3E%3Cpath%2F%3E%3Cpath%2F%3E%3Cpath%2F%3E%3C%2Fg%3E%0A%3Cg%20id%3D%22y0%22%20data-snaps-y%3D%220%203%205%206%208%22%3E%3Cpath%2F%3E%3Cpath%2F%3E%3Cpath%2F%3E%3C%2Fg%3E%0A%3Cg%20id%3D%22y1%22%20data-snaps-y%3D%221%204%207%206%209%22%3E%3Cpath%2F%3E%3Cpath%2F%3E%3Cpath%2F%3E%3C%2Fg%3E%0A%3Cg%20id%3D%22y2%22%20data-snaps-y%3D%222%22%3E%3Cpath%2F%3E%3Cpath%2F%3E%3Cpath%2F%3E%3C%2Fg%3E%0A%3C%2Fsvg%3E`,
    hat = class {
      owner;
      logger = logger.r(`composer-snap-guides`);
      window;
      ready;
      state = null;
      updating = !1;
      styleKey = null;
      disposed = !1;
      constructor(e) {
        ((this.owner = e),
          (this.window = new BrowserWindow({
            width: 1,
            height: 1,
            frame: !1,
            transparent: !0,
            backgroundColor: `#00000000`,
            show: !1,
            focusable: !1,
            skipTaskbar: !0,
            resizable: !1,
            minimizable: !1,
            maximizable: !1,
            hasShadow: !1,
            webPreferences: {
              sandbox: !0,
              contextIsolation: !0,
              nodeIntegration: !1,
              javascript: !1,
            },
          })),
          this.window.setAlwaysOnTop(!0, `floating`),
          this.window.setIgnoreMouseEvents(!0),
          platform === `darwin` &&
            this.window.setVisibleOnAllWorkspaces(!0, {
              visibleOnFullScreen: !0,
              skipTransformProcessType: !0,
            }),
          (this.ready = this.window
            .loadURL(mat)
            .then(() => !0)
            .catch(
              (e) => (
                this.logger.warning(`Failed to load composer snap guides`, {
                  safe: {},
                  sensitive: { error: e },
                }),
                this[Symbol.dispose](),
                !1
              ),
            )));
      }
      update(e, t, n, r) {
        if (this.disposed) return;
        let i = geometry.rt(e, t);
        (this.state == null ||
          this.state.workArea.x !== e.x ||
          this.state.workArea.y !== e.y ||
          this.state.workArea.width !== e.width ||
          this.state.workArea.height !== e.height ||
          this.state.grid.width !== i.width ||
          this.state.selection.x !== n.x ||
          this.state.selection.y !== n.y ||
          this.state.color !== r) &&
          ((this.state = { workArea: e, grid: i, selection: n, color: r }),
          this.paint());
      }
      hide() {
        ((this.state = null),
          !this.disposed && !this.window.isDestroyed() && this.window.hide());
      }
      [Symbol.dispose]() {
        ((this.disposed = !0),
          (this.state = null),
          this.window.isDestroyed() || this.window.destroy());
      }
      async paint() {
        if (this.updating || this.disposed) return;
        this.updating = !0;
        let e = null;
        try {
          if (!(await this.ready) || this.disposed || this.state == null)
            return;
          e = this.state;
          let { workArea: t, grid: n, selection: r, color: i } = e;
          this.window.setBounds(t);
          let a = [0, n.x - t.x, n.x + n.width - t.x, t.width],
            o = [0, n.y - t.y, n.y + n.height - t.y, t.height - 16, t.height],
            s = [
              ...a
                .slice(1, 3)
                .flatMap((e, t) =>
                  o.slice(1).map((n, r) => q7(`x${t}`, r, e, o[r], e, n)),
                ),
              ...[o[1], o[2], t.height - 16].flatMap((e, t) =>
                a.slice(1).map((n, r) => q7(`y${t}`, r, a[r], e, n, e)),
              ),
            ].join(`
`),
            c = this.styleKey;
          ((this.styleKey = await this.window.webContents.insertCSS(`
        ${s}
        [data-snaps-x~="${r.x}"],
        [data-snaps-y~="${r.y}"] { stroke: ${/^#[0-9a-f]{6}$/i.test(i) ? i : `Highlight`} !important; opacity: 1; stroke-width: 1.5; }
        #y2 {
          display: ${r.y === 2 ? `block` : `none`} !important;
        }
      `)),
            c != null &&
              !this.disposed &&
              (await this.window.webContents.removeInsertedCSS(c)),
            this.state === e &&
              !this.disposed &&
              !this.owner.isDestroyed() &&
              (this.window.showInactive(), this.owner.moveTop()));
        } catch (e) {
          (this.logger.warning(`Failed to present composer snap guides`, {
            safe: {},
            sensitive: { error: e },
          }),
            this[Symbol.dispose]());
        } finally {
          ((this.updating = !1),
            !this.disposed &&
              this.state != null &&
              this.state !== e &&
              this.paint());
        }
      }
    };
  function q7(e, t, n, r, i, a) {
    let o = Math.hypot(i - n, a - r),
      s = o / Math.max(1, Math.round(o / 14)),
      c = (s * 8) / 14;
    return `#${e} path:nth-child(${t + 1}) {
    d: path("M ${n} ${r} L ${i} ${a}");
    stroke-dasharray: ${c} ${s - c};
    stroke-dashoffset: ${c / 2};
  }`;
  }
  var gat = class {
      logger = logger.r(`composer-snap-haptics`);
      manager = null;
      constructor() {
        platform === `darwin` && this.load();
      }
      snap() {
        try {
          this.manager
            ?.defaultPerformer()
            .performFeedbackPattern$performanceTime$(1, 1);
        } catch (e) {
          ((this.manager = null),
            this.logger.warning(`Unable to perform snap haptic feedback`, {
              safe: {},
              sensitive: { error: e },
            }));
        }
      }
      async load() {
        try {
          let { NobjcLibrary: e } = await loadObjcLibrary(),
            t = new e(`/System/Library/Frameworks/AppKit.framework/AppKit`);
          this.manager = t.NSHapticFeedbackManager;
        } catch (e) {
          this.logger.info(`Snap haptics are unavailable`, {
            safe: {},
            sensitive: { error: e },
          });
        }
      }
    },
    _at = class {
      onMove;
      reducedMotion;
      current = null;
      target = null;
      timer = null;
      lastFrameTime = 0;
      releaseUntil = { x: 0, y: 0 };
      selection = { x: -1, y: -1 };
      constructor(e, t) {
        ((this.onMove = e), (this.reducedMotion = t));
      }
      move(e, t, n) {
        this.target = t;
        let r = this.current ?? e,
          i = now();
        this.current = { ...e };
        for (let e of [`x`, `y`])
          this.reducedMotion
            ? (this.current[e] = t[e])
            : n[e] < 0
              ? (this.selection[e] >= 0 && (this.releaseUntil[e] = i + 90),
                (this.current[e] = i < this.releaseUntil[e] ? r[e] : t[e]))
              : (this.selection[e] >= 0 || i < this.releaseUntil[e]) &&
                (this.current[e] = r[e]);
        if (
          ((this.selection = n),
          this.onMove(this.current),
          this.current.x === t.x && this.current.y === t.y)
        ) {
          this[Symbol.dispose]();
          return;
        }
        this.timer ??
          ((this.lastFrameTime = now()),
          (this.timer = setIntervalFn(() => this.step(), 16)),
          this.timer.unref());
      }
      finish() {
        (this[Symbol.dispose](),
          this.target != null &&
            ((this.current = this.target), this.onMove(this.target)));
      }
      [Symbol.dispose]() {
        this.timer != null &&
          (clearIntervalFn(this.timer), (this.timer = null));
      }
      step() {
        if (this.current == null || this.target == null) return;
        let e = now(),
          t = 1 - Math.exp(-(e - this.lastFrameTime) / 45);
        this.lastFrameTime = e;
        for (let n of [`x`, `y`])
          this.current[n] =
            this.selection[n] < 0 && e >= this.releaseUntil[n]
              ? this.target[n]
              : this.current[n] + (this.target[n] - this.current[n]) * t;
        if (
          Math.hypot(
            this.target.x - this.current.x,
            this.target.y - this.current.y,
          ) < 0.5
        ) {
          this.finish();
          return;
        }
        this.onMove(this.current);
      }
    },
    J7 = 470,
    Y7 = J7,
    X7 = 290,
    vat = J7,
    yat = 640,
    Z7 = 400,
    Q7 = 400,
    bat = 52,
    xat = 110,
    $7 = 1200,
    Sat = class {
      windowManager;
      globalState;
      shouldRetainWindows;
      logger = logger.r(`hotkey-window-controller`);
      configuredWindowIds = new Set();
      mode = `hidden`;
      isDisposed = !1;
      lastVisibleSurface = `home`;
      homeWindow = null;
      homeWindowPromise = null;
      threadWindow = null;
      lastDetailRoute = null;
      lastDetailRouteState = void 0;
      threadWindowPromise = null;
      threadSize = { width: vat, height: yat };
      transitionInFlight = null;
      windowGeneration = 0;
      homePointerInteractive = !0;
      homeMousePassthroughEnabled = !1;
      homeComposerTopInsetPx = null;
      homeLayoutMetrics = null;
      homeDragState = null;
      snapHaptics = new gat();
      primaryWindowMayBeDismissFocusFallback = !1;
      homePlacement;
      snapGuides = null;
      constructor(e, t, n = () => !0) {
        ((this.windowManager = e),
          (this.globalState = t),
          (this.shouldRetainWindows = n),
          (this.homePlacement = t.get(`hotkey-window-home-placement`) ?? null));
      }
      async toggleHotkey() {
        return this.transitionInFlight
          ? null
          : this.mode === `hidden`
            ? (await this.showLastVisibleSurface(),
              this.getWindowForCurrentMode())
            : (this.getWindowForCurrentMode()?.isFocused() ||
                this.handleHotkeyWindowBlurred(),
              this.hideAll(),
              null);
      }
      async prewarm() {
        let e = this.windowGeneration;
        (await this.ensureHomeWindow(),
          this.isWindowGenerationCurrent(e) &&
            (await this.ensureThreadWindow()));
      }
      async openThread(e) {
        this.transitionInFlight || (await this.openDetailRoute(shared.do(e)));
      }
      async openDetailRoute(e, t) {
        if (!this.transitionInFlight) {
          if (
            ((this.lastDetailRoute = e),
            (this.lastDetailRouteState = t),
            this.mode === `hidden`)
          ) {
            await this.showThread(e, t);
            return;
          }
          if (this.mode === `threadVisible`) {
            let n = this.windowGeneration,
              r = await this.ensureThreadWindow(e);
            if (!this.isWindowGenerationCurrent(n)) return;
            (this.navigateToDetailRoute(r, e, t),
              this.showAndFocusFromCurrentFocus(r),
              (this.lastVisibleSurface = `thread`));
            return;
          }
          this.mode === `homeVisible` &&
            (await this.startExpandTransition(e, t));
        }
      }
      async openHome() {
        if (!this.transitionInFlight) {
          if (this.mode === `hidden`) {
            await this.showHome();
            return;
          }
          if (this.mode === `homeVisible`) {
            let e = this.windowGeneration,
              t = await this.ensureHomeWindow();
            if (!this.isWindowGenerationCurrent(e)) return;
            (this.applyHotkeyWindowWindowPolicy(t),
              this.navigateToRoute(t, shared.co, e9()),
              this.showAndFocusFromCurrentFocus(t),
              (this.lastVisibleSurface = `home`),
              this.applyHomeInteractivityPolicy());
            return;
          }
          this.mode === `threadVisible` &&
            (await this.startCollapseTransition());
        }
      }
      async collapseToHome() {
        if (!this.transitionInFlight) {
          if (this.mode === `hidden`) {
            await this.showHome();
            return;
          }
          this.mode === `threadVisible` &&
            (await this.startCollapseTransition());
        }
      }
      setHomePointerInteraction(e, t) {
        this.isHomeOrigin(e) &&
          (this.transitionInFlight ||
            (this.homePointerInteractive !== t.isInteractive &&
              ((this.homePointerInteractive = t.isInteractive),
              this.applyHomeInteractivityPolicy())));
      }
      setHomeLayout(e, t) {
        if (!this.isHomeOrigin(e) || !this.homeWindow) return;
        let n = {
          composerHeightPx: Math.max(0, Math.round(t.composerHeightPx)),
          composerLeftInsetPx: t.composerLeftInsetPx,
          composerWidthPx: t.composerWidthPx,
          minimumComposerTopInsetPx: Math.max(
            0,
            Math.round(t.minimumComposerTopInsetPx),
          ),
          restingComposerTopInsetPx: Math.max(
            0,
            Math.round(t.restingComposerTopInsetPx),
          ),
        };
        if (
          this.homeLayoutMetrics?.minimumComposerTopInsetPx ===
            n.minimumComposerTopInsetPx &&
          this.homeLayoutMetrics.restingComposerTopInsetPx ===
            n.restingComposerTopInsetPx &&
          this.homeLayoutMetrics.composerHeightPx === shared.composerHeightPx &&
          this.homeLayoutMetrics.composerLeftInsetPx ===
            shared.composerLeftInsetPx &&
          this.homeLayoutMetrics.composerWidthPx === shared.composerWidthPx
        )
          return;
        let r = this.getWindowLayoutBounds(this.homeWindow),
          i = this.homeComposerTopInsetPx ?? n.restingComposerTopInsetPx,
          a = this.homeLayoutMetrics == null;
        if (
          ((this.homeLayoutMetrics = n),
          this.homePlacement != null && this.homeDragState == null)
        ) {
          this.applyHomePlacement(
            a
              ? this.getTargetDisplay().workArea
              : screen.getDisplayMatching(r).workArea,
            !a,
          );
          return;
        }
        this.layoutHomeForComposerTop(
          r.y + i,
          screen.getDisplayMatching(r).workArea,
        );
      }
      startHomeDrag(e, t) {
        if (!this.isHomeOrigin(e) || !this.homeWindow) return;
        let n = this.homeLayoutMetrics;
        if (n == null) return;
        let r = this.homeComposerTopInsetPx ?? n.restingComposerTopInsetPx;
        (this.homeDragState?.motion[Symbol.dispose](),
          (this.homeDragState = {
            guideColor: t.guideColor,
            workArea: this.getTargetDisplay().workArea,
            motion: new _at((e) => {
              this.homeDragState != null &&
                this.layoutHomeForComposerTop(
                  Math.round(e.y),
                  this.homeDragState.workArea,
                  Math.round(e.x - shared.composerLeftInsetPx),
                );
            }, t.reducedMotion),
            selection: { x: -1, y: -1 },
            displayId: null,
            moved: !1,
            pointerComposerY: t.pointerWindowY - r,
            pointerWindowX: t.pointerWindowX - shared.composerLeftInsetPx,
          }));
      }
      moveHomeDrag(e) {
        if (
          !this.isHomeOrigin(e) ||
          !this.homeWindow ||
          this.homeDragState == null
        )
          return;
        let t = screen.getCursorScreenPoint(),
          n = screen.getDisplayNearestPoint(t),
          r = this.getHomeComposerBounds();
        if (r == null) return;
        let i = this.homeDragState,
          o = { x: t.x - i.pointerWindowX, y: t.y - i.pointerComposerY },
          s = geometry.ot(n.workArea, r),
          c = i.displayId === n.id ? i.selection : { x: -1, y: -1 };
        ((i.selection = geometry.at(o, s, c)),
          ((i.selection.x >= 0 && i.selection.x !== c.x) ||
            (i.selection.y >= 0 && i.selection.y !== c.y)) &&
            this.snapHaptics.snap(),
          (i.displayId = n.id),
          (i.moved = !0),
          (i.workArea = n.workArea),
          i.motion.move(
            o,
            { x: s.x[i.selection.x] ?? o.x, y: s.y[i.selection.y] ?? o.y },
            i.selection,
          ),
          (this.snapGuides ??= new hat(this.homeWindow)),
          this.snapGuides.update(n.workArea, r, i.selection, i.guideColor));
      }
      endHomeDrag(e) {
        if (!this.isHomeOrigin(e)) return;
        this.homeDragState?.motion.finish();
        let t = this.getHomeComposerBounds();
        if (this.homeDragState?.moved && t != null) {
          let e = this.homeDragState.workArea;
          ((this.homePlacement = geometry.ct(
            t,
            geometry.it(e, t),
            this.homeDragState.selection,
          )),
            this.globalState.set(
              `hotkey-window-home-placement`,
              this.homePlacement,
            ));
        }
        ((this.homeDragState = null),
          this.snapGuides?.hide(),
          this.applyHomeInteractivityPolicy());
      }
      getHomeComposerBounds() {
        if (
          !this.homeWindow ||
          this.homeWindow.isDestroyed() ||
          !this.homeLayoutMetrics
        )
          return null;
        let e = this.getWindowLayoutBounds(this.homeWindow);
        return {
          ...e,
          x: e.x + this.homeLayoutMetrics.composerLeftInsetPx,
          width: this.homeLayoutMetrics.composerWidthPx,
          y:
            e.y +
            (this.homeComposerTopInsetPx ??
              this.homeLayoutMetrics.restingComposerTopInsetPx),
          height: this.homeLayoutMetrics.composerHeightPx,
        };
      }
      applyHomePlacement(e, t = !1) {
        let n = this.getHomeComposerBounds();
        if (
          this.homePlacement == null ||
          n == null ||
          this.homeLayoutMetrics == null
        )
          return;
        let r = geometry.st(
          this.homePlacement,
          geometry.it(e, n),
          geometry.ot(e, n),
        );
        this.layoutHomeForComposerTop(
          t && typeof this.homePlacement.y == `number` ? n.y : Math.round(r.y),
          e,
          Math.round(
            (t && typeof this.homePlacement.x == `number` ? n.x : r.x) -
              this.homeLayoutMetrics.composerLeftInsetPx,
          ),
        );
      }
      layoutHomeForComposerTop(e, t, n) {
        if (!this.homeWindow || this.homeWindow.isDestroyed()) return;
        let r = this.homeLayoutMetrics;
        if (r == null) return;
        let i = this.getWindowLayoutBounds(this.homeWindow),
          { composerTopInsetPx: a, windowBounds: o } = pat({
            currentBounds: n == null ? i : { ...i, x: n },
            desiredComposerTopOnScreenPx: e,
            minimumComposerTopInsetPx: r.minimumComposerTopInsetPx,
            restingComposerTopInsetPx: r.restingComposerTopInsetPx,
            workArea: t,
          });
        (wat(i, o) || this.setWindowLayoutBounds(this.homeWindow, o),
          this.homeComposerTopInsetPx !== a &&
            ((this.homeComposerTopInsetPx = a),
            this.windowManager.sendMessageToWindow(this.homeWindow, {
              type: `hotkey-window-home-composer-position-changed`,
              topInsetPx: a,
            })));
      }
      handleTransitionDone(e, t) {
        let n = this.transitionInFlight;
        if (n && n.id === t.transitionId) {
          if (n.stage === `awaiting-source-raised`) {
            if (t.step !== `raised` || e.id !== n.sourceWebContentsId) return;
            (this.clearTransitionTimeout(),
              this.swapWindowsAfterRaise(n),
              (n.stage = `awaiting-destination-lowered`),
              this.startTransitionTimeout(n));
            let r = this.getWindowByWebContentsId(n.destinationWebContentsId);
            r && this.sendTransition(r, n.id, `lower-curtain`);
            return;
          }
          n.stage === `awaiting-destination-lowered` &&
            t.step === `lowered` &&
            e.id === n.destinationWebContentsId &&
            this.finishTransition(n);
        }
      }
      hideAll() {
        (this.clearTransitionTimeout(),
          (this.transitionInFlight = null),
          this.resetHomeInteractivity());
        let e =
          platform === `darwin` && !this.primaryWindowMayBeDismissFocusFallback
            ? this.windowManager.getPrimaryWindows()
            : [];
        for (let t of e) t.setFocusable(!1);
        try {
          (this.homeWindow &&
            !this.homeWindow.isDestroyed() &&
            this.homeWindow.hide(),
            this.threadWindow &&
              !this.threadWindow.isDestroyed() &&
              this.threadWindow.hide(),
            (this.mode = `hidden`));
        } finally {
          for (let t of e) t.isDestroyed() || t.setFocusable(!0);
        }
      }
      closeAllWindows() {
        (this.clearTransitionTimeout(),
          (this.transitionInFlight = null),
          this.resetHomeInteractivity(),
          this.snapGuides?.[Symbol.dispose](),
          (this.snapGuides = null),
          (this.windowGeneration += 1));
        let e = this.homeWindow,
          t = this.threadWindow;
        ((this.homeWindow = null),
          (this.homeWindowPromise = null),
          (this.homeComposerTopInsetPx = null),
          (this.homeLayoutMetrics = null),
          (this.homeDragState = null),
          (this.threadWindow = null),
          (this.threadWindowPromise = null),
          (this.mode = `hidden`),
          this.closeWindow(e),
          this.closeWindow(t));
      }
      dispose() {
        ((this.isDisposed = !0),
          this.closeAllWindows(),
          (this.lastDetailRoute = null),
          (this.lastDetailRouteState = void 0));
      }
      async showHome(e = !1) {
        let t = this.windowGeneration;
        this.homePointerInteractive = !0;
        let r = this.homeWindow != null && !this.homeWindow.isDestroyed(),
          i = this.threadWindow != null && !this.threadWindow.isDestroyed(),
          a = await this.ensureHomeWindow();
        if (!this.isWindowGenerationCurrent(t)) return;
        if (i && this.lastVisibleSurface === `thread`) this.alignHomeToThread();
        else if (!r) {
          let e = this.computeHomeBounds(this.getTargetDisplay());
          this.setWindowLayoutBounds(a, e);
        }
        (this.applyHotkeyWindowWindowPolicy(a),
          (!e || !r) && this.navigateToRoute(a, shared.co, e9()),
          this.applyHomePlacement(this.getTargetDisplay().workArea),
          this.showAndFocusFromCurrentFocus(a),
          (this.mode = `homeVisible`),
          (this.lastVisibleSurface = `home`),
          this.applyHomeInteractivityPolicy());
        let o = await this.ensureThreadWindow();
        this.isWindowGenerationCurrent(t) &&
          (this.alignThreadToHome(), o.hide());
      }
      async showThread(e, t) {
        let n = this.windowGeneration,
          r = e ?? this.lastDetailRoute,
          i = t ?? this.lastDetailRouteState;
        if (!r) return !1;
        let a = this.threadWindow != null && !this.threadWindow.isDestroyed(),
          o = await this.ensureThreadWindow(r);
        return this.isWindowGenerationCurrent(n)
          ? (a ||
              this.setWindowLayoutBounds(
                o,
                this.computeThreadBounds(this.getTargetDisplay()),
              ),
            this.homeWindow &&
              !this.homeWindow.isDestroyed() &&
              this.lastVisibleSurface === `home` &&
              this.alignThreadToHome(),
            this.applyHotkeyWindowWindowPolicy(o),
            this.navigateToDetailRoute(o, r, i),
            this.showAndFocusFromCurrentFocus(o),
            this.homeWindow &&
              !this.homeWindow.isDestroyed() &&
              this.homeWindow.hide(),
            this.resetHomeInteractivity(),
            (this.mode = `threadVisible`),
            (this.lastVisibleSurface = `thread`),
            !0)
          : !1;
      }
      async showLastVisibleSurface() {
        (this.lastVisibleSurface === `thread` && (await this.showThread())) ||
          (await this.showHome(!0));
      }
      async startExpandTransition(e, t) {
        let n = this.windowGeneration,
          r = await this.ensureHomeWindow();
        if (!this.isWindowGenerationCurrent(n)) return;
        let i = await this.ensureThreadWindow();
        if (!this.isWindowGenerationCurrent(n)) return;
        ((this.lastDetailRoute = e),
          (this.lastDetailRouteState = t),
          this.alignThreadToHome(),
          this.applyHotkeyWindowWindowPolicy(r),
          this.applyHotkeyWindowWindowPolicy(i),
          this.navigateToDetailRoute(i, e, t),
          this.resetHomeInteractivity());
        let a = this.beginTransition({
          kind: `expand`,
          sourceWindow: r,
          destinationWindow: i,
        });
        (this.sendTransition(i, a, `raise-curtain`),
          this.sendTransition(r, a, `raise-curtain`));
      }
      async startCollapseTransition() {
        let e = this.windowGeneration,
          t = await this.ensureHomeWindow();
        if (!this.isWindowGenerationCurrent(e)) return;
        let r = await this.ensureThreadWindow();
        if (!this.isWindowGenerationCurrent(e)) return;
        (this.alignHomeToThread(),
          this.applyHotkeyWindowWindowPolicy(t),
          this.applyHotkeyWindowWindowPolicy(r),
          this.navigateToRoute(t, shared.co, e9()),
          this.resetHomeInteractivity());
        let i = this.beginTransition({
          kind: `collapse`,
          sourceWindow: r,
          destinationWindow: t,
        });
        (this.sendTransition(t, i, `raise-curtain`),
          this.sendTransition(r, i, `raise-curtain`));
      }
      beginTransition({ kind: e, sourceWindow: t, destinationWindow: n }) {
        let r = randomUUID(),
          i = setTimeoutFn(() => {
            this.handleTransitionTimeout(r);
          }, $7);
        return (
          i.unref(),
          (this.transitionInFlight = {
            id: r,
            kind: e,
            stage: `awaiting-source-raised`,
            sourceWebContentsId: t.webContents.id,
            destinationWebContentsId: n.webContents.id,
            timeout: i,
          }),
          r
        );
      }
      handleTransitionTimeout(e) {
        let t = this.transitionInFlight;
        t &&
          t.id === e &&
          (this.logger.warning(
            `Hotkey Window transition timed out; forcing completion`,
            {
              safe: { transitionId: e, stage: t.stage, kind: t.kind },
              sensitive: {},
            },
          ),
          this.swapWindowsAfterRaise(t),
          this.finishTransition(t));
      }
      startTransitionTimeout(e) {
        (this.clearTransitionTimeout(),
          (e.timeout = setTimeoutFn(() => {
            this.handleTransitionTimeout(e.id);
          }, $7)),
          e.timeout.unref());
      }
      clearTransitionTimeout() {
        this.transitionInFlight &&
          clearTimeoutFn(this.transitionInFlight.timeout);
      }
      swapWindowsAfterRaise(e) {
        let t = this.getWindowByWebContentsId(e.sourceWebContentsId),
          n = this.getWindowByWebContentsId(e.destinationWebContentsId);
        n &&
          (this.applyHotkeyWindowWindowPolicy(n),
          this.showAndFocus(n),
          t && !t.isDestroyed() && t.hide());
      }
      finishTransition(e) {
        this.clearTransitionTimeout();
        let t = this.getWindowByWebContentsId(e.sourceWebContentsId),
          n = this.getWindowByWebContentsId(e.destinationWebContentsId);
        (t && this.sendTransition(t, e.id, `commit`),
          n && this.sendTransition(n, e.id, `commit`),
          (this.transitionInFlight = null),
          (this.mode = e.kind === `expand` ? `threadVisible` : `homeVisible`),
          (this.lastVisibleSurface = e.kind === `expand` ? `thread` : `home`),
          this.applyHomeInteractivityPolicy());
      }
      async ensureHomeWindow() {
        if (this.homeWindow && !this.homeWindow.isDestroyed())
          return this.homeWindow;
        if (this.homeWindowPromise != null) return this.homeWindowPromise;
        let e = this.windowGeneration,
          t = this.windowManager
            .createWindow({
              title: app.getName(),
              width: Y7,
              height: X7,
              appearance: `hotkeyWindowHome`,
              show: !1,
              initialRoute: `/hotkey-window`,
            })
            .then((t) =>
              this.isDisposed || e !== this.windowGeneration
                ? (this.closeWindow(t), t)
                : (t.setMenuBarVisibility(!1),
                  t.on(`blur`, () => {
                    this.handleHotkeyWindowBlurred();
                  }),
                  t.on(`closed`, () => {
                    if (
                      (this.configuredWindowIds.delete(t.id),
                      (this.homeMousePassthroughEnabled = !1),
                      (this.homePointerInteractive = !0),
                      this.homeWindow === t &&
                        (this.snapGuides?.[Symbol.dispose](),
                        (this.snapGuides = null),
                        (this.homeWindow = null),
                        (this.homeComposerTopInsetPx = null),
                        (this.homeLayoutMetrics = null),
                        this.homeDragState?.motion[Symbol.dispose](),
                        (this.homeDragState = null)),
                      !this.shouldRetainWindows())
                    ) {
                      this.closeAllWindows();
                      return;
                    }
                    this.mode !== `threadVisible` && (this.mode = `hidden`);
                  }),
                  (this.homeWindow = t),
                  t),
            )
            .finally(() => {
              this.homeWindowPromise === t && (this.homeWindowPromise = null);
            });
        return ((this.homeWindowPromise = t), t);
      }
      async ensureThreadWindow(e) {
        if (this.threadWindow && !this.threadWindow.isDestroyed())
          return this.threadWindow;
        if (this.threadWindowPromise != null) return this.threadWindowPromise;
        let t = this.windowGeneration,
          n = this.windowManager
            .createWindow({
              title: app.getName(),
              width: this.threadSize.width,
              height: this.threadSize.height,
              appearance: `hotkeyWindowThread`,
              show: !1,
              initialRoute: e ?? `/hotkey-window`,
            })
            .then((e) =>
              this.isDisposed || t !== this.windowGeneration
                ? (this.closeWindow(e), e)
                : (e.setMenuBarVisibility(!1),
                  this.setWindowLayoutBounds(
                    e,
                    this.computeThreadBounds(this.getTargetDisplay()),
                  ),
                  e.setMinimumSize(Z7, Q7),
                  e.on(`resize`, () => {
                    if (e.isDestroyed()) return;
                    let t = this.getWindowLayoutBounds(e);
                    this.threadSize = {
                      width: Math.max(t.width, Z7),
                      height: Math.max(t.height, Q7),
                    };
                  }),
                  e.on(`blur`, () => {
                    this.handleHotkeyWindowBlurred();
                  }),
                  e.on(`closed`, () => {
                    if (
                      (this.configuredWindowIds.delete(e.id),
                      this.threadWindow === e && (this.threadWindow = null),
                      !this.shouldRetainWindows())
                    ) {
                      this.closeAllWindows();
                      return;
                    }
                    this.mode !== `homeVisible` && (this.mode = `hidden`);
                  }),
                  (this.threadWindow = e),
                  e),
            )
            .finally(() => {
              this.threadWindowPromise === n &&
                (this.threadWindowPromise = null);
            });
        return ((this.threadWindowPromise = n), n);
      }
      applyHotkeyWindowWindowPolicy(e) {
        e.isDestroyed() ||
          (this.configuredWindowIds.has(e.id) ||
            (this.configuredWindowIds.add(e.id),
            platform === `darwin`
              ? e.setVisibleOnAllWorkspaces(!0, {
                  visibleOnFullScreen: !0,
                  skipTransformProcessType: !0,
                })
              : e.setVisibleOnAllWorkspaces(!0)),
          e.moveTop());
      }
      showAndFocus(e) {
        e.isDestroyed() ||
          (e.isMinimized() && e.restore(),
          this.applyHotkeyWindowWindowPolicy(e),
          e.show(),
          platform === `darwin` && app.focus({ steal: !0 }),
          e.focus());
      }
      showAndFocusFromCurrentFocus(e) {
        ((this.primaryWindowMayBeDismissFocusFallback =
          this.primaryWindowIsFocused()),
          this.showAndFocus(e));
      }
      handleHotkeyWindowBlurred() {
        this.transitionInFlight ||
          (this.primaryWindowMayBeDismissFocusFallback =
            this.primaryWindowIsFocused());
      }
      primaryWindowIsFocused() {
        return this.windowManager
          .getPrimaryWindows()
          .some((e) => e.isFocused());
      }
      getTargetDisplay() {
        let e = screen.getCursorScreenPoint();
        return screen.getDisplayNearestPoint(e);
      }
      computeHomeBounds(e) {
        let t = e.workArea,
          n = Math.min(Y7, t.width),
          r = Math.min(X7, t.height),
          i = this.computeThreadBounds(e);
        return {
          x: Math.round(t.x + (t.width - n) / 2),
          y: t9(Math.round(i.y + i.height - r), t.y, t.y + t.height - r),
          width: n,
          height: r,
        };
      }
      computeThreadBounds(e) {
        let t = e.workArea,
          n = Math.min(Math.max(this.threadSize.width, Z7), t.width),
          r = Math.min(this.threadSize.height, t.height),
          i = Math.round(t.x + (t.width - n) / 2),
          a = Math.round(t.y + bat);
        return {
          x: t9(i, t.x, t.x + t.width - n),
          y: t9(a, t.y, t.y + t.height - r),
          width: n,
          height: r,
        };
      }
      alignThreadToHome() {
        if (
          !this.homeWindow ||
          this.homeWindow.isDestroyed() ||
          !this.threadWindow ||
          this.threadWindow.isDestroyed()
        )
          return;
        let e = this.getWindowLayoutBounds(this.homeWindow),
          t = this.getWindowLayoutBounds(this.threadWindow),
          n = screen.getDisplayMatching(e).workArea,
          r = Math.round(e.x + (e.width - t.width) / 2),
          i = Math.round(e.y + e.height - t.height),
          a = t9(r, n.x, n.x + n.width - t.width),
          o = t9(i, n.y, n.y + n.height - t.height);
        this.setWindowLayoutPosition(this.threadWindow, a, o);
      }
      alignHomeToThread() {
        if (
          !this.homeWindow ||
          this.homeWindow.isDestroyed() ||
          !this.threadWindow ||
          this.threadWindow.isDestroyed()
        )
          return;
        let e = this.getWindowLayoutBounds(this.homeWindow),
          t = this.getWindowLayoutBounds(this.threadWindow),
          n = Math.max(t.width, Z7),
          r = Math.round(t.x + (t.width - n) / 2),
          i = Math.round(t.y + t.height - e.height);
        if (e.x === r && e.y === i && e.width === n) return;
        this.setWindowLayoutBounds(this.homeWindow, {
          ...e,
          x: r,
          y: i,
          width: n,
        });
        let o = this.getHomeComposerBounds();
        if (o != null) {
          o.width += n - e.width;
          let r = screen.getDisplayMatching(t).workArea;
          ((this.homePlacement = geometry.ct(o, geometry.it(r, o), {
            x: -1,
            y: -1,
          })),
            this.globalState.set(
              `hotkey-window-home-placement`,
              this.homePlacement,
            ));
        }
      }
      getWindowLayoutBounds(e) {
        return platform === `win32` ? e.getContentBounds() : e.getBounds();
      }
      setWindowLayoutBounds(e, t) {
        if (!e.isDestroyed()) {
          if (platform === `win32`) {
            e.setContentBounds(t, !1);
            return;
          }
          e.setBounds(t, !1);
        }
      }
      setWindowLayoutPosition(e, t, n) {
        if (e.isDestroyed()) return;
        let r = this.getWindowLayoutBounds(e);
        (r.x !== t || r.y !== n) &&
          this.setWindowLayoutBounds(e, { ...r, x: t, y: n });
      }
      closeWindow(e) {
        e && !e.isDestroyed() && e.close();
      }
      isWindowGenerationCurrent(e) {
        return !this.isDisposed && e === this.windowGeneration;
      }
      resetHomeInteractivity() {
        (this.homeDragState != null &&
          this.homeWindow != null &&
          this.endHomeDrag(this.homeWindow.webContents),
          this.snapGuides?.hide(),
          (this.homeDragState = null),
          (this.homePointerInteractive = !0),
          this.disableHomeMousePassthrough());
      }
      disableHomeMousePassthrough() {
        if (!this.homeWindow || this.homeWindow.isDestroyed()) {
          this.homeMousePassthroughEnabled = !1;
          return;
        }
        this.homeMousePassthroughEnabled &&
          ((this.homeMousePassthroughEnabled = !1),
          this.homeWindow.setIgnoreMouseEvents(!1));
      }
      applyHomeInteractivityPolicy() {
        if (!this.homeWindow || this.homeWindow.isDestroyed()) {
          this.homeMousePassthroughEnabled = !1;
          return;
        }
        if (this.transitionInFlight || this.mode !== `homeVisible`) {
          this.disableHomeMousePassthrough();
          return;
        }
        let e = !this.homePointerInteractive && this.homeDragState == null;
        if (this.homeMousePassthroughEnabled !== e) {
          if (((this.homeMousePassthroughEnabled = e), e)) {
            this.homeWindow.setIgnoreMouseEvents(!0, { forward: !0 });
            return;
          }
          this.homeWindow.setIgnoreMouseEvents(!1);
        }
      }
      getWindowByWebContentsId(e) {
        return this.homeWindow &&
          !this.homeWindow.isDestroyed() &&
          this.homeWindow.webContents.id === e
          ? this.homeWindow
          : this.threadWindow &&
              !this.threadWindow.isDestroyed() &&
              this.threadWindow.webContents.id === e
            ? this.threadWindow
            : null;
      }
      navigateToRoute(e, t, n) {
        this.windowManager.sendMessageToWindow(e, {
          type: `navigate-to-route`,
          path: t,
          state: n,
        });
      }
      navigateToDetailRoute(e, t, r) {
        this.navigateToRoute(
          e,
          t,
          r ?? (shared._o(t) == null ? void 0 : Cat()),
        );
      }
      sendTransition(e, t, n) {
        this.windowManager.sendMessageToWindow(e, {
          type: `hotkey-window-transition`,
          transitionId: t,
          step: n,
          durationMs: xat,
        });
      }
      isHomeOrigin(e) {
        return (
          this.homeWindow != null &&
          !this.homeWindow.isDestroyed() &&
          this.homeWindow.webContents.id === e.id
        );
      }
      getWindowForCurrentMode() {
        let e =
          this.mode === `homeVisible`
            ? this.homeWindow
            : this.mode === `threadVisible`
              ? this.threadWindow
              : null;
        return e == null || e.isDestroyed() ? null : e;
      }
    };
  function Cat() {
    return { focusComposerNonce: Date.now() };
  }
  function e9() {
    return { focusComposerNonce: Date.now() };
  }
  function t9(e, t, n) {
    return e < t ? t : e > n ? n : e;
  }
  function wat(e, t) {
    return (
      e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height
    );
  }

  return Sat;
}
