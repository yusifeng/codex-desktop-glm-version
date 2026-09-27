import { $O as queryConstants, FX as initializeSignals, QI as initializeQueries, QX as createQueryFamily, ZI as appScope, ek as initializeMutations } from "@rchunk/app-shared";
import { cJt as initializeApi, rJt as apiClient } from "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";

interface AgentMessage { phase?: string; text: string; type: "agentMessage"; }
interface TurnResponse { data: Array<{ items: unknown[] }>; }

function finalResponseFromTurns(response: TurnResponse): string | null {
  const turn = response.data[0];
  if (turn == null) return null;
  let fallback: AgentMessage | null = null;
  for (let index = turn.items.length - 1; index >= 0; index--) {
    const item = turn.items[index];
    if (item != null && typeof item === "object" && "type" in item && (item as { type?: unknown }).type === "agentMessage") {
      const message = item as AgentMessage;
      if (message.text.trim() === "") continue;
      fallback ??= message;
      if (message.phase === "final_answer") return message.text;
    }
  }
  return fallback?.text ?? null;
}

class FinalResponseUnavailableError extends Error {}
let finalResponseQuery: unknown;
let initialized = false;

function initializeSubagentFinalResponseQuery(): void {
  if (initialized) return;
  initialized = true;
  initializeSignals(); initializeApi(); initializeQueries(); initializeMutations();
  finalResponseQuery = createQueryFamily(appScope, (input: { activationId: string | null; conversationId: string | null; isTurnLive: boolean; threadId: string | null }) => ({
    enabled: input.activationId != null && input.conversationId != null && input.threadId != null,
    queryKey: ["chatgpt-subagent-final-response", input.conversationId, input.threadId, input.activationId],
    queryFn: async () => {
      if (input.conversationId == null || input.threadId == null) return null;
      const response = await (apiClient as { safeGet(path: string, options: unknown): Promise<TurnResponse> }).safeGet("/flora/subagent/thread/turns", { parameters: { query: { conversationId: input.conversationId, threadId: input.threadId, limit: 1 } } });
      const result = finalResponseFromTurns(response);
      if (result == null) throw new FinalResponseUnavailableError("Subagent final response is not available yet");
      return result;
    },
    refetchOnWindowFocus: false,
    retryOnMount: !input.isTurnLive,
    retry: (count: number, error: unknown) => error instanceof FinalResponseUnavailableError && count < 2,
    retryDelay: (attempt: number) => Math.min(250 * 2 ** attempt + Math.random() * 100, 1_000),
    staleTime: queryConstants.INFINITE,
  }));
}

export { initializeSubagentFinalResponseQuery as n, finalResponseQuery as t };
