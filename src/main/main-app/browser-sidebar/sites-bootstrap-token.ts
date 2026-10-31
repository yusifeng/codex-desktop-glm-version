type AnyRecord = Record<string, any>;
type TimerHandle = ReturnType<typeof setTimeout>;

type Runtime = {
  now: () => number;
  setTimer: (callback: () => void, delay: number) => TimerHandle;
  clearTimer: (timer: TimerHandle | undefined) => void;
  timeoutMs: number;
};

const defaultRuntime: Runtime = {
  now: Date.now,
  setTimer: setTimeout,
  clearTimer: clearTimeout,
  timeoutMs: 3_000,
};

/** Creates the short-lived identity-token provider used by authenticated Sites navigation. */
export function createSitesBootstrapTokenRuntime(dependencies: AnyRecord, runtimeOverrides: Partial<Runtime> = {}) {
  const runtime = { ...defaultRuntime, ...runtimeOverrides };

  function isEligibleSiteUrl(url: string): boolean {
    const parsed = URL.parse(url);
    return parsed?.protocol === "https:" &&
      parsed.port === "" &&
      parsed.username === "" &&
      parsed.password === "" &&
      [".chatgpt.site", ".appgardenapps.dev"].some((suffix) => parsed.hostname.endsWith(suffix));
  }

  function createTokenProvider(appServerClient: unknown) {
    return async (targetUrl: string, externalSignal?: AbortSignal | null) => {
      if (!dependencies.getFeatureFlags().autoAuthForSites || externalSignal?.aborted || !isEligibleSiteUrl(targetUrl)) {
        return null;
      }
      const requestedAt = runtime.now();
      const timeoutController = new AbortController();
      const signal = externalSignal == null
        ? timeoutController.signal
        : AbortSignal.any([timeoutController.signal, externalSignal]);
      let timeout: TimerHandle | undefined;
      try {
        return await Promise.race([
          (async () => {
            signal.throwIfAborted();
            if (!dependencies.getFeatureFlags().autoAuthForSites) return null;
            const response = await dependencies.authedFetch({
              action: "sign in to a Site",
              appServerClient,
              desktopApiOptions: dependencies.desktopApiOptions,
              path: "/codex/sites/session_bootstrap",
              beforeSend: () => {
                if (!dependencies.getFeatureFlags().autoAuthForSites) {
                  throw new DOMException("Site authentication disabled", "AbortError");
                }
              },
              request: {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ target_url: targetUrl }),
                signal,
              },
            });
            if (!response.ok) return null;
            const parsed = dependencies.sessionResponseSchema.safeParse(await response.json());
            return parsed.success
              ? {
                  idToken: parsed.data.id_token,
                  expiresAt: requestedAt + Math.min(parsed.data.expires_in, 120) * 1_000,
                }
              : null;
          })(),
          new Promise<null>((resolve) => {
            timeout = runtime.setTimer(() => {
              timeoutController.abort();
              resolve(null);
            }, runtime.timeoutMs);
            timeout.unref();
          }),
        ]);
      } catch {
        return null;
      } finally {
        runtime.clearTimer(timeout);
      }
    };
  }

  return { createTokenProvider, isEligibleSiteUrl };
}
