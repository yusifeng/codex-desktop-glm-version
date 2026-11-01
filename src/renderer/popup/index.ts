import "@rchunk/rolldown-runtime";
import * as sharedChunk from "@rchunk/app-shared";
import type { JsxRuntime } from "@rchunk/app-shared";

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

interface CachedSuggestions {
  sources: AddressSuggestionSource[];
  results: Array<{ result: AddressSuggestionResult; source: AddressSuggestionSource }>;
  suggestions: AddressSuggestion[];
  snapshot: AddressSuggestionSnapshot | null;
}

const matchRank = { exact: 0, prefix: 1, substring: 2 } as const;
const shared = sharedChunk as unknown as Record<string, any>;
const classNames = (...values: unknown[]): string => typeof shared.m4 === "function" ? shared.m4(...values) : values.flat().filter(Boolean).join(" ");

class AddressSuggestionController {
  private listeners = new Set<() => void>();
  private query: AddressSuggestionQuery | null = null;
  private selection: { id: string; keyboard: boolean; sourceId: string } | null = null;
  private sources: AddressSuggestionSource[] = [];
  private frozenIds: string[] | null = null;
  private retainedPreview: AddressSuggestionPreview | null = null;
  private retainedDisplayedId: string | undefined;
  private pendingDeletion: { id: string; index: number; sourceId: string } | null = null;
  private cached: CachedSuggestions | null = null;
  private composing = false;
  private preventInlineAutocomplete = false;

  subscribe = (listener: () => void, sources = this.sources): (() => void) => {
    this.listeners.add(listener);
    const unsubscribe: Array<() => void> = [];
    sources.forEach(source => {
      const cleanup = source.subscribe?.(() => { this.cached = null; this.publish(); });
      if (typeof cleanup === "function") unsubscribe.push(cleanup);
    });
    return () => { this.listeners.delete(listener); unsubscribe.forEach(cleanup => cleanup()); };
  };

  getSnapshot = (sources = this.sources): AddressSuggestionSnapshot => {
    const query = this.query;
    if (this.cached?.sources !== sources) {
      const results = query == null ? [] : sources.flatMap(source => {
        const result = source.getSuggestions(query.value);
        return result == null ? [] : [{ result, source }];
      });
      const suggestions = results.flatMap(({ result }) => result.suggestions).sort((left, right) => {
        const leftRank = left.textMatch == null ? 3 : matchRank[left.textMatch];
        const rightRank = right.textMatch == null ? 3 : matchRank[right.textMatch];
        return leftRank - rightRank || Number(Boolean(right.isExistingDestination)) - Number(Boolean(left.isExistingDestination));
      });
      this.cached = { sources, results, suggestions, snapshot: null };
    }
    if (this.cached.snapshot != null) return this.cached.snapshot;
    const { results, suggestions: allSuggestions } = this.cached;
    const byId = new Map(allSuggestions.map(item => [item.id, item]));
    const suggestions = this.frozenIds == null ? allSuggestions : this.frozenIds.flatMap(id => byId.get(id) ?? []);
    const retainedIds = new Set(results.filter(({ result }) => result.isRetained).flatMap(({ result }) => result.suggestions.map(item => item.id)));
    const retainedPreview = this.retainedDisplayedId != null && retainedIds.has(this.retainedDisplayedId) ? this.retainedPreview : null;
    const selectedId = this.selection?.id ?? (retainedPreview == null ? undefined : this.retainedDisplayedId);
    const selectedIndex = suggestions.findIndex(item => item.id === selectedId);
    const selectedSuggestion = suggestions[selectedIndex] ?? null;
    const displayedSelectedIndex = selectedIndex < 0 && query?.value !== "" && this.retainedDisplayedId != null && retainedIds.has(this.retainedDisplayedId)
      ? suggestions.findIndex(item => item.id === this.retainedDisplayedId) : selectedIndex;
    let preview: AddressSuggestionPreview | null = null;
    if (selectedSuggestion != null) {
      if (retainedPreview != null) preview = retainedPreview;
      else if (this.selection?.keyboard) preview = selectedSuggestion.preview?.selected ?? null;
      else if (!query?.preventInlineAutocomplete) preview = selectedSuggestion.preview?.inline ?? null;
    }
    const snapshot = { displayedSelectedIndex, isKeyboardSelection: this.hasKeyboardSelection(), isSelectedSuggestionMissing: this.selection != null && selectedSuggestion == null, preview, query: query?.value ?? null, selectedIndex, selectedSuggestion, suggestions };
    this.cached.snapshot = snapshot;
    return snapshot;
  };

  start(query: AddressSuggestionQuery, sources: AddressSuggestionSource[]): void {
    if (query.value.length > 0 && query.value.trim().length === 0) { this.stop("clobbered", false); return; }
    const previous = this.getSnapshot(sources);
    const oldPreview = previous.preview;
    const { value, selectionStart, selectionEnd } = query;
    const preventInlineAutocomplete = value.length === 0 || !!query.preventInlineAutocomplete || this.composing || selectionStart !== value.length || selectionEnd !== value.length;
    const canRetainPreview = !preventInlineAutocomplete && !this.hasKeyboardSelection() && previous.query != null && oldPreview != null
      && oldPreview.selectionStart === previous.query.length && oldPreview.selectionEnd === oldPreview.value.length
      && oldPreview.selectionStart < oldPreview.selectionEnd && value.length > previous.query.length
      && value.toLowerCase().startsWith(previous.query.toLowerCase()) && oldPreview.value.toLowerCase().startsWith(value.toLowerCase());
    this.retainedPreview = canRetainPreview ? { selectionEnd: oldPreview.value.length, selectionStart: value.length, value: `${value}${oldPreview.value.slice(value.length)}` } : null;
    this.retainedDisplayedId = previous.suggestions[previous.displayedSelectedIndex]?.id;
    this.selection = null;
    this.frozenIds = null;
    this.pendingDeletion = null;
    const nextQuery = { value, selectionStart, selectionEnd, preventInlineAutocomplete };
    this.query = nextQuery;
    this.cached = null;
    for (const source of this.sources) if (!sources.some(next => next.id === source.id)) source.stop?.("interaction", false);
    this.sources = sources;
    sources.forEach(source => source.start?.(nextQuery, () => { if (this.query === nextQuery) this.onSourceChange(source); }));
    this.selectDefault(sources);
    this.publish();
  }

  stop(reason: string, resetComposition: boolean): void {
    this.query = null; this.selection = null; this.frozenIds = null; this.retainedPreview = null;
    this.retainedDisplayedId = undefined; this.pendingDeletion = null; this.preventInlineAutocomplete = false;
    if (resetComposition) this.composing = false;
    this.sources.forEach(source => source.stop?.(reason, resetComposition));
    this.sources = []; this.cached = null;
    this.publish();
  }

  moveSelection(offset: number, sources = this.sources): void {
    const snapshot = this.getSnapshot(sources);
    if (snapshot.suggestions.length === 0 || this.query == null) return;
    const index = snapshot.selectedIndex < 0
      ? offset > 0 ? 0 : snapshot.suggestions.length - 1
      : (snapshot.selectedIndex + offset + snapshot.suggestions.length) % snapshot.suggestions.length;
    const suggestion = snapshot.suggestions[index];
    const source = sources.find(candidate => {
      const result = candidate.getSuggestions(this.query!.value);
      return result != null && !result.isRetained && result.suggestions.some(item => item.id === suggestion.id);
    });
    if (source != null) {
      this.frozenIds ??= snapshot.suggestions.map(item => item.id);
      this.selection = { id: suggestion.id, keyboard: true, sourceId: source.id };
      this.publish();
    }
  }

  deleteSuggestion(suggestion: AddressSuggestion, sources = this.sources): boolean {
    if (suggestion.deleteAction == null || this.query == null) return false;
    const source = this.sourceFor(suggestion.id, sources);
    if (source == null) return false;
    this.pendingDeletion = { sourceId: source.id, id: suggestion.id, index: source.getSuggestions(this.query.value)?.suggestions.findIndex(item => item.id === suggestion.id) ?? -1 };
    if (suggestion.deleteAction.run()) { this.frozenIds = null; this.publish(); return true; }
    this.pendingDeletion = null;
    return false;
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
  private onSourceChange(source: AddressSuggestionSource): void {
    const sources = this.cached?.sources ?? this.sources;
    const current = sources.find(candidate => candidate.id === source.id);
    if (this.query == null || current == null) return;
    const result = current.getSuggestions(this.query.value);
    this.cached = null;
    if (result == null) { this.publish(); return; }
    const deletion = this.pendingDeletion;
    if (deletion?.sourceId === current.id && !result.suggestions.some(item => item.id === deletion.id)) {
      if (this.selection?.id === deletion.id) {
        const replacement = result.suggestions[Math.min(deletion.index, result.suggestions.length - 1)];
        this.selection = replacement == null ? null : { ...this.selection, id: replacement.id };
      }
      this.pendingDeletion = null;
    } else if (!result.isRetained && !this.hasKeyboardSelection() && (this.selection == null || this.selection.sourceId === current.id)) this.selectDefault(sources);
    this.publish();
  }
  private selectDefault(sources: AddressSuggestionSource[]): void {
    const snapshot = this.getSnapshot(sources);
    for (const suggestion of snapshot.suggestions) {
      if (!suggestion.canBeDefault) continue;
      const source = this.cached?.results.find(({ result }) => !result.isRetained && result.suggestions.some(item => item.id === suggestion.id))?.source;
      if (source != null) { this.selection = { id: suggestion.id, sourceId: source.id, keyboard: false }; return; }
    }
    this.selection = null;
  }
  private publish(): void { if (this.cached != null) this.cached.snapshot = null; this.listeners.forEach(listener => listener()); }
}

interface SuggestionListProps { label: string; listboxId: string; suggestions: AddressSuggestion[]; selectedIndex: number; onDelete?(suggestion: AddressSuggestion): void; onDeleteBlur?(target: EventTarget | null): void; onSelect(suggestion: AddressSuggestion): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= shared.I3(); return runtime; }
function AddressSuggestionList({ label, listboxId, suggestions, selectedIndex, onDelete, onDeleteBlur, onSelect }: SuggestionListProps): unknown {
  return jsx().jsx("div", {
    id: listboxId,
    className: "flex max-h-[inherit] w-full flex-col overflow-y-auto rounded-xl border border-primary-outline bg-primary-soft p-1 text-default shadow-lg",
    "aria-label": label,
    role: "listbox",
    children: suggestions.map((suggestion, index) => {
      const selected = index === selectedIndex;
      const DeleteIcon = shared.cg;
      return jsx().jsxs("div", { className: "group relative", role: "presentation", children: [
        jsx().jsx("button", {
          id: `${listboxId}-option-${index}`,
          className: classNames(
            "flex h-9 w-full shrink-0 cursor-interaction items-center gap-2.5 rounded-lg px-2.5 pe-9 text-start text-[13px] outline-none select-none",
            selected && suggestion.isEmphasized && "bg-primary-soft-active",
            selected && !suggestion.isEmphasized && "bg-primary-ghost-hover",
            !selected && "hover:bg-background-primary-ghost-hover/60",
          ),
          tabIndex: -1, type: "button", "aria-label": suggestion.ariaLabel, "aria-selected": selected,
          "data-browser-sidebar-skip-address-commit": "true", role: "option",
          onClick: () => onSelect(suggestion), onPointerDown: (event: { preventDefault(): void }) => event.preventDefault(), children: suggestion.content,
        }),
        onDelete != null && suggestion.deleteAction != null ? jsx().jsx("button", {
          className: classNames(
            "absolute end-2.5 top-1/2 flex size-5 -translate-y-1/2 cursor-interaction items-center justify-center rounded-md text-tertiary outline-none hover:bg-primary-ghost-hover hover:text-default focus-visible:ring-1 focus-visible:ring-ring",
            !selected && "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
          ),
          type: "button", "aria-label": suggestion.deleteAction.label,
          "data-browser-sidebar-autocomplete-delete": "true", "data-browser-sidebar-skip-address-commit": "true",
          onBlur: (event: { relatedTarget: EventTarget | null }) => onDeleteBlur?.(event.relatedTarget),
          onClick: (event: { stopPropagation(): void }) => { event.stopPropagation(); onDelete(suggestion); },
          onPointerDown: (event: { preventDefault(): void; stopPropagation(): void }) => { event.preventDefault(); event.stopPropagation(); },
          children: typeof DeleteIcon === "function" ? jsx().jsx(DeleteIcon, { legacyIcon: shared.ig, asset16: shared.dw, legacyClassName: "icon-2xs", "aria-hidden": true }) : "Delete",
        }) : null,
      ] }, suggestion.renderKey ?? suggestion.id);
    }),
  });
}
function initializePopupSuggestions(): void {
  for (const candidate of [shared.BO, shared.uw, shared.h4, shared.ug, shared.ag]) if (typeof candidate === "function") candidate();
  void jsx();
}
export { initializePopupSuggestions as i, initializePopupSuggestions as n, AddressSuggestionController as r, AddressSuggestionList as t };
