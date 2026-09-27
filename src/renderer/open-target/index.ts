import "@rchunk/rolldown-runtime";
import {
  Chn as getThreadDisplayName,
  Dpn as initializeConversationHistory,
  HZt as initializeConversationSources,
  PQt as parentConversationId,
  Pnn as getAgentPathDisplayName,
  Thn as getThreadSourceMetadata,
  _Qt as conversationTurns,
  jQt as threadSourceById,
} from "@rchunk/app-initial";
import {
  mn as initializeBackgroundAgents,
  pn as backgroundAgentsByParent,
} from "@rchunk/app-primary";

export interface OpenTargetScope {
  get(signal: unknown, parameter?: unknown): unknown;
}

export interface OpenTarget {
  canInteract: boolean;
  conversationId: string;
  displayName: string;
}

function findOpenTargetInConversation(
  scope: OpenTargetScope,
  parentConversationIdValue: string,
  targetConversationId: string,
): OpenTarget | null {
  const turns = (scope.get(conversationTurns, parentConversationIdValue) as Array<{
    items: Array<Record<string, unknown>>;
  }> | null) ?? [];
  for (const turn of turns) {
    for (const item of turn.items) {
      if (
        item.type === "collabAgentToolCall" &&
        item.tool === "spawnAgent" &&
        item.senderThreadId === parentConversationIdValue &&
        (item.receiverThreadIds as string[]).includes(targetConversationId)
      ) {
        const receiverThread = (
          item.receiverThreads as Array<{
            threadId: string;
            thread?: Record<string, unknown>;
          }>
        ).find((candidate) => candidate.threadId === targetConversationId)?.thread;
        const source = getThreadSourceMetadata(
          receiverThread?.source ?? scope.get(threadSourceById, targetConversationId),
        ) as { agentNickname?: string; parentThreadId?: string } | null;
        const recordedParent = scope.get(parentConversationId, targetConversationId);
        if (
          (source?.parentThreadId != null && source.parentThreadId !== parentConversationIdValue) ||
          (recordedParent != null && recordedParent !== parentConversationIdValue)
        ) {
          continue;
        }
        const displayName =
          (getThreadDisplayName(receiverThread) as string | null) ?? source?.agentNickname?.trim();
        if (displayName == null || displayName.length === 0) continue;
        return {
          canInteract: true,
          conversationId: targetConversationId,
          displayName,
        };
      }
      if (
        item.type === "subAgentActivity" &&
        item.kind === "started" &&
        item.agentThreadId === targetConversationId
      ) {
        const displayName = getAgentPathDisplayName(item.agentPath);
        if (displayName != null) {
          return {
            canInteract: false,
            conversationId: targetConversationId,
            displayName,
          };
        }
      }
    }
  }
  return null;
}

function getOpenTarget(
  scope: OpenTargetScope,
  parentConversationIdValue: string,
  hostId: string,
  targetConversationId: string,
): OpenTarget | null {
  const knownTargets = scope.get(backgroundAgentsByParent, {
    conversationId: parentConversationIdValue,
    hostId,
  }) as OpenTarget[];
  return (
    knownTargets.find((target) => target.conversationId === targetConversationId) ??
    findOpenTargetInConversation(scope, parentConversationIdValue, targetConversationId)
  );
}

function initializeOpenTarget(): void {
  initializeConversationHistory();
  initializeConversationSources();
  initializeBackgroundAgents();
}

export {
  findOpenTargetInConversation as n,
  initializeOpenTarget as r,
  getOpenTarget as t,
};
