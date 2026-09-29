import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as openInLibraryChunk from "@rchunk/open-in-library-item";
import * as previewHeaderChunk from "@rchunk/artifact-preview-header";
import * as rowChunk from "@rchunk/row";
import * as zoomChunk from "@rchunk/artifact-preview-zoom";
import * as composerOverlayChunk from "@rchunk/right-panel-composer-overlay";
import * as favoriteChunk from "@rchunk/chatgpt-generated-image-favorite";
import * as drawingSizeChunk from "@rchunk/drawing-size-slider";
import * as editSizeChunk from "@rchunk/image-edit-size-control";

type StateUpdater<Value> = Value | ((current: Value) => Value);
interface MutableRef<Value> { current: Value }
interface JsxRuntime { Fragment: unknown; jsx(type: unknown, props: object, key?: string): unknown; jsxs(type: unknown, props: object, key?: string): unknown }
interface ReactRuntime { createContext<Value>(defaultValue: Value): unknown; useCallback<Callback extends (...arguments_: never[]) => unknown>(callback: Callback, dependencies: readonly unknown[]): Callback; useContext<Value>(context: unknown): Value; useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void; useImperativeHandle<Value>(ref: unknown, create: () => Value): void; useRef<Value>(initialValue: Value): MutableRef<Value>; useState<Value>(initialValue: Value | (() => Value)): [Value, (next: StateUpdater<Value>) => void] }
interface IntlShape { formatMessage(descriptor: Record<string, unknown>, values?: Record<string, unknown>): string }
interface ImageComment { id?: string; text: string; x: number; y: number }
interface ImageDescriptor { alt: string; height?: number; id: string; isAnimated?: boolean; loading?: boolean; previewSrc?: string; referrerPolicy?: string; src: string; width?: number }
interface ViewportPointEvent { clientX: number; clientY: number; currentTarget: { getBoundingClientRect(): { height: number; left: number; top: number; width: number } }; preventDefault?(): void }
interface ZoomController { handleClickCapture(event: { preventDefault(): void; stopPropagation(): void; timeStamp: number }): void; handlePointerMoveCapture(event: { clientX: number; clientY: number; pointerType?: string }): void; setScrollContainerRef(element: ScrollContainer | null): void; setZoomAtViewportCenter(percent: number): void; zoomTargetRef: MutableRef<{ getBoundingClientRect(): { height: number; left: number; top: number; width: number }; isConnected?: boolean } | null> }
interface ScrollContainer { scrollLeft: number; scrollTop: number; getBoundingClientRect(): { height: number; left: number; top: number; width: number }; addEventListener(type: string, listener: (event: unknown) => void, options?: object): void; removeEventListener(type: string, listener: (event: unknown) => void): void }
interface ViewportState { imageRect: { height: number; left: number; top: number; width: number }; isInteracting?: boolean; isPanReady?: boolean }
interface PanoramaRendererModule { Viewer?: unknown }

const shared = appSharedChunk as unknown as { $3?: () => void; BX?: <Value>(signal: unknown, key?: unknown) => Value; C_?: unknown; FX?: () => void; HX?: <Value>(signal: unknown) => Value; I3: () => JsxRuntime; K2?: () => void; LX?: (scope: unknown) => unknown; QI?: () => void; Y2?: unknown; Yh?: unknown; ZI?: unknown; Zh?: () => void; __?: <Callback extends (...arguments_: never[]) => unknown>(callback: Callback) => Callback; b_?: (value: number, scale: number) => number; e6: () => ReactRuntime; h4?: () => void; lk?: () => void; lw?: () => void; m4?: (...values: Array<string | false | null | undefined>) => string; n4: () => IntlShape; wL?: () => void; x_?: () => number; y_?: () => void };
const initial = appInitialChunk as unknown as { ifn?: () => void; ofn?: (flag: string) => boolean; uHt?: () => void; ypn?: () => void };
const primary = appPrimaryChunk as unknown as { Fr?: () => void; Jr?: { flushSync(callback: () => void): void }; Pr?: () => void; Qr?: () => void; Zr?: () => void };
const openInLibrary = openInLibraryChunk as unknown as { n?: () => void; t?: unknown };
const previewHeader = previewHeaderChunk as unknown as { n?: () => void; r?: unknown };
const row = rowChunk as unknown as { n?: () => void; t?: unknown };
const zoom = zoomChunk as unknown as { a?: () => void; c?: (value: number) => number; i?: () => void; o?: (input: { initialDistance: number; initialZoomPercent: number; nextDistance: number }) => number; r?: (percent: number, deltaY: number) => number };
const composerOverlay = composerOverlayChunk as unknown as { n?: () => void; t?: unknown };
const favorite = favoriteChunk as unknown as { a?: () => void; i?: () => void; n?: () => void; r?: unknown };
const drawingSize = drawingSizeChunk as unknown as { n?: () => void; t?: unknown };
const editSize = editSizeChunk as unknown as { n?: () => void; t?: unknown };
const { $3: initializeSharedRuntime, FX: initializeSharedFeatures, I3: getJsxRuntime, K2: initializeReactCompilerRuntime, QI: initializeSharedState, Zh: initializeIcons, b_: scalePixel, e6: getReactRuntime, h4: initializeSharedEditor, lk: initializePersistence, lw: initializeAnalytics, m4: classNames, n4: useIntl, wL: initializeSharedLinks, y_: initializeTheme } = shared;
const { ifn: initializeInitialFlags, uHt: initializeInitialApi, ypn: initializeInitialTracking } = initial;
const { Jr: reactDom, Pr: initializePrimaryPreview, Qr: initializePrimaryImage, Zr: initializePrimaryComposer } = primary;
const { n: initializeOpenInLibrary, t: OpenInLibraryItem } = openInLibrary;
const { n: initializePreviewHeader, r: ArtifactPreviewHeader } = previewHeader;
const { n: initializeRow, t: Row } = row;
const { a: initializeZoomMath, c: clampZoom, i: initializeZoomState, o: calculatePinchZoom, r: calculateWheelZoom } = zoom;
const { n: initializeComposerOverlay, t: RightPanelComposerOverlay } = composerOverlay;
const { a: initializeFavoriteState, i: initializeFavoriteQueries, n: initializeFavorite, r: GeneratedImageFavorite } = favorite;
const { n: initializeDrawingSize, t: DrawingSizeSlider } = drawingSize;
const { n: initializeEditSize, t: ImageEditSizeControl } = editSize;

let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;
function loadPanoramaRenderer(): Promise<PanoramaRendererModule> { return import("@rchunk/panorama-renderer"); }
function initializeImageSidePanel(): void {
  if (initialized) return;
  initializeSharedRuntime?.(); initializeSharedFeatures?.(); React = getReactRuntime(); initializeReactCompilerRuntime?.(); initializeSharedState?.(); initializeSharedEditor?.(); initializePersistence?.(); initializeAnalytics?.(); initializeSharedLinks?.(); initializeTheme?.(); initializeIcons?.();
  initializeInitialApi?.(); initializeInitialFlags?.(); initializeInitialTracking?.(); initializePrimaryPreview?.(); initializePrimaryImage?.(); initializePrimaryComposer?.(); initializeOpenInLibrary?.(); initializePreviewHeader?.(); initializeRow?.(); initializeZoomMath?.(); initializeZoomState?.(); initializeComposerOverlay?.(); initializeFavoriteState?.(); initializeFavoriteQueries?.(); initializeFavorite?.(); initializeDrawingSize?.(); initializeEditSize?.();
  jsx = getJsxRuntime(); initialized = true;
}

function normalizedPoint(event: ViewportPointEvent): { x: number; y: number } | null {
  const rectangle = event.currentTarget.getBoundingClientRect();
  return rectangle.width <= 0 || rectangle.height <= 0 ? null : { x: (event.clientX - rectangle.left) / rectangle.width, y: (event.clientY - rectangle.top) / rectangle.height };
}
function commentEditorStyle(point: { x: number; y: number }, editing: boolean): { height: number; left: string; top: string; width: number } { return { height: editing ? 120 : 44, left: `${Math.min(90, Math.max(10, point.x * 100))}%`, top: `${Math.min(90, Math.max(10, point.y * 100))}%`, width: 294 }; }

function ImageCommentSurface({ alt, comments, imageRef, isDraftActive = true, isFullscreen = false, layout = "panel", onDraftActiveChange, onDeleteComment, onSubmitComment, referrerPolicy, src, viewport }: { alt: string; comments: ImageComment[]; imageRef?: unknown; isDraftActive?: boolean; isFullscreen?: boolean; layout?: "panel" | "playground"; onDraftActiveChange?(active: boolean): void; onDeleteComment(id: string): void; onSubmitComment(comment: ImageComment): void; referrerPolicy?: string; src: string; viewport?: ViewportState }): unknown {
  initializeImageSidePanel();
  const intl = useIntl();
  const [draft, setDraft] = React.useState<ImageComment | null>(null);
  const [body, setBody] = React.useState("");
  const closeDraft = (): void => { setDraft(null); setBody(""); onDraftActiveChange?.(false); };
  const createDraft = (event: ViewportPointEvent): void => { const point = normalizedPoint(event); if (point == null || viewport?.isInteracting || viewport?.isPanReady) return; setDraft({ id: undefined, text: "", ...point }); setBody(""); onDraftActiveChange?.(true); };
  const submit = (): void => { const text = body.trim(); if (draft == null || text.length === 0) return; onSubmitComment({ ...draft, text }); closeDraft(); };
  const markers = comments.map((comment, index) => jsx.jsx("button", { "aria-label": intl.formatMessage({ id: "imageSidePanel.editComment", defaultMessage: `Edit comment ${index + 1}` }), "data-image-comment-marker": true, style: { left: `${comment.x * 100}%`, top: `${comment.y * 100}%` }, type: "button", onClick: () => { setDraft(comment); setBody(comment.text); onDraftActiveChange?.(true); }, children: index + 1 }, comment.id ?? String(index)));
  const editor = isDraftActive && draft != null ? jsx.jsxs("div", { "data-annotation-control": true, style: commentEditorStyle(draft, draft.id != null), children: [jsx.jsx("textarea", { autoFocus: true, "aria-label": intl.formatMessage({ id: "imageSidePanel.addComment", defaultMessage: "Add comment" }), value: body, onChange: (event: { currentTarget: { value: string } }) => setBody(event.currentTarget.value), onKeyDown: (event: { ctrlKey?: boolean; key: string; metaKey?: boolean; preventDefault(): void }) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); submit(); } } }), draft.id == null ? null : jsx.jsx("button", { type: "button", onClick: () => { if (draft.id != null) onDeleteComment(draft.id); closeDraft(); }, children: "Delete" }), jsx.jsx("button", { type: "button", onClick: closeDraft, children: "Cancel" }), jsx.jsx("button", { disabled: body.trim().length === 0, type: "button", onClick: submit, children: draft.id == null ? "Add comment" : "Save" })] }) : null;
  return jsx.jsxs("div", { className: classNames?.(viewport == null ? "relative" : "absolute inset-0", layout === "panel" ? "image-comment-panel" : "image-comment-playground") ?? "relative", onKeyDownCapture: (event: { key: string; preventDefault(): void }) => { if (event.key === "Escape" && draft != null) { event.preventDefault(); closeDraft(); } }, children: [viewport == null ? jsx.jsx("img", { alt, className: isFullscreen ? "max-w-full" : "max-w-full rounded-xl", ref: imageRef, referrerPolicy, src }) : null, jsx.jsx("button", { type: "button", "data-sketch-comment": viewport == null ? undefined : "", "aria-label": layout === "playground" ? `Comment on ${alt}` : "Image comment surface", className: "absolute inset-0", onClick: createDraft }), ...markers, editor] });
}

function ImageCommentToolbar({ ariaLabel, commentCount, emptyMessage, isSubmitting = false, onCancel, onSubmit, variant = "compact" }: { ariaLabel: string; commentCount: number; emptyMessage: unknown; isSubmitting?: boolean; onCancel(): void; onSubmit?(): void; variant?: "compact" | "embedded" }): unknown {
  initializeImageSidePanel();
  const label = commentCount === 0 ? emptyMessage : `${commentCount} ${commentCount === 1 ? "comment" : "comments"}`;
  return jsx.jsxs(Row ?? "div", { ariaLabel, variant, children: [jsx.jsx("span", { children: label }), jsx.jsx("button", { disabled: commentCount === 0 || isSubmitting, type: "button", onClick: onSubmit, children: isSubmitting ? "Sending…" : "Send" }), jsx.jsx("button", { disabled: isSubmitting, type: "button", onClick: onCancel, children: "Cancel" })] });
}

function useImageZoomController({ onZoomPercentChange, viewportCenterInlineOffset = 0, zoomPercent }: { onZoomPercentChange(percent: number): void; viewportCenterInlineOffset?: number; zoomPercent: number }): ZoomController {
  initializeImageSidePanel();
  const scrollContainer = React.useRef<ScrollContainer | null>(null);
  const zoomTargetRef = React.useRef<{ getBoundingClientRect(): { height: number; left: number; top: number; width: number }; isConnected?: boolean } | null>(null);
  const lastPointer = React.useRef<{ clientX: number; clientY: number } | null>(null);
  const zoomAt = React.useCallback((percent: number, point: { clientX: number; clientY: number }): void => {
    const container = scrollContainer.current; const target = zoomTargetRef.current;
    if (container == null || target == null) { onZoomPercentChange(percent); return; }
    const before = target.getBoundingClientRect(); const x = before.width > 0 ? Math.min(1, Math.max(0, (point.clientX - before.left) / before.width)) : 0.5; const y = before.height > 0 ? Math.min(1, Math.max(0, (point.clientY - before.top) / before.height)) : 0.5;
    (reactDom?.flushSync ?? ((callback: () => void) => callback()))(() => onZoomPercentChange(percent));
    if (target.isConnected === false) return; const after = target.getBoundingClientRect(); container.scrollLeft += scalePixel?.(after.left + after.width * x - point.clientX, 1) ?? after.left + after.width * x - point.clientX; container.scrollTop += scalePixel?.(after.top + after.height * y - point.clientY, 1) ?? after.top + after.height * y - point.clientY;
  }, [onZoomPercentChange]);
  const viewportCenter = (container: ScrollContainer): { clientX: number; clientY: number } => { const rectangle = container.getBoundingClientRect(); return { clientX: rectangle.left + rectangle.width / 2 + viewportCenterInlineOffset, clientY: rectangle.top + rectangle.height / 2 }; };
  const wheel = (raw: unknown): void => { const event = raw as { clientX: number; clientY: number; ctrlKey?: boolean; deltaY: number; preventDefault(): void; stopPropagation(): void }; if (!event.ctrlKey) return; event.preventDefault(); event.stopPropagation(); const next = calculateWheelZoom?.(zoomPercent, event.deltaY) ?? Math.min(500, Math.max(25, zoomPercent - Math.sign(event.deltaY) * 25)); if (next !== zoomPercent) zoomAt(next, event.clientX === 0 && event.clientY === 0 ? lastPointer.current ?? viewportCenter(scrollContainer.current as ScrollContainer) : event); };
  const setScrollContainerRef = (element: ScrollContainer | null): void => { const previous = scrollContainer.current; if (previous != null) previous.removeEventListener("wheel", wheel); scrollContainer.current = element; if (element != null) element.addEventListener("wheel", wheel, { passive: false }); };
  return { zoomTargetRef, handleClickCapture: () => {}, handlePointerMoveCapture: event => { lastPointer.current = { clientX: event.clientX, clientY: event.clientY }; }, setScrollContainerRef, setZoomAtViewportCenter: percent => { const container = scrollContainer.current; if (container == null) onZoomPercentChange(percent); else zoomAt(clampZoom?.(percent) ?? percent, viewportCenter(container)); } };
}

function MovableImageEditingToolbar({ children, dragBoundary }: { children: unknown; dragBoundary?: unknown }): unknown { initializeImageSidePanel(); return jsx.jsx("div", { "aria-label": "Image editing tools", "data-drag-boundary": dragBoundary, className: "movable-image-editing-toolbar", children }); }
function ImagePreviewHeaderTitle({ image, navigationDisabled, readOnly, title }: { image?: ImageDescriptor | null; navigationDisabled?: boolean; readOnly?: boolean; title: string }): unknown { initializeImageSidePanel(); return jsx.jsx(ArtifactPreviewHeader ?? "header", { title, fileType: "image", children: image == null ? null : jsx.jsxs(jsx.Fragment, { children: [jsx.jsx(OpenInLibraryItem ?? "button", { disabled: navigationDisabled, libraryFileId: image.id }), readOnly ? null : jsx.jsx(GeneratedImageFavorite ?? "button", { image, visible: true })] }) }); }

function ImageSidePanel({ alt, downloadAriaLabel, downloadSrc, imageSource, loadingContent, markupMode, onClose, onDownloadClick, onImageEditSubmit, renderComposer, renderHeaderActions, renderHeaderTitle, sizeControlContainer, src, title = alt, zoom }: { alt: string; downloadAriaLabel?: string; downloadSrc?: string; imageSource?: string; loadingContent?: unknown; markupMode?: { active: boolean; onActiveChange(active: boolean): void; isSubmitting?: boolean }; onClose?(): void; onDownloadClick?(): void; onImageEditSubmit?(request: { prompt: string }): Promise<boolean> | boolean; renderComposer?(visible: boolean): unknown; renderHeaderActions?(input: { isDownloadDisabled: boolean }): unknown; renderHeaderTitle?(input: { navigationDisabled: boolean }): unknown; sizeControlContainer?: unknown; src: string; title?: string; zoom?: { manualZoomPercent?: number | null; onZoomPercentChange?(percent: number | null): void; onZoomToFit?(): void } }): unknown {
  initializeImageSidePanel();
  const [prompt, setPrompt] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [zoomPercent, setZoomPercent] = React.useState(zoom?.manualZoomPercent ?? 100);
  const [panoramaReady, setPanoramaReady] = React.useState(imageSource !== "panorama");
  React.useEffect(() => {
    if (imageSource !== "panorama") { setPanoramaReady(true); return; }
    let active = true;
    setPanoramaReady(false);
    void loadPanoramaRenderer().then(() => { if (active) setPanoramaReady(true); }, () => { if (active) setPanoramaReady(false); });
    return () => { active = false; };
  }, [imageSource]);
  const submit = async (): Promise<boolean> => { if (prompt.trim().length === 0 || onImageEditSubmit == null || submitting) return false; setSubmitting(true); try { return await onImageEditSubmit({ prompt: prompt.trim() }); } finally { setSubmitting(false); } };
  const image = imageSource === "panorama" && !panoramaReady
    ? jsx.jsx("div", { role: "status", children: "Loading 360 viewer…" })
    : src.length === 0
      ? loadingContent ?? jsx.jsx("div", { role: "status", children: "Loading image…" })
      : jsx.jsx("img", { alt, decoding: "async", draggable: false, loading: "eager", src, style: { transform: `scale(${zoomPercent / 100})` } });
  const composer = markupMode?.active ? renderComposer?.(true) ?? jsx.jsxs(RightPanelComposerOverlay ?? "form", { children: [jsx.jsx("input", { "aria-label": "Describe edits", disabled: submitting, value: prompt, onChange: (event: { currentTarget: { value: string } }) => setPrompt(event.currentTarget.value) }), jsx.jsx("button", { disabled: submitting || prompt.trim().length === 0, type: "button", onClick: () => void submit(), children: submitting ? "Working…" : "Send image edit" })] }) : renderComposer?.(false) ?? null;
  const header = jsx.jsxs("header", { children: [renderHeaderTitle?.({ navigationDisabled: submitting }) ?? jsx.jsx("h2", { children: title }), renderHeaderActions?.({ isDownloadDisabled: submitting }) ?? jsx.jsx("button", { "aria-label": downloadAriaLabel ?? "Download image", disabled: submitting, type: "button", onClick: onDownloadClick, children: "Download" }), onClose == null ? null : jsx.jsx("button", { type: "button", onClick: onClose, children: "Close" })] });
  return jsx.jsxs("div", { "data-image-side-panel": true, "data-image-source": imageSource, children: [header, jsx.jsx("div", { className: "image-side-panel-stage", children: image }), jsx.jsxs("div", { className: "image-side-panel-controls", children: [jsx.jsx("button", { type: "button", onClick: () => { const next = Math.max(25, zoomPercent - 25); setZoomPercent(next); zoom?.onZoomPercentChange?.(next); }, children: "Zoom out" }), jsx.jsx("span", { children: `${zoomPercent}%` }), jsx.jsx("button", { type: "button", onClick: () => { const next = Math.min(500, zoomPercent + 25); setZoomPercent(next); zoom?.onZoomPercentChange?.(next); }, children: "Zoom in" }), sizeControlContainer == null ? null : jsx.jsx(ImageEditSizeControl ?? DrawingSizeSlider ?? "div", { container: sizeControlContainer })] }), composer, downloadSrc == null ? null : jsx.jsx("a", { download: true, href: downloadSrc, hidden: true })] });
}

function initializeImageCommentSurface(): void { initializeImageSidePanel(); }
function initializeImageCommentToolbar(): void { initializeImageSidePanel(); }
function initializeImagePreviewHeader(): void { initializeImageSidePanel(); }
function initializeImageZoomController(): void { initializeImageSidePanel(); }
function initializeMovableImageToolbar(): void { initializeImageSidePanel(); }

initializeImageSidePanel();
export { MovableImageEditingToolbar as a, useImageZoomController as c, ImageCommentSurface as d, initializeImageCommentSurface as f, initializeImagePreviewHeader as i, ImageCommentToolbar as l, initializeImageSidePanel as n, initializeMovableImageToolbar as o, ImagePreviewHeaderTitle as r, initializeImageZoomController as s, ImageSidePanel as t, initializeImageCommentToolbar as u };
