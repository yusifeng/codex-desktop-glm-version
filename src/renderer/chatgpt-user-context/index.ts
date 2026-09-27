import {
  $O as timeConstants,
  FX as initializeSignalRuntime,
  QI as initializeScopeRuntime,
  YX as createMutationSignal,
  ZI as appScope,
  eZ as createQuerySignal,
  ek as initializeQueryHooks,
} from "@rchunk/app-shared";
import {
  Sqt as initializeAccountState,
  Sun as initializeSessionState,
  U6t as accountIdSignal,
  _un as userIdSignal,
  cJt as initializeApiClient,
  rJt as apiClient,
  xun as personalizationEnabled,
} from "@rchunk/app-initial";

export interface ChatGptUserContext {
  [key: string]: unknown;
}

let chatGptUserContextQuery: ReturnType<typeof createQuerySignal>;

function initializeChatGptUserContext(): void {
  initializeSignalRuntime();
  initializeSessionState();
  initializeApiClient();
  initializeScopeRuntime();
  initializeQueryHooks();
  initializeAccountState();

  chatGptUserContextQuery = createQuerySignal(appScope, ({ scope }) => {
    const accountId = scope.get(accountIdSignal);
    const userId = scope.get(userIdSignal);
    return {
      enabled: scope.get(personalizationEnabled) && accountId != null,
      queryKey: ["chatgpt-user-context", accountId, userId],
      queryFn: async ({ signal }) => {
        if (
          scope.get(accountIdSignal) !== accountId ||
          scope.get(userIdSignal) !== userId
        ) {
          throw Error("Account changed before loading personalization");
        }
        return apiClient.safeGet<ChatGptUserContext>("/user_system_messages", {
          signal,
        });
      },
      staleTime: timeConstants.ONE_MINUTE,
    };
  });

  createMutationSignal<
    Record<string, unknown>,
    ChatGptUserContext,
    Error,
    Record<string, unknown>
  >(appScope, ({ scope }) => ({
    mutationKey: ["update-chatgpt-user-context"],
    mutationFn: async (requestBody) => {
      const accountId = scope.get(accountIdSignal);
      const userId = scope.get(userIdSignal);
      const snapshot = scope.query.snapshot(chatGptUserContextQuery);
      await snapshot.cancel();
      if (
        scope.get(accountIdSignal) !== accountId ||
        scope.get(userIdSignal) !== userId
      ) {
        throw Error("Account changed before saving personalization");
      }
      const response = await apiClient.safePatch<ChatGptUserContext>(
        "/user_system_messages",
        { requestBody },
      );
      snapshot.setData(response);
      return response;
    },
  }));
}

export { initializeChatGptUserContext as n, chatGptUserContextQuery as t };
