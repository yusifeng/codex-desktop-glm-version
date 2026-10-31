// @ts-nocheck

const TEMPORARY_QUIT_ALLOWANCE_MS = 60_000;

/** Owns the short-lived permission to bypass quit confirmation and drain. */
export function createQuitStateClass(dependencies: Record<string, any> = {}) {
  const {
    setTimeoutImpl = setTimeout,
    clearTimeoutImpl = clearTimeout,
  } = dependencies;

  return class QuitState {
    allowQuitWithoutPrompt = false;
    allowQuitResetTimer = null;
    skipDrainBeforeQuit = false;

    allowQuitTemporarily(options?: Record<string, any>) {
      this.allowQuitWithoutPrompt = options?.allowWithoutPrompt ?? true;
      this.skipDrainBeforeQuit = options?.skipDrainBeforeQuit ?? false;
      if (this.allowQuitResetTimer != null) {
        clearTimeoutImpl(this.allowQuitResetTimer);
      }
      this.allowQuitResetTimer = setTimeoutImpl(() => {
        this.allowQuitWithoutPrompt = false;
        this.skipDrainBeforeQuit = false;
        this.allowQuitResetTimer = null;
      }, TEMPORARY_QUIT_ALLOWANCE_MS);
      this.allowQuitResetTimer.unref();
    }

    canQuitWithoutPrompt() {
      return this.allowQuitWithoutPrompt;
    }

    markQuitApproved() {
      this.allowQuitWithoutPrompt = true;
    }

    shouldSkipDrainBeforeQuit() {
      return this.skipDrainBeforeQuit;
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createQuitStateClass };
}
