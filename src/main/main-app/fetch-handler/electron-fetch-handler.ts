// @ts-nocheck

export function createElectronFetchHandlerClass(dependencies) {
  const {
    $o,
    BH,
    CBe,
    CMe,
    DBe,
    Fie,
    Fte,
    GH,
    Hn,
    Hr,
    Ir,
    J,
    JI,
    Js,
    KH,
    Ln,
    NBe,
    Pj,
    Pr,
    QOe,
    QRe,
    Qie,
    SO,
    TV,
    Tr,
    Un,
    VIe,
    Vee,
    Vr,
    XH,
    YH,
    Ys,
    ZOe,
    _Ie,
    a,
    avatarOverlayAcceleratorFromKeymap,
    b,
    bt,
    bundledSkillsRoot,
    cD,
    cT,
    computeScreenshotTarget,
    ds,
    eke,
    fze,
    h,
    iH,
    iMe,
    ize,
    jH,
    kwe,
    l,
    lH,
    lIe,
    listWorkspaceDirectory,
    ls,
    lze,
    mae,
    n,
    ns,
    oH,
    os,
    p,
    pH,
    pze,
    qH,
    qs,
    rH,
    sD,
    sftpDownload,
    sftpUpload,
    startMacCapture,
    startWindowsCapture,
    tje,
    tke,
    tl,
    uH,
    validateGlobalHotkeySetting,
    vi,
    wV,
    xt,
    zIe,
    zn,
  } = dependencies;
  return class ElectronFetchHandler {
      globalState;
      projectsManager;
      threadProjectAssignments;
      appServerConnectionRegistry;
      appServerClient;
      remoteConnectionsHandler;
      hotkeyWindowLifecycleManager;
      windowManager;
      isWorkspaceDependenciesFeatureEnabled;
      getAppServerClientForHostId;
      getWorktreeService;
      requestGitWorker;
      sharedObjectRepository;
      errorReporter;
      repoRoot;
      globalDictationHotkeyController;
      clearBrowserBrowsingData;
      refreshApplicationMenu;
      requestComputerUseCaptureWorker;
      subscribeComputerUseCaptureWorkerEvent;
      refreshBrowserOwnerCommandAccelerators;
      settingsStore;
      updateDockIcon;
      getFeedbackDesktopLogEntries;
      executionCodexHome;
      requestDynamicToolsForThreadStart;
      onCoworkImportedSessionThreadIds;
      windowsCaptureNativeBridge;
      syncAvatarOverlayHotkey;
      getArtifactSessionHostLifecycle;
      syncBrowserSettings;
      statsig;
      habitatAutomationsService;
      isHostedAutomationAppAvailable;
      prepareCronTurnReadState;
      pinnedThreadsService;
      automationsService;
      bundledSkillsRoot;
      realtimeSessionRecorder;
      realtimeVoiceHotkeyController;
      voiceActivationController;
      queuedFollowUpSendLocks = new Vee();
      getInitialSidebarWorkspaceState() {
        let e = this.shouldUseWslPaths();
        return {
          workspaceRootOptions: this.projectsManager.getLocalWorkspaceRootOptionsSync(),
          projectlessWorkspaceRoot: {
            workspaceRoot: zn(
              xt({
                configuredWorkspaceRoot: this.settingsStore?.getEffective(
                  n.Fa.projectlessWorkspaceRoot.key,
                ),
                homeDirectory: (0, p.homedir)(),
                path: h,
              }),
              e,
            ),
          },
        };
      }
      settings;
      constructor(
        e,
        t,
        r,
        i,
        o = i.getConnection(J),
        s,
        c,
        l,
        u,
        d = (e) => {
          throw Error(`App server state for host ID 1 ${e} not found`);
        },
        f = () => {
          throw Error(`Worktree service unavailable`);
        },
        p,
        m,
        h = a.vn,
        g = process.cwd(),
        _ = NBe,
        v = async () => void 0,
        y = () => {},
        b,
        x,
        S = () => {},
        C,
        w = () => {},
        T,
        E = () => [],
        D,
        O = n.Oi({ preferWsl: n.zi(ls) }),
        k = async () => [],
        A,
        j,
        M = null,
        N = () => {},
        P = () => null,
        F,
        I,
        L,
        R = async () => !1,
        z,
        B,
      ) {
        ((this.globalState = e),
          (this.projectsManager = t),
          (this.threadProjectAssignments = r),
          (this.appServerConnectionRegistry = i),
          (this.appServerClient = o),
          (this.remoteConnectionsHandler = s),
          (this.hotkeyWindowLifecycleManager = c),
          (this.windowManager = l),
          (this.isWorkspaceDependenciesFeatureEnabled = u),
          (this.getAppServerClientForHostId = d),
          (this.getWorktreeService = f),
          (this.requestGitWorker = p),
          (this.sharedObjectRepository = m),
          (this.errorReporter = h),
          (this.repoRoot = g),
          (this.globalDictationHotkeyController = _),
          (this.clearBrowserBrowsingData = v),
          (this.refreshApplicationMenu = y),
          (this.requestComputerUseCaptureWorker = b),
          (this.subscribeComputerUseCaptureWorkerEvent = x),
          (this.refreshBrowserOwnerCommandAccelerators = S),
          (this.settingsStore = C),
          (this.updateDockIcon = w),
          (this.getFeedbackDesktopLogEntries = E),
          (this.executionCodexHome = O),
          (this.requestDynamicToolsForThreadStart = k),
          (this.onCoworkImportedSessionThreadIds = j),
          (this.windowsCaptureNativeBridge = M),
          (this.syncAvatarOverlayHotkey = N),
          (this.getArtifactSessionHostLifecycle = P),
          (this.syncBrowserSettings = F),
          (this.statsig = I),
          (this.habitatAutomationsService = L),
          (this.isHostedAutomationAppAvailable = R),
          (this.prepareCronTurnReadState = z),
          (this.settings =
            C == null
              ? void 0
              : new CBe(
                  C,
                  (e, t) => {
                    (this.applySettingSideEffects(e, t),
                      Fie(e) && ns({ settingsStore: C, repoRoot: this.repoRoot }));
                  },
                  I,
                )),
          (this.automationsService = new CMe(e, i, L)),
          (this.pinnedThreadsService = new jH(e, i, l, B)),
          (this.realtimeSessionRecorder = T),
          (this.realtimeVoiceHotkeyController = D),
          (this.bundledSkillsRoot = bundledSkillsRoot()),
          n
            .l({
              refresh: !1,
              preferWsl: GH,
              bundledRepoRoot: this.bundledSkillsRoot,
              appServerClient: this.appServerClient,
            })
            .catch((e) => {
              KH().warning(`Failed to warm recommended skills cache`, {
                safe: {},
                sensitive: { error: e },
              });
            }));
      }
      async createProjectlessThreadPaths({
        hostId: e,
        createSplitDirectories: t,
        directoryName: r,
        prompt: i,
      }) {
        let a = this.getRequestAppServerClient(e),
          o = await ds({
            appServerClient: a,
            configuredWorkspaceRoot: n.Es(a.hostConfig)
              ? null
              : this.settingsStore?.getEffective(n.Fa.projectlessWorkspaceRoot.key),
            createSplitDirectories: t,
            directoryName: r,
            homeDirectory: n.Es(a.hostConfig)
              ? (a.hostConfig.home_dir ??
                bt({ codexHome: await a.codexHome(), path: await a.platformPath() }))
              : (0, p.homedir)(),
            prompt: i,
          }),
          s = n.zi(a.hostConfig);
        return {
          cwd: zn(o.cwd, s),
          outputDirectory: zn(o.outputDirectory, s),
          workspaceRoot: zn(o.workspaceRoot, s),
        };
      }
      async recordProjectlessThread({ outputDirectory: e, threadId: t, workspaceRoot: r }) {
        (await this.threadProjectAssignments.setProjectless({ threadId: n.$u(t), projectless: !0 }),
          this.globalState.update(n.iu.THREAD_WORKSPACE_ROOT_HINTS, (e) => ({ ...e, [t]: r })),
          this.globalState.update(n.iu.THREAD_PROJECTLESS_OUTPUT_DIRECTORIES, (n) => ({
            ...n,
            [t]: e,
          })),
          this.windowManager.sendMessageToAllWindows({
            type: `global-state-updated`,
            keys: [n.iu.THREAD_WORKSPACE_ROOT_HINTS, n.iu.THREAD_PROJECTLESS_OUTPUT_DIRECTORIES],
          }));
      }
      handlers = {
        "workspace-root-options": async ({ canonicalizeRoots: e, hostId: t, signal: r }) => {
          let i = this.getAppServerClientForHostIdOrThrow(t),
            a = await this.projectsManager.getWorkspaceRootOptions(t === `local` ? ls : i.hostConfig),
            o = Array.from(new Set([...(t === `local` ? [] : a.roots), ...(e ?? [])])),
            s = { ...a.canonicalPathByRoot, ...(o.length === 0 ? {} : await n.Lt(o, i, r)) };
          return { ...a, ...(Object.keys(s).length === 0 ? {} : { canonicalPathByRoot: s }) };
        },
        "electron-clone-workspace-repo": async () => ({
          success: !1,
          canceled: !1,
          error: `Not implemented in Electron.`,
        }),
        "worktree-create-managed": async ({
          hostId: e,
          cwd: t,
          startingState: n,
          localEnvironmentConfigPath: r,
          streamId: i,
        }) =>
          this.getWorktreeService(e).createManagedWorktree({
            hostId: e,
            cwd: t,
            startingState: n,
            localEnvironmentConfigPath: r,
            streamId: i,
          }),
        "worktree-delete": async ({ hostId: e, worktree: t, reason: n }) => {
          await this.getWorktreeService(e).deleteWorktree(t, n);
        },
        "worktree-set-owner-thread": async ({ hostId: e, worktree: t, conversationId: n }) => {
          await this.getWorktreeService(e).setOwnerThread({ worktree: t, conversationId: n });
        },
        "codex-home": (e) => this.readCodexHomePaths(e ?? {}),
        "projectless-thread-cwd": async (e) =>
          this.createProjectlessThreadPaths({
            hostId: e?.hostId,
            createSplitDirectories: e?.createSplitDirectories !== !1,
            directoryName: e?.directoryName ?? null,
            prompt: e?.prompt ?? null,
          }),
        "projectless-workspace-root": async () => ({
          workspaceRoot: zn(
            await Qie({
              appServerClient: this.appServerClient,
              configuredWorkspaceRoot: this.settingsStore?.getEffective(
                n.Fa.projectlessWorkspaceRoot.key,
              ),
              homeDirectory: (0, p.homedir)(),
            }),
            this.shouldUseWslPaths(),
          ),
        }),
        "home-directory": async (e) => ({ homeDirectory: await this.getHomeDirectory(e?.hostId) }),
        "auto-deny-some-permissions": async ({
          hostId: e,
          permissions: t,
          threadDetailLevel: r,
        }) => ({
          permissions: n.Ht({
            homeDirectory: await this.getHomeDirectory(e),
            permissions: t,
            threadDetailLevel: r,
          }),
        }),
        "download-internal-plugins": async ({
          config: e,
          hostId: t,
          largeInternalPluginsConfig: n,
        }) => (
          fze(t),
          lze({
            appServerConnection: this.appServerConnectionRegistry.getConnection(J),
            config: e,
            codexHome: this.executionCodexHome,
            errorReporter: this.errorReporter,
            getInternalUpdateCdnRequestHeaders: void 0,
            largeInternalPluginsConfig: n,
            shouldUseWslPaths: this.shouldUseWslPaths(),
          })
        ),
        "app-connect-oauth-callback-url": async () => ({
          callbackUrl: `${a.g(l.app.isPackaged)}://connector/oauth_callback`,
        }),
        "fast-mode-rollout-metrics": async (e) =>
          n.et({ codexHome: n.Oi({ preferWsl: GH }), params: e }),
        "refresh-remote-connections": async () =>
          this.remoteConnectionsHandler.refreshRemoteConnections(),
        "discover-remote-ssh-connections": async () =>
          this.remoteConnectionsHandler.discoverRemoteConnections(),
        "refresh-remote-control-connections": async () =>
          this.remoteConnectionsHandler.refreshRemoteControlConnections(),
        "rename-remote-control-environment": async ({ envId: e, name: t }) =>
          this.remoteConnectionsHandler.renameRemoteControlEnvironment({ envId: e, name: t }),
        "delete-remote-control-environment": async ({ envId: e }) =>
          this.remoteConnectionsHandler.deleteRemoteControlEnvironment({ envId: e }),
        "authorize-remote-control-connections": async () =>
          this.remoteConnectionsHandler.authorizeRemoteControlConnections(),
        "set-remote-control-connections-enabled": async ({ enabled: e, origin: t }) => {
          if (!this.windowManager.getPrimaryWindows().some((e) => e.webContents === t)) {
            let e = this.sharedObjectRepository?.get(`remote_control_connections`);
            if (e == null) throw Error(`Remote control connections are unavailable`);
            return { remoteControlConnections: e };
          }
          return this.remoteConnectionsHandler.setRemoteControlConnectionsEnabled(e);
        },
        "set-remote-wsl-connections-enabled": async ({ enabled: e, origin: t }) =>
          this.windowManager.getPrimaryWindows().some((e) => e.webContents === t)
            ? this.remoteConnectionsHandler.setRemoteWslConnectionsEnabled(e)
            : {
                remoteWslConnections:
                  this.sharedObjectRepository?.get(`remote_wsl_connections`) ?? [],
              },
        "set-local-remote-control-enabled": async ({ enabled: e }) => {
          let t = n.Y({ enabled: e });
          return (
            this.sharedObjectRepository?.set(`local_remote_control_enabled`, t),
            { enabled: t }
          );
        },
        "save-codex-managed-remote-ssh-connections": async ({ remoteConnections: e }) =>
          this.remoteConnectionsHandler.saveCodexManagedRemoteSshConnections(e),
        "set-remote-connection-auto-connect": async ({ hostId: e, autoConnect: t }) =>
          this.remoteConnectionsHandler.setRemoteConnectionAutoConnect(e, t),
        "install-remote-codex": async ({ hostId: e }) =>
          this.remoteConnectionsHandler.installRemoteCodex(e),
        "start-remote-chatgpt-login-port-forward": async ({ hostId: e, loginId: t }) =>
          this.remoteConnectionsHandler.startRemoteChatgptLoginPortForward(e, t),
        "stop-remote-chatgpt-login-port-forward": async ({ hostId: e, loginId: t }) =>
          this.remoteConnectionsHandler.stopRemoteChatgptLoginPortForward(e, t),
        "app-server-connection-state": async ({ hostId: e }) =>
          this.remoteConnectionsHandler.appServerConnectionState(e),
        "remote-workspace-directory-entries": async ({
          hostId: e,
          directoryPath: t,
          directoriesOnly: n,
        }) => this.remoteConnectionsHandler.remoteWorkspaceDirectoryEntries(e, t, n),
        "workspace-directory-entries": async ({
          hostId: e,
          workspaceRoot: t,
          directoryPath: r,
          directoriesOnly: i,
          includeHidden: a,
        }) => {
          let o = this.getRequestAppServerClient(e ?? void 0),
            s = o.hostConfig,
            c = s.id === `local` && this.shouldUseWslPaths(),
            l = n.Es(s) ? t : (Un(t, s) ?? t),
            {
              directoryPath: u,
              entries: d,
              parentPath: f,
            } = await listWorkspaceDirectory({
              appServerClient: o,
              directoryPath: r,
              directoriesOnly: i,
              includeHidden: a,
              workspaceRoot: l,
            });
          return { workspaceRoot: zn(l, c), directoryPath: u, parentPath: f, entries: d };
        },
        "has-custom-cli-executable": async () => (
          this.appServerConnectionRegistry.getConnection(J),
          { hasCustomCliExecutable: n.fn() }
        ),
        "account-info": () => cT(this.appServerConnectionRegistry),
        "email-domain-mail-provider": async ({ domain: e }) => ({ provider: await n.dt(e) }),
        "third-party-notices": async () => ({ text: await DBe() }),
        "locale-info": async () => ({
          ideLocale: l.app.getLocale(),
          systemLocale: l.app.getSystemLocale(),
        }),
        "os-info": async () => ({
          platform: process.platform,
          osVersion: await n.d(),
          osRelease: p.default.release(),
          isSystemBackdropSupported: BH(),
          isVsCodeRunningInsideWsl: !1,
          isCodexRunningInsideWsl: n.Ri(),
          windowsAccountType: SO(),
        }),
        "wsl-bash-availability": async () => n.Ii(),
        "browser-browsing-data-clear": async ({ dataTypes: e }) => {
          await this.clearBrowserBrowsingData(e);
        },
        "browser-use-origin-state-read": async () => cD(),
        "browser-use-approval-mode-write": async ({ approvalMode: e }) =>
          ZOe(e, n.Oi(), this.syncBrowserSettings, () =>
            this.assertBrowserUseGlobalPersistentApprovalAllowed(e),
          ),
        "browser-use-history-approval-mode-write": async ({ approvalMode: e }) =>
          QOe(e, n.Oi(), this.syncBrowserSettings, () =>
            this.assertBrowserUseGlobalPersistentApprovalAllowed(e),
          ),
        "browser-use-file-transfer-approval-mode-write": async ({ approvalMode: e, kind: t }) =>
          eke(t, e, n.Oi(), this.syncBrowserSettings, () =>
            this.assertBrowserUseGlobalPersistentApprovalAllowed(e),
          ),
        "browser-use-full-cdp-access-enabled-write": async ({ enabled: e }) =>
          tke(e, n.Oi(), this.syncBrowserSettings),
        "node-repl-active-execs-kill": async ({ sessionId: e, turnId: t }) =>
          n.k({ codexHome: n.Oi({ preferWsl: this.shouldUseWslPaths() }), sessionId: e, turnId: t }),
        "is-packaged": async () => ({ isPackaged: l.app.isPackaged }),
        "global-dictation-hotkey-state": async () => this.globalDictationHotkeyController.getState(),
        "global-dictation-set-hotkey": async ({ hotkey: e }) => {
          let t = this.globalDictationHotkeyController.setHotkey(e);
          return (
            t.success &&
              (await n.Tt({
                commandId: `globalDictationHold`,
                update: e == null ? { type: `clear` } : { type: `set`, accelerator: e },
              })),
            t
          );
        },
        "global-dictation-set-toggle-hotkey": async ({ hotkey: e }) => {
          let t = this.globalDictationHotkeyController.setToggleHotkey(e);
          return (
            t.success &&
              (await n.Tt({
                commandId: `globalDictationToggle`,
                update: e == null ? { type: `clear` } : { type: `set`, accelerator: e },
              })),
            t
          );
        },
        "codex-command-keymap-state": async () => {
          await uH({
            commandId: `hotkeyWindow`,
            hotkey: this.hotkeyWindowLifecycleManager.getState().configuredHotkey,
          });
          let e = this.globalDictationHotkeyController.getState();
          return (
            await uH({ commandId: `globalDictationHold`, hotkey: e.configuredHotkey }),
            await uH({ commandId: `globalDictationToggle`, hotkey: e.configuredToggleHotkey }),
            {
              ...(await n.St()),
              primaryNumberShortcutTarget: Tr().unifiedTabStrip
                ? this.settingsStore?.getEffective(n.Ia.primaryNumberShortcutTarget.key)
                : void 0,
            }
          );
        },
        "set-codex-command-keybinding": async ({ commandId: e, update: t }) => {
          validateGlobalHotkeySetting(e, t);
          let r = await n.St(),
            i = await n.Tt({
              commandId: e,
              update: t,
              primaryNumberShortcutTarget: Tr().unifiedTabStrip
                ? this.settingsStore?.getEffective(n.Ia.primaryNumberShortcutTarget.key)
                : void 0,
            }),
            a = avatarOverlayAcceleratorFromKeymap(r),
            o = avatarOverlayAcceleratorFromKeymap(i),
            s = e !== `openAvatarOverlay` && a !== o;
          return (
            s && o == null && this.syncAvatarOverlayHotkey(null),
            e === `hotkeyWindow` &&
              this.hotkeyWindowLifecycleManager.syncCommandKeybinding(lH(e, i).hotkey),
            (e === `globalDictationHold` || e === `globalDictationToggle`) &&
              this.globalDictationHotkeyController.syncCommandKeybindings({
                holdHotkey: lH(`globalDictationHold`, i).hotkey,
                toggleHotkey: lH(`globalDictationToggle`, i).hotkey,
              }),
            e === `realtimeVoice` &&
              this.realtimeVoiceHotkeyController?.syncCommandKeybinding(lH(e, i).hotkey),
            e === `openAvatarOverlay` && this.syncAvatarOverlayHotkey(o),
            s && o != null && this.syncAvatarOverlayHotkey(o),
            this.refreshApplicationMenu(),
            this.refreshBrowserOwnerCommandAccelerators(),
            i
          );
        },
        "reset-codex-command-keybindings": async () => {
          let e = {
            ...(await n.wt()),
            primaryNumberShortcutTarget: Tr().unifiedTabStrip
              ? this.settingsStore?.getEffective(n.Ia.primaryNumberShortcutTarget.key)
              : void 0,
          };
          return (
            this.hotkeyWindowLifecycleManager.syncCommandKeybinding(lH(`hotkeyWindow`, e).hotkey),
            this.syncAvatarOverlayHotkey(avatarOverlayAcceleratorFromKeymap(e)),
            this.globalDictationHotkeyController.syncCommandKeybindings({
              holdHotkey: lH(`globalDictationHold`, e).hotkey,
              toggleHotkey: lH(`globalDictationToggle`, e).hotkey,
            }),
            this.realtimeVoiceHotkeyController != null &&
              this.realtimeVoiceHotkeyController.syncCommandKeybinding(lH(`realtimeVoice`, e).hotkey),
            this.refreshApplicationMenu(),
            this.refreshBrowserOwnerCommandAccelerators(),
            e
          );
        },
        "feedback-desktop-log-archive": async ({
          hostId: e,
          includeBrowserTabs: t,
          includeDesktopLogs: r,
          includeNativeHostDiagnostics: i,
          includeProcessMemoryDiagnostics: a,
        }) => {
          let o = new Date(),
            s = this.getFeedbackDesktopLogEntries({ includeBrowserTabs: t, includeDesktopLogs: r });
          if (r) {
            let e = this.realtimeSessionRecorder;
            e != null && s.push(...(await kwe((t) => e.readMostRecentSessionLog(t), o)));
          }
          let c = r && a ? this.appServerConnectionRegistry.getMaybeConnection(e) : null;
          return wV(o, s, {
            getAppServerDiagnostics:
              c != null && n.Wu(c.appServerVersion, `diagnostics`)
                ? () => c.sendAppServerExtensionRequest(`server/diagnostics`, {})
                : void 0,
            includeDesktopLogs: r,
            includeNativeHostDiagnostics: i,
            includeProcessMemoryDiagnostics: a,
          });
        },
        "delete-feedback-desktop-log-archive": async ({ archiveId: e }) => ({ success: await TV(e) }),
        "openai-api-key": async () => ({ value: process.env.OPENAI_API_KEY ?? null }),
        "recommended-skills": async ({ hostId: e, refresh: t }) => {
          let r = this.getRequestAppServerClient(e);
          return n.l({
            refresh: t,
            preferWsl: GH,
            bundledRepoRoot: this.bundledSkillsRoot,
            appServerClient: r,
          });
        },
        "local-custom-agents": async ({ roots: e }) =>
          n.Si({ roots: e ?? [], preferWsl: GH, appServerClient: this.appServerClient }),
        "install-recommended-skill": async ({
          hostId: e,
          skillId: t,
          repoPath: r,
          installRoot: i,
          skillStatsigOverride: a,
          forceReinstall: o,
          source: s,
        }) => {
          try {
            let c = this.getRequestAppServerClient(e),
              { destination: l } = await n.c({
                skillId: t,
                repoPath: r,
                installRoot: i,
                skillStatsigOverride: a,
                forceReinstall: o,
                source: s,
                preferWsl: GH,
                bundledRepoRoot: this.bundledSkillsRoot,
                appServerClient: c,
              });
            return { success: !0, destination: l, error: null };
          } catch (e) {
            let t = e instanceof Error ? e.message : String(e);
            return (
              KH().warning(`Failed to install recommended skill`, {
                safe: {},
                sensitive: { error: t },
              }),
              { success: !1, destination: null, error: t }
            );
          }
        },
        "remove-skill": async ({ hostId: e, skillPath: t }) => {
          try {
            let r = this.getRequestAppServerClient(e),
              { deletedPath: i } = await n.s({ skillPath: t, preferWsl: GH, appServerClient: r });
            return { success: !0, deletedPath: i, error: null };
          } catch (e) {
            let t = e instanceof Error ? e.message : String(e);
            return (
              KH().warning(`Failed to remove skill`, { safe: {}, sensitive: { error: t } }),
              { success: !1, deletedPath: null, error: t }
            );
          }
        },
        "read-file": async ({ path: e, hostId: t }) => {
          let r = this.getRequestAppServerClient(t ?? void 0),
            i = await this.getFileRequestPath(e, r);
          return { contents: await n.Di.readFile(i, r) };
        },
        "read-file-metadata": (e) => this.readFileMetadata(e),
        "write-file": async ({ content: e, expectedMtimeMs: t, hostId: r, path: i }) => {
          let a = this.getRequestAppServerClient(r),
            o = await this.getFileRequestPath(i, a),
            s = null;
          try {
            let e = await n.Di.stat(o, a, { bypassCache: !0 });
            s = typeof e.mtimeMs == `number` ? e.mtimeMs : null;
          } catch (e) {
            let t = e;
            if (!(`code` in t) || t.code !== `ENOENT`) throw e;
          }
          if (t !== s) return { outcome: `conflict`, mtimeMs: s };
          await n.Di.writeFile(o, e, a);
          let c = await n.Di.stat(o, a);
          return { outcome: `saved`, mtimeMs: typeof c.mtimeMs == `number` ? c.mtimeMs : null };
        },
        "ensure-directory": (e) => this.ensureDirectory(e),
        "read-file-binary": (e) => this.readFileBinary(e),
        "upload-local-file-over-sftp": (e) => this.uploadLocalFile(e),
        "compile-latex-artifact": async ({ path: e, hostId: t }) => {
          let r = this.getRequestAppServerClient(t);
          return n.Es(r.hostConfig)
            ? { contentsBase64: null }
            : QRe(
                await this.getFileRequestPath(e, r),
                await ize(this.appServerConnectionRegistry.getConnection(r.hostConfig.id)),
              );
        },
        "read-git-file-binary": async ({ cwd: e, hostId: t, path: r, ref: i, signal: a }) => {
          let o = this.getRequestAppServerClient(t).hostConfig,
            s = Un(e, o);
          if (s == null) return { contentsBase64: null };
          try {
            return await this.requestGitWorker({
              method: `read-git-file-binary`,
              params: { cwd: n.Ns(s), path: r, ref: i, hostConfig: o, operationSource: n.U().source },
              signal: a,
            });
          } catch {
            return { contentsBase64: null };
          }
        },
        "codex-agents-md": async ({ hostId: e }) => n.Ti(YH(this.getRequestAppServerClient(e))),
        "codex-agents-md-save": async ({ hostId: e, contents: t }) =>
          n.Ei(t, YH(this.getRequestAppServerClient(e))),
        "generate-commit-message": async ({ hostId: e, prompt: t, cwd: r, signal: i }) => {
          try {
            return {
              message: await n.ut({
                prompt: t,
                cwd: r ?? null,
                model: (await Ln(this.statsig)).ephemeralGenerationModel,
                serviceTier: null,
                client: this.appServerConnectionRegistry.getConnection(e),
                timeoutMs: n.it,
                signal: i,
                ...n.st,
              }),
            };
          } catch (e) {
            return (
              KH().warning(`Failed to generate commit message`, {
                safe: {},
                sensitive: { error: e },
              }),
              { message: null }
            );
          }
        },
        "generate-commit-pull-request-message": async ({
          hostId: e,
          prompt: t,
          cwd: r,
          signal: i,
        }) => {
          try {
            let a = await n.ut({
              prompt: t,
              cwd: r ?? null,
              model: (await Ln(this.statsig)).ephemeralGenerationModel,
              serviceTier: null,
              client: this.appServerConnectionRegistry.getConnection(e),
              timeoutMs: n.at,
              signal: i,
              ...n.ct,
            });
            return { message: a?.message ?? null, title: a?.title ?? null, body: a?.body ?? null };
          } catch (e) {
            return (
              KH().warning(`Failed to generate commit and pull request messages`, {
                safe: {},
                sensitive: { error: e },
              }),
              { message: null, title: null, body: null }
            );
          }
        },
        "generate-pull-request-message": async ({ hostId: e, prompt: t, cwd: r, signal: i }) => {
          try {
            let a = await n.ut({
              prompt: t,
              cwd: r ?? null,
              model: (await Ln(this.statsig)).ephemeralGenerationModel,
              serviceTier: null,
              client: this.appServerConnectionRegistry.getConnection(e),
              timeoutMs: n.ot,
              signal: i,
              ...n.lt,
            });
            return { title: a?.title ?? null, body: a?.body ?? null };
          } catch {
            return { title: null, body: null };
          }
        },
        "inbox-items": async ({ limit: e }) => ({ items: n.C(e ?? 200), unreadRunCounts: n.S() }),
        "list-automations": async () => {
          let e = this.habitatAutomationsService?.getMigrationOwner();
          return {
            items: this.habitatAutomationsService?.list() ?? n.Ar(),
            ...(e == null ? {} : { habitatMigrationComplete: e }),
          };
        },
        "ambient-suggestions": async ({ domain: e, hostId: t, projectRoot: r }) => {
          if (!Vr(this.getSettingsStore())) return { file: n.wd };
          let i = await this.getAmbientSuggestionsProjectRoot(r);
          return i.projectRoot == null ? { file: n.wd } : { file: n.pi(t, i.projectRoot, e) };
        },
        "ambient-suggestions-refresh": async ({
          domain: e,
          hostId: t,
          projectRoot: r,
          mode: i,
          surface: a,
        }) => {
          let o = await this.getAmbientSuggestionsProjectRoot(r);
          if (o.projectRoot != null)
            try {
              let r = this.appServerConnectionRegistry.getConnection(t),
                s = this.getSettingsStore(),
                c = await Hr({ appServerConnection: r, settingsStore: s });
              if (!c.enabled) return;
              await n.hi({
                modelRouting: await Ln(this.statsig),
                usePluginDetailReads: Tr().noPluginListPhase2,
                domain: e,
                hostId: t,
                projectRoot: o.projectRoot,
                isProjectlessChat: o.isProjectlessChat,
                enabled: !0,
                computerUseAvailable: c.computerUseAvailable,
                featureDiscoveryEnabled: c.featureDiscoveryEnabled,
                appServerConnection: r,
                serviceTier: null,
                staleTimeMs: c.staleTimeMs,
                mode: i,
                surface: a ?? Fte(s),
              });
            } catch (e) {
              KH().warning(`Failed to refresh ambient suggestions`, {
                safe: {},
                sensitive: { error: e, projectRoot: o.projectRoot },
              });
            }
        },
        "ambient-suggestion-set-status": async ({
          domain: e,
          hostId: t,
          projectRoot: r,
          suggestionId: i,
          status: a,
        }) => {
          let o = await this.getAmbientSuggestionsProjectRoot(r);
          return o.projectRoot == null
            ? { file: n.wd }
            : {
                file: n.gi({
                  domain: e,
                  hostId: t,
                  projectRoot: o.projectRoot,
                  suggestionId: i,
                  status: a,
                }),
              };
        },
        "developer-instructions": async ({
          baseInstructions: e,
          cwd: t,
          hostId: n,
          hostedAutomationsEnabled: r,
          includeProseDetailLevelInstructions: i,
          instructionOverrides: a,
          sidebarSectionToolsEnabled: o,
          threadToolsEnabled: s,
          threadId: c,
        }) => ({
          instructions: await this.getProjectAwareDeveloperInstructions({
            baseInstructions: e,
            cwd: t,
            hostId: n ?? `local`,
            hostedAutomationsEnabled: r,
            includeProseDetailLevelInstructions: i,
            instructionOverrides: a,
            sidebarSectionToolsEnabled: o,
            threadToolsEnabled: s,
            threadId: c,
          }),
        }),
        "automation-run-archive": async ({
          threadId: e,
          archivedAssistantMessage: t,
          archivedUserMessage: r,
          archivedReason: i,
        }) => {
          if (t != null || r != null) n.ri(e, r ?? null, t ?? null);
          else
            try {
              await this.appServerConnectionRegistry
                .getConnection(J)
                .captureAutomationArchiveMessages(e);
            } catch (e) {
              KH().warning(`Failed to capture automation archive messages`, {
                safe: { error: e instanceof Error ? e.message : String(e) },
                sensitive: {},
              });
            }
          let a = n.ti(e, i ?? void 0);
          return (
            a && this.appServerConnectionRegistry.getConnection(J).notifyAutomationRunsUpdated(),
            { success: a }
          );
        },
        "automation-run-delete": async ({ threadId: e }) => {
          let t = n.$r(e);
          return (
            t && this.appServerConnectionRegistry.getConnection(J).notifyAutomationRunsUpdated(),
            { success: t }
          );
        },
        "delete-archived-thread": async ({ hostId: e, threadId: t }) => {
          let r = this.appServerConnectionRegistry.getConnection(e),
            i = await n.Xr({ appServer: r, threadId: t });
          return (r.notifyAutomationRunsUpdated(), { deletedThreadIds: i });
        },
        "delete-all-archived-threads": async ({ hostId: e }) => {
          let t = this.appServerConnectionRegistry.getConnection(e),
            r = await n.Yr({ appServer: t });
          return (r.length > 0 && t.notifyAutomationRunsUpdated(), { deletedThreadIds: r });
        },
        "list-pinned-threads": (e) => this.pinnedThreadsService.list(e),
        "set-thread-pinned": (e) => this.pinnedThreadsService.set(e),
        "set-pinned-threads-order": (e) => this.pinnedThreadsService.setOrder(e),
        "automation-create": (e) => this.automationsService.create(e),
        "automation-update": (e) => this.automationsService.update(e),
        "automation-delete": (e) => this.automationsService.delete(e),
        "automation-run-now": async ({ id: e, collaborationMode: t, permissions: n }) => (
          await mae({
            statsig: this.statsig,
            appVersion: l.app.getVersion(),
            automationId: e,
            appServerConnection: this.appServerConnectionRegistry.getConnection(J),
            desktopFeatureAvailability: Tr(),
            requestGitWorker: this.requestGitWorker,
            globalState: this.globalState,
            threadProjectAssignments: this.threadProjectAssignments,
            prepareCronTurnReadState: this.prepareCronTurnReadState,
            settingsStore: this.getSettingsStore(),
            appServerClient: this.appServerClient,
            worktreeLifecycle: {
              requestCleanup: () => {
                this.getWorktreeService(J).requestCleanup();
              },
              setOwnerThread: ({ conversationId: e, worktree: t }) =>
                this.getWorktreeService(J).setOwnerThread({ conversationId: e, worktree: t }),
            },
            isPackaged: l.app.isPackaged,
            repoRoot: this.repoRoot,
            collaborationMode: t,
            permissions: n,
            requestDynamicToolsForThreadStart: this.requestDynamicToolsForThreadStart,
            isHostedAutomationAppAvailable: this.isHostedAutomationAppAvailable,
          }),
          { success: !0 }
        ),
        "find-files": async ({ query: e, cwd: t }) => {
          let n = typeof t == `string` && t.trim().length > 0 ? Un(t, ls) : null;
          return {
            files: (await pze({ query: e ?? ``, cwd: n ?? Ir(this.globalState) })).map((e) => ({
              ...e,
              path: zn(e.path, this.shouldUseWslPaths()),
              fsPath: zn(e.fsPath, this.shouldUseWslPaths()),
            })),
          };
        },
        "paths-exist": async ({ hostId: e, paths: t }) => {
          let r = this.getRequestAppServerClient(e),
            i = r.hostConfig.id === `local` && this.shouldUseWslPaths(),
            a = t ?? [],
            o = Hn(a, i),
            s = new Set(await n.Ci(o, r));
          return { existingPaths: a.filter((e, t) => s.has(o[t] ?? ``)) };
        },
        "claude-code-import-status": async ({ hostId: e }) =>
          JI({ appServerClient: this.getRequestAppServerClient(e), providers: [`claude-code`] }),
        "external-agent-imported-connectors": async ({ hostId: e, providers: t }) => {
          let r = this.getRequestAppServerClient(e);
          if (n.Es(r.hostConfig)) return { connectors: [] };
          let i = await r.codexHome();
          return zIe({ codexHome: Un(i, r.hostConfig) ?? i, providers: t });
        },
        ..._Ie({
          createProjectlessThreadPaths: ({ title: e }) =>
            this.createProjectlessThreadPaths({ createSplitDirectories: !0, prompt: e }),
          getAppServerConnection: (e) => this.appServerConnectionRegistry.getConnection(e),
          getStatus: (e) =>
            JI({ appServerClient: this.getRequestAppServerClient(e.hostId), providers: e.providers }),
          finalizeImportedProjects: async (
            { allImportedSessionThreadIds: e, importedSessionProjectRoots: t, projectRoots: n },
            r,
          ) =>
            VIe({
              allImportedSessionThreadIds: e,
              appServerClient: this.getRequestAppServerClient(J),
              globalState: this.globalState,
              importedSessionProjectRoots: t,
              projectsManager: this.projectsManager,
              projectId: r,
              projectRoots: n,
              assignIfUnassigned: (e) => this.threadProjectAssignments.assignIfUnassigned(e),
              shouldUseWslPaths: this.shouldUseWslPaths(),
              windowManager: this.windowManager,
            }),
          recordProjectlessThread: (e) => this.recordProjectlessThread(e),
          providerAdapters: {
            "claude-cowork": lIe({
              getAppServerConnection: (e) => this.appServerConnectionRegistry.getConnection(e),
              getRequestAppServerClient: (e) => this.getRequestAppServerClient(e),
              onImportedSessionThreadIds: (e) => this.onCoworkImportedSessionThreadIds?.(e),
              recordProjectlessThread: (e) => this.recordProjectlessThread(e),
              getConfiguredProjectlessWorkspaceRoot: () =>
                this.settingsStore?.getEffective(n.Fa.projectlessWorkspaceRoot.key) ?? null,
            }),
          },
        }),
        "local-environment-config": async ({ configPath: e, hostId: t }) => {
          let r = this.getRequestAppServerClient(t),
            i = r.hostConfig,
            a = i.id === `local` && this.shouldUseWslPaths(),
            o = n.Es(i) ? e : (Un(e, i) ?? e),
            s = await n.L(r, o),
            c = zn(o, a);
          return s.exists
            ? {
                configPath: c,
                environment: { ...s.environment, configPath: zn(s.environment.configPath, a) },
                exists: !0,
                revision: s.revision,
              }
            : { configPath: c, environment: null, exists: !1, revision: null };
        },
        "local-environment-config-save": async ({ configPath: e, hostId: t, raw: r }) => {
          let i = this.getRequestAppServerClient(t),
            a = i.hostConfig,
            o = a.id === `local` && this.shouldUseWslPaths(),
            s = n.Es(a) ? e : (Un(e, a) ?? e);
          return (
            await n.Di.mkdir(h.dirname(s), { recursive: !0 }, i),
            await n.Di.writeFile(s, r, i),
            { configPath: zn(s, o), success: !0 }
          );
        },
        "is-copilot-api-available": async () => ({ available: !1 }),
        "get-copilot-api-proxy-info": async () => null,
        "get-global-state": async ({ key: e }) => ({ value: this.getGlobalStateValue(e) }),
        "set-global-state": async ({ key: e, value: t }) => {
          if (qH.has(e)) throw Error(`Direct writes to ${e} are not allowed`);
          return e === n.iu.THREAD_PROJECT_ASSIGNMENTS || e === n.iu.PROJECTLESS_THREAD_IDS
            ? { success: !1 }
            : (this.setGlobalStateValue(e, t), { success: !0 });
        },
        "queued-follow-up-send-lock-acquire": async ({
          conversationId: e,
          messageId: t,
          lockId: n,
        }) => ({
          acquired: this.queuedFollowUpSendLocks.tryAcquire({
            conversationId: e,
            messageId: t,
            lockId: n,
          }),
        }),
        "queued-follow-up-send-lock-release": async ({
          conversationId: e,
          messageId: t,
          lockId: n,
          sent: r,
        }) => {
          this.queuedFollowUpSendLocks.release({
            conversationId: e,
            messageId: t,
            lockId: n,
            sent: r,
          });
        },
        "get-configuration": async ({ key: e }) => ({ value: this.getConfigurationValue(e) }),
        "set-configuration": async ({ key: e, value: t }) => {
          if (qH.has(e)) throw Error(`Direct writes to ${e} are not allowed`);
          return (this.setConfigurationValue(e, t), { success: !0 });
        },
        "get-setting": async ({ key: e }) => ({ value: await this.getSettingValue(e) }),
        "get-settings": async () => ({
          configuredValues: this.getConfiguredSettingValues(),
          values: await this.getSettingValues(),
        }),
        "set-setting": async ({ key: e, value: t }) => (
          await this.setSettingValue(e, t),
          { success: !0 }
        ),
        "settings-read": async () => {
          if (this.settings == null) throw Error(`Settings store unavailable`);
          return this.settings.readForAgent();
        },
        "settings-write": async ({ settings: e }) => {
          if (this.settings == null) throw Error(`Settings store unavailable`);
          return this.settings.writeForAgent(e);
        },
        "apply-patch": async ({ origin: e, signal: t, ...r }) =>
          this.requestGitWorker({
            method: `apply-patch`,
            params: {
              ...r,
              cwd: n.Ns(r.cwd),
              hostConfig: this.getAppServerClientForHostIdOrThrow(r.hostConfig.id).hostConfig,
              operationSource: n.U().source,
            },
            signal: t,
          }),
        "mcp-codex-config": async ({ cwd: e }) => ({ config: await this.buildMcpCodexConfig(e) }),
        "worktree-shell-environment-config": ({ cwd: e, hostId: t, signal: n }) =>
          this.readWorktreeShellEnvironment(e, t ?? `local`, n),
        "pick-file": async ({ pickerTitle: e }) => ({
          file: (await this.pickFilesFromDialog({ allowMultiple: !1, title: e }))[0] ?? null,
        }),
        "pick-files": async ({
          acceptedFileExtensions: e,
          allowMultiple: t,
          imagesOnly: n,
          kind: r,
          pickerTitle: i,
        }) => ({
          files: await this.pickFilesFromDialog({
            acceptedFileExtensions: e,
            allowMultiple: t ?? !0,
            imagesOnly: n,
            kind: r,
            title: i,
          }),
        }),
        "save-file": async (e) => {
          let t = await l.dialog.showSaveDialog({ defaultPath: e.suggestedFilename });
          if (t.canceled || !t.filePath) return { path: null };
          if (e.kind === `contents`)
            return (
              await (0, b.writeFile)(t.filePath, Buffer.from(e.contentsBase64, `base64`)),
              { path: t.filePath }
            );
          let n = this.getRequestAppServerClient(e.hostId);
          return (
            await sftpDownload({
              sourcePath: await this.getFileRequestPath(e.sourcePath, n),
              targetPath: t.filePath,
              hostConfig: n.hostConfig,
            }),
            { path: t.filePath }
          );
        },
        "add-context-file": async ({ hostId: e, path: t, origin: n }) => {
          let r = {
            label: (await this.getAppServerClientForHostIdOrThrow(e).platformPath()).basename(t),
            path: t,
            fsPath: t,
          };
          return (
            this.windowManager.sendInlineMessageForView(n, { type: `add-context-file`, file: r }),
            { success: !0 }
          );
        },
        "git-origins": (e) => this.readGitOrigins(e ?? {}),
        "git-push": async ({ signal: e, hostId: t, origin: r, ...i }) =>
          this.requestGitWorker({
            method: `push`,
            params: {
              ...i,
              hostConfig: this.getRequestAppServerClient(t).hostConfig,
              operationSource: n.U().source,
            },
            signal: e,
          }),
        "git-create-branch": async ({ signal: e, hostId: t, origin: r, ...i }) =>
          this.requestGitWorker({
            method: `create-branch`,
            params: {
              ...i,
              hostConfig: this.getRequestAppServerClient(t).hostConfig,
              operationSource: n.U().source,
            },
            signal: e,
          }),
        "git-checkout-branch": ({ signal: e, hostId: t, origin: r, ...i }) =>
          this.requestGitWorker({
            method: `checkout-branch`,
            params: {
              ...i,
              hostConfig: this.getRequestAppServerClient(t).hostConfig,
              operationSource: n.U().source,
            },
            signal: e,
          }),
        "git-merge-base": async ({ gitRoot: e, baseBranch: t, hostId: r, signal: i }) => {
          let a = this.getRequestAppServerClient(r),
            o = await this.resolveGitRootFromRequest(e, a, i);
          return !o || !t
            ? { mergeBaseSha: null }
            : this.requestGitWorker({
                method: `merge-base`,
                params: {
                  cwd: n.Ns(o),
                  baseBranch: t,
                  hostConfig: a.hostConfig,
                  operationSource: n.U().source,
                },
                signal: i,
              });
        },
        "prepare-worktree-snapshot": async ({ gitRoot: e, snapshotBranch: t, signal: r }) => {
          if (!e) throw Error(`gitRoot is required`);
          return this.requestGitWorker({
            method: `prepare-worktree-snapshot`,
            params: {
              cwd: n.Ns(e),
              snapshotBranch: t ?? null,
              hostConfig: this.appServerClient.hostConfig,
              operationSource: n.U().source,
            },
            signal: r,
          });
        },
        "upload-worktree-snapshot": async ({
          tarballPath: e,
          uploadUrl: t,
          contentLength: r,
          contentType: i,
        }) => {
          try {
            return (
              await n.D({ tarballPath: e, uploadUrl: t, contentLength: r, contentType: i }),
              { success: !0 }
            );
          } catch (e) {
            return (
              KH().error(`Failed to upload worktree snapshot`, { safe: {}, sensitive: { error: e } }),
              { success: !1 }
            );
          }
        },
        "set-vs-context": async () => {
          throw new XH();
        },
        "native-desktop-apps": async (e) => ({ apps: await n.M(e) }),
        "native-desktop-app-by-bundle-id": async ({ bundleId: e }) => ({
          app: (await Pj(e)) ?? (await n.A(e)),
        }),
        "computer-use-frontmost-window": async ({ origin: e, signal: t }) =>
          process.platform === `win32`
            ? Tr().appshotsEnabled
              ? (this.windowsCaptureNativeBridge?.getFrontmostWindow(e, t) ?? null)
              : null
            : process.platform === `darwin`
              ? qs()
              : null,
        "computer-use-start-capture": async ({
          animationDestination: e,
          animationPresentationStyle: t,
          bundleIdentifier: r,
          origin: i,
          requestId: a,
          signal: o,
        }) => {
          if (process.platform !== `darwin` && process.platform !== `win32`) return null;
          let s = computeScreenshotTarget({
            backgroundColor: e.backgroundColor,
            cornerRadius: e.cornerRadius,
            presentationStyle: t,
            primaryTextColor: e.primaryTextColor,
            viewportFrame: e.viewportFrame,
            webContents: i,
          });
          return s == null
            ? null
            : process.platform === `win32`
              ? !Tr().appshotsEnabled || this.windowsCaptureNativeBridge == null
                ? null
                : startWindowsCapture({
                    animationTarget: s,
                    bundleIdentifier: r,
                    origin: i,
                    requestId: a,
                    signal: o,
                    soundEnabled: (await this.getSettingValue(n.Va.soundEnabled.key)) !== !1,
                    windowManager: this.windowManager,
                    windowsCaptureNativeBridge: this.windowsCaptureNativeBridge,
                  })
              : this.requestComputerUseCaptureWorker == null ||
                  this.subscribeComputerUseCaptureWorkerEvent == null
                ? null
                : startMacCapture({
                    animationTarget: s,
                    bundleIdentifier: r,
                    origin: i,
                    requestComputerUseCaptureWorker: this.requestComputerUseCaptureWorker,
                    requestId: a,
                    subscribeComputerUseCaptureWorkerEvent:
                      this.subscribeComputerUseCaptureWorkerEvent,
                    windowManager: this.windowManager,
                  });
        },
        "native-desktop-app-icon": async ({ appPath: e }) => ({ iconSmall: await oH(e) }),
        "computer-use-native-desktop-app-icon": async ({ appPath: e, size: t }) =>
          t === `medium` ? { iconSmall: null, iconMedium: await Ys(e) } : { iconSmall: await Js(e) },
      };
      async assertBrowserUseGlobalPersistentApprovalAllowed(e) {
        await sD(e, () => this.appServerConnectionRegistry.getConnection(J).getConfigRequirements());
      }
      async pickFilesFromDialog({
        acceptedFileExtensions: e,
        allowMultiple: t,
        imagesOnly: r = !1,
        kind: i,
        title: a,
      }) {
        let o =
            i === `directory` || (i == null && t && !r && e == null && process.platform === `darwin`),
          s = r ? [...n.ba] : e,
          c = s?.length ? [{ extensions: s, name: r ? `Images` : a }] : void 0,
          u = await l.dialog.showOpenDialog({
            ...(c == null ? {} : { filters: c }),
            properties: [
              ...(i === `directory` ? [] : [`openFile`]),
              ...(o ? [`openDirectory`] : []),
              ...(t ? [`multiSelections`] : []),
            ],
            title: a,
          });
        return u.canceled || u.filePaths.length === 0
          ? []
          : Promise.all(
              u.filePaths.map(async (e) => {
                let t = zn(e, this.shouldUseWslPaths());
                return {
                  label: h.basename(e),
                  path: o && (await (0, b.stat)(e)).isDirectory() ? `${t}${h.sep}` : t,
                  fsPath: t,
                };
              }),
            );
      }
      async getWorkspaceDirectoryPath(e, t) {
        let r = t?.trim() || (await this.getDefaultWorkspaceDirectoryPath(e));
        if (!(await n.Di.stat(r, e)).isDirectory()) throw Error(`Directory not found: ${r}`);
        return r;
      }
      async getDefaultWorkspaceDirectoryPath(e) {
        let t = e.hostConfig;
        if (!n.Es(t)) return (0, p.homedir)();
        let r = await e.platformPath(),
          i = await e.codexHome();
        return r.dirname(i);
      }
      async getParentDirectoryPath(e, t) {
        let n = (await e.platformPath()).dirname(t);
        return n === t ? null : n;
      }
      async getFileRequestPath(e, t) {
        return n.Es(t.hostConfig)
          ? pH(e, null, await t.platformPath())
          : pH(Un(e, t.hostConfig) ?? e, Ir(this.globalState));
      }
      async getProjectAwareDeveloperInstructions({
        baseInstructions: e,
        cwd: t,
        hostId: r,
        hostedAutomationsEnabled: i,
        includeProseDetailLevelInstructions: a,
        instructionOverrides: o,
        sidebarSectionToolsEnabled: s,
        threadToolsEnabled: c,
        threadId: l,
      }) {
        let u = this.getAppServerClientForHostIdOrThrow(r),
          d = await this.isWorkspaceDependenciesFeatureEnabled(r).catch(
            (e) => (
              KH().warning(
                `Failed to check workspace dependencies feature for developer instructions`,
                { safe: {}, sensitive: { error: e } },
              ),
              !1
            ),
          ),
          f = await this.isNonGitWorkspace(t, u),
          p = this.getSettingsStore();
        return n.Bt({
          baseInstructions: e,
          gitSettings: {
            branchPrefix: p.getEffective(n.gs.branchPrefix.key),
            commitInstructions: p.getEffective(n.gs.commitInstructions.key),
            pullRequestInstructions: p.getEffective(n.gs.pullRequestInstructions.key),
          },
          isNonGitWorkspace: f,
          instructionOverrides: o,
          sidebarSectionToolsEnabled: s,
          threadToolsEnabled: c,
          workspaceDependenciesEnabled: d,
          includeProseDetailLevelInstructions: a,
          hostedAutomationsEnabled:
            i === !0 && r === `local` && this.habitatAutomationsService?.getMigrationOwner() != null,
          threadId: l,
        });
      }
      async isNonGitWorkspace(e, t) {
        let r = n.Es(t.hostConfig) ? e : (Un(e, t.hostConfig) ?? e);
        if (!r) return !1;
        try {
          return (
            (await this.requestGitWorker({
              method: `stable-metadata`,
              params: { cwd: n.Ns(r), hostConfig: t.hostConfig, operationSource: n.U().source },
            })) == null
          );
        } catch (e) {
          return (
            KH().warning(
              `Failed to determine whether developer instructions should omit git guidance for a non-git workspace`,
              {
                safe: { error: e instanceof Error ? e.message : String(e) },
                sensitive: { error: e },
              },
            ),
            !1
          );
        }
      }
      shouldUseWslPaths() {
        return n.zi(ls);
      }
      async getHomeDirectory(e) {
        let t = this.getRequestAppServerClient(e),
          r = t.hostConfig;
        if (n.Es(r)) {
          let e = await t.platformPath();
          return r.home_dir ?? e.dirname(await t.codexHome());
        }
        return zn((0, p.homedir)(), n.zi(r));
      }
      async getAmbientSuggestionsProjectRoot(e) {
        return e == null
          ? { projectRoot: null, isProjectlessChat: !1 }
          : e === `~`
            ? {
                projectRoot: n.Ns(zn((0, p.homedir)(), this.shouldUseWslPaths())),
                isProjectlessChat: !0,
              }
            : { projectRoot: e, isProjectlessChat: !1 };
      }
      async getSelectedGitRoot(e, t) {
        let r = n.Wo(Pr(this.globalState)?.rootPaths);
        return r
          ? ((
              await this.requestGitWorker({
                method: `stable-metadata`,
                params: { cwd: n.Ns(r), hostConfig: e.hostConfig, operationSource: n.U().source },
                signal: t,
              })
            )?.root ?? null)
          : null;
      }
      async resolveGitRootFromRequest(e, t, r) {
        if (e) {
          let i = e.trim();
          if (i.length > 0) {
            let e = (
              await this.requestGitWorker({
                method: `stable-metadata`,
                params: { cwd: n.Ns(i), hostConfig: t.hostConfig, operationSource: n.U().source },
                signal: r,
              })
            )?.root;
            if (e) return e;
          }
        }
        return this.getSelectedGitRoot(t, r);
      }
      getRequestAppServerClient(e) {
        return e == null || e === `local`
          ? this.appServerClient
          : this.getAppServerClientForHostId(e);
      }
      async getPinnedThreadIdsForWorktreeCleanup(e) {
        return jH.getPinnedThreadIdsForWorktreeCleanup(this.pinnedThreadsService, e);
      }
      getAppServerClientForHostIdOrThrow(e) {
        return e === `local` ? this.appServerClient : this.getAppServerClientForHostId(e);
      }
      async buildMcpCodexConfig(e) {
        let t = this.appServerConnectionRegistry.getConnection(J);
        ns({ settingsStore: this.getSettingsStore(), repoRoot: this.repoRoot });
        let n = this.shouldUseWslPaths(),
          r = Tr(),
          [i, o] = await Promise.all([
            $o({
              appServerConnection: t,
              appVersion: a.St(),
              desktopFeatureAvailability: r,
              cwd: e,
              isPackaged: l.app.isPackaged,
              repoRoot: this.repoRoot,
              shouldUseWslPaths: n,
            }),
            iMe({
              appServerConnection: t,
              cwd: e,
              desktopFeatureAvailability: r,
              isPackaged: l.app.isPackaged,
              resourcesPath: process.resourcesPath,
              shouldUseWslPaths: n,
            }),
          ]),
          s = vi({
            enabled: r.artifactSession,
            hostLifecycle: this.getArtifactSessionHostLifecycle(),
            isPackaged: l.app.isPackaged,
            repoRoot: this.repoRoot,
            shouldUseWslPaths: n,
          });
        return {
          ...i,
          ...(await os({ hostConfig: t.hostConfig, appServerVersion: t.appServerVersion })),
          ...o,
          ...s,
        };
      }
      async readCodexHome(e) {
        let t = this.getRequestAppServerClient(e);
        return zn(
          n.Es(t.hostConfig) ? await t.codexHome() : n.Oi({ preferWsl: GH }),
          t.hostConfig.id === `local` && this.shouldUseWslPaths(),
        );
      }
      async readCodexHomePaths(e) {
        KH().info(`codex-home request`, { safe: {}, sensitive: { hostId: e.hostId } });
        let t = this.getRequestAppServerClient(e.hostId),
          r = t.hostConfig,
          i = r.id === `local` && this.shouldUseWslPaths(),
          a = await t.platformPath(),
          o = n.Es(r) ? await t.codexHome() : n.Oi({ preferWsl: GH }),
          s = n.Es(r)
            ? n.ms(
                (
                  await this.appServerConnectionRegistry
                    .getConnection(r.id)
                    .getUserSavedConfiguration()
                ).desktop,
              ).worktreesRoot
            : this.settingsStore?.getEffective(n.gs.worktreeRoot.key),
          c = await t.workspacesRoot().catch(() => null),
          l = Tr().workspaceDir ? c : o,
          u = s?.trim() || (l == null ? null : a.join(l, `worktrees`));
        return {
          codexHome: zn(o, i),
          workspacesRoot: c,
          worktreesSegment: u == null ? null : zn(u, i),
        };
      }
      async readFileMetadata({
        contentSampleByteLimit: e,
        contentSampleMaxFileBytes: t,
        path: r,
        hostId: i,
      }) {
        let a = this.getRequestAppServerClient(i),
          o = await this.getFileRequestPath(r, a),
          s = await n.Di.stat(o, a),
          c = s.isFile(),
          l =
            e != null && c && (t == null || typeof s.size != `number` || s.size <= t)
              ? await n.Di.readFileSampleBytes(o, a, e)
              : null,
          u = await n.Rs(l);
        return {
          ...(u == null ? {} : { contentKind: u }),
          createdAtMs: s.birthtimeMs > 0 ? s.birthtimeMs : null,
          isFile: c,
          mtimeMs: typeof s.mtimeMs == `number` ? s.mtimeMs : null,
          sizeBytes: typeof s.size == `number` ? s.size : null,
        };
      }
      async ensureDirectory({ hostId: e, path: t }) {
        let r = this.getRequestAppServerClient(e),
          i = await this.getFileRequestPath(t, r);
        return (await n.Di.mkdir(i, { recursive: !0 }, r), {});
      }
      async readFileBinary({ environmentId: e, maxBytes: t, path: r, hostId: i }) {
        let a = this.getRequestAppServerClient(i),
          o = await n.T({ appServerClient: a, url: r });
        if (o != null) return o;
        if (r.startsWith(`https://`)) return { contentsBase64: null };
        let s;
        if (i === `durable`)
          s = await rH(
            (e, t) =>
              this.appServerConnectionRegistry.getConnection(i).sendAppServerExtensionRequest(e, t),
            { environmentId: iH(e), path: r },
          );
        else {
          let e = await this.getFileRequestPath(r, a);
          s =
            t == null ? await n.Di.readFileBase64(e, a) : await n.Di.readFileSampleBytes(e, a, t + 1);
        }
        if (t != null && s.byteLength > t) return { contentsBase64: null };
        let c = typeof s == `string` ? s : s.toString(`base64`),
          l = typeof s == `string` ? Buffer.from(s, `base64`) : s,
          u = await n.zs(l);
        return { contentsBase64: c, ...(u == null ? {} : { mimeType: u }) };
      }
      async uploadLocalFile({ sourcePath: e, targetPath: t, hostId: n }) {
        let r = this.getRequestAppServerClient(n);
        await sftpUpload({ sourcePath: Un(e, ls) ?? e, targetPath: t, hostConfig: r.hostConfig });
      }
      async readGitOrigins({ dirs: e, hostId: t }) {
        let r = this.getRequestAppServerClient(t).hostConfig,
          i = n.zi(r),
          a = Hn(e ?? [], i).map((e) => n.Ps(e)),
          o = zn((0, p.homedir)(), i),
          s =
            a && a.length > 0
              ? a
              : this.projectsManager
                  .getProjectRootPathsForHost(r.id)
                  .filter((e) => e !== `~`)
                  .map((e) => n.Ps(e)),
          c = n.U(),
          { origins: l } = await this.requestGitWorker({
            method: `git-origins`,
            params: { dirs: s, hostConfig: r, operationSource: c.source },
          });
        return {
          origins: l.map((e) => ({
            ...e,
            dir: n.Ns(zn(e.dir, i)),
            root: n.Ps(zn(e.root, i)),
            commonDir: n.Ms(zn(e.commonDir, i)),
          })),
          homeDir: o,
        };
      }
      async readWorktreeShellEnvironment(e, t, r) {
        let i = this.getRequestAppServerClient(t).hostConfig,
          a = n.Es(i) ? e : (Un(e, i) ?? e);
        return this.requestGitWorker({
          method: `worktree-shell-environment`,
          params: { cwd: n.Ns(a), hostConfig: i, operationSource: n.U().source },
          signal: r,
        });
      }
      getGlobalStateValue(e) {
        return e === n.iu.LOCAL_PROJECTS
          ? this.projectsManager.getLocalProjectsForRenderer()
          : e === n.iu.REMOTE_PROJECTS
            ? this.projectsManager.getRemoteProjects()
            : e === n.iu.PROJECT_APPEARANCES
              ? this.projectsManager.getProjectAppearances()
              : this.globalState.get(e);
      }
      setGlobalStateValue(e, t) {
        if (e === n.iu.DEBUG_CHROME_PAGES_ENABLED) {
          let e = t === !0 && a.in.allowDebugMenu(a.in.resolve());
          (l.app.setDebugChromePagesEnabled(e),
            tl(e),
            this.globalState.set(n.iu.DEBUG_CHROME_PAGES_ENABLED, e));
        } else if (e === n.iu.LOCAL_PROJECTS)
          this.globalState.set(
            n.iu.LOCAL_PROJECTS,
            this.projectsManager.getLocalProjectsForDesktopState(t),
          );
        else if (
          e === n.iu.THREAD_WORKSPACE_ROOT_HINTS ||
          e === n.iu.THREAD_PROJECTLESS_OUTPUT_DIRECTORIES
        ) {
          let r = n.Ef(n.Of(), n.Of()).parse(t ?? {}),
            i =
              e === n.iu.THREAD_WORKSPACE_ROOT_HINTS
                ? n.iu.THREAD_WORKSPACE_ROOT_HINTS
                : n.iu.THREAD_PROJECTLESS_OUTPUT_DIRECTORIES;
          this.globalState.update(i, (e) => ({ ...e, ...r }));
        } else this.globalState.set(e, t);
        (this.windowManager.sendMessageToAllWindows({ type: `global-state-updated`, keys: [e] }),
          e === n.iu.REMOTE_PROJECTS &&
            this.windowManager.sendMessageToAllWindows({ type: `workspace-root-options-updated` }));
      }
      getConfigurationValue(e) {
        return this.globalState.get(e);
      }
      setConfigurationValue(e, t) {
        (this.globalState.set(e, t), this.applySettingSideEffects(e, t));
      }
      async getSettingValue(e) {
        if (this.settings == null) throw Error(`Settings store unavailable`);
        return this.settings.getEffective(e);
      }
      getConfiguredSettingValues() {
        let e = this.getSettingsStore(),
          t = {};
        for (let r of n.ka) {
          let n = e.get(r.key);
          n !== void 0 && Object.assign(t, { [r.key]: n });
        }
        return t;
      }
      async getSettingValues() {
        if (this.settings == null) throw Error(`Settings store unavailable`);
        return (await this.settings.readAll()).values;
      }
      async setSettingValue(e, t) {
        if (this.settings == null) throw Error(`Settings store unavailable`);
        await this.settings.write(e, n.Oa(e, t));
      }
      applySettingSideEffects(e, t) {
        if (
          (e === n.Va.soundEnabled.key &&
            tje(t === !0).catch((t) => {
              KH().warning(`Failed to write appshot sound setting`, {
                safe: { settingKey: e },
                sensitive: { error: t },
              });
            }),
          e === n.Ba.debugChromePagesEnabled.key)
        ) {
          let e = t === !0 && a.in.allowDebugMenu(a.in.resolve());
          (l.app.setDebugChromePagesEnabled(e), tl(e));
        }
        (e === `appearanceTheme` && a.j(t),
          (e === `appearanceTheme` ||
            e === `appearanceLightChromeTheme` ||
            e === `appearanceDarkChromeTheme`) &&
            this.windowManager.refreshWindowBackdrops(),
          e === n.iu.DOCK_ICON_PREFERENCE && this.updateDockIcon());
      }
      getSettingsStore() {
        if (this.settingsStore == null) throw Error(`Settings store unavailable`);
        return this.settingsStore;
      }
      handleVSCodeRequest(e, t, r, i, a) {
        try {
          let o = t,
            s = this.handlers[o];
          if (typeof s != `function`)
            throw Error(
              `${t} not implemented in the current Electron process. Restart ChatGPT to load the latest Electron handlers.`,
            );
          let c = () => s({ ...r, origin: e, signal: a });
          if (i == null) {
            if (n.Fs(t)) throw Error(`Missing git operation source for ${t}`);
            return c();
          }
          return n.W({ source: i, requestKind: t }, c);
        } catch (e) {
          throw e instanceof XH ? Error(`${t} not implemented in Electron.`) : e;
        }
      }
    };
}

if (typeof module !== "undefined") module.exports = { createElectronFetchHandlerClass };
