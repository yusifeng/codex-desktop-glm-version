import "@rchunk/rolldown-runtime";
import {
  FX as initializeSignalRuntime,
  l1 as initializeElementObserver,
  m1 as observeElement,
  pZ as createScopedSignal,
} from "@rchunk/app-shared";
import {
  $en as conversationScope,
  itn as initializeConversationScope,
} from "@rchunk/app-initial";

export interface OverlayAlignment {
  left: number;
  width: number;
}

export interface OverlayAlignmentStore {
  get(signal: unknown): OverlayAlignment | null;
  set(signal: unknown, value: OverlayAlignment | null): void;
}

export interface MeasurableElement {
  getBoundingClientRect(): Pick<DOMRect, "left" | "width">;
}

let rightPanelComposerOverlayAlignment: unknown;

function observeRightPanelComposerOverlayAlignment(
  store: OverlayAlignmentStore,
  element: MeasurableElement,
): () => void {
  let active = true;
  let lastValue: OverlayAlignment | null = null;
  const observe = observeElement as unknown as (
    element: MeasurableElement,
    options: null,
    callback: () => void,
  ) => () => void;
  const stop = observe(element, null, () => {
    if (!active) return;
    const { left, width } = element.getBoundingClientRect();
    if (lastValue?.left === left && lastValue.width === width) return;
    lastValue = { left, width };
    store.set(rightPanelComposerOverlayAlignment, lastValue);
  });
  return () => {
    active = false;
    stop();
    if (store.get(rightPanelComposerOverlayAlignment) === lastValue) {
      store.set(rightPanelComposerOverlayAlignment, null);
    }
  };
}

function initializeRightPanelComposerOverlayAlignment(): void {
  initializeElementObserver();
  initializeSignalRuntime();
  initializeConversationScope();
  const createSignal = createScopedSignal as unknown as (
    scope: unknown,
    initialValue: () => null,
  ) => unknown;
  rightPanelComposerOverlayAlignment = createSignal(
    conversationScope,
    () => null,
  );
}

export {
  observeRightPanelComposerOverlayAlignment as n,
  rightPanelComposerOverlayAlignment as r,
  initializeRightPanelComposerOverlayAlignment as t,
};
