import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/artifact-layout";
import "@rchunk/artifact-preview-header";
import "@rchunk/artifact-preview-status";

export interface NotebookCell { cellType?: "code" | "markdown" | "raw"; executionCount?: number | null; id?: string; outputs?: readonly unknown[]; source?: string | readonly string[] }
export interface NotebookPreviewPanelProps { cells?: readonly NotebookCell[]; error?: string | null; fileName?: string; isLoading?: boolean; onClose?(): void; onDownload?(): void; onRetry?(): void; title?: string }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function renderOutput(output: unknown): string { if (typeof output === "string") return output; try { return JSON.stringify(output, null, 2); } catch { return String(output); } }
function NotebookPreviewPanel(props: NotebookPreviewPanelProps): unknown {
  const title = props.title ?? props.fileName ?? "Notebook";
  return jsx().jsxs("section", { "data-notebook-preview": true, children: [
    jsx().jsxs("header", { children: [jsx().jsx("h1", { children: title }), props.onDownload ? jsx().jsx("button", { type: "button", onClick: props.onDownload, children: "Download" }) : null, props.onClose ? jsx().jsx("button", { type: "button", onClick: props.onClose, children: "Close" }) : null] }),
    props.isLoading ? jsx().jsx("p", { role: "status", children: "Loading notebook…" }) : null,
    props.error ? jsx().jsxs("div", { role: "alert", children: [props.error, props.onRetry ? jsx().jsx("button", { type: "button", onClick: props.onRetry, children: "Retry" }) : null] }) : null,
    !props.isLoading && !props.error && (props.cells?.length ?? 0) === 0 ? jsx().jsx("p", { children: "This notebook is empty." }) : null,
    jsx().jsx("ol", { children: (props.cells ?? []).map((cell, index) => { const source = Array.isArray(cell.source) ? cell.source.join("") : cell.source ?? ""; return jsx().jsxs("li", { "data-cell-type": cell.cellType ?? "code", children: [cell.cellType === "code" ? jsx().jsx("span", { "aria-label": "Execution count", children: cell.executionCount == null ? "[ ]" : `[${cell.executionCount}]` }) : null, jsx().jsx(cell.cellType === "markdown" ? "div" : "pre", { children: source }), (cell.outputs ?? []).map((output, outputIndex) => jsx().jsx("pre", { "data-notebook-output": true, children: renderOutput(output) }, outputIndex))] }, cell.id ?? index); }) }),
  ] });
}
export { NotebookPreviewPanel };
