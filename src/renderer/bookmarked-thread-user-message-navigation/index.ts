import {
  BX as useParameterizedSignal,
  FX as initializeSignalRuntime,
  I3 as getJsxRuntime,
  LX as useScope,
  __ as useEffectEvent,
  e6 as getReactRuntime,
  g_ as initializeIconRuntime,
  qm as initializeMenuRuntime,
} from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import { AppThreadUserMessageNavigationRail } from "@rchunk/thread-user-message-navigation-rail-app";

interface NavigationItem {
  bookmarkId?: string;
  id: string;
  isBookmarked?: boolean;
  turnKey: string;
  [key: string]: unknown;
}

interface NavigationProps {
  bookmarkKey?: string | null;
  enabled?: boolean;
  getItems(): NavigationItem[];
  onBookmarkChange?(item: NavigationItem, bookmarked: boolean): void;
  onPreviewItem?(item: NavigationItem): void;
  onRevealItem?(item: NavigationItem): void | Promise<void>;
}

interface ScrollTarget {
  measureElement: Element;
  scrollElement: Element;
}

const TOP_TOLERANCE_PX = 24;
const SCROLL_RECHECK_DELAY_MS = 350;
const TARGET_WAIT_TIMEOUT_MS = 1_500;
const ATTACHMENT_SELECTOR = '[aria-label="User attachment"], img[alt="User attachment"]';

let React: ReturnType<typeof getReactRuntime>;
let jsx: ReturnType<typeof getJsxRuntime>;
let initialized = false;
const initial = initialChunk as unknown as Record<string, any>;

function normalizeTurnKey(turnKey: string): string {
  const separator = turnKey.indexOf(":transcript:");
  return separator === -1 ? turnKey : turnKey.slice(0, separator);
}

function findScrollContainer(target: EventTarget | null): HTMLDivElement | null {
  const candidate =
    (target instanceof Element ? target.closest(".thread-scroll-container") : null) ??
    document.querySelector(".thread-scroll-container");
  return candidate instanceof HTMLDivElement ? candidate : null;
}

function findItemTarget(container: HTMLDivElement, itemId: string): ScrollTarget | null {
  for (const unit of container.querySelectorAll<HTMLElement>("[data-content-search-unit-key]")) {
    if (unit.dataset.contentSearchUnitKey !== itemId) continue;
    const messageBubble = unit.querySelector("[data-user-message-bubble]");
    if (messageBubble != null) return { measureElement: messageBubble, scrollElement: unit };
    const attachment = unit.querySelector(ATTACHMENT_SELECTOR);
    return attachment == null
      ? { measureElement: unit, scrollElement: unit }
      : { measureElement: attachment, scrollElement: attachment };
  }
  return null;
}

function pickAdjacentItem(
  items: NavigationItem[],
  container: HTMLDivElement,
  direction: "next" | "previous",
): NavigationItem | null {
  const unitsByKey = new Map<string, Element>();
  for (const unit of container.querySelectorAll<HTMLElement>("[data-content-search-unit-key]")) {
    const key = unit.dataset.contentSearchUnitKey;
    if (key != null && !unitsByKey.has(key)) unitsByKey.set(key, unit);
  }
  const rendered = items.flatMap((item, index) => {
    const unit = unitsByKey.get(item.id);
    const element = unit?.querySelector("[data-user-message-bubble]") ?? unit?.querySelector(ATTACHMENT_SELECTOR) ?? unit;
    return element == null ? [] : [{ element, index, item }];
  });
  if (rendered.length === 0) return direction === "next" ? (items[0] ?? null) : (items.at(-1) ?? null);

  const containerTop = container.getBoundingClientRect().top;
  if (direction === "next") {
    const nextIndex = rendered.findIndex(({ element }) => element.getBoundingClientRect().top > containerTop + TOP_TOLERANCE_PX);
    return nextIndex === -1
      ? (items[(rendered.at(-1)?.index ?? -1) + 1] ?? null)
      : (items[(rendered[nextIndex - 1]?.index ?? -1) + 1] ?? null);
  }
  for (let index = rendered.length - 1; index >= 0; index -= 1) {
    const renderedItem = rendered[index];
    const rect = renderedItem.element.getBoundingClientRect();
    if (Math.abs(rect.top - containerTop) <= TOP_TOLERANCE_PX) return items[renderedItem.index - 1] ?? null;
    if (rect.top < containerTop) return renderedItem.item;
  }
  return rendered[0]?.item ?? null;
}

function scrollToTarget(container: HTMLDivElement, target: ScrollTarget): void {
  target.scrollElement.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => {
    if (!container.isConnected || !target.measureElement.isConnected || !target.scrollElement.isConnected) return;
    const containerTop = container.getBoundingClientRect().top;
    const itemTop = target.measureElement.getBoundingClientRect().top;
    if (Math.abs(itemTop - containerTop) > TOP_TOLERANCE_PX) {
      target.scrollElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, SCROLL_RECHECK_DELAY_MS);
}

function waitForItemTarget(container: HTMLDivElement, itemId: string): Promise<ScrollTarget | null> {
  const startedAt = performance.now();
  return new Promise((resolve) => {
    const check = () => {
      const target = container.isConnected ? findItemTarget(container, itemId) : null;
      if (target != null || !container.isConnected || performance.now() - startedAt > TARGET_WAIT_TIMEOUT_MS) {
        resolve(target);
      } else {
        window.requestAnimationFrame(check);
      }
    };
    check();
  });
}

async function revealAndScroll(
  container: HTMLDivElement,
  item: NavigationItem,
  reveal: (item: NavigationItem) => void | Promise<void>,
): Promise<void> {
  await reveal(item);
  const target = await waitForItemTarget(container, item.id);
  if (target != null) scrollToTarget(container, target);
}

function NavigationRail(props: Omit<NavigationProps, "bookmarkKey">): unknown {
  const enabled = props.enabled ?? true;
  const [idleReady, setIdleReady] = React.useState(false);
  const onKeyDown = (useEffectEvent as unknown as <Callback extends (...args: any[]) => any>(callback: Callback) => Callback)((event: KeyboardEvent) => {
    if (
      event.defaultPrevented || !event.altKey || event.shiftKey || event.ctrlKey || event.metaKey ||
      (event.key !== "ArrowUp" && event.key !== "ArrowDown")
    ) return;
    const container = findScrollContainer(event.target);
    if (container == null) return;
    const item = pickAdjacentItem(props.getItems(), container, event.key === "ArrowUp" ? "previous" : "next");
    if (item == null) return;
    const target = findItemTarget(container, item.id);
    if (target != null) {
      event.preventDefault();
      scrollToTarget(container, target);
    } else if (props.onRevealItem != null) {
      event.preventDefault();
      void revealAndScroll(container, item, props.onRevealItem);
    }
  });
  React.useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);
  React.useEffect(() => {
    if (!enabled || idleReady) return;
    const markReady = () => setIdleReady(true);
    const requestIdle = window.requestIdleCallback?.bind(window);
    const cancelIdle = window.cancelIdleCallback?.bind(window);
    if (requestIdle != null && cancelIdle != null) {
      const handle = requestIdle(markReady, { timeout: 2_000 });
      return () => cancelIdle(handle);
    }
    const handle = globalThis.setTimeout(markReady, 0);
    return () => globalThis.clearTimeout(handle);
  }, [enabled, idleReady]);
  if (!enabled || !idleReady) return null;
  return jsx.jsx(AppThreadUserMessageNavigationRail, {
    items: props.getItems(),
    onBookmarkChange: props.onBookmarkChange,
    onPreviewItem: props.onPreviewItem,
    onRevealItem: props.onRevealItem,
  });
}

function BookmarkedThreadUserMessageNavigation({ bookmarkKey, getItems, ...props }: NavigationProps): unknown {
  const scope = useScope(initial.$en);
  const bookmarksEnabled = (initial.ofn as (gate: unknown) => boolean)(initial.u1t);
  const bookmarkedIds = useParameterizedSignal(initial.d1t, bookmarksEnabled ? bookmarkKey : null) as unknown as Set<string>;
  const getDecoratedItems = () => {
    const items = getItems();
    if (bookmarkedIds.size === 0) return items;
    const unmatched = new Set(bookmarkedIds);
    return items.map((item) => {
      const turnKey = normalizeTurnKey(item.turnKey);
      return unmatched.delete(turnKey) || bookmarkedIds.has(item.bookmarkId ?? item.id)
        ? { ...item, isBookmarked: true }
        : item;
    });
  };
  const onBookmarkChange = bookmarksEnabled && bookmarkKey != null
    ? (item: NavigationItem, bookmarked: boolean) => {
        initial.p1t(scope, bookmarkKey, item.bookmarkId ?? item.id, bookmarked);
        const turnKey = normalizeTurnKey(item.turnKey);
        if (!bookmarked && bookmarkedIds.has(turnKey) && getItems().find((candidate) => normalizeTurnKey(candidate.turnKey) === turnKey)?.id === item.id) {
          initial.p1t(scope, bookmarkKey, turnKey, false);
        }
      }
    : undefined;
  return jsx.jsx(NavigationRail, { ...props, getItems: getDecoratedItems, onBookmarkChange });
}

function initializeBookmarkedNavigation(): void {
  if (initialized) return;
  initialized = true;
  initializeSignalRuntime();
  initial.itn();
  initial.ifn();
  initial.f1t();
  initializeMenuRuntime();
  initializeIconRuntime();
  React = getReactRuntime();
  jsx = getJsxRuntime();
}

export { initializeBookmarkedNavigation as n, BookmarkedThreadUserMessageNavigation as t };
