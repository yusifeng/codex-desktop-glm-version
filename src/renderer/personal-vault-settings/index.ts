import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as ReactRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/security-tabs";
import "@rchunk/toolbar-breadcrumb";
import "@rchunk/entry-type";
import "@rchunk/personal-secret-dialog";

export type VaultNamespace = "not_sensitive" | "sensitive";
export interface PersonalVaultEntry { envVar?: string | null; id: string; name: string; namespace: VaultNamespace; targets?: string[] }
export interface PersonalVaultSettingsProps { entries?: readonly PersonalVaultEntry[]; error?: string | null; isLoading?: boolean; onAdd?(namespace: VaultNamespace): void; onBack(): void; onDelete?(entry: PersonalVaultEntry): Promise<void> | void; onEdit?(entry: PersonalVaultEntry): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function errorMessage(error: unknown): string { return error instanceof Error && error.message.trim() ? error.message : "Couldn’t delete the vault entry"; }

function PersonalVaultSettings({ entries = [], error, isLoading = false, onAdd, onBack, onDelete, onEdit }: PersonalVaultSettingsProps): unknown {
  const [deleteTarget, setDeleteTarget] = ReactRuntime.useState<PersonalVaultEntry | null>(null);
  const [deleting, setDeleting] = ReactRuntime.useState(false);
  const [operationError, setOperationError] = ReactRuntime.useState<string | null>(null);
  const ordered = [...entries].sort((left, right) => (left.envVar ?? left.name).localeCompare(right.envVar ?? right.name));
  const remove = async () => {
    if (deleteTarget == null || onDelete == null || deleting) return;
    setDeleting(true); setOperationError(null);
    try { await onDelete(deleteTarget); setDeleteTarget(null); }
    catch (reason) { setOperationError(errorMessage(reason)); }
    finally { setDeleting(false); }
  };
  return jsx().jsxs("section", { "data-personal-vault": true, children: [
    jsx().jsx("button", { type: "button", disabled: deleting, onClick: onBack, children: "Cloud environments" }),
    jsx().jsx("h1", { children: "Personal vault" }),
    jsx().jsx("p", { children: "Save environment variables and network secrets for cloud environments." }),
    jsx().jsx("button", { type: "button", disabled: deleting, onClick: () => onAdd?.("not_sensitive"), children: "Add environment variable" }),
    jsx().jsx("button", { type: "button", disabled: deleting, onClick: () => onAdd?.("sensitive"), children: "Add network secret" }),
    isLoading ? jsx().jsx("div", { role: "status", children: "Loading vault entries" }) : null,
    error ? jsx().jsx("div", { role: "alert", children: error }) : null,
    operationError ? jsx().jsx("div", { role: "alert", children: operationError }) : null,
    jsx().jsx("ul", { children: ordered.map(entry => jsx().jsxs("li", { "data-namespace": entry.namespace, children: [
      jsx().jsx("span", { children: entry.envVar ?? entry.name }),
      entry.targets?.length ? jsx().jsx("span", { children: entry.targets.join(", ") }) : null,
      jsx().jsx("button", { type: "button", disabled: deleting, onClick: () => onEdit?.(entry), children: "Edit" }),
      onDelete ? jsx().jsx("button", { type: "button", disabled: deleting, onClick: () => { setOperationError(null); setDeleteTarget(entry); }, children: "Delete" }) : null,
    ] }, `${entry.namespace}:${entry.id}`)) }),
    deleteTarget ? jsx().jsxs("div", { role: "alertdialog", "aria-label": "Delete vault entry?", children: [
      jsx().jsx("h2", { children: "Delete vault entry?" }),
      jsx().jsx("p", { children: `Delete ${deleteTarget.envVar ?? deleteTarget.name}? Cloud environments using it may stop working.` }),
      jsx().jsx("button", { type: "button", disabled: deleting, onClick: () => setDeleteTarget(null), children: "Cancel" }),
      jsx().jsx("button", { type: "button", disabled: deleting, onClick: () => void remove(), children: deleting ? "Deleting…" : "Delete" }),
    ] }) : null,
  ] });
}
export { PersonalVaultSettings };
