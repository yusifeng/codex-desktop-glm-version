import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";

const { e6: React } = appSharedChunk;

export interface UseElementInViewInput {
  container: Element | null;
  target: Element | null;
}

const emptySubscribe = (): void => {};

function useElementInView({
  container,
  target,
}: UseElementInViewInput): boolean {
  const subscribe = (listener: () => void): (() => void) => {
    if (container == null || target == null) return emptySubscribe;
    container.addEventListener("scroll", listener, { passive: true });
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(listener);
    observer?.observe(container);
    observer?.observe(target);
    return () => {
      container.removeEventListener("scroll", listener);
      observer?.disconnect();
    };
  };
  const getSnapshot = (): boolean => {
    if (container == null || target == null) return true;
    const containerBounds = container.getBoundingClientRect();
    const targetBounds = target.getBoundingClientRect();
    return (
      targetBounds.bottom > containerBounds.top &&
      targetBounds.top < containerBounds.bottom
    );
  };
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function initializeUseElementInView(): void {
  React();
}

export { useElementInView as n, initializeUseElementInView as t };
