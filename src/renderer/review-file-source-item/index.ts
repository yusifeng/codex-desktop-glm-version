import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/codex-diff-css";
import "@rchunk/register-pierre-themes";
import "@rchunk/File";
import "@rchunk/artifact-preview-header";
import "@rchunk/diff-source";
import "@rchunk/compact-empty-state";
import "@rchunk/review-preferences-model";
import "@rchunk/code-diff-context-menu";
import "@rchunk/file-diff";
import "@rchunk/review-file-tree-side-pane";
import "@rchunk/review-file-source-breadcrumb";
import "@rchunk/file-blank";
import "@rchunk/file-viewer-frame";
import "@rchunk/review-diff-virtualizer-metrics";
import "@rchunk/scroll-to-match";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import { t as FileBreadcrumb } from "@rchunk/review-file-source-breadcrumb";

type Node = unknown;
export type PreviewKind = "audio" | "image" | "pdf" | "presentation" | "spreadsheet" | "text" | "video" | "word-document";
export interface ReviewFileSourceProps { contents?: string | null; contentKind?: string | null; cwd?: string | null; error?: unknown; headerActions?: Node; hideFileNavigation?: boolean; hostId?: string; initialColumn?: number; initialEndLine?: number; initialLine?: number; isActive?: boolean; isLoading?: boolean; onOpenLocation?(location: unknown): void; onSelectFile?(path: string, options?: { preview?: boolean }): void; path?: string | null; renderSlots?(slots: { content: Node; headerRows: Node[] }): Node; workspaceRoot?: string | null; workspaceRoots?: string[] }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function previewKind(path: string, contentKind?: string | null): PreviewKind { const extension = path.split(".").at(-1)?.toLocaleLowerCase(); if (contentKind === "image" || ["gif", "jpeg", "jpg", "png", "svg", "webp"].includes(extension ?? "")) return "image"; if (contentKind === "audio" || ["mp3", "wav", "m4a"].includes(extension ?? "")) return "audio"; if (contentKind === "video" || ["mp4", "mov", "webm"].includes(extension ?? "")) return "video"; if (extension === "pdf") return "pdf"; if (["ppt", "pptx"].includes(extension ?? "")) return "presentation"; if (["xls", "xlsx", "csv"].includes(extension ?? "")) return "spreadsheet"; if (["doc", "docx", "rtf"].includes(extension ?? "")) return "word-document"; return "text"; }
function isTooLarge(sizeBytes: number | null | undefined): boolean { return sizeBytes != null && sizeBytes > 10 * 1024 * 1024; }
function ReviewFileSource(props: ReviewFileSourceProps): Node { const { contents, contentKind, error, headerActions, hideFileNavigation = false, isLoading = false, onSelectFile, path, renderSlots, workspaceRoot, cwd } = props; let content: Node; if (path == null) content = jsx().jsx("p", { role: "status", children: "Select a file" }); else if (error != null) content = jsx().jsx("p", { role: "alert", children: error instanceof Error ? error.message : "Unable to load file" }); else if (isLoading) content = jsx().jsx("p", { role: "status", children: "Loading file…" }); else { const kind = previewKind(path, contentKind); content = kind === "text" ? jsx().jsx("pre", { "data-preview-kind": kind, children: contents ?? "" }) : ["image", "audio", "video"].includes(kind) ? jsx().jsx(kind === "image" ? "img" : kind, { "data-preview-kind": kind, src: path, alt: kind === "image" ? path.split("/").at(-1) : undefined, controls: kind !== "image" || undefined }) : jsx().jsx("div", { "data-preview-kind": kind, children: `${kind} preview` }); }
  const headerRows = hideFileNavigation ? [] : [jsx().jsx(FileBreadcrumb, { cwd, path, workspaceRoot, onSelectFile, hostId: props.hostId, pathActions: headerActions })]; return renderSlots?.({ headerRows, content }) ?? jsx().jsxs("article", { children: [...headerRows, content] }); }
function initializeReviewFileSource(): void {}
export { initializeReviewFileSource as n, ReviewFileSource as t };
void isTooLarge;
