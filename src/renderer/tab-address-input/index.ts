import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import { i as initializePopupSuggestions, r as AddressSuggestionController, t as AddressSuggestionList, type AddressSuggestionSource } from "@rchunk/popup";

interface TabAddressInputProps {
  addressValue: string;
  allowEmptySuggestions?: boolean;
  className?: string;
  currentAddress?: string;
  id: string;
  isAddressEditing?: boolean;
  isVisible?: boolean;
  placeholder?: string;
  sources: AddressSuggestionSource[];
  submittedAddressStillPending?: boolean;
  onAddressValueChange(value: string): void;
  onCancelAddressEditing?(): void;
  onCommitAddress(address: string): void;
  onEnsureAddressEditing?(): void;
  onFind?(): void;
  onFinishAddressEditing?(): void;
  onStartAddressEditing?(): void;
  onStopAddressEditing?(): void;
}
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function TabAddressInput(props: TabAddressInputProps): unknown {
  const controller = new AddressSuggestionController();
  controller.start({ value: props.addressValue, selectionStart: props.addressValue.length, selectionEnd: props.addressValue.length }, props.sources);
  const snapshot = controller.getSnapshot(props.sources);
  const commit = (): void => props.onCommitAddress(snapshot.selectedSuggestion?.id ?? props.addressValue);
  const onKeyDown = (event: { key: string; preventDefault(): void }): void => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); controller.moveSelection(event.key === "ArrowDown" ? 1 : -1, props.sources); }
    else if (event.key === "Enter") { event.preventDefault(); commit(); }
    else if (event.key === "Escape") props.onCancelAddressEditing?.();
  };
  return jsx().jsxs(jsx().Fragment, { children: [jsx().jsx("input", { id: props.id, className: props.className, value: props.addressValue, placeholder: props.placeholder, "aria-busy": props.submittedAddressStillPending, onChange: (event: { currentTarget: { value: string } }) => props.onAddressValueChange(event.currentTarget.value), onFocus: props.onStartAddressEditing, onBlur: props.onFinishAddressEditing, onKeyDown }), props.isAddressEditing !== false && props.isVisible !== false && snapshot.suggestions.length > 0 ? jsx().jsx(AddressSuggestionList, { label: "Address suggestions", listboxId: `address-suggestions-${props.id}`, suggestions: snapshot.suggestions, selectedIndex: snapshot.selectedIndex, onDelete: suggestion => controller.deleteSuggestion(suggestion, props.sources), onSelect: suggestion => props.onCommitAddress(suggestion.id) }) : null] });
}
function initializeTabAddressInput(): void { initializePopupSuggestions(); void jsx(); }
export { initializeTabAddressInput as n, TabAddressInput as t };
