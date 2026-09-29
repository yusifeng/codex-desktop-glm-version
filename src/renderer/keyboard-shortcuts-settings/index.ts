// keyboard-shortcuts-settings —— 快捷键搜索、分组、冲突检测与偏好编辑。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as commandMessagesChunk from "@rchunk/command-messages";
import * as commandOrderChunk from "@rchunk/keyboard-shortcut-command-order";
import * as keyboardShortcutsGateChunk from "@rchunk/keyboard-shortcuts-gate";
import * as searchInputChunk from "@rchunk/keyboard-shortcuts-search-input";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import type { IntlShape, JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

void runtimeChunk;

type Platform = "linux" | "macOS" | "windows" | string;
type NumberTarget = "sidebar" | "tabs";
type ExternalBrowserShortcut =
  "alt" | "primary" | "primary-shift" | "unassigned";

interface ShortcutCommand extends Record<string, unknown> {
  commandMenuGroupKey?: string | null;
  defaultAccelerators?: string[];
  description?: string;
  id: string;
  kind: string;
  title?: string;
}

interface ShortcutBinding {
  accelerator: string;
  command: string;
}

interface KeymapState {
  bindings: ShortcutBinding[];
}

interface ShortcutEntry {
  accelerator: string;
  label: string;
}

interface Mutation<Input, Output = unknown> {
  isPending: boolean;
  mutateAsync(input: Input): Promise<Output>;
}

interface CaptureState {
  accelerator: string | null;
  commandId: string;
  conflict: string | null;
  mode: "append" | "replace" | "set";
}

interface SharedRuntime {
  $3(): void;
  FX(): void;
  HX<Value>(signal: unknown): Value;
  I3(): JsxRuntime;
  LX(scope: unknown): unknown;
  Xp: ShortcutCommand[];
  ZI: unknown;
  cz: {
    externalBrowserLinkShortcut: {
      default?: ExternalBrowserShortcut;
      key: string;
    };
    primaryNumberShortcutTarget: { default?: NumberTarget; key: string };
  };
  e6: (() => ReactRuntime) & ReactRuntime;
  n4(): IntlShape;
}

interface InitialRuntime {
  $9: unknown;
  E6t(): { platform: Platform };
  Fln: unknown;
  Kcn<Value>(setting: { key: string } | string): Value;
  ofn(gateId: string): boolean;
  T6t(): void;
  Ucn(scope: unknown, setting: { key: string }, value: unknown): Promise<void>;
  Vcn(): void;
  iun<Input, Output = unknown>(
    name: string,
    options?: Record<string, unknown>,
  ): Mutation<Input, Output>;
  ret(
    commandId: string,
    keymapState: KeymapState,
    platform: Platform,
  ): ShortcutEntry[];
  wEt: unknown;
  wln: unknown;
}

interface PrimaryRuntime {
  cm: (props: Record<string, unknown>) => unknown;
  xm(): void;
}

interface CommandMessagesRuntime {
  r(): void;
  t(
    command: ShortcutCommand,
    intl: IntlShape,
    override?: { description?: string; title?: string },
    petEnabled?: boolean,
  ): { description: string; title: string };
}

interface CommandOrderRuntime {
  a(command: ShortcutCommand, options: Record<string, unknown>): boolean;
  n(): void;
  r(): void;
  t(left: ShortcutCommand, right: ShortcutCommand): number;
}

const {
  $3: initializeRuntimeLazy,
  FX: initializeSignalRuntime,
  HX: useSignalValue,
  I3: getJsxRuntime,
  LX: useScope,
  Xp: registeredCommands,
  ZI: AppScope,
  cz: settings,
  e6: getReactRuntime,
  n4: useIntl,
} = appSharedChunk as unknown as SharedRuntime;
const {
  $9: keymapSignal,
  E6t: usePlatform,
  Fln: workLocalSignal,
  Kcn: readSetting,
  ofn: isGateEnabled,
  T6t: initializePlatformRuntime,
  Ucn: writeSetting,
  Vcn: initializeSettingsRuntime,
  iun: createMutation,
  ret: getShortcutEntries,
  wEt: registeredCommandState,
  wln: codexLocalSignal,
} = appInitialChunk as unknown as InitialRuntime;
const { cm: ShortcutCapture, xm: initializeShortcutCapture } =
  appPrimaryChunk as unknown as PrimaryRuntime;
const { r: initializeCommandMessages, t: getCommandMessages } =
  commandMessagesChunk as unknown as CommandMessagesRuntime;
const {
  a: isCommandVisible,
  n: initializeCommandVisibility,
  r: initializeCommandOrder,
  t: compareCommands,
} = commandOrderChunk as unknown as CommandOrderRuntime;
const { n: initializeKeyboardShortcutsGate, t: keyboardShortcutsGate } =
  keyboardShortcutsGateChunk;
const { n: initializeSearchInput, t: KeyboardShortcutsSearchInput } =
  searchInputChunk;

const EXTERNAL_SHORTCUTS: ExternalBrowserShortcut[] = [
  "unassigned",
  "primary",
  "alt",
  "primary-shift",
];

let jsx: JsxRuntime;
let React: ReactRuntime;

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function formatAccelerator(accelerator: string, platform: Platform): string {
  const parts = accelerator
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts
    .map((part) => {
      const key = part.toLocaleLowerCase();
      if (key === "cmd" || key === "command" || key === "meta")
        return platform === "macOS" ? "⌘" : "Ctrl";
      if (key === "ctrl" || key === "control")
        return platform === "macOS" ? "⌃" : "Ctrl";
      if (key === "alt" || key === "option")
        return platform === "macOS" ? "⌥" : "Alt";
      if (key === "shift") return platform === "macOS" ? "⇧" : "Shift";
      return part.length === 1 ? part.toLocaleUpperCase() : part;
    })
    .join(platform === "macOS" ? "" : "+");
}

function eventAccelerator(event: {
  altKey?: boolean;
  ctrlKey?: boolean;
  key: string;
  metaKey?: boolean;
  shiftKey?: boolean;
}): string | null {
  if (["Alt", "Control", "Meta", "Shift"].includes(event.key)) return null;
  const parts: string[] = [];
  if (event.metaKey) parts.push("Cmd");
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  parts.push(
    event.key.length === 1 ? event.key.toLocaleUpperCase() : event.key,
  );
  return parts.join("+");
}

function shortcutEntries(
  command: ShortcutCommand,
  keymap: KeymapState,
  platform: Platform,
): ShortcutEntry[] {
  const fromRuntime = getShortcutEntries?.(command.id, keymap, platform) ?? [];
  if (fromRuntime.length > 0) return fromRuntime;
  return (command.defaultAccelerators ?? []).map((accelerator) => ({
    accelerator,
    label: formatAccelerator(accelerator, platform),
  }));
}

function sameShortcut(left: string, right: string): boolean {
  return (
    normalize(left).replaceAll(" ", "") === normalize(right).replaceAll(" ", "")
  );
}

function matchesKeystrokeSequence(label: string, query: string): boolean {
  const normalizedLabel = normalize(label);
  const normalizedQuery = normalize(query);
  return (
    normalizedLabel === normalizedQuery ||
    normalizedLabel.startsWith(normalizedQuery + " ")
  );
}

function groupLabel(group: string): string {
  if (group === "navigation") return "Navigation";
  if (group === "composer") return "Composer";
  if (group === "browser") return "Browser";
  if (group === "developer") return "Developer";
  return group === "general" ? "General" : group;
}

function settingShortcutLabel(
  value: ExternalBrowserShortcut,
  platform: Platform,
): string {
  if (value === "unassigned") return "Unassigned";
  if (value === "alt") return platform === "macOS" ? "⌥+Click" : "Alt+Click";
  if (value === "primary-shift")
    return platform === "macOS" ? "⇧⌘+Click" : "Ctrl+Shift+Click";
  return platform === "macOS" ? "⌘+Click" : "Ctrl+Click";
}

function PreferenceRow({
  description,
  label,
  control,
}: {
  control: unknown;
  description: string;
  label: string;
}): unknown {
  return jsx.jsxs("div", {
    className: "flex min-h-14 items-center justify-between gap-4 px-4 py-3",
    children: [
      jsx.jsxs("span", {
        children: [
          jsx.jsx("span", { className: "block font-medium", children: label }),
          jsx.jsx("span", {
            className: "block text-sm text-secondary",
            children: description,
          }),
        ],
      }),
      control,
    ],
  });
}

function KeyboardShortcutsSettings(): unknown {
  const scope = useScope(AppScope);
  const intl = useIntl();
  const { platform } = usePlatform();
  const keymap = useSignalValue<KeymapState | null>(keymapSignal);
  const codexLocal = useSignalValue<boolean>(codexLocalSignal);
  const workLocal = useSignalValue<boolean>(workLocalSignal);
  useSignalValue(registeredCommandState);
  const [query, setQuery] = React.useState("");
  const [searchByKeystrokes, setSearchByKeystrokes] = React.useState(false);
  const [capture, setCapture] = React.useState<CaptureState | null>(null);
  const [errorByCommand, setErrorByCommand] = React.useState<
    Record<string, string | undefined>
  >({});
  const [preferenceError, setPreferenceError] = React.useState<string | null>(
    null,
  );
  const externalSetting = settings.externalBrowserLinkShortcut;
  const numberTargetSetting = settings.primaryNumberShortcutTarget;
  const externalShortcut =
    readSetting<ExternalBrowserShortcut>(externalSetting) ??
    externalSetting.default ??
    "unassigned";
  const numberTarget =
    readSetting<NumberTarget>(numberTargetSetting) ??
    numberTargetSetting.default ??
    "tabs";
  const setBinding = createMutation<{
    commandId: string;
    update: Record<string, unknown>;
  }>("set-codex-command-keybinding");
  const resetBindings = createMutation<void>("reset-codex-command-keybindings");
  const featureEnabled =
    keyboardShortcutsGate == null || isGateEnabled(keyboardShortcutsGate);
  if (keymap == null) {
    return jsx.jsxs("div", {
      className: "flex flex-col gap-6",
      children: [
        jsx.jsx("h1", { children: "Keyboard shortcuts" }),
        jsx.jsx("p", { role: "status", children: "Loading shortcuts…" }),
      ],
    });
  }
  const visibleCommands = registeredCommands
    .filter((command) => command.id !== "findInThread")
    .filter((command) =>
      isCommandVisible(command, {
        commandAccess: { codexLocal, workLocal },
        fileLanguageFeaturesEnabled: featureEnabled,
        platform,
      }),
    )
    .map((command) => ({
      command,
      messages: getCommandMessages(command, intl),
      entries: shortcutEntries(command, keymap, platform),
    }))
    .sort((left, right) => compareCommands(left.command, right.command));
  const normalizedQuery = normalize(query);
  const filteredCommands = visibleCommands.filter(
    ({ command, messages, entries }) => {
      if (normalizedQuery === "") return true;
      if (searchByKeystrokes) {
        return entries.some((entry) =>
          matchesKeystrokeSequence(entry.label, normalizedQuery),
        );
      }
      return [command.id, messages.title, messages.description].some((value) =>
        normalize(value).includes(normalizedQuery),
      );
    },
  );
  const groups = new Map<string, typeof filteredCommands>();
  for (const item of filteredCommands) {
    const group = item.command.commandMenuGroupKey ?? "general";
    groups.set(group, [...(groups.get(group) ?? []), item]);
  }

  const conflictFor = (
    commandId: string,
    accelerator: string,
  ): string | null => {
    for (const item of visibleCommands) {
      if (item.command.id === commandId) continue;
      if (
        item.entries.some((entry) =>
          sameShortcut(entry.accelerator, accelerator),
        )
      ) {
        return item.messages.title;
      }
    }
    return null;
  };
  const updateBinding = async (
    commandId: string,
    update: Record<string, unknown>,
  ): Promise<void> => {
    setErrorByCommand((current) => ({ ...current, [commandId]: undefined }));
    try {
      await setBinding.mutateAsync({ commandId, update });
      setCapture(null);
    } catch (error) {
      setErrorByCommand((current) => ({
        ...current,
        [commandId]:
          error instanceof Error ? error.message : "Failed to update shortcut",
      }));
    }
  };
  const onSearchKeyDown = (event: {
    altKey?: boolean;
    ctrlKey?: boolean;
    key: string;
    metaKey?: boolean;
    preventDefault(): void;
    repeat?: boolean;
    shiftKey?: boolean;
    stopPropagation(): void;
  }) => {
    if (!searchByKeystrokes || event.repeat) return;
    event.preventDefault();
    event.stopPropagation();
    if (
      event.key === "Escape" &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey
    ) {
      setQuery("");
      setSearchByKeystrokes(false);
      return;
    }
    const accelerator = eventAccelerator(event);
    if (accelerator != null) setQuery(formatAccelerator(accelerator, platform));
  };
  const customBindings = keymap.bindings.length > 0;
  const search = jsx.jsx(KeyboardShortcutsSearchInput, {
    autoFocus: searchByKeystrokes,
    isSearchingByKeystrokes: searchByKeystrokes,
    value: query,
    onKeyDown: onSearchKeyDown,
    onValueChange: setQuery,
    trailingContent: jsx.jsx("button", {
      type: "button",
      "aria-label": "Search by keystrokes",
      "aria-pressed": searchByKeystrokes,
      onClick: () => {
        setQuery("");
        setSearchByKeystrokes((current) => !current);
      },
      children: "⌨",
    }),
  });
  const externalControl = jsx.jsx("select", {
    "aria-label": "External browser link shortcut",
    value: externalShortcut,
    onChange: async (event: {
      currentTarget: { value: ExternalBrowserShortcut };
    }) => {
      setPreferenceError(null);
      try {
        await writeSetting(scope, externalSetting, event.currentTarget.value);
      } catch {
        setPreferenceError("Could not save shortcut preference");
      }
    },
    children: EXTERNAL_SHORTCUTS.map((value) =>
      jsx.jsx(
        "option",
        {
          value,
          children: settingShortcutLabel(value, platform),
        },
        value,
      ),
    ),
  });
  const numberControl = jsx.jsx("select", {
    "aria-label": "Number shortcut target",
    value: numberTarget,
    onChange: async (event: { currentTarget: { value: NumberTarget } }) => {
      setPreferenceError(null);
      try {
        await writeSetting(
          scope,
          numberTargetSetting,
          event.currentTarget.value,
        );
      } catch {
        setPreferenceError("Could not save shortcut preference");
      }
    },
    children: [
      jsx.jsx("option", {
        value: "tabs",
        children: (platform === "macOS" ? "⌘" : "Ctrl+") + "1-9 for Tabs",
      }),
      jsx.jsx("option", {
        value: "sidebar",
        children: (platform === "macOS" ? "⌘" : "Ctrl+") + "1-9 for Chats",
      }),
    ],
  });
  const rows = [...groups.entries()].map(([group, items]) =>
    jsx.jsxs(
      "section",
      {
        "data-shortcut-group": group,
        children: [
          jsx.jsx("h2", { children: groupLabel(group) }),
          items.map(({ command, entries, messages }) => {
            const renderedEntries =
              entries.length === 0
                ? [{ accelerator: "", label: "Unassigned" }]
                : entries;
            return jsx.jsxs(
              "div",
              {
                className:
                  "flex min-h-14 items-center justify-between gap-4 px-4 py-3",
                "data-command-id": command.id,
                children: [
                  jsx.jsxs("span", {
                    children: [
                      jsx.jsx("span", {
                        className: "block font-medium",
                        children: messages.title,
                      }),
                      messages.description === ""
                        ? null
                        : jsx.jsx("span", {
                            className: "block text-sm text-secondary",
                            children: messages.description,
                          }),
                      errorByCommand[command.id] == null
                        ? null
                        : jsx.jsx("span", {
                            className: "block text-xs text-danger",
                            role: "alert",
                            children: errorByCommand[command.id],
                          }),
                    ],
                  }),
                  jsx.jsx("div", {
                    role: "group",
                    "aria-label": messages.title,
                    children: renderedEntries.map((entry, index) => {
                      const activeCapture =
                        capture?.commandId === command.id &&
                        capture.accelerator === (entry.accelerator || null);
                      return jsx.jsx(
                        ShortcutCapture,
                        {
                          accelerator: entry.accelerator || null,
                          acceleratorLabel: entry.label,
                          conflict: activeCapture ? capture.conflict : null,
                          disabled: setBinding.isPending,
                          hotkeyName: messages.title,
                          onStartCapture: (
                            mode: "append" | "replace" | "set",
                          ) => {
                            setCapture({
                              accelerator: entry.accelerator || null,
                              commandId: command.id,
                              conflict: null,
                              mode,
                            });
                          },
                          onCancelCapture: () => setCapture(null),
                          onCapture: (accelerator: string) => {
                            const conflict = conflictFor(
                              command.id,
                              accelerator,
                            );
                            if (conflict != null) {
                              setCapture({
                                accelerator: entry.accelerator || null,
                                commandId: command.id,
                                conflict,
                                mode:
                                  capture?.mode ??
                                  (entry.accelerator === ""
                                    ? "set"
                                    : "replace"),
                              });
                              return;
                            }
                            const mode =
                              capture?.mode ??
                              (entry.accelerator === "" ? "set" : "replace");
                            void updateBinding(
                              command.id,
                              mode === "append"
                                ? { type: "append", accelerator }
                                : entry.accelerator === ""
                                  ? { type: "set", accelerator }
                                  : {
                                      type: "replace",
                                      previousAccelerator: entry.accelerator,
                                      accelerator,
                                    },
                            );
                          },
                          onClear:
                            entry.accelerator === ""
                              ? undefined
                              : () => {
                                  void updateBinding(command.id, {
                                    type: "remove",
                                    accelerator: entry.accelerator,
                                  });
                                },
                        },
                        command.id + "-" + index,
                      );
                    }),
                  }),
                ],
              },
              command.id,
            );
          }),
        ],
      },
      group,
    ),
  );

  return jsx.jsxs("div", {
    className: "flex flex-col gap-6",
    children: [
      jsx.jsxs("header", {
        children: [
          jsx.jsx("h1", { children: "Keyboard shortcuts" }),
          search,
          customBindings
            ? jsx.jsx("button", {
                type: "button",
                disabled: resetBindings.isPending,
                onClick: () => {
                  void resetBindings.mutateAsync();
                },
                children: "Reset all to defaults",
              })
            : null,
        ],
      }),
      jsx.jsxs("section", {
        className: "overflow-hidden rounded-xl border",
        children: [
          jsx.jsx(PreferenceRow, {
            label: "Open web link in default browser",
            description: "Hold the assigned keys while clicking a web link",
            control: externalControl,
          }),
          jsx.jsx(PreferenceRow, {
            label: "Number shortcuts",
            description:
              numberTarget === "sidebar"
                ? "Use primary 1-9 to switch chats"
                : "Use primary 1-9 to switch tabs",
            control: numberControl,
          }),
          preferenceError == null
            ? null
            : jsx.jsx("p", {
                role: "alert",
                className: "px-4 pb-3 text-danger",
                children: preferenceError,
              }),
        ],
      }),
      filteredCommands.length === 0
        ? jsx.jsx("p", { role: "status", children: "No matching shortcuts" })
        : rows,
    ],
  });
}

function initializeKeyboardShortcutsSettings(): void {
  initializeRuntimeLazy?.();
  initializeSignalRuntime?.();
  initializePlatformRuntime?.();
  initializeSettingsRuntime?.();
  initializeShortcutCapture?.();
  initializeKeyboardShortcutsGate?.();
  initializeCommandMessages?.();
  initializeSearchInput?.();
  initializeCommandVisibility?.();
  initializeCommandOrder?.();
  React =
    typeof getReactRuntime === "function" ? getReactRuntime() : getReactRuntime;
  jsx = typeof getJsxRuntime === "function" ? getJsxRuntime() : getJsxRuntime;
}

initializeKeyboardShortcutsSettings();

export { KeyboardShortcutsSettings };
