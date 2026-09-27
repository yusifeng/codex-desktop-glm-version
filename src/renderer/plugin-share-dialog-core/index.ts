import "@rchunk/rolldown-runtime";
import "@rchunk/dialog-action";
import "@rchunk/permission-dropdown";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient } from "@rchunk/app-initial";

type Discoverability = "PRIVATE" | "WORKSPACE" | "WORKSPACE_LISTED" | string;
interface SharePrincipal { principal_id: string; principal_type: string; role: string; [key: string]: unknown }
interface PluginShareDialogProps {
  canShareToWorkspace?: boolean;
  enforceAccessPermissions?: boolean;
  initialCanPublishToWorkspace?: boolean;
  initialDiscoverability?: Discoverability;
  initialSharePrincipals?: SharePrincipal[];
  onClose(): void;
  onCopyLink(): Promise<{ canPublishToWorkspace?: boolean; didCopy: boolean }>;
  onSaveShareTargets(principals: SharePrincipal[], discoverability?: string | null): Promise<{ canPublishToWorkspace?: boolean; principals: SharePrincipal[] }>;
  onUpdateSharedVersion?(): Promise<unknown>;
  pluginDisplayName: string;
  shouldShowCopyLinkCreationProgress?(): boolean;
  shouldShowUpdateSharedVersion?: boolean;
  sourceGizmoId?: string;
}
const jsx = getJsxRuntime();
const React = getReactRuntime();
function PluginShareDialog(props: PluginShareDialogProps): unknown {
  const [discoverability, setDiscoverability] = React.useState<Discoverability>(props.initialDiscoverability ?? "PRIVATE");
  const [principals, setPrincipals] = React.useState<SharePrincipal[]>(props.initialSharePrincipals ?? []);
  const [invite, setInvite] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "saving" | "copied" | "error">("idle");
  const workspaceDisabled = props.canShareToWorkspace === false || props.enforceAccessPermissions === true && props.initialCanPublishToWorkspace === false;
  const save = async () => {
    setStatus("saving");
    const next = invite.trim() ? [...principals, { principal_id: invite.trim(), principal_type: "user", role: "reader" }] : principals;
    try {
      const result = await props.onSaveShareTargets(next, discoverability === "WORKSPACE_LISTED" ? "LISTED" : null);
      setPrincipals(result.principals);
      setInvite("");
      setStatus("idle");
    } catch { setStatus("error"); }
  };
  const copy = async () => {
    setStatus("saving");
    try { const result = await props.onCopyLink(); setStatus(result.didCopy ? "copied" : "idle"); } catch { setStatus("error"); }
  };
  return jsx.jsxs("dialog", { open: true, children: [jsx.jsx("h2", { children: `Share ${props.pluginDisplayName}` }), jsx.jsxs("label", { children: ["Access", jsx.jsxs("select", { value: discoverability, onChange: (event: { currentTarget: { value: string } }) => setDiscoverability(event.currentTarget.value), children: [jsx.jsx("option", { value: "PRIVATE", children: "Private" }), jsx.jsx("option", { value: "WORKSPACE", disabled: workspaceDisabled, children: "Workspace" }), jsx.jsx("option", { value: "WORKSPACE_LISTED", disabled: workspaceDisabled, children: "Workspace discoverable" })] })] }), jsx.jsxs("label", { children: ["Invite people or groups", jsx.jsx("input", { value: invite, onChange: (event: { currentTarget: { value: string } }) => setInvite(event.currentTarget.value) })] }), jsx.jsx("ul", { children: principals.map(principal => jsx.jsx("li", { children: principal.principal_id }, `${principal.principal_type}:${principal.principal_id}`)) }), status === "error" ? jsx.jsx("p", { role: "alert", children: "Couldn't update sharing" }) : null, jsx.jsxs("footer", { children: [jsx.jsx("button", { type: "button", onClick: props.onClose, children: "Close" }), jsx.jsx("button", { type: "button", disabled: status === "saving", onClick: save, children: "Save access" }), props.shouldShowUpdateSharedVersion ? jsx.jsx("button", { type: "button", onClick: props.onUpdateSharedVersion, children: "Update shared version" }) : null, jsx.jsx("button", { type: "button", disabled: status === "saving", onClick: copy, children: status === "copied" ? "Copied" : "Copy link" })] })] });
}
function initializePluginShareDialog(): void { initializeApiClient(); }
export { initializePluginShareDialog as n, PluginShareDialog as t };
