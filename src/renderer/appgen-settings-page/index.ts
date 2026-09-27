import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/appgen-access";
import "@rchunk/appgen-site-detail-layout";
import "@rchunk/appgen-access-state-messages";
import "@rchunk/open-appgen-share-dialog";
import "@rchunk/appgen-site-card";
import "@rchunk/appgen-change-slug-dialog";

export interface AppgenEnvironmentDraft { buildCommand?: string; outputDirectory?: string; rootDirectory?: string }
export interface AppgenSettingsPageProps { environment?: AppgenEnvironmentDraft | null; error?: string | null; initialEnvironmentDraft?: AppgenEnvironmentDraft; initialTitle?: string; isLoading?: boolean; onDeleted(): void; onSave?(input: { environment: AppgenEnvironmentDraft; title: string }): Promise<void> | void; projectId: string; siteUrl?: string | null }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function SettingsContent(props: AppgenSettingsPageProps & { embedded: boolean }): unknown {
  if (props.isLoading) return jsx().jsx("div", { role: "status", children: "Loading site settings" });
  if (props.error) return jsx().jsx("div", { role: "alert", children: props.error });
  const environment = props.initialEnvironmentDraft ?? props.environment ?? {};
  const title = props.initialTitle ?? "";
  return jsx().jsxs("section", { "data-embedded": props.embedded, "data-project-id": props.projectId, children: [
    jsx().jsx("h1", { children: "Site settings" }),
    jsx().jsx("label", { children: ["Site title", jsx().jsx("input", { defaultValue: title, name: "title" })] }),
    jsx().jsx("label", { children: ["Build command", jsx().jsx("input", { defaultValue: environment.buildCommand ?? "", name: "buildCommand" })] }),
    props.siteUrl ? jsx().jsx("a", { href: props.siteUrl, children: "Open site" }) : null,
    jsx().jsx("button", { type: "button", onClick: () => void props.onSave?.({ environment, title }), children: "Save" }),
    jsx().jsx("button", { type: "button", onClick: props.onDeleted, children: "Delete site" }),
  ] });
}
function AppgenSettingsRoute(props: AppgenSettingsPageProps): unknown { return props.projectId ? jsx().jsx(SettingsContent, { ...props, embedded: false }) : jsx().jsx("div", { "data-redirect": "/sites" }); }
function AppgenSettingsPage(props: AppgenSettingsPageProps): unknown { return jsx().jsx(SettingsContent, { ...props, embedded: true }); }
function initializeAppgenSettingsPage(): void { void jsx(); }
export { AppgenSettingsRoute as n, initializeAppgenSettingsPage as r, AppgenSettingsPage as t };
