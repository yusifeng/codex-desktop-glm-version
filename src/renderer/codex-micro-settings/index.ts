import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import { pnt as appServices } from "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/codex-micro-analog-action-title";
import "@rchunk/codex-micro-commands";
import "@rchunk/codex-micro-keyboard-surface";
import "@rchunk/codex-micro-layout";
import "@rchunk/codex-micro-slot-signals";
import "@rchunk/command-messages";
import "@rchunk/keyboard-shortcuts-search-input";

export interface CodexMicroService {
  getInputMonitoringPermissionStatus?(): Promise<"denied" | "granted" | "unavailable">;
  openInputMonitoringSettings?(): Promise<void> | void;
  ownsPrimaryWindow?(): Promise<boolean>;
}
export interface CodexMicroSettingsState {
  agentSource: "cloud" | "local";
  layout: string;
  lightingAutoOff: string;
  lightingBrightness: number;
  singleTapAgentKeys: boolean;
}
export interface CodexMicroSettingsProps {
  codexMicro?: CodexMicroService | null;
  connectionStatus?: "connected" | "connection-failed" | "discovery-failed" | "transport-unavailable";
  microphoneMode?: "push-to-talk" | "realtime";
  onMicrophoneModeChange?(value: "push-to-talk" | "realtime"): void;
  onSettingChange?<Key extends keyof CodexMicroSettingsState>(key: Key, value: CodexMicroSettingsState[Key]): void;
  permissionStatus?: "denied" | "granted" | "unavailable";
  settings?: Partial<CodexMicroSettingsState>;
}

const DEFAULT_SETTINGS: CodexMicroSettingsState = {
  agentSource: "local",
  layout: "default",
  lightingAutoOff: "10-minutes",
  lightingBrightness: 75,
  singleTapAgentKeys: false,
};
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }

function SelectRow(props: { label: string; value: string; options: readonly { label: string; value: string }[]; onChange(value: string): void }): unknown {
  return jsx().jsxs("label", { children: [
    jsx().jsx("span", { children: props.label }),
    jsx().jsx("select", {
      "aria-label": props.label,
      value: props.value,
      onChange: (event: { currentTarget: { value: string } }) => props.onChange(event.currentTarget.value),
      children: props.options.map((option) => jsx().jsx("option", { value: option.value, children: option.label }, option.value)),
    }),
  ] });
}

export function CodexMicroSettings(props: CodexMicroSettingsProps = {}): unknown {
  const service = props.codexMicro === undefined ? appServices.codexMicro : props.codexMicro;
  if (service == null) return null;
  const settings = { ...DEFAULT_SETTINGS, ...props.settings };
  const update = <Key extends keyof CodexMicroSettingsState>(key: Key, value: CodexMicroSettingsState[Key]) => props.onSettingChange?.(key, value);
  const connectionStatus = props.connectionStatus ?? "connected";
  return jsx().jsxs("section", { "data-settings-page": "codex-micro", children: [
    jsx().jsx("h1", { children: "Codex Micro" }),
    jsx().jsxs("section", { children: [
      jsx().jsx("h2", { children: "Connection" }),
      jsx().jsx("p", { role: connectionStatus === "connected" ? "status" : "alert", children: connectionStatus === "connected" ? "Keyboard connected" : connectionStatus.replaceAll("-", " ") }),
      props.permissionStatus === "denied" ? jsx().jsx("button", { type: "button", onClick: () => void service.openInputMonitoringSettings?.(), children: "Open Input Monitoring settings" }) : null,
    ] }),
    jsx().jsxs("section", { children: [
      jsx().jsx("h2", { children: "Keyboard" }),
      jsx().jsx(SelectRow, { label: "Layout", value: settings.layout, options: [{ value: "default", label: "Default" }, { value: "developer", label: "Developer" }, { value: "custom", label: "Custom" }], onChange: (value: string) => update("layout", value) }),
      jsx().jsx(SelectRow, { label: "Agent source", value: settings.agentSource, options: [{ value: "local", label: "Local" }, { value: "cloud", label: "Cloud" }], onChange: (value: string) => update("agentSource", value as CodexMicroSettingsState["agentSource"]) }),
      jsx().jsxs("label", { children: [jsx().jsx("span", { children: "Single-tap agent keys" }), jsx().jsx("input", { type: "checkbox", checked: settings.singleTapAgentKeys, onChange: (event: { currentTarget: { checked: boolean } }) => update("singleTapAgentKeys", event.currentTarget.checked) })] }),
    ] }),
    jsx().jsxs("section", { children: [
      jsx().jsx("h2", { children: "Lighting" }),
      jsx().jsxs("label", { children: [jsx().jsx("span", { children: "Brightness" }), jsx().jsx("input", { type: "range", min: 0, max: 100, value: settings.lightingBrightness, onChange: (event: { currentTarget: { valueAsNumber: number } }) => update("lightingBrightness", event.currentTarget.valueAsNumber) })] }),
      jsx().jsx(SelectRow, { label: "Turn lights off after", value: settings.lightingAutoOff, options: ["off", "30-seconds", "1-minute", "3-minutes", "10-minutes", "30-minutes", "1-hour"].map((value) => ({ value, label: value.replaceAll("-", " ") })), onChange: (value: string) => update("lightingAutoOff", value) }),
    ] }),
    jsx().jsxs("section", { children: [
      jsx().jsx("h2", { children: "Microphone key" }),
      jsx().jsx(SelectRow, { label: "Microphone action", value: props.microphoneMode ?? "push-to-talk", options: [{ value: "push-to-talk", label: "Push to talk" }, { value: "realtime", label: "Voice chat" }], onChange: (value: string) => props.onMicrophoneModeChange?.(value as "push-to-talk" | "realtime") }),
    ] }),
    jsx().jsxs("section", { children: [jsx().jsx("h2", { children: "Custom keys" }), jsx().jsx("p", { children: "Configure keycaps, analog controls, encoder and knob actions." })] }),
  ] });
}
