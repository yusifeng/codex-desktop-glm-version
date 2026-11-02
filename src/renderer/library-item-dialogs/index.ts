import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/library-item-actions";
import "@rchunk/library-trash-analytics";
import { I3 as getJsxRuntime, e6 as ReactRuntime, type JsxRuntime } from "@rchunk/app-shared";

interface LibraryEntry { node: { id: string; kind: "directory" | "file"; name: string }; favorite?: boolean }
type ConfirmAction = "delete" | "deleteForever" | "restore";
interface RenameLibraryItemDialogProps { accountId: string; entry: LibraryEntry; onClose(): void; onRename?(entry: LibraryEntry, name: string): Promise<boolean | void> | boolean | void; userId: string }
interface ConfirmLibraryItemsDialogProps { accountId: string; action?: ConfirmAction; analyticsContext?: string; bulk?: boolean; entries: LibraryEntry[]; onClose(): void; onCompleted?(entries: LibraryEntry[], action: ConfirmAction): void; onConfirm?(entries: LibraryEntry[], action: ConfirmAction): Promise<void> | void; userId: string }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function RenameLibraryItemDialog({ entry, onClose, onRename }: RenameLibraryItemDialogProps): unknown {
  const [name, setName] = ReactRuntime.useState(entry.node.name);
  const [pending, setPending] = ReactRuntime.useState(false);
  const [error, setError] = ReactRuntime.useState(false);
  const label = entry.node.kind === "directory" ? "Folder name" : "File name";
  const submit = async (event: { preventDefault(): void }) => { event.preventDefault(); const next = name.trim(); if (pending || next.length === 0) return; setPending(true); setError(false); try { const result = await onRename?.(entry, next); if (result !== false) onClose(); } catch { setError(true); } finally { setPending(false); } };
  return jsx().jsxs("dialog", { open: true, "aria-busy": pending, children: [jsx().jsx("h2", { children: entry.node.kind === "directory" ? "Rename folder" : "Rename file" }), jsx().jsxs("form", { onSubmit: submit, children: [jsx().jsx("label", { children: [label, jsx().jsx("input", { name: "name", value: name, required: true, disabled: pending, onChange: (event: { currentTarget: { value: string } }) => setName(event.currentTarget.value) })] }), error ? jsx().jsx("p", { role: "alert", children: "Couldn’t rename this item. Try again." }) : null, jsx().jsxs("footer", { children: [jsx().jsx("button", { type: "button", disabled: pending, onClick: onClose, children: "Cancel" }), jsx().jsx("button", { type: "submit", disabled: pending || name.trim().length === 0, children: pending ? "Renaming…" : "Rename" })] })] })] });
}
function ConfirmLibraryItemsDialog({ action = "delete", entries, onClose, onCompleted, onConfirm }: ConfirmLibraryItemsDialogProps): unknown {
  const [pending, setPending] = ReactRuntime.useState(false);
  const [error, setError] = ReactRuntime.useState(false);
  const count = entries.length, one = count === 1, itemName = entries[0]?.node.name ?? "item";
  const title = action === "restore" ? one ? "Restore file" : "Restore selected files" : action === "deleteForever" ? "Delete forever" : one && entries[0]?.node.kind === "directory" ? "Delete folder" : one ? "Delete file?" : "Delete selected items";
  const description = action === "restore" ? one ? `“${itemName}” will be restored to your Library` : `These ${count} selected files will be restored to your Library` : action === "deleteForever" ? one ? `“${itemName}” will be deleted forever. This can't be undone.` : `These ${count} selected files will be deleted forever. This can't be undone.` : one ? `“${itemName}” will be moved to Trash and permanently deleted after 30 days.` : `${count} selected items will be moved to Trash.`;
  const confirmLabel = action === "restore" ? "Restore" : action === "deleteForever" ? "Delete forever" : "Delete";
  const confirm = async () => { if (pending || count === 0) return; setPending(true); setError(false); try { await onConfirm?.(entries, action); onCompleted?.(entries, action); onClose(); } catch { setError(true); } finally { setPending(false); } };
  return jsx().jsxs("dialog", { open: true, "aria-busy": pending, children: [jsx().jsx("h2", { children: title }), jsx().jsx("p", { children: description }), error ? jsx().jsx("p", { role: "alert", children: "Couldn’t update these items. Try again." }) : null, jsx().jsxs("footer", { children: [jsx().jsx("button", { type: "button", disabled: pending, onClick: onClose, children: "Cancel" }), jsx().jsx("button", { type: "button", disabled: pending || count === 0, onClick: () => void confirm(), children: pending ? `${confirmLabel}…` : confirmLabel })] })] });
}
export { ConfirmLibraryItemsDialog, RenameLibraryItemDialog, type ConfirmLibraryItemsDialogProps, type LibraryEntry, type RenameLibraryItemDialogProps };
