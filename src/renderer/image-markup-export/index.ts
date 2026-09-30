// Image markup rendering and local preview export. Release chunk: export-6cf67894f30b.js.
import "@rchunk/rolldown-runtime";
import * as appInitialChunk from "@rchunk/app-initial";
import * as sketchChunk from "@rchunk/sketch";
type Bounds = sketchChunk.Bounds;
type SketchDocument = sketchChunk.SketchDocument;
type SketchObject = sketchChunk.SketchObject;

interface AppInitialRuntime {
  Dan(blob: Blob): Promise<string>;
  Ert(source: string, options: { image: CanvasImageSource; signal: AbortSignal }): Promise<{ blob: Blob } | null>;
  krt(): void;
}
interface SuccessfulRender { kind: "success"; blob: Blob; width: number; height: number }
interface RenderResult { kind: string; blob?: Blob; width?: number; height?: number }
interface SketchRuntime {
  d(document: SketchDocument): Array<SketchObject & { text: string }>;
  i(document: SketchDocument, options: { outputBounds: Bounds; scale: number; maxDimension: number; maxPixelCount: number; padding: number; mimeType: "image/png"; drawBackground?: (context: CanvasRenderingContext2D, dimensions: { width: number; height: number }) => void }): Promise<RenderResult>;
  m(object: SketchObject & { text: string }): { x: number; y: number };
  t(): void;
}
interface ImageDimensions { width: number; height: number }
const appInitial = appInitialChunk as unknown as AppInitialRuntime;
const sketch = sketchChunk as unknown as SketchRuntime;
const maximumDimension = 1024;
const maximumPixelCount = 20_000_000;
const maximumTransparentOverlayBytes = 20 * 1024 * 1024;
let initialized = false;

function getMarkupSurfaceSize({ width, height }: ImageDimensions): ImageDimensions {
  const scale = maximumDimension / Math.max(width, height);
  return { width: width * scale, height: height * scale };
}
function formatPercentage(value: number): string {
  return (Math.min(Math.max(value, 0), 1) * 100).toFixed(1) + "%";
}
function isSuccessfulRender(rendered: RenderResult): rendered is SuccessfulRender {
  return rendered.kind === "success" && rendered.blob instanceof Blob && typeof rendered.width === "number" && typeof rendered.height === "number";
}
async function exportImageMarkup(document: SketchDocument, image: ImageDimensions, prompt: string, drawBackground?: (context: CanvasRenderingContext2D, dimensions: ImageDimensions) => void): Promise<{ overlay: Blob; promptText: string } | null> {
  const { width, height } = image;
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0 || width * height > maximumPixelCount) return null;
  const scale = Math.max(width, height) / maximumDimension;
  const rendered = await sketch.i(document, { outputBounds: { x: 0, y: 0, width: (width - 1e-6) / scale, height: (height - 1e-6) / scale }, scale, maxDimension: Math.max(width, height), maxPixelCount: width * height, padding: 0, mimeType: "image/png", drawBackground });
  if (!isSuccessfulRender(rendered) || rendered.width !== width || rendered.height !== height || (drawBackground == null && rendered.blob.size > maximumTransparentOverlayBytes)) return null;
  const surface = getMarkupSurfaceSize(image);
  const annotations = sketch.d(document).map((object, index) => {
    const point = sketch.m(object);
    return String(index + 1) + ". (x: " + formatPercentage(point.x / surface.width) + ", y: " + formatPercentage(point.y / surface.height) + ") " + object.text;
  });
  return { overlay: rendered.blob, promptText: [annotations.join("\n"), prompt.trim()].filter((value) => value.length > 0).join("\n\n") };
}
async function createLocalMarkupPreview(source: string, document: SketchDocument, signal: AbortSignal, image: CanvasImageSource): Promise<{ src: string; prompt: string } | null> {
  const downloaded = await appInitial.Ert(source, { image, signal });
  signal.throwIfAborted();
  if (downloaded == null) return null;
  const bitmap = await createImageBitmap(downloaded.blob);
  try {
    signal.throwIfAborted();
    const exported = await exportImageMarkup(document, bitmap, "", (context, dimensions) => context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height));
    signal.throwIfAborted();
    if (exported == null) return null;
    const src = await appInitial.Dan(exported.overlay);
    signal.throwIfAborted();
    return { src, prompt: exported.promptText };
  } finally { bitmap.close(); }
}
function initialize(): void {
  if (initialized) return;
  initialized = true;
  sketch.t();
  appInitial.krt();
}
export { initialize as i, exportImageMarkup as n, getMarkupSurfaceSize as r, createLocalMarkupPreview as t };
