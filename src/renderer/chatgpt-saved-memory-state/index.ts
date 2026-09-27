import "@rchunk/rolldown-runtime";
import {
  $O as timeConstants,
  FX as initializeSignalRuntime,
  FZ as missingQueryParameter,
  QI as initializeQueryRuntime,
  QX as createQueryFamily,
  ZI as appScope,
  ek as initializeQuerySignals,
  jZ as initializeMotionRuntime,
  lk as initializeToastRuntime,
  oZ as createSignalFamily,
  pk as toastManagerSignal,
  rZ as createDerivedFamily,
} from "@rchunk/app-shared";
import {
  $K as memoryCitationFeedbackFamily,
  Ozt as initializeCitationFeedback,
  Sdn as ApiError,
  Sqt as initializePepperOnboarding,
  Tzt as getApiErrorCode,
  U6t as currentAccountIdSignal,
  cJt as initializeApiClient,
  eq as initializeSavedMemoryApi,
  mpn as intlSignal,
  pdn as initializeAccountApi,
  ppn as initializeIntlRuntime,
  rJt as apiClient,
  udn as memoryApiClient,
  ydn as initializeMemoryApiClient,
} from "@rchunk/app-initial";

interface SavedMemory {
  id: string;
  [key: string]: unknown;
}

interface SavedMemoriesResponse {
  memories: SavedMemory[];
  [key: string]: unknown;
}

interface MemoryCitationSource {
  citationUuid?: string | null;
  feedback?: unknown;
  memoryId?: string | null;
}

interface DeleteMemoryInput {
  accountId: string;
  conversationId?: string | null;
  messageId?: string | null;
  onDeleteFailed(): void;
  source: MemoryCitationSource;
}

interface MemoryScope {
  get<Value>(signal: unknown, parameter?: unknown): Value;
  set<Value>(signal: unknown, parameter: unknown, value: Value | ((current: Value) => Value)): void;
  query: {
    cancel(query: unknown, parameter: unknown): Promise<unknown>;
    invalidate(query: unknown, parameter: unknown): Promise<unknown>;
    setData<Value>(query: unknown, parameter: unknown, update: (current: Value | undefined) => Value | undefined): void;
  };
  queryClient: {
    invalidateQueries(options: { queryKey: readonly unknown[] }): Promise<unknown>;
  };
}

let savedMemoriesQuery: unknown;
let deletingMemoryIds: unknown;
let isMemoryDeleted: unknown;

async function deleteMemoryRequest(
  memoryId: string,
  accountId: string,
): Promise<"already_deleted" | "deleted"> {
  try {
    const response = await apiClient.safeDelete<{ success: boolean }>(
      "/memories/{memory_id}",
      {
        additionalHeaders: { "ChatGPT-Account-ID": accountId },
        parameters: { path: { memory_id: memoryId.trim() } },
      },
    );
    if (!response.success) throw new Error("Memory deletion failed");
    return "deleted";
  } catch (error) {
    if (!(error instanceof ApiError
      && (error.status === 404 || getApiErrorCode(error)?.toLowerCase() === "memory_not_found"))) {
      throw error;
    }
    return "already_deleted";
  }
}

async function deleteSavedMemory(scope: MemoryScope, input: DeleteMemoryInput): Promise<void> {
  const { accountId, conversationId, messageId, source, onDeleteFailed } = input;
  const memoryId = source.memoryId;
  const deleting = memoryId == null
    ? []
    : scope.get<string[]>(deletingMemoryIds, accountId);
  if (memoryId == null || scope.get(currentAccountIdSignal) !== accountId || deleting.includes(memoryId)) {
    return;
  }
  scope.set<string[]>(deletingMemoryIds, accountId, (current) => [...current, memoryId]);
  try {
    const result = await deleteMemoryRequest(memoryId, accountId);
    await scope.query.cancel(savedMemoriesQuery, accountId);
    scope.query.setData<SavedMemoriesResponse>(savedMemoriesQuery, accountId, (current) =>
      current == null
        ? current
        : { ...current, memories: current.memories.filter((memory) => memory.id.trim() !== memoryId) });
    const refreshes: Promise<unknown>[] = [
      scope.query.invalidate(savedMemoriesQuery, accountId),
      scope.queryClient.invalidateQueries({
        queryKey: ["chatgpt-saved-memory-history", accountId],
      }),
    ];
    if (conversationId != null) {
      refreshes.push(scope.queryClient.invalidateQueries({
        queryKey: ["chatgpt-conversation-context-sources", conversationId, messageId],
      }));
      if (source.citationUuid != null) {
        const feedback = scope.get<{ feedback?: unknown } | null>(memoryCitationFeedbackFamily, {
          accountId,
          conversationId,
          messageId,
          citationUuid: source.citationUuid,
        });
        refreshes.push(apiClient.safePost(
          "/sidebar/conversation_context_citation_feedback",
          {
            additionalHeaders: { "ChatGPT-Account-ID": accountId },
            requestBody: {
              citation_uuid: source.citationUuid,
              conversation_id: conversationId,
              deleted: true,
              feedback: feedback == null ? (source.feedback ?? null) : feedback.feedback,
              message_id: messageId,
            },
          },
        ));
      }
    }
    Promise.all(refreshes).catch(() => undefined);
    if (scope.get(currentAccountIdSignal) === accountId) {
      const intl = scope.get<{ formatMessage(input: Record<string, unknown>): string }>(intlSignal);
      scope.get<import("@rchunk/app-shared").ToastManager>(toastManagerSignal).success(
        intl.formatMessage(result === "already_deleted" ? {
          id: "chatgptConversations.summaryPanel.sources.memory.delete.alreadyDeleted",
          defaultMessage: "Memory already deleted",
          description: "Success toast when a memory deleted from Sources was already absent on the server.",
        } : {
          id: "chatgptConversations.summaryPanel.sources.memory.delete.success",
          defaultMessage: "Memory deleted",
          description: "Success toast after an end user permanently deletes a cited saved account memory from the ChatGPT Sources side panel.",
        }),
      );
    }
  } catch {
    if (scope.get(currentAccountIdSignal) === accountId) {
      const intl = scope.get<{ formatMessage(input: Record<string, unknown>): string }>(intlSignal);
      scope.get<import("@rchunk/app-shared").ToastManager>(toastManagerSignal).danger(
        intl.formatMessage({
          id: "chatgptConversations.summaryPanel.sources.memory.delete.failed",
          defaultMessage: "Failed to forget memory",
          description: "Error toast when deleting a memory from Sources fails; the saved memories manager opens to let the user manage it there.",
        }),
        { errorAnalytics: { toastId: "memory_delete_failed" } },
      );
      onDeleteFailed();
    }
  } finally {
    scope.set<string[]>(deletingMemoryIds, accountId, (current) =>
      current.filter((id) => id !== memoryId));
  }
}

function initializeSavedMemoryState(): void {
  initializeMotionRuntime();
  initializeSignalRuntime();
  initializeToastRuntime();
  initializeIntlRuntime();
  initializeQueryRuntime();
  initializeQuerySignals();
  initializeAccountApi();
  initializeMemoryApiClient();
  initializeCitationFeedback();
  initializeSavedMemoryApi();
  initializeApiClient();
  initializePepperOnboarding();
  savedMemoriesQuery = createQueryFamily(appScope, (accountId: string | null) => ({
    enabled: accountId != null,
    queryFn: accountId == null
      ? missingQueryParameter
      : () => memoryApiClient.safeGet<SavedMemoriesResponse>("/memories", {
        additionalHeaders: { "ChatGPT-Account-ID": accountId },
        parameters: { query: { include_memory_entries: true } },
      }),
    queryKey: ["chatgpt-saved-memories", accountId],
    staleTime: timeConstants.THIRTY_SECONDS,
    refetchOnMount: true,
  }));
  deletingMemoryIds = createSignalFamily(appScope, () => [] as string[]);
  isMemoryDeleted = createDerivedFamily(
    appScope,
    ({ accountId, memoryId }: { accountId: string; memoryId?: string | null }, { get }) => {
      if (memoryId == null) return false;
      const result = get(savedMemoriesQuery, accountId) as {
        data?: SavedMemoriesResponse;
        isSuccess: boolean;
      };
      return (get(deletingMemoryIds, accountId) as string[]).includes(memoryId)
        || (result.isSuccess && !result.data?.memories.some((memory) => memory.id.trim() === memoryId));
    },
  );
}

export {
  initializeSavedMemoryState as i,
  isMemoryDeleted as n,
  deleteSavedMemory as r,
  savedMemoriesQuery as t,
};
