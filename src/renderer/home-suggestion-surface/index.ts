// home-suggestion-surface —— Home suggestions 的 cards/list 容器、刷新与本地关闭状态。
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/suggestion-card";
import "@rchunk/home-suggestion-list";
import "@rchunk/home-suggestion-staggered-item";

export interface HomeSuggestionSurfaceItem {
  id: string; label: string; icon?: unknown; tooltipContent?: unknown; tooltipInteractive?: boolean;
  disabled?: boolean; onClick?(): void; onDismiss?(): void; [key: string]: unknown;
}

function HomeSuggestionSurface(input: {
  composerMode?: string | null; headline?: unknown; hideSuggestions?: boolean; items: HomeSuggestionSurfaceItem[];
  layout?: "cards" | "list"; isRefreshing?: boolean; showTemplateSelection?: boolean; showCloseAction?: boolean;
  modelPickerOpen?: boolean; reduceMotion?: boolean; followUpSuggestionsPlacement?: "above-composer" | "below-composer";
  portalTarget?: unknown; onRefresh?(): void; onSuggestionGridColumnCountChange?(count: number): void;
}) {
  let dismissed = false;
  const layout = input.layout ?? "cards";
  const hidden = () => input.showTemplateSelection === true || input.hideSuggestions === true || dismissed;
  if (hidden()) return null;
  const renderItems = () => layout === "list"
    ? input.items.map((item, index) => ({ ...item, index, kind: "list-item" as const }))
    : input.items.map((item, index) => ({
        ...item, index, kind: "suggestion-card" as const,
        tooltipContent: input.modelPickerOpen === true ? undefined : item.tooltipContent,
      }));
  return {
    kind: "home-suggestion-surface" as const,
    composerMode: input.composerMode,
    headline: input.headline ?? null,
    layout,
    inert: input.modelPickerOpen === true,
    portalTarget: input.portalTarget ?? null,
    followUpSuggestionsPlacement: input.followUpSuggestionsPlacement,
    transition: { duration: 0.14, ease: [0.23, 1, 0.32, 1] as const, exitY: input.reduceMotion ? 0 : -6 },
    get items() { return hidden() ? [] : renderItems(); },
    showCloseAction: input.showCloseAction ?? true,
    dismiss() { if ((input.showCloseAction ?? true) === true) dismissed = true; },
    get dismissed() { return dismissed; },
    refresh() { if (input.isRefreshing !== true) input.onRefresh?.(); },
    refreshing: input.isRefreshing === true,
    reportGridWidth(widthPx: number, rootFontSizePx = 16, gapPx = 12) {
      const count = Math.max(1, Math.floor((widthPx + gapPx) / (10 * rootFontSizePx + gapPx)));
      input.onSuggestionGridColumnCountChange?.(count);
      return count;
    },
  };
}

function initializeHomeSuggestionSurface(): void {}
export { initializeHomeSuggestionSurface as n, HomeSuggestionSurface as t };
