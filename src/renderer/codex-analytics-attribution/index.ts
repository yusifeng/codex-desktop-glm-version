import { FX as initializeSignals, sZ as createDerivedSignal } from "@rchunk/app-shared";
import { $en as conversationScope, HZt as initializeConversationState, itn as initializeRouteState, lQt as latestTurnByConversation } from "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";

interface TurnAttribution { threadId: string; turnId: string; }

let codexAnalyticsAttribution: unknown;
let initialized = false;
function initializeCodexAnalyticsAttribution(): void {
  if (initialized) return;
  initialized = true;
  initializeSignals();
  initializeConversationState();
  initializeRouteState();
  codexAnalyticsAttribution = createDerivedSignal(conversationScope, ({ get, scope }) => {
    const route = scope.value;
    if (route.routeKind !== "local-thread" || typeof route.conversationId !== "string") return null;
    const turn = get(latestTurnByConversation, route.conversationId) as { turnId?: string | null } | null;
    return turn?.turnId == null ? null : { threadId: route.conversationId, turnId: turn.turnId } satisfies TurnAttribution;
  });
}

export { codexAnalyticsAttribution as n, initializeCodexAnalyticsAttribution as t };
