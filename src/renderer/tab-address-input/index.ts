import "@rchunk/rolldown-runtime";
import * as sharedChunk from "@rchunk/app-shared";
import {
  i as initializePopupSuggestions,
  r as AddressSuggestionController,
  t as AddressSuggestionList,
  type AddressSuggestion,
  type AddressSuggestionSnapshot,
  type AddressSuggestionSource,
} from "@rchunk/popup";

type Ref<T> = { current: T };
type ChangeSignal = { on?(event: "change", listener: () => void): (() => void) | undefined };
interface ExtendedSuggestionSource extends AddressSuggestionSource {
  onRendered?(snapshot: AddressSuggestionSnapshot): void;
  submit?(value: string, snapshot: AddressSuggestionSnapshot): boolean;
}

export interface TabAddressInputProps {
  addressBarRef?: Ref<HTMLElement | null>;
  addressInputRef?: Ref<HTMLInputElement | null>;
  addressValue: string;
  allowEmptySuggestions?: boolean;
  bottomPanelAnimation?: ChangeSignal;
  className?: string;
  currentAddress?: string;
  hasEditedAddressRef?: Ref<boolean>;
  id: string;
  isAddressEditing?: boolean;
  isStoppingAddressEditingRef?: Ref<boolean>;
  isVisible?: boolean;
  panelTarget?: "bottom" | "right" | string;
  placeholder?: string;
  rightPanelLayoutTick?: ChangeSignal;
  showAddressSuggestionsRef?: Ref<(() => void) | null>;
  shouldKeepAddressSelectedRef?: Ref<boolean>;
  sources: ExtendedSuggestionSource[];
  submittedAddressStillPending?: boolean;
  onAddressValueChange(value: string): void;
  onCancelAddressEditing?(target?: EventTarget | null): void;
  onCommitAddress(address: string, snapshot?: AddressSuggestionSnapshot): void;
  onEnsureAddressEditing?(): void;
  onFind?(): void;
  onFinishAddressEditing?(): void;
  onStartAddressEditing?(): void;
  onStopAddressEditing?(): void;
}

const shared = sharedChunk as unknown as Record<string, any>;
let React: any;
let jsx: any;
let initialized = false;

function call(value: unknown): void { if (typeof value === "function") value(); }
function classes(...values: unknown[]): string {
  return typeof shared.m4 === "function" ? shared.m4(...values) : values.flat().filter(Boolean).join(" ");
}
function localRef<T>(value: T): Ref<T> { return React.useRef(value); }

function TabAddressInput(props: TabAddressInputProps): unknown {
  initializeTabAddressInput();
  const {
    addressValue,
    allowEmptySuggestions = false,
    className,
    currentAddress = addressValue,
    id,
    isAddressEditing = true,
    isVisible = true,
    placeholder,
    sources,
    submittedAddressStillPending = false,
  } = props;
  const internalInputRef = localRef<HTMLInputElement | null>(null);
  const internalBarRef = localRef<HTMLElement | null>(null);
  const internalEditedRef = localRef(false);
  const internalStoppingRef = localRef(false);
  const internalKeepSelectedRef = localRef(false);
  const inputRef = props.addressInputRef ?? internalInputRef;
  const addressBarRef = props.addressBarRef ?? internalBarRef;
  const hasEditedAddressRef = props.hasEditedAddressRef ?? internalEditedRef;
  const isStoppingAddressEditingRef = props.isStoppingAddressEditingRef ?? internalStoppingRef;
  const shouldKeepAddressSelectedRef = props.shouldKeepAddressSelectedRef ?? internalKeepSelectedRef;
  const [controller] = React.useState(() => new AddressSuggestionController());
  if (isAddressEditing && isVisible && controller.getSnapshot(sources).query == null && (addressValue.length > 0 || allowEmptySuggestions)) {
    controller.start({ value: addressValue, selectionStart: addressValue.length, selectionEnd: addressValue.length }, sources);
  }
  const subscribe = React.useCallback((changed: () => void) => controller.subscribe(changed, sources), [controller, sources]);
  const getSnapshot = React.useCallback(() => controller.getSnapshot(sources), [controller, sources]);
  const snapshot: AddressSuggestionSnapshot = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const { displayedSelectedIndex, preview, selectedSuggestion, suggestions } = snapshot;
  const listboxId = `address-suggestions-${id}`;
  const listVisible = isAddressEditing && isVisible && suggestions.length > 0;
  const sourceAvailable = sources.some(source => source.getSuggestions(addressValue) != null);
  const displayValue = isAddressEditing ? preview?.value ?? addressValue : addressValue;

  const startSuggestions = React.useCallback((value: string, selectionStart: number, selectionEnd: number, preventInlineAutocomplete = false) => {
    if (value.length === 0 && !allowEmptySuggestions) { controller.stop("clobbered", false); return; }
    controller.start({ value, selectionStart, selectionEnd, preventInlineAutocomplete }, sources);
  }, [allowEmptySuggestions, controller, sources]);

  React.useEffect(() => {
    if (!isAddressEditing || !isVisible) controller.stop("interaction", true);
  }, [controller, isAddressEditing, isVisible]);
  React.useEffect(() => () => controller.stop("interaction", true), [controller]);
  React.useLayoutEffect(() => {
    const input = inputRef.current;
    if (!isAddressEditing || input == null || input !== document.activeElement || preview == null) return;
    if (input.value !== preview.value) input.value = preview.value;
    if (input.selectionStart !== preview.selectionStart || input.selectionEnd !== preview.selectionEnd) input.setSelectionRange(preview.selectionStart, preview.selectionEnd, "forward");
  }, [inputRef, isAddressEditing, preview]);
  React.useLayoutEffect(() => {
    if (listVisible && isVisible) for (const source of sources) source.onRendered?.(snapshot);
  }, [isVisible, listVisible, snapshot, sources]);

  React.useEffect(() => {
    if (!listVisible) return;
    const anchor = addressBarRef.current;
    if (anchor == null || typeof ResizeObserver === "undefined") return;
    const width = anchor.offsetWidth, height = anchor.offsetHeight;
    let stopped = false;
    const stop = () => { if (!stopped) { stopped = true; controller.stop("interaction", false); } };
    const observer = new ResizeObserver(() => { if (anchor.offsetWidth !== width || anchor.offsetHeight !== height) stop(); });
    observer.observe(anchor);
    const onScroll = (event: Event) => {
      const list = document.getElementById(listboxId);
      if (!(event.target instanceof Node) || !list?.contains(event.target)) stop();
    };
    const removeSignal = props.panelTarget === "bottom" ? props.bottomPanelAnimation?.on?.("change", stop) : props.rightPanelLayoutTick?.on?.("change", stop);
    window.addEventListener("resize", stop); window.addEventListener("scroll", onScroll, true);
    window.visualViewport?.addEventListener("resize", stop); window.visualViewport?.addEventListener("scroll", stop);
    return () => {
      observer.disconnect(); removeSignal?.(); window.removeEventListener("resize", stop); window.removeEventListener("scroll", onScroll, true);
      window.visualViewport?.removeEventListener("resize", stop); window.visualViewport?.removeEventListener("scroll", stop);
    };
  }, [addressBarRef, controller, listVisible, listboxId, props.bottomPanelAnimation, props.panelTarget, props.rightPanelLayoutTick]);

  React.useImperativeHandle?.(props.showAddressSuggestionsRef, () => () => {
    const input = inputRef.current;
    if (input != null && input === document.activeElement && input.value.length === 0 && allowEmptySuggestions && !listVisible) {
      startSuggestions(input.value, input.selectionStart ?? 0, input.selectionEnd ?? 0, true);
    }
  }, [allowEmptySuggestions, inputRef, listVisible, startSuggestions]);

  const finishInteraction = (target: EventTarget | null, force = false): void => {
    if (typeof HTMLElement !== "undefined" && target instanceof HTMLElement && (target === inputRef.current || target.dataset.browserSidebarAutocompleteDelete === "true")) return;
    shouldKeepAddressSelectedRef.current = false;
    controller.stop("interaction", true);
    const skipCommit = typeof HTMLElement !== "undefined" && target instanceof HTMLElement && (target.dataset.browserSidebarOpenExternal === "true" || target.dataset.browserSidebarSkipAddressCommit === "true");
    if (force || isStoppingAddressEditingRef.current || target != null) {
      props.onFinishAddressEditing?.();
      if (!skipCommit && !submittedAddressStillPending) props.onCancelAddressEditing?.(target);
      isStoppingAddressEditingRef.current = false;
    }
  };
  const selectSuggestion = (suggestion: AddressSuggestion, method: "suggestion_click" | "suggestion_keyboard" | "typed_enter" | "inline_enter"): void => {
    const current = controller.getSnapshot(sources);
    const selected = current.suggestions.find(item => item.id === suggestion.id);
    if ((selected as any)?.onSelect?.(method, current)) controller.stop("interaction", true);
    else props.onCommitAddress(suggestion.id, current);
  };
  const onPaste = (event: any): void => {
    const text = event.clipboardData.getData("text");
    if (text.length === 0) return;
    event.preventDefault();
    const input = event.currentTarget as HTMLInputElement;
    const start = input.selectionStart ?? input.value.length, end = input.selectionEnd ?? start;
    const value = `${input.value.slice(0, start)}${text}${input.value.slice(end)}`;
    const cursor = start + text.length;
    input.value = value; input.setSelectionRange(cursor, cursor);
    hasEditedAddressRef.current = true; shouldKeepAddressSelectedRef.current = false;
    props.onAddressValueChange(value); startSuggestions(value, cursor, cursor, true);
  };
  const onChange = (event: any): void => {
    const input = event.currentTarget as HTMLInputElement;
    const value = input.value, start = input.selectionStart ?? value.length, end = input.selectionEnd ?? start;
    const prevent = controller.consumePreventInlineAutocompleteOnNextChange();
    hasEditedAddressRef.current = true; shouldKeepAddressSelectedRef.current = false;
    props.onAddressValueChange(value); startSuggestions(value, start, end, prevent);
  };
  const onKeyDown = (event: any): void => {
    if (event.nativeEvent?.isComposing || event.isComposing) return;
    controller.setPreventInlineAutocompleteOnNextChange(event.key === "Backspace" || event.key === "Delete");
    if (event.key?.toLowerCase() === "f" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); event.stopPropagation?.(); props.onFind?.(); return; }
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && suggestions.length > 0) {
      event.preventDefault(); controller.moveSelection(event.key === "ArrowDown" ? 1 : -1, sources);
      requestAnimationFrame(() => document.getElementById(`${listboxId}-option-${controller.getSnapshot(sources).selectedIndex}`)?.scrollIntoView?.({ block: "nearest" }));
      return;
    }
    if (event.key === "Escape") { event.preventDefault(); controller.stop("interaction", true); props.onStopAddressEditing?.(); props.onCancelAddressEditing?.(); return; }
    if (event.key === "Enter" || event.key === "Return") {
      event.preventDefault();
      if (snapshot.isSelectedSuggestionMissing) return;
      if (selectedSuggestion != null) {
        const method = controller.hasKeyboardSelection() ? "suggestion_keyboard" : preview != null ? "inline_enter" : "typed_enter";
        selectSuggestion(selectedSuggestion, method); return;
      }
      if (!sources.some(source => source.submit?.(event.currentTarget.value, snapshot))) props.onCommitAddress(event.currentTarget.value, snapshot);
      controller.stop("interaction", true);
    }
  };
  const onSelect = (event: any): void => {
    const input = event.currentTarget as HTMLInputElement;
    const start = input.selectionStart ?? input.value.length, end = input.selectionEnd ?? start;
    if (!controller.shouldPreventInlineAutocompleteOnNextChange() && (hasEditedAddressRef.current || input.value !== currentAddress) && !controller.isAutocompleteSelection(input.value, start, end, sources)) {
      hasEditedAddressRef.current = true; shouldKeepAddressSelectedRef.current = false;
      props.onAddressValueChange(input.value); startSuggestions(input.value, start, end);
    }
  };
  const selectedOptionId = displayedSelectedIndex >= 0 && displayedSelectedIndex < suggestions.length ? `${listboxId}-option-${displayedSelectedIndex}` : undefined;
  const inputClassName = classes(
    "h-full w-full min-w-0 bg-transparent py-0 text-sm leading-[18px] text-default outline-none select-text placeholder:text-tertiary [&::placeholder]:select-none",
    isAddressEditing ? "cursor-text ps-2 text-start" : "cursor-text text-center focus:ps-2 focus:text-start", className,
  );
  const input = jsx.jsx("input", {
    ref: inputRef, id, className: inputClassName, dir: "ltr", "data-browser-sidebar-address-input": "true",
    "aria-label": placeholder, "aria-activedescendant": selectedOptionId,
    "aria-autocomplete": sourceAvailable ? "both" : undefined, "aria-controls": listVisible ? listboxId : undefined,
    "aria-expanded": sourceAvailable ? listVisible : undefined, "aria-busy": submittedAddressStillPending,
    role: sourceAvailable ? "combobox" : undefined, value: displayValue, placeholder,
    onFocus: props.onEnsureAddressEditing ?? props.onStartAddressEditing,
    onPointerDown: (event: any) => { if (event.currentTarget === document.activeElement) shouldKeepAddressSelectedRef.current = false; else { event.preventDefault(); props.onStartAddressEditing?.(); } props.showAddressSuggestionsRef?.current?.(); },
    onChange, onCompositionStart: () => controller.setComposing(true), onCompositionEnd: () => controller.setComposing(false),
    onCut: (event: any) => { if (event.currentTarget.selectionStart !== event.currentTarget.selectionEnd) controller.setPreventInlineAutocompleteOnNextChange(true); },
    onPaste, onBlur: (event: any) => finishInteraction(event.relatedTarget), onKeyDown, onSelect,
  });
  let list: unknown = null;
  if (listVisible) {
    const content = jsx.jsx(AddressSuggestionList, {
      label: "Address suggestions", listboxId, suggestions, selectedIndex: displayedSelectedIndex,
      onDelete: (suggestion: AddressSuggestion) => { if (controller.deleteSuggestion(suggestion, sources)) inputRef.current?.focus(); },
      onDeleteBlur: (target: EventTarget | null) => finishInteraction(target, true),
      onSelect: (suggestion: AddressSuggestion) => selectSuggestion(suggestion, "suggestion_click"),
    });
    const Popover = shared.vs;
    list = typeof Popover === "function" ? jsx.jsx(Popover, {
      anchorRef: addressBarRef, constrainHeightToViewport: true, gap: 0, isActive: true, minWidth: 360,
      placement: "bottom", portalRoot: "body", zIndexClassName: "z-30", children: content,
    }) : content;
  }
  return jsx.jsxs(jsx.Fragment, { children: [input, list] });
}

function initializeTabAddressInput(): void {
  if (initialized) return;
  initialized = true;
  for (const candidate of [shared.$3, shared.h4, shared.K2]) call(candidate);
  React = typeof shared.e6 === "function" ? shared.e6() : shared.e6;
  initializePopupSuggestions();
  jsx = shared.I3();
}
initializeTabAddressInput();

export { initializeTabAddressInput as n, TabAddressInput as t };
