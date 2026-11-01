import { randomUUID } from "node:crypto";
import pathApi from "node:path";

interface ElectronMessageHandlerDependencies {
  shared: any;
  bootstrap: any;
  electron: any;
  crypto: any;
  path: any;
  fsPromises: any;
  perfHooks: any;
  deepEqual: any;
  createLogger: any;
  DynamicAppToolResponses: any;
  ProjectFolderPicker: any;
  BrowserSessionRegistry: any;
  BrowserAutocompleteCoordinator: any;
  BrowserHostManager: any;
  MessageReply: any;
  SamplerController: any;
  PerformanceTriggerGate: any;
  featureFlags: any;
  dependencies: Record<string, any>;
}

function createElectronMessageHandlerClass({
  shared: n,
  bootstrap: a,
  electron: l,
  crypto: _,
  path: h,
  fsPromises: b,
  perfHooks: R,
  deepEqual: G,
  createLogger,
  DynamicAppToolResponses: IT,
  ProjectFolderPicker: iQe,
  BrowserSessionRegistry: cX,
  BrowserAutocompleteCoordinator: bke,
  BrowserHostManager: tQe,
  MessageReply: kZ,
  SamplerController: SQe,
  PerformanceTriggerGate: MinimumIntervalGate,
  featureFlags: Tr,
  dependencies,
}: ElectronMessageHandlerDependencies) {
  const {
    GBe, IH, KBe, LUe, Lr, MainThreadJankSampler, Mze, OZ, Vt, XQe, ZBe,
    applySparseStateWrite, broadcastPersistedAtomUpdate, combinePerformanceSpanSnapshots,
    deletePersistedBrowserConversation, forwardBrowserNavigationUrl, lWe,
    loadFaviconData, performanceHeartbeatIntervalMs, performanceRequestTtlMs, performanceTriggerMinIntervalMs,
    rZe, readHostWorktreeSettings, rt, setRemoteControlEnabled, setRemoteControlSessionActive,
    requestInterceptor, summarizeWindowAttention, tee, toggleTraceRecording,
  } = dependencies;

  var eQ = createLogger(`electron-message-handler`),
  tQ = 560,
  $Qe = 1090,
  e$e = 760,
  nQ = 0.9,
  rQ = `New project`,
  t$e = 1e4;
function n$e(e) {
  return e.mode === `onboarding`
    ? e.onboardingVariant === `v2`
      ? { width: $Qe, height: e$e }
      : { width: tQ, height: tQ }
    : null;
}
class ElectronMessageHandler {
  hostId;
  appServerClient;
  windowManager;
  chunkedMessageSender;
  avatarOverlayManager;
  appServerConnectionRegistry;
  fetchWrapper;
  globalState;
  projectsManager;
  sharedObjectRepository;
  desktopNotificationManager;
  errorReporter;
  desktopSentry;
  updateWorkerSentryUser;
  inboxManager;
  getHostConfigForHostId;
  hasActiveComputerUseTurn;
  settingsStore;
  getPinnedThreadIdsForWorktreeCleanup;
  onAppEntrySource;
  sharedObjectSubscribers = new Map();
  sharedObjectSubscriberOrigins = new WeakSet();
  host;
  primaryWindowRestoreBounds = null;
  primaryWindowMode = null;
  datadogLogger;
  maxLogLevel;
  powerSaveBlockerId = null;
  powerSaveBlockerType = null;
  isSystemSuspended = !1;
  isScreenLocked = !1;
  handleSuspend = () => {
    this.setSystemFocusState(`suspended`, !0, Date.now());
  };
  handleResume = () => {
    this.setSystemFocusState(`suspended`, !1);
  };
  handleScreenLock = () => {
    this.setSystemFocusState(`screen-locked`, !0, Date.now());
  };
  handleScreenUnlock = () => {
    this.setSystemFocusState(`screen-locked`, !1);
  };
  powerSaveBlockingWebContentsIds = new Set();
  displaySleepBlockingWebContentsIds = new Set();
  pluggedInRemoteControlPowerSaveWebContentsIds = new Set();
  powerSaveTrackedWebContentsIds = new Set();
  pendingDynamicToolsForThreadStartRequests = new Map();
  dynamicAppToolResponses = new IT();
  samplerManager;
  projectFolderPicker;
  worktreeServicesByHostId = new Map();
  requestGitWorker;
  subscribeGitWorkerEvent;
  browserSessionRegistry;
  browserHostManager;
  unsubscribeSiteAnnotationSettings;
  browserAutocompleteCoordinator;
  automationSchedulerController = null;
  onBrowserStateChanged = () => {};
  constructor(
    e,
    t,
    r,
    i,
    o,
    s,
    c,
    u,
    d,
    f,
    p,
    m,
    h,
    g,
    _,
    v,
    y,
    b,
    x,
    S,
    C,
    w,
    T = (e) => {
      if (e === this.hostId) return this.host;
      throw Error(`Host config for host ID ${e} not found`);
    },
    E,
    D,
    O,
    k,
  ) {
    ((this.hostId = e),
      (this.appServerClient = r),
      (this.windowManager = i),
      (this.chunkedMessageSender = o),
      (this.avatarOverlayManager = s),
      (this.appServerConnectionRegistry = c),
      (this.fetchWrapper = u),
      (this.globalState = d),
      (this.projectsManager = f),
      (this.sharedObjectRepository = p),
      (this.desktopNotificationManager = h),
      (this.errorReporter = g),
      (this.desktopSentry = _),
      (this.updateWorkerSentryUser = v),
      (this.inboxManager = y),
      (this.getHostConfigForHostId = T),
      (this.hasActiveComputerUseTurn = E),
      (this.settingsStore = D),
      (this.getPinnedThreadIdsForWorktreeCleanup = O),
      (this.onAppEntrySource = k),
      (this.host = t),
      (this.projectFolderPicker = new iQe(t, this.windowManager, this.projectsManager)),
      this.sharedObjectRepository.addSubscriber((e, t) => {
        this.sharedObjectSubscribers.get(e)?.forEach((n, r) => {
          this.sendSharedObjectUpdate(r, e, t);
        });
      }),
      (this.datadogLogger = b),
      (this.maxLogLevel = x),
      (this.requestGitWorker = m),
      (this.subscribeGitWorkerEvent = C),
      l.powerMonitor.on(`on-ac`, () => {
        this.syncPowerSaveBlocker();
      }),
      l.powerMonitor.on(`on-battery`, () => {
        this.syncPowerSaveBlocker();
      }),
      l.powerMonitor.on(`suspend`, this.handleSuspend),
      l.powerMonitor.on(`resume`, this.handleResume),
      l.powerMonitor.on(`lock-screen`, this.handleScreenLock),
      l.powerMonitor.on(`unlock-screen`, this.handleScreenUnlock),
      (this.browserSessionRegistry = new cX(a.on, S, this.errorReporter)),
      (this.browserAutocompleteCoordinator = new bke(
        (e, t) => {
          let n = this.browserHostManager.getBrowserSession();
          if (n == null) throw Error(`In-app browser is unavailable.`);
          return t.surface === `composer`
            ? n.autocomplete.createController(
                Tr().browserExtensions && e?.session === n ? e : void 0,
              )
            : n.autocomplete.createController(e);
        },
        (e, t) =>
          this.browserHostManager.getCurrentPageWebContents(e, t.conversationId, t.browserTabId) ??
          (t.surface === `composer` ? e : null),
        async (e) => {
          let t = this.browserHostManager.getBrowserSession();
          return t == null ? null : loadFaviconData(t.faviconService, e);
        },
      )),
      (this.browserHostManager = new tQe(
        this.windowManager,
        this.errorReporter,
        this.hostId,
        ZBe({ appServerClient: this.getAppServerConnection(this.hostId) }),
        this.browserSessionRegistry,
        void 0,
        {
          appServerNotificationSource: this.getAppServerConnection(this.hostId),
          settingsStore: this.settingsStore,
          getSiteBootstrapToken: rZe(this.getAppServerConnection(this.hostId)),
          browserPersistenceDirectory: l.app.getPath(`userData`),
          isDefaultBrowser: this.isDefaultBrowser.bind(this),
          getCommandKeymapState: () => ({
            ...n.Ct(),
            primaryNumberShortcutTarget: Tr().unifiedTabStrip
              ? this.settingsStore?.getEffective(n.Ia.primaryNumberShortcutTarget.key)
              : void 0,
          }),
          getDownloadDirectory: () =>
            this.settingsStore?.getEffective(n.Ba.downloadDirectory.key) ??
            l.app.getPath(`downloads`),
          getPromptForUserDownloads: () =>
            this.settingsStore?.getEffective(n.Ba.promptForDownloadLocation.key) ?? !1,
          onAppEntrySource: this.onAppEntrySource,
        },
      )),
      this.browserHostManager.setInAppBrowserFeatureEnabled(!1),
      (this.unsubscribeSiteAnnotationSettings = this.settingsStore?.onDidChange(
        n.Ba.disabledSiteAnnotationHostnames.key,
        () => this.browserHostManager.refreshSiteAnnotationFeatures(),
      )),
      (this.samplerManager = new SQe({
        browserSessionRegistry: this.browserSessionRegistry,
        clearInterval: (e) => clearInterval(e),
        combineCpuSnapshots: combinePerformanceSpanSnapshots,
        createId: () => randomUUID(),
        desktopSentry: this.desktopSentry,
        electronSampler: w,
        getAllWindows: () => l.BrowserWindow.getAllWindows(),
        getStdioIoStatsSnapshot: () =>
          this.appServerConnectionRegistry
            .getConnection(this.hostId)
            .getStdioIoStatsSnapshot(),
        heartbeatIntervalMs: performanceHeartbeatIntervalMs,
        hostId: this.hostId,
        jankSampler: new MainThreadJankSampler({
          clearInterval: (e) => clearInterval(e),
          now: () => R.performance.now(),
          powerMonitor: l.powerMonitor,
          setInterval: (e, t) => setInterval(e, t),
        }),
        logger: createLogger(`sampler-manager`),
        now: () => R.performance.now(),
        requestRegistry: new n.Sc({ ttlMs: performanceRequestTtlMs }),
        setInterval: (e, t) => setInterval(e, t),
        summarizeWindowAttention,
        triggerGate: new MinimumIntervalGate({ minIntervalMs: performanceTriggerMinIntervalMs }),
        windowManager: this.windowManager,
      })),
      this.ensureWorktreeService(this.hostId));
  }
  getWorktreeService(e = this.hostId) {
    return this.ensureWorktreeService(e);
  }
  createOrSelectProject(e) {
    return this.projectFolderPicker.createOrSelectProject(e);
  }
  setAutomationSchedulerController(e) {
    this.automationSchedulerController = e;
  }
  setLocalAutomationsCapability(e) {
    this.automationSchedulerController?.setLocalAutomationsCapability(e);
  }
  getBrowserHostManager() {
    return this.browserHostManager;
  }
  isDefaultBrowser() {
    return this.sharedObjectRepository.get(`is_default_browser`) === !0;
  }
  startPerformanceSpanCpuSampling(e, t) {
    this.samplerManager.startPerformanceSpanCpuSampling(e, t);
  }
  cancelPerformanceSpanCpuSampling(e) {
    this.samplerManager.cancelPerformanceSpanCpuSampling(e);
  }
  finishPerformanceSpanCpuSampling(e) {
    return this.samplerManager.finishPerformanceSpanCpuSampling(e);
  }
  getBrowserAutocompleteCoordinator() {
    return this.browserAutocompleteCoordinator;
  }
  deletePersistedBrowserConversation(e, { browserConversationId: t, conversationId: n }) {
    this.browserHostManager.deletePersistedBrowserConversation(e, t) &&
      this.deletePersistedAtomStateKeys(e, [rt(n), tee(n), Vt(n)]);
  }
  getBrowserSessionRegistry() {
    return this.browserSessionRegistry;
  }
  forwardBrowserNavigationUrl(e, t) {
    return OZ({
      appServerConnectionRegistry: this.appServerConnectionRegistry,
      getHostConfigForHostId: this.getHostConfigForHostId,
      hostId: t,
      url: e,
    });
  }
  getBrowserOwnerWebContentsForOrigin(e) {
    let t = l.BrowserWindow.fromWebContents(e);
    return t != null && this.windowManager.getPrimaryWindows().includes(t)
      ? e
      : (this.getPrimaryWindow()?.webContents ?? null);
  }
  getBrowserCommentOverlayOwner(e, t, n) {
    return n == null ? e : (this.windowManager.getBrowserCommentPopupOwner(e, t, n) ?? e);
  }
  setOnBrowserStateChanged(e) {
    ((this.onBrowserStateChanged = e), this.browserHostManager.setOnBrowserStateChanged(e));
  }
  getAppServerConnection(e) {
    return this.appServerConnectionRegistry.getConnection(e);
  }
  ensureWorktreeService(e) {
    let t = this.worktreeServicesByHostId.get(e);
    if (t) return t;
    let n = this.getAppServerConnection(e);
    return (
      (t = new XQe({
        appServerConnection: n,
        desktopNotificationManager: this.desktopNotificationManager,
        globalState: this.globalState,
        getPinnedThreadIds: this.getPinnedThreadIdsForWorktreeCleanup?.bind(null, e),
        settingsStore: this.getSettingsStore(),
        getHostConfigForHostId: this.getHostConfigForHostId,
        getHostWorktreeSettings: () =>
          readHostWorktreeSettings({
            appServerConnection: n,
            globalState: this.globalState,
            isPackaged: l.app.isPackaged,
          }),
        executionHost: e === this.hostId ? this.appServerClient : n,
        assignUnassignedThreadsBeforeProjectRootsChange: (e) =>
          this.projectsManager.assignUnassignedThreadsBeforeProjectRootsChange(e),
        createProjectForRoots: (e, t) => this.projectsManager.createProjectForRoots(e, t),
        hostConfig: this.getHostConfigForHostId(e),
        hostId: e,
        requestGitWorker: this.requestGitWorker,
        setSharedPendingWorktrees: () => {
          this.publishPendingWorktrees();
        },
        subscribeGitWorkerEvent: this.subscribeGitWorkerEvent,
        windowManager: this.windowManager,
      })),
      this.worktreeServicesByHostId.set(e, t),
      this.publishPendingWorktrees(),
      t
    );
  }
  publishPendingWorktrees() {
    this.sharedObjectRepository.set(
      `pending_worktrees`,
      Array.from(this.worktreeServicesByHostId.values()).flatMap((e) => e.getPendingWorktrees()),
    );
  }
  async handleMessage(e, t) {
    if (GBe(t)) {
      await KBe(this.avatarOverlayManager, e, t, (t) => {
        this.windowManager.sendMessageToWebContents(e, t);
      });
      return;
    }
    switch (t.type) {
      case `checkout-webview-presentation-changed`:
        LUe(e, t);
        break;
      case `workspace-settings-webview-presentation-changed`:
        lWe(e, t);
        break;
      case `open-codex-bundle`:
        break;
      case `reload-bundled-plugins`:
        break;
      case `debug-window-origin-conversation-changed`:
        this.windowManager.debugWindowManager?.setOriginConversation(e, t.conversationId);
        break;
      case `debug-window-client-analytics-history-changed`:
        this.windowManager.debugWindowManager?.setClientAnalyticsHistory(e, t.events);
        break;
      case `remote-hosted-pip-host-layout-changed`:
      case `remote-hosted-pip-active-thread-changed`:
        break;
      case `set-telemetry-user`: {
        this.updateWorkerSentryUser(t.authMethod, t.userId, t.email, t.accountId);
        let e = t.authMethod == null ? null : { id: t.userId ?? void 0, authMethod: t.authMethod };
        (this.datadogLogger.setUserInfo(e),
          this.desktopSentry.setUser(
            e == null ? null : { ...e, account_id: t.accountId ?? void 0 },
          ));
        break;
      }
      case `ready`: {
        (this.windowManager.markWebContentsReady(e),
          this.avatarOverlayManager.handleRendererReady(e.id));
        let r = new kZ(e, this.chunkedMessageSender);
        for (let e of this.appServerConnectionRegistry.getAllHostIds()) {
          let t = this.getAppServerConnection(e);
          (t.sendConnectionStateSnapshot(r),
            t.sendInitializationSnapshot(r),
            t.sendRequestUserInputAutoResolutionSnapshot(r));
        }
        (this.sendCustomPrompts(e).catch((e) => {
          this.errorReporter.reportNonFatal(e instanceof Error ? e : n.Zo(e), {
            kind: `send-custom-prompts`,
          });
        }),
          this.sendPersistedAtomState(e, t.persistedStateResponsePriority),
          this.samplerManager.handleRendererReady(e),
          eQ().info(`Handled 'ready' message, sent ide-context-updated`));
        break;
      }
      case `open-in-main-window`:
      case `open-browser-in-main-window`:
      case `open-current-main-window`:
      case `open-in-new-window`:
      case `mac-menu-bar-enabled-changed`:
      case `electron-avatar-overlay-feedback-diagnostics-changed`:
      case `electron-avatar-overlay-restore-ready`:
      case `electron-sparkle-gates-changed`:
      case `electron-desktop-features-changed`:
      case `global-dictation-enabled-changed`:
      case `global-dictation-force-lock-changed`:
      case `global-dictation-pet-renderer-ready`:
      case `global-dictation-renderer-ready`:
      case `global-dictation-stop-requested`:
      case `global-dictation-pointer-interaction-changed`:
      case `global-dictation-recording-stopped`:
      case `global-dictation-dismiss`:
      case `global-dictation-close`:
      case `global-dictation-completed`:
      case `global-dictation-record-history-item`:
      case `global-dictation-in-app-started`:
      case `global-dictation-failed`:
        break;
      case `power-save-blocker-set`:
        this.updatePowerSaveBlocker(
          e,
          t.shouldBlock,
          t.keepRemoteControlAwakeWhilePluggedIn,
          t.preventDisplaySleep,
        );
        break;
      case `local-thread-activity-changed`:
        (setRemoteControlEnabled(t.hasInProgressLocalConversation, e.id),
          setRemoteControlSessionActive(
            t.hasInProgressRegularLocalConversation,
            e.id,
            t.updateResumeState,
          ));
        break;
      case `electron-set-window-mode`:
        this.setPrimaryWindowMode(e, { mode: t.mode, onboardingVariant: t.onboardingVariant });
        break;
      case `inbox-item-set-read-state`:
        if (t.isRead) {
          let e = Date.now();
          this.inboxManager?.markRead(t.id, e);
          break;
        }
        this.inboxManager?.markUnread(t.id);
        break;
      case `inbox-automation-runs-mark-all-read`:
        this.inboxManager?.markAllAutomationRunsRead(t.readAt);
        break;
      case `inbox-items-create`: {
        if (!this.inboxManager) break;
        let e = Date.now(),
          n = t.conversationId || t.turnId || (0, _.randomUUID)(),
          r = t.items.map((r, i) => ({
            id: t.items.length > 1 && !r.id ? `${n}-${i + 1}` : r.id || n,
            automationId: null,
            automationName: null,
            title: r.title ?? null,
            description: r.description ?? null,
            archivedAssistantMessage: null,
            archivedUserMessage: null,
            archivedReason: null,
            sourceCwd: null,
            threadId: t.conversationId ?? null,
            readAt: null,
            createdAt: e,
            status: null,
          }));
        this.inboxManager.persistAndNotify(r);
        break;
      }
      case `archive-thread`:
        this.getAppServerConnection(t.hostId).registerArchiveThread(t.conversationId, {
          cwd: t.cwd,
          cleanupWorktree: t.cleanupWorktree,
        });
        break;
      case `unarchive-thread`:
        this.getAppServerConnection(t.hostId).registerUnarchiveThread(t.conversationId);
        break;
      case `dynamic-tools-for-thread-start-response`:
        this.handleDynamicToolsForThreadStartResponse(e, t);
        break;
      case `persisted-atom-sync-request`:
        this.sendPersistedAtomState(e, t.responsePriority);
        break;
      case `persisted-atom-update`:
        this.updatePersistedAtomState(e, t.key, t.deleted ? void 0 : t.value, t.recordUpdate);
        break;
      case `browser-sidebar-owner-sync`:
        if (
          (eQ().info(`IAB_LIFECYCLE received browser sidebar owner sync`, {
            safe: {
              browserTabId: t.browserTabId ?? null,
              conversationId: t.conversationId,
              originWebContentsId: e.id,
              windowId: l.BrowserWindow.fromWebContents(e)?.id ?? null,
            },
            sensitive: { ownerRoutePath: t.ownerRoutePath },
          }),
          this.getBrowserOwnerWebContentsForOrigin(e) !== e)
        ) {
          eQ().warning(`IAB_LIFECYCLE ignored browser sidebar owner sync from auxiliary window`, {
            safe: {
              conversationId: t.conversationId,
              originWebContentsId: e.id,
              windowId: l.BrowserWindow.fromWebContents(e)?.id ?? null,
            },
            sensitive: {},
          });
          break;
        }
        (this.browserHostManager.syncOwner(
          e,
          t.conversationId,
          t.browserTabId,
          t.ownerRoutePath,
          t.annotationModeEnabled,
          t.sessionConversationId,
          t.presentedBrowserTabIds,
        ),
          this.onBrowserStateChanged());
        break;
      case `browser-sidebar-sync`:
        (this.browserHostManager.sync(e, t.payload), this.onBrowserStateChanged());
        break;
      case `browser-settings-webview-mounted`:
        this.browserHostManager.browserSettingsWebviewMounted(e, t.mountId, t.themeVariant);
        break;
      case `browser-settings-webview-theme-changed`:
        this.browserHostManager.browserSettingsWebviewThemeChanged(e, t.themeVariant);
        break;
      case `browser-settings-webview-unmounted`:
        this.browserHostManager.browserSettingsWebviewUnmounted(e, t.mountId);
        break;
      case `browser-sidebar-webview-destroyed`:
        (this.browserHostManager.browserWebviewDestroyed(
          e,
          t.conversationId,
          t.browserTabId,
          t.teardownId,
        ),
          this.onBrowserStateChanged());
        break;
      case `browser-use-session-route-capture`: {
        let n = this.getBrowserOwnerWebContentsForOrigin(e);
        if (
          (eQ().info(`IAB_LIFECYCLE received browser use session route capture`, {
            safe: {
              conversationId: t.conversationId,
              disposeAfterSessionActivity: t.disposeAfterSessionActivity ?? !1,
              originWebContentsId: e.id,
              ownerWebContentsId: n?.id ?? null,
              windowId: l.BrowserWindow.fromWebContents(e)?.id ?? null,
            },
            sensitive: {},
          }),
          n == null)
        ) {
          eQ().warning(
            `IAB_LIFECYCLE ignored browser use session route capture without primary window`,
            {
              safe: { conversationId: t.conversationId, originWebContentsId: e.id },
              sensitive: {},
            },
          );
          break;
        }
        this.browserSessionRegistry.captureSessionRoute({
          browserConversationId: t.browserConversationId,
          conversationId: t.conversationId,
          disposeAfterSessionActivity: t.disposeAfterSessionActivity,
          owner: n,
        });
        break;
      }
      case `browser-use-session-activity-ended`:
        this.browserSessionRegistry.endSessionActivity({ conversationId: t.conversationId });
        break;
      case `browser-use-cursor-arrived`:
        this.browserSessionRegistry.notifyBrowserUseCursorArrived({
          owner: e,
          payload: { conversationId: t.conversationId, moveSequence: t.moveSequence },
        });
        break;
      case `open-browser-tab`:
        this.sendMessageToView(e, t);
        break;
      case `browser-sidebar-tweaks-enabled-changed`:
        this.browserHostManager.setTweaksFeatureEnabled(t.enabled);
        break;
      case `browser-sidebar-annotation-multi-select-enabled-changed`:
        this.browserHostManager.setAnnotationMultiSelectFeatureEnabled(t.enabled);
        break;
      case `browser-sidebar-site-annotation-api-enabled-changed`:
        this.browserHostManager.setSiteAnnotationApiFeatureEnabled(t.enabled, t.permissionRequired);
        break;
      case `browser-sidebar-command`:
        switch (t.command.type) {
          case `navigate`: {
            let n = await this.forwardBrowserNavigationUrl(t.command.url, t.command.hostId);
            if (n == null) break;
            this.browserHostManager.navigate(
              e,
              t.conversationId,
              n,
              t.command.source,
              t.command.initiator,
              t.browserTabId,
              t.pagePersistence,
            );
            break;
          }
          case `capture-screenshot`:
            await this.browserHostManager.captureScreenshotToClipboard(
              e,
              t.conversationId,
              t.browserTabId,
            );
            break;
          case `set-interaction-mode`:
            this.browserHostManager.setInteractionMode(
              e,
              t.conversationId,
              t.command.interactionMode,
              t.browserTabId,
              t.command.annotationModeEntrySource,
            );
            break;
          case `set-design-modifier-pressed`:
            this.browserHostManager.setDesignModifierPressed(
              e,
              t.conversationId,
              t.command.pressed,
              t.browserTabId,
            );
            break;
          case `set-original-view-enabled`:
            this.browserHostManager.setOriginalViewEnabled(
              e,
              t.conversationId,
              t.command.enabled,
              t.browserTabId,
            );
            break;
          case `clear-comments`:
            this.browserHostManager.clearComments(
              this.getBrowserCommentOverlayOwner(e, t.conversationId, t.browserTabId),
              t.conversationId,
              t.browserTabId,
            );
            break;
          case `discard-pending-annotations`:
            this.browserHostManager.discardPendingAnnotations(e, t.conversationId, t.browserTabId);
            break;
          case `add-annotations-to-composer`:
            this.browserHostManager.addAnnotationsToComposer(e, t.conversationId, t.browserTabId);
            break;
          case `close-tab`:
            this.browserHostManager.closePage(
              e,
              t.conversationId,
              t.browserTabId,
              t.pagePersistence?.browserStorageId,
            );
            break;
          case `go-back`:
            this.browserHostManager.goBack(e, t.conversationId, t.browserTabId);
            break;
          case `go-forward`:
            this.browserHostManager.goForward(e, t.conversationId, t.browserTabId);
            break;
          case `scroll`:
            this.browserHostManager.scroll(e, t.conversationId, t.command.scroll, t.browserTabId);
            break;
          case `open-find`:
            this.browserHostManager.openFind(e, t.conversationId, t.browserTabId);
            break;
          case `set-find-query`:
            this.browserHostManager.setFindQuery(
              e,
              t.conversationId,
              t.command.query,
              t.browserTabId,
            );
            break;
          case `find-next`:
            this.browserHostManager.findNext(e, t.conversationId, t.browserTabId);
            break;
          case `find-previous`:
            this.browserHostManager.findPrevious(e, t.conversationId, t.browserTabId);
            break;
          case `close-find`:
            this.browserHostManager.closeFind(e, t.conversationId, t.browserTabId);
            break;
          case `focus-address`:
            break;
          case `refresh-cursor`:
            this.browserHostManager.refreshCursor(e, t.conversationId, t.browserTabId);
            break;
          case `step-zoom`:
            this.browserHostManager.stepZoom(e, t.conversationId, t.command.delta, t.browserTabId);
            break;
          case `set-zoom-percent`:
            this.browserHostManager.setZoomPercent(
              e,
              t.conversationId,
              t.command.zoomPercent,
              t.browserTabId,
            );
            break;
          case `reset-zoom`:
            this.browserHostManager.resetZoom(e, t.conversationId, t.browserTabId);
            break;
          case `reload`:
            this.browserHostManager.reload(
              e,
              t.conversationId,
              { ignoreCache: t.command.ignoreCache },
              t.browserTabId,
            );
            break;
          case `print`:
            this.browserHostManager.print(e, t.conversationId, t.browserTabId);
            break;
          case `reset`:
            this.browserHostManager.reset(e, t.conversationId, t.browserTabId);
            break;
          case `stop`:
            this.browserHostManager.stop(e, t.conversationId, t.browserTabId);
            break;
          case `select-comment`:
            this.browserHostManager.selectComment(
              this.getBrowserCommentOverlayOwner(e, t.conversationId, t.browserTabId),
              t.conversationId,
              t.command.commentId,
              t.browserTabId,
            );
            break;
          case `transfer-conversation`:
            this.browserHostManager.transferConversation(
              e,
              t.conversationId,
              t.command.targetConversationId,
              t.browserTabId,
              t.command.targetBrowserTabId,
            );
        }
        break;
      case `browser-sidebar-runtime-open-comment-preview`:
        this.browserHostManager.handleRuntimeOpenCommentPreview(e, t);
        break;
      case `browser-sidebar-runtime-close-comment-preview`:
        this.browserHostManager.handleRuntimeCloseCommentPreview(e, t);
        break;
      case `browser-sidebar-runtime-cancel-editor`:
        this.browserHostManager.handleAnnotationEditorMessage(e, t);
        break;
      case `browser-sidebar-runtime-open-editor`:
        await this.browserHostManager.handleRuntimeOpenEditor(e, t);
        break;
      case `browser-sidebar-runtime-open-design-editor`:
        await this.browserHostManager.handleRuntimeOpenDesignEditor(e, t);
        break;
      case `browser-sidebar-runtime-comment-screenshot-ready`:
        this.browserHostManager.handleRuntimeCommentScreenshotReady(e, t);
        break;
      case `browser-sidebar-runtime-update-anchor`:
        this.browserHostManager.handleRuntimeUpdateAnchor(e, t);
        break;
      case `browser-sidebar-runtime-annotation-selection-modifier-state`:
        this.browserHostManager.handleAnnotationEditorMessage(e, t);
        break;
      case `browser-sidebar-runtime-focus-editor`:
        this.browserHostManager.handleRuntimeFocusEditor(e);
        break;
      case `browser-sidebar-runtime-exit-comment-mode`:
        this.browserHostManager.handleRuntimeExitCommentMode(e);
        break;
      case `browser-sidebar-runtime-toggle-annotation-mode`:
        this.browserHostManager.handleRuntimeToggleAnnotationMode(e, t.force);
        break;
      case `browser-sidebar-runtime-request-annotation-permission`: {
        let n = !1,
          r = (e, t, r, i) => {
            i && !r && (n = !0);
          };
        e.on(`did-start-navigation`, r);
        try {
          let r = await this.browserHostManager.requestSiteAnnotationPermission(e);
          e.isDestroyed() ||
            e.send(a.At, {
              type: `browser-sidebar-runtime-annotation-permission-result`,
              requestId: t.requestId,
              allowed: r && !n,
            });
        } finally {
          e.removeListener(`did-start-navigation`, r);
        }
        break;
      }
      case `browser-sidebar-runtime-annotation-suspension`:
        this.browserHostManager.handleRuntimeAnnotationSuspension(e, t.suspended);
        break;
      case `browser-sidebar-runtime-design-modifier-state`:
        this.browserHostManager.handleRuntimeDesignModifierState(e, t);
        break;
      case `browser-sidebar-runtime-image-drag-started`:
        this.browserHostManager.handleRuntimeImageDragStarted(e, t);
        break;
      case `browser-sidebar-runtime-image-drag-ended`:
        this.browserHostManager.handleRuntimeImageDragEnded(e);
        break;
      case `browser-sidebar-runtime-mouse-navigation`:
        this.browserHostManager.handleRuntimeMouseNavigation(e, t);
        break;
      case `browser-sidebar-attach-dragged-image`:
        await this.browserHostManager.attachDraggedImageToThread(
          e,
          t.conversationId,
          t.browserTabId,
        );
        break;
      case `browser-sidebar-comment-overlay-submit`:
        await this.browserHostManager.handleCommentOverlaySubmit(
          this.getBrowserCommentOverlayOwner(e, t.conversationId, t.browserTabId),
          t,
        );
        break;
      case `browser-sidebar-design-overlay-update`:
        this.browserHostManager.handleDesignOverlayUpdate(
          this.getBrowserCommentOverlayOwner(e, t.conversationId, t.browserTabId),
          t,
        );
        break;
      case `browser-sidebar-design-overlay-add`:
        await this.browserHostManager.handleDesignOverlayAdd(
          this.getBrowserCommentOverlayOwner(e, t.conversationId, t.browserTabId),
          t,
        );
        break;
      case `browser-sidebar-design-overlay-delete`:
        this.browserHostManager.handleDesignOverlayDelete(
          this.getBrowserCommentOverlayOwner(e, t.conversationId, t.browserTabId),
          t,
        );
        break;
      case `browser-sidebar-comment-overlay-delete`:
        this.browserHostManager.handleCommentOverlayDelete(
          this.getBrowserCommentOverlayOwner(e, t.conversationId, t.browserTabId),
          t,
        );
        break;
      case `browser-sidebar-comment-overlay-mounted`:
        this.browserHostManager.handleCommentOverlayMounted(
          this.getBrowserCommentOverlayOwner(e, t.conversationId, t.browserTabId),
          t.conversationId,
          t.browserTabId,
          t.sessionId,
          t.surfaceSize,
          t.placementSurfaceSize,
          t.metadataHeaderHeight,
          t.isLayoutReady,
        );
        break;
      case `browser-sidebar-comment-overlay-preview-open-changed`:
        this.browserHostManager.handleCommentOverlayPreviewOpenChanged(
          this.getBrowserCommentOverlayOwner(e, t.conversationId, t.browserTabId),
          t,
        );
        break;
      case `browser-sidebar-comment-overlay-tweaks-open-changed`:
        this.browserHostManager.handleCommentOverlayTweaksOpenChanged(
          this.getBrowserCommentOverlayOwner(e, t.conversationId, t.browserTabId),
          t,
        );
        break;
      case `browser-sidebar-comment-overlay-annotation-selection-modifier-state`:
        this.browserHostManager.handleAnnotationEditorMessage(
          this.getBrowserCommentOverlayOwner(e, t.conversationId, t.browserTabId),
          t,
        );
        break;
      case `browser-sidebar-comment-overlay-annotation-selection-hover-state`:
        this.browserHostManager.handleAnnotationEditorMessage(
          this.getBrowserCommentOverlayOwner(e, t.conversationId, t.browserTabId),
          t,
        );
        break;
      case `browser-sidebar-comment-overlay-annotation-selection-pointer-state`:
        this.browserHostManager.handleAnnotationEditorMessage(
          this.getBrowserCommentOverlayOwner(e, t.conversationId, t.browserTabId),
          t,
        );
        break;
      case `browser-sidebar-comment-overlay-remove-annotation-selection`:
        this.browserHostManager.handleAnnotationEditorMessage(
          this.getBrowserCommentOverlayOwner(e, t.conversationId, t.browserTabId),
          t,
        );
        break;
      case `browser-sidebar-comment-overlay-design-scrub-changed`:
        this.browserHostManager.handleCommentOverlayDesignScrubChanged(
          this.getBrowserCommentOverlayOwner(e, t.conversationId, t.browserTabId),
          t,
        );
        break;
      case `browser-sidebar-comment-overlay-close`:
        this.browserHostManager.handleCommentOverlayClose(
          this.getBrowserCommentOverlayOwner(e, t.conversationId, t.browserTabId),
          t.conversationId,
          t.browserTabId,
          t.sessionId,
        );
        break;
      case `persisted-atom-reset`:
        this.resetPersistedAtomState();
        break;
      case `codex-runtimes-config-changed`:
        this.sharedObjectRepository.set(`codex_runtimes_config`, t.config);
        break;
      case `heartbeat-automation-thread-state-changed`:
        this.automationSchedulerController?.setHeartbeatThreadRendererState({
          threadId: t.threadId,
          isEligible: t.isEligible,
          collaborationMode: t.collaborationMode,
          permissions: t.permissions,
          reason: t.reason,
        });
        break;
      case `codex-app-server-restart`: {
        let e = this.getAppServerConnection(t.hostId);
        (await e.restart({ intent: t.intent, killCodexProcess: t.killCodexProcess ?? !1 }),
          t.remoteControlEnabled && (await e.sendAppServerRequest(`remoteControl/enable`, null)),
          eQ().info(`Codex app-server restart requested`));
        break;
      }
      case `debug-run-eval-control-request`: {
        let n = this.windowManager.debugWindowManager?.getOwnerWebContentsId(e.id) ?? null;
        if (n != null) {
          this.windowManager.sendMessageToWebContentsId(n, {
            type: `debug-run-eval-control-request`,
            requestId: t.requestId,
            sourceWebContentsId: e.id,
            action: t.action,
          });
          break;
        }
        let r = l.BrowserWindow.fromWebContents(e),
          i =
            r != null && this.windowManager.getPrimaryWindows().includes(r)
              ? r
              : this.windowManager.getPrimaryWindow();
        if (i == null) {
          this.windowManager.sendMessageToWebContents(e, {
            type: `debug-run-eval-control-response`,
            requestId: t.requestId,
            ok: !1,
            errorMessage: `No primary app window is available`,
          });
          break;
        }
        this.windowManager.sendMessageToWindow(i, {
          type: `debug-run-eval-control-request`,
          requestId: t.requestId,
          sourceWebContentsId: e.id,
          action: t.action,
        });
        break;
      }
      case `debug-run-eval-control-response`:
        this.windowManager.sendMessageToWebContentsId(t.sourceWebContentsId, {
          type: `debug-run-eval-control-response`,
          requestId: t.requestId,
          ok: t.ok,
          result: t.result,
          errorMessage: t.errorMessage,
        });
        break;
      case `set-primary-runtime-install-release`:
        this.windowManager.sendMessageToAllWindows(t);
        break;
      case `toggle-trace-recording`:
        await toggleTraceRecording();
        break;
      case `log-message`: {
        let { level: n } = t;
        if (!a._n(n, this.maxLogLevel)) break;
        eQ().log(n, t.message, {
          safe: { ...t.tags?.safe, ...this.windowManager.getRendererWindowLogFields(e) },
          sensitive: t.tags?.sensitive ?? {},
        });
        break;
      }
      case `electron-app-state-snapshot-trigger`:
      case `electron-app-state-snapshot-response`:
        await this.samplerManager.handleMessage(e, t);
        break;
      case `shared-object-subscribe`: {
        this.sharedObjectSubscriberOrigins.has(e) ||
          (this.sharedObjectSubscriberOrigins.add(e),
          e.once(`destroyed`, () => {
            for (let [t, n] of this.sharedObjectSubscribers)
              (n.delete(e), n.size === 0 && this.sharedObjectSubscribers.delete(t));
          }));
        let n = this.sharedObjectSubscribers.get(t.key) ?? new Map();
        (n.set(e, (n.get(e) ?? 0) + 1), this.sharedObjectSubscribers.set(t.key, n));
        let r = this.sharedObjectRepository.get(t.key);
        this.sendSharedObjectUpdate(e, t.key, r);
        break;
      }
      case `shared-object-unsubscribe`: {
        let n = this.sharedObjectSubscribers.get(t.key);
        if (n == null) break;
        let r = (n.get(e) ?? 0) - 1;
        if (r > 0) {
          n.set(e, r);
          break;
        }
        (n.delete(e), n.size === 0 && this.sharedObjectSubscribers.delete(t.key));
        break;
      }
      case `shared-object-set`:
        this.sharedObjectRepository.set(t.key, t.value);
        break;
      case `mcp-request`: {
        eQ().debug(`app_server.bridge_received`, {
          safe: {
            messageType: `mcp-request`,
            requestId: String(t.request.id),
            method: t.request.method,
            originWebcontentsId: e.id,
            originHostId: t.hostId,
          },
          sensitive: {},
        });
        let r = t.request;
        if (n.Cs(t.hostId)) {
          let n = requestInterceptor.send(t.request);
          if (n.type === `response`) {
            this.sendAppServerResponseToView(
              e,
              t.hostId,
              t.request.method,
              n.response,
              t.request.trace,
              t.priority,
            );
            break;
          }
          r = n.request;
        }
        try {
          let i = () =>
            this.getAppServerConnection(t.hostId).handleClientRequest(
              new kZ(e, this.chunkedMessageSender),
              r,
              {
                priority: t.priority,
                source: t.source,
                timeoutMs: t.timeoutMs,
                expiresAtMs: t.expiresAtMs,
                widget: t.widget,
              },
              t.retainResponse,
              t.savedEnvironmentConfig,
            );
          r.trace == null
            ? await i()
            : await n.aa(
                {
                  attributes: { "app_server.method": r.method },
                  name: `electron.ipc_request_delivery`,
                  op: `codex.app_server.ipc_request_delivery`,
                  startTimeMs: t.dispatchedAtMs,
                  trace: r.trace,
                },
                i,
              );
        } catch (n) {
          if (t.retainResponse) {
            this.sendMessageToView(e, {
              type: `mcp-request-delivery`,
              hostId: t.hostId,
              update: {
                type: `failed`,
                delivery: { requestId: t.request.id, method: t.request.method, stage: `not-sent` },
                message: n instanceof Error ? n.message : `Desktop app server request failed`,
              },
            });
            break;
          }
          this.sendAppServerResponseToView(
            e,
            t.hostId,
            t.request.method,
            {
              id: t.request.id,
              error: {
                code: -32e3,
                message: n instanceof Error ? n.message : `Desktop app server request failed`,
              },
            },
            t.request.trace,
            t.priority,
          );
        }
        break;
      }
      case `thread-prewarm-start`:
        eQ().debug(`app_server.bridge_received`, {
          safe: {
            messageType: `thread-prewarm-start`,
            requestId: String(t.request.id),
            method: t.request.method,
            originWebcontentsId: e.id,
            originHostId: t.hostId,
          },
          sensitive: {},
        });
        try {
          let r = () =>
            this.getAppServerConnection(t.hostId).handlePrewarmThreadStart(
              new kZ(e, this.chunkedMessageSender),
              t.request,
              {
                priority: t.priority,
                source: t.source,
                timeoutMs: t.timeoutMs,
                expiresAtMs: t.expiresAtMs,
              },
              t.retainResponse,
            );
          t.request.trace == null
            ? await r()
            : await n.aa(
                {
                  attributes: { "app_server.method": t.request.method },
                  name: `electron.ipc_request_delivery`,
                  op: `codex.app_server.ipc_request_delivery`,
                  startTimeMs: t.dispatchedAtMs,
                  trace: t.request.trace,
                },
                r,
              );
        } catch (n) {
          if (t.retainResponse) {
            this.sendMessageToView(e, {
              type: `mcp-request-delivery`,
              hostId: t.hostId,
              update: {
                type: `failed`,
                delivery: { requestId: t.request.id, method: t.request.method, stage: `not-sent` },
                message: n instanceof Error ? n.message : `Desktop app server request failed`,
              },
            });
            break;
          }
          this.sendAppServerResponseToView(
            e,
            t.hostId,
            t.request.method,
            {
              id: t.request.id,
              error: {
                code: -32e3,
                message: n instanceof Error ? n.message : `Desktop app server request failed`,
              },
            },
            t.request.trace,
            t.priority,
          );
        }
        break;
      case `mcp-request-abandon`:
        this.appServerConnectionRegistry
          .getMaybeConnection(t.hostId)
          ?.abandonClientRequest(new kZ(e, this.chunkedMessageSender), t.requestId);
        break;
      case `mcp-notification`:
        (eQ().debug(`app_server.bridge_received`, {
          safe: {
            messageType: `mcp-notification`,
            method: t.request.method,
            originWebcontentsId: e.id,
            originHostId: t.hostId,
          },
          sensitive: {},
        }),
          await this.getAppServerConnection(t.hostId).handleClientNotification(t.request));
        break;
      case `mcp-response`: {
        if (
          (eQ().debug(`app_server.bridge_received`, {
            safe: {
              messageType: `mcp-response`,
              requestId: String(t.response.id),
              originWebcontentsId: e.id,
              originHostId: t.hostId,
            },
            sensitive: {},
          }),
          this.dynamicAppToolResponses.route(t.response))
        )
          break;
        let r = () => this.getAppServerConnection(t.hostId).handleClientResponse(t.response);
        if (t.trace == null || t.requestMethod == null) {
          await r();
          break;
        }
        await n.aa(
          {
            attributes: { "app_server.method": t.requestMethod },
            name: `electron.app_server_response_delivery`,
            op: `codex.app_server.response_delivery`,
            trace: t.trace,
          },
          r,
        );
        break;
      }
      case `fetch`:
        await this.fetchWrapper.handleRequest(e, t);
        break;
      case `cancel-fetch`:
        this.fetchWrapper.cancelRequest(e, t);
        break;
      case `pending-worktree-cancel`:
        this.getWorktreeService(t.hostId).cancel(t.id, t.continueLocally);
        break;
      case `pending-worktree-create`:
        this.getWorktreeService(t.hostId).create(t.request);
        break;
      case `pending-worktree-dismiss`:
        this.getWorktreeService(t.hostId).dismiss(t.id);
        break;
      case `pending-worktree-retry`:
        this.getWorktreeService(t.hostId).retry(t.id);
        break;
      case `pending-worktree-continue`:
        this.getWorktreeService(t.hostId).continueWithoutSetup(t.id);
        break;
      case `pending-worktree-update-metadata`:
        this.getWorktreeService(t.hostId).updateMetadata(t.id, t.update);
        break;
      case `show-diff`:
        this.windowManager.sendMessageToWebContents(e, { type: `toggle-diff-panel`, open: !0 });
        break;
      case `show-plan-summary`:
        break;
      case `update-diff-if-open`:
        break;
      case `electron-add-new-workspace-root-option`:
        await this.projectFolderPicker.createOrSelectProject(e, t.root);
        break;
      case `electron-create-new-workspace-root-option`: {
        let n = await this.createDefaultWorkspaceRoot(
            t.projectName ?? rQ,
            t.initializeGitRepository,
          ),
          r = t.projectName ?? rQ,
          i = this.projectsManager.hasProjectNamed(r) ? void 0 : r;
        await this.projectFolderPicker.createOrSelectProject(e, n, i);
        break;
      }
      case `electron-pick-workspace-root-option`:
        await this.projectFolderPicker.pickProjectSources(e, t.allowMultiple);
        break;
      case `electron-onboarding-skip-workspace`:
        await this.skipOnboardingWorkspace(e, t.initializeGitRepository);
        break;
      case `electron-update-workspace-root-options`:
        t.roots.length === 0
          ? this.globalState.get(n.iu.SELECTED_PROJECT)?.type === `local` &&
            (Lr(this.globalState, void 0),
            this.windowManager.sendMessageToAllWindows({
              type: `global-state-updated`,
              keys: [n.iu.SELECTED_PROJECT],
            }))
          : await this.projectsManager.createOrSelectLocalProjects(t.roots);
        break;
      case `open-in-browser`:
        await IH({
          request: t,
          targetWebContents: e,
          windowManager: this.windowManager,
          isDefaultBrowser: this.isDefaultBrowser(),
          settingsStore: this.settingsStore,
          getExternalBrowserUrl: (e) =>
            OZ({
              appServerConnectionRegistry: this.appServerConnectionRegistry,
              getHostConfigForHostId: this.getHostConfigForHostId,
              hostId: t.hostId ?? t.originHostId,
              url: e,
            }),
          queueCodexDeepLinkUrl: this.windowManager.queueCodexDeepLinkUrl.bind(this.windowManager),
        });
        break;
      case `electron-set-badge-count`:
        l.app.setBadgeCount(t.count);
        break;
      case `view-focused`:
      case `quit-app`:
      case `tray-menu-threads-changed`:
        break;
      case `keyboard-layout-map-changed`:
        Mze(t.keyboardLayoutMap);
        break;
      case `app-shell-shortcut-state-changed`: {
        let n = this.windowManager.getAppShellShortcutState(e.id)?.temporaryChatEnabled;
        (this.windowManager.setAppShellShortcutState(e.id, {
          bottomPanelBrowserCanZoom: t.bottomPanelBrowserCanZoom,
          bottomPanelBrowserConversationId: t.bottomPanelBrowserConversationId,
          bottomPanelBrowserTabId: t.bottomPanelBrowserTabId,
          canAcceptAppshotShortcut: t.canAcceptAppshotShortcut,
          canRedoAppAction: t.canRedoAppAction,
          canUndoAppAction: t.canUndoAppAction,
          bottomPanelCanCloseActiveTab: t.bottomPanelCanCloseActiveTab,
          focusArea: t.focusArea,
          focusedEditable: t.focusedEditable,
          imagePreviewOpen: t.imagePreviewOpen,
          isNewChatRoute: t.isNewChatRoute,
          quickChatAppshotThreadTarget: t.quickChatAppshotThreadTarget,
          temporaryChatEnabled: t.temporaryChatEnabled,
          terminalFocused: t.terminalFocused,
          threadNavigationShortcutLocked: t.threadNavigationShortcutLocked,
          rightPanelBrowserCanZoom: t.rightPanelBrowserCanZoom,
          rightPanelBrowserConversationId: t.rightPanelBrowserConversationId,
          rightPanelBrowserTabId: t.rightPanelBrowserTabId,
          rightPanelCanCloseActiveTab: t.rightPanelCanCloseActiveTab,
        }),
          n !== t.temporaryChatEnabled && this.onBrowserStateChanged());
        break;
      }
      case `subagent-thread-full-fidelity-changed`:
        this.getAppServerConnection(t.hostId).setSubagentThreadFullFidelityForSurface(
          t.conversationId,
          e.id,
          t.enabled,
        );
        break;
      case `electron-window-focus-request`: {
        let t = l.BrowserWindow.fromWebContents(e),
          n = !this.isSystemSuspended && !this.isScreenLocked && t?.isFocused() === !0;
        this.windowManager.sendMessageToWebContents(e, {
          type: `electron-window-focus-changed`,
          isFocused: n,
          ...(n ? {} : { occurredAtMs: Date.now() }),
        });
        break;
      }
      case `electron-window-zoom-changed`:
        this.windowManager.setWindowZoom(e, t.windowZoom);
        break;
      case `worker-request`:
      case `worker-request-cancel`:
        break;
      case `navigate-in-new-editor-tab`:
      case `open-vscode-command`:
      case `open-extension-settings`:
      case `open-keyboard-shortcuts`:
      case `show-settings`:
      case `install-wsl`:
        throw Error(`"${t.type}" is not implemented in Electron.`);
      case `open-config-toml`: {
        let e = n.Oi({ preferWsl: this.shouldUseWslPaths() }),
          t = pathApi.join(e, `config.toml`);
        await (0, b.mkdir)(e, { recursive: !0 });
        try {
          await (0, b.writeFile)(t, ``, { flag: `wx`, mode: 384 });
        } catch (e) {
          if (!(e instanceof Error && `code` in e && e.code === `EEXIST`)) throw e;
        }
        let r = await l.shell.openPath(t);
        if (r) throw Error(r);
        break;
      }
    }
  }
  setPrimaryWindowMode(e, t) {
    let n = l.BrowserWindow.fromWebContents(e);
    if (!n || n.isDestroyed()) return;
    let r = this.windowManager.getPrimaryWindow();
    if (!r || r.isDestroyed() || r.id !== n.id) return;
    let i = n$e(t);
    if ((0, G.default)(this.primaryWindowMode, t)) {
      i != null && this.showPrimaryWindow(n);
      return;
    }
    if (((this.primaryWindowMode = t), i != null)) {
      ((this.primaryWindowRestoreBounds ??= {
        bounds: n.getNormalBounds(),
        wasMaximized: n.isMaximized(),
        wasFullScreen: n.isFullScreen(),
      }),
        n.isFullScreen() && n.setFullScreen(!1),
        n.isMaximized() && n.unmaximize(),
        n.setResizable(!0));
      let e = l.screen.getDisplayMatching(n.getNormalBounds()).workAreaSize,
        t =
          process.platform === `win32`
            ? {
                width: Math.max(0, n.getBounds().width - n.getContentBounds().width),
                height: Math.max(0, n.getBounds().height - n.getContentBounds().height),
              }
            : { width: 0, height: 0 },
        r = { width: e.width - t.width, height: e.height - t.height },
        a = { width: Math.min(i.width, r.width), height: Math.min(i.height, r.height) },
        o = process.platform === `win32`,
        s = o && (a.width >= r.width * nQ || a.height >= r.height * nQ),
        c = this.windowManager.getPrimaryMinimumSize();
      (n.setMaximizable(o),
        n.setFullScreenable(!1),
        n.setMinimumSize(Math.min(c.width, a.width), Math.min(c.height, a.height)),
        n.setSize(a.width, a.height),
        s || n.center(),
        this.showPrimaryWindow(n),
        s && n.maximize());
      return;
    }
    if (
      (n.setResizable(!0),
      n.setMaximizable(!0),
      n.setFullScreenable(!0),
      this.primaryWindowRestoreBounds)
    ) {
      let { bounds: e, wasMaximized: t, wasFullScreen: r } = this.primaryWindowRestoreBounds;
      this.primaryWindowRestoreBounds = null;
      let i = this.windowManager.getPrimaryMinimumSize();
      n.setMinimumSize(i.width, i.height);
      let a = { ...e, width: Math.max(e.width, i.width), height: Math.max(e.height, i.height) };
      (n.isMaximized() && n.unmaximize(),
        n.setBounds(a),
        t && n.maximize(),
        r && n.setFullScreen(!0));
    }
    (this.windowManager.syncPrimaryMinimumSize(), this.showPrimaryWindow(n));
  }
  showPrimaryWindow(e) {
    e.isVisible() || (e.show(), e.focus());
  }
  dispose() {
    (this.unsubscribeSiteAnnotationSettings?.(),
      l.powerMonitor.off(`suspend`, this.handleSuspend),
      l.powerMonitor.off(`resume`, this.handleResume),
      l.powerMonitor.off(`lock-screen`, this.handleScreenLock),
      l.powerMonitor.off(`unlock-screen`, this.handleScreenUnlock),
      this.dynamicAppToolResponses.dispose(),
      this.samplerManager.dispose());
    for (let e of this.worktreeServicesByHostId.values()) e.dispose();
    this.worktreeServicesByHostId.clear();
  }
  waitForDynamicAppToolResponse(e) {
    return this.dynamicAppToolResponses.wait(e);
  }
  discardDynamicAppToolResponse(e) {
    this.dynamicAppToolResponses.discard(e);
  }
  cancelDynamicAppToolResponse(e) {
    this.dynamicAppToolResponses.cancel(e);
  }
  sendMessageToOrigin(e, t) {
    this.windowManager.sendMessageToWebContents(e, t);
  }
  requestDynamicToolsForThreadStart(e, t = !1, n = `default`) {
    return this.requestDynamicToolsAndHostedAutomationAppForThreadStart(e, t, n).then(
      ({ dynamicTools: e }) => e,
    );
  }
  requestHostedAutomationsAvailabilityForThreadStart() {
    return this.requestDynamicToolsAndHostedAutomationAppForThreadStart(null, !0, `default`).then(
      ({ hostedAutomationsAvailable: e }) => e,
    );
  }
  requestDynamicToolsAndHostedAutomationAppForThreadStart(e, t, n) {
    let r = this.windowManager.getPrimaryWindow();
    return r == null
      ? Promise.resolve({ dynamicTools: [], hostedAutomationsAvailable: !1 })
      : new Promise((i) => {
          let a = (0, _.randomUUID)(),
            o = setTimeout(() => {
              (this.pendingDynamicToolsForThreadStartRequests.delete(a),
                i({ dynamicTools: [], hostedAutomationsAvailable: !1 }));
            }, t$e);
          (this.pendingDynamicToolsForThreadStartRequests.set(a, {
            originId: r.webContents.id,
            resolve: i,
            timeout: o,
          }),
            this.sendMessageToOrigin(r.webContents, {
              type: `dynamic-tools-for-thread-start-requested`,
              hostId: this.hostId,
              requestId: a,
              featureOverrides: e,
              requestedHistoryMode: `legacy`,
              responseTarget: `electron`,
              mode: `default`,
              threadStartKind: n,
              threadToolsEnabled: t,
              useDefaultFeatureOverrides: !0,
            }));
        });
  }
  resolvePendingDynamicToolsForThreadStartRequestsForOrigin(e) {
    for (let [t, n] of this.pendingDynamicToolsForThreadStartRequests.entries())
      n.originId === e.id &&
        (clearTimeout(n.timeout),
        n.resolve({ dynamicTools: [], hostedAutomationsAvailable: !1 }),
        this.pendingDynamicToolsForThreadStartRequests.delete(t));
  }
  handleDynamicToolsForThreadStartResponse(e, t) {
    let n = this.pendingDynamicToolsForThreadStartRequests.get(t.requestId);
    if (!n || n.originId !== e.id) {
      eQ().warning(`Unknown dynamic tools response requestId`, {
        safe: { requestId: t.requestId },
        sensitive: {},
      });
      return;
    }
    (this.pendingDynamicToolsForThreadStartRequests.delete(t.requestId),
      clearTimeout(n.timeout),
      n.resolve({
        dynamicTools: t.dynamicTools,
        hostedAutomationsAvailable: t.hostedAutomationsAvailable === !0,
      }));
  }
  sendPersistedAtomState(e, t) {
    let n = this.globalState.get(`electron-persisted-atom-state`) ?? {},
      r = this.browserHostManager.isPrimaryWindowPersistenceOwner(e),
      i = {
        type: `persisted-atom-sync`,
        state: Object.fromEntries(
          Object.entries(n).filter(
            ([t]) => (r || !iQ(t)) && this.windowManager.shouldSyncPersistedAtom(e, t),
          ),
        ),
        canWritePrimaryWindowTabPersistence: r,
      };
    t === `critical`
      ? this.chunkedMessageSender.sendCritical(e, a.At, i)
      : this.sendMessageToView(e, i);
  }
  updatePersistedAtomState(e, t, n, r) {
    if (
      t === `unread-thread-ids-by-host-v1` ||
      (iQ(t) && !this.browserHostManager.isPrimaryWindowPersistenceOwner(e))
    )
      return;
    let i = this.globalState.get(`electron-persisted-atom-state`) ?? {},
      a =
        r == null
          ? n
          : applySparseStateWrite(
              i[t] ?? (r.legacyStorageKey == null ? void 0 : i[r.legacyStorageKey]),
              r,
            );
    (a === void 0
      ? delete i[t]
      : Object.defineProperty(i, t, { configurable: !0, enumerable: !0, value: a, writable: !0 }),
      this.globalState.set(`electron-persisted-atom-state`, i),
      this.broadcastPersistedAtomUpdate(e, t, a));
  }
  broadcastPersistedAtomUpdate(e, t, n) {
    let r = n === void 0,
      i = { type: `persisted-atom-updated`, key: t, value: r ? null : n, deleted: r };
    if (!iQ(t) || r) {
      this.windowManager.sendMessageToAllWindows(i);
      return;
    }
    let a = l.BrowserWindow.fromWebContents(e);
    a != null && this.windowManager.sendMessageToWindow(a, i);
  }
  deletePersistedAtomStateKeys(e, t) {
    let n = this.globalState.get(`electron-persisted-atom-state`) ?? {},
      r = t.filter((e) => e in n);
    if (r.length === 0) return;
    let i = { ...n };
    for (let e of r) delete i[e];
    this.globalState.set(`electron-persisted-atom-state`, i);
    for (let t of r) this.broadcastPersistedAtomUpdate(e, t, void 0);
  }
  resetPersistedAtomState() {
    (this.globalState.set(`electron-persisted-atom-state`, {}),
      this.windowManager.sendMessageToAllWindows({ type: `persisted-atom-sync`, state: {} }));
  }
  async skipOnboardingWorkspace(e, t) {
    let n = null;
    try {
      if (
        ((n = await this.createDefaultWorkspaceRoot(rQ, t)),
        (await this.projectsManager.createOrSelectLocalProjects([n])).length === 0)
      ) {
        this.chunkedMessageSender.sendInlineMessageForView(e, {
          type: `electron-onboarding-skip-workspace-result`,
          success: !1,
        });
        return;
      }
      (this.chunkedMessageSender.sendInlineMessageForView(e, {
        type: `electron-onboarding-skip-workspace-result`,
        success: !0,
        root: n,
      }),
        this.chunkedMessageSender.sendInlineMessageForView(e, {
          type: `navigate-to-route`,
          path: `/`,
          state: { focusComposerNonce: Date.now() },
        }));
    } catch (t) {
      eQ().error(`Failed to skip onboarding workspace selection`, {
        safe: {},
        sensitive: { error: t },
      });
      let r = t instanceof Error ? t.message : String(t);
      this.chunkedMessageSender.sendInlineMessageForView(e, {
        type: `electron-onboarding-skip-workspace-result`,
        success: !1,
        root: n ?? void 0,
        error: r,
      });
    }
  }
  sanitizeDefaultProjectName(e) {
    let t = Array.from(String(pathApi.basename(e)).trim(), (e: string) =>
      e.charCodeAt(0) < 32 || `<>:"/\\|?*`.includes(e) ? `_` : e,
    )
      .join(``)
      .replace(/[ .]+$/g, ``);
    return t.length === 0
      ? rQ
      : /^(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(t)
        ? `_${t}`
        : t;
  }
  async findAvailableDefaultWorkspaceRoot(e, t, n) {
    let r = n == null ? t : `${t} ${n}`,
      i = pathApi.join(e, r);
    if (!(await this.folderExists(i))) return i;
    let a = n == null ? 2 : n + 1;
    return this.findAvailableDefaultWorkspaceRoot(e, t, a);
  }
  async createDefaultWorkspaceRoot(e, t) {
    if (n.Es(this.host))
      throw Error(`Creating a default workspace is only supported for local hosts`);
    let r = this.sanitizeDefaultProjectName(e),
      i = await this.findAvailableDefaultWorkspaceRoot(
        pathApi.join(l.app.getPath(`documents`), `ChatGPT`),
        r,
        void 0,
      );
    return (
      await n.Di.mkdir(i, { recursive: !0 }, this.appServerClient),
      t && (await this.initializeDefaultWorkspace(i)),
      i
    );
  }
  async folderExists(e) {
    try {
      return (await n.Di.stat(e, this.appServerClient), !0);
    } catch {
      return !1;
    }
  }
  async initializeDefaultWorkspace(e) {
    try {
      let { available: t } = await this.requestGitWorker({
        method: `availability`,
        params: { hostConfig: this.host, operationSource: `onboarding_workspace_select` },
      });
      if (!t) return;
      await this.requestGitWorker({
        method: `git-init-repo`,
        params: {
          hostConfig: this.host,
          operationSource: `onboarding_workspace_select`,
          cwd: n.Ns(e),
        },
      });
    } catch (e) {
      eQ().warning(`Failed to initialize default workspace git repository`, {
        safe: {},
        sensitive: { error: e },
      });
    }
  }
  revealWindowsReviewRequest(e, t) {
    if (!i$e(t, this.hasActiveComputerUseTurn)) return;
    let r = this.getPrimaryWindow();
    r != null &&
      (eQ().info(`[windows-review-request] reveal requested`, {
        safe: {
          conversationId: t.params.threadId,
          hostId: e,
          method: t.method,
          requestId: t.id,
          wasMinimized: r.isMinimized(),
        },
        sensitive: {},
      }),
      r.webContents.isDestroyed() ||
        this.windowManager.sendMessageToWebContents(r.webContents, {
          type: `navigate-to-route`,
          path: n.fo(n.$u(t.params.threadId)),
        }),
      this.restoreShowAndFocusWindow(r, { stealFocus: !0 }));
  }
  getPrimaryWindow() {
    let e = this.windowManager.getPrimaryWindow();
    return e == null || e.isDestroyed() ? null : e;
  }
  restoreShowAndFocusWindow(e, { stealFocus: t }) {
    (e.isMinimized() && e.restore(),
      t && process.platform === `win32` && e.setAlwaysOnTop(!0),
      e.show(),
      e.focus(),
      t && process.platform === `win32` && e.setAlwaysOnTop(!1));
  }
  updatePowerSaveBlocker(e, t, n, r) {
    let i = e.id;
    (this.powerSaveTrackedWebContentsIds.has(i) ||
      (this.powerSaveTrackedWebContentsIds.add(i),
      e.once(`destroyed`, () => {
        (this.powerSaveTrackedWebContentsIds.delete(i),
          this.powerSaveBlockingWebContentsIds.delete(i),
          this.displaySleepBlockingWebContentsIds.delete(i),
          this.pluggedInRemoteControlPowerSaveWebContentsIds.delete(i),
          this.syncPowerSaveBlocker());
      })),
      t
        ? this.powerSaveBlockingWebContentsIds.add(i)
        : this.powerSaveBlockingWebContentsIds.delete(i),
      n
        ? this.pluggedInRemoteControlPowerSaveWebContentsIds.add(i)
        : this.pluggedInRemoteControlPowerSaveWebContentsIds.delete(i),
      r
        ? this.displaySleepBlockingWebContentsIds.add(i)
        : this.displaySleepBlockingWebContentsIds.delete(i),
      this.syncPowerSaveBlocker());
  }
  setSystemFocusState(e, t, n = void 0) {
    let r = this.isSystemSuspended || this.isScreenLocked;
    e === `suspended` ? (this.isSystemSuspended = t) : (this.isScreenLocked = t);
    let i = this.isSystemSuspended || this.isScreenLocked;
    if (r === i) return;
    if ((this.windowManager.setSystemFocusSuppressed(i), i)) {
      this.windowManager.sendMessageToAllWindows({
        type: `electron-window-focus-changed`,
        isFocused: !1,
        occurredAtMs: n,
      });
      return;
    }
    let a = l.BrowserWindow.getFocusedWindow();
    a?.isFocused() === !0 &&
      this.windowManager.sendMessageToWindow(a, {
        type: `electron-window-focus-changed`,
        isFocused: !0,
      });
  }
  syncPowerSaveBlocker() {
    let e = null;
    (this.displaySleepBlockingWebContentsIds.size > 0
      ? (e = `prevent-display-sleep`)
      : (this.powerSaveBlockingWebContentsIds.size > 0 ||
          (!l.powerMonitor.isOnBatteryPower() &&
            this.pluggedInRemoteControlPowerSaveWebContentsIds.size > 0)) &&
        (e = `prevent-app-suspension`),
      e !== this.powerSaveBlockerType &&
        (this.powerSaveBlockerId != null &&
          (l.powerSaveBlocker.stop(this.powerSaveBlockerId), (this.powerSaveBlockerId = null)),
        e != null && (this.powerSaveBlockerId = l.powerSaveBlocker.start(e)),
        (this.powerSaveBlockerType = e)));
  }
  async sendCustomPrompts(e) {
    let t = await n.u();
    this.sendMessageToView(e, { type: `custom-prompts-updated`, prompts: t });
  }
  sendMessageToView(e, t) {
    this.chunkedMessageSender.sendInlineMessageForView(e, t);
  }
  sendAppServerResponseToView(e, t, r, i, o, s) {
    let c = (n = void 0) => {
      let o = {
        type: `mcp-response`,
        hostId: t,
        message: i,
        ...(n == null ? {} : { receivedAtMs: Date.now(), requestMethod: r, trace: n }),
      };
      if (s === `critical`) {
        this.chunkedMessageSender.sendCritical(e, a.At, o);
        return;
      }
      this.sendMessageToView(e, o);
    };
    if (o == null) {
      c();
      return;
    }
    n.aa(
      {
        attributes: {
          "app_server.method": r,
          "app_server.response_error": i.error != null,
          "electron.broadcast_fallback": !1,
          ...(i.error == null ? {} : n.ea(i.error.code, i.error)),
        },
        name: `electron.response_route`,
        op: `codex.app_server.response_route`,
        trace: o,
      },
      () => {
        (i.error != null && n.ra(`failure`, `app_server`), c(n.Qi() ?? o));
      },
    );
  }
  sendSharedObjectUpdate(e, t, n) {
    e.isDestroyed() ||
      this.sendMessageToView(e, { type: `shared-object-updated`, key: t, value: n });
  }
  shouldUseWslPaths() {
    return n.zi(this.host);
  }
  getSettingsStore() {
    if (this.settingsStore == null) throw Error(`Settings store unavailable`);
    return this.settingsStore;
  }
}
function iQ(e) {
  return e.startsWith(`thread-browser-tabs-v1:`) || e.startsWith(`thread-tab-routes-v1:`);
}
function i$e(e, t) {
  return process.platform !== `win32` ||
    (e.method !== `item/commandExecution/requestApproval` &&
      e.method !== `mcpServer/elicitation/request`) ||
    (e.method === `mcpServer/elicitation/request` && e.params.mode === `openai/userVerification`) ||
    e.params.turnId == null
    ? !1
    : t({ sessionId: e.params.threadId, turnId: e.params.turnId });
}

  return ElectronMessageHandler;
}

export { createElectronMessageHandlerClass };
