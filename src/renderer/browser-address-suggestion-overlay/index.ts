// browser-address-suggestion-overlay —— Browser autocomplete 的 listbox、选择与键盘状态机。
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/popup";

export interface BrowserAddressSuggestion {
  id?: string; destinationURL: string; description?: string; contents?: string; faviconDataURL?: string;
  onSelect?(method: "suggestion_click" | "suggestion_keyboard", state: unknown): unknown;
}
export interface BrowserSuggestionState {
  active: boolean; kind: string; query: string; suggestions?: BrowserAddressSuggestion[];
  selectedIndex?: number; displayedSelectedIndex?: number; isSelectedSuggestionMissing?: boolean;
}

function BrowserAddressSuggestionOverlay(input: {
  browserConversationId?: string | null; composerId: string; placement?: "top" | "bottom";
  suggestionState: BrowserSuggestionState; allowEmptyQuery?: boolean; suggestions?: BrowserAddressSuggestion[];
  onSelect?(suggestion: BrowserAddressSuggestion, method: "suggestion_click" | "suggestion_keyboard"): boolean | void;
  onActivated?(): void;
}) {
  const state = input.suggestionState;
  if (input.browserConversationId == null || !state.active || state.kind !== "browser-autocomplete" ||
    (state.query.length === 0 && input.allowEmptyQuery !== true)) return null;
  const suggestions = input.suggestions ?? state.suggestions ?? [];
  if (suggestions.length === 0) return null;
  let selectedIndex = state.displayedSelectedIndex ?? state.selectedIndex ?? -1;
  if (selectedIndex < 0 && state.isSelectedSuggestionMissing !== true) selectedIndex = 0;
  const listboxId = `composer-browser-address-suggestions-${input.composerId}`;
  let activated = false;
  const select = (index: number, method: "suggestion_click" | "suggestion_keyboard") => {
    const suggestion = suggestions[index];
    if (suggestion == null) return false;
    const result = input.onSelect?.(suggestion, method) ?? suggestion.onSelect?.(method, state);
    return result !== false;
  };
  return {
    kind: "browser-address-suggestion-overlay" as const,
    placement: input.placement ?? "top",
    label: "Address suggestions",
    listboxId,
    suggestions,
    get selectedIndex() { return selectedIndex; },
    get activeDescendant() { return selectedIndex < 0 ? null : `${listboxId}-option-${selectedIndex}`; },
    activate() { if (!activated) { activated = true; input.onActivated?.(); } },
    click(index: number) { return select(index, "suggestion_click"); },
    submit() { return select(selectedIndex, "suggestion_keyboard"); },
    keyDown(event: { key: string; isComposing?: boolean; altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }) {
      if (event.isComposing) return false;
      if (event.key === "Enter" && state.query.length === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey)
        return select(selectedIndex, "suggestion_keyboard");
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return false;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      selectedIndex = (selectedIndex + delta + suggestions.length) % suggestions.length;
      return true;
    },
  };
}

export { BrowserAddressSuggestionOverlay };
