import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/filter-alt";
import "@rchunk/pull-request-actions";
import "@rchunk/pull-request-comment";
import "@rchunk/pull-request-detail-model";
import "@rchunk/pull-request-readonly-comment";
import "@rchunk/review-file-tree-pane";
import "@rchunk/review-preferences-model";
import "@rchunk/conversation-diff-comments";

interface ReviewFile { additions?: number; comments?: number; deletions?: number; generated?: boolean; path: string; status?: string }
interface ReviewFileTreeProps { activeFilePath?: string | null; autoFocusSearch?: boolean; files?: ReviewFile[]; onSelectFile?(path: string): void; root?: string; roots?: string[] }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function renderTree({ activeFilePath = null, autoFocusSearch = false, files = [], onSelectFile, root = "", roots = [] }: ReviewFileTreeProps): unknown { const visible = root === "" ? files : files.filter(file => file.path === root || file.path.startsWith(`${root}/`)); return jsx().jsxs("aside", { "aria-label": "Changed files", children: [roots.length > 1 ? jsx().jsx("select", { "aria-label": "Repository root", defaultValue: root, children: roots.map(value => jsx().jsx("option", { value, children: value }, value)) }) : null, jsx().jsx("input", { "aria-label": "Filter files", autoFocus: autoFocusSearch, type: "search" }), jsx().jsx("ul", { children: visible.map(file => jsx().jsx("li", { children: jsx().jsxs("button", { "aria-current": file.path === activeFilePath ? "page" : undefined, onClick: () => onSelectFile?.(file.path), type: "button", children: [file.path, file.generated ? " · generated" : "", file.comments == null ? "" : ` · ${file.comments} comments`] }) }, file.path)) })] }); }
function c(input: { comments?: unknown[]; path?: string }) { return { commentProps: { comments: input.comments ?? [], path: input.path ?? null } }; }
const a = renderTree;
const r = renderTree;
const t = renderTree;
function i(): void {}
function n(): void {}
function o(): void {}
function s(): void {}
export { a, c, i, n, o, r, s, t };
