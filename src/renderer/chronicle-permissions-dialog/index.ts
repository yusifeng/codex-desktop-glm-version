import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/chronicle-service-queries";
import "@rchunk/chronicle-settings";
import "@rchunk/computer-use-native-app-metadata";
import "@rchunk/country-codes";
import { I3 as getJsxRuntime, e6 as ReactRuntime, type JsxRuntime } from "@rchunk/app-shared";

type InclusionMode = "exclude" | "include-only";
interface AppPermission { id: string; name: string }
interface PermissionConfig { appMode: InclusionMode; apps: AppPermission[]; websiteMode: InclusionMode; websites: string[] }
interface ChroniclePermissionsDialogProps { config?: PermissionConfig | null; error?: { code?: string; message: string } | null; isLoading?: boolean; onClose(): void; onRetry?(): void; onSave?(config: PermissionConfig): Promise<void> | void; step?: "apps" | "overview" | "websites" }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function formatChronicleError(error: unknown): string { return error instanceof Error ? error.message : "Computer history permissions could not be saved"; }
function initializeChronicleMessages(): void {}

function EnableMemoriesDialog({ onCancel, onEnable }: { onCancel(): void; onEnable(): Promise<void> | void }): unknown {
  const [pending, setPending] = ReactRuntime.useState(false);
  const [error, setError] = ReactRuntime.useState(false);
  const enable = async () => { if (pending) return; setPending(true); setError(false); try { await onEnable(); } catch { setError(true); } finally { setPending(false); } };
  return jsx().jsxs("dialog", { open: true, "aria-busy": pending, children: [jsx().jsx("h2", { children: "Turn on Memories to use Computer history?" }), jsx().jsx("p", { children: "Computer history requires Memories so ChatGPT can remember your activity across tasks." }), error ? jsx().jsx("p", { role: "alert", children: "Memories couldn’t be enabled. Try again." }) : null, jsx().jsx("button", { type: "button", disabled: pending, onClick: onCancel, children: "Cancel" }), jsx().jsx("button", { type: "button", disabled: pending, onClick: () => void enable(), children: pending ? "Turning on…" : "Turn on Memories" })] });
}

function initializeChronicleActions(): void {}
async function enableMemories(identity: unknown, services: { setMemoryFeatureEnabled?(enabled: boolean): Promise<void> | void; writeMemoryConfig?(identity: unknown): Promise<void> | void }): Promise<void> { await services.setMemoryFeatureEnabled?.(true); await services.writeMemoryConfig?.(identity); }
const chronicleConfigLoadedSignal = { key: "chronicle-config-loaded" };
const chronicleEnabledSignal = { key: "chronicle-enabled" };
const chroniclePermissionSummarySignal = { key: "chronicle-permission-summary" };
function initializeChronicleState(): void {}
async function ensureChronicleReady({ enableMemories: enable, getChronicleState }: { enableMemories(): Promise<void> | void; getChronicleState(): Promise<{ memoriesEnabled: boolean }> | { memoriesEnabled: boolean } }): Promise<boolean> { const state = await getChronicleState(); if (!state.memoriesEnabled) await enable(); return true; }
function computerHistoryDescription(): string { return "Augment memories with your computer activity so ChatGPT can help with anything you’re working on."; }
function computerHistoryTitle(): string { return "Computer history"; }
function permissionsDescription(): string { return "Choose which apps and websites to exclude or include in computer history"; }
function historyTitle(): string { return "History"; }
function initializeChronicleText(): void {}
function privacyDescription(): string { return "ChatGPT can summarize your activity across the apps and websites you use without ever recording your screen or audio."; }
function permissionsTitle(): string { return "Permissions"; }
function initializeChroniclePermissions(): void {}
function followWorkTitle(): string { return "Let ChatGPT follow your work"; }
function helpDescription(): string { return "Ask about what you were working on, get help without explaining everything again, or discover opportunities to automate repeated tasks."; }
function privacyDetails(): string { return "When turned on, ChatGPT saves text summaries of your activity across allowed apps and websites. Audio and private-mode web browsing are never included."; }

function ChroniclePermissionsDialog({ config, error, isLoading = false, onClose, onRetry, onSave, step = "overview" }: ChroniclePermissionsDialogProps): unknown {
  const [draftState, setDraftState] = ReactRuntime.useState<PermissionConfig>(() => config ?? { appMode: "exclude", apps: [], websiteMode: "exclude", websites: [] });
  const [dirty, setDirty] = ReactRuntime.useState(false);
  const [pending, setPending] = ReactRuntime.useState(false);
  const [saveError, setSaveError] = ReactRuntime.useState<string | null>(null);
  const [website, setWebsite] = ReactRuntime.useState("");
  const draft = !dirty && config != null ? config : draftState;
  const updateDraft = (update: (current: PermissionConfig) => PermissionConfig) => { setDraftState(current => update(!dirty && config != null ? config : current)); setDirty(true); };
  const save = async () => { if (pending || isLoading || error != null) return; setPending(true); setSaveError(null); try { await onSave?.(draft); onClose(); } catch (cause) { setSaveError(formatChronicleError(cause)); } finally { setPending(false); } };
  const addWebsite = () => { const value = website.trim().toLowerCase(); if (value.length === 0 || draft.websites.includes(value)) return; updateDraft(current => ({ ...current, websites: [...current.websites, value] })); setWebsite(""); };
  return jsx().jsxs("dialog", { open: true, "aria-busy": pending, children: [jsx().jsxs("header", { children: [jsx().jsx("h2", { children: "Computer history permissions" }), jsx().jsx("button", { type: "button", disabled: pending, "aria-label": "Close dialog", onClick: onClose, children: "Close" })] }), isLoading ? jsx().jsx("p", { role: "status", children: "Loading permissions…" }) : error != null ? jsx().jsxs("div", { role: "alert", children: [`Computer history permissions could not be loaded${error.code == null ? "" : ` (error ${error.code})`}.`, jsx().jsx("button", { type: "button", onClick: onRetry, children: "Try again" })] }) : jsx().jsxs("section", { "data-step": step, children: [jsx().jsx("label", { children: ["Apps", jsx().jsx("select", { disabled: pending, value: draft.appMode, onChange: (event: { currentTarget: { value: string } }) => updateDraft(current => ({ ...current, appMode: event.currentTarget.value === "include-only" ? "include-only" : "exclude" })), children: [jsx().jsx("option", { value: "exclude", children: "Exclude these apps" }), jsx().jsx("option", { value: "include-only", children: "Include only these apps" })] })] }), jsx().jsx("ul", { children: draft.apps.map(app => jsx().jsxs("li", { children: [app.name, jsx().jsx("button", { type: "button", disabled: pending, "aria-label": `Remove ${app.name}`, onClick: () => updateDraft(current => ({ ...current, apps: current.apps.filter(item => item.id !== app.id) })), children: "Remove" })] }, app.id)) }), jsx().jsx("label", { children: ["Websites", jsx().jsx("select", { disabled: pending, value: draft.websiteMode, onChange: (event: { currentTarget: { value: string } }) => updateDraft(current => ({ ...current, websiteMode: event.currentTarget.value === "include-only" ? "include-only" : "exclude" })), children: [jsx().jsx("option", { value: "exclude", children: "Exclude these websites" }), jsx().jsx("option", { value: "include-only", children: "Include only these websites" })] })] }), jsx().jsx("ul", { "aria-label": "Website permissions", children: draft.websites.map(domain => jsx().jsxs("li", { children: [domain, jsx().jsx("button", { type: "button", disabled: pending, "aria-label": `Remove ${domain}`, onClick: () => updateDraft(current => ({ ...current, websites: current.websites.filter(item => item !== domain) })), children: "Remove" })] }, domain)) }), jsx().jsx("input", { placeholder: "example.com", "aria-label": "Website domain", disabled: pending, value: website, onChange: (event: { currentTarget: { value: string } }) => setWebsite(event.currentTarget.value) }), jsx().jsx("button", { type: "button", disabled: pending || website.trim().length === 0, onClick: addWebsite, children: "Add website" })] }), saveError ? jsx().jsx("p", { role: "alert", children: saveError }) : null, jsx().jsxs("footer", { children: [jsx().jsx("button", { type: "button", disabled: pending, onClick: onClose, children: "Cancel" }), jsx().jsx("button", { type: "button", disabled: pending || isLoading || error != null, onClick: () => void save(), children: pending ? "Saving…" : step === "overview" ? "Continue" : "Done" })] })] });
}

export { initializeChronicleMessages as S, initializeChronicleState as _, helpDescription as a, initializeChronicleActions as b, followWorkTitle as c, historyTitle as d, initializeChronicleText as f, enableMemories as g, chronicleEnabledSignal as h, computerHistoryTitle as i, permissionsDescription as l, chroniclePermissionSummarySignal as m, initializeChroniclePermissions as n, privacyDescription as o, chronicleConfigLoadedSignal as p, computerHistoryDescription as r, privacyDetails as s, ChroniclePermissionsDialog as t, permissionsTitle as u, ensureChronicleReady as v, formatChronicleError as x, EnableMemoriesDialog as y };
