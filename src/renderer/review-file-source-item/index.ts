import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/diff-file-view";
import "@rchunk/artifact-preview-header";
import "@rchunk/codex-diff-css";
import "@rchunk/compact-empty-state";
import "@rchunk/diff-source";
import "@rchunk/file-blank-icon";
import "@rchunk/file-diff-alt";
import "@rchunk/file-viewer-frame";
import "@rchunk/register-pierre-themes";
import "@rchunk/review-diff-virtualizer-metrics";
import "@rchunk/review-file-source-breadcrumb";
import "@rchunk/review-file-tree-side-pane";
import "@rchunk/review-preferences-model";
import "@rchunk/scroll-to-match";
import "@rchunk/code-diff-context-menu";

type PreviewKind = "audio" | "image" | "pdf" | "presentation" | "spreadsheet" | "text" | "video" | "word-document";
interface ReviewFileSourceProps { contents?: string | null; contentKind?: string | null; cwd?: string | null; error?: unknown; headerActions?: unknown; hideFileNavigation?: boolean; hostId?: string; isActive?: boolean; isLoading?: boolean; onOpenLocation?(location: unknown): void; onSelectFile?(path: string, options?: { preview?: boolean }): void; path?: string | null; renderSlots?(slots: { content: unknown; headerRows: unknown[] }): unknown; sourceUrl?: string | null; workspaceRoot?: string | null; workspaceRoots?: string[] }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function previewKind(path: string, contentKind?: string | null): PreviewKind { const extension = path.split(".").at(-1)?.toLowerCase(); if (contentKind?.startsWith("image/") || ["gif", "jpeg", "jpg", "png", "svg", "webp"].includes(extension ?? "")) return "image"; if (contentKind === "application/pdf" || extension === "pdf") return "pdf"; if (contentKind?.startsWith("audio/") || ["aac", "flac", "m4a", "mp3", "ogg", "wav"].includes(extension ?? "")) return "audio"; if (contentKind?.startsWith("video/") || ["m4v", "mov", "mp4", "webm"].includes(extension ?? "")) return "video"; if (["ppt", "pptx"].includes(extension ?? "")) return "presentation"; if (["xls", "xlsx"].includes(extension ?? "")) return "spreadsheet"; if (["doc", "docx"].includes(extension ?? "")) return "word-document"; return "text"; }
function displayPath(path: string, workspaceRoot: string | null): string {
  if (workspaceRoot == null || path === workspaceRoot || path.startsWith(`${workspaceRoot.replace(/\/$/u, "")}/`)) return path;
  return `${workspaceRoot.replace(/\/$/u, "")}/${path.replace(/^\//u, "")}`;
}
function preview(kind: PreviewKind, path: string, contents: string | null, sourceUrl: string | null): unknown {
  const source = sourceUrl ?? path;
  if (kind === "text") return jsx().jsx("pre", { "data-preview-kind": kind, children: contents ?? "" });
  if (kind === "image") return jsx().jsx("div", { "data-preview-kind": kind, children: jsx().jsx("img", { alt: path.split(/[\\/]/u).at(-1) ?? path, "data-preview-kind": kind, src: source }) });
  if (kind === "audio") return jsx().jsx("div", { "data-preview-kind": kind, children: jsx().jsx("audio", { controls: true, "data-preview-kind": kind, src: source }) });
  if (kind === "video") return jsx().jsx("div", { "data-preview-kind": kind, children: jsx().jsx("video", { controls: true, "data-preview-kind": kind, src: source }) });
  return jsx().jsx("div", { "data-preview-kind": kind, children: `${kind} preview` });
}
function t({ contents = null, contentKind = null, error = null, headerActions = null, hideFileNavigation = false, isActive = true, isLoading = false, onSelectFile, path = null, renderSlots, sourceUrl = null, workspaceRoot = null }: ReviewFileSourceProps): unknown {
  if (isLoading) return jsx().jsx("div", { role: "status", children: "Loading file" });
  if (error != null) return jsx().jsx("div", { role: "alert", children: error instanceof Error ? error.message : String(error) });
  if (path == null) return jsx().jsx("div", { children: "Select a file" });
  const kind = previewKind(path, contentKind);
  const filePreview = preview(kind, path, contents, sourceUrl);
  const header = jsx().jsxs("header", {
    children: [
      displayPath(path, workspaceRoot),
      headerActions,
      hideFileNavigation ? null : jsx().jsx("button", {
        onClick: () => onSelectFile?.(path, { preview: true }),
        type: "button",
        children: "Reveal file",
      }),
    ],
  });
  const view = jsx().jsxs("article", {
    "aria-label": path,
    "data-active": isActive,
    children: [header, filePreview],
  });
  return renderSlots?.({ content: view, headerRows: hideFileNavigation || contents == null ? [] : [header] }) ?? view;
}
let initialized = false;
function n(): void { initialized = true; }
export { n, t };
