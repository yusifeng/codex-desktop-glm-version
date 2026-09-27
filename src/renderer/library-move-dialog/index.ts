import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/library-item-actions";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";

interface LibraryEntry { node: { id: string; kind: "directory" | "file"; name: string; parent_directory_id?: string | null } }
interface Directory { id: string; name: string; parentId?: string | null }
interface PathItem { id: string; name: string }
interface MoveLibraryItemsDialogProps { accountId: string; destinations?: Directory[]; entries: LibraryEntry[]; error?: string | null; initialPath?: PathItem[]; isLoading?: boolean; onClose(): void; onCreateFolder?(name: string, parentId: string | null): Promise<Directory> | Directory; onMove?(entries: LibraryEntry[], directoryId: string | null): Promise<string[] | void> | string[] | void; onMoved(ids: string[]): void; onRetry?(): void; rootDirectoryId?: string | null; userId: string }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function MoveLibraryItemsDialog({ destinations = [], entries, error, initialPath = [], isLoading = false, onClose, onCreateFolder, onMove, onMoved, onRetry, rootDirectoryId = null }: MoveLibraryItemsDialogProps): unknown {
  let path = [...initialPath], creating = false, folderName = "", pending = false;
  const currentId = () => path.at(-1)?.id ?? rootDirectoryId;
  const invalidIds = new Set(entries.filter(entry => entry.node.kind === "directory").map(entry => entry.node.id));
  const visible = () => destinations.filter(directory => (directory.parentId ?? rootDirectoryId) === currentId() && !invalidIds.has(directory.id));
  return jsx().jsxs("dialog", { open: true, children: [jsx().jsx("h2", { children: "Move to…" }), jsx().jsx("nav", { "aria-label": "Current folder", children: [jsx().jsx("button", { type: "button", onClick: () => { path = []; }, children: "Library" }), ...path.map((item, index) => jsx().jsx("button", { type: "button", onClick: () => { path = path.slice(0, index + 1); }, children: item.name }, item.id))] }), isLoading ? jsx().jsx("p", { role: "status", children: "Loading folders" }) : error != null ? jsx().jsxs("div", { role: "alert", children: [error, jsx().jsx("button", { type: "button", onClick: onRetry, children: "Try again" })] }) : jsx().jsx("ul", { children: visible().map(directory => jsx().jsx("li", { children: jsx().jsx("button", { type: "button", onClick: () => { path.push({ id: directory.id, name: directory.name }); }, children: directory.name }) }, directory.id)) }), creating ? jsx().jsxs("form", { onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); const name = folderName.trim(); if (name.length === 0) return; void Promise.resolve(onCreateFolder?.(name, currentId())).then(folder => { if (folder != null) path.push({ id: folder.id, name: folder.name }); creating = false; }); }, children: [jsx().jsx("input", { "aria-label": "Folder name", onChange: (event: { currentTarget: { value: string } }) => { folderName = event.currentTarget.value; } }), jsx().jsx("button", { type: "submit", children: "Create" })] }) : jsx().jsx("button", { type: "button", onClick: () => { creating = true; }, children: "New folder" }), jsx().jsxs("footer", { children: [jsx().jsx("button", { type: "button", disabled: pending, onClick: onClose, children: "Cancel" }), jsx().jsx("button", { type: "button", disabled: pending || entries.length === 0, onClick: () => { pending = true; Promise.resolve(onMove?.(entries, currentId())).then(ids => { onMoved(Array.isArray(ids) ? ids : entries.map(entry => entry.node.id)); onClose(); }).finally(() => { pending = false; }); }, children: pending ? "Moving…" : "Move" })] })] });
}
export { MoveLibraryItemsDialog, type MoveLibraryItemsDialogProps };
