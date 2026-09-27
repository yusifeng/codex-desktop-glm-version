import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";

interface ElicitationEvent { itemId: string; threadId: string; turnId: string; [key: string]: unknown }
interface EventStore {
  emit?(event: Record<string, unknown>): void;
  get?(key: unknown): unknown;
  watch?(listener: (store: EventStore) => void): () => void;
}

function recordElicitationInteraction(store: EventStore, event: ElicitationEvent, action: string): void {
  store.emit?.({ ...event, stage: "interacted", action });
}

function observeElicitationShown(store: EventStore, element: HTMLElement | null, event: ElicitationEvent | null, lastShown: { current?: string }): (() => void) | undefined {
  if (element == null || event == null || typeof IntersectionObserver === "undefined") return undefined;
  const eventKey = JSON.stringify([event.threadId, event.turnId, event.itemId]);
  let visible = false;
  const report = () => {
    if (visible && element.isConnected && element.ownerDocument.visibilityState === "visible" && lastShown.current !== eventKey) {
      lastShown.current = eventKey;
      store.emit?.({ ...event, stage: "shown" });
    }
  };
  const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.intersectionRatio > 0); report(); });
  observer.observe(element);
  const unwatch = store.watch?.(report);
  element.ownerDocument.addEventListener("visibilitychange", report);
  element.ownerDocument.defaultView?.addEventListener("focus", report);
  return () => { observer.disconnect(); unwatch?.(); element.ownerDocument.removeEventListener("visibilitychange", report); element.ownerDocument.defaultView?.removeEventListener("focus", report); };
}

function initializeElicitationEvents(): void {}
export { recordElicitationInteraction as n, observeElicitationShown as r, initializeElicitationEvents as t };
