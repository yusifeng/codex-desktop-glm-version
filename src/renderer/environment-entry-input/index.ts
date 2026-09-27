import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
export type EnvironmentParseFailure = {
  ok: false;
  reason: "duplicate" | "limit" | "malformed";
  line: number;
};
export type EnvironmentParseResult =
  { ok: true; entries: Map<string, string> } | EnvironmentParseFailure;
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime {
  if (jsx == null) jsx = getJsxRuntime();
  return jsx;
}
function EnvironmentConflictMessage(): unknown {
  return ensureJsx().jsx("p", {
    className: "environment-conflict-message",
    role: "alert",
    children:
      "This environment changed elsewhere. Close and reopen the editor to load the latest version, then re-enter your edits",
  });
}
function parseEnvironmentEntries(
  source: string,
  maxKeyLength: number,
  unavailableNames: readonly string[] = [],
  existingNames: readonly string[] = [],
): EnvironmentParseResult {
  const trimmed = source.trim(),
    isKey = /^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed);
  if (
    isKey &&
    (existingNames.includes(trimmed) || unavailableNames.includes(trimmed))
  )
    return { ok: false, reason: "duplicate", line: 1 };
  const lines = (isKey ? `${trimmed}=` : source).split(/\r?\n/),
    entries = new Map<string, string>();
  for (let index = 0; index < lines.length; index++) {
    let line = lines[index].trim(),
      lineNumber = index + 1;
    if (!line || line.startsWith("#") || line.startsWith(";")) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/.exec(line);
    if (!match || match[1].length > maxKeyLength)
      return { ok: false, reason: "malformed", line: lineNumber };
    const key = match[1];
    if (entries.has(key) || unavailableNames.includes(key))
      return { ok: false, reason: "duplicate", line: lineNumber };
    let value = match[2].trim(),
      quote = value[0];
    if (quote === '"' || quote === "'") {
      let cursor = 1;
      for (; ; cursor++) {
        if (cursor >= value.length) {
          index++;
          if (index >= lines.length)
            return { ok: false, reason: "malformed", line: lineNumber };
          value += `\n${lines[index]}`;
        }
        if (value[cursor] === "\\" && quote === '"') cursor++;
        else if (value[cursor] === quote) break;
      }
      const suffix = value.slice(cursor + 1).trim();
      if (suffix && !suffix.startsWith("#"))
        return { ok: false, reason: "malformed", line: lineNumber };
      value = value.slice(1, cursor);
    } else value = value.replace(/\s+#.*$/, "").trim();
    entries.set(key, value);
  }
  return { ok: true, entries };
}
export interface EnvironmentEntryInputProps {
  limit: number;
  entryCount: number;
  onAddKey(
    key: string,
    restoreFocus: (element?: { focus?(): void } | null) => void,
  ): void;
  onImport(source: string): EnvironmentParseResult;
  onPendingChange(pending: boolean): void;
}
function EnvironmentEntryInput(props: EnvironmentEntryInputProps): unknown {
  const runtime = ensureJsx();
  let value = "",
    error: EnvironmentParseFailure | null = null;
  const consume = (source: string) => {
    const result = props.onImport(source);
    if ("entries" in result) {
      error = null;
      value = "";
    } else {
      error = result;
    }
    props.onPendingChange(!result.ok && source.trim().length > 0);
    return result;
  };
  return runtime.jsxs("div", {
    className: "environment-entry-input",
    children: [
      runtime.jsx("textarea", {
        "aria-label": "Paste .env or type a key",
        placeholder: "Paste your .env or type a key",
        onChange: (event: { currentTarget: { value: string } }) => {
          value = event.currentTarget.value;
          props.onPendingChange(value.trim().length > 0);
        },
        onKeyDown: (event: {
          key: string;
          shiftKey?: boolean;
          preventDefault(): void;
          stopPropagation(): void;
        }) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.stopPropagation();
            if (
              value &&
              !/[=\r\n]/.test(value) &&
              props.entryCount < props.limit
            ) {
              props.onAddKey(value, () => {});
              value = "";
              props.onPendingChange(false);
            } else consume(value);
          }
        },
      }),
      error
        ? runtime.jsx("p", {
            role: "alert",
            children:
              error.reason === "limit"
                ? `You can add up to ${props.limit} entries; nothing was imported`
                : `Line ${error.line} is invalid or repeats an unavailable key; nothing was imported.`,
          })
        : null,
    ],
  });
}
const initializeConflictMessage = (): void => {
    jsx = getJsxRuntime();
  },
  initializeEnvironmentEntryInput = (): void => {
    jsx = getJsxRuntime();
  },
  initializeNoop = (): void => {};
export {
  EnvironmentConflictMessage as a,
  initializeEnvironmentEntryInput as i,
  parseEnvironmentEntries as n,
  initializeConflictMessage as o,
  EnvironmentEntryInput as r,
  initializeNoop as t,
};
