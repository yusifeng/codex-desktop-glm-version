import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime, type JsxRuntime, type ReactRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";

type SketchTool = "pen" | "eraser" | "line" | "arrow" | "rectangle" | "ellipse" | "triangle" | "diamond" | "star" | "heart" | "text" | "comment" | "select";
type ShapeKind = "rectangle" | "ellipse" | "triangle" | "diamond" | "star" | "heart";
interface Point { x: number; y: number; pressure?: number; breakBefore?: boolean }
interface Bounds { x: number; y: number; width: number; height: number }
interface SketchStyle { color: string; width: number }
interface TextFormat { bold: boolean; italic: boolean; underline: boolean }
interface BaseObject { id: string; kind: string }
interface StrokeObject extends BaseObject { kind: "stroke"; points: Point[]; style: SketchStyle }
interface EraserObject extends BaseObject { kind: "eraser"; points: Point[]; width: number }
interface LineObject extends BaseObject { kind: "line"; from: Point; to: Point; style: SketchStyle }
interface ArrowObject extends BaseObject { kind: "arrow"; from: Point; to: Point; style: SketchStyle }
type LinearObject = LineObject | ArrowObject;
interface ShapeObject extends BaseObject { kind: ShapeKind; bounds: Bounds; style: SketchStyle }
interface TextObject extends BaseObject { kind: "text"; text: string; bounds: Bounds; style: SketchStyle; format: TextFormat; minHeight?: number; padding?: number }
interface CommentObject extends BaseObject { kind: "comment"; text: string; bounds: Bounds }
interface InkObject extends BaseObject { kind: "ink"; bounds: Bounds; style: SketchStyle; coverage?: unknown }
type SketchObject = StrokeObject | EraserObject | LinearObject | ShapeObject | TextObject | CommentObject | InkObject;
interface SketchDocument { schemaVersion: 1; objects: SketchObject[] }
interface SketchPreview { object: SketchObject; replaceObjectId?: string; transformKind?: "move" | "resize" }
interface SketchSnapshot {
  document: SketchDocument;
  effectiveDocument: SketchDocument;
  hasPendingTextEdit: boolean;
  activeTool: SketchTool;
  eraserSizePx: number;
  drawingWidthPx?: number;
  textSizePx?: number;
  style: SketchStyle;
  textFormat: TextFormat;
  selectionId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  hasActiveGesture: boolean;
  erasurePreview: SketchDocument | null;
  preview: SketchPreview | null;
  snapGuides: readonly unknown[];
  cursor: string;
}
interface PointerInput { pointerId: number; point: Point; tolerance?: number; viewportScale?: number; shiftKey?: boolean; surfaceBounds?: Bounds; sample?: { timestamp?: number } }
interface PendingTextEdit { objectId?: string; text: string; bounds: Bounds; minHeight?: number; padding?: number; style?: Partial<SketchStyle>; format?: Partial<TextFormat> }
interface ExportOptions { backgroundColor?: string; clipBounds?: Bounds; maxDimension?: number; maxPixelCount?: number; mimeType?: string; outputBounds?: Bounds; padding?: number; scale?: number }
type ExportResult = { kind: "empty" | "unavailable" | "busy" } | { kind: "too-large"; width: number; height: number } | { kind: "success"; blob: Blob; width: number; height: number; bounds: Bounds };
interface SketchEditor {
  getSnapshot(): SketchSnapshot;
  subscribe(listener: () => void): () => void;
  attachTextLayoutResources(resources: unknown): () => void;
  setPendingTextEdit(edit: PendingTextEdit | null): void;
  commitPendingTextEdit(): boolean;
  discardPendingTextEdit(): boolean;
  setTool(tool: SketchTool): void;
  setEraserSize(size: number): void;
  setDrawingWidth(width: number): void;
  setTextSize(size: number): void;
  setStyle(style: Partial<SketchStyle>, options?: { historyGroup?: string }): void;
  setTextFormat(format: Partial<TextFormat>, options?: { historyGroup?: string }): void;
  insertTextBox(input: Omit<PendingTextEdit, "objectId">): string | null;
  insertComment(input: { text: string; bounds: Bounds }): string | null;
  updateComment(id: string, text: string): boolean;
  pasteObject(object: SketchObject, options?: { offset?: Point }): string | null;
  updateTextBox(id: string, input: { text: string; bounds?: Bounds }, options?: { historyGroup?: string }): boolean;
  selectObject(id: string): boolean;
  deleteObject(id: string): boolean;
  getObjectAtPoint(point: Point, tolerance?: number): SketchObject | null;
  clearSelection(): void;
  deleteSelection(): boolean;
  clear(): boolean;
  undo(): boolean;
  redo(): boolean;
  replaceDocument(document: SketchDocument, options?: { preserveHistory?: boolean }): void;
  setSurfaceBounds(bounds: Bounds | null): void;
  nudgeSelection(delta: Point, options?: { historyGroup?: string; viewportScale?: number }): boolean;
  pointerDown(input: PointerInput): boolean;
  pointerMove(input: PointerInput): boolean;
  pointerMoves(inputs: readonly PointerInput[]): boolean;
  pointerUp(input: PointerInput): boolean;
  pointerCommit(pointerId?: number): boolean;
  pointerCancel(pointerId?: number): boolean;
  pointerLeave(): void;
  export(options?: ExportOptions): Promise<ExportResult>;
}
interface CreateSketchOptions { document?: SketchDocument; tool?: SketchTool; style?: Partial<SketchStyle>; eraserSizePx?: number; drawingWidthPx?: number; textSizePx?: number; textLayoutResources?: unknown }
interface SketchSurfaceProps extends Record<string, unknown> { editor: SketchEditor; surfaceSize: { width: number; height: number }; viewport?: unknown; className?: string; readOnly?: boolean; backgroundColor?: string; "aria-label"?: string; "aria-labelledby"?: string }

const DEFAULT_STYLE: SketchStyle = { color: "#111827", width: 12 };
const DEFAULT_FORMAT: TextFormat = { bold: false, italic: false, underline: false };
const DRAW_TOOLS = new Set<SketchTool>(["pen", "eraser", "line", "arrow", "rectangle", "ellipse", "triangle", "diamond", "star", "heart"]);
let jsxRuntime: JsxRuntime | undefined;
let React: ReactRuntime | undefined;

function clamp(value: number | undefined, minimum: number, maximum: number, fallback: number): number { return Math.min(Math.max(Number.isFinite(value) ? (value as number) : fallback, minimum), maximum); }
function normalizeBounds(bounds: Bounds): Bounds { const x = Math.min(bounds.x, bounds.x + bounds.width); const y = Math.min(bounds.y, bounds.y + bounds.height); return { x, y, width: Math.abs(bounds.width), height: Math.abs(bounds.height) }; }
function createDocument(objects: SketchObject[] = []): SketchDocument { return { schemaVersion: 1, objects }; }
function objectCenter(object: { bounds: Bounds }): Point { const bounds = normalizeBounds(object.bounds); return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }; }
function normalizedCommentBounds(bounds: Bounds, viewportScale = 1): Bounds { const scale = Number.isFinite(viewportScale) && viewportScale > 0 ? viewportScale : 1; const size = 24 / scale; const center = objectCenter({ bounds }); return { x: center.x - size / 2, y: center.y - size / 2, width: size, height: size }; }
function commentsIn(document: SketchDocument): CommentObject[] { return document.objects.filter((object): object is CommentObject => object.kind === "comment"); }
function pointsBounds(points: readonly Point[], padding = 0): Bounds | null { if (points.length === 0) return null; const xs = points.map(point => point.x); const ys = points.map(point => point.y); const left = Math.min(...xs) - padding; const top = Math.min(...ys) - padding; return { x: left, y: top, width: Math.max(...xs) + padding - left, height: Math.max(...ys) + padding - top }; }
function objectBounds(object: SketchObject): Bounds | null {
  if ("bounds" in object) return normalizeBounds(object.bounds);
  if (object.kind === "line" || object.kind === "arrow") return pointsBounds([object.from, object.to], object.style.width / 2);
  if (object.kind === "stroke") return pointsBounds(object.points, object.style.width / 2);
  return pointsBounds(object.points, object.width / 2);
}
function unionBounds(bounds: readonly (Bounds | null)[]): Bounds | null { const present = bounds.filter((item): item is Bounds => item != null); if (present.length === 0) return null; const left = Math.min(...present.map(item => item.x)); const top = Math.min(...present.map(item => item.y)); const right = Math.max(...present.map(item => item.x + item.width)); const bottom = Math.max(...present.map(item => item.y + item.height)); return { x: left, y: top, width: right - left, height: bottom - top }; }
function intersectBounds(left: Bounds, right: Bounds): Bounds | null { const x = Math.max(left.x, right.x); const y = Math.max(left.y, right.y); const farX = Math.min(left.x + left.width, right.x + right.width); const farY = Math.min(left.y + left.height, right.y + right.height); return farX <= x || farY <= y ? null : { x, y, width: farX - x, height: farY - y }; }
function distanceToSegment(point: Point, from: Point, to: Point): number { const dx = to.x - from.x; const dy = to.y - from.y; if (dx === 0 && dy === 0) return Math.hypot(point.x - from.x, point.y - from.y); const ratio = Math.max(0, Math.min(1, ((point.x - from.x) * dx + (point.y - from.y) * dy) / (dx * dx + dy * dy))); return Math.hypot(point.x - (from.x + ratio * dx), point.y - (from.y + ratio * dy)); }
function insideBounds(point: Point, bounds: Bounds, tolerance: number): boolean { const box = normalizeBounds(bounds); return point.x >= box.x - tolerance && point.x <= box.x + box.width + tolerance && point.y >= box.y - tolerance && point.y <= box.y + box.height + tolerance; }
function hitTest(object: SketchObject, point: Point, tolerance = 0): boolean {
  if (object.kind === "comment") return insideBounds(point, normalizedCommentBounds(object.bounds), tolerance);
  if (object.kind === "line" || object.kind === "arrow") return distanceToSegment(point, object.from, object.to) <= tolerance + object.style.width / 2;
  if (object.kind === "stroke") { for (let index = 1; index < object.points.length; index += 1) if (distanceToSegment(point, object.points[index - 1]!, object.points[index]!) <= tolerance + object.style.width / 2) return true; return object.points.length === 1 && distanceToSegment(point, object.points[0]!, object.points[0]!) <= tolerance + object.style.width / 2; }
  const bounds = objectBounds(object); return bounds != null && insideBounds(point, bounds, tolerance);
}
function moveObject(object: SketchObject, delta: Point): SketchObject {
  const move = (point: Point): Point => ({ ...point, x: point.x + delta.x, y: point.y + delta.y });
  if (object.kind === "stroke" || object.kind === "eraser") return { ...object, points: object.points.map(move) };
  if (object.kind === "line" || object.kind === "arrow") return { ...object, from: move(object.from), to: move(object.to) };
  return { ...object, bounds: { ...object.bounds, x: object.bounds.x + delta.x, y: object.bounds.y + delta.y } };
}
function cloneObject(object: SketchObject, id: string): SketchObject { return { ...moveObject(object, { x: 0, y: 0 }), id }; }
function escapeXml(value: string): string { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
function objectSvg(object: SketchObject): string {
  if (object.kind === "stroke") return `<polyline points="${object.points.map(point => `${point.x},${point.y}`).join(" ")}" fill="none" stroke="${escapeXml(object.style.color)}" stroke-width="${object.style.width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (object.kind === "eraser") return "";
  if (object.kind === "line" || object.kind === "arrow") return `<line x1="${object.from.x}" y1="${object.from.y}" x2="${object.to.x}" y2="${object.to.y}" stroke="${escapeXml(object.style.color)}" stroke-width="${object.style.width}"/>`;
  const bounds = normalizeBounds(object.bounds);
  if (object.kind === "text") return `<text x="${bounds.x}" y="${bounds.y + object.style.width}" fill="${escapeXml(object.style.color)}" font-size="${object.style.width}">${escapeXml(object.text)}</text>`;
  if (object.kind === "comment") return "";
  return `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" fill="none" stroke="${escapeXml(object.style.color)}" stroke-width="${object.style.width}" data-shape="${object.kind}"/>`;
}
async function exportSketch(document: SketchDocument, options: ExportOptions = {}): Promise<ExportResult> {
  const contentBounds = unionBounds(document.objects.filter(object => object.kind !== "comment" && object.kind !== "eraser").map(objectBounds));
  const clippedBounds = contentBounds == null || options.clipBounds == null ? contentBounds : intersectBounds(contentBounds, normalizeBounds(options.clipBounds));
  const rawBounds = options.outputBounds ?? clippedBounds;
  if (rawBounds == null) return { kind: "empty" };
  const padding = Math.max(0, Number.isFinite(options.padding) ? options.padding! : options.outputBounds == null ? 24 : 0);
  const bounds = normalizeBounds(rawBounds); const scale = Math.max(0.01, Number.isFinite(options.scale) ? options.scale! : 1);
  const width = Math.max(1, Math.ceil((bounds.width + padding * 2) * scale)); const height = Math.max(1, Math.ceil((bounds.height + padding * 2) * scale));
  const maxDimension = Math.max(1, Math.floor(options.maxDimension ?? 2048)); const maxPixelCount = Math.max(1, Math.floor(options.maxPixelCount ?? 4_000_000));
  if (width > maxDimension || height > maxDimension || width * height > maxPixelCount) return { kind: "too-large", width, height };
  const viewBox = `${bounds.x - padding} ${bounds.y - padding} ${bounds.width + padding * 2} ${bounds.height + padding * 2}`;
  const background = options.backgroundColor == null ? "" : `<rect x="${bounds.x - padding}" y="${bounds.y - padding}" width="${bounds.width + padding * 2}" height="${bounds.height + padding * 2}" fill="${escapeXml(options.backgroundColor)}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">${background}${document.objects.map(objectSvg).join("")}</svg>`;
  const mimeType = options.mimeType ?? "image/png";
  let blob: Blob | null;
  if (mimeType === "image/svg+xml") blob = new Blob([svg], { type: mimeType });
  else if (typeof globalThis.document === "undefined" || typeof globalThis.Image === "undefined") blob = null;
  else {
    blob = await new Promise<Blob | null>((resolve) => {
      const canvas = globalThis.document.createElement("canvas"); canvas.width = width; canvas.height = height;
      const context = canvas.getContext("2d"); if (context == null) { resolve(null); return; }
      const image = new globalThis.Image(); const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      image.onload = () => { context.drawImage(image, 0, 0, width, height); URL.revokeObjectURL(url); canvas.toBlob(resolve, mimeType); };
      image.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      image.src = url;
    });
  }
  return blob == null ? { kind: "unavailable" } : { kind: "success", blob, width, height, bounds: { x: bounds.x - padding, y: bounds.y - padding, width: bounds.width + padding * 2, height: bounds.height + padding * 2 } };
}

function createSketchEditor(options: CreateSketchOptions = {}): SketchEditor {
  let document = options.document ?? createDocument(); let tool = options.tool ?? "pen"; let eraserSize = clamp(options.eraserSizePx, 4, 96, 32); let drawingWidth = options.drawingWidthPx == null ? undefined : clamp(options.drawingWidthPx, 1, 32, 1); let textSize = options.textSizePx == null ? undefined : clamp(options.textSizePx, 8, 128, 24);
  let drawingStyle: SketchStyle = { color: options.style?.color ?? DEFAULT_STYLE.color, width: clamp(options.style?.width, 2, 48, DEFAULT_STYLE.width) }; let textStyle: SketchStyle = { color: drawingStyle.color, width: textSize ?? 24 }; let style = tool === "text" ? textStyle : drawingStyle; let textFormat = { ...DEFAULT_FORMAT };
  let selectionId: string | null = null; let pendingText: PendingTextEdit | null = null; let surfaceBounds: Bounds | null = null; let gesture: { pointerId: number; tool: SketchTool; start: Point; current: Point; points: Point[]; id: string } | null = null; let sequence = 0;
  const history: { before: SketchDocument; after: SketchDocument; selectionBefore: string | null; selectionAfter: string | null; group?: string }[] = []; let historyIndex = -1; const listeners = new Set<() => void>();
  for (const object of document.objects) { const match = /^(?:sketch-)?(\d+)$/.exec(object.id); if (match) sequence = Math.max(sequence, Number(match[1])); }
  const allocateId = (): string => `sketch-${++sequence}`;
  const selected = (): SketchObject | null => selectionId == null ? null : document.objects.find(object => object.id === selectionId) ?? null;
  const previewObject = (): SketchObject | null => { if (gesture == null || !DRAW_TOOLS.has(gesture.tool)) return null; const drawStyle = { ...style, width: gesture.tool === "eraser" ? eraserSize : drawingWidth ?? style.width }; if (gesture.tool === "pen") return { id: gesture.id, kind: "stroke", points: gesture.points, style: drawStyle }; if (gesture.tool === "eraser") return { id: gesture.id, kind: "eraser", points: gesture.points, width: drawStyle.width }; if (gesture.tool === "line" || gesture.tool === "arrow") return { id: gesture.id, kind: gesture.tool, from: gesture.start, to: gesture.current, style: drawStyle }; return { id: gesture.id, kind: gesture.tool as ShapeKind, bounds: { x: gesture.start.x, y: gesture.start.y, width: gesture.current.x - gesture.start.x, height: gesture.current.y - gesture.start.y }, style: drawStyle }; };
  const effectiveDocument = (): SketchDocument => { const preview = previewObject(); if (preview == null) return document; if (preview.kind === "eraser") return document; return createDocument([...document.objects, preview]); };
  const cursor = (): string => tool === "select" ? (selected() == null ? "default" : "move") : tool === "text" ? "text" : tool === "comment" ? "crosshair" : "crosshair";
  const snapshot = (): SketchSnapshot => ({ document, effectiveDocument: effectiveDocument(), hasPendingTextEdit: pendingText != null, activeTool: tool, eraserSizePx: eraserSize, drawingWidthPx: drawingWidth, textSizePx: textSize, style, textFormat, selectionId, canUndo: historyIndex >= 0 || gesture != null, canRedo: historyIndex < history.length - 1, hasActiveGesture: gesture != null, erasurePreview: null, preview: previewObject() == null ? null : { object: previewObject()! }, snapGuides: [], cursor: cursor() });
  let currentSnapshot = snapshot();
  const notify = (): void => { currentSnapshot = snapshot(); listeners.forEach(listener => listener()); };
  const commit = (next: SketchDocument, nextSelection = selectionId, group?: string): boolean => { if (JSON.stringify(next) === JSON.stringify(document)) return false; const previous = document; const previousSelection = selectionId; const last = history[historyIndex]; if (group != null && historyIndex === history.length - 1 && last?.group === group) history[historyIndex] = { ...last, after: next, selectionAfter: nextSelection }; else { history.splice(historyIndex + 1); history.push({ before: previous, after: next, selectionBefore: previousSelection, selectionAfter: nextSelection, group }); historyIndex += 1; } document = next; selectionId = nextSelection; notify(); return true; };
  const update = (id: string, mapper: (object: SketchObject) => SketchObject, group?: string): boolean => { const index = document.objects.findIndex(object => object.id === id); if (index < 0) return false; const objects = [...document.objects]; objects[index] = mapper(objects[index]!); return commit(createDocument(objects), id, group); };
  const select = (id: string | null): void => { selectionId = id; const object = selected(); if (object != null && "style" in object) style = { ...object.style }; if (object?.kind === "text") textFormat = { ...object.format }; notify(); };
  const finishGesture = (): boolean => { if (gesture == null) return false; const active = gesture; const preview = previewObject(); gesture = null; if (preview == null) { notify(); return true; } if (active.tool === "eraser") { const survivors = document.objects.filter(object => !active.points.some(point => hitTest(object, point, eraserSize / 2))); commit(createDocument(survivors), null); return true; } const meaningful = preview.kind === "stroke" ? preview.points.length > 0 : objectBounds(preview)?.width !== 0 || objectBounds(preview)?.height !== 0; if (!meaningful) { notify(); return true; } commit(createDocument([...document.objects, preview]), preview.id); if (active.tool !== "pen") { tool = "select"; notify(); } return true; };
  const editor: SketchEditor = {
    getSnapshot: () => currentSnapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    attachTextLayoutResources() { return () => undefined; },
    setPendingTextEdit(edit) { pendingText = edit == null ? null : { ...edit, text: edit.text.replaceAll("\r\n", "\n"), bounds: normalizeBounds(edit.bounds) }; notify(); },
    commitPendingTextEdit() { if (pendingText == null) return false; const edit = pendingText; pendingText = null; if (edit.objectId != null) return editor.updateTextBox(edit.objectId, { text: edit.text, bounds: edit.bounds }); return editor.insertTextBox(edit) != null; },
    discardPendingTextEdit() { if (pendingText == null) return false; pendingText = null; notify(); return true; },
    setTool(next) { if (tool === next) return; gesture = null; tool = next; style = tool === "text" ? textStyle : drawingStyle; if (next !== "select" && next !== "comment") selectionId = null; notify(); },
    setEraserSize(size) { const next = clamp(size, 4, 96, 32); if (next !== eraserSize) { eraserSize = next; notify(); } },
    setDrawingWidth(width) { const next = clamp(width, 1, 32, 1); if (next !== drawingWidth) { drawingWidth = next; notify(); } },
    setTextSize(size) { const next = clamp(size, 8, 128, 24); if (next !== textSize) { textSize = next; textStyle = { ...textStyle, width: next }; if (tool === "text") style = textStyle; notify(); } },
    setStyle(patch, config = {}) { const object = selected(); const next = { color: patch.color ?? style.color, width: clamp(patch.width, object?.kind === "text" || tool === "text" ? 8 : 2, object?.kind === "text" || tool === "text" ? 128 : 48, style.width) }; style = next; if (object?.kind === "text" || tool === "text") textStyle = next; else drawingStyle = next; if (object != null && "style" in object) { update(object.id, current => "style" in current ? { ...current, style: next } : current, config.historyGroup); return; } notify(); },
    setTextFormat(patch, config = {}) { textFormat = { ...textFormat, ...patch }; const object = selected(); if (object?.kind === "text") { update(object.id, current => current.kind === "text" ? { ...current, format: textFormat } : current, config.historyGroup); return; } notify(); },
    insertTextBox(input) { const text = input.text.replaceAll("\r\n", "\n").trim(); if (!text) return null; const id = allocateId(); const textObject: TextObject = { id, kind: "text", text, bounds: normalizeBounds(input.bounds), style: { ...textStyle, ...input.style }, format: { ...textFormat, ...input.format }, minHeight: input.minHeight, padding: input.padding }; tool = "select"; style = textObject.style; textFormat = textObject.format; return commit(createDocument([...document.objects, textObject]), id) ? id : null; },
    insertComment(input) { const text = input.text.trim(); const bounds = normalizeBounds(input.bounds); if (!text || bounds.width === 0 || bounds.height === 0) return null; const id = allocateId(); const comment: CommentObject = { id, kind: "comment", text, bounds }; if (tool !== "comment") tool = "select"; return commit(createDocument([...document.objects, comment]), id) ? id : null; },
    updateComment(id, text) { const trimmed = text.trim(); return trimmed !== "" && update(id, object => object.kind === "comment" ? { ...object, text: trimmed } : object); },
    pasteObject(object, pasteOptions = {}) { if (object.kind === "eraser") return null; const id = allocateId(); const offset = pasteOptions.offset ?? { x: 12, y: 12 }; const pasted = moveObject(cloneObject(object, id), offset); tool = "select"; return commit(createDocument([...document.objects, pasted]), id) ? id : null; },
    updateTextBox(id, input, config = {}) { return update(id, object => object.kind === "text" ? { ...object, text: input.text.replaceAll("\r\n", "\n"), bounds: input.bounds == null ? object.bounds : normalizeBounds(input.bounds) } : object, config.historyGroup); },
    selectObject(id) { const object = document.objects.find(item => item.id === id); if (object == null || object.kind === "eraser" || (tool === "comment" && object.kind !== "comment")) return false; gesture = null; select(id); return true; },
    deleteObject(id) { const objects = document.objects.filter(object => object.id !== id); return objects.length !== document.objects.length && commit(createDocument(objects), selectionId === id ? null : selectionId); },
    getObjectAtPoint(point, tolerance = 0) { return [...document.objects].reverse().find(object => object.kind !== "eraser" && hitTest(object, point, Math.max(0, tolerance))) ?? null; },
    clearSelection() { if (selectionId != null) select(null); },
    deleteSelection() { return selectionId == null ? false : editor.deleteObject(selectionId); },
    clear() { const hadTransientState = pendingText != null || gesture != null; pendingText = null; gesture = null; if (document.objects.length !== 0) return commit(createDocument(), null); if (hadTransientState) notify(); return hadTransientState; },
    undo() { if (gesture != null) { gesture = null; notify(); return true; } const entry = history[historyIndex]; if (entry == null) return false; document = entry.before; selectionId = entry.selectionBefore; historyIndex -= 1; notify(); return true; },
    redo() { const entry = history[historyIndex + 1]; if (entry == null) return false; document = entry.after; selectionId = entry.selectionAfter; historyIndex += 1; notify(); return true; },
    replaceDocument(next, config = {}) { document = next; selectionId = null; pendingText = null; gesture = null; if (!config.preserveHistory) { history.length = 0; historyIndex = -1; } notify(); },
    setSurfaceBounds(bounds) { surfaceBounds = bounds == null ? null : normalizeBounds(bounds); void surfaceBounds; },
    nudgeSelection(delta, config = {}) { const object = selected(); return object == null ? false : update(object.id, current => moveObject(current, delta), config.historyGroup); },
    pointerDown(input) { if (gesture != null || tool === "text") return false; if (tool === "select" || tool === "comment") { const object = editor.getObjectAtPoint(input.point, input.tolerance ?? 0); if (object == null || (tool === "comment" && object.kind !== "comment")) { editor.clearSelection(); return false; } select(object.id); gesture = { pointerId: input.pointerId, tool: "select", start: input.point, current: input.point, points: [input.point], id: object.id }; notify(); return true; } gesture = { pointerId: input.pointerId, tool, start: input.point, current: input.point, points: [input.point], id: allocateId() }; notify(); return true; },
    pointerMove(input) { if (gesture == null || gesture.pointerId !== input.pointerId) return false; gesture.current = input.point; if (gesture.tool === "pen" || gesture.tool === "eraser") gesture.points.push(input.point); notify(); return true; },
    pointerMoves(inputs) { let handled = false; for (const input of inputs) handled = editor.pointerMove(input) || handled; return handled; },
    pointerUp(input) { if (gesture == null || gesture.pointerId !== input.pointerId) return false; editor.pointerMove(input); if (gesture?.tool === "select") { const delta = { x: input.point.x - gesture.start.x, y: input.point.y - gesture.start.y }; gesture = null; return editor.nudgeSelection(delta); } return finishGesture(); },
    pointerCommit(pointerId) { return gesture == null || (pointerId != null && gesture.pointerId !== pointerId) ? false : finishGesture(); },
    pointerCancel(pointerId) { if (gesture == null || (pointerId != null && gesture.pointerId !== pointerId)) return false; gesture = null; notify(); return true; },
    pointerLeave() { return; },
    export(exportOptions = {}) { return gesture == null ? exportSketch(effectiveDocument(), { ...exportOptions, clipBounds: exportOptions.clipBounds ?? surfaceBounds ?? undefined }) : Promise.resolve({ kind: "busy" }); },
  };
  return editor;
}

function useSketchEditor(editor: SketchEditor): SketchSnapshot { React ??= getReactRuntime(); return React.useSyncExternalStore(editor.subscribe, editor.getSnapshot, editor.getSnapshot); }
function SketchSurface({ editor, surfaceSize, className, readOnly = false, backgroundColor = "#ffffff", ...props }: SketchSurfaceProps): unknown {
  jsxRuntime ??= getJsxRuntime(); const snapshot = useSketchEditor(editor);
  return jsxRuntime.jsx("div", { ...props, className, role: "application", "data-sketch-tool": snapshot.activeTool, "data-read-only": readOnly ? "true" : "false", style: { backgroundColor, height: surfaceSize.height, position: "relative", width: surfaceSize.width }, children: snapshot.effectiveDocument.objects.map(object => jsxRuntime!.jsx("div", { "data-kind": object.kind, "data-object-id": object.id }, object.id)) });
}
function initializeGeometry(): void {}
function initializeStyles(): void {}
function initializeTextLayout(): void {}
function initializeExportRuntime(): void {}
function initializeHookRuntime(): void { React ??= getReactRuntime(); }
function initializeSurfaceRuntime(): void { jsxRuntime ??= getJsxRuntime(); }
function initializeSketchCore(): void { initializeGeometry(); initializeStyles(); initializeTextLayout(); initializeExportRuntime(); }
function initializeSketch(): void { initializeSketchCore(); initializeHookRuntime(); initializeSurfaceRuntime(); }

export {
  initializeExportRuntime as a,
  initializeHookRuntime as c,
  commentsIn as d,
  initializeStyles as f,
  initializeGeometry as h,
  exportSketch as i,
  useSketchEditor as l,
  objectCenter as m,
  createSketchEditor as n,
  SketchSurface as o,
  normalizedCommentBounds as p,
  initializeSketchCore as r,
  initializeSurfaceRuntime as s,
  initializeSketch as t,
  initializeTextLayout as u,
};
