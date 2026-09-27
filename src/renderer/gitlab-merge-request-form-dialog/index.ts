import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient } from "@rchunk/app-initial";
import "@rchunk/git-action-new-branch-field";
import "@rchunk/create-pull-request-modal-content";
import "@rchunk/creation-target-query";

interface GitLabForm { description?: string; headBranch?: string | null; targetBranch?: string | null; targetProjectPath?: string | null; title?: string; [key: string]: unknown }
interface GitLabTarget { conversationId?: string | null; cwd?: string; hostConfig?: unknown; hostId: string; [key: string]: unknown }
interface GitLabMergeRequestFormDialogProps {
  form: GitLabForm;
  onClose(): void;
  onSubmit?(input: { createAsDraft: boolean; description: string; form: GitLabForm; includeLocalChanges: boolean; newBranch?: string; openInBrowser: boolean; title: string }): Promise<unknown> | unknown;
  target: GitLabTarget;
}
const jsx = getJsxRuntime();
const React = getReactRuntime();
function GitLabMergeRequestFormDialog({ form, target, onClose, onSubmit }: GitLabMergeRequestFormDialogProps): unknown {
  const [title, setTitle] = React.useState(form.title ?? "");
  const [description, setDescription] = React.useState(form.description ?? "");
  const [includeLocalChanges, setIncludeLocalChanges] = React.useState(true);
  const [newBranch, setNewBranch] = React.useState(form.headBranch ?? "codex/");
  const [pending, setPending] = React.useState(false);
  const submit = async (createAsDraft: boolean, openInBrowser = false) => {
    if (pending || title.trim() === "" || form.headBranch == null && (newBranch.trim() === "" || newBranch.endsWith("/"))) return;
    setPending(true);
    try { await onSubmit?.({ createAsDraft, openInBrowser, includeLocalChanges, title: title.trim(), description: description.trim(), newBranch: form.headBranch == null ? newBranch.trim() : undefined, form }); onClose(); } finally { setPending(false); }
  };
  return jsx.jsxs("dialog", { open: true, "data-host-id": target.hostId, children: [jsx.jsx("h2", { children: "Create merge request" }), jsx.jsxs("form", { onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); void submit(false); }, children: [jsx.jsxs("label", { children: ["Title", jsx.jsx("input", { value: title, onChange: (event: { currentTarget: { value: string } }) => setTitle(event.currentTarget.value) })] }), jsx.jsxs("label", { children: ["Description", jsx.jsx("textarea", { value: description, onChange: (event: { currentTarget: { value: string } }) => setDescription(event.currentTarget.value) })] }), form.headBranch == null ? jsx.jsxs("label", { children: ["New branch", jsx.jsx("input", { value: newBranch, onChange: (event: { currentTarget: { value: string } }) => setNewBranch(event.currentTarget.value) })] }) : null, jsx.jsxs("label", { children: [jsx.jsx("input", { type: "checkbox", checked: includeLocalChanges, onChange: (event: { currentTarget: { checked: boolean } }) => setIncludeLocalChanges(event.currentTarget.checked) }), "Include local changes"] }), jsx.jsxs("footer", { children: [jsx.jsx("button", { type: "button", onClick: onClose, children: "Cancel" }), jsx.jsx("button", { type: "button", disabled: pending, onClick: () => void submit(true), children: "Create draft" }), jsx.jsx("button", { type: "button", disabled: pending, onClick: () => void submit(false, true), children: "Open in browser" }), jsx.jsx("button", { type: "submit", disabled: pending, children: "Create merge request" })] })] })] });
}
function initializeGitLabMergeRequestFormDialog(): void { initializeApiClient(); }
initializeGitLabMergeRequestFormDialog();
export { GitLabMergeRequestFormDialog };
