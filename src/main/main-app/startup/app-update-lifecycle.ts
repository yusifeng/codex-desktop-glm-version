// @ts-nocheck

/** Owns updater bridge callbacks and the transition from early to host-ready install handling. */
export function createAppUpdateLifecycle(options: Record<string, any>) {
  const {
    allowQuitTemporarily,
    appQuit,
    applyQuitForUpdatePolicy,
    armWindowsForcedExit,
    beforeImmediateExit,
    broadcastAppUpdateState,
    cleanupBeforeImmediateExit,
    cleanupForImmediateQuitOnUpdate,
    disposables,
    exit,
    flushAndDisposeContext,
    flushGitWorker,
    flushGlobalState,
    flushGlobalStateOrThrow,
    flushTracing,
    getAppServerClient,
    getLogger,
    getProjectRootPaths,
    globalDictationLifecycleManager,
    hotkeyWindowLifecycleManager,
    installSnapshot,
    isPackaged,
    isTrustedIpcEvent,
    isWindows,
    listWindows,
    markAppQuitting,
    quitState,
    registerBridgeHandlers,
    stopFsmonitor,
    stopService,
    terminateProcessTree,
  } = options;

  let installUpdates = (request?: Record<string, any>) => {
    if (request?.quitImmediately === false) {
      allowQuitTemporarily();
      return;
    }
    allowQuitTemporarily();
    appQuit();
  };

  registerBridgeHandlers({
    onDownloadProgressChanged: broadcastAppUpdateState,
    onDownloadedUpdateAppBrandChanged: broadcastAppUpdateState,
    onInstallProgressChanged: () => {
      if (isWindows) broadcastAppUpdateState();
    },
    onUpdateReadyChanged: broadcastAppUpdateState,
    onInstallUpdatesAborted: () => {
      quitState.allowQuitTemporarily({ allowWithoutPrompt: false });
      if (installSnapshot.clearAfterAbort())
        getLogger().info(`update_resume_state_cleared_after_install_abort`);
    },
    onUpdateLifecycleStateChanged: broadcastAppUpdateState,
    onRelaunchNoticeChanged: broadcastAppUpdateState,
    onInstallUpdatesRequested: (request: Record<string, any>) => installUpdates(request),
    isTrustedIpcEvent,
  });

  return {
    enableHostReadyInstallHandling() {
      installUpdates = (request?: Record<string, any>) => {
        if (isWindows && isPackaged && request?.quitImmediately !== false)
          armWindowsForcedExit();
        const snapshot = installSnapshot.saveForInstall(request);
        getLogger().info(`update_resume_state_saved`, {
          safe: { threadCount: snapshot?.threadIds.length ?? 0 },
        });
        if (request?.quitImmediately === false) {
          if (isWindows) return;
          quitState.allowQuitTemporarily({
            allowWithoutPrompt: true,
            skipDrainBeforeQuit: true,
          });
          return;
        }
        applyQuitForUpdatePolicy({
          exitImmediately: isWindows && isPackaged,
          exitImmediatelyForUpdateInstall: () => {
            Promise.allSettled([
              flushGlobalState(),
              stopService(),
              flushTracing(),
              flushGitWorker(),
            ]).then(() => {
              cleanupForImmediateQuitOnUpdate({
                runCleanupBeforeImmediateExit: async () => {
                  beforeImmediateExit();
                  await cleanupBeforeImmediateExit({
                    hotkeyWindowLifecycleManager,
                    globalDictationLifecycleManager,
                    flushAndDisposeContext,
                    disposables,
                  });
                },
                markAppQuitting,
                terminateProcessTree,
                listWindows,
                warn: (error: unknown) =>
                  getLogger().warning(`Immediate update exit cleanup failed before process exit`, {
                    safe: {},
                    sensitive: { error },
                  }),
                exit,
              });
            });
          },
          quitForUpdateInstall: appQuit,
          allowQuitTemporarily,
        });
      };
    },
    async prepareWindowsUpdate() {
      installUpdates({ quitImmediately: false });
      await flushGlobalStateOrThrow();
      const client = getAppServerClient();
      if (client == null) return;
      await Promise.allSettled(
        getProjectRootPaths().map((root: string) => stopFsmonitor(root, client)),
      );
    },
  };
}

if (typeof module !== `undefined`) module.exports = { createAppUpdateLifecycle };
