import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/pdfjs-core";
import "@rchunk/tiny-invariant";
import "@rchunk/binary-preview-source";

interface PdfPreviewDiffProps { currentPage?: number; error?: string | null; isLoading?: boolean; leftLabel?: string; rightLabel?: string; totalPages?: number; onNextPage?(): void; onPreviousPage?(): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function PdfPreviewDiff({ currentPage = 1, error = null, isLoading = false, leftLabel = "Before", rightLabel = "After", totalPages = 1, onNextPage, onPreviousPage }: PdfPreviewDiffProps): unknown { if (isLoading) return jsx().jsx("div", { role: "status", children: "Loading PDF preview" }); if (error != null) return jsx().jsx("div", { role: "alert", children: error }); const page = Math.max(1, Math.min(currentPage, Math.max(1, totalPages))); return jsx().jsxs("section", { "aria-label": "PDF diff", children: [jsx().jsxs("div", { children: [jsx().jsx("figure", { children: leftLabel }), jsx().jsx("figure", { children: rightLabel })] }), jsx().jsxs("nav", { "aria-label": "PDF pages", children: [jsx().jsx("button", { disabled: page <= 1, onClick: onPreviousPage, type: "button", children: "Previous page" }), jsx().jsx("span", { children: `${page} / ${Math.max(1, totalPages)}` }), jsx().jsx("button", { disabled: page >= totalPages, onClick: onNextPage, type: "button", children: "Next page" })] })] }); }
export { PdfPreviewDiff };
