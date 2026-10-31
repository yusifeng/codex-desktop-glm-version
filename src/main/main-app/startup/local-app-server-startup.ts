// @ts-nocheck

/** Runs local app-server/SQLite startup while owning both progress-window lifecycles. */
export async function runLocalAppServerStartup(options: Record<string, any>) {
  const {
    activateProgressWindows,
    appQuit,
    connect,
    enableRecovery,
    getLogger,
    markQuitApproved,
    runWithRecovery,
    shouldHandleError,
    showBackfillProgress,
    startDelayedProgress,
    waitForNetwork,
    windowIconPath,
  } = options;
  let closeBackfillProgress = () => {};
  let backfillProgressShown = false;
  const onQuit = () => {
    markQuitApproved();
    appQuit();
  };

  const shouldContinue = await runWithRecovery({
    databasePath: null,
    onBackfillWait: async () => {
      try {
        closeBackfillProgress = await showBackfillProgress({
          activate: activateProgressWindows,
          kind: `sqlite-backfill`,
          onQuit,
          windowIconPath,
        });
        backfillProgressShown = true;
      } catch (error) {
        getLogger().warning(`Failed to show SQLite backfill progress window`, {
          safe: {},
          sensitive: { error },
        });
      }
    },
    open: async () => {
      const closeDelayedProgress = backfillProgressShown
        ? () => {}
        : startDelayedProgress({
            activate: activateProgressWindows,
            kind: `app-server`,
            onError: (error: unknown) => {
              getLogger().warning(`Failed to show slow app-server startup progress window`, {
                safe: {},
                sensitive: { error },
              });
            },
            onQuit,
            windowIconPath,
          });
      try {
        await connect();
        await waitForNetwork();
        await enableRecovery();
      } finally {
        closeDelayedProgress();
      }
    },
    shouldHandleError,
  });

  return { shouldContinue, closeBackfillProgress };
}

if (typeof module !== `undefined`) module.exports = { runLocalAppServerStartup };
