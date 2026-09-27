import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/artifact-tab-content-electron";
import "@rchunk/editor-header";
import "@rchunk/header-content-fade";
import "@rchunk/surface";
import "@rchunk/lazy-version-history";
import "@rchunk/use-chatgpt-composer-controller";
import "@rchunk/right-panel-composer-overlay";
import "@rchunk/artifact-entry";
import "@rchunk/library-multiplayer-access";
import "@rchunk/editor-header-controls";
import "@rchunk/loading-controls";
import "@rchunk/library-file-preview-kind";
import "@rchunk/preview-layout";
import "@rchunk/library-file-download";
import "@rchunk/library-file-preview-loading";
import "@rchunk/docx-preview-panel";
import "@rchunk/library-json-preview";
interface CloudFile { fileId: string; fileName: string; favorite?: boolean; kind?: string | null; sizeBytes?: number | null }
interface CloudFilePreviewProps { error?: string | null; file: CloudFile; isLoading?: boolean; maxLocalTaskBytes?: number; preview?: unknown; onAsk?(file: CloudFile): void; onClose?(): void; onDownload?(file: CloudFile): Promise<void> | void; onFavoriteChange?(favorite: boolean): void; onRetry?(): void; onShare?(file: CloudFile): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function previewState({ error, isLoading, preview }: Pick<CloudFilePreviewProps, "error" | "isLoading" | "preview">): "error" | "loading" | "ready" | "unsupported" { if (isLoading) return "loading"; if (error != null) return "error"; return preview == null ? "unsupported" : "ready"; }
function LibraryCloudFilePreview(props: CloudFilePreviewProps): unknown { const { file, maxLocalTaskBytes = 20 * 1024 * 1024, onAsk, onClose, onDownload, onFavoriteChange, onRetry, onShare } = props; const state = previewState(props); const tooLarge = file.sizeBytes != null && file.sizeBytes > maxLocalTaskBytes; return jsx().jsxs("section", { "aria-label": file.fileName, "data-preview-state": state, children: [jsx().jsxs("header", { children: [jsx().jsx("h2", { children: file.fileName }), jsx().jsx("button", { onClick: () => onFavoriteChange?.(!file.favorite), type: "button", children: file.favorite ? "Remove from Favorites" : "Add to Favorites" }), jsx().jsx("button", { onClick: onClose, type: "button", children: "Close" })] }), state === "loading" ? jsx().jsx("div", { role: "status", children: "Loading preview" }) : state === "error" ? jsx().jsxs("div", { role: "alert", children: [props.error, jsx().jsx("button", { onClick: onRetry, type: "button", children: "Retry" })] }) : state === "unsupported" ? jsx().jsx("p", { children: "Preview not available" }) : props.preview, tooLarge ? jsx().jsx("p", { role: "note", children: "File too large for a local task" }) : jsx().jsx("button", { onClick: () => onAsk?.(file), type: "button", children: "Ask about this file" }), jsx().jsx("button", { onClick: () => onDownload?.(file), type: "button", children: "Download file" }), jsx().jsx("button", { onClick: () => onShare?.(file), type: "button", children: "Share file" })] }); }
function initializeLibraryFilePreviewShell(): void { void jsx(); }
function initializeLibraryFilePreviewRenderers(): void { void jsx(); }
function initializeLibraryCloudFilePreview(): void { initializeLibraryFilePreviewShell(); initializeLibraryFilePreviewRenderers(); }
const UnsupportedLibraryFilePreview = LibraryCloudFilePreview;
const LibraryFilePreviewBody = LibraryCloudFilePreview;
const LibraryFilePreview = LibraryCloudFilePreview;
const LibraryFilePreviewShell = LibraryCloudFilePreview;
const LibraryFilePreviewComposer = LibraryCloudFilePreview;
export { UnsupportedLibraryFilePreview as a, initializeLibraryFilePreviewShell as c, LibraryFilePreviewBody as i, LibraryFilePreview as n, initializeLibraryFilePreviewRenderers as o, initializeLibraryCloudFilePreview as r, LibraryFilePreviewShell as s, LibraryFilePreviewComposer as t };
