import "@rchunk/rolldown-runtime";
import "@rchunk/form-runtime";
import "@rchunk/color-palette";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient } from "@rchunk/app-initial";
import { n as validateRemoteConnectionDraft, r as initializeRemoteConnectionDraft } from "@rchunk/remote-connection-editor-draft";

interface RemoteConnectionDraft { authMode?: "identity" | "none"; color?: string; displayName: string; hostId?: string; identity?: string; sshHost: string; sshPort?: string; targetKind?: string; [key: string]: unknown }
interface RemoteConnectionEditorDialogProps {
  color?: string;
  draft: RemoteConnectionDraft;
  editingHostId?: string;
  existingConnections: RemoteConnectionDraft[];
  isSaving?: boolean;
  mode: "add" | "edit";
  onOpenChange(open: boolean): void;
  onSubmit(draft: RemoteConnectionDraft, color?: string): void;
  open: boolean;
}
interface ConnectionColorRowProps { color?: string; disabled?: boolean; hostId?: string; onChange(color: string): void }
const jsx = getJsxRuntime();
const React = getReactRuntime();

function ConnectionColorRow({ color = "blue", disabled, hostId, onChange }: ConnectionColorRowProps): unknown {
  return jsx.jsxs("label", { children: ["Color", jsx.jsx("input", { "aria-label": "Connection color", disabled, type: "color", value: color, onChange: (event: { currentTarget: { value: string } }) => onChange(event.currentTarget.value), "data-host-id": hostId })] });
}
function RemoteConnectionEditorDialog(props: RemoteConnectionEditorDialogProps): unknown {
  const [draft, setDraft] = React.useState<RemoteConnectionDraft>(props.draft);
  const [color, setColor] = React.useState(props.color);
  const [errors, setErrors] = React.useState<unknown[]>([]);
  const update = (key: keyof RemoteConnectionDraft, value: unknown) => setDraft(current => ({ ...current, [key]: value }));
  const submit = (event: { preventDefault(): void }) => {
    event.preventDefault();
    if (props.isSaving) return;
    const nextErrors = validateRemoteConnectionDraft({ draft, existingConnections: props.existingConnections, editingHostId: props.editingHostId }) as unknown[];
    setErrors(nextErrors);
    if (nextErrors.length === 0) props.onSubmit(draft, color);
  };
  if (!props.open) return null;
  return jsx.jsxs("dialog", { open: true, children: [jsx.jsx("h2", { children: props.mode === "add" ? "Add SSH connection" : "Edit connection" }), jsx.jsxs("form", { onSubmit: submit, children: [
    jsx.jsxs("label", { children: ["Display name", jsx.jsx("input", { value: draft.displayName, disabled: props.isSaving, onChange: (event: { currentTarget: { value: string } }) => update("displayName", event.currentTarget.value) })] }),
    jsx.jsxs("label", { children: [draft.targetKind === "alias" ? "Alias" : "Hostname", jsx.jsx("input", { value: draft.sshHost, disabled: props.isSaving || draft.targetKind === "alias", onChange: (event: { currentTarget: { value: string } }) => update("sshHost", event.currentTarget.value) })] }),
    jsx.jsxs("label", { children: ["SSH port", jsx.jsx("input", { value: draft.sshPort ?? "", disabled: props.isSaving, onChange: (event: { currentTarget: { value: string } }) => update("sshPort", event.currentTarget.value) })] }),
    jsx.jsxs("label", { children: ["Authentication", jsx.jsxs("select", { value: draft.authMode ?? "none", onChange: (event: { currentTarget: { value: string } }) => update("authMode", event.currentTarget.value), children: [jsx.jsx("option", { value: "none", children: "No Auth" }), jsx.jsx("option", { value: "identity", children: "Identity" })] })] }),
    draft.authMode === "identity" ? jsx.jsxs("label", { children: ["Identity file path", jsx.jsx("input", { value: draft.identity ?? "", onChange: (event: { currentTarget: { value: string } }) => update("identity", event.currentTarget.value) })] }) : null,
    jsx.jsx(ConnectionColorRow, { hostId: draft.hostId, color, disabled: props.isSaving, onChange: setColor }),
    errors.length ? jsx.jsx("p", { role: "alert", children: "Check the connection details and try again." }) : null,
    jsx.jsxs("footer", { children: [jsx.jsx("button", { type: "button", disabled: props.isSaving, onClick: () => props.onOpenChange(false), children: "Cancel" }), jsx.jsx("button", { type: "submit", disabled: props.isSaving, children: "Save" })] }),
  ] })] });
}
function initializeConnectionColorPicker(): void {}
function initializeRemoteConnectionEditorDialog(): void { initializeApiClient(); initializeRemoteConnectionDraft(); initializeConnectionColorPicker(); }
export { initializeConnectionColorPicker as i, initializeRemoteConnectionEditorDialog as n, ConnectionColorRow as r, RemoteConnectionEditorDialog as t };
