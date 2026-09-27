import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";

export interface AddressSuggestionPreview { selectionEnd: number; selectionStart: number; value: string }
export interface AddressSuggestion {
  ariaLabel?: string;
  canBeDefault?: boolean;
  content?: unknown;
  deleteAction?: { label: string; run(): boolean };
  id: string;
  isEmphasized?: boolean;
  isExistingDestination?: boolean;
  preview?: { inline?: AddressSuggestionPreview | null; selected?: AddressSuggestionPreview | null };
  renderKey?: string;
  textMatch?: "exact" | "prefix" | "substring";
}
export interface AddressSuggestionResult { isRetained?: boolean; suggestions: AddressSuggestion[] }
export interface AddressSuggestionSource {
  getSuggestions(value: string): AddressSuggestionResult | null;
  id: string;
  start?(query: AddressSuggestionQuery, changed: () => void): void;
  stop?(reason: string, resetComposition: boolean): void;
  subscribe?(changed: () => void): (() => void) | void;
}
export interface AddressSuggestionQuery extends AddressSuggestionPreview { preventInlineAutocomplete?: boolean }
export interface AddressSuggestionSnapshot {
  displayedSelectedIndex: number;
  isKeyboardSelection: boolean;
  isSelectedSuggestionMissing: boolean;
  preview: AddressSuggestionPreview | null;
  query: string | null;
  selectedIndex: number;
  selectedSuggestion: AddressSuggestion | null;
  suggestions: AddressSuggestion[];
}

const matchRank = { exact: 0, prefix: 1, substring: 2 } as const;

class AddressSuggestionController {
  private listeners = new Set<() => void>();
  private query: AddressSuggestionQuery | null = null;
  private selection: { id: string; keyboard: boolean; sourceId: string } | null = null;
  private sources: AddressSuggestionSource[] = [];
  private composing = false;
  private preventInlineAutocomplete = false;

  subscribe = (listener: () => void, sources = this.sources): (() => void) => {
    this.listeners.add(listener);
    const unsubscribe: Array<() => void> = [];
    sources.forEach(source => {
      const cleanup = source.subscribe?.(() => this.publish());
      if (typeof cleanup === "function") unsubscribe.push(cleanup);
    });
    return () => { this.listeners.delete(listener); unsubscribe.forEach(cleanup => cleanup()); };
  };

  getSnapshot = (sources = this.sources): AddressSuggestionSnapshot => {
    const results = this.query == null ? [] : sources.flatMap(source => {
      const result = source.getSuggestions(this.query!.value);
      return result == null ? [] : [{ result, source }];
    });
    const suggestions = results.flatMap(({ result }) => result.suggestions).sort((left, right) => {
      const leftRank = left.textMatch == null ? 3 : matchRank[left.textMatch];
      const rightRank = right.textMatch == null ? 3 : matchRank[right.textMatch];
      return leftRank - rightRank || Number(Boolean(right.isExistingDestination)) - Number(Boolean(left.isExistingDestination));
    });
    const selectedIndex = suggestions.findIndex(item => item.id === this.selection?.id);
    const selectedSuggestion = suggestions[selectedIndex] ?? null;
    const preview = selectedSuggestion == null ? null : this.selection?.keyboard
      ? selectedSuggestion.preview?.selected ?? null
      : this.query?.preventInlineAutocomplete ? null : selectedSuggestion.preview?.inline ?? null;
    return { displayedSelectedIndex: selectedIndex, isKeyboardSelection: this.selection?.keyboard === true, isSelectedSuggestionMissing: this.selection != null && selectedSuggestion == null, preview, query: this.query?.value ?? null, selectedIndex, selectedSuggestion, suggestions };
  };

  start(query: AddressSuggestionQuery, sources: AddressSuggestionSource[]): void {
    if (query.value.length > 0 && query.value.trim().length === 0) { this.stop("clobbered", false); return; }
    this.query = { ...query, preventInlineAutocomplete: query.preventInlineAutocomplete || this.composing };
    this.selection = null;
    this.sources = sources;
    sources.forEach(source => source.start?.(this.query!, () => this.publish()));
    const initial = this.getSnapshot(sources).suggestions.find(item => item.canBeDefault);
    if (initial != null) this.selection = { id: initial.id, keyboard: false, sourceId: this.sourceFor(initial.id)?.id ?? "" };
    this.publish();
  }

  stop(reason: string, resetComposition: boolean): void {
    this.sources.forEach(source => source.stop?.(reason, resetComposition));
    this.query = null; this.selection = null; this.sources = [];
    if (resetComposition) this.composing = false;
    this.publish();
  }

  moveSelection(offset: number, sources = this.sources): void {
    const snapshot = this.getSnapshot(sources);
    if (snapshot.suggestions.length === 0 || this.query == null) return;
    const index = snapshot.selectedIndex < 0
      ? offset > 0 ? 0 : snapshot.suggestions.length - 1
      : (snapshot.selectedIndex + offset + snapshot.suggestions.length) % snapshot.suggestions.length;
    const suggestion = snapshot.suggestions[index];
    this.selection = { id: suggestion.id, keyboard: true, sourceId: this.sourceFor(suggestion.id, sources)?.id ?? "" };
    this.publish();
  }

  deleteSuggestion(suggestion: AddressSuggestion, sources = this.sources): boolean {
    if (suggestion.deleteAction == null || this.query == null || this.sourceFor(suggestion.id, sources) == null) return false;
    const deleted = suggestion.deleteAction.run();
    if (deleted && this.selection?.id === suggestion.id) this.selection = null;
    if (deleted) this.publish();
    return deleted;
  }

  hasKeyboardSelection(): boolean { return this.selection?.keyboard === true; }
  setComposing(value: boolean): void { this.composing = value; }
  setPreventInlineAutocompleteOnNextChange(value: boolean): void { this.preventInlineAutocomplete = value; }
  shouldPreventInlineAutocompleteOnNextChange(): boolean { return this.preventInlineAutocomplete; }
  consumePreventInlineAutocompleteOnNextChange(): boolean { const value = this.preventInlineAutocomplete; this.preventInlineAutocomplete = false; return value; }
  isAutocompleteSelection(value: string, selectionStart: number, selectionEnd: number, sources = this.sources): boolean {
    const same = (preview?: AddressSuggestionPreview | null) => preview?.value === value && preview.selectionStart === selectionStart && preview.selectionEnd === selectionEnd;
    const snapshot = this.getSnapshot(sources);
    return same(this.query) || same(snapshot.preview) || snapshot.suggestions.some(item => same(item.preview?.inline) || same(item.preview?.selected));
  }

  private sourceFor(id: string, sources = this.sources): AddressSuggestionSource | undefined {
    return sources.find(source => source.getSuggestions(this.query?.value ?? "")?.suggestions.some(item => item.id === id));
  }
  private publish(): void { this.listeners.forEach(listener => listener()); }
}

interface SuggestionListProps { label: string; listboxId: string; suggestions: AddressSuggestion[]; selectedIndex: number; onDelete?(suggestion: AddressSuggestion): void; onDeleteBlur?(target: EventTarget | null): void; onSelect(suggestion: AddressSuggestion): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function AddressSuggestionList({ label, listboxId, suggestions, selectedIndex, onDelete, onDeleteBlur, onSelect }: SuggestionListProps): unknown {
  return jsx().jsx("div", { id: listboxId, "aria-label": label, role: "listbox", children: suggestions.map((suggestion, index) => jsx().jsxs("div", { role: "presentation", children: [jsx().jsx("button", { id: `${listboxId}-option-${index}`, "aria-label": suggestion.ariaLabel, "aria-selected": index === selectedIndex, role: "option", type: "button", onClick: () => onSelect(suggestion), children: suggestion.content }), onDelete != null && suggestion.deleteAction != null ? jsx().jsx("button", { "aria-label": suggestion.deleteAction.label, type: "button", onBlur: (event: { relatedTarget: EventTarget | null }) => onDeleteBlur?.(event.relatedTarget), onClick: () => onDelete(suggestion), children: "Delete" }) : null] }, suggestion.renderKey ?? suggestion.id)) });
}
function initializePopupSuggestions(): void { void jsx(); }
export { initializePopupSuggestions as i, initializePopupSuggestions as n, AddressSuggestionController as r, AddressSuggestionList as t };
