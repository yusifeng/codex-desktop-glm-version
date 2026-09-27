import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/chatgpt-saved-memory-state";
interface MemoryVersion { content?: string | null; createdAt?: string | Date; id: string; isCurrent?: boolean }
interface SavedMemoryHistoryDialogProps { error?: string | null; isLoading?: boolean; onClose(): void; onDelete?(version: MemoryVersion): Promise<void> | void; onRestore?(version: MemoryVersion): Promise<void> | void; versions?: MemoryVersion[] }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function SavedMemoryHistoryDialog({ error = null, isLoading = false, onClose, onDelete, onRestore, versions = [] }: SavedMemoryHistoryDialogProps): unknown { return jsx().jsxs("dialog", { open: true, "aria-label": "Saved memories history", children: [jsx().jsx("button", { onClick: onClose, type: "button", children: "Close" }), isLoading ? jsx().jsx("div", { role: "status", children: "Loading history…" }) : error != null ? jsx().jsx("div", { role: "alert", children: error }) : versions.length === 0 ? jsx().jsx("p", { children: "No saved versions" }) : jsx().jsx("ol", { children: versions.map(version => jsx().jsxs("li", { children: [jsx().jsx("time", { children: version.createdAt == null ? "Unknown date" : new Date(version.createdAt).toLocaleString() }), jsx().jsx("p", { children: version.content?.trim() || "No memories" }), version.isCurrent ? jsx().jsx("span", { children: "Current version" }) : jsx().jsxs("span", { children: [jsx().jsx("button", { onClick: () => onRestore?.(version), type: "button", children: "Restore this version" }), jsx().jsx("button", { onClick: () => onDelete?.(version), type: "button", children: "Delete version" })] })] }, version.id)) })] }); }
export { SavedMemoryHistoryDialog };
