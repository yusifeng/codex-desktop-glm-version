// Loading surface for file previews. Release chunk: loading-cba17c98d28e.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as editorHeaderChunk from "@rchunk/editor-header";
import * as headerFadeChunk from "@rchunk/header-content-fade";
import * as headerControlsChunk from "@rchunk/editor-header-controls";
import * as loadingControlsChunk from "@rchunk/loading-controls";

interface Props {
  downloadOptions?: unknown;
  fileName: string;
  libraryFileId?: string | null;
  onClose?: () => void;
  onDownload?: () => unknown;
  previewTabId?: string;
  textDocumentPreviewKind?: unknown;
}
interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>): unknown;
  jsxs(type: unknown, props: Record<string, unknown>): unknown;
}
interface SharedRuntime {
  I3(): JsxRuntime;
  m4(...classNames: Array<string | false | null | undefined>): string;
  [key: string]: unknown;
}

const shared = appSharedChunk as unknown as SharedRuntime;
const initial = appInitialChunk as unknown as Record<string, unknown>;
const editorHeader = editorHeaderChunk as unknown as Record<string, unknown>;
const headerFade = headerFadeChunk as unknown as Record<string, unknown>;
const headerControls = headerControlsChunk as unknown as Record<
  string,
  unknown
>;
const loadingControls = loadingControlsChunk as unknown as Record<
  string,
  unknown
>;
const jsxRuntime = shared.I3();

function callInitializer(runtime: Record<string, unknown>, name: string): void {
  const value = runtime[name];
  if (typeof value === "function") (value as () => void)();
}

function ChatGptFilePreviewLoading(props: Props): unknown {
  const classify = initial.YUt as
    | ((
        fileName: string,
      ) => { importKind?: string; artifactType?: string } | undefined)
    | undefined;
  const fileType = classify?.(props.fileName);
  const isTextDocument = props.textDocumentPreviewKind != null;
  const importKind = isTextDocument ? "text-document" : fileType?.importKind;
  const isSupported = initial.QUt as ((kind: string) => boolean) | undefined;
  const Spinner = initial.Let;
  if (
    importKind == null ||
    (importKind !== "text-document" && !isSupported?.(importKind))
  ) {
    return jsxRuntime.jsx(Spinner, {
      debugName: "ChatGptFilePreview",
      fillParent: true,
    });
  }
  const contentFade = (
    headerFade.t as ((kind: string) => unknown) | undefined
  )?.(importKind);
  const background =
    isTextDocument || fileType?.artifactType === "spreadsheet"
      ? "bg-surface"
      : "bg-background-artifact-preview";
  const controls = isTextDocument
    ? headerControls.t
    : (
        loadingControls.t as
          ((options: { paginated: boolean }) => unknown) | undefined
      )?.({
        paginated: importKind === "docx" || importKind === "pdf",
      });
  const Header = editorHeader.t;
  return jsxRuntime.jsxs("section", {
    className: shared.m4("relative flex h-full min-h-0 flex-col", background),
    children: [
      jsxRuntime.jsx(Header, {
        actions: null,
        contentFade,
        controls,
        downloadPending: false,
        onClose: props.onClose,
        onDownload: props.onDownload,
        tabId: props.previewTabId,
        title: props.fileName,
      }),
      jsxRuntime.jsx("div", {
        className: "relative min-h-0 flex-1",
        children: jsxRuntime.jsx(Spinner, {
          debugName: "ChatGptFilePreview",
          fillParent: true,
        }),
      }),
    ],
  });
}

for (const [runtime, names] of [
  [shared as unknown as Record<string, unknown>, ["rL", "h4", "FX"]],
  [initial, ["XUt", "Sun", "Ret", "itn", "Rrt", "DR"]],
  [editorHeader, ["r"]],
  [headerFade, ["n", "r", "i"]],
  [headerControls, ["n"]],
  [loadingControls, ["n"]],
] as Array<[Record<string, unknown>, string[]]>) {
  for (const name of names) callInitializer(runtime, name);
}

export { ChatGptFilePreviewLoading };
