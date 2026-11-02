import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as ReactRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/appgen-access";
import "@rchunk/appgen-site-detail-layout";
import "@rchunk/appgen-access-state-messages";
import "@rchunk/open-appgen-share-dialog";
import "@rchunk/appgen-site-card";
import "@rchunk/appgen-change-slug-dialog";

export interface AppgenEnvironmentDraft { buildCommand?: string; outputDirectory?: string; rootDirectory?: string }
interface AppgenSettingsDraft { environment: AppgenEnvironmentDraft; title: string }
export interface AppgenSettingsPageProps {
  environment?: AppgenEnvironmentDraft | null; error?: string | null; initialEnvironmentDraft?: AppgenEnvironmentDraft; initialTitle?: string;
  isEnvironmentError?: boolean; isEnvironmentLoading?: boolean; isLoading?: boolean; onClose?(): void; onDeleted(): Promise<void> | void;
  onSave?(input: AppgenSettingsDraft): Promise<void> | void; onSlugChange?(): void; projectId: string; siteUrl?: string | null;
}
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function createDraft(props: AppgenSettingsPageProps): AppgenSettingsDraft { return { environment: { ...(props.initialEnvironmentDraft ?? props.environment ?? {}) }, title: props.initialTitle ?? "" }; }
function normalizeEnvironment(value: AppgenEnvironmentDraft): AppgenEnvironmentDraft { return Object.fromEntries(Object.entries(value).filter(([, item]) => item != null && item !== "")) as AppgenEnvironmentDraft; }
function sameDraft(left: AppgenSettingsDraft, right: AppgenSettingsDraft): boolean { return left.title === right.title && JSON.stringify(normalizeEnvironment(left.environment)) === JSON.stringify(normalizeEnvironment(right.environment)); }
function errorMessage(error: unknown, fallback: string): string { return error instanceof Error && error.message.trim() ? error.message : fallback; }

function SettingsContent(props: AppgenSettingsPageProps & { embedded: boolean }): unknown {
  const [draft, setDraft] = ReactRuntime.useState<AppgenSettingsDraft>(() => createDraft(props));
  const [baseline, setBaseline] = ReactRuntime.useState<AppgenSettingsDraft>(() => createDraft(props));
  const [operation, setOperation] = ReactRuntime.useState<"delete" | "save" | null>(null);
  const [confirmation, setConfirmation] = ReactRuntime.useState<"delete" | "discard" | null>(null);
  const [operationError, setOperationError] = ReactRuntime.useState<string | null>(null);
  ReactRuntime.useEffect(() => { const next = createDraft(props); setDraft(next); setBaseline(next); setOperation(null); setConfirmation(null); setOperationError(null); }, [props.projectId]);
  const loading = props.isLoading || props.isEnvironmentLoading;
  const loadError = props.error ?? (props.isEnvironmentError ? "Unable to load the build environment" : null);
  if (loading) return jsx().jsx("div", { role: "status", children: "Loading site settings" });
  if (loadError) return jsx().jsx("div", { role: "alert", children: loadError });
  const dirty = !sameDraft(draft, baseline), pending = operation != null, invalid = draft.title.trim().length === 0 || draft.title.trim().length > 100;
  const updateEnvironment = (key: keyof AppgenEnvironmentDraft, value: string) => setDraft(current => ({ ...current, environment: { ...current.environment, [key]: value } }));
  const save = async () => {
    if (props.onSave == null || pending || invalid || !dirty) return;
    const submitted = { environment: normalizeEnvironment(draft.environment), title: draft.title.trim() };
    setOperation("save"); setOperationError(null);
    try { await props.onSave(submitted); setDraft(submitted); setBaseline(submitted); }
    catch (reason) { setOperationError(errorMessage(reason, "Couldn’t save site settings")); }
    finally { setOperation(null); }
  };
  const remove = async () => {
    if (pending) return;
    setOperation("delete"); setOperationError(null);
    try { await props.onDeleted(); setConfirmation(null); }
    catch (reason) { setOperationError(errorMessage(reason, "Couldn’t delete the site")); }
    finally { setOperation(null); }
  };
  const requestClose = () => { if (dirty) setConfirmation("discard"); else props.onClose?.(); };
  return jsx().jsxs("section", { "data-embedded": props.embedded, "data-project-id": props.projectId, children: [
    jsx().jsx("h1", { children: "Site settings" }),
    jsx().jsxs("label", { children: [jsx().jsx("span", { children: "Site title" }), jsx().jsx("input", { value: draft.title, disabled: pending, maxLength: 100, name: "title", onChange: (event: { currentTarget: { value: string } }) => setDraft(current => ({ ...current, title: event.currentTarget.value })) })] }),
    jsx().jsxs("label", { children: [jsx().jsx("span", { children: "Root directory" }), jsx().jsx("input", { value: draft.environment.rootDirectory ?? "", disabled: pending, name: "rootDirectory", onChange: (event: { currentTarget: { value: string } }) => updateEnvironment("rootDirectory", event.currentTarget.value) })] }),
    jsx().jsxs("label", { children: [jsx().jsx("span", { children: "Build command" }), jsx().jsx("input", { value: draft.environment.buildCommand ?? "", disabled: pending, name: "buildCommand", onChange: (event: { currentTarget: { value: string } }) => updateEnvironment("buildCommand", event.currentTarget.value) })] }),
    jsx().jsxs("label", { children: [jsx().jsx("span", { children: "Output directory" }), jsx().jsx("input", { value: draft.environment.outputDirectory ?? "", disabled: pending, name: "outputDirectory", onChange: (event: { currentTarget: { value: string } }) => updateEnvironment("outputDirectory", event.currentTarget.value) })] }),
    props.siteUrl ? jsx().jsx("a", { href: props.siteUrl, target: "_blank", rel: "noreferrer", children: "Open site" }) : null,
    props.onSlugChange ? jsx().jsx("button", { type: "button", disabled: pending, onClick: props.onSlugChange, children: "Change site URL" }) : null,
    operationError ? jsx().jsx("p", { role: "alert", children: operationError }) : null,
    props.onClose ? jsx().jsx("button", { type: "button", disabled: pending, onClick: requestClose, children: "Close" }) : null,
    jsx().jsx("button", { type: "button", disabled: props.onSave == null || pending || invalid || !dirty, onClick: () => void save(), children: operation === "save" ? "Saving…" : "Save" }),
    jsx().jsx("button", { type: "button", disabled: pending, onClick: () => setConfirmation("delete"), children: "Delete site" }),
    confirmation === "discard" ? jsx().jsxs("div", { role: "alertdialog", "aria-label": "Discard site setting changes?", children: [jsx().jsx("h2", { children: "Discard changes?" }), jsx().jsx("button", { type: "button", onClick: () => setConfirmation(null), children: "Keep editing" }), jsx().jsx("button", { type: "button", onClick: props.onClose, children: "Discard" })] }) : null,
    confirmation === "delete" ? jsx().jsxs("div", { role: "alertdialog", "aria-label": "Delete site?", children: [jsx().jsx("h2", { children: "Delete site?" }), jsx().jsx("p", { children: "This site will be permanently deleted." }), jsx().jsx("button", { type: "button", disabled: pending, onClick: () => setConfirmation(null), children: "Cancel" }), jsx().jsx("button", { type: "button", disabled: pending, onClick: () => void remove(), children: operation === "delete" ? "Deleting…" : "Delete" })] }) : null,
  ] });
}
function AppgenSettingsRoute(props: AppgenSettingsPageProps): unknown { return props.projectId ? jsx().jsx(SettingsContent, { ...props, embedded: false }) : jsx().jsx("div", { "data-redirect": "/sites" }); }
function AppgenSettingsPage(props: AppgenSettingsPageProps): unknown { return jsx().jsx(SettingsContent, { ...props, embedded: true }); }
function initializeAppgenSettingsPage(): void { void jsx(); }
export { AppgenSettingsRoute as n, initializeAppgenSettingsPage as r, AppgenSettingsPage as t };
