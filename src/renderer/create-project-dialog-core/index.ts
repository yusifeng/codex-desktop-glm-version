import "@rchunk/rolldown-runtime";
import "@rchunk/app-primary";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient } from "@rchunk/app-initial";
import { r as initializeRemoteConnectionDraft } from "@rchunk/remote-connection-editor-draft";

interface CreateProjectRequest { host?: string; hostId?: string; initialPath?: string; mode?: "pick" | "setup"; setActive?: boolean; type?: string; [key: string]: unknown }
interface CreateProjectDialogProps { initialRequest?: CreateProjectRequest | null; onClose(): void; onCreate?(input: { directoryPath: string; hostId: string; name: string; setActive: boolean }): Promise<unknown>; remoteConnections?: Array<{ displayName?: string; hostId: string }> }
interface MissingDirectoryDialogProps { isCreating?: boolean; missingDirectory: { path: string; remoteName: string }; onCancel(): void; onCloseAutoFocus(): void; onConfirm(): void }
const jsx = getJsxRuntime();
const React = getReactRuntime();
function CreateMissingRemoteFolderDialog(props: MissingDirectoryDialogProps): unknown {
  return jsx.jsxs("dialog", { open: true, children: [jsx.jsx("h2", { children: "Create missing folder?" }), jsx.jsx("p", { children: `Create ${props.missingDirectory.path} on ${props.missingDirectory.remoteName} before adding the project?` }), jsx.jsxs("footer", { children: [jsx.jsx("button", { type: "button", disabled: props.isCreating, onClick: props.onCancel, children: "Cancel" }), jsx.jsx("button", { type: "button", disabled: props.isCreating, onClick: props.onConfirm, children: "Create folder" })] })] });
}
function CreateProjectDialog({ initialRequest, onClose, onCreate, remoteConnections = [] }: CreateProjectDialogProps): unknown {
  const initialHost = initialRequest?.hostId ?? remoteConnections.find(connection => connection.displayName === initialRequest?.host)?.hostId ?? "local";
  const [hostId, setHostId] = React.useState(initialHost);
  const [directoryPath, setDirectoryPath] = React.useState(initialRequest?.initialPath?.trim() ?? "");
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const submit = async (event: { preventDefault(): void }) => {
    event.preventDefault();
    if (saving || directoryPath.trim() === "") return;
    setSaving(true);
    try { await onCreate?.({ directoryPath: directoryPath.trim(), hostId, name: name.trim(), setActive: initialRequest?.setActive ?? true }); onClose(); } finally { setSaving(false); }
  };
  return jsx.jsxs("dialog", { open: true, children: [jsx.jsx("h2", { children: initialRequest?.mode === "pick" ? "Choose remote folder" : "Create project" }), jsx.jsxs("form", { onSubmit: submit, children: [jsx.jsxs("label", { children: ["Connection", jsx.jsxs("select", { value: hostId, onChange: (event: { currentTarget: { value: string } }) => setHostId(event.currentTarget.value), children: [jsx.jsx("option", { value: "local", children: "Local" }), ...remoteConnections.map(connection => jsx.jsx("option", { value: connection.hostId, children: connection.displayName ?? connection.hostId }, connection.hostId))] })] }), jsx.jsxs("label", { children: ["Folder", jsx.jsx("input", { value: directoryPath, onChange: (event: { currentTarget: { value: string } }) => setDirectoryPath(event.currentTarget.value) })] }), initialRequest?.mode === "pick" ? null : jsx.jsxs("label", { children: ["Project name", jsx.jsx("input", { value: name, onChange: (event: { currentTarget: { value: string } }) => setName(event.currentTarget.value) })] }), jsx.jsxs("footer", { children: [jsx.jsx("button", { type: "button", disabled: saving, onClick: onClose, children: "Cancel" }), jsx.jsx("button", { type: "submit", disabled: saving || directoryPath.trim() === "", children: initialRequest?.mode === "pick" ? "Use folder" : "Create project" })] })] })] });
}
function initializeCreateProjectDialog(): void { initializeApiClient(); initializeRemoteConnectionDraft(); }
export { CreateMissingRemoteFolderDialog as n, initializeCreateProjectDialog as r, CreateProjectDialog as t };
