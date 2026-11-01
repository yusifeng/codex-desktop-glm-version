import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import {
  r as AddressSuggestionController,
  t as AddressSuggestionList,
  type AddressSuggestion,
  type AddressSuggestionSnapshot,
  type AddressSuggestionSource,
} from "@rchunk/popup";

type SelectionMethod = "suggestion_click" | "suggestion_keyboard";
export interface BrowserAddressSuggestion extends AddressSuggestion {
  contents?: string;
  description?: string;
  destinationURL?: string;
  faviconDataURL?: string;
  onSelect?(method: SelectionMethod, state: AddressSuggestionSnapshot | unknown): boolean | void;
}
export interface BrowserSuggestionState {
  active: boolean;
  displayedSelectedIndex?: number;
  isSelectedSuggestionMissing?: boolean;
  kind: string;
  query: string;
  selectedIndex?: number;
  suggestions?: BrowserAddressSuggestion[];
}
export interface BrowserAddressSuggestionOverlayProps {
  allowEmptyQuery?: boolean;
  autocompleteService?: unknown;
  browserConversationId?: string | null;
  composerController?: any;
  composerId: string;
  onActivated?(): void;
  onSelect?(suggestion: BrowserAddressSuggestion, method: SelectionMethod): boolean | void;
  placement?: "top" | "bottom";
  suggestionState: BrowserSuggestionState;
  suggestions?: BrowserAddressSuggestion[];
}

const shared = sharedChunk as unknown as Record<string, any>;
const initial = initialChunk as unknown as Record<string, any>;
let React: any;
let jsx: any;
let initialized = false;
const activatedRuntimes = new WeakSet<object>();

function call(value: unknown): void { if (typeof value === "function") value(); }
function randomTabId(): string {
  const value = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  return typeof shared.hJ === "function" ? shared.hJ(value) : value;
}
function currentComposerState(controller: any): any {
  return shared.wu?.getState?.(controller?.view?.state) ?? controller?.suggestionState ?? null;
}

function createMention(scope: any, match: BrowserAddressSuggestion, input: {
  browserTabId: string; composerController: any; composerId: string; conversationId: string;
}): any {
  const schema = shared.LG;
  const raw = {
    browserId: input.conversationId,
    pluginId: shared.FG?.browser ?? "browser",
    snapshot: { title: match.description || match.contents || match.destinationURL || "New tab", url: match.destinationURL ?? "" },
    source: "iab", tabId: input.browserTabId,
  };
  const parsed = schema?.safeParse?.(raw);
  if (parsed != null && !parsed.success) return null;
  const data = parsed?.data ?? raw;
  const mention = { ...data, faviconUrl: match.faviconDataURL };
  const path = typeof shared.HG === "function" ? shared.HG(data) : `${data.browserId}:${data.tabId}`;
  const storageId = typeof initial.ilt === "function" ? initial.ilt(scope, {
    browserConversationId: input.conversationId, browserTabId: input.browserTabId,
    initialUrl: match.destinationURL, initiator: "address_bar", source: "search",
  }) : null;
  if (storageId == null && typeof initial.ilt === "function") return null;
  try {
    scope?.set?.(initial.axt, "full"); scope?.set?.(initial.Jbt, true); scope?.set?.(initial.bU, true);
    initial.fU?.(scope, { prefersReducedMotion: true }); scope?.set?.(initial.tQ, storageId); initial.ext?.(scope, "main"); initial.Svt?.(input.composerId);
  } catch { /* Optional route state is unavailable in isolated surfaces. */ }
  if (storageId == null || initial.ggt == null || typeof input.composerController?.trackBrowserAutocompleteMentionMetadata !== "function") return mention;
  let dispose: (() => void) | null = null;
  let appeared = false;
  const refresh = () => {
    if (dispose == null) return;
    if (input.composerController.view?.isDestroyed) { dispose(); return; }
    const snapshot = initial.ggt.getSnapshot?.(input.conversationId, storageId);
    if (snapshot == null) { if (initial.ggt.getExistingBrowserStorageId?.(input.conversationId, storageId) == null) dispose(); return; }
    if (snapshot.isLoading || snapshot.isWaitingForResponse) return;
    if (snapshot.url == null || snapshot.url === "" || snapshot.url === "about:blank") { dispose(); return; }
    if (!snapshot.title?.trim?.() || (snapshot.title === "New tab" && mention.snapshot.title !== "New tab")) return;
    const next = schema?.safeParse?.({ ...data, snapshot: { title: snapshot.title, url: snapshot.url } });
    if (next != null && !next.success) { dispose(); return; }
    if (input.composerController.updateBrowserAutocompleteMention?.({ ...(next?.data ?? data), faviconUrl: shared.GG?.(snapshot.faviconUrl) ?? mention.faviconUrl })) dispose();
  };
  const unsubscribeStorage = initial.ggt.subscribe?.(refresh) ?? (() => {});
  const unsubscribeEditor = typeof initial.i8 === "function" ? initial.i8(input.composerController.view, (transaction: any) => {
    if (!transaction) return;
    let found = false;
    input.composerController.view.state.doc.descendants((node: any) => node.type.name === "browserTabMention" && node.attrs.path === path ? (found = true, false) : true);
    if (found) appeared = true; else if (appeared) dispose?.();
  }) : () => {};
  const timeout = window.setTimeout(() => dispose?.(), 30_000);
  dispose = input.composerController.trackBrowserAutocompleteMentionMetadata(() => {
    window.clearTimeout(timeout); unsubscribeStorage(); unsubscribeEditor(); dispose = null;
  });
  queueMicrotask(refresh);
  return mention;
}

function modelFallback(input: BrowserAddressSuggestionOverlayProps): unknown {
  const state = input.suggestionState;
  if (input.browserConversationId == null || !state.active || state.kind !== "browser-autocomplete" || (state.query.length === 0 && input.allowEmptyQuery !== true)) return null;
  const suggestions = input.suggestions ?? state.suggestions ?? [];
  if (suggestions.length === 0) return null;
  let selectedIndex = state.displayedSelectedIndex ?? state.selectedIndex ?? -1;
  if (selectedIndex < 0 && state.isSelectedSuggestionMissing !== true) selectedIndex = 0;
  const listboxId = `composer-browser-address-suggestions-${input.composerId}`;
  const select = (index: number, method: SelectionMethod) => {
    const suggestion = suggestions[index]; if (suggestion == null) return false;
    return (input.onSelect?.(suggestion, method) ?? suggestion.onSelect?.(method, state)) !== false;
  };
  return {
    kind: "browser-address-suggestion-overlay", placement: input.placement ?? "top", label: "Address suggestions", listboxId, suggestions,
    get selectedIndex() { return selectedIndex; }, get activeDescendant() { return selectedIndex < 0 ? null : `${listboxId}-option-${selectedIndex}`; },
    activate() { input.onActivated?.(); }, click(index: number) { return select(index, "suggestion_click"); }, submit() { return select(selectedIndex, "suggestion_keyboard"); },
    keyDown(event: any) {
      if (event.isComposing) return false;
      if (event.key === "Enter" && state.query.length === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) return select(selectedIndex, "suggestion_keyboard");
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return false;
      selectedIndex = (selectedIndex + (event.key === "ArrowDown" ? 1 : -1) + suggestions.length) % suggestions.length; return true;
    },
  };
}

function BrowserAddressSuggestionOverlay(props: BrowserAddressSuggestionOverlayProps): unknown {
  initializeBrowserAddressSuggestionOverlay();
  if (props.composerController == null) return modelFallback(props);
  const state = props.suggestionState;
  const conversationId = props.browserConversationId;
  const allowEmpty = props.allowEmptyQuery ?? initial.ofn?.("2002769348") === true;
  const autocompleteService = props.autocompleteService ?? initial.pnt?.browserAutocomplete;
  if (autocompleteService == null || conversationId == null || !state.active || state.kind !== "browser-autocomplete" || (state.query.length === 0 && !allowEmpty)) return null;
  return jsx.jsx(BrowserAddressSuggestionRuntime, { ...props, autocompleteService, browserConversationId: conversationId, placement: props.placement ?? "top" }, conversationId);
}

function BrowserAddressSuggestionRuntime(props: BrowserAddressSuggestionOverlayProps & { browserConversationId: string }): unknown {
  const scope = typeof shared.LX === "function" ? shared.LX(initial.$en) : null;
  const intl = typeof shared.n4 === "function" ? shared.n4() : { formatMessage: (descriptor: any) => descriptor.defaultMessage };
  const [controller] = React.useState(() => new AddressSuggestionController());
  const [browserTabId] = React.useState(randomTabId);
  const composer = props.composerController;
  const selectMatch = React.useCallback((match: BrowserAddressSuggestion, method: SelectionMethod) => {
    const editorState = currentComposerState(composer);
    if (editorState == null) return false;
    controller.stop("interaction", true);
    if (props.onSelect?.(match, method) === false) return false;
    const mention = createMention(scope, match, { browserTabId, composerController: composer, composerId: props.composerId, conversationId: props.browserConversationId });
    if (mention == null) return false;
    composer.insertBrowserTabMention?.(mention, editorState);
    return true;
  }, [browserTabId, composer, controller, props, scope]);
  const [sources] = React.useState(() => {
    if (props.suggestions != null) return [{ id: "provided", getSuggestions: () => ({ suggestions: props.suggestions }) } as AddressSuggestionSource];
    if (typeof initial.Tlt === "function") return [initial.Tlt(scope, props.autocompleteService, {
      getRequestContext: () => ({ browserTabId, conversationId: typeof shared.lY === "function" ? shared.lY(props.browserConversationId) : props.browserConversationId, surface: "composer" }),
      allowDeletion: false, onSelect: selectMatch,
    })];
    return [];
  });
  const subscribe = React.useCallback((changed: () => void) => {
    let query: string | null = null;
    const refresh = () => {
      const runtimeState = currentComposerState(composer) ?? props.suggestionState;
      const runtime = composer.getBrowserAutocompleteRuntime?.();
      if (runtimeState?.active !== true || runtimeState.kind !== "browser-autocomplete") { if (runtime != null) activatedRuntimes.delete(runtime); return; }
      if (runtimeState.query === query) return;
      query = runtimeState.query;
      if (query.length === 0 && !props.allowEmptyQuery) { controller.stop("clobbered", false); return; }
      controller.start({ value: query, selectionStart: query.length, selectionEnd: query.length, preventInlineAutocomplete: true }, sources);
    };
    const unsubscribeController = controller.subscribe(changed, sources);
    const unsubscribeEditor = typeof initial.i8 === "function" ? initial.i8(composer.view, refresh) : () => {};
    refresh();
    return () => { unsubscribeEditor(); unsubscribeController(); controller.stop("interaction", true); };
  }, [composer, controller, props.allowEmptyQuery, props.suggestionState, sources]);
  const getSnapshot = React.useCallback(() => controller.getSnapshot(sources), [controller, sources]);
  const snapshot: AddressSuggestionSnapshot = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const displayedIndex = snapshot.displayedSelectedIndex < 0 && snapshot.suggestions.length > 0 && !snapshot.isSelectedSuggestionMissing ? 0 : snapshot.displayedSelectedIndex;
  const listboxId = `composer-browser-address-suggestions-${browserTabId}`;
  const activeDescendant = displayedIndex < 0 ? null : `${listboxId}-option-${displayedIndex}`;

  React.useLayoutEffect(() => {
    const element = composer.view.dom;
    const previous = new Map(["role", "aria-autocomplete", "aria-controls", "aria-expanded", "aria-activedescendant"].map(name => [name, element.getAttribute(name)]));
    const runtime = composer.getBrowserAutocompleteRuntime?.();
    if (snapshot.suggestions.length > 0 && runtime != null && !activatedRuntimes.has(runtime)) { activatedRuntimes.add(runtime); props.onActivated?.(); }
    element.setAttribute("role", "combobox"); element.setAttribute("aria-autocomplete", "list"); element.setAttribute("aria-expanded", String(snapshot.suggestions.length > 0));
    if (snapshot.suggestions.length > 0) element.setAttribute("aria-controls", listboxId); else element.removeAttribute("aria-controls");
    if (activeDescendant == null) element.removeAttribute("aria-activedescendant"); else element.setAttribute("aria-activedescendant", activeDescendant);
    return () => { for (const [name, value] of previous) if (value == null) element.removeAttribute(name); else element.setAttribute(name, value); };
  }, [activeDescendant, composer, listboxId, props, snapshot.suggestions.length]);

  const submit = React.useCallback((event: any) => {
    if (snapshot.suggestions.length === 0) return;
    composer.consumeBrowserAutocompleteSubmission?.();
    if (event?.kind === "browser-autocomplete" && event.type === "submit" && event.action === "insert-mention") (snapshot.suggestions[displayedIndex] as BrowserAddressSuggestion | undefined)?.onSelect?.("suggestion_keyboard", snapshot);
  }, [composer, displayedIndex, snapshot]);
  React.useEffect(() => {
    const listener = (event: any) => submit(event);
    composer.eventEmitter?.addListener?.("composer-suggestion-ui-event", listener);
    const pending = snapshot.suggestions.length === 0 ? null : composer.consumeBrowserAutocompleteSubmission?.();
    if (pending != null) submit(pending);
    return () => composer.eventEmitter?.removeListener?.("composer-suggestion-ui-event", listener);
  }, [composer, snapshot.suggestions.length, submit]);
  React.useEffect(() => {
    const element = composer.view.dom;
    const onKeyDown = (event: any) => {
      if (event.isComposing || snapshot.suggestions.length === 0) return;
      if (event.key === "Enter" && props.suggestionState.query.length === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        const suggestion = snapshot.suggestions[displayedIndex];
        if (suggestion != null) { event.preventDefault(); event.stopPropagation(); (suggestion as BrowserAddressSuggestion).onSelect?.("suggestion_keyboard", snapshot); }
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault(); event.stopPropagation();
      if (snapshot.selectedIndex < 0 && displayedIndex >= 0) controller.moveSelection(1, sources);
      controller.moveSelection(event.key === "ArrowDown" ? 1 : -1, sources);
      requestAnimationFrame(() => document.getElementById(`${listboxId}-option-${controller.getSnapshot(sources).selectedIndex}`)?.scrollIntoView?.({ block: "nearest" }));
    };
    element.addEventListener("keydown", onKeyDown, true);
    return () => element.removeEventListener("keydown", onKeyDown, true);
  }, [composer, controller, displayedIndex, listboxId, props.suggestionState.query.length, snapshot, sources]);
  if (snapshot.suggestions.length === 0) return null;
  const list = jsx.jsx(AddressSuggestionList, {
    label: intl.formatMessage({ id: "thread.browser.addressSuggestions", defaultMessage: "Address suggestions", description: "Accessible label for browser address bar suggestions" }),
    listboxId, suggestions: snapshot.suggestions, selectedIndex: displayedIndex,
    onSelect: (suggestion: BrowserAddressSuggestion) => suggestion.onSelect?.("suggestion_click", snapshot) ?? selectMatch(suggestion, "suggestion_click"),
  });
  const Popover = initial._;
  return typeof Popover === "function" ? jsx.jsx(Popover, { isActive: true, placement: props.placement ?? "top", spacing: "compact", children: list }) : list;
}

function initializeBrowserAddressSuggestionOverlay(): void {
  if (initialized) return;
  initialized = true;
  for (const candidate of [shared.$3, shared.ac, shared.FX, shared.wL, shared.K2, shared.g_, initial.Sx, initial.v, initial.a8, initial.ypn, initial.mnt, initial.itn, initial.ifn, initial.pfn]) call(candidate);
  React = typeof shared.e6 === "function" ? shared.e6() : shared.e6;
  jsx = shared.I3();
}
initializeBrowserAddressSuggestionOverlay();

export { BrowserAddressSuggestionOverlay };
