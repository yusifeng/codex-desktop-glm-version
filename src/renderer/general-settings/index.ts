import "@rchunk/rolldown-runtime";
import "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/theme-font-family";
import "@rchunk/theme-font-face-loader";
import "@rchunk/file-diff-alt";
import "@rchunk/triangle-warning";
import "@rchunk/permissions-mode-visibility";
import "@rchunk/chatgpt-accent-messages";
import "@rchunk/middle-truncated-text";
import "@rchunk/settings-route-state";
import "@rchunk/dock-icon-setting-visibility";
import "@rchunk/notifications-settings";
import "@rchunk/import-settings-gate";
import "@rchunk/plugins-settings-row";

type Theme = "dark" | "light" | "system";
type EnterBehavior = "cmdAlways" | "cmdIfMultiline" | "enter";
interface GeneralProps {
  enterBehavior?: EnterBehavior;
  followUpQueueEnabled?: boolean;
  keepAwake?: boolean;
  modifierSymbol?: string;
  onEnterBehaviorChange?(value: EnterBehavior): void;
  onFollowUpQueueChange?(value: boolean): void;
  onKeepAwakeChange?(value: boolean): void;
  onThemeChange?(value: Theme): void;
  theme?: Theme;
}
interface AppearanceProps { codeFontFamily?: string; contentFontFamily?: string; fontSize?: number; onCodeFontChange?(value: string): void; onContentFontChange?(value: string): void; onFontSizeChange?(value: number): void; onThemeChange?(value: Theme): void; theme?: Theme }
const shared = appSharedChunk as unknown as { I3(): import("@rchunk/app-shared").JsxRuntime };
let jsx: import("@rchunk/app-shared").JsxRuntime;
let initialized = false;
function initializeGeneralSettings(): void { if (!initialized) { jsx = shared.I3(); initialized = true; } }
function Row(props: { control?: unknown; description?: unknown; label: unknown }): unknown { return jsx.jsxs("div", { className: "flex min-h-14 items-center justify-between gap-4 px-4 py-3", children: [jsx.jsxs("div", { children: [jsx.jsx("div", { className: "font-medium", children: props.label }), props.description == null ? null : jsx.jsx("div", { className: "text-sm text-secondary", children: props.description })] }), props.control] }); }
function Section(props: { children: unknown; title: unknown }): unknown { return jsx.jsxs("section", { className: "rounded-xl border", children: [jsx.jsx("h2", { className: "border-b px-4 py-3 font-semibold", children: props.title }), props.children] }); }
function Toggle(props: { checked: boolean; label: string; onChange?(value: boolean): void }): unknown { return jsx.jsx("button", { type: "button", role: "switch", "aria-label": props.label, "aria-checked": props.checked, onClick: () => props.onChange?.(!props.checked), children: props.checked ? "On" : "Off" }); }
function Select<Value extends string>(props: { label: string; onChange?(value: Value): void; options: readonly { label: string; value: Value }[]; value: Value }): unknown { return jsx.jsx("select", { "aria-label": props.label, value: props.value, onChange: (event: { currentTarget: { value: string } }) => props.onChange?.(event.currentTarget.value as Value), children: props.options.map((option) => jsx.jsx("option", { value: option.value, children: option.label }, option.value)) }); }
const themes = [{ value: "system", label: "System" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }] as const;
const enterOptions = [{ value: "enter", label: "Enter" }, { value: "cmdIfMultiline", label: "Modifier + Enter for multiline prompts" }, { value: "cmdAlways", label: "Modifier + Enter always" }] as const;

function EnterBehaviorLabel({ behavior, modifierSymbol }: { behavior: EnterBehavior; modifierSymbol: string }): unknown { const label = enterOptions.find((item) => item.value === behavior)?.label ?? behavior; return jsx.jsx("span", { children: label.replace("Modifier", modifierSymbol) }); }
function AppearanceSettingsContent(props: AppearanceProps = {}): unknown { initializeGeneralSettings(); const theme = props.theme ?? "system"; return jsx.jsxs("div", { children: [jsx.jsx(Section, { title: "Theme", children: jsx.jsx(Row, { label: "Theme", control: jsx.jsx(Select<Theme>, { label: "Theme", value: theme, options: themes, onChange: props.onThemeChange }) }) }), jsx.jsx(Section, { title: "Preferences", children: [jsx.jsx(Row, { label: "Text size", control: jsx.jsx("input", { type: "number", min: 10, max: 24, value: props.fontSize ?? 14, onChange: (event: { currentTarget: { valueAsNumber: number } }) => props.onFontSizeChange?.(event.currentTarget.valueAsNumber) }) }), jsx.jsx(Row, { label: "Content font", control: jsx.jsx("input", { value: props.contentFontFamily ?? "System", onChange: (event: { currentTarget: { value: string } }) => props.onContentFontChange?.(event.currentTarget.value) }) }), jsx.jsx(Row, { label: "Code font", control: jsx.jsx("input", { value: props.codeFontFamily ?? "Monospace", onChange: (event: { currentTarget: { value: string } }) => props.onCodeFontChange?.(event.currentTarget.value) }) })] })] }); }
function GeneralSettings(props: GeneralProps = {}): unknown { initializeGeneralSettings(); const modifier = props.modifierSymbol ?? "⌘"; const behavior = props.enterBehavior ?? "enter"; return jsx.jsxs("main", { "data-settings-page": "general", children: [jsx.jsx("h1", { children: "General" }), jsx.jsx(Section, { title: "Preferences", children: [jsx.jsx(Row, { label: "Send messages", control: jsx.jsx(Select<EnterBehavior>, { label: "Send messages", value: behavior, options: enterOptions, onChange: props.onEnterBehaviorChange }) }), jsx.jsx(Row, { label: "Follow-up queue", description: "Queue follow-up messages while a response is running", control: jsx.jsx(Toggle, { label: "Follow-up queue", checked: props.followUpQueueEnabled !== false, onChange: props.onFollowUpQueueChange }) }), jsx.jsx(Row, { label: "Prevent sleep while running", control: jsx.jsx(Toggle, { label: "Prevent sleep while running", checked: props.keepAwake === true, onChange: props.onKeepAwakeChange }) })] }), jsx.jsx(AppearanceSettingsContent, { theme: props.theme, onThemeChange: props.onThemeChange }), jsx.jsx("div", { hidden: true, children: jsx.jsx(EnterBehaviorLabel, { behavior, modifierSymbol: modifier }) })] }); }
function HotkeyWindowSettings(props: { hotkeys?: readonly { action: string; keys: string }[] } = {}): unknown { initializeGeneralSettings(); if (props.hotkeys == null) return null; return jsx.jsx(Section, { title: "Hotkey window", children: props.hotkeys.map((item) => jsx.jsx(Row, { label: item.action, control: jsx.jsx("kbd", { children: item.keys }) }, item.action)) }); }
function WindowsAgentEnvironment(props: { enabled?: boolean; onChange?(value: boolean): void; supported?: boolean } = {}): unknown { initializeGeneralSettings(); if (props.supported !== true) return null; return jsx.jsx(Row, { label: "Agent environment", description: "Choose where the agent runs on Windows", control: jsx.jsx(Select<"native" | "wsl">, { label: "Agent environment", value: props.enabled ? "wsl" : "native", options: [{ value: "native", label: "Windows native" }, { value: "wsl", label: "Windows Subsystem for Linux" }], onChange: (value) => props.onChange?.(value === "wsl") }) }); }
export { HotkeyWindowSettings as a, GeneralSettings as i, AppearanceSettingsContent as n, initializeGeneralSettings as o, EnterBehaviorLabel as r, WindowsAgentEnvironment as t };
