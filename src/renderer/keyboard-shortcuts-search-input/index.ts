import { $3 as getCompilerRuntime, I3 as getJsxRuntime, K2 as initializeInternationalization, e6 as getReactRuntime, n4 as useIntl } from "@rchunk/app-shared";
import { mT as initializeSearchInput, pT as SearchInput } from "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";

export interface KeyboardShortcutsSearchInputProps {
  ariaLabel?: string;
  autoFocus?: boolean;
  isSearchingByKeystrokes?: boolean;
  onKeyDown?(event: { defaultPrevented: boolean; key: string; preventDefault(): void; stopPropagation(): void }): void;
  onValueChange(value: string): void;
  placeholder?: string;
  trailingContent?: unknown;
  value: string;
}

let jsxRuntime: ReturnType<typeof getJsxRuntime> | undefined;
let reactRuntime: ReturnType<typeof getReactRuntime> | undefined;
function KeyboardShortcutsSearchInput(props: KeyboardShortcutsSearchInputProps): unknown {
  const searchingByKeystrokes = props.isSearchingByKeystrokes ?? false;
  const id = reactRuntime?.useId() ?? "";
  const intl = useIntl();
  const label = searchingByKeystrokes
    ? intl.formatMessage({ id: "settings.keyboardShortcuts.keystrokeSearch.ariaLabel", defaultMessage: "Keystroke search capture", description: "Accessible label for the input that captures keyboard shortcuts to search" })
    : props.ariaLabel ?? intl.formatMessage({ id: "settings.keyboardShortcuts.search.ariaLabel", defaultMessage: "Search keyboard shortcuts", description: "Accessible label for the keyboard shortcuts search input" });
  const placeholder = searchingByKeystrokes
    ? intl.formatMessage({ id: "settings.keyboardShortcuts.keystrokeSearch.placeholder", defaultMessage: "Press shortcut to search", description: "Placeholder shown while capturing a keyboard shortcut to search" })
    : props.placeholder ?? intl.formatMessage({ id: "settings.keyboardShortcuts.search.placeholder", defaultMessage: "Search shortcuts", description: "Placeholder for the keyboard shortcuts search input" });
  const onKeyDown = (event: { defaultPrevented: boolean; key: string; preventDefault(): void; stopPropagation(): void }): void => {
    props.onKeyDown?.(event);
    if (!event.defaultPrevented && event.key === "Escape" && props.value !== "") {
      event.preventDefault();
      event.stopPropagation();
      props.onValueChange("");
    }
  };
  const input = jsxRuntime?.jsx(SearchInput, {
    id,
    autoFocus: props.autoFocus,
    inputKey: searchingByKeystrokes ? "keystrokes" : "text",
    isClearable: !searchingByKeystrokes,
    label,
    placeholder,
    readOnly: searchingByKeystrokes,
    searchQuery: props.value,
    trailingControl: props.trailingContent,
    onKeyDown,
    onSearchQueryChange: props.onValueChange,
  });
  return jsxRuntime?.jsx("div", { "data-codex-shortcut-capture": searchingByKeystrokes || undefined, children: input });
}

let initialized = false;
function initializeKeyboardShortcutsSearchInput(): void {
  if (initialized) return;
  initialized = true;
  getCompilerRuntime();
  reactRuntime = getReactRuntime();
  initializeInternationalization();
  initializeSearchInput();
  jsxRuntime = getJsxRuntime();
}

export { initializeKeyboardShortcutsSearchInput as n, KeyboardShortcutsSearchInput as t };
