import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/voice-configuration-manager";
import "@rchunk/chatgpt-voices-query";
import { I3 as getJsxRuntime, e6 as ReactRuntime, type JsxRuntime } from "@rchunk/app-shared";
interface Voice { description?: string; name: string; slug: string }
interface Props { accountId: string; activeAccountId?: string; isError?: boolean; isLoading?: boolean; onBack(): void; onClose(): void; onComplete(): void; onSave?(slug: string): Promise<void> | void; onRetry?(): void; selectedVoice?: string | null; voices?: Voice[] }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function VoicePersonalizationDialog({ accountId, activeAccountId = accountId, isError = false, isLoading = false, onBack, onClose, onComplete, onRetry, onSave, selectedVoice, voices = [] }: Props): unknown {
  const [selectedSlug, setSelectedSlug] = ReactRuntime.useState<string | null>(selectedVoice ?? voices[0]?.slug ?? null);
  const [saving, setSaving] = ReactRuntime.useState(false);
  const [saveError, setSaveError] = ReactRuntime.useState(false);
  if (activeAccountId !== accountId) return null;
  const selected = voices.find(voice => voice.slug === selectedSlug) ?? voices.find(voice => voice.slug === selectedVoice) ?? voices[0];
  const submit = async () => {
    if (selected == null || saving) return;
    setSaving(true);
    setSaveError(false);
    try { await onSave?.(selected.slug); onComplete(); }
    catch { setSaveError(true); }
    finally { setSaving(false); }
  };
  return jsx().jsxs("dialog", { open: true, "aria-busy": saving, children: [jsx().jsx("h2", { children: "Choose a voice" }), isError || voices.length === 0 && !isLoading ? jsx().jsxs("div", { role: "alert", children: ["Voices aren’t available right now. Try again later", jsx().jsx("button", { type: "button", disabled: saving, onClick: onRetry, children: "Try again" })] }) : isLoading ? jsx().jsx("p", { role: "status", children: "Loading voices" }) : jsx().jsx("fieldset", { disabled: saving, children: voices.map(voice => jsx().jsxs("label", { children: [jsx().jsx("input", { type: "radio", name: "voice", checked: selected?.slug === voice.slug, onChange: () => { setSelectedSlug(voice.slug); setSaveError(false); } }), voice.name, voice.description] }, voice.slug)) }), saveError ? jsx().jsx("p", { role: "alert", children: "We couldn’t save your voice. Try again" }) : null, jsx().jsxs("footer", { children: [jsx().jsx("button", { type: "button", disabled: saving, onClick: onBack, children: "Back" }), jsx().jsx("button", { type: "button", disabled: selected == null || saving, onClick: () => void submit(), children: saving ? "Saving…" : "Continue" }), jsx().jsx("button", { type: "button", disabled: saving, onClick: onClose, children: "Close" })] })] });
}
export { VoicePersonalizationDialog };
