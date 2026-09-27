import "@rchunk/rolldown-runtime";
import "@rchunk/appgen-access";
import "@rchunk/appgen-site-card";
import "@rchunk/dialog-action";
import "@rchunk/permission-dropdown";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient, rJt as apiClient } from "@rchunk/app-initial";

type SiteAccess = "private" | "workspace_all" | "public";
interface AppgenShareDialogProps { initialAccess?: SiteAccess; initialPeople?: string[]; onClose?(): void; projectId: string; showVisitAction?: boolean; source: unknown }
interface AppgenApi { safePatch(path: string, options: Record<string, unknown>): Promise<unknown>; safePost(path: string, options: Record<string, unknown>): Promise<unknown> }
const jsx = getJsxRuntime();
const React = getReactRuntime();
const client = apiClient as unknown as AppgenApi;
function AppgenShareDialog({ projectId, initialAccess = "private", initialPeople = [], onClose, showVisitAction = true }: AppgenShareDialogProps): unknown {
  const [access, setAccess] = React.useState<SiteAccess>(initialAccess);
  const [people, setPeople] = React.useState(initialPeople);
  const [invite, setInvite] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const add = () => { const value = invite.trim().toLowerCase(); if (value && !people.includes(value)) setPeople(current => [...current, value]); setInvite(""); };
  const save = async () => {
    if (saving) return;
    setSaving(true);
    try { await client.safePatch("/appgen/projects/{project_id}/access", { parameters: { path: { project_id: projectId } }, requestBody: { access_mode: access, allowed_users: people } }); onClose?.(); } finally { setSaving(false); }
  };
  const copy = () => client.safePost("/appgen/projects/{project_id}/share-link", { parameters: { path: { project_id: projectId } } });
  return jsx.jsxs("dialog", { open: true, children: [jsx.jsx("h2", { children: "Share site" }), jsx.jsxs("label", { children: ["Access", jsx.jsxs("select", { value: access, onChange: (event: { currentTarget: { value: string } }) => setAccess(event.currentTarget.value as SiteAccess), children: [jsx.jsx("option", { value: "private", children: "Private" }), jsx.jsx("option", { value: "workspace_all", children: "Workspace" }), jsx.jsx("option", { value: "public", children: "Public" })] })] }), jsx.jsxs("div", { children: [jsx.jsx("input", { "aria-label": "Add people or groups", value: invite, onChange: (event: { currentTarget: { value: string } }) => setInvite(event.currentTarget.value) }), jsx.jsx("button", { type: "button", onClick: add, children: "Add" })] }), jsx.jsx("ul", { children: people.map(person => jsx.jsx("li", { children: person }, person)) }), jsx.jsxs("footer", { children: [showVisitAction ? jsx.jsx("button", { type: "button", onClick: copy, children: "Copy link" }) : null, jsx.jsx("button", { type: "button", disabled: saving, onClick: save, children: "Save" }), jsx.jsx("button", { type: "button", onClick: onClose, children: "Close" })] })] });
}
function initializeAppgenShareDialog(): void { initializeApiClient(); }
initializeAppgenShareDialog();
export { AppgenShareDialog };
