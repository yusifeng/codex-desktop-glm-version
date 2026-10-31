// @ts-nocheck

const SERVICE_CLEANUP_TIMEOUT_MS = 12_000;
const CONTEXT_CLEANUP_TIMEOUT_MS = 5_000;

/** Composes relaunch-and-quit plus the bounded cleanup phases shared by normal and immediate exits. */
export function createQuitRuntime(dependencies: Record<string, any>) {
  const { app, defaultRequestDevRelaunch, waitForCleanupWithTimeout } = dependencies;

  function relaunchAndQuit(requestDevRelaunch = defaultRequestDevRelaunch) {
    if (!requestDevRelaunch()) app.relaunch();
    app.quit();
  }

  const stopServiceWithTimeout = (cleanup: () => Promise<unknown>) =>
    waitForCleanupWithTimeout(cleanup, SERVICE_CLEANUP_TIMEOUT_MS);

  const waitForContextCleanup = (cleanup: () => Promise<unknown>) =>
    waitForCleanupWithTimeout(cleanup, CONTEXT_CLEANUP_TIMEOUT_MS);

  async function cleanupBeforeImmediateExit(options: Record<string, any>) {
    options.hotkeyWindowLifecycleManager.dispose();
    options.globalDictationLifecycleManager.dispose();
    await waitForContextCleanup(options.flushAndDisposeContext);
    options.disposables.dispose();
  }

  return {
    cleanupBeforeImmediateExit,
    relaunchAndQuit,
    stopServiceWithTimeout,
    waitForContextCleanup,
  };
}

if (typeof module !== "undefined") {
  module.exports = { createQuitRuntime };
}
