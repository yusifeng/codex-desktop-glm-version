import "@rchunk/rolldown-runtime";
import {
  fI as initializeElicitationEventDescriptor,
  oj as elicitationEventDescriptor,
  type MaitaiScopeApi,
} from "@rchunk/app-shared";
import {
  Cpn as elicitationUiState,
  GPt as appWindowFocused,
  KPt as initializeAppWindowFocus,
  Spn as blockedElicitationUiState,
  xpn as emitProductEvent,
  ypn as initializeProductEvents,
} from "@rchunk/app-initial";

interface ElicitationEvent { itemId: string; threadId: string; turnId: string; [key: string]: unknown }
type EventStore = MaitaiScopeApi<unknown>;

function recordElicitationInteraction(store: EventStore, event: ElicitationEvent, action: string): void {
  emitProductEvent(store, elicitationEventDescriptor, { ...event, stage: "interacted", action });
}

function isDocumentVisible(store: EventStore, document: Document): boolean {
  return document.visibilityState === "visible" && store.get(appWindowFocused) === true;
}

function observeElicitationShown(store: EventStore, element: HTMLElement | null, event: ElicitationEvent | null, lastShown: { current?: string }): (() => void) | undefined {
  if (element == null || event == null || typeof IntersectionObserver === "undefined") return undefined;
  const eventKey = JSON.stringify([event.threadId, event.turnId, event.itemId]);
  const ownerDocument = element.ownerDocument;
  let visible = false;
  const report = () => {
    const checkVisibility = element.checkVisibility as
      | ((options?: Record<string, boolean>) => boolean)
      | undefined;
    if (
      lastShown.current !== eventKey &&
      visible &&
      element.isConnected &&
      isDocumentVisible(store, ownerDocument) &&
      (checkVisibility?.call(element, {
        visibilityProperty: true,
        opacityProperty: true,
      }) ?? true) &&
      store.get(elicitationUiState) !== blockedElicitationUiState
    ) {
      lastShown.current = eventKey;
      emitProductEvent(store, elicitationEventDescriptor, { ...event, stage: "shown" });
    }
  };
  const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.intersectionRatio > 0); report(); });
  observer.observe(element);
  const unwatch = store.watch((nextStore) => {
    nextStore.get(appWindowFocused);
    nextStore.get(elicitationUiState);
    report();
  });
  ownerDocument.addEventListener("visibilitychange", report);
  ownerDocument.defaultView?.addEventListener("focus", report);
  return () => {
    observer.disconnect();
    unwatch();
    ownerDocument.removeEventListener("visibilitychange", report);
    ownerDocument.defaultView?.removeEventListener("focus", report);
  };
}

function initializeElicitationEvents(): void {
  initializeElicitationEventDescriptor();
  initializeAppWindowFocus();
  initializeProductEvents();
}
export { recordElicitationInteraction as n, observeElicitationShown as r, initializeElicitationEvents as t };
