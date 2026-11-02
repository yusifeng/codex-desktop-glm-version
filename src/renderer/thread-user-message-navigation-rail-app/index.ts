import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as scrollControllerChunk from "@rchunk/thread-scroll-controller-context-value";
import "@rchunk/plan-implementation-request";
import "@rchunk/commit-icon";
import "@rchunk/pull-request";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

export interface NavigationItem {
  bookmarked?: boolean;
  hierarchyLevel?: number;
  id: string;
  isBookmarked?: boolean;
  preview?: unknown;
  title?: string;
  turnKey?: string;
  [key: string]: unknown;
}
export interface AppThreadUserMessageNavigationRailProps {
  items: NavigationItem[];
  onBookmarkChange?(item: NavigationItem, bookmarked: boolean): void;
  onPreviewItem?(item: NavigationItem): void;
  onRevealItem?(item: NavigationItem): void;
}
interface SharedRuntime {
  HX?<Value>(signal: unknown): Value;
  I3(): JsxRuntime;
  P3?(): { createPortal(child: unknown, container: Element): unknown };
  e6(): ReactRuntime;
  n4?(): {
    formatMessage(
      descriptor: Record<string, unknown>,
      values?: Record<string, unknown>,
    ): string;
  };
  [key: string]: unknown;
}

const shared = appSharedChunk as unknown as SharedRuntime;
const initial = appInitialChunk as unknown as Record<string, unknown>;
const scrollRuntime = scrollControllerChunk as unknown as {
  n?: () => void;
  r?: () => { getScrollElement?(): HTMLElement | null };
};
let React: ReactRuntime;
let jsx: JsxRuntime;
let createPortal: ((child: unknown, container: Element) => unknown) | undefined;
let initialized = false;

function initializeNavigationRail(): void {
  if (initialized) return;
  for (const value of [
    shared.$3,
    shared.FX,
    shared.K2,
    shared.QI,
    scrollRuntime.n,
    initial.E7,
    initial.n0,
    initial.xlt,
    initial.ypn,
  ]) {
    if (typeof value === "function") (value as () => void)();
  }
  React = shared.e6();
  jsx = shared.I3();
  createPortal = shared.P3?.().createPortal;
  initialized = true;
}

function escapeSelector(value: string): string {
  return typeof CSS !== "undefined" && CSS.escape != null
    ? CSS.escape(value)
    : value.replaceAll('"', '\\"');
}

function turnElement(
  root: ParentNode | null,
  item: NavigationItem,
): HTMLElement | null {
  if (root == null) return null;
  const key = escapeSelector(item.turnKey ?? item.id);
  return root.querySelector<HTMLElement>(
    `[data-turn-key="${key}"], [data-content-search-turn-key="${key}"], [data-chatgpt-conversation-turn-id="${escapeSelector(item.id)}"]`,
  );
}

function flashTurn(element: HTMLElement, reducedMotion: boolean): void {
  const target =
    element.querySelector<HTMLElement>(
      "[data-user-message-bubble], [data-composer-attachment-pill]",
    ) ?? element;
  target.animate?.(
    [
      {
        backgroundColor:
          "color-mix(in srgb, var(--color-text) 14%, transparent)",
      },
      {
        backgroundColor:
          "color-mix(in srgb, var(--color-text) 5%, transparent)",
      },
    ],
    {
      duration: reducedMotion ? 0 : 650,
      easing: "cubic-bezier(0.23, 1, 0.32, 1)",
    },
  );
}

function Marker({
  active,
  bookmarked,
  hierarchyLevel,
}: {
  active: boolean;
  bookmarked: boolean;
  hierarchyLevel?: number;
}): unknown {
  return jsx.jsxs("span", {
    "aria-hidden": true,
    className: "flex h-2.5 w-9 items-center",
    "data-active": active || undefined,
    "data-hierarchy-level": hierarchyLevel,
    children: [
      jsx.jsx("span", {
        className: active
          ? "h-0.5 w-8 rounded-full bg-primary"
          : "h-0.5 w-[30px] rounded-full bg-secondary",
      }),
      bookmarked
        ? jsx.jsx("span", { className: "-ml-1 size-1 rounded-full bg-primary" })
        : null,
    ],
  });
}

function PreviewCard({
  item,
  onBookmarkChange,
}: {
  item: NavigationItem;
  onBookmarkChange?: AppThreadUserMessageNavigationRailProps["onBookmarkChange"];
}): unknown {
  const bookmarked = item.isBookmarked ?? item.bookmarked ?? false;
  return jsx.jsxs("div", {
    className:
      "w-80 max-w-[calc(100vw-1rem)] rounded-xl bg-surface-elevated-secondary/95 p-2 text-sm leading-5 text-default shadow-xl-spread ring-[0.5px] ring-border backdrop-blur-sm",
    children: [
      item.preview ??
        jsx.jsx("p", {
          className: "line-clamp-4",
          children: item.title ?? "User message",
        }),
      onBookmarkChange == null
        ? null
        : jsx.jsx("button", {
            type: "button",
            "aria-pressed": bookmarked,
            onClick: () => onBookmarkChange(item, !bookmarked),
            children: bookmarked ? "Remove bookmark" : "Bookmark turn",
          }),
    ],
  });
}

function NavigationRail(
  props: AppThreadUserMessageNavigationRailProps,
): unknown {
  const controller = scrollRuntime.r?.();
  const getScrollElement = controller?.getScrollElement ?? (() => null);
  const reducedMotion =
    typeof initial.Rnt === "function"
      ? Boolean((initial.Rnt as () => unknown)())
      : false;
  const [activeIds, setActiveIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [preview, setPreview] = React.useState<{
    button: HTMLElement;
    item: NavigationItem;
  } | null>(null);
  const [scrubbing, setScrubbing] = React.useState(false);
  const railRef = React.useRef<HTMLElement | null>(null);
  const pointerId = React.useRef<number | null>(null);

  React.useEffect(() => {
    const root = getScrollElement();
    if (root == null || typeof IntersectionObserver === "undefined") return;
    const byElement = new Map<Element, string>();
    const observer = new IntersectionObserver(
      (entries) => {
        setActiveIds((current) => {
          const next = new Set(current);
          for (const entry of entries) {
            const id = byElement.get(entry.target);
            if (id == null) continue;
            if (entry.isIntersecting) next.add(id);
            else next.delete(id);
          }
          return next;
        });
      },
      { root, rootMargin: "-20% 0px -65% 0px", threshold: 0 },
    );
    for (const item of props.items) {
      const element = turnElement(root, item);
      if (element == null) continue;
      byElement.set(element, item.id);
      observer.observe(element);
    }
    return () => observer.disconnect();
  }, [getScrollElement, props.items]);

  const reveal = (
    item: NavigationItem,
    behavior: ScrollBehavior = reducedMotion ? "auto" : "smooth",
  ): void => {
    props.onRevealItem?.(item);
    const fallbackRoot = typeof document === "undefined" ? null : document;
    const element = turnElement(getScrollElement() ?? fallbackRoot, item);
    element?.scrollIntoView({ behavior, block: "center" });
    if (element != null) flashTurn(element, reducedMotion);
  };
  const previewItem = (item: NavigationItem, button: HTMLElement): void => {
    props.onPreviewItem?.(item);
    setPreview({ button, item });
  };
  const scrubAt = (event: {
    clientY: number;
    currentTarget: HTMLElement;
  }): void => {
    const buttons = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(
        "[data-thread-user-message-navigation-item-id]",
      ),
    ];
    const button = buttons.find((candidate) => {
      const rect = candidate.getBoundingClientRect();
      return event.clientY >= rect.top && event.clientY <= rect.bottom;
    });
    const item = props.items.find(
      (candidate) =>
        candidate.id === button?.dataset.threadUserMessageNavigationItemId,
    );
    if (item == null || button == null) return;
    previewItem(item, button);
    reveal(item, "auto");
  };
  const endScrub = (event: {
    currentTarget: HTMLElement;
    pointerId: number;
  }): void => {
    if (pointerId.current !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    pointerId.current = null;
    setScrubbing(false);
  };
  const label =
    shared
      .n4?.()
      .formatMessage({
        id: "thread.userMessageNavigation.ariaLabel",
        defaultMessage: "User message navigation",
      }) ?? "User message navigation";
  const rail = jsx.jsxs("nav", {
    "aria-label": label,
    className:
      "thread-user-message-navigation-rail absolute top-1/2 left-3 z-20 -translate-y-1/2 electron:left-4",
    children: [
      jsx.jsx("div", {
        ref: (node: HTMLElement | null) => {
          railRef.current = node;
        },
        "data-floating-navigation-rail-list": true,
        "data-scrubbing": scrubbing,
        className:
          "vertical-scroll-fade-mask hide-scrollbar flex max-h-[min(70vh,40rem)] flex-col overflow-y-auto overscroll-contain",
        onPointerDown: (event: {
          button: number;
          currentTarget: HTMLElement;
          pointerId: number;
          clientY: number;
        }) => {
          if (event.button !== 0) return;
          pointerId.current = event.pointerId;
          event.currentTarget.setPointerCapture?.(event.pointerId);
          setScrubbing(true);
          scrubAt(event);
        },
        onPointerMove: (event: {
          buttons: number;
          currentTarget: HTMLElement;
          pointerId: number;
          clientY: number;
        }) => {
          if (pointerId.current === event.pointerId && event.buttons % 2 === 1)
            scrubAt(event);
        },
        onPointerUp: endScrub,
        onPointerCancel: endScrub,
        children: props.items.map((item, index) => {
          const bookmarked = item.isBookmarked ?? item.bookmarked ?? false;
          return jsx.jsx(
            "button",
            {
              "aria-current": activeIds.has(item.id) ? "true" : undefined,
              "aria-label": `${bookmarked ? "Bookmarked " : ""}user message ${index + 1}`,
              "data-thread-user-message-navigation-item-id": item.id,
              className:
                "flex h-2.5 w-9 shrink-0 cursor-interaction items-center outline-none",
              type: "button",
              onClick: () => reveal(item),
              onFocus: (event: { currentTarget: HTMLElement }) =>
                previewItem(item, event.currentTarget),
              onPointerEnter: (event: { currentTarget: HTMLElement }) =>
                previewItem(item, event.currentTarget),
              children: jsx.jsx(Marker, {
                active: activeIds.has(item.id),
                bookmarked,
                hierarchyLevel: item.hierarchyLevel,
              }),
            },
            item.id,
          );
        }),
      }),
      preview == null
        ? null
        : jsx.jsx("div", {
            className: "absolute top-1/2 left-full ml-2 -translate-y-1/2",
            onMouseLeave: () => setPreview(null),
            children: jsx.jsx(PreviewCard, {
              item: preview.item,
              onBookmarkChange: props.onBookmarkChange,
            }),
          }),
    ],
  });
  const portal =
    typeof Element !== "undefined" && initial.T7 instanceof Element
      ? initial.T7
      : null;
  return portal != null && createPortal != null
    ? createPortal(rail, portal)
    : rail;
}

function AppThreadUserMessageNavigationRail(
  props: AppThreadUserMessageNavigationRailProps,
): unknown {
  initializeNavigationRail();
  if (props.items.length < 4) return null;
  return NavigationRail(props);
}

initializeNavigationRail();
export { AppThreadUserMessageNavigationRail };
