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
import {
  inferLibraryPreviewKind,
  resolveLibraryPreviewDecision,
  type LibraryPreviewKind,
} from "./preview-state";

interface CloudFile {
  category?: string | null;
  favorite?: boolean;
  fileId: string;
  fileName: string;
  kind?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
}
interface RouteCloudFile extends Record<string, unknown> {
  category?: string | null;
  fileId: string;
  id: string;
  libraryArtifactType?: string | null;
  mimeType?: string | null;
  name: string;
  sizeBytes?: number | null;
}
interface CloudFilePreviewProps {
  error?: string | null;
  file?: CloudFile;
  imagePreviewIsError?: boolean;
  imagePreviewIsPending?: boolean;
  isLoading?: boolean;
  item?: { cloudFile: RouteCloudFile };
  maxLocalTaskBytes?: number;
  onAsk?(file: CloudFile): void;
  onClose?(): void;
  onDownload?(file: CloudFile): Promise<void> | void;
  onFavoriteChange?(favorite: boolean): void;
  onRetry?(): void;
  onRetryImagePreview?(): void;
  onShare?(file?: CloudFile): void;
  preview?: unknown;
  previewKind?: LibraryPreviewKind;
  providerPreview?: { content?: unknown } | null;
}
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }

function normalizeFile(props: CloudFilePreviewProps): CloudFile {
  if (props.file != null) return props.file;
  const file = props.item?.cloudFile;
  if (file == null) throw new TypeError("LibraryCloudFilePreview requires file or item.cloudFile");
  return {
    category: file.category,
    fileId: file.fileId,
    fileName: file.name,
    kind: file.libraryArtifactType,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
  };
}

function PreviewMessage(props: {
  action?: unknown;
  description: string;
  fileName: string;
  role?: "alert" | "status";
  title: string;
}): unknown {
  return jsx().jsxs("div", {
    className: "library-file-preview-message",
    role: props.role,
    children: [
      jsx().jsx("div", { className: "library-file-preview-file-name", children: props.fileName }),
      jsx().jsx("h3", { children: props.title }),
      jsx().jsx("p", { children: props.description }),
      props.action,
    ],
  });
}

function LibraryFilePreviewBody(props: CloudFilePreviewProps): unknown {
  const file = normalizeFile(props);
  const preview = props.preview ?? props.providerPreview?.content;
  const kind = props.previewKind ?? inferLibraryPreviewKind(file);
  const decision = resolveLibraryPreviewDecision({
    error: props.error,
    hasPreview: preview != null,
    imagePreviewIsError: props.imagePreviewIsError,
    imagePreviewIsPending: props.imagePreviewIsPending,
    isLoading: props.isLoading,
    kind,
    sizeBytes: file.sizeBytes,
  });
  const retry = props.onRetryImagePreview ?? props.onRetry;
  const download = jsx().jsx("button", {
    onClick: () => props.onDownload?.(file),
    type: "button",
    children: "Download file",
  });

  if (decision.state === "hidden") return null;
  if (decision.state === "loading") {
    return jsx().jsx("div", { role: "status", children: "Loading preview" });
  }
  if (decision.state === "error" || decision.state === "image-error") {
    return jsx().jsxs("div", {
      role: "alert",
      children: [
        props.error ?? "Unable to load preview",
        jsx().jsx("button", { onClick: retry, type: "button", children: "Retry preview" }),
      ],
    });
  }
  if (decision.state === "too-large") {
    return jsx().jsx(PreviewMessage, {
      action: download,
      description: "You can still download or attach this file to ChatGPT",
      fileName: file.fileName,
      title: "File too large to preview",
    });
  }
  if (decision.state === "missing-size") {
    return jsx().jsx(PreviewMessage, {
      action: download,
      description: "The file size is unavailable, so an inline image preview cannot be created",
      fileName: file.fileName,
      title: "Preview not available",
    });
  }
  if (decision.state === "unsupported") {
    return jsx().jsx(PreviewMessage, {
      action: download,
      description: "This file type can be downloaded or attached to ChatGPT",
      fileName: file.fileName,
      title: "Preview not available",
    });
  }
  return jsx().jsx("div", {
    className: "library-file-preview-content",
    "data-preview-renderer": decision.renderer,
    children: preview ?? jsx().jsx("div", { role: "status", children: "Loading preview" }),
  });
}

function LibraryCloudFilePreview(props: CloudFilePreviewProps): unknown {
  const file = normalizeFile(props);
  const preview = props.preview ?? props.providerPreview?.content;
  const kind = props.previewKind ?? inferLibraryPreviewKind(file);
  const decision = resolveLibraryPreviewDecision({
    error: props.error,
    hasPreview: preview != null,
    imagePreviewIsError: props.imagePreviewIsError,
    imagePreviewIsPending: props.imagePreviewIsPending,
    isLoading: props.isLoading,
    kind,
    sizeBytes: file.sizeBytes,
  });
  return jsx().jsxs("section", {
    "aria-label": file.fileName,
    "data-preview-kind": kind,
    "data-preview-state": decision.state,
    children: [
      jsx().jsxs("header", {
        children: [
          jsx().jsx("h2", { children: file.fileName }),
          props.onFavoriteChange == null ? null : jsx().jsx("button", {
            onClick: () => props.onFavoriteChange?.(!file.favorite),
            type: "button",
            children: file.favorite ? "Remove from Favorites" : "Add to Favorites",
          }),
          jsx().jsx("button", { "aria-label": "Close preview", onClick: props.onClose, type: "button", children: "Close" }),
        ],
      }),
      jsx().jsx(LibraryFilePreviewBody, props),
      decision.canAsk && props.onAsk != null
        ? jsx().jsx("button", { onClick: () => props.onAsk?.(file), type: "button", children: "Ask about this file" })
        : null,
      props.onDownload == null ? null : jsx().jsx("button", { onClick: () => props.onDownload?.(file), type: "button", children: "Download file" }),
      props.onShare == null ? null : jsx().jsx("button", { onClick: () => props.onShare?.(file), type: "button", children: "Share file" }),
      props.maxLocalTaskBytes != null && file.sizeBytes != null && file.sizeBytes > props.maxLocalTaskBytes
        ? jsx().jsx("p", { role: "note", children: "File too large for a local task" })
        : null,
    ],
  });
}
function initializeLibraryFilePreviewShell(): void { void jsx(); }
function initializeLibraryFilePreviewRenderers(): void { void jsx(); }
function initializeLibraryCloudFilePreview(): void { initializeLibraryFilePreviewShell(); initializeLibraryFilePreviewRenderers(); }
function UnsupportedLibraryFilePreview(props: CloudFilePreviewProps): unknown {
  return LibraryCloudFilePreview({ ...props, previewKind: "unsupported" });
}
const LibraryFilePreview = LibraryCloudFilePreview;
const LibraryFilePreviewShell = UnsupportedLibraryFilePreview;
const LibraryFilePreviewComposer = LibraryCloudFilePreview;
export { UnsupportedLibraryFilePreview as a, initializeLibraryFilePreviewShell as c, LibraryFilePreviewBody as i, LibraryFilePreview as n, initializeLibraryFilePreviewRenderers as o, initializeLibraryCloudFilePreview as r, LibraryFilePreviewShell as s, LibraryFilePreviewComposer as t };
