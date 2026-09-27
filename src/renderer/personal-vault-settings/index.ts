import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/security-tabs";
import "@rchunk/toolbar-breadcrumb";
import "@rchunk/entry-type";
import "@rchunk/personal-secret-dialog";

export type VaultNamespace = "not_sensitive" | "sensitive";
export interface PersonalVaultEntry { envVar?: string | null; id: string; name: string; namespace: VaultNamespace; targets?: string[] }
export interface PersonalVaultSettingsProps { entries?: readonly PersonalVaultEntry[]; error?: string | null; isLoading?: boolean; onAdd?(namespace: VaultNamespace): void; onBack(): void; onDelete?(entry: PersonalVaultEntry): void; onEdit?(entry: PersonalVaultEntry): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function PersonalVaultSettings({ entries = [], error, isLoading = false, onAdd, onBack, onDelete, onEdit }: PersonalVaultSettingsProps): unknown {
  const ordered = [...entries].sort((left, right) => (left.envVar ?? left.name).localeCompare(right.envVar ?? right.name));
  return jsx().jsxs("section", { "data-personal-vault": true, children: [
    jsx().jsx("button", { type: "button", onClick: onBack, children: "Cloud environments" }),
    jsx().jsx("h1", { children: "Personal vault" }),
    jsx().jsx("p", { children: "Save environment variables and network secrets for cloud environments." }),
    jsx().jsx("button", { type: "button", onClick: () => onAdd?.("not_sensitive"), children: "Add" }),
    isLoading ? jsx().jsx("div", { role: "status", children: "Loading vault entries" }) : null,
    error ? jsx().jsx("div", { role: "alert", children: error }) : null,
    jsx().jsx("ul", { children: ordered.map(entry => jsx().jsxs("li", { "data-namespace": entry.namespace, children: [
      jsx().jsx("span", { children: entry.envVar ?? entry.name }),
      entry.targets?.length ? jsx().jsx("span", { children: entry.targets.join(", ") }) : null,
      jsx().jsx("button", { type: "button", onClick: () => onEdit?.(entry), children: "Edit" }),
      jsx().jsx("button", { type: "button", onClick: () => onDelete?.(entry), children: "Delete" }),
    ] }, `${entry.namespace}:${entry.id}`)) }),
  ] });
}
export { PersonalVaultSettings };
