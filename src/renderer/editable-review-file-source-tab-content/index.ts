import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/compact-empty-state";
import "@rchunk/review-file-source-item";
import "@rchunk/review-file-tree-side-pane";
import "@rchunk/text-file-editor-tab-content";

interface EditableReviewFileSourceTabContentProps { contents?: string | null; cwd?: string | null; error?: string | null; isActive?: boolean; isLoading?: boolean; path?: string | null; readOnly?: boolean; tabId?: string; workspaceRoot?: string | null; onChange?(contents: string): void; onSelectFile?(path: string): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function EditableReviewFileSourceTabContent({ contents = null, cwd = null, error = null, isActive = true, isLoading = false, path = null, readOnly = false, tabId, workspaceRoot = null, onChange, onSelectFile }: EditableReviewFileSourceTabContentProps): unknown { if (isLoading) return jsx().jsx("div", { role: "status", children: "Loading file" }); if (error != null) return jsx().jsx("div", { role: "alert", children: error }); if (path == null) return jsx().jsx("div", { children: "Select a file to review" }); return jsx().jsxs("section", { "aria-label": `Edit ${path}`, "data-active": isActive, "data-tab-id": tabId, children: [jsx().jsx("header", { children: workspaceRoot == null ? path : `${workspaceRoot}/${path}` }), jsx().jsx("textarea", { "aria-label": "File contents", disabled: readOnly, value: contents ?? "", onChange: (event: { currentTarget: { value: string } }) => onChange?.(event.currentTarget.value) }), jsx().jsx("button", { onClick: () => onSelectFile?.(path), type: "button", children: cwd == null ? "Reveal file" : `Reveal in ${cwd}` })] }); }
export { EditableReviewFileSourceTabContent };
