import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as settingsLoadingRowChunk from "@rchunk/settings-loading-row";
import * as chatgptVoicesQueryChunk from "@rchunk/chatgpt-voices-query";
import * as spokenLanguageOptionsChunk from "@rchunk/spoken-language-options";

interface ReactReference<Value> { current: Value }
interface ReactRuntime {
  useRef<Value>(value: Value): ReactReference<Value>;
  useState<Value>(value: Value | (() => Value)): [Value, (next: Value | ((current: Value) => Value)) => void];
}
interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}
interface QueryResult<Data> {
  data?: Data;
  error?: unknown;
  isError: boolean;
  isFetching: boolean;
  isLoading: boolean;
  refetch(): Promise<unknown>;
}
interface IntlRuntime {
  formatMessage(descriptor: { defaultMessage?: string }, values?: Record<string, unknown>): string;
}
interface ToastManager {
  danger(message: string, options?: { errorAnalytics?: { toastId: string } }): void;
  success(message: string): void;
}
interface ScopeRuntime {
  get(signal: unknown): unknown;
}
interface VoiceAccess { status: "available" | "error" | "loading" | "unavailable" }
interface LanguageQuery {
  data?: { voiceMainLanguage?: string };
  isError: boolean;
  refetch(): Promise<unknown>;
}
interface VoiceOption {
  description: string;
  name: string;
  previewUrl?: string;
  slug: string;
}
interface VoiceData {
  accountVoiceStatus?: "available" | "unavailable";
  effectiveVoiceSlug?: string;
  voices: VoiceOption[];
}
interface MicrophoneDevice { deviceId: string; kind: string; label: string }
interface SettingDescriptor { key: string }
interface AudioPreview {
  pause(): void;
  play(): Promise<void>;
  currentTime: number;
  onended: (() => void) | null;
}

const {
  $3: initializeSharedRuntime,
  HX: useSignalValue,
  I3: getJsxRuntime,
  LX: useScope,
  ZI: AppScope,
  _L: useQuery,
  e6: getReactRuntime,
  n4: useIntl,
  pk: toastManagerSignal,
  iz: voiceSettingDescriptors,
} = appSharedChunk as unknown as {
  $3(): void;
  HX<Value>(signal: unknown): Value;
  I3(): JsxRuntime;
  LX(scope: unknown): ScopeRuntime;
  ZI: unknown;
  _L<Data>(options: Record<string, unknown>): QueryResult<Data>;
  e6(): ReactRuntime;
  n4(): IntlRuntime;
  pk: unknown;
  iz?: { microphoneInputDeviceId?: SettingDescriptor; voiceChatHotkey?: SettingDescriptor };
};
const {
  Eln: voiceAccessSignal,
  Kcn: readSetting,
  U6t: currentAccountIdSignal,
  Ucn: writeSetting,
  Xl: initializeSettingsRuntime,
  bqt: languageQuerySignal,
  su: initializeAccountRuntime,
} = appInitialChunk as unknown as {
  Eln: unknown;
  Kcn(settingId: string): unknown;
  U6t: unknown;
  Ucn(scope: unknown, setting: SettingDescriptor, value: unknown): Promise<void>;
  Xl(): void;
  bqt: unknown;
  su(): void;
};
const { Gp: updateAccountSetting, Wp: initializeAccountSettings } = appPrimaryChunk;
const { n: initializeSettingsLoadingRow, t: SettingsLoadingRow } = settingsLoadingRowChunk;
const { n: voiceQueryOptions, r: initializeVoicesQuery, t: voicesQueryKey } = chatgptVoicesQueryChunk;
const {
  n: buildLanguageOptions,
  r: initializeSpokenLanguages,
  t: getLanguageLabel,
} = spokenLanguageOptionsChunk as {
  n(intl: IntlRuntime): Array<{ label: string; value: string }>;
  r(): void;
  t(value: string, intl: IntlRuntime): string;
};

initializeSharedRuntime();
initializeSettingsRuntime();
initializeAccountRuntime();
initializeAccountSettings();
initializeSettingsLoadingRow();
initializeVoicesQuery();
initializeSpokenLanguages();

const React = getReactRuntime();
const jsxRuntime = getJsxRuntime();
const { Fragment, jsx, jsxs } = jsxRuntime;
const microphoneSetting = voiceSettingDescriptors?.microphoneInputDeviceId ?? { key: "microphone-input-device-id" };
const hotkeySetting = voiceSettingDescriptors?.voiceChatHotkey ?? { key: "voice-chat-hotkey" };
const microphoneQueryKey = ["voice-settings-microphones"] as const;

function message(intl: IntlRuntime, defaultMessage: string): string {
  return intl.formatMessage({ defaultMessage });
}

async function loadMicrophones(): Promise<MicrophoneDevice[]> {
  if (typeof navigator === "undefined" || navigator.mediaDevices?.enumerateDevices == null) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter((device) => device.kind === "audioinput" && device.deviceId.length > 0 && device.deviceId !== "default")
    .map((device) => ({ deviceId: device.deviceId, kind: device.kind, label: device.label }));
}

function SettingsRow(props: { control?: unknown; description?: unknown; label: unknown }): unknown {
  return jsxs("div", { className: "settings-row", children: [jsxs("div", { children: [jsx("strong", { children: props.label }), props.description == null ? null : jsx("p", { children: props.description })] }), props.control ?? null] });
}

function MicrophoneSettings(props: { disabled: boolean; scope: ScopeRuntime; toast: ToastManager }): unknown {
  const intl = useIntl();
  const supported = typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices != null;
  const query = useQuery<MicrophoneDevice[]>({ enabled: supported, queryFn: loadMicrophones, queryKey: microphoneQueryKey, staleTime: 5_000 });
  const initialDevice = readSetting(microphoneSetting.key);
  const [selectedDevice, setSelectedDevice] = React.useState(typeof initialDevice === "string" ? initialDevice : "");
  const [isSaving, setIsSaving] = React.useState(false);
  const devices = query.data ?? [];
  const selectionUnavailable = selectedDevice.length > 0 && devices.length > 0 && !devices.some((device) => device.deviceId === selectedDevice);
  const description = supported ? "Used for voice chat and dictation" : "Microphone selection is not available on this device";
  const control = jsxs("div", { children: [jsx("select", { "aria-label": "Microphone", disabled: props.disabled || !supported || isSaving, value: selectedDevice, onChange: async (event: { currentTarget: { value: string } }) => { const value = event.currentTarget.value; setSelectedDevice(value); setIsSaving(true); try { await writeSetting(props.scope, microphoneSetting, value || null); props.toast.success("Microphone saved"); } catch { props.toast.danger("Could not update microphone", { errorAnalytics: { toastId: "settings.voice.microphone.updateError" } }); } finally { setIsSaving(false); } }, children: [jsx("option", { value: "", children: "System default" }), ...devices.map((device, index) => jsx("option", { value: device.deviceId, children: device.label || `Microphone ${index + 1}` }, device.deviceId))] }), query.isFetching ? jsx("span", { children: "Loading microphones" }) : null, !query.isFetching && query.isError ? jsxs("span", { role: "alert", children: ["Unable to load microphones ", jsx("button", { type: "button", onClick: () => void query.refetch(), children: "Retry" })] }) : null, !query.isFetching && !query.isError && devices.length === 0 && supported ? jsx("span", { children: "No microphones found" }) : null, selectionUnavailable ? jsx("span", { children: "Unavailable microphone" }) : null] });
  return jsx(SettingsRow, { label: message(intl, "Microphone"), description, control });
}

function LanguageSettings(props: { accountId: string | null; disabled: boolean; scope: ScopeRuntime; toast: ToastManager }): unknown {
  const intl = useIntl();
  const languageQuery = useSignalValue<LanguageQuery>(languageQuerySignal);
  const initialLanguage = languageQuery.data?.voiceMainLanguage ?? "auto";
  const [language, setLanguage] = React.useState(initialLanguage);
  const [isSaving, setIsSaving] = React.useState(false);
  if (languageQuery.isError && languageQuery.data == null) {
    return jsx(SettingsRow, { label: "Language", control: jsx("button", { type: "button", onClick: () => void languageQuery.refetch(), children: "Retry" }) });
  }
  const options = buildLanguageOptions(intl);
  return jsx(SettingsRow, { label: "Language", description: getLanguageLabel(language, intl), control: jsx("select", { "aria-label": "Language", disabled: props.disabled || languageQuery.data == null || isSaving || props.accountId == null, value: language, onChange: async (event: { currentTarget: { value: string } }) => { const value = event.currentTarget.value; setLanguage(value); setIsSaving(true); try { if (props.accountId == null) return; await updateAccountSetting(props.scope, props.accountId, "voice_main_language", value); props.toast.success("Voice language saved"); } catch { setLanguage(initialLanguage); props.toast.danger("Could not update voice language", { errorAnalytics: { toastId: "settings.voice.language.updateError" } }); } finally { setIsSaving(false); } }, children: languageQuery.data == null ? jsx("option", { value: language, children: "Loading…" }) : options.map((option) => jsx("option", { value: option.value, children: option.label }, option.value)) }) });
}

function VoicePicker(props: { accountId: string; initialVoice: VoiceOption; scope: ScopeRuntime; toast: ToastManager; voices: VoiceOption[]; onClose(): void; onSaved(slug: string): void }): unknown {
  const [selectedSlug, setSelectedSlug] = React.useState(props.initialVoice.slug);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [previewingSlug, setPreviewingSlug] = React.useState<string | null>(null);
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const audioReference = React.useRef<AudioPreview | null>(null);
  const stopPreview = (): void => { const audio = audioReference.current; if (audio != null) { audio.pause(); audio.currentTime = 0; audio.onended = null; } audioReference.current = null; setPreviewingSlug(null); };
  const preview = async (voice: VoiceOption): Promise<void> => {
    if (previewingSlug === voice.slug) { stopPreview(); return; }
    stopPreview();
    setPreviewError(null);
    if (voice.previewUrl == null || typeof Audio === "undefined") { setPreviewError("Preview unavailable"); return; }
    const audio = new Audio(voice.previewUrl) as unknown as AudioPreview;
    audioReference.current = audio;
    audio.onended = () => { audioReference.current = null; setPreviewingSlug(null); };
    setPreviewingSlug(voice.slug);
    try { await audio.play(); } catch { stopPreview(); setPreviewError("Unable to play voice preview"); }
  };
  return jsxs("div", { role: "dialog", "aria-label": "Choose a voice", children: [jsx("h3", { children: "Choose a voice" }), ...props.voices.map((voice) => jsxs("div", { children: [jsx("label", { children: jsxs(Fragment, { children: [jsx("input", { type: "radio", name: "voice", checked: selectedSlug === voice.slug, onChange: () => setSelectedSlug(voice.slug) }), jsx("span", { children: voice.name }), jsx("small", { children: voice.description })] }) }), jsx("button", { type: "button", disabled: voice.previewUrl == null, onClick: () => void preview(voice), children: previewingSlug === voice.slug ? "Stop preview" : "Preview" })] }, voice.slug)), previewError == null ? null : jsx("p", { role: "alert", children: previewError }), saveError == null ? null : jsx("p", { role: "alert", children: saveError }), jsxs("div", { children: [jsx("button", { type: "button", disabled: isSaving, onClick: () => { stopPreview(); props.onClose(); }, children: "Cancel" }), jsx("button", { type: "button", disabled: isSaving || selectedSlug === props.initialVoice.slug, onClick: async () => { setSaveError(null); setIsSaving(true); try { await updateAccountSetting(props.scope, props.accountId, "realtime_voice", selectedSlug); props.toast.success("Voice saved"); stopPreview(); props.onSaved(selectedSlug); props.onClose(); } catch { setSaveError("Unable to save voice"); props.toast.danger("Unable to save voice", { errorAnalytics: { toastId: "settings.general.realtimeVoice.saveError" } }); } finally { setIsSaving(false); } }, children: isSaving ? "Saving…" : "Done" })] })] });
}

function VoiceChatHotkey(props: { disabled: boolean; scope: ScopeRuntime; toast: ToastManager }): unknown {
  const initialHotkey = readSetting(hotkeySetting.key);
  const [hotkey, setHotkey] = React.useState(typeof initialHotkey === "string" ? initialHotkey : "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const save = async (value: string): Promise<void> => { setError(null); setIsSaving(true); try { await writeSetting(props.scope, hotkeySetting, value || null); setHotkey(value); props.toast.success(value.length === 0 ? "Voice chat hotkey cleared" : "Voice chat hotkey saved"); } catch (cause) { const text = cause instanceof Error ? cause.message : "Failed to update voice chat hotkey"; setError(text); props.toast.danger(text); } finally { setIsSaving(false); } };
  return jsx(SettingsRow, { label: "Voice chat hotkey", description: jsxs("span", { children: ["Start voice chat from anywhere on desktop", error == null ? null : jsx("span", { role: "alert", children: error })] }), control: jsxs("div", { children: [jsx("input", { "aria-label": "Voice chat hotkey", disabled: props.disabled || isSaving, value: hotkey, onChange: (event: { currentTarget: { value: string } }) => setHotkey(event.currentTarget.value) }), jsx("button", { type: "button", disabled: props.disabled || isSaving, onClick: () => void save(hotkey), children: "Save hotkey" }), jsx("button", { type: "button", disabled: props.disabled || isSaving || hotkey.length === 0, onClick: () => void save(""), children: "Clear" })] }) });
}

function VoiceChatSettings(props: { accountId: string | null; scope: ScopeRuntime; toast: ToastManager }): unknown {
  const access = useSignalValue<VoiceAccess>(voiceAccessSignal);
  const languageQuery = useSignalValue<LanguageQuery>(languageQuerySignal);
  const options = voiceQueryOptions.getOptions({ spoken_language: languageQuery.data?.voiceMainLanguage ?? "auto", voice_mode: "advanced" }, { accountId: props.accountId, defaultLanguage: "en" });
  const voiceQuery = useQuery<VoiceData>(options as unknown as Record<string, unknown>);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [savedVoiceSlug, setSavedVoiceSlug] = React.useState<string | null>(null);
  if (access.status === "loading") return jsx(SettingsLoadingRow, { children: "Checking voice chat access…" });
  if (access.status === "error") return jsx(SettingsRow, { label: "Unable to verify voice chat access" });
  if (access.status === "unavailable" || props.accountId == null) return jsx(SettingsRow, { label: "Voice chat unavailable", description: "Your account or workspace does not have access to voice chat" });
  const unavailable = voiceQuery.isError || voiceQuery.data?.accountVoiceStatus === "unavailable";
  const effectiveSlug = savedVoiceSlug ?? voiceQuery.data?.effectiveVoiceSlug;
  const selectedVoice = voiceQuery.data?.voices.find((voice) => voice.slug === effectiveSlug);
  const voiceControl = unavailable ? jsx("button", { type: "button", onClick: () => void voiceQuery.refetch(), children: "Retry" }) : selectedVoice == null ? jsx("button", { type: "button", disabled: true, children: "Loading…" }) : jsx("button", { type: "button", onClick: () => setPickerOpen(true), children: selectedVoice.name });
  return jsxs("section", { "aria-label": "Voice chat", children: [jsx("h2", { children: "Voice chat" }), jsx(SettingsRow, { label: "Voice", description: jsxs("span", { children: ["Choose the voice Codex uses for new voice chats", unavailable ? jsx("span", { role: "alert", children: "Unable to load voice settings" }) : null] }), control: voiceControl }), jsx(VoiceChatHotkey, { disabled: unavailable || voiceQuery.isLoading, scope: props.scope, toast: props.toast }), pickerOpen && selectedVoice != null && voiceQuery.data != null ? jsx(VoicePicker, { accountId: props.accountId, initialVoice: selectedVoice, scope: props.scope, toast: props.toast, voices: voiceQuery.data.voices, onClose: () => setPickerOpen(false), onSaved: setSavedVoiceSlug }) : null] });
}

function VoiceSettings(): unknown {
  const scope = useScope(AppScope);
  const toast = scope.get(toastManagerSignal) as ToastManager;
  const accountId = useSignalValue<string | null>(currentAccountIdSignal);
  return jsxs("main", { "data-settings-page": "voice", children: [jsx("h1", { children: "Voice" }), jsxs("section", { "aria-label": "General", children: [jsx("h2", { children: "General" }), jsx(MicrophoneSettings, { disabled: false, scope, toast }), jsx(LanguageSettings, { accountId, disabled: false, scope, toast })] }), jsx(VoiceChatSettings, { accountId, scope, toast })] });
}

export { VoiceSettings };
