export type GithubCliRateLimitWait = (delayMs: number) => Promise<unknown>;

export interface GithubCliRateLimitGate {
  waitForGate(hostId: string, signal?: AbortSignal): Promise<void>;
  block(hostId: string, delayMs: number): void;
}

/** Coordinates secondary-rate-limit backoff per app-server host. */
export function createGithubCliRateLimitGate(wait: GithubCliRateLimitWait): GithubCliRateLimitGate {
  const pending = new Map<string, Promise<unknown>>();

  async function waitForGate(hostId: string, signal?: AbortSignal): Promise<void> {
    const gate = pending.get(hostId);
    if (gate == null || signal?.aborted === true) return;
    if (signal == null) {
      await gate;
      return;
    }

    await new Promise<void>((resolve) => {
      const onAbort = () => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      };
      signal.addEventListener("abort", onAbort, { once: true });
      gate.then(onAbort);
    });
  }

  function block(hostId: string, delayMs: number): void {
    const gate = wait(delayMs);
    pending.set(hostId, gate);
    gate.finally(() => {
      if (pending.get(hostId) === gate) pending.delete(hostId);
    });
  }

  return { waitForGate, block };
}
