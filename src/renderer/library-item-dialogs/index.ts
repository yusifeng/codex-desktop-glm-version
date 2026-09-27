import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/library-item-actions";
import "@rchunk/library-trash-analytics";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";

interface LibraryEntry { node: { id: string; kind: "directory" | "file"; name: string }; favorite?: boolean }
type ConfirmAction = "delete" | "deleteForever" | "restore";
interface RenameLibraryItemDialogProps { accountId: string; entry: LibraryEntry; onClose(): void; onRename?(entry: LibraryEntry, name: string): Promise<boolean | void> | boolean | void; userId: string }
interface ConfirmLibraryItemsDialogProps { accountId: string; action?: ConfirmAction; analyticsContext?: string; bulk?: boolean; entries: LibraryEntry[]; onClose(): void; onCompleted?(entries: LibraryEntry[], action: ConfirmAction): void; onConfirm?(entries: LibraryEntry[], action: ConfirmAction): Promise<void> | void; userId: string }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function RenameLibraryItemDialog({ entry, onClose, onRename }: RenameLibraryItemDialogProps): unknown {
  let name = entry.node.name, pending = false;
  const label = entry.node.kind === "directory" ? "Folder name" : "File name";
  return jsx().jsxs("dialog", { open: true, children: [jsx().jsx("h2", { children: entry.node.kind === "directory" ? "Rename folder" : "Rename file" }), jsx().jsxs("form", { onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); const next = name.trim(); if (pending || next.length === 0) return; pending = true; Promise.resolve(onRename?.(entry, next)).then(result => { if (result !== false) onClose(); }).finally(() => { pending = false; }); }, children: [jsx().jsx("label", { children: [label, jsx().jsx("input", { name: "name", defaultValue: name, required: true, onChange: (event: { currentTarget: { value: string } }) => { name = event.currentTarget.value; } })] }), jsx().jsxs("footer", { children: [jsx().jsx("button", { type: "button", onClick: onClose, children: "Cancel" }), jsx().jsx("button", { type: "submit", children: pending ? "Renaming…" : "Rename" })] })] })] });
}
function ConfirmLibraryItemsDialog({ action = "delete", entries, onClose, onCompleted, onConfirm }: ConfirmLibraryItemsDialogProps): unknown {
  let pending = false;
  const count = entries.length, one = count === 1, itemName = entries[0]?.node.name ?? "item";
  const title = action === "restore" ? one ? "Restore file" : "Restore selected files" : action === "deleteForever" ? "Delete forever" : one && entries[0]?.node.kind === "directory" ? "Delete folder" : one ? "Delete file?" : "Delete selected items";
  const description = action === "restore" ? one ? `“${itemName}” will be restored to your Library` : `These ${count} selected files will be restored to your Library` : action === "deleteForever" ? one ? `“${itemName}” will be deleted forever. This can't be undone.` : `These ${count} selected files will be deleted forever. This can't be undone.` : one ? `“${itemName}” will be moved to Trash and permanently deleted after 30 days.` : `${count} selected items will be moved to Trash.`;
  const confirmLabel = action === "restore" ? "Restore" : action === "deleteForever" ? "Delete forever" : "Delete";
  return jsx().jsxs("dialog", { open: true, children: [jsx().jsx("h2", { children: title }), jsx().jsx("p", { children: description }), jsx().jsxs("footer", { children: [jsx().jsx("button", { type: "button", disabled: pending, onClick: onClose, children: "Cancel" }), jsx().jsx("button", { type: "button", disabled: pending || count === 0, onClick: () => { if (pending || count === 0) return; pending = true; Promise.resolve(onConfirm?.(entries, action)).then(() => { onCompleted?.(entries, action); onClose(); }).finally(() => { pending = false; }); }, children: confirmLabel })] })] });
}
export { ConfirmLibraryItemsDialog, RenameLibraryItemDialog, type ConfirmLibraryItemsDialogProps, type LibraryEntry, type RenameLibraryItemDialogProps };
