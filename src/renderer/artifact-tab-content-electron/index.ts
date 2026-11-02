import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/spreadsheet-editor";
import "@rchunk/app-primary";
import "@rchunk/artifact-annotation-batch-controls";
import "@rchunk/artifact-layout";
import "@rchunk/editor-header";
import "@rchunk/artifact-feedback-button";
import "@rchunk/artifact-annotation-comment";
import "@rchunk/sidebar-panel";
import "@rchunk/presentation-annotation-cursor-coachmark";
import "@rchunk/presentation-annotation-coachmark";
import "@rchunk/open-in-library-item";
import "@rchunk/version-history";
import "@rchunk/header-content-fade";
import "@rchunk/artifact-originating-turn";
import "@rchunk/artifact-preview-header";
import "@rchunk/review-file-source-item";
import "@rchunk/artifact-preview-status";
import "@rchunk/artifact-preview-zoom";
import "@rchunk/right-panel-composer-overlay-alignment";
import "@rchunk/vite-browser-external";
import "@rchunk/artifact-workbook-model-runtime";
import "@rchunk/artifact-document-model-runtime";
import "@rchunk/artifact-presentation-model-runtime";
import "@rchunk/artifact-spreadsheet-model-runtime";
import "@rchunk/popcorn-presentation-panel";
import "@rchunk/popcorn-workbook-panel";
import "@rchunk/popcorn-document-panel";
import "@rchunk/docx-preview-panel";
import "@rchunk/notebook-preview-panel";
import "@rchunk/pdf-preview-panel";
type ArtifactKind = "document" | "presentation" | "site" | "spreadsheet" | "text";
type ImportKind = "csv" | "docx" | "ipynb" | "pdf" | "pptx" | "tex" | "tsv" | "xlsx";
interface ArtifactTabProps {
  annotations?: Array<{ body?: string; id: string; label?: string; prompt?: string }>;
  artifactKind?: ArtifactKind;
  content?: unknown;
  disableAnnotations?: boolean;
  error?: string | null;
  importKind?: ImportKind;
  isLoading?: boolean;
  kind?: ArtifactKind;
  parsedArtifact?: { kind?: ArtifactKind; proto?: unknown; sourceBytes?: Uint8Array } | null;
  path?: string;
  renderLayout?(slots: { content: unknown; header: unknown }): unknown;
  sourceUrl?: string | null;
  status?: string;
  title?: string;
  version?: string | null;
  onClose?(): void;
  onDownload?(): void;
  onRefresh?(): void;
  onRequestEdit?(prompt: string): void;
  onRetry?(): void;
  onShare?(): void;
}
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function parseDelimited(text: string, separator: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === separator && !quoted) {
      row.push(cell); cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += character;
  }
  if (cell.length > 0 || row.length > 0) { row.push(cell); rows.push(row); }
  return rows;
}

async function parseArtifactSource(bytes: Uint8Array, importKind: ImportKind): Promise<{ kind: ArtifactKind; proto?: unknown; sourceBytes?: Uint8Array }> {
  switch (importKind) {
    case "csv":
    case "tsv": {
      const rows = parseDelimited(new TextDecoder().decode(bytes), importKind === "csv" ? "," : "\t");
      return { kind: "spreadsheet", proto: { sheets: [{ name: "Sheet1", rows }] } };
    }
    case "docx": return { kind: "document", sourceBytes: bytes };
    case "pptx": return { kind: "presentation", sourceBytes: bytes };
    case "xlsx": return { kind: "spreadsheet", sourceBytes: bytes };
    case "ipynb": throw new Error("Notebook preview should use NotebookPreviewPanel");
    case "pdf":
    case "tex": throw new Error("PDF preview should use PdfPreviewPanel");
  }
}

function renderArtifactBody(kind: ArtifactKind, content: unknown, sourceUrl: string | null | undefined): unknown {
  if (kind === "site" && sourceUrl != null) return jsx().jsx("iframe", { sandbox: "allow-forms allow-modals allow-popups allow-same-origin allow-scripts", src: sourceUrl, title: "Artifact preview" });
  if (kind === "text" && typeof content === "string") return jsx().jsx("pre", { children: content });
  if (kind === "spreadsheet" && Array.isArray(content)) return jsx().jsx("table", { children: content.map((row, rowIndex) => jsx().jsx("tr", { children: Array.isArray(row) ? row.map((cell, cellIndex) => jsx().jsx("td", { children: String(cell ?? "") }, cellIndex)) : jsx().jsx("td", { children: String(row ?? "") }) }, rowIndex)) });
  if (kind === "presentation" && Array.isArray(content)) return jsx().jsx("ol", { "aria-label": "Slides", children: content.map((slide, index) => jsx().jsx("li", { "data-slide-number": index + 1, children: slide }, index)) });
  return content;
}

function ArtifactPreviewPanel(props: ArtifactTabProps): unknown {
  initializeArtifactTabContent();
  const annotations = props.annotations ?? [];
  const error = props.error ?? null;
  const kind = props.artifactKind ?? props.kind ?? props.parsedArtifact?.kind ?? "document";
  const status = props.status ?? "ready";
  const title = props.title ?? props.path?.split(/[\\/]/u).at(-1) ?? "Artifact";
  if (props.isLoading) return jsx().jsx("div", { role: "status", children: "Loading artifact" });
  if (error != null) return jsx().jsxs("div", { role: "alert", children: [error, jsx().jsx("button", { onClick: props.onRetry, type: "button", children: "Try again" })] });
  const header = jsx().jsxs("header", {
    children: [
      jsx().jsx("h2", { children: title }),
      props.version == null ? null : jsx().jsx("span", { children: props.version }),
      props.onRefresh == null ? null : jsx().jsx("button", { onClick: props.onRefresh, type: "button", children: "Refresh" }),
      props.onShare == null ? null : jsx().jsx("button", { onClick: props.onShare, type: "button", children: "Share" }),
      jsx().jsx("button", { onClick: props.onDownload, type: "button", children: "Download" }),
      jsx().jsx("button", { onClick: props.onClose, type: "button", children: "Close" }),
    ],
  });
  const source = props.content ?? props.parsedArtifact?.proto ?? props.parsedArtifact?.sourceBytes ?? null;
  const body = jsx().jsx("div", { "data-status": status, children: renderArtifactBody(kind, source, props.sourceUrl) });
  const comments = props.disableAnnotations || annotations.length === 0 ? null : jsx().jsx("ul", {
    "aria-label": "Artifact annotations",
    children: annotations.map((annotation) => jsx().jsx("li", {
      children: jsx().jsx("button", {
        onClick: () => props.onRequestEdit?.(annotation.prompt ?? annotation.body ?? ""),
        type: "button",
        children: annotation.prompt ?? annotation.label ?? "Ask for change",
      }),
    }, annotation.id)),
  });
  const view = jsx().jsxs("section", { "aria-label": title, "data-artifact-kind": kind, children: [header, body, comments] });
  return props.renderLayout?.({ content: view, header }) ?? view;
}

function ArtifactTabContent(props: ArtifactTabProps): unknown {
  return ArtifactPreviewPanel(props);
}

let parserInitialized = false;
let annotationInitialized = false;
let initialized = false;
function initializeArtifactParser(): void { parserInitialized = true; }
function initializeArtifactAnnotations(): void { annotationInitialized = true; }
function initializeArtifactTabContent(): void {
  if (initialized) return;
  initialized = true;
  initializeArtifactParser();
  initializeArtifactAnnotations();
  void jsx();
}
function artifactAnnotationsEnabled(input?: { annotationsEnabled?: boolean } | boolean): boolean {
  return typeof input === "boolean" ? input : input?.annotationsEnabled ?? true;
}

export {
  parseArtifactSource as a,
  initializeArtifactParser as i,
  ArtifactTabContent as n,
  initializeArtifactAnnotations as o,
  initializeArtifactTabContent as r,
  artifactAnnotationsEnabled as s,
  ArtifactPreviewPanel as t,
};
