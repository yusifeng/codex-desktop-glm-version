import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime, type JsxRuntime } from "@rchunk/app-shared";
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
export interface PopcornDocumentController { getPageIndex(): number; getZoom(): number; goToPage(index: number): void; setZoom(zoom: number): void }
export interface PopcornElectronDocumentPanelProps {
  annotationsEnabled?: boolean;
  artifactSearchEnabled?: boolean;
  className?: string;
  documentProtoVersion?: number;
  enablePageNavigation?: boolean;
  headerRightContent?: unknown;
  headerTitleContent?: unknown;
  initialPageIndex?: number;
  initialSourceBytes?: Uint8Array;
  initialSourceFormat?: string;
  initialZoom?: number;
  isEditing?: boolean;
  navigationTarget?: { pageNumber: number; requestId: string };
  onControllerReady?(controller: PopcornDocumentController): void;
  onImportError?(error: Error): void;
  onImportReady?(): void;
  onInteractionAttempt?(): void;
  pages?: readonly DocumentPage[];
  renderHeader?(parts: Record<string, unknown>): unknown;
  renderHeaderZoomControl?(zoom: number): unknown;
  renderLayout?(parts: Record<string, unknown>): unknown;
  theme?: string;
  title?: string;
  zoomToFitLabel?: string;
}

let runtime: JsxRuntime | undefined;
let React: ReturnType<typeof getReactRuntime> | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function react(): ReturnType<typeof getReactRuntime> { React ??= getReactRuntime(); return React; }
function clampPage(index: number, count: number): number { return Math.min(Math.max(0, index), Math.max(0, count - 1)); }
function clampZoom(value: number): number { return Number.isFinite(value) ? Math.min(4, Math.max(0.25, value)) : 1; }
function validateSource(bytes?: Uint8Array, format?: string): void {
  if (bytes != null && bytes.byteLength === 0) throw new Error("Document source is empty");
  if (format != null && !["doc", "docx", "odt", "pdf", "txt"].includes(format.toLowerCase())) throw new Error(`Unsupported document format: ${format}`);
}

function PopcornElectronDocumentPanel(props: PopcornElectronDocumentPanelProps): unknown {
  const R = react();
  const requestedPage = props.navigationTarget ? props.navigationTarget.pageNumber - 1 : props.initialPageIndex ?? 0;
  const [pageIndex, setPageIndex] = R.useState(() => clampPage(requestedPage, props.pages?.length ?? 0));
  const [zoom, setZoom] = R.useState(() => clampZoom(props.initialZoom ?? 1));
  const state = R.useRef({ pageIndex, zoom });
  state.current = { pageIndex, zoom };
  const controllerRef = R.useRef<PopcornDocumentController | null>(null);
  controllerRef.current ??= {
    getPageIndex: () => state.current.pageIndex,
    getZoom: () => state.current.zoom,
    goToPage(index) {
      const next = clampPage(index, props.pages?.length ?? 0);
      if (next === state.current.pageIndex) return;
      state.current.pageIndex = next;
      setPageIndex(next);
      props.onInteractionAttempt?.();
    },
    setZoom(value) {
      const next = clampZoom(value);
      if (next === state.current.zoom) return;
      state.current.zoom = next;
      setZoom(next);
      props.onInteractionAttempt?.();
    },
  };
  R.useEffect(() => {
    try { validateSource(props.initialSourceBytes, props.initialSourceFormat); props.onImportReady?.(); }
    catch (error) { props.onImportError?.(error instanceof Error ? error : new Error(String(error))); }
  }, [props.initialSourceBytes, props.initialSourceFormat, props.onImportError, props.onImportReady]);
  R.useEffect(() => { props.onControllerReady?.(controllerRef.current!); }, [props.onControllerReady]);
  R.useEffect(() => {
    if (props.navigationTarget == null) return;
    const next = clampPage(props.navigationTarget.pageNumber - 1, props.pages?.length ?? 0);
    state.current.pageIndex = next;
    setPageIndex(next);
  }, [props.navigationTarget?.requestId, props.navigationTarget?.pageNumber, props.pages]);
  const controller = controllerRef.current;
  const zoomControl = props.renderHeaderZoomControl?.(zoom);
  const header = props.renderHeader?.({ controller, title: props.title, zoom, zoomControl }) ?? jsx().jsxs("header", { children: [props.headerTitleContent ?? jsx().jsx("h1", { children: props.title ?? "Document" }), zoomControl, props.headerRightContent] });
  const page = props.pages?.[pageIndex];
  const content = jsx().jsxs("main", { "data-page-index": pageIndex, "data-proto-version": props.documentProtoVersion ?? 0, "data-zoom": zoom, children: [
    page == null ? jsx().jsx("p", { children: "Empty document" }) : jsx().jsx("article", { "data-page-id": page.id, children: page.content ?? page.title }),
    props.enablePageNavigation && props.pages?.length ? jsx().jsxs("nav", { "aria-label": "Document pages", children: [
      jsx().jsx("button", { disabled: pageIndex === 0, onClick: () => controller.goToPage(pageIndex - 1), type: "button", children: "Previous" }),
      jsx().jsx("output", { children: `${pageIndex + 1} / ${props.pages.length}` }),
      jsx().jsx("button", { disabled: pageIndex >= props.pages.length - 1, onClick: () => controller.goToPage(pageIndex + 1), type: "button", children: "Next" }),
    ] }) : null,
  ] });
  const panel = jsx().jsxs("section", { className: props.className, "data-codex-popcorn-editor": true, "data-testid": "popcorn-electron-document-panel", "data-theme": props.theme ?? "codex", "data-editing": props.isEditing ?? false, "data-annotations-enabled": props.annotationsEnabled ?? false, "data-search-enabled": props.artifactSearchEnabled ?? false, children: [header, content] });
  return props.renderLayout?.({ content, controller, header, panel }) ?? panel;
}

export { PopcornElectronDocumentPanel };
