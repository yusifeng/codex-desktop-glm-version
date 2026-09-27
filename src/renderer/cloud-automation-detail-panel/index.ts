import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/automation-dialog";
import "@rchunk/automation-frequency-section";
import "@rchunk/automation-editor-dialog";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
interface Automation { destination?: string; id: string; instructions?: string; name?: string; schedule?: string; status?: string; triggers?: Array<Record<string, unknown>> }
interface Props { automation?: Automation | null; error?: string | null; isLoading?: boolean; onClose?(): void; onDelete?(): void; onEdit?(): void; onRunNow?(): void }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function DetailPanel({ automation, error, isLoading = false, onClose, onDelete, onEdit, onRunNow }: Props): unknown { if (isLoading) return jsx().jsx("p", { role: "status", children: "Loading scheduled task…" }); if (error != null) return jsx().jsx("p", { role: "alert", children: error }); if (automation == null) return jsx().jsx("p", { children: "Scheduled task not found" }); return jsx().jsxs("aside", { children: [jsx().jsx("h2", { children: automation.name ?? "Scheduled task" }), jsx().jsx("p", { children: automation.instructions }), automation.schedule == null ? null : jsx().jsx("p", { children: automation.schedule }), automation.destination == null ? null : jsx().jsx("p", { children: automation.destination }), jsx().jsx("button", { type: "button", onClick: onEdit, children: "Edit" }), jsx().jsx("button", { type: "button", onClick: onRunNow, children: "Run now" }), jsx().jsx("button", { type: "button", onClick: onDelete, children: "Delete" }), jsx().jsx("button", { type: "button", onClick: onClose, children: "Close" })] }); }
function CollapsibleSection({ children, title }: { children?: unknown; title: string }): unknown { return jsx().jsxs("details", { children: [jsx().jsx("summary", { children: title }), children] }); }
function initialize(): void {}
function automationTitle(automation: Automation): string { return automation.name?.trim() || "Scheduled task"; }
function canRun(automation: Automation): boolean { return automation.status !== "paused" && automation.status !== "completed"; }
export { initialize as a, CollapsibleSection as c, initialize as i, DetailPanel as n, automationTitle as o, canRun as r, initialize as s, initialize as t };
