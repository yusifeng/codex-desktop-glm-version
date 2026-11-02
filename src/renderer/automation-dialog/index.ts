import "@rchunk/rolldown-runtime";
import "@rchunk/app-primary";
import "@rchunk/model-and-reasoning-effort-translations";
import * as appInitialChunk from "@rchunk/app-initial";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";

const { cJt: initializeApiClient, w8: useModelsQuery } = appInitialChunk as unknown as {
  cJt(): void;
  w8?: () => { data?: { models?: ModelOption[] } };
};

interface AutomationDraft { name: string; prompt: string; schedule?: string; model?: string; reasoningEffort?: string; [key: string]: unknown }
interface AutomationFormProps { disablePromptAutoFocus?: boolean; draft: AutomationDraft; formId?: string; onSubmit?(): void; promptSize?: string; roots?: unknown[]; setDraft(value: AutomationDraft | ((current: AutomationDraft) => AutomationDraft)): void }
interface AutomationDialogProps { initialDraft: AutomationDraft; onClose(): void; onSave(draft: AutomationDraft): Promise<unknown>; open?: boolean; readOnly?: boolean }
interface ModelOption { displayName?: string; model: string; supportedReasoningEfforts?: string[] }
const jsx = getJsxRuntime();
const React = getReactRuntime();
function AutomationTitleInput({ id, value, autoFocus, readOnly = false, onChange }: { id?: string; value: string; autoFocus?: boolean; readOnly?: boolean; onChange?(value: string): void }): unknown {
  return jsx.jsx("input", { id, "data-testid": "automation-title-input", "aria-label": "Name", autoFocus, readOnly, value, placeholder: "Scheduled task title", onChange: (event: { currentTarget: { value: string } }) => onChange?.(event.currentTarget.value) });
}
function AutomationSandboxDetails({ isReadOnlySandbox, isDangerFullAccess }: { isReadOnlySandbox?: boolean; isDangerFullAccess?: boolean }): unknown {
  return jsx.jsx("p", { role: "note", children: isDangerFullAccess ? "Runs with full access" : isReadOnlySandbox ? "Runs in a read-only sandbox" : "Runs in a workspace sandbox" });
}
function AutomationModelSelector({ align = "start", className, field, models: explicitModels, reasoningEffort, selectedModel, onSelect }: {
  align?: string;
  className?: string;
  field: "model" | "reasoning";
  models?: ModelOption[];
  reasoningEffort?: string | null;
  selectedModel?: string | null;
  onSelect(model: string, reasoningEffort: string | null): void;
}): unknown {
  const query = (useModelsQuery as unknown as (() => { data?: { models?: ModelOption[] } }) | undefined)?.();
  const models = explicitModels ?? query?.data?.models ?? [];
  const selected = models.find((model) => model.model === selectedModel);
  const efforts = selected?.supportedReasoningEfforts ?? ["low", "medium", "high", "xhigh"];
  const disabled = field === "reasoning" && selectedModel == null;
  return jsx.jsx("select", {
    "aria-label": field === "model" ? "Model" : "Reasoning",
    "data-align": align,
    className,
    disabled,
    value: field === "model" ? selectedModel ?? "" : reasoningEffort ?? "",
    onChange: (event: { currentTarget: { value: string } }) => {
      if (field === "model") {
        const model = event.currentTarget.value;
        const option = models.find((candidate) => candidate.model === model);
        const nextEffort = option?.supportedReasoningEfforts?.includes(reasoningEffort ?? "") === true ? reasoningEffort ?? null : option?.supportedReasoningEfforts?.[0] ?? null;
        onSelect(model, nextEffort);
      } else if (selectedModel != null) onSelect(selectedModel, event.currentTarget.value || null);
    },
    children: field === "model"
      ? [jsx.jsx("option", { value: "", children: "Select model" }, "empty"), ...models.map((model) => jsx.jsx("option", { value: model.model, children: model.displayName ?? model.model }, model.model))]
      : efforts.map((effort) => jsx.jsx("option", { value: effort, children: effort }, effort)),
  });
}
function AutomationForm({ draft, setDraft, formId, onSubmit }: AutomationFormProps): unknown {
  const update = (key: string, value: string) => setDraft(current => ({ ...current, [key]: value }));
  return jsx.jsxs("form", { id: formId, onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); onSubmit?.(); }, children: [jsx.jsx(AutomationTitleInput, { value: draft.name, onChange: value => update("name", value) }), jsx.jsxs("label", { children: ["Instructions", jsx.jsx("textarea", { value: draft.prompt, onChange: (event: { currentTarget: { value: string } }) => update("prompt", event.currentTarget.value) })] }), jsx.jsxs("label", { children: ["Schedule", jsx.jsx("input", { value: draft.schedule ?? "", onChange: (event: { currentTarget: { value: string } }) => update("schedule", event.currentTarget.value) })] }), jsx.jsx("button", { type: "submit", children: "Save" })] });
}
function AutomationDialog({ initialDraft, onClose, onSave, open = true, readOnly = false }: AutomationDialogProps): unknown {
  const [draft, setDraft] = React.useState(initialDraft);
  const [saving, setSaving] = React.useState(false);
  if (!open) return null;
  const save = () => { if (saving || readOnly) return; setSaving(true); onSave(draft).then(onClose, () => setSaving(false)); };
  return jsx.jsxs("dialog", { open: true, children: [jsx.jsx("h2", { children: readOnly ? "Scheduled task" : "Edit scheduled task" }), jsx.jsx(AutomationForm, { draft, setDraft, onSubmit: save }), jsx.jsx(AutomationSandboxDetails, { isReadOnlySandbox: readOnly }), jsx.jsx("button", { type: "button", onClick: onClose, children: "Cancel" })] });
}
function createAutomationDraft(input: Partial<AutomationDraft> = {}): AutomationDraft { return { name: "", prompt: "", ...input }; }
function isAutomationDraftValid(draft: AutomationDraft): boolean { return draft.name.trim().length > 0 && draft.prompt.trim().length > 0; }
function initializeAutomationDialog(): void { initializeApiClient(); }
export { initializeAutomationDialog as a, AutomationTitleInput as i, AutomationModelSelector as n, AutomationSandboxDetails as r, AutomationForm as t };
void createAutomationDraft;
void isAutomationDraftValid;
