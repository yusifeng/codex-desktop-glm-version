import type { LibraryPreviewKind, LibraryPreviewRenderer } from "./preview-state";

export type LibraryPreviewRenderModel =
  | { content: unknown; kind: "artifact"; renderer: LibraryPreviewRenderer }
  | { content: string; kind: "html" | "json" | "markdown" | "text"; renderer: LibraryPreviewRenderer }
  | { kind: "image"; renderer: LibraryPreviewRenderer; source: string }
  | { kind: "pdf"; renderer: LibraryPreviewRenderer; source: string | null }
  | { content: unknown; kind: "unsupported"; renderer: LibraryPreviewRenderer };

function textContent(content: unknown): string {
  return typeof content === "string" ? content : String(content ?? "");
}

/** Projects loaded content onto the concrete renderer used by the right-side file preview. */
export function projectLibraryPreviewRenderModel(input: {
  binaryUrl: string | null;
  content: unknown;
  downloadUrl?: string;
  fileName: string;
  kind: LibraryPreviewKind;
  renderer: LibraryPreviewRenderer;
}): LibraryPreviewRenderModel {
  if (input.kind === "image") {
    return { kind: "image", renderer: input.renderer, source: typeof input.content === "string" ? input.content : input.downloadUrl ?? "" };
  }
  if (input.kind === "pdf") {
    return { kind: "pdf", renderer: input.renderer, source: typeof input.content === "string" ? input.content : input.binaryUrl };
  }
  if (input.kind === "html") return { content: textContent(input.content), kind: "html", renderer: input.renderer };
  if (input.kind === "markdown") return { content: textContent(input.content), kind: "markdown", renderer: input.renderer };
  if (input.kind === "text") {
    const normalizedName = input.fileName.toLowerCase();
    return { content: textContent(input.content), kind: normalizedName.endsWith(".json") ? "json" : "text", renderer: input.renderer };
  }
  if (input.kind === "artifact") return { content: input.content, kind: "artifact", renderer: input.renderer };
  return { content: input.content, kind: "unsupported", renderer: input.renderer };
}
