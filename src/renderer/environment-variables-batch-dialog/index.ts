import { I3 as getJsxRuntime, e6 as ReactRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import { n as parseEnvironmentEntries, r as EnvironmentEntryInput, type EnvironmentParseResult } from "@rchunk/environment-entry-input";
import { t as EnvironmentVariableRow, type EnvironmentVariable } from "@rchunk/environment-variable-row";

export interface EnvironmentVariablesBatchDialogProps { initialVariables: readonly EnvironmentVariable[]; unavailableNames: readonly string[]; hasConflict?: boolean; configuration?: unknown; onClose(): void; onSave(variables: EnvironmentVariable[]): void }
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }

function EnvironmentVariablesBatchDialog(props: EnvironmentVariablesBatchDialogProps): unknown {
  const runtime = ensureJsx();
  const [rows, setRows] = ReactRuntime.useState<EnvironmentVariable[]>(() => props.initialVariables.map(item => ({ ...item })));
  const [entryPending, setEntryPending] = ReactRuntime.useState(false);
  const duplicateNames = rows.filter((row, index) => rows.some((other, otherIndex) => index !== otherIndex && other.name === row.name)).map(row => row.name);
  const invalid = props.hasConflict === true || entryPending || rows.some(row => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(row.name));
  const importEntries = (source: string): EnvironmentParseResult => {
    const parsed = parseEnvironmentEntries(source, 256, [...props.unavailableNames, ...duplicateNames], rows.map(row => row.name));
    if (!parsed.ok) return parsed;
    const entries = new Map(parsed.entries);
    const next = rows.map(row => { const value = entries.get(row.name); entries.delete(row.name); return value === undefined ? row : { ...row, value }; });
    for (const [name, value] of entries) next.push({ name, value, optional: false });
    if (next.length > 256) return { ok: false, reason: "limit", line: 0 };
    setRows(next);
    return { ok: true, entries: new Map(next.map(row => [row.name, row.value])) };
  };
  return runtime.jsx("dialog", { open: true, className: "environment-variables-batch-dialog", children: runtime.jsxs("form", { onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); if (!invalid) props.onSave(rows); }, children: [runtime.jsx("h1", { children: "Manage environment variables" }), props.hasConflict ? runtime.jsx("p", { role: "alert", children: "This environment changed elsewhere. Close and reopen the editor to load the latest version." }) : null, runtime.jsx("div", { children: rows.map((row, index) => runtime.jsx(EnvironmentVariableRow, { variable: row, configuration: props.configuration, onChange: (value: EnvironmentVariable) => setRows(current => current.map((item, itemIndex) => itemIndex === index ? value : item)), onDelete: () => setRows(current => current.filter((_item, itemIndex) => itemIndex !== index)) }, `${index}:${row.name}`)) }), runtime.jsx(EnvironmentEntryInput, { limit: 256, entryCount: rows.length, onAddKey: (key: string) => setRows(current => current.length >= 256 ? current : [...current, { name: key, value: "", optional: false }]), onImport: importEntries, onPendingChange: setEntryPending }), runtime.jsxs("footer", { children: [runtime.jsx("button", { type: "button", onClick: props.onClose, children: "Cancel" }), runtime.jsx("button", { type: "submit", disabled: invalid, children: "Save" })] })] }) });
}

export { EnvironmentVariablesBatchDialog };
