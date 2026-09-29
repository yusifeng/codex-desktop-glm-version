// Mermaid node-size capture runtime. Release chunk: sizeCapture-X5ZJPWSS-35cad884972a.js.
import { n as setFunctionName } from "@rchunk/mermaid-function-name-runtime";

interface CapturedNodeSize {
  id: string;
  width: number;
  height: number;
}
interface CapturedSizes {
  metadata: { captureVersion: 1; capturedAt: string; capturedFrom: string };
  nodes: CapturedNodeSize[];
}
type CaptureGlobal = typeof globalThis & {
  mermaidCaptureSizes?: unknown;
  mermaidCapturedSizes?: Array<{ svgId: string; sizes: CapturedSizes }>;
  mermaidLastCapturedSizes?: { svgId: string; sizes: CapturedSizes };
};
interface SelectionLike {
  node(): { id?: string; ownerSVGElement?: { id?: string } | null } | null;
}
interface LayoutNode {
  id: string;
  width?: number | null;
  height?: number | null;
  isGroup?: boolean;
}

const captureVersion = 1;
function getCaptureGlobal(): CaptureGlobal | undefined {
  return typeof globalThis === "undefined"
    ? undefined
    : (globalThis as CaptureGlobal);
}
setFunctionName(getCaptureGlobal, "getCaptureGlobal");
function shouldCaptureSizes(): boolean {
  return Boolean(getCaptureGlobal()?.mermaidCaptureSizes);
}
setFunctionName(shouldCaptureSizes, "shouldCaptureSizes");
function capturedFromLocation(): string {
  return typeof location === "undefined"
    ? "browser-dev"
    : location.pathname + location.search;
}
setFunctionName(capturedFromLocation, "capturedFromLocation");
function emitCapturedSizes(
  sizes: CapturedSizes,
  selection: SelectionLike,
): void {
  const captureGlobal = getCaptureGlobal();
  if (!captureGlobal) return;
  const node = selection.node();
  const svgId =
    ((node && "ownerSVGElement" in node ? node.ownerSVGElement : null) ?? node)
      ?.id ?? "(unknown)";
  captureGlobal.mermaidCapturedSizes ??= [];
  const captured = { svgId, sizes };
  captureGlobal.mermaidCapturedSizes.push(captured);
  captureGlobal.mermaidLastCapturedSizes = captured;
}
setFunctionName(emitCapturedSizes, "emitCapturedSizes");
function captureNodeSizes(
  selection: SelectionLike,
  layout: { nodes: LayoutNode[] },
): void {
  const nodes: CapturedNodeSize[] = [];
  for (const node of layout.nodes) {
    if (!node.isGroup)
      nodes.push({
        id: node.id,
        width: node.width ?? 0,
        height: node.height ?? 0,
      });
  }
  if (nodes.length !== 0) {
    emitCapturedSizes(
      {
        metadata: {
          captureVersion,
          capturedAt: new Date().toISOString(),
          capturedFrom: capturedFromLocation(),
        },
        nodes,
      },
      selection,
    );
  }
}
setFunctionName(captureNodeSizes, "captureNodeSizes");

export { captureNodeSizes };
