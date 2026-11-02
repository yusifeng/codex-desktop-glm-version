import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/artifact-workbook-runtime";
import "@rchunk/app-initial";
import "@rchunk/popcorn-icons";
import "@rchunk/artifact-source-bootstrap";
import "@rchunk/app-primary";
import "@rchunk/popcorn-manual-edit-header-controls";
import "@rchunk/text-underline-icon";
import "@rchunk/portable-thumbnail-font-face-source-runtime";
import "@rchunk/portable-thumbnail-font-runtime";
import "@rchunk/drawing-frame-geometry";
import "@rchunk/floating-ui-modifiers";
import "@rchunk/popcorn-electron-surface-style";
import "@rchunk/popcorn-review-bar-overlay";
import "@rchunk/draw-presence-label";
import "@rchunk/presentation-review-utils";

export interface PresentationSlide { id: string; title?: string; thumbnailUrl?: string }
export interface PopcornPresentationController { getSelectedSlideIndex(): number; getZoom(): number; selectSlide(index: number): void; setZoom(zoom: number): void }
export interface PopcornElectronPresentationPanelProps {
  annotationsEnabled?: boolean;
  className?: string;
  footerContent?: unknown;
  headerCenterContent?: unknown;
  headerRightContent?: unknown;
  headerTitleContent?: unknown;
  initialSelectedSlideIdx?: number;
  initialSourceBytes?: Uint8Array;
  initialSourceFormat?: string;
  initialZoom?: number;
  isEditing?: boolean;
  onControllerReady?(controller: PopcornPresentationController): void;
  onImportError?(error: Error): void;
  onImportReady?(): void;
  onInteractionAttempt?(): void;
  onPresentationEdit?(): void;
  renderHeader?(parts: Record<string, unknown>): unknown;
  renderLayout?(parts: Record<string, unknown>): unknown;
  slides?: readonly PresentationSlide[];
  theme?: string;
  title?: string;
}

let runtime: JsxRuntime | undefined;
let React: ReturnType<typeof getReactRuntime> | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function react(): ReturnType<typeof getReactRuntime> { React ??= getReactRuntime(); return React; }
function clamp(value: number, length: number): number { return Math.min(Math.max(0, value), Math.max(0, length - 1)); }
function clampZoom(value: number): number { return Number.isFinite(value) ? Math.min(4, Math.max(0.25, value)) : 1; }
function validateSource(bytes?: Uint8Array, format?: string): void {
  if (bytes != null && bytes.byteLength === 0) throw new Error("Presentation source is empty");
  if (format != null && !["ppt", "pptx"].includes(format.toLowerCase())) throw new Error(`Unsupported presentation format: ${format}`);
}

function PopcornElectronPresentationPanel(props: PopcornElectronPresentationPanelProps): unknown {
  const R = react();
  const [selected, setSelected] = R.useState(() => clamp(props.initialSelectedSlideIdx ?? 0, props.slides?.length ?? 0));
  const [zoom, setZoom] = R.useState(() => clampZoom(props.initialZoom ?? 1));
  const state = R.useRef({ selected, zoom });
  state.current = { selected, zoom };
  const controllerRef = R.useRef<PopcornPresentationController | null>(null);
  controllerRef.current ??= {
    getSelectedSlideIndex: () => state.current.selected,
    getZoom: () => state.current.zoom,
    selectSlide(index) {
      const next = clamp(index, props.slides?.length ?? 0);
      if (next === state.current.selected) return;
      state.current.selected = next;
      setSelected(next);
      props.onInteractionAttempt?.();
      props.onPresentationEdit?.();
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
    const next = clamp(selected, props.slides?.length ?? 0);
    if (next !== selected) { state.current.selected = next; setSelected(next); }
  }, [props.slides, selected]);
  const controller = controllerRef.current;
  const header = props.renderHeader?.({ controller, title: props.title, zoom }) ?? jsx().jsxs("header", { children: [props.headerTitleContent ?? jsx().jsx("h1", { children: props.title ?? "Presentation" }), props.headerCenterContent, props.headerRightContent] });
  const content = jsx().jsxs("div", { "data-selected-slide-index": selected, "data-zoom": zoom, children: [
    jsx().jsx("aside", { "aria-label": "Slides", children: (props.slides ?? []).map((slide, index) => jsx().jsx("button", { "aria-pressed": index === selected, onClick: () => controller.selectSlide(index), type: "button", children: slide.title ?? `Slide ${index + 1}` }, slide.id)) }),
    jsx().jsxs("div", { "data-presentation-canvas": true, children: [props.slides?.[selected]?.title ?? "Empty presentation", jsx().jsx("output", { children: `${Math.round(zoom * 100)}%` })] }),
  ] });
  const panel = jsx().jsxs("section", { className: props.className, "data-codex-popcorn-editor": true, "data-testid": "popcorn-electron-presentation-panel", "data-theme": props.theme ?? "codex", "data-editing": props.isEditing ?? false, "data-annotations-enabled": props.annotationsEnabled ?? false, children: [header, content, props.footerContent] });
  return props.renderLayout?.({ content, controller, header, panel }) ?? panel;
}

export { PopcornElectronPresentationPanel };
