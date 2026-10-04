type AsyncCleanup = () => Promise<unknown>;

/** Resolve when cleanup completes or the bounded shutdown grace period elapses. */
function waitForCleanupWithTimeout(cleanup: AsyncCleanup, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    const finish = () => {
      clearTimeout(timer);
      resolve();
    };
    cleanup().then(finish, finish);
  });
}

export { waitForCleanupWithTimeout };
if (typeof module !== `undefined`) module.exports = { waitForCleanupWithTimeout };
