export const MAX_RICH_PREVIEW_BYTES = 40 * 1024 * 1024;

export type LibraryPreviewKind =
  | "artifact"
  | "html"
  | "image"
  | "markdown"
  | "pdf"
  | "text"
  | "unsupported";

export type LibraryPreviewState =
  | "error"
  | "hidden"
  | "image-error"
  | "loading"
  | "missing-size"
  | "ready"
  | "too-large"
  | "unsupported";

export type LibraryPreviewRenderer =
  | "artifact"
  | "image"
  | "none"
  | "text-document"
  | "unsupported";

export interface LibraryPreviewDecisionInput {
  error?: string | null;
  hasPreview?: boolean;
  imagePreviewIsError?: boolean;
  imagePreviewIsPending?: boolean;
  isLoading?: boolean;
  kind: LibraryPreviewKind;
  sizeBytes?: number | null;
}

export interface LibraryPreviewDecision {
  canAsk: boolean;
  renderer: LibraryPreviewRenderer;
  state: LibraryPreviewState;
}

const ARTIFACT_KINDS = new Set<LibraryPreviewKind>(["artifact", "pdf"]);
const TEXT_KINDS = new Set<LibraryPreviewKind>(["html", "markdown", "text"]);

export function resolveLibraryPreviewDecision(
  input: LibraryPreviewDecisionInput,
): LibraryPreviewDecision {
  if (input.isLoading) return { canAsk: false, renderer: "none", state: "loading" };
  if (input.error != null) return { canAsk: false, renderer: "none", state: "error" };

  if (input.kind === "image") {
    if (input.sizeBytes != null && input.sizeBytes > MAX_RICH_PREVIEW_BYTES) {
      return { canAsk: true, renderer: "unsupported", state: "too-large" };
    }
    if (input.sizeBytes == null) {
      return { canAsk: true, renderer: "unsupported", state: "missing-size" };
    }
    if (input.imagePreviewIsPending) {
      return { canAsk: false, renderer: "none", state: "loading" };
    }
    if (input.imagePreviewIsError) {
      return { canAsk: true, renderer: "unsupported", state: "image-error" };
    }
    if (!input.hasPreview) {
      return { canAsk: false, renderer: "none", state: "hidden" };
    }
    return { canAsk: true, renderer: "image", state: "ready" };
  }

  if (ARTIFACT_KINDS.has(input.kind)) {
    return { canAsk: true, renderer: "artifact", state: "ready" };
  }
  if (TEXT_KINDS.has(input.kind)) {
    return { canAsk: true, renderer: "text-document", state: "ready" };
  }
  if (input.hasPreview) {
    return { canAsk: true, renderer: "unsupported", state: "ready" };
  }
  return { canAsk: true, renderer: "unsupported", state: "unsupported" };
}

function normalizedMimeType(mimeType?: string | null): string {
  return mimeType?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

function extension(fileName: string): string {
  return /\.([^.]+)$/u.exec(fileName.toLowerCase())?.[1] ?? "";
}

const ARTIFACT_EXTENSIONS = new Set(["csv", "docx", "pptx", "tsv", "xlsx"]);
const TEXT_EXTENSIONS = new Set([
  "c", "conf", "cpp", "css", "go", "h", "hpp", "java", "js", "json", "jsonl",
  "jsx", "log", "py", "rb", "rs", "sh", "ts", "tsx", "txt", "xml", "yaml", "yml",
]);

export function inferLibraryPreviewKind(file: {
  category?: string | null;
  fileName: string;
  kind?: string | null;
  mimeType?: string | null;
}): LibraryPreviewKind {
  const explicit = file.kind;
  if (
    explicit === "artifact" || explicit === "html" || explicit === "image" ||
    explicit === "markdown" || explicit === "pdf" || explicit === "text" ||
    explicit === "unsupported"
  ) return explicit;

  const mimeType = normalizedMimeType(file.mimeType);
  const ext = extension(file.fileName);
  if (file.category === "image" || mimeType.startsWith("image/")) return "image";
  if (file.category === "pdf" || mimeType === "application/pdf" || ext === "pdf") return "pdf";
  if (
    ARTIFACT_EXTENSIONS.has(ext) ||
    mimeType === "application/vnd.ms-excel.sheet.macroenabled.12" ||
    mimeType.startsWith("application/vnd.openxmlformats-officedocument") ||
    mimeType === "text/csv" || mimeType === "text/tab-separated-values"
  ) return "artifact";
  if (ext === "md" || mimeType === "text/markdown") return "markdown";
  if (ext === "html" || ext === "htm" || mimeType === "text/html") return "html";
  if (file.category === "text" || mimeType.startsWith("text/") || TEXT_EXTENSIONS.has(ext)) return "text";
  return "unsupported";
}
