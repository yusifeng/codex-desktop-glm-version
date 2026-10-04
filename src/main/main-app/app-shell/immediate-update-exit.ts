/**
 * Immediate update-exit cleanup (the original `Wst` helper).
 *
 * This deliberately contains no Electron imports.  Startup injects the small
 * set of side effects so the error precedence and cleanup ordering can be
 * tested without starting an Electron process.
 */
export interface ImmediateUpdateExitDependencies {
  markAppQuitting: () => void;
  terminateProcessTree?: () => void;
  runCleanupBeforeImmediateExit: () => Promise<void>;
  listWindows: () => Iterable<{ isDestroyed(): boolean; destroy(): void }>;
  warn: (error: unknown) => void;
  exit: (code: number) => void;
}

/**
 * Complete update cleanup and terminate the process.  A failure in the
 * process-tree termination is retained while cleanup continues; all other
 * failures follow the original catch path.  `exit(0)` is unconditional.
 */
export async function cleanupForImmediateQuitOnUpdate(
  deps: ImmediateUpdateExitDependencies,
): Promise<void> {
  let processTreeError: unknown;
  try {
    deps.markAppQuitting();
    try {
      deps.terminateProcessTree?.();
    } catch (error) {
      processTreeError = error;
    }
    await deps.runCleanupBeforeImmediateExit();
    for (const window of deps.listWindows()) {
      if (!window.isDestroyed()) window.destroy();
    }
    if (processTreeError !== undefined) {
      throw processTreeError instanceof Error
        ? processTreeError
        : Error(typeof processTreeError === "string" ? processTreeError : "Windows update cleanup failed.");
    }
  } catch (error) {
    deps.warn(error);
  } finally {
    deps.exit(0);
  }
}
