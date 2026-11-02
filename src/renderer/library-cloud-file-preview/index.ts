import "@rchunk/rolldown-runtime";
import {
  I3 as getJsxRuntime,
  e6 as getReactRuntime,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import { n as ArtifactTabContent } from "@rchunk/artifact-tab-content-electron";
import "@rchunk/editor-header";
import "@rchunk/header-content-fade";
import * as SurfaceRuntime from "@rchunk/surface";
import "@rchunk/lazy-version-history";
import "@rchunk/use-chatgpt-composer-controller";
import "@rchunk/right-panel-composer-overlay";
import "@rchunk/artifact-entry";
import "@rchunk/library-multiplayer-access";
import "@rchunk/editor-header-controls";
import "@rchunk/loading-controls";
import "@rchunk/library-file-preview-kind";
import "@rchunk/preview-layout";
import {
  i as readLibraryFileText,
  r as readLibraryFileBytes,
  t as downloadLibraryFile,
} from "@rchunk/library-file-download";
import "@rchunk/library-file-preview-loading";
import "@rchunk/docx-preview-panel";
import { LibraryJsonPreview } from "@rchunk/library-json-preview";
import {
  inferLibraryPreviewKind,
  resolveLibraryPreviewDecision,
  type LibraryPreviewKind,
} from "./preview-state";
import {
  createLibraryPreviewContentLoader,
  libraryPreviewContentKey,
  type LibraryPreviewContentState,
} from "./preview-content-loader";
import { createBinaryPreviewUrlController } from "./binary-preview-url";
import { projectLibraryPreviewRenderModel } from "./preview-render-model";
import { resolveProviderPreviewUrl } from "./provider-preview-policy";

interface CloudFile {
  category?: string | null;
  downloadUrl?: string;
  favorite?: boolean;
  fileId: string;
  fileName: string;
  kind?: string | null;
  mimeType?: string | null;
  provider?: string | null;
  requestHeaders?: Record<string, string>;
  sizeBytes?: number | null;
  sourceUrl?: string | null;
}
interface RouteCloudFile extends Record<string, unknown> {
  category?: string | null;
  fileId: string;
  id: string;
  libraryArtifactType?: string | null;
  mimeType?: string | null;
  provider?: string | null;
  name: string;
  requestHeaders?: Record<string, string>;
  sizeBytes?: number | null;
  sourceUrl?: string | null;
}
interface CloudFilePreviewProps {
  error?: string | null;
  file?: CloudFile;
  imagePreviewIsError?: boolean;
  imagePreviewIsPending?: boolean;
  googleWorkspaceIframePreviewEnabled?: boolean;
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
let reactRuntime: ReactRuntime | undefined;
const MarkdownSurface = (SurfaceRuntime as unknown as { r?: (props: Record<string, unknown>) => unknown }).r ?? "pre";
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function react(): ReactRuntime { reactRuntime ??= getReactRuntime(); return reactRuntime; }

function normalizeFile(props: CloudFilePreviewProps): CloudFile {
  if (props.file != null) return props.file;
  const file = props.item?.cloudFile;
  if (file == null) throw new TypeError("LibraryCloudFilePreview requires file or item.cloudFile");
  return {
    category: file.category,
    downloadUrl: file.sourceUrl ?? undefined,
    fileId: file.fileId,
    fileName: file.name,
    kind: file.libraryArtifactType,
    mimeType: file.mimeType,
    provider: file.provider,
    requestHeaders: file.requestHeaders,
    sizeBytes: file.sizeBytes,
  };
}

function isLoadableKind(kind: LibraryPreviewKind): boolean {
  return kind === "artifact" || kind === "pdf" || kind === "html" || kind === "markdown" || kind === "text";
}

function useBinaryPreviewUrl(content: unknown, kind: LibraryPreviewKind): string | null {
  const hooks = react();
  const [url, setUrl] = hooks.useState<string | null>(null);
  const [controller] = hooks.useState(() => createBinaryPreviewUrlController({
    createObjectUrl: (bytes, mimeType) => URL.createObjectURL(new Blob([bytes as BlobPart], { type: mimeType })),
    revokeObjectUrl: (value) => URL.revokeObjectURL(value),
  }));
  hooks.useEffect(() => controller.update(content, kind === "pdf" ? "application/pdf" : "application/octet-stream", setUrl),
    [content, controller, kind]);
  return url;
}

function useLoadedPreview(
  file: CloudFile,
  kind: LibraryPreviewKind,
  providedPreview: unknown,
): LibraryPreviewContentState {
  const hooks = react();
  const key = libraryPreviewContentKey(file, kind);
  const [state, setState] = hooks.useState<LibraryPreviewContentState>(() =>
    providedPreview != null
      ? { content: providedPreview, key, status: "ready" }
      : isLoadableKind(kind)
        ? { key, status: "loading" }
        : { content: undefined, key, status: "ready" },
  );
  const [loader] = hooks.useState(() =>
    createLibraryPreviewContentLoader({
      readBytes: (input, signal) => readLibraryFileBytes({
        downloadUrl: input.downloadUrl,
        file_name: input.fileName,
        requestHeaders: input.requestHeaders,
      }, signal),
      readText: (input, signal) => readLibraryFileText({
        downloadUrl: input.downloadUrl,
        file_name: input.fileName,
        requestHeaders: input.requestHeaders,
      }, signal),
    }),
  );
  hooks.useEffect(() => {
    if (providedPreview != null) {
      setState({ content: providedPreview, key, status: "ready" });
      return;
    }
    if (!isLoadableKind(kind)) {
      setState({ content: undefined, key, status: "ready" });
      return;
    }
    return loader.load(file, kind, setState);
  }, [file, key, kind, loader, providedPreview]);
  if (providedPreview != null) return { content: providedPreview, key, status: "ready" };
  if (state.key === key) return state;
  return isLoadableKind(kind)
    ? { key, status: "loading" }
    : { content: undefined, key, status: "ready" };
}

function downloadHandler(props: CloudFilePreviewProps, file: CloudFile): (() => void) | undefined {
  if (props.onDownload != null) return () => { void props.onDownload?.(file); };
  if (file.downloadUrl == null) return undefined;
  return () => {
    void downloadLibraryFile({
      downloadUrl: file.downloadUrl,
      file_name: file.fileName,
      requestHeaders: file.requestHeaders,
    });
  };
}

function artifactKind(fileName: string): "document" | "presentation" | "spreadsheet" | "text" {
  const extension = fileName.toLowerCase().split(".").at(-1);
  if (extension === "ppt" || extension === "pptx") return "presentation";
  if (extension === "csv" || extension === "tsv" || extension === "xls" || extension === "xlsx") return "spreadsheet";
  if (extension === "doc" || extension === "docx" || extension === "pdf") return "document";
  return "text";
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
  const kind = props.previewKind ?? inferLibraryPreviewKind(file);
  const providerPreviewUrl = resolveProviderPreviewUrl(file, props.googleWorkspaceIframePreviewEnabled === true);
  const providedPreview = props.preview ?? props.providerPreview?.content ?? (kind === "image" ? file.downloadUrl : undefined);
  const loaded = useLoadedPreview(file, kind, providedPreview);
  const preview = loaded.status === "ready" ? loaded.content : undefined;
  const binaryUrl = useBinaryPreviewUrl(preview, kind);
  const decision = resolveLibraryPreviewDecision({
    error: props.error ?? (loaded.status === "error" ? loaded.error : null),
    hasPreview: preview != null,
    imagePreviewIsError: props.imagePreviewIsError,
    imagePreviewIsPending: props.imagePreviewIsPending,
    isLoading: props.isLoading || loaded.status === "loading",
    kind,
    sizeBytes: file.sizeBytes,
  });
  const retry = props.onRetryImagePreview ?? props.onRetry;
  const handleDownload = downloadHandler(props, file);
  const download = handleDownload == null ? null : jsx().jsx("button", {
    onClick: handleDownload, type: "button", children: "Download file",
  });

  if (providerPreviewUrl != null && props.providerPreview?.content == null && props.preview == null) {
    return jsx().jsx("iframe", {
      className: "library-file-preview-provider", "data-preview-renderer": "provider",
      referrerPolicy: "no-referrer",
      sandbox: "allow-downloads allow-forms allow-modals allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation",
      src: providerPreviewUrl, title: file.fileName,
    });
  }

  if (decision.state === "hidden") return null;
  if (decision.state === "loading") {
    return jsx().jsx("div", { role: "status", children: "Loading preview" });
  }
  if (decision.state === "error" || decision.state === "image-error") {
    return jsx().jsxs("div", {
      role: "alert",
      children: [
        props.error ?? (loaded.status === "error" ? loaded.error : "Unable to load preview"),
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
  const renderModel = projectLibraryPreviewRenderModel({
    binaryUrl, content: preview, downloadUrl: file.downloadUrl, fileName: file.fileName, kind, renderer: decision.renderer,
  });
  if (renderModel.kind === "artifact") {
    return jsx().jsx("div", {
      "data-preview-renderer": "artifact",
      children: jsx().jsx(ArtifactTabContent, {
        content: renderModel.content,
        kind: artifactKind(file.fileName),
        status: "ready",
        title: file.fileName,
        onClose: props.onClose,
        onDownload: handleDownload,
      }),
    });
  }
  if (renderModel.kind === "pdf") {
    return renderModel.source == null
      ? jsx().jsx("div", { role: "status", children: "Loading PDF preview" })
      : jsx().jsx("iframe", {
          className: "library-file-preview-pdf", "data-preview-kind": "pdf",
          "data-preview-renderer": renderModel.renderer, src: renderModel.source,
          title: file.fileName,
        });
  }
  if (renderModel.kind === "image") {
    return jsx().jsx("div", { className: "library-file-preview-image", "data-preview-kind": "image", "data-preview-renderer": renderModel.renderer, children:
      jsx().jsx("img", { alt: file.fileName, src: renderModel.source }) });
  }
  if (renderModel.kind === "html") {
    return jsx().jsx("iframe", {
      className: "library-file-preview-html", "data-preview-kind": "html", "data-preview-renderer": renderModel.renderer,
      sandbox: "allow-forms allow-modals allow-popups allow-same-origin allow-scripts", srcDoc: renderModel.content,
      title: file.fileName,
    });
  }
  if (renderModel.kind === "markdown") {
    return jsx().jsx("div", { className: "library-file-preview-markdown", "data-preview-kind": "markdown", "data-preview-renderer": renderModel.renderer,
      children: jsx().jsx(MarkdownSurface, { enableMetadataPreview: true, markdown: renderModel.content }) });
  }
  if (renderModel.kind === "json") return jsx().jsx(LibraryJsonPreview, { content: renderModel.content, fileName: file.fileName });
  if (renderModel.kind === "text") {
    return jsx().jsx("pre", {
      className: "library-file-preview-text",
      "data-preview-renderer": "text-document",
      dir: "ltr",
      tabIndex: 0,
      children: renderModel.content,
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
  const kind = props.previewKind ?? inferLibraryPreviewKind(file);
  const providerPreviewUrl = resolveProviderPreviewUrl(file, props.googleWorkspaceIframePreviewEnabled === true);
  const preview = props.preview ?? props.providerPreview?.content ?? providerPreviewUrl ?? (kind === "image" ? file.downloadUrl : undefined);
  const decision = resolveLibraryPreviewDecision({
    error: props.error,
    hasPreview: preview != null,
    imagePreviewIsError: props.imagePreviewIsError,
    imagePreviewIsPending: props.imagePreviewIsPending,
    isLoading: props.isLoading,
    kind,
    sizeBytes: file.sizeBytes,
  });
  const handleDownload = downloadHandler(props, file);
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
      handleDownload == null ? null : jsx().jsx("button", { onClick: handleDownload, type: "button", children: "Download file" }),
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
