import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/popcorn-manual-edit-header-controls";
import "@rchunk/artifact-annotation-batch-controls";
import "@rchunk/popcorn-review-bar-overlay";
import "@rchunk/artifact-layout";
import "@rchunk/editor-header";
import "@rchunk/artifact-annotation-comment";
import "@rchunk/presentation-annotation-cursor-coachmark";
import "@rchunk/open-in-library-item";
import "@rchunk/header-content-fade";
import "@rchunk/artifact-originating-turn";
import "@rchunk/artifact-preview-header";
import "@rchunk/artifact-preview-status";
import "@rchunk/artifact-preview-zoom";
import "@rchunk/lazy-version-history";
import "@rchunk/artifact-preview-page-navigation";
import "@rchunk/annotation-comment-editor-card";
import "@rchunk/docx-preview-runtime";

export interface DocumentPreviewPage { alt?: string; id?: string | number; src?: string; text?: string }
export interface DocxPreviewPanelProps { currentPage?: number; error?: string | null; fileName?: string; isLoading?: boolean; libraryFileId?: string; onClose?(): void; onDownload?(): void; onOpenInLibrary?(libraryFileId: string): void; onPageChange?(page: number): void; onRetry?(): void; onZoomChange?(zoom: number): void; pages?: readonly DocumentPreviewPage[]; title?: string; zoom?: number }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function clampPage(page: number, total: number): number { return Math.min(Math.max(1, page), Math.max(1, total)); }
function DocxPreviewPanel(props: DocxPreviewPanelProps): unknown {
  const pages = props.pages ?? [];
  const currentPage = clampPage(props.currentPage ?? 1, pages.length);
  const zoom = props.zoom ?? 100;
  const page = pages[currentPage - 1];
  const setPage = (next: number) => props.onPageChange?.(clampPage(next, pages.length));
  return jsx().jsxs("section", { "data-docx-preview": true, style: { "--preview-zoom": `${zoom}%` }, children: [
    jsx().jsxs("header", { children: [jsx().jsx("h1", { children: props.title ?? props.fileName ?? "Document" }), props.libraryFileId && props.onOpenInLibrary ? jsx().jsx("button", { type: "button", onClick: () => props.onOpenInLibrary?.(props.libraryFileId!), children: "Open in library" }) : null, props.onDownload ? jsx().jsx("button", { type: "button", onClick: props.onDownload, children: "Download" }) : null, props.onClose ? jsx().jsx("button", { type: "button", onClick: props.onClose, children: "Close" }) : null] }),
    props.isLoading ? jsx().jsx("p", { role: "status", children: "Loading document…" }) : null,
    props.error ? jsx().jsxs("div", { role: "alert", children: [props.error, props.onRetry ? jsx().jsx("button", { type: "button", onClick: props.onRetry, children: "Retry" }) : null] }) : null,
    !props.isLoading && !props.error && pages.length === 0 ? jsx().jsx("p", { children: "No document preview is available." }) : null,
    page ? jsx().jsx("article", { "aria-label": `Page ${currentPage}`, "data-page-id": page.id, children: page.src ? jsx().jsx("img", { alt: page.alt ?? `Page ${currentPage}`, src: page.src }) : page.text }) : null,
    pages.length > 0 ? jsx().jsxs("footer", { children: [jsx().jsx("button", { disabled: currentPage <= 1, onClick: () => setPage(currentPage - 1), type: "button", children: "Previous" }), jsx().jsx("span", { "aria-live": "polite", children: `${currentPage} / ${pages.length}` }), jsx().jsx("button", { disabled: currentPage >= pages.length, onClick: () => setPage(currentPage + 1), type: "button", children: "Next" }), jsx().jsx("button", { onClick: () => props.onZoomChange?.(Math.max(25, zoom - 10)), type: "button", children: "Zoom out" }), jsx().jsx("output", { children: `${zoom}%` }), jsx().jsx("button", { onClick: () => props.onZoomChange?.(Math.min(400, zoom + 10)), type: "button", children: "Zoom in" })] }) : null,
  ] });
}
export { DocxPreviewPanel };
