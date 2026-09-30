import * as RuntimeChunk from "@rchunk/rolldown-runtime";
import * as SharedChunk from "@rchunk/app-shared";
import * as InitialChunk from "@rchunk/app-initial";
import * as ResetLibraryChunk from "@rchunk/reset-image-library-state";
import * as TrashAnalyticsChunk from "@rchunk/library-trash-analytics";

interface JsxRuntime { jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown }
interface QueryClient { invalidateQueries(input: { queryKey: readonly unknown[] }): Promise<unknown> | unknown }
interface Toasts { danger(message: unknown, options?: Record<string, unknown>): void; success(message: unknown): void }
interface IntlRuntime { formatMessage(descriptor: { defaultMessage: string; description?: string; id: string }): string }
interface DeleteResult { deleted_count: number; failed_count: number }
interface ApiClient { safeDelete(path: string): Promise<DeleteResult> }
interface DialogScope { get(key: unknown): unknown; queryClient: QueryClient }
interface Props { accountId: string; userId: string; sessionId: string; onClose(): void }
interface SharedApi { I3(): JsxRuntime; LX(scope: unknown): DialogScope; Y2: unknown; Yh: unknown; Ih: unknown; Oh: unknown; Ph: unknown; Rh: unknown; UX: unknown; pk: unknown }
interface InitialApi { fRt: unknown; mpn: unknown; rK: unknown; uK: unknown }

const shared = SharedChunk as unknown as SharedApi;
const initial = InitialChunk as unknown as InitialApi;
const jsx = shared.I3();
const resetLibraryState = (ResetLibraryChunk as unknown as { n(client: QueryClient): Promise<unknown> | unknown }).n;
const recordTrashEvent = (TrashAnalyticsChunk as unknown as { n(scope: DialogScope, sessionId: string, interactionType: string, error?: unknown): void }).n;
const interactionTypes = ((InitialChunk as unknown as { HLt?: Record<string, string> }).HLt ?? {}) as Record<string, string>;
void RuntimeChunk;

function message(id: string, defaultMessage: string, description: string): unknown {
  return jsx.jsx(shared.Y2, { id, defaultMessage, description });
}

function interaction(name: string, fallback: string): string { return interactionTypes[name] ?? fallback; }

async function emptyTrash(scope: DialogScope, sessionId: string): Promise<boolean> {
  const toasts = scope.get(shared.pk) as Toasts;
  const intl = scope.get(initial.mpn) as IntlRuntime;
  const api = scope.get(initial.uK) as ApiClient;
  recordTrashEvent(scope, sessionId, interaction("CHATGPT_FILE_LIBRARY_FILE_INTERACTION_TYPE_DELETE", "delete"));
  try {
    const result = await api.safeDelete("/files/library/trash");
    await Promise.all([
      result.deleted_count > 0 ? resetLibraryState(scope.queryClient) : undefined,
      scope.queryClient.invalidateQueries({ queryKey: ["library-api"] }),
      scope.queryClient.invalidateQueries({ queryKey: ["chatgpt-composer-library-files"] }),
      scope.queryClient.invalidateQueries({ queryKey: ["4231797315"] }),
    ]);
    if (result.failed_count > 0) {
      recordTrashEvent(scope, sessionId, interaction(result.deleted_count === 0 ? "CHATGPT_FILE_LIBRARY_FILE_INTERACTION_TYPE_DELETE_FAILED" : "CHATGPT_FILE_LIBRARY_FILE_INTERACTION_TYPE_DELETE_PARTIAL", result.deleted_count === 0 ? "delete_failed" : "delete_partial"));
      toasts.danger(intl.formatMessage({ id: "library.emptyTrash.partialFailure", defaultMessage: "Some files couldn't be deleted. Try again." }), { errorAnalytics: { toastId: "library.emptyTrash.partialFailure" } });
    } else {
      recordTrashEvent(scope, sessionId, interaction("CHATGPT_FILE_LIBRARY_FILE_INTERACTION_TYPE_DELETE_SUCCEEDED", "delete_succeeded"));
      toasts.success(intl.formatMessage({ id: "library.emptyTrash.success", defaultMessage: "Trash emptied" }));
    }
    return true;
  } catch (error) {
    recordTrashEvent(scope, sessionId, interaction("CHATGPT_FILE_LIBRARY_FILE_INTERACTION_TYPE_DELETE_FAILED", "delete_failed"), error);
    toasts.danger(intl.formatMessage({ id: "library.emptyTrash.failed", defaultMessage: "Failed to empty Trash" }), { errorAnalytics: { toastId: "library.emptyTrash.failed" } });
    return false;
  }
}

function EmptyLibraryTrashDialog({ accountId, userId, sessionId, onClose }: Props): unknown {
  const scope = shared.LX(initial.rK);
  const submit = async (event?: { preventDefault(): void }): Promise<void> => { event?.preventDefault(); if (await emptyTrash(scope, sessionId)) onClose(); };
  const body = jsx.jsxs(shared.Oh, { as: "form", onSubmit: submit, children: [
    jsx.jsx(shared.Rh, { children: jsx.jsx("h2", { children: message("library.emptyTrash.title", "Delete forever?", "Confirmation before permanently deleting all Library trash") }) }),
    jsx.jsx(shared.UX, { children: message("library.emptyTrash.description", "Files in Trash will be deleted forever. This can't be undone.", "Warning for emptying Library trash") }),
    jsx.jsxs(shared.Ph, { children: [
      jsx.jsx(shared.Yh, { color: "ghost", onClick: onClose, children: message("libraryNext.dialog.cancel", "Cancel", "Dismiss a Library action") }),
      jsx.jsx(shared.Yh, { color: "danger", type: "submit", children: message("library.emptyTrash.confirm", "Delete forever", "Confirm permanent deletion") }),
    ] }),
  ] });
  return jsx.jsx(shared.Ih, { open: true, onOpenChange: (open: boolean) => { if (!open) onClose(); }, "data-account-id": accountId, "data-user-id": userId, children: body });
}

export { EmptyLibraryTrashDialog };
