type FailureDecision = {
  accepted: boolean;
  invalidateCachedRoot: boolean;
  refreshHostConfig: boolean;
  retry: boolean;
};

type GitStableMetadataRetryControllerOptions = {
  classifyFailure: (input: {
    generationMatches: boolean;
    hasCachedRoot: boolean;
    isGitUnavailable: boolean;
    isPermissionError: boolean;
    isProcessTimeout: boolean;
  }) => FailureDecision;
  isGitUnavailable: (error: unknown) => boolean;
  isPermissionError: (error: unknown) => boolean;
  isProcessTimeout: (error: unknown) => boolean;
  now: () => number;
  retryDelayMs: number;
};

type HandleFailureInput = {
  error: unknown;
  generationMatches: boolean;
  hasCachedRoot: boolean;
  invalidateCachedRoot: () => void;
  invalidateMetadata: () => void;
  key: string;
  refreshHostConfig: () => void;
};

class GitStableMetadataRetryController {
  private readonly options: GitStableMetadataRetryControllerOptions;
  private readonly retries = new Map<string, { error: Error; retryAfterMs: number }>();

  constructor(options: GitStableMetadataRetryControllerOptions) {
    this.options = options;
  }

  get size() {
    return this.retries.size;
  }

  clear() {
    this.retries.clear();
  }

  delete(key: string) {
    this.retries.delete(key);
  }

  hasProcessTimeoutRetry(key: string) {
    const retry = this.retries.get(key);
    return retry != null && this.options.isProcessTimeout(retry.error);
  }

  throwIfBlocked(key: string) {
    const retry = this.retries.get(key);
    if (retry == null) return;
    if (this.options.now() < retry.retryAfterMs) throw retry.error;
    this.retries.delete(key);
  }

  handleFailure(input: HandleFailureInput): never {
    const isProcessTimeout = this.options.isProcessTimeout(input.error);
    const decision = this.options.classifyFailure({
      generationMatches: input.generationMatches,
      hasCachedRoot: input.hasCachedRoot,
      isGitUnavailable: this.options.isGitUnavailable(input.error),
      isPermissionError: this.options.isPermissionError(input.error),
      isProcessTimeout,
    });
    if (!decision.accepted) throw input.error;

    const error = input.error instanceof Error ? input.error : Error(String(input.error));
    if (decision.retry) {
      if (decision.refreshHostConfig) input.refreshHostConfig();
      this.retries.set(input.key, {
        error,
        retryAfterMs: this.options.now() + this.options.retryDelayMs,
      });
      if (decision.invalidateCachedRoot) input.invalidateCachedRoot();
      input.invalidateMetadata();
    }
    throw error;
  }
}

export { GitStableMetadataRetryController };
if (typeof module !== `undefined`)
  module.exports = { GitStableMetadataRetryController };
