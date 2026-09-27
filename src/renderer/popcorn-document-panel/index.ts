import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/artifact-workbook-runtime";
import "@rchunk/artifact-presentation";
import "@rchunk/artifact-document-core";
import "@rchunk/popcorn-icons";
import "@rchunk/popcorn-chart-hover-tooltip";
import "@rchunk/artifact-source-bootstrap";
import "@rchunk/app-primary";
import "@rchunk/popcorn-manual-edit-header-controls";
import "@rchunk/text-underline-icon";
import "@rchunk/portable-thumbnail-font-face-source-runtime";
import "@rchunk/portable-thumbnail-font-runtime";
import "@rchunk/drawing-frame-geometry";
export interface DocumentPage { content?: string; id: string; title?: string }
export interface PopcornElectronDocumentPanelProps { annotationsEnabled?: boolean; artifactSearchEnabled?: boolean; className?: string; documentProtoVersion?: number; enablePageNavigation?: boolean; headerRightContent?: unknown; headerTitleContent?: unknown; initialPageIndex?: number; initialSourceBytes?: Uint8Array; initialSourceFormat?: string; initialZoom?: number; isEditing?: boolean; navigationTarget?: { pageNumber: number; requestId: string }; onImportError?(error: Error): void; onImportReady?(): void; pages?: readonly DocumentPage[]; renderHeader?(parts: Record<string, unknown>): unknown; renderHeaderZoomControl?(zoom: number): unknown; renderLayout?(parts: Record<string, unknown>): unknown; theme?: string; title?: string; zoomToFitLabel?: string }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function PopcornElectronDocumentPanel(props: PopcornElectronDocumentPanelProps): unknown { const pages = props.pages ?? []; const requestedPage = props.navigationTarget ? props.navigationTarget.pageNumber - 1 : props.initialPageIndex ?? 0; const pageIndex = Math.min(Math.max(0, requestedPage), Math.max(0, pages.length - 1)); const zoom = props.initialZoom ?? 1; props.onImportReady?.(); const zoomControl = props.renderHeaderZoomControl?.(zoom); const header = props.renderHeader?.({ title: props.title, zoom, zoomControl }) ?? jsx().jsxs("header", { children: [props.headerTitleContent ?? jsx().jsx("h1", { children: props.title ?? "Document" }), zoomControl, props.headerRightContent] }); const content = jsx().jsxs("main", { "data-page-index": pageIndex, "data-proto-version": props.documentProtoVersion ?? 0, "data-zoom": zoom, children: [pages.length ? jsx().jsx("article", { "data-page-id": pages[pageIndex]?.id, children: pages[pageIndex]?.content ?? pages[pageIndex]?.title }) : jsx().jsx("p", { children: "Empty document" }), props.enablePageNavigation && pages.length ? jsx().jsx("output", { children: `${pageIndex + 1} / ${pages.length}` }) : null] }); const panel = jsx().jsxs("section", { className: props.className, "data-codex-popcorn-editor": true, "data-testid": "popcorn-electron-document-panel", "data-theme": props.theme ?? "codex", "data-editing": props.isEditing ?? false, children: [header, content] }); return props.renderLayout?.({ content, header, panel }) ?? panel; }
export { PopcornElectronDocumentPanel };
