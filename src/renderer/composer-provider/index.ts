// composer-provider —— Response spacer 的滚动补偿、provider store 与响应完成 watcher。
// 原版：app/webview/assets/composer-provider-15ef4a061c57.js。

import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/thread-scroll-controller-context-value";

export interface ResponseSpacerHandle {
  clear(): void;
  getHeightPx(): number;
  place(): void;
  scrollToBottom(): void;
}

export interface ScrollController {
  scrollToBottom(): void;
  getLastScrollDistanceFromBottomPx(): number;
  scrollToDistanceFromBottomPx(distance: number, behavior: "instant"): void;
  compensateScrollToDistanceFromBottomPx(distance: number): void;
}

function createResponseSpacerStore() {
  let value: ResponseSpacerHandle | null = null;
  const listeners = new Set<() => void>();
  const set = (next: ResponseSpacerHandle | null) => {
    value = next;
    listeners.forEach((listener) => listener());
  };
  return {
    getSnapshot: () => value,
    subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); },
    register(next: ResponseSpacerHandle) { set(next); return () => { if (value === next) set(null); }; },
  };
}

function ResponseSpacer(input: {
  initialPlacementKey?: unknown;
  onResponseSpacerStateChange?(handle: ResponseSpacerHandle | null): void;
  scrollController?: ScrollController;
  viewportHeight?: number;
  scrollPaddingBottom?: number;
}) {
  let heightPx = 0;
  const scroll = input.scrollController;
  const setHeight = (height: number) => { heightPx = Math.max(0, height); };
  const clear = () => setHeight(0);
  const place = () => {
    const available = Math.max(0, (input.viewportHeight ?? 0) - (input.scrollPaddingBottom ?? 0));
    setHeight(Math.max(0, Math.min(available * (2 / 3), available - 240)));
    scroll?.scrollToDistanceFromBottomPx(1, "instant");
  };
  const scrollToBottom = () => { clear(); scroll?.scrollToBottom(); };
  const handle: ResponseSpacerHandle = { clear, getHeightPx: () => heightPx, place, scrollToBottom };
  input.onResponseSpacerStateChange?.(handle);
  if (input.initialPlacementKey != null) place();
  return {
    kind: "response-spacer" as const,
    handle,
    get heightPx() { return heightPx; },
    reduceForUserScroll(delta: number) {
      if (delta <= 0 || heightPx <= 0) return;
      const previous = heightPx;
      setHeight(previous - delta);
      const distance = scroll?.getLastScrollDistanceFromBottomPx() ?? 0;
      scroll?.compensateScrollToDistanceFromBottomPx(Math.max(0, distance - (previous - heightPx)));
    },
    dispose() { input.onResponseSpacerStateChange?.(null); },
  };
}

function ComposerProvider<T>(input: { children: T }) {
  return { kind: "composer-provider" as const, store: createResponseSpacerStore(), children: input.children };
}

function ConversationResponseWatcher(input: {
  conversationId: string;
  setWatching?(conversationId: string, watching: boolean): void;
  onResponseComplete?(responseId: string): void;
}) {
  input.setWatching?.(input.conversationId, true);
  return {
    kind: "conversation-response-watcher" as const,
    complete(responseId: string) { input.onResponseComplete?.(responseId); },
    dispose() { input.setWatching?.(input.conversationId, false); },
  };
}

function initializeConversationResponseWatcher(): void {}
function initializeComposerProvider(): void {}
function initializeResponseSpacer(): void {}

export {
  ResponseSpacer as a,
  initializeConversationResponseWatcher as i,
  initializeComposerProvider as n,
  initializeResponseSpacer as o,
  ConversationResponseWatcher as r,
  ComposerProvider as t,
};
