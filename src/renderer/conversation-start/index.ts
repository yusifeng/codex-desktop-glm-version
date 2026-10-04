import "@rchunk/rolldown-runtime";
import {
  $Bt as initializeConversationCreation,
  Izt as initializeConversationIds,
  Mzt as defaultSystemHint,
  Nzt as onboardingSystemHint,
  POt as initializeConversationStartup,
  ROt as startConversation,
  UBt as modelOptionsSignal,
  YVt as conversationStatusSignal,
  jOt as deleteConversation,
  uHt as initializeConversationLifecycle,
  wVt as serverConversationIdSignal,
} from "@rchunk/app-initial";
import { isTerminalConversationStatus } from "../app-initial/runtime/is-terminal-conversation-status";

export interface ConversationStartScope {
  get(signal: unknown, parameter?: unknown): unknown;
  queryClient: {
    invalidateQueries(options: { queryKey: unknown[] }): Promise<unknown>;
  };
  watch(
    callback: (context: {
      get(signal: unknown, parameter?: unknown): unknown;
    }) => void,
  ): () => void;
}

export interface StartConversationOptions {
  accountId: string;
  forceOnboarding?: boolean;
  onConversationStarted?(conversationId: string): void;
  prompt: unknown;
  requireServerConversation?: boolean;
  signal?: AbortSignal;
  userCompletionMessages?: unknown;
}

interface StartedConversation {
  conversationId: string;
  serverConversationId?: string | null;
}

async function startNewConversation(
  scope: ConversationStartScope,
  {
    accountId,
    forceOnboarding = false,
    onConversationStarted,
    prompt,
    requireServerConversation = false,
    signal,
    userCompletionMessages,
  }: StartConversationOptions,
): Promise<string | null> {
  if (signal?.aborted) return null;
  const modelOptions = scope.get(modelOptionsSignal) as {
    defaultThinkingEffortByModelSlug?: Record<string, unknown>;
    options: Array<{ lane: string; slug: string }>;
    versionOptions?: Array<{ modelSlugByLane: { thinking?: string } }>;
  } | null;
  const model =
    modelOptions?.versionOptions?.[0]?.modelSlugByLane.thinking ??
    modelOptions?.options.find((option) => option.lane === "thinking")?.slug;

  let serverConversationId: string | null = null;
  let deleted = false;
  let clientConversationId: string | null = null;
  const deleteStartedConversation = () => {
    if (!deleted && clientConversationId != null) {
      deleted = true;
      deleteConversation(scope, clientConversationId);
    }
  };
  const handleClientConversationId = (id: string) => {
    clientConversationId = id;
    if (signal?.aborted) deleteStartedConversation();
    else if (!requireServerConversation) onConversationStarted?.(id);
  };
  signal?.addEventListener("abort", deleteStartedConversation);

  try {
    let result: StartedConversation | null;
    try {
      result = (await startConversation(scope, {
        model,
        onClientThreadIdChange: handleClientConversationId,
        onServerThreadIdChange: requireServerConversation
          ? (id: string) => {
              serverConversationId = id;
            }
          : undefined,
        prompt,
        startupSignal: signal,
        systemHints: forceOnboarding
          ? [onboardingSystemHint, defaultSystemHint]
          : [defaultSystemHint],
        thinkingEffort:
          model == null
            ? null
            : (modelOptions?.defaultThinkingEffortByModelSlug?.[model] ?? null),
        userCompletionMessages,
      })) as StartedConversation | null;
    } catch (error) {
      if (signal?.aborted) {
        deleteStartedConversation();
        return null;
      }
      throw error;
    }

    clientConversationId ??= result?.conversationId ?? null;
    if (signal?.aborted) {
      deleteStartedConversation();
      return null;
    }
    if (!requireServerConversation) {
      await invalidateFinanceChats(scope, accountId);
      return result?.serverConversationId ?? result?.conversationId ?? null;
    }
    if (serverConversationId != null) {
      onConversationStarted?.(serverConversationId);
      await invalidateFinanceChats(scope, accountId);
      return serverConversationId;
    }
    if (result == null) return null;

    const resolvedServerId =
      result.serverConversationId ??
      (await waitForServerConversationId(scope, result.conversationId, signal));
    if (resolvedServerId == null || signal?.aborted) {
      if (signal?.aborted) deleteStartedConversation();
      return null;
    }
    onConversationStarted?.(resolvedServerId);
    await invalidateFinanceChats(scope, accountId);
    return resolvedServerId;
  } finally {
    signal?.removeEventListener("abort", deleteStartedConversation);
  }
}

function invalidateFinanceChats(
  scope: ConversationStartScope,
  accountId: string,
): Promise<unknown> {
  return scope.queryClient.invalidateQueries({
    queryKey: ["personal-finance", accountId, "chats"],
  });
}

function waitForServerConversationId(
  scope: ConversationStartScope,
  conversationId: string,
  signal?: AbortSignal,
): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    let unsubscribe: (() => void) | undefined;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", abort);
      unsubscribe?.();
      resolve(value);
    };
    const abort = () => finish(null);
    if (signal?.aborted) {
      finish(null);
      return;
    }
    signal?.addEventListener("abort", abort, { once: true });
    unsubscribe = scope.watch(({ get }) => {
      const serverId = get(serverConversationIdSignal, conversationId);
      if (typeof serverId === "string") finish(serverId);
      else if (isTerminalConversationStatus(get(conversationStatusSignal, conversationId))) {
        finish(null);
      }
    });
    if (settled) unsubscribe();
  });
}

function initializeConversationStart(): void {
  initializeConversationCreation();
  initializeConversationLifecycle();
  initializeConversationStartup();
  initializeConversationIds();
}

export { startNewConversation as n, initializeConversationStart as t };
