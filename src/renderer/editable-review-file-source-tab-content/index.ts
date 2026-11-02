import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/compact-empty-state";
import "@rchunk/review-file-source-item";
import "@rchunk/review-file-tree-side-pane";
import "@rchunk/text-file-editor-tab-content";

interface EditableReviewFileSourceTabContentProps { contents?: string | null; cwd?: string | null; environmentId?: string; error?: string | null; isActive?: boolean; isLoading?: boolean; path?: string | null; readOnly?: boolean; refresh?(): void; scope?: unknown; tabId?: string; workspaceRoot?: string | null; onChange?(contents: string): void; onOpenLocation?(scope: unknown, location: unknown): void; onSelectFile?(scope: unknown, path?: string): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function EditableReviewFileSourceTabContent(props: EditableReviewFileSourceTabContentProps): unknown {
  const { contents = null, cwd = null, error = null, isActive = true, isLoading = false, path = null, readOnly = false, tabId, workspaceRoot = null, onChange } = props;
  if (isLoading) return jsx().jsx("div", { role: "status", children: "Loading file" });
  if (error != null) return jsx().jsx("div", { role: "alert", children: error });
  if (path == null) {
    if (props.refresh != null) return jsx().jsxs("section", {
      children: [
        jsx().jsx("h2", { children: "Files unavailable" }),
        jsx().jsx("p", { children: "Files will be available when the environment is ready." }),
        jsx().jsx("button", { onClick: props.refresh, type: "button", children: "Refresh" }),
      ],
    });
    return jsx().jsx("div", { children: "Select a file to review" });
  }
  if (props.environmentId != null || props.scope != null) return jsx().jsxs("article", {
    "aria-label": path,
    "data-active": isActive,
    children: [
      jsx().jsx("header", { children: path }),
      jsx().jsx("pre", { "data-preview-kind": "text", children: contents ?? "" }),
      jsx().jsx("button", { onClick: props.refresh, type: "button", children: "Refresh" }),
    ],
  });
  return jsx().jsxs("section", {
    "aria-label": `Edit ${path}`,
    "data-active": isActive,
    "data-tab-id": tabId,
    children: [
      jsx().jsx("header", { children: workspaceRoot == null ? path : `${workspaceRoot.replace(/\/$/u, "")}/${path.replace(/^\//u, "")}` }),
      jsx().jsx("textarea", { "aria-label": "File contents", disabled: readOnly, value: contents ?? "", onChange: (event: { currentTarget: { value: string } }) => onChange?.(event.currentTarget.value) }),
      jsx().jsx("button", { onClick: () => props.onSelectFile?.(props.scope, path), type: "button", children: cwd == null ? "Reveal file" : `Reveal in ${cwd}` }),
    ],
  });
}
export { EditableReviewFileSourceTabContent };
