// home-suggestion-list —— Home suggestion 的 composer/feed 列表表现与 dismiss 行为。
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/home-suggestion-staggered-item";

export interface HomeSuggestionListItem {
  id: string; label: string; icon?: unknown; listIcon?: unknown; trailing?: unknown; tooltipContent?: unknown;
  tooltipInteractive?: boolean; disabled?: boolean; hidden?: boolean; dismissLabel?: string;
  onClick?(): void; onDismiss?(): void;
}

function HomeSuggestionList(input: {
  composerMode?: string | null; disableWhileModelPickerOpen?: boolean; modelPickerOpen?: boolean;
  emptyState?: unknown; items: HomeSuggestionListItem[]; placement?: "above-composer" | "below-composer";
  variant?: "composer" | "feed";
}) {
  const placement = input.placement ?? "above-composer";
  const variant = input.variant ?? "composer";
  const inert = input.disableWhileModelPickerOpen === true && input.modelPickerOpen === true;
  if (input.items.length === 0 && input.emptyState === undefined) return null;
  const iconSize = variant === "feed" ? "tile" : input.composerMode == null ? "small" : "large";
  return {
    kind: "home-suggestion-list" as const,
    composerMode: input.composerMode,
    placement,
    variant,
    inert,
    emptyState: input.items.length === 0 ? input.emptyState : null,
    items: input.items.map((item, index) => ({
      ...item,
      icon: item.listIcon ?? item.icon ?? null,
      iconSize,
      staggerIndex: variant === "feed" || placement === "below-composer"
        ? index
        : input.items.length - index - 1,
      staggerVariant: variant === "feed" ? "feed" : "list",
      disabled: inert || item.disabled === true,
      dismissLabel: item.onDismiss == null ? undefined : item.dismissLabel ?? "Dismiss suggestion",
      activate: () => { if (!inert && item.disabled !== true) item.onClick?.(); },
      dismiss: () => { if (!inert && item.disabled !== true) item.onDismiss?.(); },
    })),
  };
}

function initializeHomeSuggestionList(): void {}
export { initializeHomeSuggestionList as n, HomeSuggestionList as t };
