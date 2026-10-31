// Mermaid node-size capture hook. Release chunk: sizeCapture-X5ZJPWSS-e07f13f62d02.js.
import "@rchunk/rolldown-runtime";
import * as namingRuntimeChunk from "@rchunk/chunk-Y2CYZVJY-24cce454fd91";

interface CaptureNode {
  id: string;
  width?: number | null;
  height?: number | null;
  isGroup?: boolean;
}

interface CaptureGraph {
  nodes: CaptureNode[];
}

interface SelectionNode {
  id?: string;
  ownerSVGElement?: { id?: string } | null;
}

interface Selection {
  node(): SelectionNode | null;
}

interface CapturedSizes {
  metadata: {
    captureVersion: number;
    capturedAt: string;
    capturedFrom: string;
  };
  nodes: Array<{ id: string; width: number; height: number }>;
}

interface CaptureRecord {
  svgId: string;
  sizes: CapturedSizes;
}

interface CaptureGlobal {
  mermaidCaptureSizes?: unknown;
  mermaidCapturedSizes?: CaptureRecord[];
  mermaidLastCapturedSizes?: CaptureRecord;
}

interface NamingRuntime {
  n(value: (...arguments_: never[]) => unknown, name: string): void;
  r(): void;
}

const namingRuntime = namingRuntimeChunk as unknown as NamingRuntime;
let captureVersion: number;

function getCaptureGlobal(): (typeof globalThis & CaptureGlobal) | undefined {
  if (typeof globalThis === "undefined") return undefined;
  return globalThis as typeof globalThis & CaptureGlobal;
}

function shouldCaptureSizes(): boolean {
  return Boolean(getCaptureGlobal()?.mermaidCaptureSizes);
}

function capturedFromLocation(): string {
  return typeof location === "undefined"
    ? "browser-dev"
    : `${location.pathname}${location.search}`;
}

function emitCapturedSizes(sizes: CapturedSizes, selection: Selection): void {
  const captureGlobal = getCaptureGlobal();
  if (!captureGlobal) return;
  const selectedNode = selection.node();
  const svgNode = selectedNode?.ownerSVGElement ?? selectedNode;
  const svgId = svgNode?.id ?? "(unknown)";
  captureGlobal.mermaidCapturedSizes ??= [];
  const record = { svgId, sizes };
  captureGlobal.mermaidCapturedSizes.push(record);
  captureGlobal.mermaidLastCapturedSizes = record;
}

function captureNodeSizes(selection: Selection, graph: CaptureGraph): void {
  const nodes: CapturedSizes["nodes"] = [];
  for (const node of graph.nodes) {
    if (!node.isGroup) {
      nodes.push({
        id: node.id,
        width: node.width ?? 0,
        height: node.height ?? 0,
      });
    }
  }
  if (nodes.length === 0) return;
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

let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  namingRuntime.r();
  captureVersion = 1;
  namingRuntime.n(getCaptureGlobal, "getCaptureGlobal");
  namingRuntime.n(shouldCaptureSizes, "shouldCaptureSizes");
  namingRuntime.n(capturedFromLocation, "capturedFromLocation");
  namingRuntime.n(emitCapturedSizes, "emitCapturedSizes");
  namingRuntime.n(captureNodeSizes, "captureNodeSizes");
}

initialize();

export { captureNodeSizes };
