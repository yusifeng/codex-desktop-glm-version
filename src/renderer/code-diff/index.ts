import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/codex-diff-css";
import "@rchunk/file-diff-alt";
import "@rchunk/full-content-metadata";
import "@rchunk/register-pierre-themes";
import "@rchunk/review-preferences-model";
import "@rchunk/undo";
import "@rchunk/code-diff-context-menu";

interface ParsedDiffFile { additions: number; deletions: number; hunks: string[]; path: string; status: "added" | "deleted" | "modified" | "renamed" }
interface CodeDiffProps { diff?: string; files?: ParsedDiffFile[]; viewType?: "split" | "unified"; onSelectFile?(path: string): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function parseDiff(diff: string): ParsedDiffFile[] { const files: ParsedDiffFile[] = []; let current: ParsedDiffFile | undefined; for (const line of diff.split(/\r?\n/)) { if (line.startsWith("diff --git ")) { const match = line.match(/^diff --git a\/(.+) b\/(.+)$/); current = { additions: 0, deletions: 0, hunks: [], path: match?.[2] ?? "unknown", status: "modified" }; files.push(current); } else if (current != null && line.startsWith("new file mode")) current.status = "added"; else if (current != null && line.startsWith("deleted file mode")) current.status = "deleted"; else if (current != null && line.startsWith("rename to ")) { current.status = "renamed"; current.path = line.slice(10); } else if (current != null && line.startsWith("@@")) current.hunks.push(line); else if (current != null && line.startsWith("+") && !line.startsWith("+++")) current.additions++; else if (current != null && line.startsWith("-") && !line.startsWith("---")) current.deletions++; } return files; }
function fileIcon(path: string): string { const extension = path.split(".").at(-1)?.toLowerCase() ?? ""; return ({ ts: "typescript", tsx: "react", js: "javascript", jsx: "react", py: "python", rs: "rust", md: "markdown", json: "json", yml: "yml", yaml: "yml" } as Record<string, string>)[extension] ?? "default"; }
function t({ diff = "", files = diff === "" ? [] : parseDiff(diff), viewType = "unified", onSelectFile }: CodeDiffProps): unknown { return jsx().jsx("section", { "aria-label": "Code changes", "data-view-type": viewType, children: files.map(file => jsx().jsxs("article", { "data-status": file.status, children: [jsx().jsx("button", { onClick: () => onSelectFile?.(file.path), type: "button", children: file.path }), jsx().jsx("span", { children: `+${file.additions} −${file.deletions}` }), jsx().jsx("pre", { children: file.hunks.join("\n") })] }, file.path)) }); }
const a = parseDiff;
const c = fileIcon;
const i = t;
const l = t;
function n(): void {}
function o(): void {}
function r(): void {}
function s(): void {}
function u(): void {}
export { a, c, i, l, n, o, r, s, t, u };
