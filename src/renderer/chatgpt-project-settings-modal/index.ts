import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/chatgpt-projects-runtime";
import { I3 as getJsxRuntime, e6 as ReactRuntime, type JsxRuntime } from "@rchunk/app-shared";

type MemoryScope = "global" | "project_v2";
interface Project { gizmo: { current_user_permission?: { can_delete?: boolean; can_write?: boolean }; display: { emoji?: string | null; name: string; theme?: string | null }; gizmo_snorlax_type?: string; id: string; instructions?: string | null; is_archived?: boolean; share_recipient?: string; sharing?: { subjects?: unknown[] } } }
interface ProjectSettingsDraft { instructions: string; memoryScope: MemoryScope; name: string }
interface ChatGptProjectSettingsModalProps { accountId: string; activeAccountId?: string; autoFocusProjectName?: boolean; memoryScope?: MemoryScope; onClose(): void; onDelete?(project: Project): Promise<void> | void; onSave?(project: Project, update: ProjectSettingsDraft): Promise<void> | void; project: Project; projectCrudStatus?: string; workChatStatus?: "allowed" | "checking" | "failed" | "has-work-chats" }

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function initialDraft(project: Project, memoryScope: MemoryScope): ProjectSettingsDraft { return { instructions: project.gizmo.instructions ?? "", memoryScope, name: project.gizmo.display.name }; }
function sameDraft(left: ProjectSettingsDraft, right: ProjectSettingsDraft): boolean { return left.name === right.name && left.instructions === right.instructions && left.memoryScope === right.memoryScope; }
function errorMessage(error: unknown, fallback: string): string { return error instanceof Error && error.message.trim() ? error.message : fallback; }

function ChatGptProjectSettingsModal({ accountId, activeAccountId = accountId, autoFocusProjectName = false, memoryScope = "global", onClose, onDelete, onSave, project, projectCrudStatus, workChatStatus = "allowed" }: ChatGptProjectSettingsModalProps): unknown {
  const [draft, setDraft] = ReactRuntime.useState<ProjectSettingsDraft>(() => initialDraft(project, memoryScope));
  const [baseline, setBaseline] = ReactRuntime.useState<ProjectSettingsDraft>(() => initialDraft(project, memoryScope));
  const [operation, setOperation] = ReactRuntime.useState<"delete" | "save" | null>(null);
  const [confirmation, setConfirmation] = ReactRuntime.useState<"delete" | "discard" | null>(null);
  const [error, setError] = ReactRuntime.useState<string | null>(null);
  ReactRuntime.useEffect(() => { const next = initialDraft(project, memoryScope); setDraft(next); setBaseline(next); setOperation(null); setConfirmation(null); setError(null); }, [project.gizmo.id, memoryScope]);
  if (activeAccountId !== accountId) return null;
  const canWrite = project.gizmo.current_user_permission?.can_write !== false;
  const canDelete = project.gizmo.current_user_permission?.can_delete !== false && onDelete != null;
  const dirty = !sameDraft(draft, baseline);
  const memoryBlocked = draft.memoryScope === "project_v2" && workChatStatus !== "allowed";
  const invalid = draft.name.trim().length === 0 || draft.name.trim().length > 50 || draft.instructions.length > 8000 || memoryBlocked;
  const externallyPending = projectCrudStatus === "loading" || projectCrudStatus === "pending";
  const pending = operation != null || externallyPending;
  const update = <K extends keyof ProjectSettingsDraft>(key: K, value: ProjectSettingsDraft[K]) => setDraft(current => ({ ...current, [key]: value }));
  const requestClose = () => { if (dirty) setConfirmation("discard"); else onClose(); };
  const save = async (event: { preventDefault(): void }) => {
    event.preventDefault();
    if (!canWrite || onSave == null || pending || invalid || !dirty) return;
    const submitted = { ...draft, name: draft.name.trim() };
    setOperation("save"); setError(null);
    try { await onSave(project, submitted); setDraft(submitted); setBaseline(submitted); onClose(); }
    catch (reason) { setError(errorMessage(reason, "Couldn’t save project settings")); }
    finally { setOperation(null); }
  };
  const remove = async () => {
    if (!canDelete || pending || onDelete == null) return;
    setOperation("delete"); setError(null);
    try { await onDelete(project); setConfirmation(null); onClose(); }
    catch (reason) { setError(errorMessage(reason, "Couldn’t delete the project")); }
    finally { setOperation(null); }
  };
  return jsx().jsxs("dialog", { open: true, children: [
    jsx().jsx("h2", { children: "Project settings" }),
    jsx().jsxs("form", { onSubmit: save, children: [
      jsx().jsx("label", { children: ["Name", jsx().jsx("input", { autoFocus: autoFocusProjectName, name: "project-name", value: draft.name, disabled: !canWrite || pending, maxLength: 50, onChange: (event: { currentTarget: { value: string } }) => update("name", event.currentTarget.value) })] }),
      jsx().jsx("label", { children: ["Instructions", jsx().jsx("textarea", { name: "instructions", value: draft.instructions, disabled: !canWrite || pending, maxLength: 8000, onChange: (event: { currentTarget: { value: string } }) => update("instructions", event.currentTarget.value) })] }),
      jsx().jsx("label", { children: ["Memory", jsx().jsx("select", { value: draft.memoryScope, disabled: !canWrite || pending || workChatStatus === "checking", onChange: (event: { currentTarget: { value: string } }) => update("memoryScope", event.currentTarget.value === "project_v2" ? "project_v2" : "global"), children: [jsx().jsx("option", { value: "global", children: "Default memory" }), jsx().jsx("option", { value: "project_v2", disabled: workChatStatus === "has-work-chats" || workChatStatus === "failed", children: "Project-only memory" })] })] }),
      workChatStatus === "checking" ? jsx().jsx("p", { role: "status", children: "Checking project chats…" }) : workChatStatus === "has-work-chats" ? jsx().jsx("p", { role: "alert", children: "Not supported for projects that contain Work chats" }) : workChatStatus === "failed" ? jsx().jsx("p", { role: "alert", children: "Couldn’t check project chats. Reopen the Memory menu to try again." }) : null,
      error ? jsx().jsx("p", { role: "alert", children: error }) : null,
      jsx().jsxs("footer", { children: [
        canDelete ? jsx().jsx("button", { type: "button", disabled: pending, onClick: () => setConfirmation("delete"), children: "Delete project" }) : null,
        jsx().jsx("button", { type: "button", disabled: pending, onClick: requestClose, children: "Cancel" }),
        jsx().jsx("button", { type: "submit", disabled: !canWrite || onSave == null || pending || invalid || !dirty, children: operation === "save" ? "Saving…" : "Save" }),
      ] }),
    ] }),
    confirmation === "discard" ? jsx().jsxs("div", { role: "alertdialog", "aria-label": "Discard changes?", children: [jsx().jsx("h3", { children: "Discard changes?" }), jsx().jsx("p", { children: "Your project setting changes will be lost." }), jsx().jsx("button", { type: "button", onClick: () => setConfirmation(null), children: "Keep editing" }), jsx().jsx("button", { type: "button", onClick: onClose, children: "Discard" })] }) : null,
    confirmation === "delete" ? jsx().jsxs("div", { role: "alertdialog", "aria-label": "Delete project?", children: [jsx().jsx("h3", { children: "Delete project?" }), jsx().jsx("p", { children: "This project and its chats will be permanently deleted." }), jsx().jsx("button", { type: "button", disabled: pending, onClick: () => setConfirmation(null), children: "Cancel" }), jsx().jsx("button", { type: "button", disabled: pending, onClick: () => void remove(), children: operation === "delete" ? "Deleting…" : "Delete" })] }) : null,
  ] });
}
export { ChatGptProjectSettingsModal, type ChatGptProjectSettingsModalProps };
