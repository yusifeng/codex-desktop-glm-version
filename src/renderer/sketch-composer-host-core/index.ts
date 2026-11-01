// sketch-composer-host-core —— Composer 内的完整 Sketch 编辑器宿主。
//
// 原版：app/webview/assets/composer-host-ac9410930773.js（73.8KB）。
// 除宿主和放弃确认外，本 chunk 还提供颜色、工具、尺寸控件及初始化入口。

import * as sharedChunk from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/drawing-size-slider";
import * as sketchChunk from "@rchunk/sketch";

export type SketchTool =
  | "select"
  | "pen"
  | "text"
  | "shapes"
  | "eraser"
  | "comment"
  | SketchShape;

export type SketchShape =
  | "line"
  | "arrow"
  | "rectangle"
  | "ellipse"
  | "triangle"
  | "diamond"
  | "star"
  | "heart";

export interface SketchObject {
  id: string;
  kind: "ink" | "text" | "comment" | string;
}

export interface SketchSnapshot {
  activeTool: SketchTool;
  document: { objects: SketchObject[] };
  style: { color: string; width: number };
  selectionId?: string | null;
  drawingWidthPx: number;
  eraserSizePx: number;
  textSizePx: number;
  hasPendingTextEdit?: boolean;
  hasActiveGesture?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
}

export interface SketchEditor {
  getSnapshot(): SketchSnapshot;
  setStyle(style: Partial<SketchSnapshot["style"]>, options?: { historyGroup?: string }): void;
  setTool(tool: SketchTool): void;
  setDrawingWidth?(width: number): void;
  setEraserSize?(size: number): void;
  setTextSize?(size: number): void;
  clearSelection?(): void;
  commitPendingTextEdit?(): void;
  undo?(): void;
  redo?(): void;
}

export interface SketchTransition {
  targetUploadId: string;
  imageUrl?: string;
  source: {
    backgroundColor: string;
    borderRadius: number;
    height: number;
    left: number;
    top: number;
    width: number;
  };
}

export interface SketchComposerSnapshot {
  active: { id: string; editor: SketchEditor; uploadId?: string | null; saving?: unknown } | null;
  confirmingDiscard: boolean;
  transition: SketchTransition | null;
}

export interface SketchComposerState {
  subscribe(listener: () => void): () => void;
  getSnapshot(): SketchComposerSnapshot;
  requestClose(): void;
  save(): void;
  discard(): void;
  keepEditing(): void;
  completeTransition(transition: SketchTransition): void;
}

export interface SketchComposerHostProps {
  state: SketchComposerState;
  canOpenSketch: boolean;
  canEditSketch: boolean;
  isDarkMode: boolean;
}

export interface SketchMessageDescriptor {
  id: string;
  defaultMessage: string;
  description: string;
}

interface ReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useId(): string;
  useLayoutEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useRef<Value>(initialValue: Value): { current: Value };
  useState<Value>(initialValue: Value | (() => Value)): [Value, (next: Value | ((previous: Value) => Value)) => void];
  useSyncExternalStore?<Value>(subscribe: (listener: () => void) => () => void, getSnapshot: () => Value, getServerSnapshot?: () => Value): Value;
}
interface JsxRuntime { Fragment: unknown; jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown }
const shared = sharedChunk as unknown as { I3: () => JsxRuntime; P3?: () => { createPortal(node: unknown, container: Element): unknown }; e6: () => ReactRuntime };
const React = shared.e6();
const jsx = shared.I3();
const portals = shared.P3?.();
const sketch = sketchChunk as unknown as {
  l?: (editor: SketchEditor) => SketchSnapshot;
  o?: (props: Record<string, unknown>) => unknown;
};
const SketchCanvas = sketch.o;

const message = (name: string, defaultMessage: string, description: string): SketchMessageDescriptor => ({
  id: `chatgpt.sketch.composer_modal.${name}`,
  defaultMessage,
  description,
});

const sketchMessages = {
  title: message("title", "Sketch editor", "Accessible title for the sketch editor modal."),
  canvas: message("canvas.aria_label", "Sketch canvas", "Accessible label for the drawing canvas."),
  close: message("close.button_label", "Close sketch editor", "Closes the sketch editor."),
  undo: message("undo.button_label", "Undo", "Undoes the latest sketch edit."),
  redo: message("redo.button_label", "Redo", "Redoes the latest undone edit."),
  done: message("done.button_label", "Attach sketch", "Finishes and attaches the sketch."),
  saving: message("saving.button_label", "Saving sketch", "Sketch saving status."),
  tools: message("tools.aria_label", "Drawing tools", "Accessible label for drawing tools."),
  colors: message("colors.legend", "Ink color", "Accessible legend for ink colors."),
  select: message("tool.select", "Select", "Select, move, and resize objects."),
  pen: message("tool.pen", "Pen", "Freehand pen tool."),
  text: message("tool.text", "Text", "Text tool."),
  eraser: message("tool.eraser", "Eraser", "Eraser tool."),
  shapes: message("tool.shapes", "Shapes", "Shape tools menu."),
  line: message("tool.line", "Line", "Line shape tool."),
  arrow: message("tool.arrow", "Arrow", "Arrow shape tool."),
  rectangle: message("tool.rectangle", "Rectangle", "Rectangle shape tool."),
  ellipse: message("tool.ellipse", "Ellipse", "Ellipse shape tool."),
  triangle: message("tool.triangle", "Triangle", "Triangle shape tool."),
  diamond: message("tool.diamond", "Diamond", "Diamond shape tool."),
  star: message("tool.star", "Star", "Star shape tool."),
  heart: message("tool.heart", "Heart", "Heart shape tool."),
  strokeWidth: message("stroke_width.aria_label", "Stroke width", "Changes drawing stroke width."),
  eraserSize: message("eraser_size.aria_label", "Eraser size", "Changes the eraser diameter."),
  textSize: message("text_size.aria_label", "Text size", "Changes sketch text size."),
  customColor: message("color.custom", "Choose a custom color", "Opens the custom color picker."),
  black: message("color.black", "Use black", "Black color swatch."),
  white: message("color.white", "Use white", "White color swatch."),
  gray: message("color.gray", "Use gray", "Gray color swatch."),
  brown: message("color.brown", "Use brown", "Brown color swatch."),
  red: message("color.red", "Use red", "Red color swatch."),
  orange: message("color.orange", "Use orange", "Orange color swatch."),
  yellow: message("color.yellow", "Use yellow", "Yellow color swatch."),
  green: message("color.green", "Use green", "Green color swatch."),
  teal: message("color.teal", "Use teal", "Teal color swatch."),
  cyan: message("color.cyan", "Use cyan", "Cyan color swatch."),
  blue: message("color.blue", "Use blue", "Blue color swatch."),
  indigo: message("color.indigo", "Use indigo", "Indigo color swatch."),
  purple: message("color.purple", "Use purple", "Purple color swatch."),
  pink: message("color.pink", "Use pink", "Pink color swatch."),
} as const;

const SHAPES: readonly SketchShape[] = [
  "line", "arrow", "rectangle", "ellipse", "triangle", "diamond", "star", "heart",
];
const DESKTOP_TOOLS: readonly SketchTool[] = ["select", "pen", "text", "shapes", "eraser"];
const COMPACT_TOOLS: readonly SketchTool[] = ["pen", "shapes", "eraser"];
const COLOR_NAMES = [
  "black", "gray", "brown", "red", "orange", "yellow", "green", "teal", "cyan", "blue", "indigo", "purple", "pink",
] as const;
const LIGHT_COLORS = [
  "#000000", "#6b7280", "#92400e", "#dc2626", "#f97316", "#f59e0b", "#16a34a", "#0d9488", "#06b6d4", "#2563eb", "#4f46e5", "#9333ea", "#db2777",
] as const;

export interface SketchToolbarButtonProps {
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  isUnifiedViewerEnabled?: boolean;
  onClick?(): void;
  onPointerDown?(event: { preventDefault(): void }): void;
  buttonRef?: { current: HTMLButtonElement | null };
}

function SketchToolbarButton(props: SketchToolbarButtonProps) {
  return jsx.jsx("button", {
    ref: props.buttonRef,
    type: "button",
    className: "sketch-toolbar-button",
    "aria-label": props.label,
    "aria-pressed": props.pressed === true,
    disabled: props.disabled === true,
    "data-color": props.pressed === true ? "segmentedSelected" : "ghostSecondary",
    "data-radius": props.isUnifiedViewerEnabled === true ? "large" : "full",
    "data-size": props.isUnifiedViewerEnabled === true ? "imageToolbar" : "composer",
    onClick: props.onClick,
    onPointerDown: props.onPointerDown,
    children: props.label,
  });
}

export interface SketchColorPickerProps {
  editor: SketchEditor;
  snapshot: SketchSnapshot;
  disabled?: boolean;
  isDarkMode?: boolean;
  onBeforeChange?(): void;
  onPresetSelect?(color: string): void;
  open?: boolean;
  dismissalBoundary?: HTMLElement | null;
  onOpenChange?(open: boolean): void;
  compact?: boolean;
  preserveTextFocus?: boolean;
}

function SketchColorPicker(props: SketchColorPickerProps) {
  const colors = LIGHT_COLORS.map((color, index) => ({
    color: props.isDarkMode === true && index === 0 ? "#ffffff" : color,
    label: sketchMessages[index === 0 && props.isDarkMode === true ? "white" : COLOR_NAMES[index]].defaultMessage,
  }));
  const customId = React.useId();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const labelRef = React.useRef<HTMLLabelElement | null>(null);
  const fieldsetRef = React.useRef<HTMLFieldSetElement | null>(null);
  const historyGroupRef = React.useRef<string | undefined>(undefined);
  const groupCounter = React.useRef(0);
  const paletteContainsColor = colors.some(({ color }) => color === props.snapshot.style.color);
  const [customColor, setCustomColor] = React.useState<string | null>(() => paletteContainsColor ? null : props.snapshot.style.color);
  const selectedCustomColor = paletteContainsColor ? customColor : props.snapshot.style.color;
  const cleanupRef = React.useRef<(() => void) | null>(null);
  const close = () => { cleanupRef.current?.(); cleanupRef.current = null; historyGroupRef.current = undefined; props.onOpenChange?.(false); };
  const open = () => {
    cleanupRef.current?.();
    historyGroupRef.current = `${customId}-${groupCounter.current += 1}`;
    props.onOpenChange?.(true);
    const view = inputRef.current?.ownerDocument.defaultView;
    const listener = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && labelRef.current?.contains(target)) return;
      const boundary = props.dismissalBoundary ?? fieldsetRef.current;
      if ((target instanceof Element && target.closest("[data-sketch-canvas-surface]") != null) || (boundary != null && !(target instanceof Node && boundary.contains(target)))) { event.preventDefault(); event.stopPropagation(); }
      close();
    };
    view?.addEventListener("pointerdown", listener, true);
    cleanupRef.current = () => view?.removeEventListener("pointerdown", listener, true);
  };
  React.useEffect(() => () => cleanupRef.current?.(), []);
  React.useEffect(() => { if (!props.open || props.disabled) cleanupRef.current?.(); }, [props.disabled, props.open]);
  const select = (color: string, historyGroup = "sketch-color") => {
    if (props.disabled === true) return;
    props.onBeforeChange?.();
    props.editor.setStyle({ color }, { historyGroup });
    const snapshot = props.editor.getSnapshot();
    if (snapshot.activeTool === "eraser" || (snapshot.activeTool === "select" && snapshot.selectionId == null)) {
      props.editor.setTool("pen");
    }
  };
  return jsx.jsxs("fieldset", {
    ref: fieldsetRef,
    className: props.compact ? "sketch-color-picker grid grid-cols-7" : "sketch-color-picker",
    "aria-label": sketchMessages.colors.defaultMessage,
    disabled: props.disabled === true,
    children: [
      jsx.jsx("legend", { children: sketchMessages.colors.defaultMessage }),
      jsx.jsx("label", { ref: labelRef, className: "sketch-color-picker__custom", children: [jsx.jsx("span", { className: "sr-only", children: sketchMessages.customColor.defaultMessage }), jsx.jsx("input", { ref: inputRef, type: "color", name: `sketch-custom-color-${customId}`, "aria-label": sketchMessages.customColor.defaultMessage, "aria-pressed": !paletteContainsColor, value: selectedCustomColor ?? "#a855f7", disabled: props.disabled === true, onClick: (event: { stopPropagation(): void }) => { event.stopPropagation(); open(); if (selectedCustomColor != null) select(selectedCustomColor, historyGroupRef.current); }, onInput: (event: { currentTarget: { value: string } }) => { if (historyGroupRef.current == null) open(); setCustomColor(event.currentTarget.value); select(event.currentTarget.value, historyGroupRef.current); }, onChange: (event: { currentTarget: { value: string } }) => { setCustomColor(event.currentTarget.value); select(event.currentTarget.value, historyGroupRef.current); close(); } }), jsx.jsx("span", { "aria-hidden": true, className: "sketch-color-picker__custom-swatch", style: selectedCustomColor == null ? undefined : { backgroundColor: selectedCustomColor } })] }),
      ...colors.map(({ color, label }) => jsx.jsx("button", { type: "button", "aria-label": label, "aria-pressed": props.snapshot.style.color.toLowerCase() === color.toLowerCase(), style: { backgroundColor: color }, onPointerDown: (event: { preventDefault(): void }) => { if (props.preserveTextFocus) event.preventDefault(); }, onClick: () => { select(color); props.onPresetSelect?.(color); }, children: jsx.jsx("span", { className: "sr-only", children: label }) }, color)),
    ],
  });
}

function initializeSketchColors(): void {}

export interface SketchToolPickerProps {
  activeTool: SketchTool;
  disabled?: boolean;
  isMobile?: boolean;
  isUnifiedViewerEnabled?: boolean;
  tools?: readonly SketchTool[];
  onToolChange(tool: SketchTool): void;
  open?: boolean;
  onOpenChange?(open: boolean): void;
  leadingControls?: unknown;
  trailingControls?: unknown;
  children?: unknown;
}

function SketchToolPicker(props: SketchToolPickerProps) {
  const tools = props.tools ?? (props.isMobile === true ? COMPACT_TOOLS : DESKTOP_TOOLS);
  const choose = (tool: SketchTool) => {
    if (props.disabled !== true) props.onToolChange(tool);
  };
  const shapesButtonRef = React.useRef<HTMLButtonElement | null>(null);
  React.useEffect(() => {
    const button = shapesButtonRef.current;
    if (!props.open || props.disabled || button == null) return;
    const document = button.ownerDocument;
    const dialog = button.closest("[role='dialog']");
    const listener = (event: PointerEvent) => {
      const target = event.target;
      const menuId = button.getAttribute("aria-controls");
      const menu = menuId == null ? null : document.getElementById(menuId);
      if (target instanceof Node && (button.contains(target) || menu?.contains(target))) return;
      if ((target instanceof Element && target.closest("[data-sketch-canvas-surface]") != null) || (dialog != null && !(target instanceof Node && dialog.contains(target)))) { event.preventDefault(); event.stopPropagation(); }
      props.onOpenChange?.(false);
    };
    document.addEventListener("pointerdown", listener, true);
    return () => document.removeEventListener("pointerdown", listener, true);
  }, [props.disabled, props.onOpenChange, props.open]);
  const toolButtons = tools.map((tool) => jsx.jsx(SketchToolbarButton, {
      label: sketchMessages[tool as keyof typeof sketchMessages]?.defaultMessage ?? tool,
      pressed: tool === props.activeTool || (tool === "shapes" && SHAPES.includes(props.activeTool as SketchShape)),
      disabled: props.disabled,
      isUnifiedViewerEnabled: props.isUnifiedViewerEnabled,
      buttonRef: tool === "shapes" ? shapesButtonRef : undefined,
      onPointerDown: (event: { preventDefault(): void }) => { if (props.isMobile !== true) event.preventDefault(); },
      onClick: () => { if (tool === "shapes") props.onOpenChange?.(!props.open); else choose(tool); },
    }, tool));
  const shapeButtons = SHAPES.map((shape) => jsx.jsx(SketchToolbarButton, { label: sketchMessages[shape].defaultMessage, pressed: shape === props.activeTool, disabled: props.disabled, isUnifiedViewerEnabled: props.isUnifiedViewerEnabled, onPointerDown: (event: { preventDefault(): void }) => { if (props.isMobile !== true) event.preventDefault(); }, onClick: () => { choose(shape); props.onOpenChange?.(false); } }, shape));
  return jsx.jsx("fieldset", { className: "sketch-tool-picker", "aria-label": sketchMessages.tools.defaultMessage, children: jsx.jsxs("div", { className: props.isUnifiedViewerEnabled ? "flex min-w-0 items-center" : "flex items-center rounded-full", children: [jsx.jsxs("div", { className: "no-scrollbar flex min-w-0 items-center overflow-x-auto", children: [props.leadingControls, ...toolButtons, props.children] }), props.open && props.disabled !== true ? jsx.jsx("div", { role: "menu", "aria-label": sketchMessages.shapes.defaultMessage, className: "sketch-tool-picker__shapes", children: shapeButtons }) : null, props.trailingControls] }) });
}

export interface SketchSizeControlProps {
  editor: SketchEditor;
  snapshot: SketchSnapshot;
  disabled?: boolean;
  viewportScale?: number;
  forceExpanded?: boolean;
  className?: string;
}

function SketchSizeControl(props: SketchSizeControlProps) {
  const snapshot = props.snapshot;
  const selected = snapshot.document.objects.find((object) => object.id === snapshot.selectionId);
  const isText = snapshot.activeTool === "text" || selected?.kind === "text";
  const isEraser = snapshot.activeTool === "eraser";
  const isComment = snapshot.activeTool === "comment" || selected?.kind === "comment";
  const scale = props.viewportScale ?? 1;
  const type = isEraser ? "eraser" : isText ? "text" : "stroke";
  const value = isEraser
    ? snapshot.eraserSizePx
    : isText
      ? snapshot.textSizePx
      : selected == null ? snapshot.drawingWidthPx : snapshot.style.width * scale;
  const config = {
    stroke: { min: isComment ? 2 : 1, max: isComment ? 48 : 32, name: "sketch-stroke-width", label: sketchMessages.strokeWidth.defaultMessage },
    text: { min: 8, max: 128, name: "sketch-text-size", label: sketchMessages.textSize.defaultMessage },
    eraser: { min: 4, max: 96, name: "sketch-eraser-size", label: sketchMessages.eraserSize.defaultMessage },
  }[type];
  const setValue = (next: number) => {
    if (props.disabled === true) return;
    if (type === "eraser") props.editor.setEraserSize?.(next);
    else if (type === "text") props.editor.setTextSize?.(next);
    else props.editor.setDrawingWidth?.(next / (selected == null ? 1 : scale));
  };
  return jsx.jsxs("label", { className: `sketch-size-control${props.className == null ? "" : ` ${props.className}`}`, "data-control-type": type, "data-force-expanded": props.forceExpanded === true, children: [jsx.jsx("span", { children: config.label }), jsx.jsx("input", { type: "range", name: config.name, "aria-label": config.label, min: config.min, max: config.max, value, disabled: props.disabled === true, onChange: (event: { currentTarget: { valueAsNumber: number } }) => setValue(event.currentTarget.valueAsNumber) })] });
}

function initializeSketchToolIcons(): void {}

export interface SketchDiscardDialogProps {
  onDiscard(): void;
  onKeepEditing(): void;
}

function SketchDiscardDialog(props: SketchDiscardDialogProps) {
  return jsx.jsxs("dialog", { open: true, role: "alertdialog", "aria-labelledby": "sketch-discard-title", children: [jsx.jsx("h2", { id: "sketch-discard-title", children: "Discard changes?" }), jsx.jsx("p", { children: "Your changes won't be saved" }), jsx.jsxs("footer", { children: [jsx.jsx("button", { type: "button", onClick: props.onKeepEditing, children: "Keep editing" }), jsx.jsx("button", { type: "button", onClick: props.onDiscard, children: "Discard changes" })] })] });
}

function findTransitionTarget(document: Document, uploadId: string): HTMLElement | null {
  for (const element of document.querySelectorAll<HTMLElement>("[data-attachment-transition-target]")) if (element.dataset.attachmentTransitionTarget === uploadId) return element;
  return null;
}
function SketchAttachmentTransition({ transition, onComplete }: { transition: SketchTransition; onComplete(transition: SketchTransition): void }): unknown {
  const elementRef = React.useRef<HTMLDivElement | null>(null);
  React.useLayoutEffect(() => {
    const element = elementRef.current;
    const view = element?.ownerDocument.defaultView;
    if (element == null || view == null) { onComplete(transition); return; }
    let frame = 0; let finished = false; let target: HTMLElement | null = null; let originalVisibility = ""; const startedAt = view.performance.now();
    const finish = () => { if (finished) return; finished = true; if (target != null) target.style.visibility = originalVisibility; onComplete(transition); };
    const animate = (now: number) => {
      const nextTarget = findTransitionTarget(element.ownerDocument, transition.targetUploadId);
      if (nextTarget != null && nextTarget !== target) { if (target != null) target.style.visibility = originalVisibility; target = nextTarget; originalVisibility = target.style.visibility; target.style.visibility = "hidden"; }
      const rect = target?.getBoundingClientRect();
      if (rect != null && rect.width > 0 && rect.height > 0) {
        Object.assign(element.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, borderRadius: getComputedStyle(target!).borderTopLeftRadius || "18px" });
        if (now - startedAt >= 400) { view.requestAnimationFrame(finish); return; }
      } else if (now - startedAt >= 500) { finish(); return; }
      frame = view.requestAnimationFrame(animate);
    };
    frame = view.requestAnimationFrame(animate);
    return () => { view.cancelAnimationFrame(frame); if (target != null) target.style.visibility = originalVisibility; };
  }, [onComplete, transition]);
  const node = jsx.jsx("div", { ref: elementRef, className: "sketch-composer-host__transition pointer-events-none fixed z-50 overflow-hidden", "aria-hidden": true, "data-target-upload-id": transition.targetUploadId, style: { ...transition.source, transitionDuration: "400ms", transitionProperty: "border-radius, height, left, top, width", transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", willChange: "border-radius, height, left, top, width" }, children: transition.imageUrl == null ? null : jsx.jsx("img", { alt: "", src: transition.imageUrl, draggable: false, decoding: "sync", className: "h-full w-full object-cover" }) });
  return portals?.createPortal != null && globalThis.document?.body != null ? portals.createPortal(node, document.body) : node;
}

function SketchEditorSurface({ editor, canSave, isSaving, isDarkMode, onRequestClose, onDone }: { editor: SketchEditor; canSave: boolean; isSaving: boolean; isDarkMode: boolean; onRequestClose(): void; onDone(): void }): unknown {
  const snapshot = sketch.l?.(editor) ?? editor.getSnapshot();
  const [canvasElement, setCanvasElement] = React.useState<HTMLDivElement | null>(null);
  const [surfaceSize, setSurfaceSize] = React.useState<{ width: number; height: number } | null>(null);
  const [openControl, setOpenControl] = React.useState<"shapes" | "color" | null>(null);
  const [isMobile] = React.useState(() => globalThis.window?.matchMedia?.("(max-width: 639px)").matches ?? false);
  const lastDrawingTool = React.useRef<SketchTool>("pen");
  const readOnly = !canSave || isSaving;
  const empty = readOnly || snapshot.document.objects.length === 0;
  React.useLayoutEffect(() => {
    if (canvasElement == null) return;
    const measure = () => { const width = canvasElement.clientWidth; const height = canvasElement.clientHeight; if (width > 0 && height > 0) setSurfaceSize(previous => previous?.width === width && previous.height === height ? previous : { width, height }); };
    measure(); const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure); observer?.observe(canvasElement); return () => observer?.disconnect();
  }, [canvasElement]);
  React.useLayoutEffect(() => {
    if (!isMobile) return;
    if (!["select", "text", "comment"].includes(snapshot.activeTool)) { lastDrawingTool.current = snapshot.activeTool; if (snapshot.selectionId != null) editor.clearSelection?.(); }
    else if (snapshot.activeTool === "select") editor.setTool(lastDrawingTool.current);
  }, [editor, isMobile, snapshot.activeTool, snapshot.selectionId]);
  const chooseTool = (tool: SketchTool) => { editor.commitPendingTextEdit?.(); if (!["select", "text", "comment"].includes(tool)) lastDrawingTool.current = tool; editor.setTool(tool); };
  const submit = (event: { preventDefault(): void; stopPropagation(): void }) => { event.preventDefault(); event.stopPropagation(); if (!empty) onDone(); };
  const canvas = surfaceSize == null ? null : SketchCanvas == null ? jsx.jsx("div", { role: "img", "aria-label": sketchMessages.canvas.defaultMessage }) : jsx.jsx(SketchCanvas, { editor, "aria-label": sketchMessages.canvas.defaultMessage, backgroundColor: isDarkMode ? "#212121" : "#ffffff", clipboardScope: canvasElement, surfaceSize, readOnly });
  return jsx.jsx("div", { role: "dialog", "aria-label": sketchMessages.title.defaultMessage, className: isMobile ? "sketch-composer-host__editor sheet" : "sketch-composer-host__editor square", children: jsx.jsx("form", { "aria-busy": isSaving, onSubmit: submit, children: jsx.jsxs("div", { ref: setCanvasElement, className: "sketch-composer-host__canvas", "data-sketch-canvas-surface": "true", style: { backgroundColor: isDarkMode ? "#212121" : "#ffffff" }, onPointerDownCapture: (event: { target: EventTarget | null; preventDefault(): void }) => { if (openControl != null && event.target instanceof Element && event.target.closest("[data-sketch-canvas-surface]") != null) event.preventDefault(); }, children: [canvas, jsx.jsxs("header", { children: [jsx.jsx("button", { type: "button", "aria-label": sketchMessages.close.defaultMessage, disabled: isSaving, onPointerDown: (event: { preventDefault(): void }) => event.preventDefault(), onClick: onRequestClose, children: "Close" }), (!isMobile || snapshot.hasActiveGesture !== true) ? jsx.jsx(SketchToolPicker, { activeTool: snapshot.activeTool, disabled: readOnly, isMobile, open: openControl === "shapes", onOpenChange: open => setOpenControl(open ? "shapes" : null), onToolChange: chooseTool }) : null, jsx.jsx("button", { type: "button", "aria-label": sketchMessages.undo.defaultMessage, disabled: readOnly || snapshot.canUndo === false, onClick: () => { editor.commitPendingTextEdit?.(); editor.undo?.(); }, children: "Undo" }), !isMobile ? jsx.jsx("button", { type: "button", "aria-label": sketchMessages.redo.defaultMessage, disabled: readOnly || snapshot.canRedo === false, onClick: () => { editor.commitPendingTextEdit?.(); editor.redo?.(); }, children: "Redo" }) : null] }), jsx.jsxs("aside", { children: [jsx.jsx(SketchSizeControl, { editor, snapshot, disabled: readOnly, forceExpanded: !isMobile }), jsx.jsx(SketchColorPicker, { editor, snapshot, disabled: readOnly, isDarkMode, open: openControl === "color", dismissalBoundary: canvasElement, onOpenChange: open => setOpenControl(open ? "color" : null) })] }), jsx.jsx("button", { type: "submit", disabled: empty, "aria-busy": isSaving, "aria-label": isSaving ? sketchMessages.saving.defaultMessage : sketchMessages.done.defaultMessage, onPointerDown: (event: { preventDefault(): void }) => event.preventDefault(), children: isSaving ? "Saving…" : "Attach sketch" })] }) }) });
}

function SketchComposerHost(props: SketchComposerHostProps) {
  const snapshot = React.useSyncExternalStore?.(props.state.subscribe, props.state.getSnapshot, props.state.getSnapshot) ?? props.state.getSnapshot();
  const active = snapshot.active;
  const editor = active == null ? null : jsx.jsx(SketchEditorSurface, { editor: active.editor, isDarkMode: props.isDarkMode, canSave: props.canEditSketch && (active.uploadId != null || props.canOpenSketch), isSaving: active.saving != null, onRequestClose: props.state.requestClose, onDone: props.state.save }, active.id);
  const discard = snapshot.confirmingDiscard ? jsx.jsx(SketchDiscardDialog, { onDiscard: props.state.discard, onKeepEditing: props.state.keepEditing }) : null;
  const transition = snapshot.transition == null ? null : jsx.jsx(SketchAttachmentTransition, { transition: snapshot.transition, onComplete: props.state.completeTransition });
  return jsx.jsxs(jsx.Fragment, { children: [editor, discard, transition] });
}

function initializeSketchMessages(): void {}

function initializeSketchComposerHost(): void {
  initializeSketchMessages();
  initializeSketchColors();
  initializeSketchToolIcons();
}

export {
  SketchToolbarButton as a,
  SketchColorPicker as c,
  sketchMessages as d,
  SketchSizeControl as i,
  initializeSketchColors as l,
  SketchDiscardDialog as n,
  SketchToolPicker as o,
  initializeSketchComposerHost as r,
  initializeSketchToolIcons as s,
  SketchComposerHost as t,
  initializeSketchMessages as u,
};
