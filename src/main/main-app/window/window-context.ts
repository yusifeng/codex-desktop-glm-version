// @ts-nocheck

export function createWindowContextClass(dependencies) {
  const {
    $,
    $0e,
    $8,
    $j,
    $ke,
    $nt,
    A,
    Ae,
    Aet,
    Ant,
    ArtifactSubscriptionManager,
    Ate,
    B,
    B8e,
    BO,
    BQ,
    IntegrityStateStore,
    C,
    C8e,
    StableIdStore,
    Cke,
    D,
    D2e,
    D5e,
    DE,
    ThreadTurnSummariesStore,
    Det,
    E,
    E5,
    EOe,
    Eje,
    Ett,
    F,
    F5e,
    F8e,
    FEe,
    FOe,
    Fnt,
    G,
    G5,
    G5e,
    G8e,
    Get,
    Gnt,
    H,
    H5,
    HOe,
    Hee,
    Het,
    I,
    I5,
    IEe,
    IO,
    UpdateCapabilityService,
    IXe,
    Iet,
    J,
    createCloudCommandSession,
    Jje,
    Jnt,
    K5,
    Kee,
    Ket,
    Kk,
    Kke,
    L,
    L6e,
    L8e,
    LEe,
    Ln,
    Lwe,
    M,
    M2e,
    M5,
    MO,
    Met,
    Mtt,
    Mu,
    N,
    N0,
    N2e,
    NOe,
    NativeArtifactFileService,
    Nnt,
    O,
    OAe,
    OT,
    P,
    P1e,
    PBe,
    POe,
    Q,
    Q0e,
    Qj,
    Qje,
    Qnt,
    R,
    R5e,
    AvatarOverlayService,
    Rnt,
    S,
    PublishedStatsig,
    Snt,
    T,
    PluginMarketplaceListingService,
    Tr,
    U,
    Uet,
    V,
    V6e,
    VO,
    Vet,
    W$e,
    W5,
    Wet,
    Wje,
    Wtt,
    Wze,
    KeyboardModifierService,
    X8,
    XOe,
    Xc,
    Xet,
    Xj,
    Xke,
    Xnt,
    Xtt,
    Y,
    HotkeyWindowService,
    Y6e,
    Y8e,
    YD,
    Yj,
    Z,
    Z5e,
    Z6e,
    DesktopFetchService,
    Zet,
    Zj,
    Zk,
    Znt,
    _,
    _$e,
    _ke,
    a,
    a$e,
    a5,
    aEe,
    ar,
    att,
    au,
    b,
    PerformanceTelemetryService,
    c,
    c8e,
    cA,
    cOe,
    cee,
    cr,
    crypto,
    ctt,
    d,
    d1e,
    d8e,
    dOe,
    dnt,
    e,
    e4e,
    e5,
    AccountInputsOwner,
    eMe,
    ett,
    f,
    f8e,
    fAe,
    fOe,
    fnt,
    g,
    g8e,
    h,
    i,
    i5,
    iAe,
    j,
    jet,
    jnt,
    ju,
    k,
    k$e,
    kN,
    kZ,
    l,
    l1e,
    lA,
    lOe,
    lne,
    ls,
    m,
    m4,
    n,
    n5,
    nAe,
    ComposerItemsBridge,
    nje,
    ntt,
    o,
    o5,
    o8e,
    oAe,
    oEe,
    or,
    p,
    p$e,
    p2,
    pke,
    q,
    qet,
    qke,
    qnt,
    r,
    r$e,
    r5,
    PrimaryWindowActionsBridge,
    requestFinalCaptureUpdate,
    rje,
    rr,
    s,
    s$e,
    s8e,
    t,
    t1e,
    trt,
    ttt,
    u,
    LocalEnvironmentsService,
    uQe,
    uke,
    v,
    vEe,
    vi,
    w,
    w6e,
    getThreadSummariesDb,
    wie,
    x,
    xoe,
    y,
    OwlRuntimeFeaturesService,
    y8e,
    yOe,
    ytt,
    z,
    resetRuntimeFeatures,
    z5e,
    AvatarOverlayScrollHostService,
    zje,
    znt,
    getVoiceController,
  } = dependencies;
  return class WindowContext {
      appServerConnectionRegistry;
      publishedStatsig;
      diamondController;
      settings;
      statsig;
      threadReadState;
      hostAppServerManagers;
      localClientCoordinationEnabled;
      threadArchive;
      appActionHostService;
      remoteControlDeviceKeyClient;
      messageHandler;
      detachedWindowManager;
      contentTabServiceManager;
      remoteConnectionsHandler;
      remoteControlEnvironmentService;
      sharedObjectRepository;
      fetchHandler;
      habitatAutomationsService;
      fetchWrapper;
      accessInputs;
      triggerSubscriptionReader;
      browserSettingsSync;
      appState;
      errorReporter;
      localEnvironments;
      managedWorktrees;
      projectsManager;
      projectFolderConsent;
      lsp;
      workspaceFiles;
      dictationAudio;
      dictationHistory;
      terminalManager;
      options;
      scopedState;
      durableThreadHostConfig;
      customRuntime;
      conversationExecutor;
      restrictedDevboxService;
      devboxService;
      primaryRuntimeService;
      threadTurnSummaries;
      threadMetadataGeneration;
      artifactDocuments;
      computerUseSettings;
      conversationalOnboarding;
      orbPicker = void 0;
      dynamicToolCalls = new eMe();
      localThreadCatalogSyncCoordinator;
      threadCatalogSyncManager;
      keyboardModifierService = new KeyboardModifierService();
      demoTools;
      realtime;
      initialRemoteConnectionsRefresh;
      primaryWindowContentReady = Promise.withResolvers();
      initialStartupWebContentsId;
      sshConnectTimeoutSeconds;
      codexMicroServiceManager;
      disposables = new n.Wr();
      registeredWindows = new Map();
      pendingAutomationCapabilityEvents = [];
      pendingAutomationRunTriggeredEvents = [];
      pendingAmbientSuggestionGenerationEvents = [];
      executionHostRegistry = new a$e();
      fileDragServices = new WeakMap();
      appViewsByWebContentsId = new Map();
      downloadsViewPublisher = new Jnt(this.appViewsByWebContentsId, () =>
        this.getDownloadsSnapshot(),
      );
      readyAppViewWebContentsIds = new Set();
      browserSessionProbeState = { hasOpenedTab: !1 };
      ipcClientsByWebContentsId = new Map();
      threadProjectAssignments;
      constructor(e) {
        ((this.options = e),
          (this.computerUseSettings = new nje(e.requestComputerUseWorker)),
          (this.codexMicroServiceManager = new lA({
            ensureWindow: e.ensureWindow,
            windowManager: e.windowManager,
          })),
          this.disposables.add(this.codexMicroServiceManager),
          (this.appState = e.appGlobalState),
          (this.errorReporter = e.errorReporter),
          (this.scopedState = e.globalState),
          (this.threadProjectAssignments = new Snt(
            this.scopedState,
            e.windowManager,
            (...e) => u.writeThreadAssignment(...e),
            (e) => u.getThreadStartProjectId(e),
          )),
          (this.projectFolderConsent = new Z6e(
            (e) => this.appServerConnectionRegistry.getConnection(e),
            (e) => this.getHostConfigForHostId(e),
            e.ensureWindow,
          )),
          (this.projectsManager = new o8e(
            this.scopedState,
            this.threadProjectAssignments,
            ls,
            e.windowManager,
            (e, t) => this.projectFolderConsent.confirm(e, t),
            (e) => this.appServerConnectionRegistry.getConnection(J).listThreads(e),
            (e) =>
              this.appServerConnectionRegistry.getConnection(J).readThread(e, { includeTurns: !1 }),
            async (t) =>
              (
                await e.requestGitWorker({
                  method: `origin-url`,
                  params: { cwd: n.Ns(t), hostConfig: ls, operationSource: `git_direct_call` },
                })
              ).originUrl,
            (e, t) => this.messageHandler.createDefaultWorkspaceRoot(e, t),
          )),
          (this.durableThreadHostConfig = OT({
            desktopOriginator: e.desktopOriginator,
            devApiBaseUrl: e.devApiBaseUrl,
            prodApiBaseUrl: e.prodApiBaseUrl,
          })),
          (this.sharedObjectRepository = new Hee()),
          this.sharedObjectRepository.set(`host_config`, ls),
          this.sharedObjectRepository.set(
            `is_default_browser`,
            l.app.isDefaultProtocolClient(`https`),
          ),
          this.sharedObjectRepository.set(`remote_ssh_connections`, []),
          this.sharedObjectRepository.set(`remote_control_connections_state`, {
            available: !1,
            accessRequired: !1,
            authRequired: !1,
            clientAuthorized: !1,
          }),
          this.sharedObjectRepository.set(`local_remote_control_client_id`, null),
          this.sharedObjectRepository.set(
            `local_remote_control_environment_id`,
            e.appGlobalState.get(a.G),
          ),
          this.sharedObjectRepository.set(
            `local_remote_control_installation_id`,
            e.appGlobalState.get(a.K),
          ));
        let t = n.J();
        (t != null && this.sharedObjectRepository.set(`local_remote_control_enabled`, t),
          (this.localClientCoordinationEnabled = W5(ls) == null));
        let r = this.createAppServerConnection(J);
        ((this.conversationalOnboarding = new kN(
          r,
          this.scopedState,
          e.requestComputerUseWorker,
          (e) => this.broadcastQueryCacheInvalidation([`conversational-onboarding-completion`, e]),
        )),
          this.disposables.add(() => kN.dispose(this.conversationalOnboarding)));
        let i = new a.H(h.default.join(l.app.getPath(`userData`), `statsig-state.json`)),
          s = (e) => {
            let t = new n.Wr();
            return (
              t.add(r.registerInternalAuthenticatedPrincipalChangeHandler(e)),
              t.add(
                r.registerInternalNotificationHandler((t) => {
                  t.method === `account/updated` && e();
                }),
              ),
              () => t.dispose()
            );
          };
        ((this.publishedStatsig = new PublishedStatsig(
          this.sharedObjectRepository,
          async () => {
            let [e, t] = await Promise.all([r.getAuthenticatedPrincipal(), r.getAuthMethod()]),
              a = t == null ? await r.getAccount() : null;
            return {
              principal: e,
              authMethod: t,
              unauthenticatedStableId:
                a?.account == null && a?.requiresOpenaiAuth === !1
                  ? (i.getStored(n.iu.STATSIG_STABLE_ID) ?? null)
                  : null,
            };
          },
          s,
        )),
          this.disposables.add(this.publishedStatsig),
          (this.diamondController = null),
          (this.statsig = new StableIdStore({
            read: async () => i.getStored(n.iu.STATSIG_STABLE_ID),
            write: async (e) => {
              i.set(n.iu.STATSIG_STABLE_ID, e);
              try {
                await i.flushOrThrow();
              } catch (e) {
                throw (i.delete(n.iu.STATSIG_STABLE_ID), e);
              }
            },
          })));
        let c = new n.O();
        ((this.remoteControlDeviceKeyClient = new F5e(
          o.t({ env: process.env, resourcesPath: process.resourcesPath }),
        )),
          this.executionHostRegistry.add(J, c),
          (this.appServerConnectionRegistry = new cee()),
          this.appServerConnectionRegistry.addConnection(J, r),
          this.disposables.add(
            new vEe(this.appServerConnectionRegistry, this.publishedStatsig, (e) =>
              this.broadcastQueryCacheInvalidation([`experimental-features`, `list`, e]),
            ),
          ),
          (this.habitatAutomationsService = NOe(r, e, this.appState, this.disposables, (...e) =>
            this.broadcastQueryCacheInvalidation(...e),
          )),
          (this.demoTools = Wje({ buildFlavor: e.buildFlavor, isPackaged: l.app.isPackaged })),
          this.demoTools != null && this.disposables.add(this.demoTools));
        let u = new Y6e(this.scopedState, r, new p2(this.scopedState), (t) =>
            e.windowManager.sendMessageToAllWindows({
              type: `thread-project-memberships-updated`,
              memberships: t,
            }),
          ),
          d = () => {
            u.setThreadAssignmentsEnabled(Tr().localProjectTaskMembership);
          };
        (d(),
          this.disposables.add(Ate(d)),
          this.projectsManager.setProjectBackend(u),
          this.disposables.add(u.start()));
        let f = (e) => {
          let t = this.appServerConnectionRegistry.getMaybeConnection(e);
          if (t == null) return null;
          let { hostConfig: r } = t,
            i;
          switch (r.kind) {
            case `local`:
              i = [r.kind, r.id, W5(r)];
              break;
            case `ssh`:
              i = [r.kind, r.id, r[n.cn]];
              break;
            case `wsl`:
              i = [r.kind, r.id, r.distro];
              break;
            case `remote-control`:
              i = [r.kind, r.id, r.env_id];
          }
          let a = (0, _.createHash)(`sha256`).update(JSON.stringify(i)).digest(`hex`);
          return `${r.id}:${a}`;
        };
        ((this.threadReadState = Ant({
          localClientCoordinationEnabled: this.localClientCoordinationEnabled,
          localConnection: r,
          connections: this.appServerConnectionRegistry,
          sharedObjects: this.sharedObjectRepository,
          globalState: this.scopedState,
          errorReporter: this.errorReporter,
          getConfiguredHostIds: () => [
            J,
            ...(this.durableThreadHostConfig == null ? [] : [this.durableThreadHostConfig.id]),
            ...this.getSharedRemoteConnections().map((e) => e.hostId),
          ],
          getHostConfig: this.getHostConfigForHostId.bind(this),
          getLocalWebsocketUrl: W5,
        })),
          this.disposables.add(this.threadReadState.dispose));
        let p;
        if (
          ((this.threadTurnSummaries = new Nnt({
            getPrincipal: () => r.getAuthenticatedPrincipal(),
            getStore: () => {
              if (p !== void 0) return p;
              let e = getThreadSummariesDb();
              return ((p = e == null ? null : new ThreadTurnSummariesStore(e)), p);
            },
            getHostKey: f,
            onHostRemoved: (e) =>
              this.appServerConnectionRegistry.subscribe((t) => {
                t.type === `removed` && e(t.hostId);
              }),
            onPrincipalChange: (e) => r.registerInternalAuthenticatedPrincipalChangeHandler(e),
          })),
          this.disposables.add(() => this.threadTurnSummaries.dispose()),
          (this.threadMetadataGeneration = new I5(
            this.appServerConnectionRegistry,
            this.publishedStatsig,
          )),
          this.disposables.add(() => I5.dispose(this.threadMetadataGeneration)),
          (this.conversationExecutor = null),
          e.buildFlavor,
          a.in.Dev,
          (this.customRuntime = null),
          this.durableThreadHostConfig != null)
        ) {
          let e = this.createAppServerConnection(
            this.durableThreadHostConfig.id,
            this.durableThreadHostConfig,
            !1,
            r,
          );
          (this.executionHostRegistry.add(this.durableThreadHostConfig.id, e),
            this.appServerConnectionRegistry.addConnection(this.durableThreadHostConfig.id, e));
        }
        let m = new g8e(r),
          g = new y8e(r),
          v = new F8e(this.appServerConnectionRegistry),
          y = n.si();
        if (y == null) throw Error(`Voice history requires Electron SQLite`);
        let b = new C8e(v, new Lwe(y)),
          x = new B8e(v),
          S = new Y8e(v, this.appServerConnectionRegistry, r, this.publishedStatsig),
          C = L8e.create(
            v,
            async ({ hostId: e, conversationId: t }) => {
              await this.appServerConnectionRegistry
                .getConnection(e)
                .sendAppServerRequest(`thread/realtime/stop`, { threadId: t });
            },
            d8e()
              ? {
                  isEnabled: () =>
                    this.publishedStatsig.getReadyClient()?.checkGate(`codex-airpods-mute`) === !0,
                  start: (e) => new f8e(e),
                }
              : void 0,
          ),
          w = G8e.create(C.rpc, {
            overlayFocus: { subscribe: (t) => e.avatarOverlayManager.subscribePresentationFocus(t) },
            overlayMotion: {
              cancelDock: () => {
                e.avatarOverlayManager.cancelPresentationDock();
              },
              dockTo: (t, n) => {
                e.avatarOverlayManager.dockPresentation(t, n);
              },
              fadeOutPresentation: (t) => {
                e.avatarOverlayManager.fadeOutPresentation(t);
              },
              preparePresentationForFadeIn: () => {
                e.avatarOverlayManager.preparePresentationForFadeIn();
              },
              presentFrom: (t, n) => {
                e.avatarOverlayManager.preparePresentation(t, n);
              },
              restoreAccessories: () => {
                e.avatarOverlayManager.restorePresentationAccessories();
              },
              setDockTarget: (t, n) => {
                e.avatarOverlayManager.setPresentationDockTarget(t, n);
              },
              updatePresentationOffset: (t) => {
                e.avatarOverlayManager.updatePresentationOffset(t);
              },
            },
            overlayVisibility: {
              setVisibility: (t) => {
                e.avatarOverlayManager.setPresentationVisibility(t);
              },
            },
          });
        ((this.realtime = {
          continuity: m,
          memory: g,
          presentation: w.rpc,
          voiceHistory: b,
          multiAgentActivity: x,
          voice: C.rpc,
        }),
          this.disposables.add(w.dispose),
          this.disposables.add(C.dispose),
          this.disposables.add(b),
          this.disposables.add(x),
          this.disposables.add(S),
          this.disposables.add(() => v.dispose()),
          (this.threadCatalogSyncManager =
            e.createThreadCatalogStore == null
              ? null
              : new dnt(
                  J,
                  e.createThreadCatalogStore,
                  (e, t) => {
                    G5.warning(`Thread catalog sync failed`, {
                      safe: {},
                      sensitive: { error: t, hostId: e },
                    });
                  },
                  new E5(),
                )),
          (this.localThreadCatalogSyncCoordinator =
            this.threadCatalogSyncManager?.attachSource(M5(`local`, `local`, r)) ?? null),
          this.threadCatalogSyncManager != null &&
            this.disposables.add(this.threadCatalogSyncManager),
          (this.threadArchive = new Xtt(
            this.executionHostRegistry,
            this.appServerConnectionRegistry,
            this.localThreadCatalogSyncCoordinator,
          )),
          (this.artifactDocuments = new Z5e({
            getAllowedWorkspaceRoots: async () => {
              let { workspaceRoots: t } = await BQ({
                appServerConnection: r,
                globalState: this.scopedState,
                localThreadIds: new Set(
                  (this.scopedState.get(n.iu.PROJECTLESS_THREAD_IDS) ?? []).filter(
                    (e) => this.threadCatalogSyncManager?.readThreadHostId(e) === J,
                  ),
                ),
                settingsStore: e.settingsStore,
              });
              return [...t, ...this.projectsManager.getProjectRootPathsForHost(J)];
            },
            store: new Det({
              directory: h.default.join(
                h.default.dirname(e.appGlobalState.getStateFilePath()),
                `artifact-documents`,
              ),
            }),
          })));
        let T = new p$e(this.executionHostRegistry, this.scopedState);
        ((this.workspaceFiles = T),
          this.disposables.add(() => T.dispose()),
          (this.dictationAudio = process.platform === `darwin` ? new k$e() : void 0),
          (this.dictationHistory = new W$e({
            directory: h.default.join(n.Oi(), `dictation-history`),
            onChanged: () => this.broadcastQueryCacheInvalidation([`dictation-history`]),
          })));
        let E = new P1e({ fetchImpl: (e, t) => l.net.fetch(e, t) });
        ((this.lsp = new Q0e(
          (e) => this.getAppServerClient(e),
          h.default.join(l.app.getPath(`userData`), `language-servers`),
          { getRoot: (e) => E.getRuntimeRoot(e), markExpired: (e) => E.markRuntimeExpired(e) },
          () => void this.options.sparkleManager.checkForUpdates(),
        )),
          this.disposables.add(this.lsp),
          (this.localEnvironments = new LocalEnvironmentsService(this.executionHostRegistry)),
          (this.managedWorktrees = new $0e(this.appServerConnectionRegistry, (e) =>
            this.messageHandler.getWorktreeService(e),
          )),
          (this.terminalManager = new Wtt(
            this.scopedState,
            () => e.settingsStore.getEffective(n.Fa.integratedTerminalShell.key),
            ls.terminal_command ?? null,
            async (t) =>
              (
                await e.requestGitWorker({
                  method: `worktree-shell-environment`,
                  params: {
                    cwd: n.Ns(t),
                    hostConfig: c.hostConfig,
                    operationSource: `git_direct_call`,
                  },
                })
              ).shellEnvironment,
            (e) => this.getHostConfigForHostId(e),
            (e) => this.appServerConnectionRegistry.getMaybeConnection(e),
            (e) => createCloudCommandSession(this.appServerConnectionRegistry.getConnection(n._s), e),
          )),
          (this.remoteConnectionsHandler = new D5e(
            this.appState,
            this.sharedObjectRepository,
            J,
            this.appServerConnectionRegistry,
            {
              desktopOriginator: e.desktopOriginator,
              devApiBaseUrl: e.devApiBaseUrl,
              prodApiBaseUrl: e.prodApiBaseUrl,
            },
            r,
            this.remoteControlDeviceKeyClient,
            this.getHostConfigForHostId.bind(this),
            this.getAppServerClient.bind(this),
            this.createAndRegisterRemoteConnection.bind(this),
            this.disposeRemoteConnection.bind(this),
            (e, t) => {
              this.threadCatalogSyncManager?.reconcileAuthoritativeHostKind(e, t);
            },
          )),
          (this.appActionHostService = new PrimaryWindowActionsBridge(
            e.windowManager,
            this.appViewsByWebContentsId,
          )),
          (this.remoteControlEnvironmentService = new R5e(this.remoteConnectionsHandler)),
          (this.devboxService = null),
          (this.restrictedDevboxService = null));
        let D = new L6e(
          this.appServerConnectionRegistry,
          e.errorReporter,
          this.scopedState,
          this.sharedObjectRepository,
          e.windowManager,
          void 0,
        );
        ((this.primaryRuntimeService = D),
          this.disposables.add(
            M2e({
              captureMessage: e.desktopSentry.captureMessage,
              diagnosePrimaryRuntimeDependencies: () => D.diagnoseDependencies({ hostId: J }),
              getMetadataTags: async (t) => {
                let i = {
                    app_build: a.nn.value ?? void 0,
                    app_version: n.Bu(e.hostProcess.getVersion()).version,
                    cli_version: r.appServerVersion ?? void 0,
                  },
                  [o, s] = await Promise.all([
                    D.getInstalledBundleVersion().catch(() => null),
                    r.readThread(t).catch(() => null),
                  ]);
                return { ...i, runtime_bundle_version: o ?? void 0, session_source: N2e(s?.source) };
              },
              getPlatformOs: () => r.platformOs(),
              getPrimaryRuntimeDependencyRoot: n.Tn,
              registerInternalNotificationHandler: (e) => r.registerInternalNotificationHandler(e),
            }),
          ),
          this.disposables.add(
            e.settingsStore.onDidChange(n.Ia.primaryNumberShortcutTarget.key, () => {
              Tr().unifiedTabStrip &&
                (e.refreshApplicationMenu?.(),
                this.messageHandler.getBrowserHostManager().refreshOwnerCommandAccelerators(),
                this.broadcastQueryCacheInvalidation([`vscode`, `codex-command-keymap-state`]));
            }),
          ),
          (this.fetchHandler = new PBe(
            this.scopedState,
            this.projectsManager,
            this.threadProjectAssignments,
            this.appServerConnectionRegistry,
            c,
            this.remoteConnectionsHandler,
            e.hotkeyWindowLifecycleManager,
            e.windowManager,
            D.isWorkspaceDependenciesFeatureEnabled,
            (e) => this.getAppServerClient(e),
            (e) => this.messageHandler.getWorktreeService(e),
            e.requestGitWorker,
            this.sharedObjectRepository,
            e.errorReporter,
            e.repoRoot,
            e.globalDictationHotkeyController,
            async (e) => {
              let t = this.messageHandler.getBrowserHostManager();
              (await t.clearBrowsingData(e), t.reloadOpenPages());
            },
            e.refreshApplicationMenu,
            e.requestComputerUseWorker,
            e.subscribeComputerUseCaptureWorkerEvent,
            () => {
              (e.windowManager.refreshAppShellCommandAccelerators(),
                this.messageHandler.getBrowserHostManager().refreshOwnerCommandAccelerators());
            },
            e.settingsStore,
            e.updateDockIcon,
            e.realtimeSessionRecorder,
            ({ includeBrowserTabs: t, includeDesktopLogs: n }) => [
              ...(n ? e.avatarOverlayManager.getFeedbackLogEntries() : []),
              ...(t
                ? [
                    {
                      contents: Buffer.from(
                        JSON.stringify(
                          this.messageHandler.getBrowserHostManager().getFeedbackDiagnostics(),
                        ),
                      ),
                      name: `browser-tabs.json`,
                    },
                  ]
                : []),
            ],
            e.realtimeVoiceHotkeyController,
            e.executionCodexHome,
            () => this.messageHandler.requestDynamicToolsForThreadStart(null, !0),
            void 0,
            (e) => this.localThreadCatalogSyncCoordinator?.handleImportedThreads(e),
            e.windowsCaptureNativeBridge ?? null,
            e.syncAvatarOverlayHotkey,
            () => e.artifactSessionHostLifecycle ?? null,
            (e, t) => this.browserSettingsSync.update(e, t),
            this.publishedStatsig,
            this.habitatAutomationsService,
            () => this.messageHandler.requestHostedAutomationsAvailabilityForThreadStart(),
            this.threadReadState.prepareCronTurnReadState,
            this.threadReadState.owner,
          )));
        let O = this.fetchHandler.settings;
        if (O == null) throw Error(`Settings store unavailable`);
        ((this.settings = O),
          this.disposables.add(() => O.dispose()),
          this.disposables.add(D.startUpdatePolling()));
        let k = new IntegrityStateStore(this.scopedState),
          A = null,
          j = () => this.detachedWindowManager?.clearPrewarm();
        if (
          (l.app.on(`before-quit`, j),
          this.disposables.add(() => {
            (j(), l.app.removeListener(`before-quit`, j));
          }),
          this.disposables.add(
            r.registerInternalAuthenticatedPrincipalChangeHandler(({ previous: e, current: t }) => {
              if (t == null) {
                A ??= e;
                return;
              }
              let n = A ?? e;
              (n != null &&
                (n.accountId !== t.accountId || n.userId !== t.userId) &&
                (this.clearSitesAuthentication(), resetRuntimeFeatures(), j()),
                (A = t));
              let r = this.options.windowManager.getPrimaryWindow();
              r != null &&
                this.readyAppViewWebContentsIds.has(r.webContents.id) &&
                this.detachedWindowManager?.startPrewarming(r.webContents);
            }),
          ),
          this.disposables.add(
            r.registerInternalNotificationHandler((e) => {
              if (e.method !== `account/updated`) return;
              let t = e.params?.authMode;
              (t != null && this.messageHandler?.getBrowserHostManager().cancelSiteBootstraps(),
                t !== `chatgpt` &&
                  t !== `chatgptAuthTokens` &&
                  (this.browserSettingsSync.logout(), j()),
                t ?? (this.clearSitesAuthentication(), (A = null), resetRuntimeFeatures(), k.clear()));
            }),
          ),
          this.disposables.add(
            r.registerInternalConnectionStateHandler((e) => {
              e === `error` &&
                r.getConnectionError()?.code === `login-required` &&
                this.clearSitesAuthentication();
            }),
          ),
          (this.fetchWrapper = new DesktopFetchService(this.fetchHandler, {
            applicationNetwork: e.applicationNetwork,
            desktopOriginator: e.desktopOriginator,
            devApiBaseUrl: e.devApiBaseUrl,
            deviceCheckCookieManager: new Qje({
              bundleIdentifier: a.rn(e.buildFlavor),
              generateToken: () =>
                cr({
                  resourcesPath: o.t({ env: process.env, resourcesPath: process.resourcesPath }),
                }),
              url: a.xt(e, `/devicecheck`),
            }),
            integrityStateStore: k,
            chunkedMessageSender: e.chunkedMessageSender,
            pluginServicePreviewEnabled: e.pluginServicePreviewEnabled,
            backendPreviewEnabled: void 0,
            appServerConnectionRegistry: this.appServerConnectionRegistry,
            prodApiBaseUrl: e.prodApiBaseUrl,
          })),
          (this.accessInputs = new AccountInputsOwner(
            this.appServerConnectionRegistry,
            r,
            this.threadReadState.getContext,
            (e, t) => this.fetchWrapper.fetchAuthenticatedJson(e, t),
          )),
          this.disposables.add(this.accessInputs.dispose),
          this.localClientCoordinationEnabled)
        ) {
          let e = new n.v(`desktop`, this.errorReporter);
          (this.disposables.add(
            e.addAnyBroadcastHandler(async (e) => {
              e.method !== `query-cache-invalidate` ||
                (e.version ?? 0) !== n.mu(e.method) ||
                Array.from(this.ipcClientsByWebContentsId.values()).some(
                  ({ client: t }) => t.getClientId() === e.sourceClientId,
                ) ||
                this.accessInputs.invalidateQueryCache(e.params.queryKey);
            }),
          ),
            this.disposables.add(() => e.dispose()));
        }
        (a.D((e) => this.fetchWrapper.exportTraceBatch(e)),
          (this.browserSettingsSync = new _ke({
            configFile: new pke(n.Oi()),
            getAuthenticatedPrincipal: () => r.getAuthenticatedPrincipal(),
            createApi: (e) =>
              new uke(this.fetchWrapper.fetchAuthenticatedJson.bind(this.fetchWrapper), e),
            isEnabled: () => Tr().browserSettingsCloudSync,
            onSettingsChanged: () =>
              this.broadcastQueryCacheInvalidation([`vscode`, `browser-use-origin-state-read`]),
          })),
          this.disposables.add(() => this.browserSettingsSync.dispose()),
          this.disposables.add(
            r.registerInternalAuthenticatedPrincipalChangeHandler(({ current: e }) =>
              this.browserSettingsSync.principalChanged(e),
            ),
          ));
        let M = () => this.browserSettingsSync.requestRefresh();
        (l.app.on(`browser-window-focus`, M),
          this.disposables.add(() => l.app.removeListener(`browser-window-focus`, M)),
          this.browserSettingsSync.start(),
          (this.triggerSubscriptionReader = new Rnt(
            () => r.getAuthenticatedPrincipal(),
            (e, t) => this.fetchWrapper.fetchAuthenticatedJson(e, t),
          )),
          this.disposables.add(
            r.registerInternalAuthenticatedPrincipalChangeHandler(() =>
              this.triggerSubscriptionReader.cancelPendingReads(),
            ),
          ),
          this.disposables.add(() => this.triggerSubscriptionReader.cancelPendingReads()));
        let N = new uQe(e.buildFlavor, e.gitWorkerInvocationSampler, (e) =>
          this.messageHandler.getBrowserHostManager().isBrowserPageWebContents(e),
        );
        this.messageHandler = new r$e(
          J,
          ls,
          c,
          e.windowManager,
          e.chunkedMessageSender,
          e.avatarOverlayManager,
          this.appServerConnectionRegistry,
          this.fetchWrapper,
          this.scopedState,
          this.projectsManager,
          this.sharedObjectRepository,
          e.requestGitWorker,
          e.desktopNotificationManager,
          e.errorReporter,
          e.desktopSentry,
          e.updateWorkerSentryUser,
          e.inboxManager,
          e.datadogLogger,
          e.maxLogLevel,
          e.buildFlavor,
          e.subscribeGitWorkerEvent,
          N,
          (e) => this.getHostConfigForHostId(e),
          e.hasActiveComputerUseTurn,
          e.settingsStore,
          (e) => this.fetchHandler.getPinnedThreadIdsForWorktreeCleanup(e),
          e.onAppEntrySource,
        );
        let { downloadStore: P } = this.messageHandler.getBrowserHostManager();
        (P.setChangeListener(() => {
          this.broadcastDownloadsState();
        }),
          P.setLifecycleEventListener((e) => {
            this.broadcastDownloadLifecycleEvent(e);
          }));
        let F = !1;
        this.disposables.add(
          this.sharedObjectRepository.addSubscriber((e) => {
            if (
              e === `remote_ssh_connections` ||
              e === `remote_wsl_connections` ||
              e === `remote_control_connections`
            ) {
              this.remoteConnectionsHandler.reconcileRemoteConnections(
                this.getSharedRemoteConnections(),
              );
              return;
            }
            if (
              e === `local_remote_control_environment_id` ||
              e === `local_remote_control_installation_id`
            ) {
              let e = this.sharedObjectRepository.get(`local_remote_control_environment_id`),
                t = this.sharedObjectRepository.get(`local_remote_control_installation_id`);
              (this.appState.set(a.G, e ?? void 0),
                t != null && this.appState.set(a.K, t),
                F ||
                  ((F = !0),
                  queueMicrotask(() => {
                    ((F = !1),
                      this.remoteConnectionsHandler.handleLocalRemoteControlIdentityChanged());
                  })));
            }
          }),
        );
        let I = (e) => {
          let t = new n.Wr();
          return (
            t.add(r.registerInternalAuthenticatedPrincipalChangeHandler(e)),
            t.add(
              r.registerInternalNotificationHandler((t) => {
                t.method === `account/updated` && e();
              }),
            ),
            () => t.dispose()
          );
        };
        ((this.hostAppServerManagers = new LEe({
          connections: this.appServerConnectionRegistry,
          localConnection: r,
          readContext: this.threadReadState.getContext,
          create: (t) =>
            FEe({
              ...t,
              localClientCoordinationEnabled: this.localClientCoordinationEnabled,
              executionHost: this.executionHostRegistry.get(t.hostId),
              fetchHandler: this.fetchHandler,
              globalState: this.scopedState,
              settingsStore: e.settingsStore,
              evaluations: this.publishedStatsig,
              remoteConnections: this.remoteConnectionsHandler,
              archive: this.threadArchive,
              catalog: this.threadCatalogSyncManager,
              threadProjectAssignments: this.threadProjectAssignments,
              threadReadState: this.threadReadState.owner,
              getThreadReadStateContext: this.threadReadState.getContext,
              subscribeIdentityChanges: I,
              windowManager: e.windowManager,
              errorReporter: this.errorReporter,
            }),
          onError: (e) =>
            G5.warning(`Failed to construct hosted AppServerManager`, {
              safe: {},
              sensitive: { error: e },
            }),
        })),
          this.disposables.add(
            this.sharedObjectRepository.addSubscriber((e) => {
              (e === `remote_ssh_connections` ||
                e === `remote_wsl_connections` ||
                e === `remote_control_connections`) &&
                this.hostAppServerManagers.refreshInBackground();
            }),
          ),
          (this.initialRemoteConnectionsRefresh = Promise.all([
            this.remoteConnectionsHandler.refreshRemoteConnections(),
            this.remoteConnectionsHandler.refreshLocalRemoteControlClientId(),
          ])
            .then(() => void 0)
            .catch((e) => {
              G5.warning(`Failed to refresh remote connections`, {
                safe: {},
                sensitive: { error: e },
              });
            })));
      }
      createAppHost(e) {
        let t = this.initialStartupWebContentsId === e.id;
        t && (this.initialStartupWebContentsId = null);
        let r = l.BrowserWindow.fromWebContents(e),
          i = this.appServerConnectionRegistry.getConnection(J),
          s = this.messageHandler.getBrowserHostManager();
        this.detachedWindowManager =
          this.detachedWindowManager ?? new Jje(this.options.windowManager, { browser: $ke(s) });
        let c = this.detachedWindowManager;
        (this.options.windowManager.setBrowserCommentPopupOwnerResolver((e, t, n) => YD(c, e, t, n)),
          (this.contentTabServiceManager =
            this.contentTabServiceManager ??
            new rje(this.options.windowManager, this.detachedWindowManager)));
        let { downloadStore: u } = s,
          d =
            this.threadCatalogSyncManager == null
              ? void 0
              : new d1e(this.threadCatalogSyncManager, {
                  getPrincipal: () => i.getAuthenticatedPrincipal(),
                  getCachedPrincipal: () => i.getCachedAuthenticatedPrincipal(),
                  onPrincipalChange: (e) => i.registerInternalAuthenticatedPrincipalChangeHandler(e),
                  createSource: (e) =>
                    fnt(e, (e, t) => this.fetchWrapper.fetchAuthenticatedJson(e, t)),
                });
        d != null && e.once(`destroyed`, () => d[Symbol.dispose]());
        let f =
            this.options.remoteHostedPIPContentController == null
              ? void 0
              : new z5e(this.options.remoteHostedPIPContentController, e),
          p = new HotkeyWindowService(this.options.hotkeyWindowLifecycleManager, e),
          m = h.default.join(
            this.options.executionCodexHome,
            `memories`,
            `extensions`,
            `skysight`,
            `resources`,
          ),
          g = new n.Bf((e, t, n, r) => this.fetchWrapper.fetchHttp(e, t, n, r, void 0));
        e.once(`destroyed`, () => g[Symbol.dispose]());
        let _ = new n.nf(qnt);
        e.once(`destroyed`, () => _[Symbol.dispose]());
        let v = new w6e({
          localClient: i,
          clientForHost: (e) => this.appServerConnectionRegistry.getConnection(e),
          desktopOriginator: this.options.desktopOriginator,
          fetch: (e, t) => this.fetchWrapper.fetchHttp(crypto.randomUUID(), e, t),
        });
        e.once(`destroyed`, () => v[Symbol.dispose]());
        let y = new N0(
            this.scopedState,
            this.executionHostRegistry,
            this.options.settingsStore,
            this.options.requestOpenInWorker,
            e,
            this.options.chunkedMessageSender,
          ),
          b = this.options.artifactSessionHostLifecycle,
          x =
            b == null
              ? void 0
              : new Vet({
                  compareConnectionInfo: a5,
                  createClient: Uet,
                  createExternalDocuments: (e) =>
                    new jet({
                      connect: e,
                      createBinding: (e, t) => new Met(e, t),
                      createId: () => (0, _.randomUUID)(),
                      parseApplyRequest: (e) => Aet.parse(e),
                      parseBindingRequest: (e) => X8.parse(e),
                    }),
                  createNativeFiles: (e) =>
                    new NativeArtifactFileService({
                      downloadCopy: async (e) => {
                        if (this.workspaceFiles.downloadCopy == null)
                          throw Error(`Downloading workspace files is unavailable`);
                        await this.workspaceFiles.downloadCopy({ hostId: J, path: e });
                      },
                      getTargets: y.getTargets.bind(y),
                      hostId: J,
                      maxBytes: Ae,
                      open: y.open.bind(y),
                      publishNativeSnapshot: e.publishNativeSnapshot,
                      resolveArtifactKind: e.resolveArtifactKind,
                    }),
                  createSubscriptions: (e) =>
                    new ArtifactSubscriptionManager({
                      ...e,
                      createId: () => (0, _.randomUUID)(),
                      createSubscription: (e) => new Het(e),
                      disposeValue: i5,
                      isErrorCode: o5,
                      logFailure: (e, t) =>
                        r.i(`artifact-session-host-service`)().warning(e, {
                          safe: {},
                          sensitive: { error: t },
                        }),
                      parseAppendResult: (e) => {
                        let t = $8(e);
                        return { applied: Ket(t, `applied`), stateVersion: n5(t, `stateVersion`) };
                      },
                      parseAssetResult: (e, t) => {
                        let n = $8(e);
                        if (e5(n, `sha256`) !== t)
                          throw Error(`Artifact Session host returned the wrong asset.`);
                        return r5(e5(n, `dataBase64`));
                      },
                      parseEvent: Get,
                      parseFlushSubscriptionId: (e) => e5($8(e), `subscriptionId`),
                      parseOpenResult: (e, t, n) => {
                        let r = $8(e);
                        if (e5(r, `subscriptionId`) !== n)
                          throw Error(`Artifact Session host returned the wrong subscription.`);
                        return Wet(t, r.document);
                      },
                      serializeBytes: qet,
                    }),
                  getViewerConnectionInfo: () => this.getArtifactSessionHostViewerConnectionInfo(),
                  isErrorCode: o5,
                  logFailure: (e, t) =>
                    r.i(`artifact-session-host-service`)().warning(e, {
                      safe: {},
                      sensitive: { error: t },
                    }),
                  parseArtifactKind: (e) => {
                    let t = e5($8(e), `kind`);
                    if (t !== `presentation` && t !== `spreadsheet`)
                      throw Error(`Artifact Session host returned an invalid kind.`);
                    return t;
                  },
                  parseCapabilities: (e) => $8(e).capabilities,
                  parseNativeSnapshot: Iet,
                  requestConnectionReconciliation: () => b.requestViewerReconciliation(),
                  subscribeToConnectionInfo: (e) => b.onViewerConnectionInfoChanged(e),
                });
        return (
          x != null &&
            e.once(`destroyed`, () => {
              x.dispose();
            }),
          new aEe({
            globalState: this.scopedState,
            httpFetch: g,
            websitePreviews: _,
            pluginIncentives: v,
            ambientSuggestions: new ComposerItemsBridge(this.appServerConnectionRegistry),
            automations: this.habitatAutomationsService,
            applicationMenu: new lOe(e),
            customRuntime: void 0,
            appActions: this.appActionHostService,
            clientCoordination: this.ipcClientsByWebContentsId.get(e.id)?.hostService,
            threadReadState: new jnt(this.threadReadState.owner),
            statsig: this.statsig,
            statsigEvaluations: this.publishedStatsig,
            diamond: void 0,
            settings: this.settings,
            configSettingsWriteConfirmations: this.settings.configWriteConfirmations,
            workModeAccess: this.settings,
            appInfo: new oEe(),
            accessInputs: this.accessInputs,
            installerAttribution: au(),
            artifactDocuments: this.artifactDocuments,
            artifactSessions: x,
            orbPicker: void 0,
            avatarOverlay: new AvatarOverlayService(this.options.avatarOverlayManager, e),
            avatarOverlayScroll:
              process.platform === `darwin` ? new AvatarOverlayScrollHostService(e) : void 0,
            appUpdates: new cOe(
              this.options.windowManager,
              e,
              this.options.sparkleManager,
              this.options.globalState,
            ),
            realtimeVoiceRuntime: new c8e(
              getVoiceController(this.options.avatarOverlayManager),
              e,
              this.realtime.voice,
              (e) => this.realtime.voiceHistory.markEphemeral(e),
            ),
            browserProfileImport: qke.create(
              () => i.getConfigRequirements(),
              () => s.getBrowserSession(),
            ),
            browserHost: new Kke(
              this.messageHandler,
              s,
              e,
              oAe(this.options.globalState),
              void 0,
              (e, t, n) => YD(c, e, t, n),
              new nAe(c, e, (e, t, n) => s.getCurrentPageUrl(e, t, n)),
            ),
            browserTabs: new HOe(s.iabTabMentions, e),
            browserAutocomplete: new Cke(this.messageHandler.getBrowserAutocompleteCoordinator(), e),
            browsingHistory: Xke.create(e, () => s.getBrowserSession()),
            debug: new zje(
              this.options.windowManager.debugWindowManager,
              s,
              e,
              this.options.windowManager,
            ),
            demoTools: this.demoTools?.createService(e),
            downloads: new iAe(u, e, this.downloadsViewPublisher.registerDetachedView),
            dynamicToolCalls: this.dynamicToolCalls,
            fileDrags: this.getFileDragService(e),
            tabDragPreview: Ett.create(e),
            detachedWindows: this.detachedWindowManager.createService(e),
            contentTabs: this.contentTabServiceManager.createService(e),
            hotkeyWindowCommands: p,
            hotkeyWindowHotkeys: p,
            inAppBrowserIncompleteNavigation:
              this.options.windowManager.getRendererWindowLogFields(e).rendererWindowAppearance ===
              `primary`
                ? new IXe(e)
                : void 0,
            keyboardModifiers: this.keyboardModifierService,
            shortcutCapture: new Zet(e),
            libraryFiles: new l1e(new t1e(i, this.scopedState, this.options.settingsStore)),
            localEnvironments: this.localEnvironments,
            managedWorktrees: this.managedWorktrees,
            projects: this.projectsManager,
            projectFolderConsent: this.projectFolderConsent.serviceForWindow(e),
            sshConnectionRegistration: new ett(this.appState, this.remoteConnectionsHandler),
            projectlessWorkspace: new V6e(e, this.options.settingsStore),
            executionPaths: new IEe(this.fetchHandler),
            localThreadCatalog: d,
            localAutomationsScheduler:
              this.options.windowManager.getRendererWindowLogFields(e).rendererWindowAppearance ===
              `primary`
                ? new UpdateCapabilityService(e, this.options.windowManager, (e) =>
                    this.messageHandler.setLocalAutomationsCapability(e),
                  )
                : void 0,
            appshot: new yOe(this.options.appshotHotkeysService, ({ requestId: e }) =>
              this.options.requestComputerUseCaptureUpdate == null
                ? Promise.resolve(!1)
                : requestFinalCaptureUpdate({
                    requestComputerUseCaptureUpdate: this.options.requestComputerUseCaptureUpdate,
                    requestId: e,
                  }),
            ),
            lsp: this.lsp,
            browserUsePermissions: new XOe(
              n.Oi(),
              () => this.appServerConnectionRegistry.getConnection(J).getConfigRequirements(),
              (e, t) => this.browserSettingsSync.update(e, t),
            ),
            browserPluginConfig: new wie({
              appServerConnection: i,
              appVersion: l.app.getVersion(),
              isPackaged: l.app.isPackaged,
              repoRoot: this.options.repoRoot,
            }),
            conversationalOnboarding: this.conversationalOnboarding,
            customAvatars: new Eje(this.executionHostRegistry),
            fileAttachments: new s$e(this.executionHostRegistry),
            github: Znt(this.options.requestGitWorker, (e) => this.getAppServerClient(e).hostConfig),
            workspaceFiles: this.workspaceFiles,
            dictationAudio: this.dictationAudio,
            systemAudioSpectrum: ntt(e),
            dictationHistory: this.dictationHistory,
            owlFeatures: new OwlRuntimeFeaturesService(),
            owlBrowserCrashCounter:
              this.options.windowManager.getRendererWindowLogFields(e).rendererWindowAppearance ===
              `primary`
                ? new a.$t(e)
                : void 0,
            primaryRuntime: this.primaryRuntimeService,
            localAutomations: this.fetchHandler.automationsService,
            quickChatWindow: new s8e(this.options.quickChatController, e),
            pluginScheduledTasks: new PluginMarketplaceListingService(i),
            chromeNativeHost: new OAe(
              this.executionHostRegistry,
              process.env.NODE_ENV === `development` ? this.options.repoRoot : void 0,
            ),
            chromiumBrowser: new MO(),
            chatGptProjectFiles: new fAe(n.Oi(), (e) => this.fetchWrapper.getDownloadStream(e)),
            chatGptBrowserSession:
              r == null
                ? void 0
                : new e4e(
                    r,
                    () => {
                      this.options.windowManager.showWindow(r, { stealFocus: !0 });
                    },
                    {
                      bundleIdentifier: a.rn(this.options.buildFlavor),
                      generateToken: () =>
                        cr({
                          resourcesPath: o.t({
                            env: process.env,
                            resourcesPath: process.resourcesPath,
                          }),
                        }),
                      isSupported: () =>
                        ar({
                          resourcesPath: o.t({
                            env: process.env,
                            resourcesPath: process.resourcesPath,
                          }),
                        }),
                    },
                    this.browserSessionProbeState,
                  ),
            chronicle:
              process.platform === `darwin` && this.options.getSkysightRecorderController != null
                ? new IO(
                    i,
                    this.options.getSkysightRecorderController,
                    () => Tr().skysight,
                    Qj,
                    (e) => $j({ bundleIdentifiers: e }),
                    {
                      list: () => Yj({ resourcesDirectory: m }),
                      listSuggestions: () => Xj({ resourcesDirectory: m }),
                      listSummaryIntervals: (e) => Zj({ resourcesDirectory: m, sinceMs: e }),
                    },
                  )
                : void 0,
            performanceTelemetry: new PerformanceTelemetryService(this.messageHandler, e),
            pinnedThreads: this.fetchHandler.pinnedThreadsService,
            processMemory: Qnt,
            clipboard: new VO(),
            computerUseSettings: this.computerUseSettings,
            pullRequestMessageGeneration: new n.rt(
              (e) => this.appServerConnectionRegistry.getConnection(e),
              async () => (await Ln(this.publishedStatsig)).ephemeralGenerationModel,
            ),
            textGeneration: new n.nt((e) =>
              this.appServerConnectionRegistry.getConnection(e ?? `local`),
            ),
            realtimeContinuity: this.realtime.continuity,
            realtimeMemory: this.realtime.memory,
            realtimeVoiceHistory: this.realtime.voiceHistory,
            realtimeVoiceMultiAgentActivity: this.realtime.multiAgentActivity,
            realtimeVoice: this.realtime.voice,
            realtimeVoicePresentation: this.realtime.presentation,
            requestUserInputAutoResolution: new G5e(this.appServerConnectionRegistry, e.id),
            userVerification:
              process.platform === `darwin`
                ? new znt((e) => this.appServerConnectionRegistry.getConnection(e))
                : void 0,
            remoteControlEnvironments: this.remoteControlEnvironmentService,
            remoteHostedPIP: f,
            startup: new ttt({
              includeStartupTiming: t,
              isSentryEnabled: () => a.Qt,
              origin: e,
              startupPhases: this.options.startupPhases,
              startupReady: this.primaryWindowContentReady.promise,
              windowManager: this.options.windowManager,
            }),
            notificationPermissionsSupported:
              process.platform === `darwin` || process.platform === `win32`,
            systemPermissions:
              process.platform === `darwin` || process.platform === `win32`
                ? new ytt({
                    askForMicrophoneAccess: () =>
                      l.systemPreferences.askForMediaAccess(`microphone`),
                    delay: (e) => new Promise((t) => setTimeout(t, e)),
                    getMicrophoneAccessStatus: () =>
                      l.systemPreferences.getMediaAccessStatus(`microphone`),
                    getNotificationPermissionStatus: () => l.Notification.getPermissionStatus(),
                    logger: r.i(`system-permissions-service`),
                    notificationAuthorizationUnavailable:
                      process.platform === `darwin` &&
                      this.options.buildFlavor === a.in.Prod &&
                      !l.app.isPackaged,
                    notificationSettingsAppBundleIdentifier: a.rn(this.options.buildFlavor),
                    openExternal: (e) => l.shell.openExternal(e),
                    permissionSettingsAppPath: a.m(),
                    platform: process.platform,
                    requestNotificationAuthorization: () => ctt(),
                    showItemInFolder: (e) => l.shell.showItemInFolder(e),
                  })
                : null,
            systemFonts: new att(),
            terminal: new Mtt(this.terminalManager, e),
            threadArchive: this.threadArchive,
            threadMetadataGeneration: this.threadMetadataGeneration,
            threadMetadata: this.options.windowManager.threadMetadataService,
            threadProjectAssignments: this.threadProjectAssignments,
            threadTurnSummaries: this.threadTurnSummaries,
            triggers: this.triggerSubscriptionReader,
            tracing: new Fnt(this.options.setGitWorkerTracingSampleRate, (e) => {
              this.options.globalState.getStored(`electron-desktop-otraces-sample-rate`) !== e &&
                this.options.globalState.set(a.V, e);
            }),
            hostedThreadFiles: new Wze((e, t) =>
              this.appServerConnectionRegistry
                .getConnection(n._s)
                .sendAppServerExtensionRequest(e, t),
            ),
            environmentConfigs: new Kk(() => i.getAuthToken({ refreshToken: !1 }), this.options),
            mcpAppSandbox: new D2e(e),
            visualizations: new Gnt(this.executionHostRegistry, e, (e, t) => {
              if (n.Cs(e)) return;
              let r = this.threadCatalogSyncManager?.readEntries([{ hostId: e, threadId: t }]).at(0);
              return r?.sourceKind === `chatgpt` ? void 0 : r?.cwd;
            }),
            codexMicro: new cA(this.codexMicroServiceManager, this.options.windowManager, e),
            notifications: new Xet(
              this.options.windowManager,
              e,
              this.options.desktopNotificationManager,
            ),
            openIn: new N0(
              this.scopedState,
              this.executionHostRegistry,
              this.options.settingsStore,
              this.options.requestOpenInWorker,
              e,
              this.options.chunkedMessageSender,
            ),
            windowNavigation: new Xnt(this.options.windowManager, e),
          })
        );
      }
      startFileDrag(e, t) {
        return this.getFileDragService(e).startDrag(t);
      }
      getFileDragService(e) {
        let t = this.fileDragServices.get(e);
        if (t != null) return t;
        let n = new _$e(this.executionHostRegistry, this.scopedState, e);
        return (this.fileDragServices.set(e, n), n);
      }
      async registerAppView(e, t) {
        if (this.detachedWindowManager?.isDetachedViewer(e.id)) return;
        (this.appViewsByWebContentsId.has(e.id) && this.customRuntime?.releaseView(e.id),
          this.readyAppViewWebContentsIds.delete(e.id));
        let { appUpdates: r, clientCoordination: i, downloads: a } = await t.services;
        if (e.isDestroyed()) return;
        let o = this.ipcClientsByWebContentsId.get(e.id);
        (o?.removeViewServiceHandlers?.(),
          o != null &&
            (o.removeViewServiceHandlers = n.g({
              hostId: J,
              ipcClient: o.client,
              viewService: i,
              shouldForwardThreadReadState: async () => !1,
            })),
          this.appViewsByWebContentsId.set(e.id, t),
          e.once(`destroyed`, () => {
            this.appViewsByWebContentsId.get(e.id) === t &&
              (this.appViewsByWebContentsId.delete(e.id),
              this.readyAppViewWebContentsIds.delete(e.id));
          }),
          await r.stateChanged(this.getAppUpdateViewState()));
        let s;
        try {
          s = await this.getDownloadsSnapshot();
        } catch (e) {
          G5.warning(`Failed to read native download history`, { safe: {}, sensitive: { error: e } });
          return;
        }
        await a.stateChanged(s);
      }
      broadcastAppUpdateState() {
        let e = this.getAppUpdateViewState();
        for (let t of this.appViewsByWebContentsId.values())
          t.services
            .then(({ appUpdates: t }) => t.stateChanged(e))
            .catch((e) => {
              G5.warning(`Failed to publish app update state to renderer`, {
                safe: {},
                sensitive: { error: e },
              });
            });
      }
      getRestartParticipants() {
        return [this, this.terminalManager, this.getBrowserHostManager().downloadStore];
      }
      async getRestartBlockers() {
        let e = [];
        return (
          e.push(
            ...this.realtime.voice.getRestartBlockers(),
            ...this.messageHandler.getWorktreeService().getRestartBlockers(),
          ),
          e
        );
      }
      async prepareForRestart() {}
      broadcastDownloadsState() {
        this.downloadsViewPublisher.broadcastDownloadsState();
      }
      broadcastDownloadLifecycleEvent(e) {
        this.downloadsViewPublisher.broadcastDownloadLifecycleEvent(e);
      }
      broadcastQueryCacheInvalidation(e, t = !1) {
        this.accessInputs.invalidateQueryCache(e);
        for (let n of this.appViewsByWebContentsId.values())
          n.services
            .then(({ clientCoordination: n }) =>
              n.invalidateQueryCache({
                sourceClientId: `desktop`,
                params: { queryKey: e, reset: t },
              }),
            )
            .catch((e) => {
              G5.warning(`Failed to publish query cache invalidation`, {
                safe: {},
                sensitive: { error: e },
              });
            });
      }
      async applyCodexAppConfigFromDisk(e) {
        let t = await xoe(e);
        return t.status === `loaded`
          ? {
              status: `applied`,
              configPath: t.configPath,
              result: await this.applyCodexAppConfig(t.config),
            }
          : (t.status === `missing` &&
              ((this.sshConnectTimeoutSeconds = void 0),
              this.appState.get(`electron-codex-app-config-applied-remote-declarations`) != null &&
                this.appState.delete(a.z)),
            t);
      }
      async applyCodexAppConfig(e) {
        ((this.sshConnectTimeoutSeconds = e.sshConnectTimeoutSeconds),
          await this.initialRemoteConnectionsRefresh);
        let t = dOe({ config: e, globalState: this.appState }),
          { remoteConnections: r } = await this.remoteConnectionsHandler.refreshRemoteConnections(),
          i = await fOe({
            confirmProjectFolders: async (e, t) => (
              await this.remoteConnectionsHandler.ensureRemoteConnectionConnected(e),
              this.projectFolderConsent.confirm(e, t)
            ),
            config: e,
            globalState: this.appState,
            setProjectOrder: (e) => this.projectsManager.setProjectOrder(e),
            remoteConnections: r.filter(n.Ds),
          });
        (t && i.changedGlobalStateKeys.unshift(n.iu.CODEX_MANAGED_REMOTE_CONNECTIONS),
          i.changedGlobalStateKeys.includes(n.iu.REMOTE_CONNECTION_AUTO_CONNECT_BY_HOST_ID) &&
            (await this.remoteConnectionsHandler.refreshRemoteConnections()));
        let a = i.changedGlobalStateKeys.filter((e) => e !== n.iu.PROJECT_ORDER);
        return (
          a.length > 0 &&
            this.options.windowManager.sendMessageToAllWindows({
              type: `global-state-updated`,
              keys: a,
            }),
          i.remoteProjectsChanged &&
            this.options.windowManager.sendMessageToAllWindows({
              type: `workspace-root-options-updated`,
            }),
          this.remoteConnectionsHandler.connectRemoteConnectionsAndLogFailures(
            i.remoteConnectionHostIdsToConnect,
          ),
          i
        );
      }
      registerWindow(e) {
        let { webContents: t } = e;
        this.initialStartupWebContentsId === void 0 &&
          this.options.windowManager.getPrimaryWindow()?.webContents.id === t.id &&
          (this.initialStartupWebContentsId = t.id);
        let r = new kZ(
          t,
          this.options.chunkedMessageSender,
          e,
          this.options.windowManager.isAvatarOverlayWindow(e)
            ? (e, r) =>
                this.ipcClientsByWebContentsId.get(t.id)?.hostService.ownsThread(e, n.$u(r)) === !0
            : null,
        );
        (this.registeredWindows.set(t.id, r),
          t.once(`destroyed`, () => {
            (this.registeredWindows.delete(t.id), ju(!1, t.id), Mu(!1, t.id));
          }));
        for (let e of this.appServerConnectionRegistry.getAllHostIds())
          this.appServerConnectionRegistry.getConnection(e).registerWebviewWindow(r);
        this.registerIpcClientForWebContents(e.webContents);
      }
      async callDynamicAppTool(e, t) {
        t.throwIfAborted();
        let n = this.options.windowManager.getPrimaryWindow()?.webContents.id,
          r = [
            ...(n == null ? [] : [n]),
            ...Array.from(this.readyAppViewWebContentsIds).filter((e) => e !== n),
          ],
          i = !1;
        for (let n of r) {
          t.throwIfAborted();
          let r = this.appViewsByWebContentsId.get(n);
          if (r == null || !this.readyAppViewWebContentsIds.has(n)) continue;
          try {
            try {
              var o = a.en();
              let t = o.u(await r.services);
              if (t.dynamicAppTools == null || ((i = !0), !(await t.dynamicAppTools.canCallTool(e))))
                continue;
            } catch (e) {
              o.e = e;
            } finally {
              o.d();
            }
          } catch (e) {
            (t.throwIfAborted(),
              G5.warning(`Failed to query app window tool capabilities`, {
                safe: {},
                sensitive: { error: e },
              }));
            continue;
          }
          let c = this.messageHandler.waitForDynamicAppToolResponse(e.params.callId);
          c.catch(() => void 0);
          try {
            try {
              var s = a.en();
              let n = s.u(await r.services).dynamicAppTools;
              if (n == null) throw Error(`The selected app window no longer supports app tools`);
              let i,
                o = () => {
                  i ??=
                    (this.messageHandler.cancelDynamicAppToolResponse(e.params.callId),
                    n.cancelToolCall(e));
                };
              t.addEventListener(`abort`, o, { once: !0 });
              try {
                if ((t.aborted && o(), t.throwIfAborted(), !(await n.dispatchToolCall(e)))) {
                  (t.throwIfAborted(),
                    this.messageHandler.discardDynamicAppToolResponse(e.params.callId));
                  continue;
                }
                return (t.throwIfAborted(), await c);
              } finally {
                (t.removeEventListener(`abort`, o),
                  await i?.catch((e) => {
                    G5.warning(`Failed to cancel dynamic app tool call`, {
                      safe: {},
                      sensitive: { error: e },
                    });
                  }));
              }
            } catch (e) {
              s.e = e;
            } finally {
              s.d();
            }
          } catch (t) {
            throw (this.messageHandler.discardDynamicAppToolResponse(e.params.callId), t);
          }
        }
        if (!i) throw Error(`No ready app window supports app tools`);
        return null;
      }
      async handleMessage(e, t) {
        (await this.messageHandler.handleMessage(e, t),
          t.type === `ready` &&
            (this.readyAppViewWebContentsIds.add(e.id),
            this.options.windowManager.getRendererWindowLogFields(e).rendererWindowAppearance ===
              `primary` &&
              this.appServerConnectionRegistry
                .getMaybeConnection(`local`)
                ?.getCachedAuthenticatedPrincipal() != null &&
              this.detachedWindowManager?.startPrewarming(e),
            this.flushPendingAmbientSuggestionGenerationEvents(),
            this.flushPendingAutomationCapabilityEvents(),
            this.flushPendingAutomationRunTriggeredEvents()));
      }
      getBrowserHostManager() {
        return this.messageHandler.getBrowserHostManager();
      }
      getBrowserSessionRegistry() {
        return this.messageHandler.getBrowserSessionRegistry();
      }
      getProjectsManager() {
        return this.projectsManager;
      }
      getArtifactSessionHostViewerConnectionInfo() {
        if (!Tr().artifactSession) return null;
        let e = this.options.artifactSessionHostLifecycle;
        return e?.isViewerAvailable() === !0 ? e.getViewerConnectionInfo() : null;
      }
      startConversationExecutor() {
        this.conversationExecutor;
      }
      markPrimaryWindowContentReady(e) {
        this.primaryWindowContentReady.resolve({
          processStartedAtMs: R.performance.timeOrigin,
          phaseDurationsMs: e,
        });
      }
      refreshBrowserSettingsSync() {
        this.browserSettingsSync.requestRefresh();
      }
      setDynamicAppToolsPipePath(e) {}
      sendAmbientSuggestionGenerationEvent(e) {
        let t = this.options.windowManager.getPrimaryWindow();
        if (t == null) {
          this.pendingAmbientSuggestionGenerationEvents.push(e);
          return;
        }
        this.options.windowManager.sendMessageToWebContents(t.webContents, {
          type: `ambient-suggestion-generation`,
          event: e,
        });
      }
      flushPendingAmbientSuggestionGenerationEvents() {
        let e = this.pendingAmbientSuggestionGenerationEvents;
        this.pendingAmbientSuggestionGenerationEvents = [];
        for (let t of e) this.sendAmbientSuggestionGenerationEvent(t);
      }
      stopCodexMicro() {
        return this.codexMicroServiceManager.stop();
      }
      async dispose() {
        (this.hostAppServerManagers.dispose(), await this.threadProjectAssignments.flush());
        let e = this.appServerConnectionRegistry.getAllHostIds();
        (this.contentTabServiceManager?.dispose(),
          this.messageHandler.dispose(),
          await this.terminalManager.dispose(),
          this.disposables.dispose());
        for (let t of e)
          (this.appServerConnectionRegistry.getMaybeConnection(t)?.dispose(),
            this.appServerConnectionRegistry.removeConnection(t),
            this.executionHostRegistry.remove(t));
        (this.registeredWindows.clear(),
          this.appViewsByWebContentsId.clear(),
          this.downloadsViewPublisher.dispose(),
          this.readyAppViewWebContentsIds.clear());
        for (let { dispose: e } of this.ipcClientsByWebContentsId.values()) e();
        (this.ipcClientsByWebContentsId.clear(), await null);
      }
      getMessageHandler() {
        return this.messageHandler;
      }
      getHabitatAutomationsService() {
        return this.habitatAutomationsService;
      }
      getSharedObject(e) {
        return this.sharedObjectRepository.get(e);
      }
      getAppUpdateViewState() {
        return {
          downloadProgressPercent: this.options.sparkleManager.getDownloadProgressPercent(),
          downloadedUpdateAppBrand: this.options.sparkleManager.getDownloadedUpdateAppBrand(),
          installProgressPercent: this.options.sparkleManager.getInstallProgressPercent(),
          isUpdateReady: this.options.sparkleManager.getIsUpdateReady(),
          lifecycleState: this.options.sparkleManager.getUpdateLifecycleState(),
          relaunchNotice: this.options.sparkleManager.getRelaunchNotice(),
          supportsAutoInstallWhenIdle: this.options.sparkleManager.getSupportsAutoInstallWhenIdle(),
        };
      }
      getDownloadsSnapshot() {
        return this.messageHandler.getBrowserHostManager().downloadStore.getSnapshot();
      }
      getSharedObjectSnapshot() {
        return this.sharedObjectRepository.getSnapshot();
      }
      getInitialSidebarBootstrap() {
        let e = this.threadCatalogSyncManager;
        if (e == null)
          return {
            globalStateEntries: H5.map((e) => ({
              key: e,
              value: this.fetchHandler.getGlobalStateValue(e),
            })),
            ...this.fetchHandler.getInitialSidebarWorkspaceState(),
          };
        let t = this.appState.get(n.iu.REMOTE_CONNECTION_AUTO_CONNECT_BY_HOST_ID) ?? {},
          r = new Set(
            this.getSharedRemoteConnections()
              .filter(({ autoConnect: e }) => e)
              .map(({ hostId: e }) => e),
          ),
          i = this.appServerConnectionRegistry.getConnection(J).getCachedAuthenticatedPrincipal(),
          a = i == null ? null : `chatgpt:${i.accountId}:${i.userId}`,
          o = e
            .readStatus()
            .hosts.map(({ hostId: e }) => e)
            .filter((n) =>
              n.startsWith(`chatgpt:`)
                ? n === a && e.getCoordinator(n) != null
                : n === `local` ||
                  t[n] === !0 ||
                  (t[n] !== !1 && (r.has(n) || n.startsWith(`remote-wsl:`))),
            ),
          s = new Set(o),
          c =
            this.appState.get(`electron-persisted-atom-state`)?.[`thread-sort-key`] === `created_at`
              ? `created_at`
              : `updated_at`,
          l = this.appState.get(n.iu.SELECTED_PROJECT),
          u =
            l?.type === `remote`
              ? this.appState.get(n.iu.REMOTE_PROJECTS)?.find(({ id: e }) => e === l.projectId)
              : void 0,
          d = u?.hostId ?? `local`,
          f = this.appState.get(n.iu.SIDEBAR_PROJECT_THREAD_ORDERS) ?? {},
          p = this.appState.get(n.iu.PINNED_THREAD_IDS) ?? [],
          m = this.appState.get(n.iu.THREAD_PROJECT_ASSIGNMENTS) ?? {};
        function* h() {
          if ((yield* p, l != null)) {
            yield* f[l.projectId]?.threadIds ?? [];
            let e = 100;
            for (let t in m) {
              if (e-- === 0) break;
              let n = m[t];
              n?.projectKind === l.type && n.projectId === l.projectId && (yield t);
            }
          }
          let e = 100;
          for (let t in f) {
            if (e-- === 0) break;
            yield* (f[t]?.threadIds ?? []).slice(0, 10);
          }
        }
        let g = [],
          _ = new Set(),
          v = 100,
          y = 100;
        for (let t of h()) {
          if (v-- === 0) break;
          if (t.length === 0) continue;
          let n = e.readThreadHostId(t);
          if (
            (n != null &&
              !s.has(n) &&
              (n = [d, ...o.slice(0, y)].find(
                (n) =>
                  s.has(n) &&
                  y > 0 &&
                  y-- > 0 &&
                  e.readEntries([{ hostId: n, threadId: t }]).length > 0,
              )),
            n == null || !s.has(n))
          )
            continue;
          let r = `${n}\0${t}`;
          _.has(r) || (_.add(r), g.push({ hostId: n, threadId: t }));
        }
        let b = e.readEntries(g),
          x = 100 - g.length,
          S = (t, n) => {
            if (x === 0 || !s.has(t)) return;
            let r = Math.min(10, x);
            x -= r;
            let { entries: i } = e.readPage({
              hostId: t,
              limit: r,
              sortKey: c,
              filter: n && {
                cwdValues: n,
                cwdPrefixes: n.map((e) =>
                  /[\\/]$/.test(e) ? e : `${e}${e.includes(`\\`) ? `\\` : `/`}`,
                ),
                includeThreadIds: [],
                excludeThreadIds: [],
              },
            });
            for (let e of i) {
              let t = `${e.hostId}\0${e.threadId}`;
              _.has(t) || (_.add(t), b.push(e));
            }
          },
          C = u == null ? [] : [u.remotePath];
        (l?.type === `local` &&
          (C = this.appState.get(n.iu.LOCAL_PROJECTS)?.[l.projectId]?.rootPaths ?? []),
          C.length > 0 && S(d, C));
        for (let e of o) {
          if (x === 0) break;
          S(e);
        }
        return {
          catalogEntries: b,
          catalogHostIds: o,
          globalStateEntries: H5.map((e) => ({
            key: e,
            value: this.fetchHandler.getGlobalStateValue(e),
          })),
          ...this.fetchHandler.getInitialSidebarWorkspaceState(),
        };
      }
      getHostConfigForHostId(e) {
        if (e === `local`) return ls;
        if (this.durableThreadHostConfig?.id === e) return this.durableThreadHostConfig;
        let t = this.getSharedRemoteConnections().find((t) => t.hostId === e);
        if (!t) throw Error(`Host config for host ID ${e} not found`);
        return m4(t);
      }
      getSharedRemoteConnections() {
        return [
          ...(this.sharedObjectRepository.get(`remote_ssh_connections`) ?? []),
          ...(this.sharedObjectRepository.get(`remote_wsl_connections`) ?? []),
          ...(this.sharedObjectRepository.get(`remote_control_connections`) ?? []),
        ];
      }
      clearSitesAuthentication() {
        let e = this.getBrowserHostManager(),
          t = e.getBrowserSession();
        t != null &&
          (e.cancelSiteBootstraps(),
          Xc(t).catch((e) => {
            G5.warning(`Failed to clear Sites authentication cookies`, {
              safe: {},
              sensitive: { error: e },
            });
          }));
      }
      createAppServerConnection(e, t = ls, r = !1, i, s) {
        let c = {
            desktopOriginator: this.options.desktopOriginator,
            devApiBaseUrl: this.options.devApiBaseUrl,
            prodApiBaseUrl: this.options.prodApiBaseUrl,
          },
          u = o.t({ env: process.env, resourcesPath: process.resourcesPath }),
          d;
        if (n.Ts(t)) {
          if (i == null)
            throw Error(
              `Remote control transport requires a desktop app-server client for authentication.`,
            );
          if (s == null)
            throw Error(`Remote control transport requires the remote-control device-key client.`);
          d = K5({
            transportKind: `remote-control`,
            hostConfig: t,
            repoRoot: this.options.repoRoot,
            resourcesPath: u,
            desktopApiOptions: c,
            desktopAuthAppServerClient: i,
            remoteControlDeviceKeyClient: s,
            globalState: this.appState,
            getSshConnectTimeoutSeconds: () => this.sshConnectTimeoutSeconds,
            onEnrollmentAuthorizationRequired: () =>
              this.remoteConnectionsHandler.handleRemoteControlEnrollmentAuthorizationRequired(),
          });
        } else
          d = K5({
            transportKind: `standard`,
            hostConfig: t,
            repoRoot: this.options.repoRoot,
            resourcesPath: u,
            desktopApiOptions: c,
            desktopAuthAppServerClient: i,
            globalState: this.appState,
            getSshConnectTimeoutSeconds: () => this.sshConnectTimeoutSeconds,
          });
        let f = this.options.hostProcess.getVersion(),
          p = new n.un(this.options.messageChannel, {
            buildFlavor: this.options.buildFlavor,
            clientInfo: { name: a.Tt, title: `Codex Desktop`, version: f },
            defaultServiceName: a.wt,
            repoRoot: this.options.repoRoot,
            resourcesPath: u,
            errorReporter: this.options.errorReporter,
            sharedObjectRepository: this.sharedObjectRepository,
            getStatsigEvaluations: () => this.publishedStatsig,
            hostId: e,
            hostConfig: t,
            continueWaitingForStdioInitializeTimeout: t.id === J,
            onAutomationCapabilityEvent: (e) => {
              (this.sendAutomationCapabilityEvent(e),
                FOe(
                  p,
                  e,
                  () =>
                    Array.from(this.ipcClientsByWebContentsId.values(), ({ hostService: e }) => e),
                  this.appViewsByWebContentsId.values(),
                ));
            },
            onAutomationRunTriggeredEvent: (e) => {
              this.sendAutomationRunTriggeredEvent(e);
            },
            onChatgptAuthTokenUnavailable:
              t.id === `local` ? () => this.clearSitesAuthentication() : void 0,
            transformOutgoingMessage: lne({
              getHostLifecycle: () => this.options.artifactSessionHostLifecycle ?? null,
              getExpectedThreadConfig: () =>
                vi({
                  enabled: Tr().artifactSession,
                  hostLifecycle: this.options.artifactSessionHostLifecycle ?? null,
                  isPackaged: l.app.isPackaged,
                  repoRoot: this.options.repoRoot,
                  shouldUseWslPaths: !1,
                }),
              isLocalStdio: () => e === `local` && t.id === `local` && d.kind === `stdio`,
            }),
            onArchiveCleanup: (t, n) => this.managedWorktrees.cleanupForArchivedThread(e, t, n),
            ...POe(e, () => this.habitatAutomationsService),
            transport: d,
            hostProcess: this.options.hostProcess,
            isOnline: () => l.net.isOnline(),
            supportsAttestationRequests: rr,
            isMcpAppsDilEnabled: () => Tr().dil,
            supportsOpenAIFormElicitation: !0,
            getSkysightRecorderController:
              t.id === `local` ? this.options.getSkysightRecorderController : void 0,
            onSkysightChronicleActivationStateChanged:
              t.id === `local`
                ? () => {
                    this.broadcastQueryCacheInvalidation([`chronicle-state`]);
                  }
                : void 0,
            prepareRemoteChatgptLoginPortForward: async () => {
              await DE({ caller: `ssh_connect` });
            },
            ensureAuth: r,
            getRemoteConnectionMaxRetryAttempts: () =>
              this.appState.get(n.iu.REMOTE_CONNECTION_MAX_RETRY_ATTEMPTS) ?? null,
          });
        if (t.id === `local` && this.options.onAppServerSqliteRecovery != null) {
          let e = this.options.onAppServerSqliteRecovery;
          p.registerInternalNotificationHandler((t) => {
            let n = Kee(t);
            n != null &&
              (G5.info(`App-server SQLite recovery config warning received`, {
                safe: {},
                sensitive: { backupFolder: n.backupFolder, databasePath: n.databasePath },
              }),
              e(n));
          });
        }
        return (
          p.registerInternalServerRequestHandler({
            methods: [`item/commandExecution/requestApproval`, `mcpServer/elicitation/request`],
            handler: (t) => (this.messageHandler.revealWindowsReviewRequest(e, t), null),
          }),
          p.registerInternalServerRequestHandler({
            methods: [`attestation/generate`],
            handler: or({
              bundleIdentifier: a.rn(this.options.buildFlavor),
              getSignals: EOe,
              resourcesPath: u,
            }),
          }),
          Zk(p, this.scopedState),
          p
        );
      }
      sendAutomationCapabilityEvent(e) {
        let t = this.options.windowManager.getPrimaryWindow();
        if (t == null) {
          this.queueAutomationCapabilityEvent(e);
          return;
        }
        let n = t.webContents.id,
          r = this.appViewsByWebContentsId.get(n);
        if (r == null || !this.readyAppViewWebContentsIds.has(n)) {
          this.queueAutomationCapabilityEvent(e);
          return;
        }
        r.services
          .then(({ clientCoordination: t }) =>
            t.automationCapabilityEventReceived({ sourceClientId: `desktop`, params: e }),
          )
          .catch((e) => {
            G5.warning(`Failed to publish automation capability event`, {
              safe: {},
              sensitive: { error: e },
            });
          });
      }
      queueAutomationCapabilityEvent(e) {
        let t = this.pendingAutomationCapabilityEvents.length - $nt,
          n = this.pendingAutomationCapabilityEvents[t];
        (n != null &&
          (this.pendingAutomationCapabilityEvents[t] = {
            ...n,
            usage: { skillPathCandidates: [], toolCalls: [], truncated: !0 },
          }),
          this.pendingAutomationCapabilityEvents.push(e));
      }
      flushPendingAutomationCapabilityEvents() {
        let e = this.pendingAutomationCapabilityEvents;
        this.pendingAutomationCapabilityEvents = [];
        for (let t of e) this.sendAutomationCapabilityEvent(t);
      }
      sendAutomationRunTriggeredEvent(e) {
        let t = this.options.windowManager.getPrimaryWindow();
        if (t == null) {
          this.pendingAutomationRunTriggeredEvents.push(e);
          return;
        }
        let n = t.webContents.id,
          r = this.appViewsByWebContentsId.get(n);
        if (r == null || !this.readyAppViewWebContentsIds.has(n)) {
          this.pendingAutomationRunTriggeredEvents.push(e);
          return;
        }
        r.services
          .then(({ clientCoordination: t }) =>
            t.automationRunTriggeredEventReceived({ sourceClientId: `desktop`, params: e }),
          )
          .catch((e) => {
            G5.warning(`Failed to publish automation run-triggered event`, {
              safe: {},
              sensitive: { error: e },
            });
          });
      }
      flushPendingAutomationRunTriggeredEvents() {
        let e = this.pendingAutomationRunTriggeredEvents;
        this.pendingAutomationRunTriggeredEvents = [];
        for (let t of e) this.sendAutomationRunTriggeredEvent(t);
      }
      createAndRegisterRemoteConnection(e) {
        let t = m4(e),
          n = this.createAppServerConnection(
            e.hostId,
            t,
            !0,
            this.getLocalAppServerClient(),
            this.remoteControlDeviceKeyClient,
          );
        (this.executionHostRegistry.add(e.hostId, n),
          this.threadCatalogSyncManager?.attachSource(M5(e.hostId, trt(e), n)));
        for (let e of this.registeredWindows.values()) n.registerWebviewWindow(e);
        return n;
      }
      disposeRemoteConnection(e) {
        this.threadCatalogSyncManager?.detachSource(e);
        let t = this.appServerConnectionRegistry.getMaybeConnection(e);
        t &&
          (t.dispose(),
          this.appServerConnectionRegistry.removeConnection(e),
          this.executionHostRegistry.remove(e));
      }
      getLocalAppServerClient() {
        return this.appServerConnectionRegistry.getConnection(J);
      }
      getLocalAuthToken({ refreshToken: e }) {
        return this.getLocalAppServerClient().getAuthToken({ refreshToken: e });
      }
      getAppServerClient(e = J) {
        return this.executionHostRegistry.get(e);
      }
      registerIpcClientForWebContents(e) {
        let t = this.appServerConnectionRegistry.getConnection(J);
        if (!this.localClientCoordinationEnabled || this.ipcClientsByWebContentsId.has(e.id)) return;
        let r = new n.v(`desktop`, this.errorReporter),
          i = {
            client: r,
            hostService: new BO(
              r,
              t,
              this.threadReadState.getContext,
              this.accessInputs.invalidateQueryCache,
            ),
            removeViewServiceHandlers: null,
            dispose: () => {
              (i.removeViewServiceHandlers?.(),
                (i.removeViewServiceHandlers = null),
                r.dispose(),
                this.messageHandler.resolvePendingDynamicToolsForThreadStartRequestsForOrigin(e));
            },
          };
        (this.ipcClientsByWebContentsId.set(e.id, i),
          e.once(`destroyed`, () => {
            this.disposeIpcClientForWebContents(e);
          }));
      }
      disposeIpcClientForWebContents(e) {
        let t = this.ipcClientsByWebContentsId.get(e.id);
        t && (this.ipcClientsByWebContentsId.delete(e.id), t.dispose());
      }
    };
}

if (typeof module !== "undefined") module.exports = { createWindowContextClass };
