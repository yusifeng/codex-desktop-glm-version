import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/review-preferences-model";
import "@rchunk/pull-request-readonly-comment";
import "@rchunk/pull-request-actions";
import "@rchunk/pull-request-comment";
import "@rchunk/pull-request-detail-model";
import "@rchunk/conversation-diff-comments";
import "@rchunk/review-file-tree-pane";
import "@rchunk/filter-alt";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";

type Node = unknown;
export interface ReviewFile { additions?: number; comments?: number; deletions?: number; generated?: boolean; path: string; status?: string }
export interface FileTreeProps { activeFilePath?: string | null; autoFocusSearch?: boolean; files?: ReviewFile[] | null; includeHidden?: boolean; isLoading?: boolean; onOpenFile?(path: string): void; onSelectFile?(path: string, options?: { preview?: boolean }): void; query?: string; reserveBottomPadding?: boolean; root?: string; }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function normalizeFiles(files: readonly ReviewFile[]): ReviewFile[] { const unique = new Map<string, ReviewFile>(); for (const file of files) if (!unique.has(file.path)) unique.set(file.path, file); return [...unique.values()].sort((left, right) => left.path.localeCompare(right.path)); }
function filterFiles(files: readonly ReviewFile[], query: string, includeHidden = false): ReviewFile[] { const normalized = query.trim().toLocaleLowerCase(); return normalizeFiles(files).filter(file => (includeHidden || !file.path.split("/").some(part => part.startsWith("."))) && (normalized === "" || file.path.toLocaleLowerCase().includes(normalized))); }
function buildCommentProps(input: { comments?: unknown[]; enableComments?: boolean; modelComments?: unknown[]; onCommentsChange?(comments: unknown[]): void; readonlyComments?: unknown[] }): { commentProps: Record<string, unknown> } { return { commentProps: { enableComments: input.enableComments ?? true, comments: input.comments ?? [], modelComments: input.modelComments ?? [], onCommentsChange: input.onCommentsChange, readonlyComments: input.readonlyComments } }; }
function CommentBadge({ children, isActive }: { children?: Node; isActive?: boolean }): Node { return jsx().jsxs("span", { children: [children, isActive ? jsx().jsx("span", { "aria-label": "1 comment", children: "1" }) : null] }); }
function FolderIcon(props: Record<string, unknown>): Node { return jsx().jsx("svg", { viewBox: "0 0 20 20", "aria-hidden": true, ...props, children: jsx().jsx("path", { d: "M2 6h6l2 2h8v8H2z" }) }); }
function ReviewFileTree({ activeFilePath, autoFocusSearch, files = [], includeHidden = false, isLoading = false, onOpenFile, onSelectFile, query = "", reserveBottomPadding = false }: FileTreeProps): Node { const visible = filterFiles(files ?? [], query, includeHidden); if (isLoading && visible.length === 0) return jsx().jsx("p", { role: "status", children: "Loading directory entries…" }); return jsx().jsxs("section", { "data-reserve-bottom-padding": reserveBottomPadding || undefined, children: [jsx().jsx("input", { type: "search", autoFocus: autoFocusSearch, value: query, readOnly: true, placeholder: "Search files" }), visible.length === 0 ? jsx().jsx("p", { role: "status", children: query.trim() === "" ? "No files in this folder" : "No matching files" }) : jsx().jsx("ul", { children: visible.map(file => jsx().jsx("li", { children: jsx().jsxs("button", { type: "button", "aria-current": file.path === activeFilePath ? "page" : undefined, onClick: () => onSelectFile?.(file.path, { preview: true }), onDoubleClick: () => onOpenFile?.(file.path), children: [file.path, file.comments ? jsx().jsx("span", { "aria-label": `${file.comments} comments`, children: file.comments }) : null, file.additions == null ? null : jsx().jsx("span", { children: `+${file.additions}` }), file.deletions == null ? null : jsx().jsx("span", { children: `-${file.deletions}` })] }) }, file.path)) })] }); }
function initializeCommentProps(): void {} function initializeCommentBadge(): void {} function initializeFolderIcon(): void {} function initializeReviewFileTree(): void {}
export { FolderIcon as a, buildCommentProps as c, initializeCommentBadge as i, initializeReviewFileTree as n, initializeFolderIcon as o, CommentBadge as r, initializeCommentProps as s, ReviewFileTree as t };
