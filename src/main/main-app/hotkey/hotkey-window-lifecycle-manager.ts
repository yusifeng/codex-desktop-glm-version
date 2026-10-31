// @ts-nocheck

/**
 * Owns Hotkey Window configuration, registration, ownership, retry, and controller lifetime.
 * Runtime primitives are injected so this owner participates in the main process's shared
 * shortcut registry and cross-instance lock domain.
 */
export function createHotkeyWindowLifecycleManagerClass(dependencies: Record<string, any>) {
  const {
    HotkeyWindowController: Sat,
    acquireCrossInstanceLock: jN,
    crossInstanceLocks: AN,
    ensureHotkeyPermissions: YV,
    getCommandBinding: cH,
    logger: r,
    registerGlobalHotkey: qV,
    resolveConfiguredHotkey: dH,
    shared: n,
    validateHotkey: JV,
  } = dependencies;
  const setTimeout = dependencies.setTimeout ?? globalThis.setTimeout;
  const clearTimeout = dependencies.clearTimeout ?? globalThis.clearTimeout;
  const now = dependencies.now ?? Date.now;
  const createDetailRouteState = () => ({ focusComposerNonce: now() });
  const Tat = 1e3;
  return class HotkeyWindowLifecycleManager {
    windowManager;
    globalState;
    isDevMode;
    isAppIdle;
    onAppEntrySource;
    hotkeyWindowController = null;
    isHotkeyWindowGateEnabled = !1;
    isHotkeyWindowActive = !1;
    devHotkeyWindowHotkeyOverrideEnabled = !1;
    registeredHotkeyWindowHotkey = null;
    registeredHotkeyWindowHotkeyRegistration = null;
    configuredHotkeyWindowHotkey;
    lifecycleRetry = null;
    ownershipLock = null;
    isDisposed = !1;
    constructor(e, t, n, r, i) {
      ((this.windowManager = e),
        (this.globalState = t),
        (this.isDevMode = n),
        (this.isAppIdle = r),
        (this.onAppEntrySource = i));
      let a = this.globalState.get(`hotkeyWindowHotkey`),
        o = a != null && JV(a) == null ? a : null,
        s = cH(`hotkeyWindow`);
      ((this.configuredHotkeyWindowHotkey = dH({ keymapHotkey: s, legacyHotkey: o })),
        s.hasBinding &&
          this.globalState.set(`hotkeyWindowHotkey`, this.configuredHotkeyWindowHotkey ?? void 0));
    }
    openFromRenderer(e, t) {
      return (
        r
          .n()
          .info(`hotkey_window_open_requested`, {
            safe: {
              threadId: n._o(t.path),
              isGateEnabled: this.isHotkeyWindowGateEnabled,
              isValidRoute: n.yo(t.path),
              ...this.windowManager.getRendererWindowLogFields(e),
            },
            sensitive: { routePath: t.path },
          }),
        this.open(t)
      );
    }
    handleTransitionDone(e, t) {
      this.hotkeyWindowController?.handleTransitionDone(e, t);
    }
    handleHomePointerInteractionChanged(e, t) {
      this.hotkeyWindowController?.setHomePointerInteraction(e, t);
    }
    handleHomeLayoutChanged(e, t) {
      this.hotkeyWindowController?.setHomeLayout(e, t);
    }
    handleHomeDragStart(e, t) {
      this.hotkeyWindowController?.startHomeDrag(e, t);
    }
    handleHomeDragMove(e) {
      this.hotkeyWindowController?.moveHomeDrag(e);
    }
    handleHomeDragEnd(e) {
      this.hotkeyWindowController?.endHomeDrag(e);
    }
    getState() {
      return this.getHotkeyWindowHotkeyState();
    }
    async toggle() {
      this.canUseHotkeyWindow() && (await this.ensureHotkeyWindowController().toggleHotkey());
    }
    async open({ path: e }) {
      if (this.canUseHotkeyWindow() && n.yo(e)) {
        if (e === `/hotkey-window`) {
          if (this.configuredHotkeyWindowHotkey == null) {
            await this.ensureHotkeyWindowController().openDetailRoute(n.go(!1), createDetailRouteState());
            return;
          }
          await this.ensureHotkeyWindowController().openHome();
          return;
        }
        await this.ensureHotkeyWindowController().openDetailRoute(
          e,
          e === n.go(!1) ? createDetailRouteState() : void 0,
        );
      }
    }
    async collapseToHome() {
      if (this.canUseHotkeyWindow()) {
        if (this.configuredHotkeyWindowHotkey == null) {
          await this.getHotkeyWindowController()?.openDetailRoute(n.go(!1), createDetailRouteState());
          return;
        }
        await this.getHotkeyWindowController()?.collapseToHome();
      }
    }
    dismiss() {
      this.getHotkeyWindowController()?.hideAll();
    }
    async setHotkey(e) {
      let t = this.setHotkeyWindowHotkey(e);
      return (
        t.success &&
          (await n.Tt({
            commandId: `hotkeyWindow`,
            update: e == null ? { type: `clear` } : { type: `set`, accelerator: e },
          })),
        t
      );
    }
    setDevOverrideEnabled(e) {
      return this.setHotkeyWindowDevHotkeyOverride(e);
    }
    syncCommandKeybinding(e) {
      (e != null && e !== this.configuredHotkeyWindowHotkey && YV(e),
        (this.configuredHotkeyWindowHotkey = e),
        this.globalState.set(`hotkeyWindowHotkey`, e ?? void 0),
        this.applyLifecycleWithWarning(`command-keybinding-sync`));
    }
    dispose() {
      ((this.isDisposed = !0), this.deactivateLifecycle());
    }
    hide() {
      this.getHotkeyWindowController()?.hideAll();
    }
    ensureHotkeyWindowController() {
      return (
        (this.hotkeyWindowController ??= new Sat(
          this.windowManager,
          this.globalState,
          () => this.configuredHotkeyWindowHotkey != null,
        )),
        this.hotkeyWindowController
      );
    }
    isHotkeyWindowEffectivelyEnabled() {
      return (
        !this.isDisposed &&
        this.isHotkeyWindowGateEnabled &&
        this.configuredHotkeyWindowHotkey != null &&
        (!this.isDevMode || this.devHotkeyWindowHotkeyOverrideEnabled)
      );
    }
    canUseHotkeyWindow() {
      return (
        !this.isDisposed &&
        this.isHotkeyWindowGateEnabled &&
        (this.configuredHotkeyWindowHotkey == null || this.isHotkeyWindowActive)
      );
    }
    getHotkeyWindowHotkeyState() {
      return {
        supported: !0,
        configuredHotkey: this.configuredHotkeyWindowHotkey,
        isGateEnabled: this.isHotkeyWindowGateEnabled,
        isDevMode: this.isDevMode,
        isDevOverrideEnabled: this.devHotkeyWindowHotkeyOverrideEnabled,
        isActive: this.isHotkeyWindowActive,
      };
    }
    createHotkeyWindowMutationFailure(e) {
      return { success: !1, error: e, state: this.getHotkeyWindowHotkeyState() };
    }
    handleHotkeyWindowHotkeyPressed() {
      this.isHotkeyWindowActive &&
        this.ensureHotkeyWindowController()
          .toggleHotkey()
          .then((e) => {
            e == null ||
              e.isDestroyed() ||
              this.onAppEntrySource?.({ channel: `shortcut`, source: `shortcut` }, e.webContents);
          });
    }
    registerHotkeyWindowHotkeyOrThrow(e, t) {
      if (this.registeredHotkeyWindowHotkey === e) return;
      let n = this.registeredHotkeyWindowHotkey,
        r = qV(
          e,
          {
            onPressed: () => {
              this.handleHotkeyWindowHotkeyPressed();
            },
          },
          { ownership: t },
        );
      if (r == null) throw Error(`Unable to register hotkey window hotkey: ${e}`);
      (n != null && this.registeredHotkeyWindowHotkeyRegistration?.unregister(),
        (this.registeredHotkeyWindowHotkey = e),
        (this.registeredHotkeyWindowHotkeyRegistration = r));
    }
    unregisterHotkeyWindowHotkey() {
      this.registeredHotkeyWindowHotkey &&
        (this.registeredHotkeyWindowHotkeyRegistration?.unregister(),
        (this.registeredHotkeyWindowHotkey = null),
        (this.registeredHotkeyWindowHotkeyRegistration = null));
    }
    stopActiveSurface() {
      (this.unregisterHotkeyWindowHotkey(),
        this.hotkeyWindowController?.dispose(),
        (this.hotkeyWindowController = null),
        (this.isHotkeyWindowActive = !1));
    }
    deactivateLifecycle() {
      (this.clearLifecycleRetry(), this.stopActiveSurface(), this.releaseOwnershipLock());
    }
    releaseOwnershipLock() {
      (this.ownershipLock?.dispose(), (this.ownershipLock = null));
    }
    ensureOwnershipLock() {
      return (
        (this.ownershipLock ??= jN({
          force: this.devHotkeyWindowHotkeyOverrideEnabled,
          name: AN.hotkeyWindow,
          onLost: () => {
            ((this.ownershipLock = null), this.stopActiveSurface(), this.scheduleLifecycleRetry());
          },
        })),
        this.ownershipLock
      );
    }
    scheduleLifecycleRetry() {
      this.lifecycleRetry == null &&
        this.isHotkeyWindowEffectivelyEnabled() &&
        ((this.lifecycleRetry = setTimeout(() => {
          ((this.lifecycleRetry = null), this.applyLifecycleWithWarning(`lifecycle-retry`));
        }, Tat)),
        this.lifecycleRetry.unref?.());
    }
    clearLifecycleRetry() {
      this.lifecycleRetry != null &&
        (clearTimeout(this.lifecycleRetry), (this.lifecycleRetry = null));
    }
    applyLifecycleOrThrow() {
      if (!this.isHotkeyWindowEffectivelyEnabled()) {
        this.deactivateLifecycle();
        return;
      }
      if (this.configuredHotkeyWindowHotkey == null)
        throw Error(`Hotkey Window hotkey is not configured.`);
      let e = this.ensureOwnershipLock();
      if (e == null) {
        (this.stopActiveSurface(), this.scheduleLifecycleRetry());
        return;
      }
      if (
        (this.clearLifecycleRetry(),
        this.registerHotkeyWindowHotkeyOrThrow(this.configuredHotkeyWindowHotkey, e),
        (this.isHotkeyWindowActive = !0),
        this.hotkeyWindowController == null)
      ) {
        if (!this.isAppIdle()) {
          this.scheduleLifecycleRetry();
          return;
        }
        this.ensureHotkeyWindowController()
          .prewarm()
          .catch((e) => {
            r.n().warning(`Failed to prewarm the hotkey window`, {
              safe: {},
              sensitive: { error: e },
            });
          });
      }
    }
    applyLifecycleWithWarning(e) {
      try {
        this.applyLifecycleOrThrow();
      } catch (t) {
        (e !== `lifecycle-retry` &&
          r
            .n()
            .warning(`Failed to apply hotkey window runtime state`, {
              safe: { reason: e },
              sensitive: { error: t },
            }),
          this.stopActiveSurface(),
          this.releaseOwnershipLock(),
          this.scheduleLifecycleRetry());
      }
    }
    setGateEnabled(e) {
      this.isHotkeyWindowGateEnabled !== e &&
        ((this.isHotkeyWindowGateEnabled = e), this.applyLifecycleWithWarning(`gate-change`));
    }
    setHotkeyWindowHotkey(e) {
      if (e != null) {
        let t = JV(e);
        if (t != null) return this.createHotkeyWindowMutationFailure(t);
        YV(e);
      }
      let t = this.configuredHotkeyWindowHotkey;
      this.configuredHotkeyWindowHotkey = e;
      try {
        this.applyLifecycleOrThrow();
      } catch (e) {
        return (
          (this.configuredHotkeyWindowHotkey = t),
          this.applyLifecycleWithWarning(`hotkey-rollback`),
          this.createHotkeyWindowMutationFailure(e instanceof Error ? e.message : String(e))
        );
      }
      return (
        this.globalState.set(`hotkeyWindowHotkey`, this.configuredHotkeyWindowHotkey ?? void 0),
        { success: !0, state: this.getHotkeyWindowHotkeyState() }
      );
    }
    setHotkeyWindowDevHotkeyOverride(e) {
      if (!this.isDevMode)
        return this.createHotkeyWindowMutationFailure(
          `Dev override is only available in unpackaged builds.`,
        );
      if (this.devHotkeyWindowHotkeyOverrideEnabled === e)
        return { success: !0, state: this.getHotkeyWindowHotkeyState() };
      let t = this.devHotkeyWindowHotkeyOverrideEnabled;
      this.devHotkeyWindowHotkeyOverrideEnabled = e;
      try {
        this.applyLifecycleOrThrow();
      } catch (e) {
        return (
          (this.devHotkeyWindowHotkeyOverrideEnabled = t),
          this.applyLifecycleWithWarning(`dev-override-rollback`),
          this.createHotkeyWindowMutationFailure(e instanceof Error ? e.message : String(e))
        );
      }
      return { success: !0, state: this.getHotkeyWindowHotkeyState() };
    }
    getHotkeyWindowController() {
      return this.hotkeyWindowController;
    }
  };
}

if (typeof module !== "undefined") module.exports = { createHotkeyWindowLifecycleManagerClass };
