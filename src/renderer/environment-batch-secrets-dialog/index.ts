import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import {
  n as parseEnvironmentEntries,
  r as EnvironmentEntryInput,
  type EnvironmentParseResult,
} from "@rchunk/environment-entry-input";
import {
  t as EnvironmentSecretRow,
  type EnvironmentSecret,
} from "@rchunk/environment-secret-row";
export interface EnvironmentBatchSecretsDialogProps {
  initialSecrets: readonly EnvironmentSecret[];
  hasConflict?: boolean;
  requireValues?: boolean;
  configuration?: unknown;
  onClose(): void;
  onLocalSave(secrets: EnvironmentSecret[]): void;
}
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime {
  if (jsx == null) jsx = getJsxRuntime();
  return jsx;
}
function EnvironmentBatchSecretsDialog(
  props: EnvironmentBatchSecretsDialogProps,
): unknown {
  const runtime = ensureJsx();
  let rows = props.initialSecrets.map((item) => ({ ...item })),
    nextId = Math.max(-1, ...rows.map((row) => row.id)) + 1,
    pending = false;
  const requireValues = props.requireValues ?? true;
  const importEntries = (source: string): EnvironmentParseResult => {
    const parsed = parseEnvironmentEntries(
      source,
      128,
      rows
        .filter((row, index) =>
          rows.some(
            (other, otherIndex) =>
              index !== otherIndex && other.name === row.name,
          ),
        )
        .map((row) => row.name),
      rows.map((row) => row.name),
    );
    if (!parsed.ok) return parsed;
    const entries = new Map(parsed.entries);
    rows = rows.map((row) => {
      const value = entries.get(row.name);
      entries.delete(row.name);
      return value === undefined ? row : { ...row, value };
    });
    for (const [name, value] of entries)
      rows.push({
        id: nextId++,
        name,
        value,
        source: "environment",
        injectionTarget: { type: "environment_variable", name },
      });
    return rows.length > 20
      ? { ok: false, reason: "limit", line: 0 }
      : {
          ok: true,
          entries: new Map(rows.map((row) => [row.name, row.value])),
        };
  };
  const valid = () =>
    rows.every(
      (row, index) =>
        /^[A-Za-z_][A-Za-z0-9_]*$/.test(row.name) &&
        (!requireValues || row.value.length > 0) &&
        !rows.some(
          (other, otherIndex) =>
            index !== otherIndex && other.name === row.name,
        ),
    );
  return runtime.jsx("dialog", {
    open: true,
    className: "environment-batch-secrets-dialog",
    children: runtime.jsxs("form", {
      onSubmit: (event: { preventDefault(): void }) => {
        event.preventDefault();
        if (!props.hasConflict && !pending && valid()) {
          props.onLocalSave(rows);
          props.onClose();
        }
      },
      children: [
        runtime.jsx("h1", { children: "Manage secrets" }),
        props.hasConflict
          ? runtime.jsx("p", {
              role: "alert",
              children:
                "This environment changed elsewhere. Close and reopen the editor to load the latest version.",
            })
          : null,
        runtime.jsx("div", {
          children: rows.map((row, index) =>
            runtime.jsx(
              EnvironmentSecretRow,
              {
                secret: row,
                secrets: rows,
                configuration: props.configuration,
                readOnly: row.requested,
                onChange: (value: EnvironmentSecret) => {
                  rows[index] = value;
                },
                onDelete: () => {
                  rows.splice(index, 1);
                },
              },
              row.id,
            ),
          ),
        }),
        runtime.jsx(EnvironmentEntryInput, {
          limit: 20,
          entryCount: rows.length,
          onAddKey: (key: string) => {
            rows.push({
              id: nextId++,
              name: key,
              value: "",
              source: "environment",
              injectionTarget: { type: "environment_variable", name: key },
            });
          },
          onImport: importEntries,
          onPendingChange: (value: boolean) => {
            pending = value;
          },
        }),
        runtime.jsxs("footer", {
          children: [
            runtime.jsx("button", {
              type: "button",
              onClick: props.onClose,
              children: "Cancel",
            }),
            runtime.jsx("button", { type: "submit", children: "Save" }),
          ],
        }),
      ],
    }),
  });
}
export { EnvironmentBatchSecretsDialog };
