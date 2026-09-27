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
interface ReviewFileSourceProps { contents?: string | null; contentKind?: string | null; cwd?: string | null; error?: unknown; headerActions?: unknown; hideFileNavigation?: boolean; hostId?: string; isActive?: boolean; isLoading?: boolean; onOpenLocation?(location: unknown): void; onSelectFile?(path: string, options?: { preview?: boolean }): void; path?: string | null; renderSlots?(slots: { content: unknown; headerRows: unknown[] }): unknown; workspaceRoot?: string | null; workspaceRoots?: string[] }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function previewKind(path: string, contentKind?: string | null): PreviewKind { const extension = path.split(".").at(-1)?.toLowerCase(); if (contentKind?.startsWith("image/") || ["gif", "jpeg", "jpg", "png", "svg", "webp"].includes(extension ?? "")) return "image"; if (contentKind === "application/pdf" || extension === "pdf") return "pdf"; if (contentKind?.startsWith("audio/")) return "audio"; if (contentKind?.startsWith("video/")) return "video"; if (["ppt", "pptx"].includes(extension ?? "")) return "presentation"; if (["xls", "xlsx"].includes(extension ?? "")) return "spreadsheet"; if (["doc", "docx"].includes(extension ?? "")) return "word-document"; return "text"; }
function t({ contents = null, contentKind = null, error = null, headerActions = null, hideFileNavigation = false, isActive = true, isLoading = false, onSelectFile, path = null, renderSlots, workspaceRoot = null }: ReviewFileSourceProps): unknown { if (isLoading) return jsx().jsx("div", { role: "status", children: "Loading file" }); if (error != null) return jsx().jsx("div", { role: "alert", children: error instanceof Error ? error.message : String(error) }); if (path == null) return jsx().jsx("div", { children: "Select a file" }); const kind = previewKind(path, contentKind); const content = kind === "text" ? jsx().jsx("pre", { children: contents ?? "" }) : jsx().jsx("div", { "data-preview-kind": kind, children: `${kind} preview` }); const view = jsx().jsxs("section", { "aria-label": path, "data-active": isActive, children: [jsx().jsxs("header", { children: [workspaceRoot == null ? path : `${workspaceRoot}/${path}`, headerActions] }), hideFileNavigation ? null : jsx().jsx("button", { onClick: () => onSelectFile?.(path, { preview: true }), type: "button", children: "Reveal file" }), content] }); return renderSlots?.({ content: view, headerRows: [] }) ?? view; }
function n(): void {}
export { n, t };
