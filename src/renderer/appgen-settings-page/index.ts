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
export interface AppgenSettingsPageProps {
  environment?: AppgenEnvironmentDraft | null;
  error?: string | null;
  initialEnvironmentDraft?: AppgenEnvironmentDraft;
  initialTitle?: string;
  isEnvironmentError?: boolean;
  isEnvironmentLoading?: boolean;
  isLoading?: boolean;
  onDeleted(): void;
  onSave?(input: { environment: AppgenEnvironmentDraft; title: string }): Promise<void> | void;
  onSlugChange?(): void;
  projectId: string;
  siteUrl?: string | null;
}

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }

function SettingsContent(props: AppgenSettingsPageProps & { embedded: boolean }): unknown {
  const initialEnvironment = props.initialEnvironmentDraft ?? props.environment ?? {};
  const [title, setTitle] = ReactRuntime.useState(props.initialTitle ?? "");
  const [environment, setEnvironment] = ReactRuntime.useState<AppgenEnvironmentDraft>(() => ({ ...initialEnvironment }));
  const [saving, setSaving] = ReactRuntime.useState(false);
  const loading = props.isLoading || props.isEnvironmentLoading;
  const error = props.error ?? (props.isEnvironmentError ? "Unable to load the build environment" : null);
  if (loading) return jsx().jsx("div", { role: "status", children: "Loading site settings" });
  if (error) return jsx().jsx("div", { role: "alert", children: error });

  const updateEnvironment = (key: keyof AppgenEnvironmentDraft, value: string) => setEnvironment((current) => ({ ...current, [key]: value }));
  const save = async () => {
    if (props.onSave == null) return;
    setSaving(true);
    try { await props.onSave({ environment, title }); }
    finally { setSaving(false); }
  };
  return jsx().jsxs("section", { "data-embedded": props.embedded, "data-project-id": props.projectId, children: [
    jsx().jsx("h1", { children: "Site settings" }),
    jsx().jsxs("label", { children: [jsx().jsx("span", { children: "Site title" }), jsx().jsx("input", { value: title, name: "title", onChange: (event: { currentTarget: { value: string } }) => setTitle(event.currentTarget.value) })] }),
    jsx().jsxs("label", { children: [jsx().jsx("span", { children: "Root directory" }), jsx().jsx("input", { value: environment.rootDirectory ?? "", name: "rootDirectory", onChange: (event: { currentTarget: { value: string } }) => updateEnvironment("rootDirectory", event.currentTarget.value) })] }),
    jsx().jsxs("label", { children: [jsx().jsx("span", { children: "Build command" }), jsx().jsx("input", { value: environment.buildCommand ?? "", name: "buildCommand", onChange: (event: { currentTarget: { value: string } }) => updateEnvironment("buildCommand", event.currentTarget.value) })] }),
    jsx().jsxs("label", { children: [jsx().jsx("span", { children: "Output directory" }), jsx().jsx("input", { value: environment.outputDirectory ?? "", name: "outputDirectory", onChange: (event: { currentTarget: { value: string } }) => updateEnvironment("outputDirectory", event.currentTarget.value) })] }),
    props.siteUrl ? jsx().jsx("a", { href: props.siteUrl, target: "_blank", rel: "noreferrer", children: "Open site" }) : null,
    props.onSlugChange ? jsx().jsx("button", { type: "button", onClick: props.onSlugChange, children: "Change site URL" }) : null,
    jsx().jsx("button", { type: "button", disabled: saving, onClick: () => void save(), children: saving ? "Saving…" : "Save" }),
    jsx().jsx("button", { type: "button", onClick: props.onDeleted, children: "Delete site" }),
  ] });
}
function AppgenSettingsRoute(props: AppgenSettingsPageProps): unknown { return props.projectId ? jsx().jsx(SettingsContent, { ...props, embedded: false }) : jsx().jsx("div", { "data-redirect": "/sites" }); }
function AppgenSettingsPage(props: AppgenSettingsPageProps): unknown { return jsx().jsx(SettingsContent, { ...props, embedded: true }); }
function initializeAppgenSettingsPage(): void { void jsx(); }
export { AppgenSettingsRoute as n, initializeAppgenSettingsPage as r, AppgenSettingsPage as t };
