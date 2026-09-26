// sketch-composer-host-core —— Composer 内的完整 Sketch 编辑器宿主。
//
// 原版：app/webview/assets/composer-host-ac9410930773.js（73.8KB）。
// 除宿主和放弃确认外，本 chunk 还提供颜色、工具、尺寸控件及初始化入口。

import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/drawing-size-slider";
import "@rchunk/sketch";

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
}

export interface SketchEditor {
  getSnapshot(): SketchSnapshot;
  setStyle(style: Partial<SketchSnapshot["style"]>, options?: { historyGroup?: string }): void;
  setTool(tool: SketchTool): void;
  setDrawingWidth?(width: number): void;
  setEraserSize?(size: number): void;
  setTextSize?(size: number): void;
}

export interface SketchTransition {
  targetUploadId: string;
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
}

function SketchToolbarButton(props: SketchToolbarButtonProps) {
  return {
    kind: "sketch-toolbar-button" as const,
    label: props.label,
    pressed: props.pressed === true,
    disabled: props.disabled === true,
    color: props.pressed === true ? "segmentedSelected" : "ghostSecondary",
    radius: props.isUnifiedViewerEnabled === true ? "large" : "full",
    size: props.isUnifiedViewerEnabled === true ? "imageToolbar" : "composer",
    activate: () => {
      if (props.disabled !== true) props.onClick?.();
    },
  };
}

export interface SketchColorPickerProps {
  editor: SketchEditor;
  snapshot: SketchSnapshot;
  disabled?: boolean;
  isDarkMode?: boolean;
  onBeforeChange?(): void;
  onPresetSelect?(color: string): void;
}

function SketchColorPicker(props: SketchColorPickerProps) {
  const colors = LIGHT_COLORS.map((color, index) => ({
    color: props.isDarkMode === true && index === 0 ? "#ffffff" : color,
    label: sketchMessages[index === 0 && props.isDarkMode === true ? "white" : COLOR_NAMES[index]].defaultMessage,
  }));
  const select = (color: string) => {
    if (props.disabled === true) return;
    props.onBeforeChange?.();
    props.editor.setStyle({ color }, { historyGroup: "sketch-color" });
    const snapshot = props.editor.getSnapshot();
    if (snapshot.activeTool === "eraser" || (snapshot.activeTool === "select" && snapshot.selectionId == null)) {
      props.editor.setTool("pen");
    }
    props.onPresetSelect?.(color);
  };
  return { kind: "sketch-color-picker" as const, colors, selectedColor: props.snapshot.style.color, select };
}

function initializeSketchColors(): void {}

export interface SketchToolPickerProps {
  activeTool: SketchTool;
  disabled?: boolean;
  isMobile?: boolean;
  isUnifiedViewerEnabled?: boolean;
  tools?: readonly SketchTool[];
  onToolChange(tool: SketchTool): void;
}

function SketchToolPicker(props: SketchToolPickerProps) {
  const tools = props.tools ?? (props.isMobile === true ? COMPACT_TOOLS : DESKTOP_TOOLS);
  const choose = (tool: SketchTool) => {
    if (props.disabled !== true) props.onToolChange(tool);
  };
  return {
    kind: "sketch-tool-picker" as const,
    ariaLabel: sketchMessages.tools.defaultMessage,
    tools: tools.map((tool) => SketchToolbarButton({
      label: sketchMessages[tool as keyof typeof sketchMessages]?.defaultMessage ?? tool,
      pressed: tool === props.activeTool || (tool === "shapes" && SHAPES.includes(props.activeTool as SketchShape)),
      disabled: props.disabled,
      isUnifiedViewerEnabled: props.isUnifiedViewerEnabled,
      onClick: () => choose(tool),
    })),
    shapes: SHAPES.map((shape) => ({ shape, label: sketchMessages[shape].defaultMessage, choose: () => choose(shape) })),
  };
}

export interface SketchSizeControlProps {
  editor: SketchEditor;
  snapshot: SketchSnapshot;
  disabled?: boolean;
  viewportScale?: number;
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
  return { kind: "sketch-size-control" as const, type, value, ...config, disabled: props.disabled === true, setValue };
}

function initializeSketchToolIcons(): void {}

export interface SketchDiscardDialogProps {
  onDiscard(): void;
  onKeepEditing(): void;
}

function SketchDiscardDialog(props: SketchDiscardDialogProps) {
  return {
    kind: "sketch-discard-dialog" as const,
    open: true,
    title: "Discard changes?",
    description: "Your changes won't be saved",
    keepEditingLabel: "Keep editing",
    discardLabel: "Discard changes",
    keepEditing: props.onKeepEditing,
    discard: props.onDiscard,
  };
}

function SketchComposerHost(props: SketchComposerHostProps) {
  const snapshot = props.state.getSnapshot();
  const active = snapshot.active;
  return {
    kind: "sketch-composer-host" as const,
    editor: active == null ? null : {
      key: active.id,
      editor: active.editor,
      isDarkMode: props.isDarkMode,
      canSave: props.canEditSketch && (active.uploadId != null || props.canOpenSketch),
      isSaving: active.saving != null,
      hasContent: active.editor.getSnapshot().document.objects.length > 0,
      backgroundColor: props.isDarkMode ? "#212121" : "#ffffff",
      requestClose: props.state.requestClose,
      save: props.state.save,
    },
    discardDialog: snapshot.confirmingDiscard
      ? SketchDiscardDialog({ onDiscard: props.state.discard, onKeepEditing: props.state.keepEditing })
      : null,
    transition: snapshot.transition == null ? null : {
      ...snapshot.transition,
      durationMs: 400,
      complete: () => props.state.completeTransition(snapshot.transition!),
    },
  };
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
