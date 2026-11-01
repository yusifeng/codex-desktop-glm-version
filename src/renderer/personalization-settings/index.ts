import "@rchunk/rolldown-runtime";
import { HX as useSignalValue, I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import { U6t as accountIdSignal, ofn as useFeatureGate, xun as personalizationEnabledSignal } from "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/about-you-summary";
import "@rchunk/chatgpt-user-context";
import "@rchunk/chronicle-service-queries";
import "@rchunk/chronicle-settings";
import "@rchunk/memory-manager-gate";
import "@rchunk/saved-memories";
import "@rchunk/settings-host-dropdown";
import "@rchunk/settings-loading-row";
import "@rchunk/personalization-state";
import "@rchunk/virtual-try-on";

export interface PersonalizationSettingsProps {
  accountId?: string | null;
  aboutYou?: string | null;
  agentInstructions?: string;
  baseStyle?: string;
  chronicleEnabled?: boolean;
  error?: string | null;
  isLoading?: boolean;
  memories?: readonly { id: string; text: string }[];
  memoryEnabled?: boolean;
  onAgentInstructionsChange?(value: string): void;
  onBaseStyleChange?(value: string): void;
  onChronicleEnabledChange?(value: boolean): void;
  onMemoryEnabledChange?(value: boolean): void;
  onRemoveMemory?(id: string): void;
  onRemoveReferencePhoto?(id: string): void;
  onSave?(): Promise<void> | void;
  personalizationEnabled?: boolean;
  referencePhotos?: readonly { id: string; name?: string }[];
}

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function Toggle(props: { checked: boolean; label: string; onChange?(checked: boolean): void }): unknown {
  return jsx().jsxs("label", { children: [
    jsx().jsx("span", { children: props.label }),
    jsx().jsx("input", { type: "checkbox", checked: props.checked, onChange: (event: { currentTarget: { checked: boolean } }) => props.onChange?.(event.currentTarget.checked) }),
  ] });
}

export function ChatGptPersonalizationSettings(props: PersonalizationSettingsProps = {}): unknown {
  const activeAccountId = useSignalValue(accountIdSignal);
  const enabledBySignal = useSignalValue(personalizationEnabledSignal);
  const enabledByGate = useFeatureGate("3466753652");
  const accountId = props.accountId === undefined ? activeAccountId : props.accountId;
  const personalizationEnabled = props.personalizationEnabled ?? (enabledBySignal && enabledByGate);
  if (props.isLoading) return jsx().jsx("div", { role: "status", children: "Loading personalization settings" });
  if (props.error) return jsx().jsx("div", { role: "alert", children: props.error });
  if (accountId == null || !personalizationEnabled) return jsx().jsxs("section", { "data-settings-page": "personalization", children: [jsx().jsx("h1", { children: "Personalization" }), jsx().jsx("p", { children: "Personalization is unavailable for this account." })] });

  const memories = props.memories ?? [];
  const photos = props.referencePhotos ?? [];
  return jsx().jsxs("section", { "data-account-id": accountId, "data-settings-page": "personalization", children: [
    jsx().jsx("h1", { children: "Personalization" }),
    jsx().jsxs("section", { children: [jsx().jsx("h2", { children: "About you" }), jsx().jsx("p", { children: props.aboutYou || "Tell ChatGPT more about you to improve responses." })] }),
    jsx().jsxs("section", { children: [
      jsx().jsx("h2", { children: "Memory" }),
      jsx().jsx(Toggle, { label: "Use saved memories", checked: props.memoryEnabled ?? true, onChange: props.onMemoryEnabledChange }),
      memories.length === 0 ? jsx().jsx("p", { children: "No saved memories" }) : jsx().jsx("ul", { children: memories.map((memory) => jsx().jsxs("li", { children: [jsx().jsx("span", { children: memory.text }), jsx().jsx("button", { type: "button", onClick: () => props.onRemoveMemory?.(memory.id), children: "Remove" })] }, memory.id)) }),
    ] }),
    jsx().jsxs("section", { children: [jsx().jsx("h2", { children: "Computer History" }), jsx().jsx(Toggle, { label: "Use Computer History", checked: props.chronicleEnabled ?? false, onChange: props.onChronicleEnabledChange })] }),
    jsx().jsxs("section", { children: [
      jsx().jsx("h2", { children: "Reference photos" }),
      photos.length === 0 ? jsx().jsx("p", { children: "No reference photos" }) : jsx().jsx("ul", { children: photos.map((photo) => jsx().jsxs("li", { children: [jsx().jsx("span", { children: photo.name ?? "Reference photo" }), jsx().jsx("button", { type: "button", onClick: () => props.onRemoveReferencePhoto?.(photo.id), children: "Remove" })] }, photo.id)) }),
    ] }),
    jsx().jsxs("label", { children: [
      jsx().jsx("span", { children: "Base style" }),
      jsx().jsx("select", { "aria-label": "Base style", value: props.baseStyle ?? "default", onChange: (event: { currentTarget: { value: string } }) => props.onBaseStyleChange?.(event.currentTarget.value), children: ["default", "professional", "friendly", "concise", "quirky"].map((value) => jsx().jsx("option", { value, children: value }, value)) }),
    ] }),
    jsx().jsxs("label", { children: [jsx().jsx("span", { children: "Agent instructions" }), jsx().jsx("textarea", { value: props.agentInstructions ?? "", onChange: (event: { currentTarget: { value: string } }) => props.onAgentInstructionsChange?.(event.currentTarget.value) })] }),
    jsx().jsx("button", { type: "button", onClick: () => void props.onSave?.(), children: "Save" }),
  ] });
}
