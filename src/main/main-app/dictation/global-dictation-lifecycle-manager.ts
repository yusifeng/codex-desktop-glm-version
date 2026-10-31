// @ts-nocheck

/** Creates the stateful global-dictation hotkey/session lifecycle controller. */
export function createGlobalDictationLifecycleManagerClass(dependencies: Record<string, any>) {
  const {
    WindowController: sat,
    shared: n,
    validateGlobalDictationHotkey: QV,
    getCommandBinding: cH,
    resolveConfiguredHotkey: dH,
    isSupported: W7,
    requestAccessibilityPermission: G7,
    isGlobalDictationMessage: fat,
    getClipboardFingerprint: B7,
    ensureGlobalDictationPermissions: XV,
    acquireCrossInstanceLock: jN,
    crossInstanceLocks: AN,
    registerGlobalHotkey: qV,
    watchGlobalDictationRelease: $V,
    isBareModifierHotkey: IV,
    random: _,
    logger: r,
    pasteGlobalDictation: nat,
    appendGlobalDictationHistory: L$e,
  } = dependencies;
  const lat = 150;
  const U7 = 250;
  const uat = 400;

  return class {
    options;
    isGateEnabled = !1;
    forceGlobalDictationLock;
    configuredHotkey;
    configuredToggleHotkey;
    registeredHotkey = null;
    registeredHotkeyRegistration = null;
    registeredToggleHotkey = null;
    registeredToggleHotkeyRegistration = null;
    activeSession = null;
    escapeRegistration = null;
    pendingHotkeyStartGeneration = null;
    disposeInAppSessionListeners = null;
    clipboardFingerprintAtStop;
    pendingPasteSessionId = null;
    pendingPasteAbort = null;
    holdHotkeyPressedAtMs;
    holdHotkeyGeneration = 0;
    lastToggleTapAtMs;
    toggleHotkeyPressedAtMs;
    toggleHotkeyStopsSession = !1;
    toggleHotkeyReleaseWatcher = null;
    activeHotkeyReleaseWatcher = null;
    pendingInAppDictationStart = null;
    lifecycleLock = null;
    nativePetRendererWebContentsIds = new Set();
    windowController;
    hotkeyController = {
      getState: () => this.getHotkeyState(),
      setHotkey: (e) => this.setHotkey(e),
      setToggleHotkey: (e) => this.setToggleHotkey(e),
      syncCommandKeybindings: (e) => {
        this.syncCommandKeybindings(e);
      },
    };
    constructor(e) {
      ((this.options = e),
        (this.windowController = new sat(e.windowManager)),
        (this.forceGlobalDictationLock =
          e.canForceGlobalDictationLock === !0 &&
          (e.forceGlobalDictationLock === !0 ||
            e.globalState.get(n.iu.GLOBAL_DICTATION_FORCE_LOCK_DEBUG_ENABLED) === !0)));
      let t = e.globalState.get(`globalDictationHotkey`),
        r = t != null && QV(t) == null ? t : null,
        i = e.globalState.get(`globalDictationToggleHotkey`),
        a = i != null && QV(i) == null ? i : null,
        o = cH(`globalDictationHold`),
        s = cH(`globalDictationToggle`);
      ((this.configuredHotkey = dH({ keymapHotkey: o, legacyHotkey: r })),
        (this.configuredToggleHotkey = dH({ keymapHotkey: s, legacyHotkey: a })),
        o.hasBinding && e.globalState.set(`globalDictationHotkey`, this.configuredHotkey ?? void 0),
        s.hasBinding &&
          e.globalState.set(`globalDictationToggleHotkey`, this.configuredToggleHotkey ?? void 0),
        this.applyLifecycleWithWarning(`startup`));
    }
    getHotkeyController() {
      return this.hotkeyController;
    }
    async handleMessage(e, t) {
      if (!fat(t)) return !1;
      if (t.type === `global-dictation-enabled-changed`)
        return (this.setGateEnabled(t.enabled), !0);
      if (t.type === `global-dictation-force-lock-changed`)
        return (this.setForceGlobalDictationLock(t.enabled), !0);
      if (t.type === `global-dictation-pet-renderer-ready`)
        return (this.setNativePetRendererReady(e.sender.id, t.ready), !0);
      if (t.type === `global-dictation-renderer-ready`)
        return (this.windowController.setRendererReady(e.sender.id), !0);
      if (!this.isGateEnabled) return !0;
      let n = this.activeSession,
        r = n?.id ?? null;
      switch (t.type) {
        case `global-dictation-pointer-interaction-changed`:
          return (this.windowController.setPointerInteractive(e.sender.id, t.isInteractive), !0);
        case `global-dictation-stop-requested`:
          return (
            t.sessionId === r &&
              (n?.type === `overlay` || (n?.type === `pet` && n.webContentsId === e.sender.id)) &&
              this.stopRecording(t.sessionId),
            !0
          );
        case `global-dictation-recording-stopped`:
          return (
            n != null &&
              t.sessionId === n.id &&
              ((n.stopRequested = !0),
              n?.type !== `inApp` &&
                (this.clipboardFingerprintAtStop = this.clipboardFingerprintAtStop ?? B7()),
              n?.type === `overlay` && (n.recordingStoppedAtMs = Date.now())),
            !0
          );
        case `global-dictation-dismiss`:
          return (
            n != null &&
              t.sessionId === n.id &&
              (n.type === `overlay` || n.webContentsId === e.sender.id) &&
              (this.clearActiveSession(), this.showIdleOrHide()),
            !0
          );
        case `global-dictation-close`:
          return (
            t.sessionId === r &&
              (this.cancelPendingPaste(), this.clearActiveSession(), this.windowController.close()),
            !0
          );
        case `global-dictation-completed`:
          return (t.sessionId === r && (await this.handleTranscript(t.sessionId, t.text)), !0);
        case `global-dictation-record-history-item`:
          return (this.recordHistoryText((0, _.randomUUID)(), t.text), !0);
        case `global-dictation-failed`:
          return t.sessionId === r
            ? t.stage === `transcription`
              ? (n?.type === `overlay` && this.windowController.showRecovery(), !0)
              : (this.clearActiveSession(), this.showIdleOrHide(), !0)
            : !0;
        case `global-dictation-in-app-started`:
          return (
            t.sessionId === this.pendingInAppDictationStart?.sessionId &&
              n?.type === `inApp` &&
              n.webContentsId === e.sender.id &&
              this.pendingInAppDictationStart.complete(!0),
            !0
          );
      }
    }
    dispose() {
      this.deactivateLifecycle();
    }
    getHotkeyState() {
      let e = W7() && this.isGateEnabled;
      return {
        supported: e,
        configuredHotkey: e ? this.configuredHotkey : null,
        configuredToggleHotkey: e ? this.configuredToggleHotkey : null,
      };
    }
    setHotkey(e) {
      return this.setHotkeyForMode(`hold`, e);
    }
    setToggleHotkey(e) {
      return this.setHotkeyForMode(`toggle`, e);
    }
    setHotkeyForMode(e, t) {
      if (!W7() || !this.isGateEnabled) return this.createMutationFailure(`Not supported.`);
      if (t != null) {
        let e = QV(t);
        if (e != null) return this.createMutationFailure(e);
        (XV(t), G7());
      }
      let n = this.configuredHotkey,
        r = this.configuredToggleHotkey;
      e === `hold` ? (this.configuredHotkey = t) : (this.configuredToggleHotkey = t);
      try {
        this.applyLifecycleOrThrow();
      } catch (e) {
        return (
          (this.configuredHotkey = n),
          (this.configuredToggleHotkey = r),
          this.applyLifecycleWithWarning(`hotkey-rollback`),
          this.createMutationFailure(e instanceof Error ? e.message : String(e))
        );
      }
      return (
        this.options.globalState.set(`globalDictationHotkey`, this.configuredHotkey ?? void 0),
        this.options.globalState.set(
          `globalDictationToggleHotkey`,
          this.configuredToggleHotkey ?? void 0,
        ),
        { success: !0, state: this.getHotkeyState() }
      );
    }
    createMutationFailure(e) {
      return { success: !1, error: e, state: this.getHotkeyState() };
    }
    applyLifecycleOrThrow() {
      if (!this.isGateEnabled || !W7()) {
        this.deactivateLifecycle();
        return;
      }
      if (this.configuredHotkey == null && this.configuredToggleHotkey == null) {
        this.deactivateLifecycle();
        return;
      }
      let e = this.ensureLifecycleLock();
      if (e == null)
        throw Error(`Global dictation is already active in another instance of ChatGPT.`);
      ((this.registeredToggleHotkey !== this.configuredToggleHotkey || this.hasSharedHotkey()) &&
        this.unregisterToggleHotkey(),
        this.configuredHotkey == null
          ? this.unregisterHotkey()
          : this.registerHotkeyOrThrow(this.configuredHotkey, e),
        this.configuredToggleHotkey == null || this.hasSharedHotkey()
          ? this.unregisterToggleHotkey()
          : this.registerToggleHotkeyOrThrow(this.configuredToggleHotkey, e),
        this.ensureHotkeyReleaseWatchers(),
        this.updateEscapeRegistration(),
        this.windowController.prewarm());
    }
    applyLifecycleWithWarning(e) {
      try {
        this.applyLifecycleOrThrow();
      } catch (t) {
        (r
          .n()
          .warning(`Failed to apply global dictation runtime state`, {
            safe: { reason: e },
            sensitive: { error: t },
          }),
          this.deactivateLifecycle());
      }
    }
    setGateEnabled(e) {
      this.isGateEnabled !== e &&
        ((this.isGateEnabled = e), this.applyLifecycleWithWarning(`gate-change`));
    }
    setForceGlobalDictationLock(e) {
      let t = this.options.canForceGlobalDictationLock === !0 && e;
      this.forceGlobalDictationLock !== t &&
        ((this.forceGlobalDictationLock = t),
        t || this.releaseLifecycleLock(),
        this.applyLifecycleWithWarning(`force-lock-change`));
    }
    syncCommandKeybindings({ holdHotkey: e, toggleHotkey: t }) {
      let n =
        e != null && e !== this.configuredHotkey
          ? e
          : t != null && t !== this.configuredToggleHotkey
            ? t
            : null;
      (n != null && (XV(n), G7()),
        this.options.globalState.set(`globalDictationHotkey`, e ?? void 0),
        this.options.globalState.set(`globalDictationToggleHotkey`, t ?? void 0),
        this.syncConfiguredHotkeys({ holdHotkey: e, toggleHotkey: t }));
    }
    syncConfiguredHotkeys({ holdHotkey: e, toggleHotkey: t }) {
      ((this.configuredHotkey = e),
        (this.configuredToggleHotkey = t),
        this.applyLifecycleWithWarning(`command-keybinding-sync`));
    }
    deactivateLifecycle() {
      ((this.holdHotkeyGeneration += 1),
        (this.pendingHotkeyStartGeneration = null),
        this.cancelPendingPaste(),
        this.releaseLifecycleLock(),
        this.activeSession != null && this.stopRecording(this.activeSession.id),
        this.pendingInAppDictationStart?.complete(!1),
        this.clearActiveSession(),
        this.windowController.close());
    }
    ensureLifecycleLock() {
      return (
        (this.lifecycleLock ??= jN({
          force: this.forceGlobalDictationLock,
          name: AN.globalDictation,
          onLost: () => {
            ((this.lifecycleLock = null), this.deactivateLifecycle());
          },
        })),
        this.lifecycleLock
      );
    }
    releaseLifecycleLock() {
      (this.unregisterHotkey(),
        this.unregisterToggleHotkey(),
        this.escapeRegistration?.unregister(),
        (this.escapeRegistration = null),
        this.lifecycleLock?.dispose(),
        (this.lifecycleLock = null));
    }
    registerHotkeyOrThrow(e, t) {
      if (this.registeredHotkey === e) return;
      let n = this.registeredHotkey,
        r = qV(
          e,
          {
            onPressed: () => {
              this.handleHoldHotkeyPressed();
            },
            onReleased: () => {
              this.handleHoldHotkeyReleased();
            },
            onCancelled: () => {
              let e = this.holdHotkeyGeneration;
              ((this.holdHotkeyGeneration += 1),
                (this.holdHotkeyPressedAtMs = void 0),
                (this.lastToggleTapAtMs = void 0),
                (this.pendingHotkeyStartGeneration = null),
                this.updateEscapeRegistration(),
                this.activeSession?.mode === `hold` &&
                  this.activeSession.holdHotkeyGeneration === e &&
                  (this.stopRecording(this.activeSession.id, !0),
                  this.clearActiveSession(),
                  this.showIdleOrHide()));
            },
          },
          { ownership: t, bareModifierTrigger: `cancellablePress` },
        );
      if (r == null) throw Error(`Unable to register global dictation hotkey: ${e}`);
      (n != null && this.unregisterHotkey(),
        (this.registeredHotkey = e),
        (this.registeredHotkeyRegistration = r));
    }
    unregisterHotkey() {
      this.registeredHotkey != null &&
        (this.activeHotkeyReleaseWatcher?.dispose(),
        (this.activeHotkeyReleaseWatcher = null),
        this.registeredHotkeyRegistration?.unregister(),
        (this.registeredHotkey = null),
        (this.registeredHotkeyRegistration = null),
        (this.holdHotkeyGeneration += 1),
        (this.holdHotkeyPressedAtMs = void 0),
        (this.lastToggleTapAtMs = void 0),
        (this.pendingHotkeyStartGeneration = null),
        this.updateEscapeRegistration(),
        this.activeSession?.mode === `hold` && this.stopRecording(this.activeSession.id));
    }
    registerToggleHotkeyOrThrow(e, t) {
      if (this.registeredToggleHotkey === e) return;
      let n = this.registeredToggleHotkey,
        r = qV(
          e,
          {
            onPressed: () => {
              this.handleTogglePress();
            },
            onReleased: () => this.handleToggleRelease(),
            onCancelled: () => {
              ((this.toggleHotkeyPressedAtMs = void 0), (this.lastToggleTapAtMs = void 0));
            },
          },
          { bareModifierTrigger: `cancellablePress`, ownership: t },
        );
      if (r == null) throw Error(`Unable to register global dictation toggle hotkey: ${e}`);
      (n != null && this.registeredToggleHotkeyRegistration?.unregister(),
        (this.registeredToggleHotkey = e),
        (this.registeredToggleHotkeyRegistration = r));
    }
    unregisterToggleHotkey() {
      this.registeredToggleHotkey != null &&
        (this.registeredToggleHotkeyRegistration?.unregister(),
        (this.registeredToggleHotkey = null),
        (this.registeredToggleHotkeyRegistration = null),
        this.toggleHotkeyReleaseWatcher?.dispose(),
        (this.toggleHotkeyReleaseWatcher = null),
        (this.toggleHotkeyPressedAtMs = void 0),
        (this.lastToggleTapAtMs = void 0));
    }
    ensureHotkeyReleaseWatchers() {
      (this.registeredHotkey != null &&
        this.registeredHotkeyRegistration?.handlesRelease === !1 &&
        !this.activeHotkeyReleaseWatcher?.isActive &&
        (this.activeHotkeyReleaseWatcher?.dispose(),
        (this.activeHotkeyReleaseWatcher = $V(this.registeredHotkey, () =>
          this.handleHoldHotkeyReleased(),
        ))),
        this.registeredToggleHotkey != null &&
          this.registeredToggleHotkeyRegistration?.handlesRelease === !1 &&
          !this.toggleHotkeyReleaseWatcher?.isActive &&
          (this.toggleHotkeyReleaseWatcher?.dispose(),
          (this.toggleHotkeyReleaseWatcher = $V(this.registeredToggleHotkey, () =>
            this.handleToggleRelease(),
          ))));
    }
    async handleHoldHotkeyPressed() {
      if ((this.ensureHotkeyReleaseWatchers(), this.holdHotkeyPressedAtMs != null)) return;
      if (this.activeSession != null) {
        ((this.holdHotkeyPressedAtMs = Date.now()),
          this.hasSharedHotkey() &&
            this.activeSession.mode === `toggle` &&
            this.stopRecording(this.activeSession.id));
        return;
      }
      let e = ++this.holdHotkeyGeneration;
      ((this.holdHotkeyPressedAtMs = Date.now()),
        (this.pendingHotkeyStartGeneration = e),
        this.updateEscapeRegistration());
      try {
        let t = this.windowController.getFocusedInAppWindow();
        if (
          ((this.hasSharedHotkey() ||
            (t != null && this.registeredHotkey != null && IV(this.registeredHotkey))) &&
            (await new Promise((e) => setTimeout(e, U7)), e !== this.holdHotkeyGeneration)) ||
          ((this.lastToggleTapAtMs = void 0),
          t != null && (await this.tryStartInAppSession(t, `hold`)))
        )
          return;
        e === this.holdHotkeyGeneration && (await this.startSession(`hold`));
      } finally {
        (this.pendingHotkeyStartGeneration === e && (this.pendingHotkeyStartGeneration = null),
          this.updateEscapeRegistration());
      }
    }
    handleTogglePress() {
      (this.ensureHotkeyReleaseWatchers(),
        this.toggleHotkeyPressedAtMs ??
          ((this.toggleHotkeyPressedAtMs = Date.now()),
          (this.toggleHotkeyStopsSession =
            this.activeSession != null || this.pendingHotkeyStartGeneration != null),
          this.activeSession?.mode === `toggle`
            ? this.stopRecording(this.activeSession.id)
            : this.activeSession == null &&
              this.toggleHotkeyStopsSession &&
              this.cancelDictation()));
    }
    handleToggleRelease() {
      let e = this.toggleHotkeyPressedAtMs;
      ((this.toggleHotkeyPressedAtMs = void 0),
        e != null && !this.toggleHotkeyStopsSession && this.handleToggleTap(e));
    }
    handleToggleTap(e) {
      let t = Date.now(),
        n = this.lastToggleTapAtMs;
      ((this.lastToggleTapAtMs = void 0),
        !(t - e >= U7) &&
          (n != null && t - n <= uat
            ? this.handleToggleHotkeyPressed()
            : (this.lastToggleTapAtMs = t)));
    }
    async handleToggleHotkeyPressed() {
      let e = this.activeSession;
      if (e != null) {
        e.mode === `toggle` && this.stopRecording(e.id);
        return;
      }
      let t = ++this.holdHotkeyGeneration;
      ((this.pendingHotkeyStartGeneration = t), this.updateEscapeRegistration());
      try {
        let e = this.windowController.getFocusedInAppWindow();
        if (e != null && (await this.tryStartInAppSession(e, `toggle`))) return;
        t === this.holdHotkeyGeneration && (await this.startSession(`toggle`));
      } finally {
        (this.pendingHotkeyStartGeneration === t && (this.pendingHotkeyStartGeneration = null),
          this.updateEscapeRegistration());
      }
    }
    async startSession(e) {
      if (this.activeSession != null) return;
      let t = (0, _.randomUUID)();
      this.cancelPendingPaste();
      let n = e === `hold` ? this.holdHotkeyPressedAtMs : void 0,
        i = this.getVisibleNativePetWebContents();
      if (i != null) {
        ((this.activeSession = {
          type: `pet`,
          id: t,
          webContentsId: i.id,
          mode: e,
          holdHotkeyGeneration: e === `hold` ? this.holdHotkeyGeneration : void 0,
        }),
          this.windowController.hide(),
          this.options.windowManager.sendMessageToWebContents(i, {
            type: `global-dictation-start`,
            sessionId: t,
            startGesture: e === `hold` ? `press-and-hold` : `tap`,
            activationStartedAtMs: n,
          }));
        return;
      }
      this.activeSession = {
        type: `overlay`,
        id: t,
        mode: e,
        holdHotkeyGeneration: e === `hold` ? this.holdHotkeyGeneration : void 0,
        isStarting: !0,
      };
      try {
        if (
          !(await this.windowController.showAndStart(
            t,
            e === `hold` ? `press-and-hold` : `tap`,
            () => this.activeSession?.id === t,
            n,
          ))
        ) {
          if (this.activeSession?.id !== t) return;
          this.clearActiveSession();
          return;
        }
        if (this.activeSession?.id !== t) return;
        this.activeSession.isStarting = !1;
      } catch (e) {
        if (this.activeSession?.id !== t) return;
        (this.clearActiveSession(),
          r
            .n()
            .warning(`Failed to open global dictation window`, {
              safe: {},
              sensitive: { error: e },
            }));
      }
    }
    async tryStartInAppSession(e, t) {
      let n = (0, _.randomUUID)();
      (this.cancelPendingPaste(),
        (this.activeSession = {
          type: `inApp`,
          id: n,
          webContentsId: e.webContents.id,
          mode: t,
          holdHotkeyGeneration: t === `hold` ? this.holdHotkeyGeneration : void 0,
        }));
      let r = () => {
          this.activeSession?.id === n && this.cancelDictation();
        },
        i = (e) => {
          e.isMainFrame && !e.isSameDocument && r();
        };
      return (
        e.webContents.on(`did-start-navigation`, i),
        e.webContents.once(`destroyed`, r),
        e.webContents.once(`render-process-gone`, r),
        (this.disposeInAppSessionListeners = () => {
          (e.webContents.removeListener(`did-start-navigation`, i),
            e.webContents.removeListener(`destroyed`, r),
            e.webContents.removeListener(`render-process-gone`, r));
        }),
        this.options.windowManager.sendMessageToWebContents(e.webContents, {
          type: `global-dictation-in-app-start`,
          sessionId: n,
          startGesture: t === `hold` ? `press-and-hold` : `tap`,
        }),
        (await this.waitForInAppDictationStart(n))
          ? this.activeSession?.id === n
          : (this.activeSession?.id === n && this.clearActiveSession(), !1)
      );
    }
    waitForInAppDictationStart(e) {
      return (
        this.pendingInAppDictationStart?.complete(!1),
        new Promise((t) => {
          let n = setTimeout(() => r.complete(!1), lat),
            r = {
              sessionId: e,
              complete: (r) => {
                (this.pendingInAppDictationStart?.sessionId === e &&
                  (this.pendingInAppDictationStart = null),
                  clearTimeout(n),
                  t(r));
              },
            };
          this.pendingInAppDictationStart = r;
        })
      );
    }
    stopRecording(e, t) {
      if (this.activeSession?.id !== e || (this.activeSession.stopRequested && !t)) return;
      if (
        ((this.activeSession.stopRequested = !0),
        this.activeSession.type === `overlay` && this.activeSession.isStarting)
      ) {
        (this.clearActiveSession(), this.showIdleOrHide());
        return;
      }
      this.activeSession.type !== `inApp` &&
        (this.clipboardFingerprintAtStop = this.clipboardFingerprintAtStop ?? B7());
      let n = this.activeSession;
      if (n?.type === `inApp`) {
        (this.options.windowManager.sendMessageToWebContentsId(n.webContentsId, {
          type: `global-dictation-in-app-stop`,
          sessionId: e,
          cancel: t,
        }),
          t && this.clearActiveSession());
        return;
      }
      if (n?.type === `pet`) {
        this.options.windowManager.sendMessageToWebContentsId(n.webContentsId, {
          type: `global-dictation-stop`,
          sessionId: e,
          cancel: t,
        });
        return;
      }
      this.windowController.sendStop(e, t);
    }
    handleHoldHotkeyReleased() {
      let e = this.holdHotkeyPressedAtMs;
      if (e == null) return;
      let t = this.pendingHotkeyStartGeneration != null;
      ((this.holdHotkeyGeneration += 1),
        (this.holdHotkeyPressedAtMs = void 0),
        (this.pendingHotkeyStartGeneration = null),
        this.updateEscapeRegistration(),
        this.activeSession?.mode === `hold`
          ? this.stopRecording(this.activeSession.id)
          : t && this.hasSharedHotkey() && this.activeSession == null && this.handleToggleTap(e));
    }
    cancelPendingPaste() {
      (this.pendingPasteAbort?.abort(),
        (this.pendingPasteAbort = null),
        (this.pendingPasteSessionId = null),
        this.updateEscapeRegistration());
    }
    updateEscapeRegistration() {
      if (
        this.pendingHotkeyStartGeneration == null &&
        this.activeSession == null &&
        this.pendingPasteSessionId == null
      ) {
        (this.escapeRegistration?.unregister(), (this.escapeRegistration = null));
        return;
      }
      this.escapeRegistration == null &&
        this.lifecycleLock != null &&
        (this.escapeRegistration = qV(
          `Escape`,
          { onPressed: () => this.cancelDictation() },
          { ownership: this.lifecycleLock },
        ));
    }
    cancelDictation() {
      ((this.holdHotkeyGeneration += 1),
        (this.lastToggleTapAtMs = void 0),
        (this.pendingHotkeyStartGeneration = null),
        this.pendingInAppDictationStart?.complete(!1),
        this.cancelPendingPaste(),
        this.activeSession != null && this.stopRecording(this.activeSession.id, !0),
        this.clearActiveSession(),
        this.showIdleOrHide());
    }
    clearActiveSession() {
      (this.disposeInAppSessionListeners?.(),
        (this.disposeInAppSessionListeners = null),
        this.pendingInAppDictationStart?.sessionId === this.activeSession?.id &&
          this.pendingInAppDictationStart?.complete(!1),
        (this.activeSession = null),
        this.updateEscapeRegistration(),
        (this.clipboardFingerprintAtStop = void 0),
        (this.lastToggleTapAtMs = void 0));
    }
    hasSharedHotkey() {
      return this.configuredHotkey != null && this.configuredHotkey === this.configuredToggleHotkey;
    }
    showIdleOrHide() {
      this.showNativePetIdleIfAvailable() || this.windowController.hide();
    }
    showNativePetIdleIfAvailable() {
      let e = this.getVisibleNativePetWebContents();
      return (
        e != null &&
        (this.options.windowManager.sendMessageToWebContents(e, {
          type: `global-dictation-idle`,
          configuredHotkey: this.configuredHotkey,
          configuredToggleHotkey: this.configuredToggleHotkey,
        }),
        this.windowController.hide(),
        !0)
      );
    }
    setNativePetRendererReady(e, t) {
      (t
        ? this.nativePetRendererWebContentsIds.add(e)
        : this.nativePetRendererWebContentsIds.delete(e),
        this.activeSession ?? this.showIdleOrHide());
    }
    getVisibleNativePetWebContents() {
      let e = this.options.getVisibleNativePetWebContents?.() ?? null;
      return e != null && this.nativePetRendererWebContentsIds.has(e.id) ? e : null;
    }
    async handleTranscript(e, t) {
      let n =
          this.activeSession?.type === `overlay` ? this.activeSession.recordingStoppedAtMs : void 0,
        r = this.clipboardFingerprintAtStop,
        i = this.recordHistoryText(e, t),
        a = new AbortController();
      if (
        (i != null && ((this.pendingPasteSessionId = e), (this.pendingPasteAbort = a)),
        this.clearActiveSession(),
        this.showIdleOrHide(),
        i == null)
      )
        return;
      let o = await nat(`${i} `, n, r, a.signal);
      this.pendingPasteSessionId === e &&
        (o != null &&
          (await this.windowController.showPasteFailure(o, () => this.pendingPasteSessionId === e)),
        this.pendingPasteSessionId === e &&
          ((this.pendingPasteAbort = null),
          (this.pendingPasteSessionId = null),
          this.updateEscapeRegistration()));
    }
    recordHistoryText(e, t) {
      let n = t.trim();
      return n ? (L$e({ id: e, createdAtMs: Date.now(), text: n }), n) : null;
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createGlobalDictationLifecycleManagerClass };
}

