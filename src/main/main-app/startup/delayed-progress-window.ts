export type DelayedProgressWindowDeps = {
  delayMs: number;
  show: () => Promise<() => void>;
  onError: (error: unknown) => void;
  setTimeout?: typeof setTimeout;
  clearTimeout?: typeof clearTimeout;
};

/** Starts a progress window only when an async startup phase exceeds a delay. */
export function createDelayedProgressWindow({ delayMs, show, onError, setTimeout: schedule = setTimeout, clearTimeout: cancel = clearTimeout }: DelayedProgressWindowDeps): () => void {
  let cancelled = false;
  let dispose: (() => void) | null = null;
  const timer = schedule(() => {
    show().then((cleanup) => {
      if (cancelled) cleanup();
      else dispose = cleanup;
    }).catch((error) => {
      if (!cancelled) onError(error);
    });
  }, delayMs);
  return () => {
    cancelled = true;
    cancel(timer);
    dispose?.();
  };
}

export { createDelayedProgressWindow as Oit };
if (typeof module !== `undefined`) module.exports = { createDelayedProgressWindow, Oit: createDelayedProgressWindow };
