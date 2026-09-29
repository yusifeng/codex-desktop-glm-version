// library-page — searchable Library browser, trash management, uploads, and previews.

import * as appConnectModalChunk from "@rchunk/app-connect-modal-by-id";
import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/library-empty-trash";
import * as displayTitleChunk from "@rchunk/library-file-display-title";
import * as previewKindChunk from "@rchunk/library-file-preview-kind";
import * as previewLoadingChunk from "@rchunk/library-file-preview-loading";
import * as itemActionsChunk from "@rchunk/library-item-actions";
import * as multiplayerAccessChunk from "@rchunk/library-multiplayer-access";
import * as trashAnalyticsChunk from "@rchunk/library-trash-analytics";
// @ts-ignore -- published dependency is resolved by the renderer graph.
import * as openLibraryItemChunk from "@rchunk/open-library-item";
import "@rchunk/rolldown-runtime";
import * as timestampsChunk from "@rchunk/timestamps";
import * as appConnectFlowChunk from "@rchunk/use-app-connect-flow";

interface JsxRuntime { Fragment: unknown; jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown }
interface ReactRuntime { lazy(loader: () => Promise<{ default: unknown }>): unknown; useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void; useRef<Value>(value: Value): { current: Value }; useState<Value>(value: Value): [Value, (next: Value | ((previous: Value) => Value)) => void] }
interface LocationLike { hash?: string; pathname: string; search: string; state?: Record<string, unknown> | null }
interface LibraryNode { file_name: string; id: string; kind: "directory" | "file"; library_file_category?: string | null; mime_type?: string | null; modified_at?: string | null; saved_entity?: unknown }
interface LibraryItem { canDelete?: boolean; canMove?: boolean; canRename?: boolean; canRestore?: boolean; node: LibraryNode }
interface LibraryResult { items: LibraryItem[]; next_cursor?: string | null }
interface QueryResult<Value> { data?: Value | null; error?: unknown; isPending?: boolean; refetch(): Promise<unknown> | unknown }
interface AccessState { status: "allowed" | "denied" | "error" | "loading" }
interface ScopeLike { queryClient: { invalidateQueries(input: { queryKey: unknown[] }): Promise<unknown> | unknown } }
interface ApiClient { safeGet(path: string, options: Record<string, unknown>): Promise<LibraryResult>; safePost(path: string, options: Record<string, unknown>): Promise<unknown> }
interface AppSharedApi { $3(): void; FX(): void; HX<Value>(signal: unknown): Value; I3(): JsxRuntime; K2(): void; LX(scope: unknown): ScopeLike; QI(): void; Qh: unknown; Y2: unknown; Yh: unknown; ZI: unknown; _L<Value>(options: Record<string, unknown>): QueryResult<Value>; e6(): ReactRuntime; wL(): void }
interface AppInitialApi { N6t(): { accountId: string | null; userId: string | null }; Qgn(): void; bL: unknown; cJt(): void; i_n(): LocationLike; o_n(): (destination: unknown, options?: Record<string, unknown>) => void; rJt: ApiClient }
type LibraryAction = { type: "delete"; permanently?: boolean } | { type: "move"; directoryId: string | null } | { type: "rename"; name: string } | { type: "restore" };
interface ActionScope { api: { delete(path: string, input?: Record<string, unknown>): Promise<{ success?: boolean }>; patch(path: string, input?: Record<string, unknown>): Promise<unknown>; post(path: string, input?: Record<string, unknown>): Promise<unknown> }; invalidate(action: LibraryAction): Promise<void> | void }

const { $3: initializeCompilerRuntime, FX: initializeSignals, HX: useSignalValue, I3: getJsxRuntime, K2: initializeIntl, LX: useScope, QI: initializeScope, Qh: Spinner, Y2: FormattedMessage, Yh: Button, ZI: applicationScope, _L: useQuery, e6: getReactRuntime, wL: initializeQueries } = appSharedChunk as unknown as AppSharedApi;
const { N6t: useIdentity, Qgn: initializeAuthentication, bL: accessSignal, cJt: initializeApi, i_n: useLocation, o_n: useNavigate, rJt: apiClient } = appInitialChunk as unknown as AppInitialApi;
const { n: AppConnectModalById, r: initializeAppConnectModal } = appConnectModalChunk as unknown as { n: unknown; r(): void };
const { t: initializeAppConnectFlow } = appConnectFlowChunk as unknown as { t(): void };
const { a: formatTimestamp, t: initializeTimestamps } = timestampsChunk as unknown as { a(value: string): string; t(): void };
const { r: initializeMultiplayerAccess } = multiplayerAccessChunk as unknown as { r(): void };
const { t: getDisplayTitle } = displayTitleChunk as unknown as { t(item: LibraryNode): string };
const { i: initializePreviewKind, r: getPreviewKind } = previewKindChunk as unknown as { i(): void; r(item: LibraryNode): "artifact" | "html" | "image" | "markdown" | "pdf" | "text" | "unsupported" };
const { n: initializePreviewLoading, t: PreviewLoading } = previewLoadingChunk as unknown as { n(): void; t: unknown };
const { i: performLibraryAction, t: initializeItemActions } = itemActionsChunk as unknown as { i(scope: ActionScope, item: LibraryItem, action: LibraryAction): Promise<boolean>; t(): void };
const { i: initializeTrashAnalytics, n: recordTrashAction } = trashAnalyticsChunk as unknown as { i(): void; n(event: string, item?: LibraryItem): void };
const { n: openLibraryItem, t: initializeOpenLibraryItem } = openLibraryItemChunk as unknown as { n(scope: ScopeLike, item: LibraryItem, entryPoint?: string): void; t(): void };

let React: ReactRuntime;
let jsx: JsxRuntime;
let MoveDialog: unknown;
let ConfirmDialog: unknown;
let RenameDialog: unknown;
let CloudPreview: unknown;
let NotePreview: unknown;
let ImagePreview: unknown;
let initialized = false;

function initializeLibraryPage(): void {
  if (initialized) return;
  initializeCompilerRuntime(); initializeSignals(); initializeIntl(); initializeScope(); initializeQueries();
  initializeAuthentication(); initializeApi(); initializeAppConnectModal(); initializeAppConnectFlow();
  initializeTimestamps(); initializeMultiplayerAccess(); initializePreviewKind(); initializePreviewLoading();
  initializeTrashAnalytics(); initializeItemActions(); initializeOpenLibraryItem();
  React = getReactRuntime(); jsx = getJsxRuntime();
  MoveDialog = React.lazy(async () => {
    const module = await import("@rchunk/library-move-dialog") as { MoveLibraryItemsDialog: unknown };
    return { default: module.MoveLibraryItemsDialog };
  });
  ConfirmDialog = React.lazy(async () => {
    const module = await import("@rchunk/library-item-dialogs") as { ConfirmLibraryItemsDialog: unknown };
    return { default: module.ConfirmLibraryItemsDialog };
  });
  RenameDialog = React.lazy(async () => {
    const module = await import("@rchunk/library-item-dialogs") as { RenameLibraryItemDialog: unknown };
    return { default: module.RenameLibraryItemDialog };
  });
  CloudPreview = React.lazy(async () => {
    const module = await import("@rchunk/library-cloud-file-preview-entry") as { LibraryCloudFilePreview: unknown };
    return { default: module.LibraryCloudFilePreview };
  });
  NotePreview = React.lazy(async () => {
    const module = await import("@rchunk/library-note-preview") as { LibraryNotePreview: unknown };
    return { default: module.LibraryNotePreview };
  });
  ImagePreview = React.lazy(async () => {
    const module = await import("@rchunk/library-image-preview") as { LibraryImagePreview: unknown };
    return { default: module.LibraryImagePreview };
  });
  initialized = true;
}

function message(id: string, defaultMessage: string): unknown { return jsx.jsx(FormattedMessage, { id, defaultMessage }); }
function viewFrom(location: LocationLike): { category: string; deleted: boolean; directoryId: string | null; entryPoint?: string; search: string } {
  const parameters = new URLSearchParams(location.search);
  return { category: parameters.get("category") ?? "all", deleted: parameters.get("deleted") === "true", directoryId: parameters.get("directory_id"), entryPoint: parameters.get("entry_point") === "global_search" ? "global_search" : undefined, search: parameters.get("search") ?? "" };
}

function LibraryPage(): unknown {
  const scope = useScope(applicationScope);
  const access = useSignalValue<AccessState>(accessSignal);
  const identity = useIdentity();
  const location = useLocation();
  const navigate = useNavigate();
  const view = viewFrom(location);
  const [selected, setSelected] = React.useState<LibraryItem | null>(null);
  const [dialog, setDialog] = React.useState<"confirm" | "move" | "rename" | null>(null);
  const uploadInput = React.useRef<{ click(): void } | null>(null);
  const enabled = access.status === "allowed" && identity.accountId != null && identity.userId != null;
  const query = useQuery<LibraryResult>({
    enabled,
    queryFn: ({ signal }: { signal: AbortSignal }) => apiClient.safeGet("/files/library", { parameters: { query: { category: view.category === "all" ? undefined : view.category, deleted: view.deleted, directory_id: view.directoryId ?? undefined, search: view.search || undefined } }, signal }),
    queryKey: ["library", identity.accountId, identity.userId, view.category, view.deleted, view.directoryId, view.search],
    refetchOnWindowFocus: false,
  });
  React.useEffect(() => {
    if (view.entryPoint == null) return;
    const parameters = new URLSearchParams(location.search); parameters.delete("entry_point");
    navigate({ pathname: location.pathname, search: parameters.toString(), hash: location.hash }, { replace: true, state: location.state });
  }, [location.hash, location.pathname, location.search, location.state, navigate, view.entryPoint]);

  if (access.status === "loading") return jsx.jsx("div", { children: jsx.jsx(Spinner, {}) });
  if (!enabled) return jsx.jsx("div", { children: message("libraryNext.access.denied", "Sign in to ChatGPT to open your Library.") });

  const updateView = (updates: Record<string, string | null>): void => {
    const parameters = new URLSearchParams(location.search);
    for (const [key, value] of Object.entries(updates)) value == null || value === "" ? parameters.delete(key) : parameters.set(key, value);
    navigate({ pathname: location.pathname, search: parameters.toString(), hash: location.hash });
  };
  const invalidate = (): Promise<unknown> | unknown => scope.queryClient.invalidateQueries({ queryKey: ["library", identity.accountId, identity.userId] });
  const actionScope: ActionScope = {
    api: {
      delete: async (path, input) => { await apiClient.safePost(path, { requestBody: input }); return { success: true }; },
      patch: (path, input) => apiClient.safePost(path, { method: "PATCH", requestBody: input }),
      post: (path, input) => apiClient.safePost(path, { requestBody: input }),
    },
    invalidate: async () => { await invalidate(); },
  };
  const perform = async (item: LibraryItem, action: LibraryAction): Promise<void> => {
    if (await performLibraryAction(actionScope, item, action)) { recordTrashAction(action.type, item); if (selected?.node.id === item.node.id) setSelected(null); }
  };
  const upload = async (files: FileList | File[]): Promise<void> => {
    const values = Array.from(files);
    await Promise.all(values.map((file) => apiClient.safePost("/files/library/files", { requestBody: { file, parent_directory_id: view.directoryId } })));
    if (values.length > 0) await invalidate();
  };
  const items = query.data?.items ?? [];
  const title = view.deleted ? "Trash" : view.search ? "Search results for " + view.search : view.directoryId == null ? "Library" : "Collection";
  const body = query.isPending
    ? jsx.jsx(PreviewLoading, {})
    : query.error != null
      ? jsx.jsxs("div", { role: "alert", children: [message("libraryNext.error", "Your Library couldn’t be loaded."), jsx.jsx(Button, { onClick: () => query.refetch(), children: message("libraryNext.retry", "Try again") })] })
      : items.length === 0
        ? jsx.jsx("div", { "data-empty": view.deleted ? "trash" : view.search ? "search" : "library", children: view.deleted ? message("libraryNext.trash.empty", "Trash is empty") : view.search ? message("libraryNext.search.empty", "No matching files") : message("libraryNext.empty", "Add anything to your Library") })
        : jsx.jsx("div", { role: "list", children: items.map((item) => jsx.jsxs("div", { role: "listitem", "data-item-id": item.node.id, children: [
            jsx.jsx("button", { onClick: () => { openLibraryItem(scope, item, view.entryPoint); setSelected(item); }, children: getDisplayTitle(item.node) || item.node.file_name }),
            item.node.modified_at == null ? null : jsx.jsx("time", { children: formatTimestamp(item.node.modified_at) }),
            view.deleted
              ? jsx.jsx(Button, { onClick: () => perform(item, { type: "restore" }), children: message("libraryNext.restore", "Restore") })
              : jsx.jsxs(jsx.Fragment, { children: [
                  jsx.jsx(Button, { onClick: () => { setSelected(item); setDialog("rename"); }, children: message("libraryNext.rename", "Rename") }),
                  jsx.jsx(Button, { onClick: () => { setSelected(item); setDialog("move"); }, children: message("libraryNext.move", "Move") }),
                  jsx.jsx(Button, { onClick: () => { setSelected(item); setDialog("confirm"); }, children: message("libraryNext.delete", "Delete") }),
                ] }),
          ] }, item.node.id)) });

  return jsx.jsxs(jsx.Fragment, { children: [
    jsx.jsx(AppConnectModalById, {}),
    jsx.jsx("main", { onDragOver: (event: { preventDefault(): void }) => event.preventDefault(), onDrop: (event: { dataTransfer: { files: FileList }; preventDefault(): void }) => { event.preventDefault(); void upload(event.dataTransfer.files); }, children: jsx.jsxs(jsx.Fragment, { children: [
      jsx.jsxs("header", { children: [jsx.jsx("h1", { children: title }), jsx.jsx("input", { "aria-label": "Search Library", onChange: (event: { currentTarget: { value: string } }) => updateView({ search: event.currentTarget.value }), value: view.search }), jsx.jsx(Button, { onClick: () => uploadInput.current?.click(), children: message("libraryNext.upload", "Add") }), jsx.jsx(Button, { onClick: () => updateView({ deleted: view.deleted ? null : "true" }), children: view.deleted ? message("libraryNext.back", "Back to Library") : message("libraryNext.trash", "Trash") })] }),
      jsx.jsx("nav", { children: ["all", "image", "document"].map((category) => jsx.jsx("button", { "aria-pressed": view.category === category, onClick: () => updateView({ category: category === "all" ? null : category }), children: category }, category)) }),
      body,
      jsx.jsx("input", { multiple: true, onChange: (event: { currentTarget: { files: FileList | null } }) => { if (event.currentTarget.files != null) void upload(event.currentTarget.files); }, ref: uploadInput, type: "file" }),
    ] }) }),
    selected == null ? null : jsx.jsx(LibraryPreview, { item: selected }),
    dialog === "move" && selected != null ? jsx.jsx(MoveDialog, { items: [selected], onClose: () => setDialog(null) }) : null,
    dialog === "rename" && selected != null ? jsx.jsx(RenameDialog, { item: selected, onClose: () => setDialog(null) }) : null,
    dialog === "confirm" && selected != null ? jsx.jsx(ConfirmDialog, { items: [selected], onClose: () => setDialog(null), onConfirm: () => perform(selected, { type: "delete" }) }) : null,
  ] });
}

function LibraryPreview({ item }: { item: LibraryItem }): unknown {
  const kind = getPreviewKind(item.node);
  if (kind === "image") return jsx.jsx(ImagePreview, { item });
  if (kind === "markdown" || kind === "text" || kind === "html") return jsx.jsx(NotePreview, { item });
  return jsx.jsx(CloudPreview, { item, kind });
}

initializeLibraryPage();

export { LibraryPage };
