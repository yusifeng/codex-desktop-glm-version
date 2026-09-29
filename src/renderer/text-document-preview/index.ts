import "@rchunk/rolldown-runtime";
import {
  I3 as getJsxRuntime,
  LX as useScope,
  _L as useQuery,
  iL as useMutation,
  n4 as useIntl,
  pk as toastManagerSignal,
} from "@rchunk/app-shared";
import { $en as routeScope, pnt as appServices } from "@rchunk/app-initial";
import { t as EditorHeader } from "@rchunk/editor-header";
import { t as OpenInLibraryItem } from "@rchunk/open-in-library-item";
import { r as LibraryBreadcrumb, t as getHeaderContentFade } from "@rchunk/header-content-fade";
import { r as MarkdownSurface } from "@rchunk/surface";
import { t as LibraryVersionHistory } from "@rchunk/lazy-version-history";
import { t as defaultHeaderControls } from "@rchunk/editor-header-controls";

const jsx = getJsxRuntime();
const MAX_TEXT_DOCUMENT_BYTES = 10 * 1024 * 1024;

interface WorkspaceFileReadResult {
  blob?: ArrayBuffer | Uint8Array;
  text?: string;
}

interface WorkspaceFilesService {
  downloadCopy?(request: { fileName: string; hostId: string; path: string }): Promise<void>;
  read(request: {
    hostId: string;
    maxBytes: number;
    path: string;
    representation: "text";
  }): Promise<WorkspaceFileReadResult>;
}

interface LibraryFile {
  libraryFileId: string;
}

interface ProviderFile {
  id?: string;
  name?: string;
  [key: string]: unknown;
}

interface TextDocumentPreviewProps {
  hostId: string;
  libraryFile?: LibraryFile | null;
  onClose(): void;
  onDownload?(): Promise<void> | void;
  path: string;
  previewKind: "markdown" | "text" | string;
  providerFile?: ProviderFile | null;
  tabId?: string;
  title: string;
}

interface ToastManager {
  danger(message: string, options?: { errorAnalytics?: { toastId: string } }): void;
}

interface ScopeApi {
  get<Value>(signal: unknown): Value;
}

const services = appServices as unknown as { workspaceFiles?: WorkspaceFilesService };

function formatText(value: string | readonly unknown[]): string {
  return typeof value === "string" ? value : value.map(String).join("");
}

function decodeWorkspaceFile(result: WorkspaceFileReadResult): string {
  if (typeof result.text === "string") return result.text;
  if (result.blob == null) return "";
  const bytes = result.blob instanceof Uint8Array ? result.blob : new Uint8Array(result.blob);
  return new TextDecoder().decode(bytes);
}

function LoadingState(): unknown {
  return jsx.jsx("div", {
    className: "flex h-full items-center justify-center",
    "aria-busy": true,
    children: "Loading note…",
  });
}

function ChatGptTextDocumentPreview({
  hostId,
  libraryFile,
  onClose,
  onDownload,
  path,
  previewKind,
  providerFile,
  tabId,
  title,
}: TextDocumentPreviewProps): unknown {
  const intl = useIntl();
  const scope = useScope(routeScope) as ScopeApi;
  const workspaceFiles = services.workspaceFiles;
  const query = useQuery<string>({
    queryFn: async () => {
      if (workspaceFiles == null) throw new Error("Workspace files are unavailable");
      return decodeWorkspaceFile(await workspaceFiles.read({
        hostId,
        maxBytes: MAX_TEXT_DOCUMENT_BYTES,
        path,
        representation: "text",
      }));
    },
    queryKey: ["chatgpt-text-document-preview", hostId, path],
    gcTime: 0,
    retry: false,
    staleTime: 0,
  });
  const download = useMutation<void>({
    mutationFn: async () => {
      if (onDownload != null) {
        await onDownload();
        return;
      }
      if (workspaceFiles?.downloadCopy == null) throw new Error("File downloads are unavailable");
      await workspaceFiles.downloadCopy({ fileName: title, hostId, path });
    },
    onError: () => {
      const toasts = scope.get<ToastManager>(toastManagerSignal);
      toasts.danger(formatText(intl.formatMessage({
        id: "chatgptTextDocumentPreview.downloadFailed",
        defaultMessage: "Couldn’t download this file",
      })), { errorAnalytics: { toastId: "chatgptTextDocumentPreview.downloadFailed" } });
    },
  });

  const libraryActions = libraryFile == null ? null : jsx.jsxs(jsx.Fragment, {
    children: [
      jsx.jsx(OpenInLibraryItem, { libraryFileId: libraryFile.libraryFileId }),
      jsx.jsx(LibraryVersionHistory, { file: libraryFile }),
    ],
  });
  const titleActions = jsx.jsxs("div", {
    className: "flex min-w-0 items-center gap-2",
    "data-file-name": title,
    children: [
      libraryFile == null ? null : jsx.jsx(LibraryBreadcrumb, { libraryFileId: libraryFile.libraryFileId }),
      jsx.jsx("span", { className: "truncate", children: title }),
      libraryActions,
    ],
  });
  const supplementalActions = providerFile == null
    ? defaultHeaderControls.supplementalActions
    : jsx.jsx("span", { "data-provider-file": providerFile.id ?? providerFile.name ?? "provider-file", children: providerFile.name ?? "Provider file" });
  const controls = { ...defaultHeaderControls, supplementalActions };

  let content: unknown;
  if (query.isError) {
    content = jsx.jsxs("div", {
      className: "flex h-full flex-col items-center justify-center gap-3",
      children: [
        jsx.jsx("span", { children: intl.formatMessage({
          id: "chatgptTextDocumentPreview.readFailed",
          defaultMessage: "Couldn’t load this note",
        }) }),
        jsx.jsx("button", {
          type: "button",
          "aria-disabled": query.isFetching,
          disabled: query.isFetching,
          onClick: () => { if (!query.isFetching) void query.refetch(); },
          children: intl.formatMessage({
            id: "chatgptTextDocumentPreview.retry",
            defaultMessage: "Retry",
          }),
        }),
      ],
    });
  } else if (query.data == null) {
    content = jsx.jsx(LoadingState, {});
  } else {
    content = jsx.jsx("div", {
      className: "h-full min-h-0 overflow-y-auto bg-surface text-start",
      children: jsx.jsx("div", {
        className: "mx-auto w-full max-w-(--thread-content-max-width) px-toolbar pt-20 pb-8",
        children: previewKind === "markdown"
          ? jsx.jsx(MarkdownSurface, { enableMetadataPreview: true, markdown: query.data })
          : jsx.jsx("div", {
              className: "text-base leading-7 wrap-anywhere whitespace-pre-wrap text-default select-text",
              children: query.data,
            }),
      }),
    });
  }

  const header = jsx.jsx(EditorHeader, {
    actions: titleActions,
    contentFade: getHeaderContentFade("text-document"),
    controls,
    downloadPending: download.isPending,
    onClose,
    onDownload: () => download.mutate(),
    tabId,
    title,
  });

  return jsx.jsxs("section", {
    className: "relative flex h-full min-h-0 flex-col bg-surface",
    children: [
      header,
      jsx.jsx("div", { className: "relative min-h-0 flex-1", children: content }),
    ],
  });
}

export { ChatGptTextDocumentPreview };
