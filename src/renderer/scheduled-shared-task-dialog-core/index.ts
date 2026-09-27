import "@rchunk/rolldown-runtime";
import "@rchunk/automation-dialog";
import "@rchunk/schedule-fields";
import "@rchunk/schedule-draft";
import "@rchunk/share-analytics";
import "@rchunk/codex-thread-report-dialog-entry";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient, rJt as apiClient } from "@rchunk/app-initial";

interface SharedTask { automation: { importable?: boolean; name?: string; prompt?: string; source_automation_id?: string }; post: { id: string; is_owner?: boolean; permissions?: { can_write?: boolean } }; [key: string]: unknown }
interface SharedTaskDialogProps { initialSharedTask?: SharedTask; onClose(): void; onImport?(task: SharedTask): Promise<unknown>; postId: string }
interface SharedTaskApi { safeGet<Response>(path: string, options: Record<string, unknown>): Promise<Response> }
const jsx = getJsxRuntime();
const React = getReactRuntime();
const client = apiClient as unknown as SharedTaskApi;
function SharedTaskDialog({ postId, onClose, initialSharedTask, onImport }: SharedTaskDialogProps): unknown {
  const [task, setTask] = React.useState<SharedTask | null>(initialSharedTask ?? null);
  const [status, setStatus] = React.useState(initialSharedTask == null ? "loading" : "ready");
  React.useEffect(() => {
    if (initialSharedTask != null) return;
    const controller = new AbortController();
    client.safeGet<SharedTask>("/share/post/{post_id}/automation", { parameters: { path: { post_id: postId } }, signal: controller.signal }).then(value => { setTask(value); setStatus("ready"); }, () => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [initialSharedTask, postId]);
  const importTask = () => {
    if (task == null || onImport == null) return;
    setStatus("saving");
    onImport(task).then(() => onClose(), () => setStatus("error"));
  };
  return jsx.jsxs("dialog", { open: true, children: [jsx.jsx("h2", { children: task?.post.is_owner ? "Share task" : "Shared with you" }), status === "loading" ? jsx.jsx("p", { role: "status", children: "Loading shared task…" }) : null, status === "error" ? jsx.jsx("p", { role: "alert", children: "Couldn't load this shared task" }) : null, task ? jsx.jsxs("article", { children: [jsx.jsx("h3", { children: task.automation.name ?? "Scheduled task" }), jsx.jsx("p", { children: task.automation.prompt }), task.automation.importable && !task.post.is_owner ? jsx.jsx("button", { type: "button", disabled: status === "saving", onClick: importTask, children: "Save task" }) : null] }) : null, jsx.jsx("button", { type: "button", onClick: onClose, children: "Close" })] });
}
function initializeSharedTaskDialog(): void { initializeApiClient(); }
export { initializeSharedTaskDialog as n, SharedTaskDialog as t };
