import { Wn as ResumeNotReadyError, Zo as errorToString } from "@chunk/shared";
import { delegateRequestToFollowerOwner } from "../files/open-file-watches";
import { applyConversationTurns, completeHistoryEntities, exhaustedTailIsland, hasCompleteHistory } from "../turns/canonical-history";
import { projectReadResponseTurns } from "./hydration";

type UnknownRecord = Record<string, any>;
interface Manager extends UnknownRecord {
  getConversation(id: string): UnknownRecord | null;
  updateConversationState(id: string, update: (value: UnknownRecord) => void): void;
}
const FOLLOWER_HISTORY_TIMEOUT_MS = 305_000;

function hasBoundedDurableHistory(manager: Manager, id: string): boolean {
  const conversation = manager.getConversation(id);
  return manager.getHostId() === "durable" && conversation?.boundedCloudHistory === true &&
    manager.getStreamRole(id)?.role !== "follower" && conversation?.turnHistory?.kind === "canonical" &&
    (conversation.turnHistory.history.isComplete || conversation.turnsPagination?.olderCursor != null);
}
async function resumeHistoryOwner(manager: Manager, id: string): Promise<void> {
  const conversation = manager.getConversation(id);
  if (conversation?.resumeState === "resumed" || manager.isConversationSuppressedAfterArchive(id) || hasBoundedDurableHistory(manager, id)) return;
  try {
    const result = await manager.resumeConversationForUnavailableOwner({
      conversationId: id, model: null, reasoningEffort: null, serviceTier: null,
      workspaceRoots: [manager.getConversationCwd(id) ?? "/"],
      collaborationMode: conversation?.latestCollaborationMode ?? null,
    });
    if (result.status === "not-ready") throw new ResumeNotReadyError(result);
  } catch (error) {
    if (!hasBoundedDurableHistory(manager, id)) throw error;
  }
}

export async function getCompleteConversationTurns(manager: Manager, id: string): Promise<unknown[]> {
  const conversation = manager.getConversation(id);
  if (conversation == null || (conversation.resumeState !== "resumed" &&
    !manager.isConversationSuppressedAfterArchive(id) && !hasBoundedDurableHistory(manager, id)))
    throw Error("Conversation must be resumed before loading history");
  if (!hasCompleteHistory(conversation as never)) await manager.loadRemainingConversationTurns(id);
  const turns = completeHistoryEntities(manager.getConversation(id) as never);
  if (turns == null) throw Error("Failed to load complete conversation history");
  return turns;
}
export const hve = getCompleteConversationTurns;

export async function ensureConversationHistoryLoaded(manager: Manager, id: string, relatedIds: string[] = [], { force = false }: { force?: boolean } = {}): Promise<void> {
  if (!force && !manager.useTailHydration() && !manager.isConversationSuppressedAfterArchive(id)) return;
  await Promise.all([id, ...relatedIds].map(async (conversationId) => {
    if (manager.isConversationSuppressedAfterArchive(conversationId)) {
      await manager.getCompleteConversationTurns(conversationId);
      return;
    }
    await resumeHistoryOwner(manager, conversationId);
    const conversation = manager.getConversation(conversationId);
    if (hasBoundedDurableHistory(manager, conversationId)) {
      await manager.getCompleteConversationTurns(conversationId);
      return;
    }
    const delegated = await delegateRequestToFollowerOwner({
      conversationId,
      getStreamRole: (threadId) => manager.getStreamRole(threadId),
      markConversationNeedsResumeForUnavailableOwner: (threadId, ownerId) => manager.markConversationNeedsResumeForUnavailableOwner(threadId, ownerId),
      resumeConversationForUnavailableOwner: (options) => manager.resumeConversationForUnavailableOwner(options),
      workspaceRoots: [manager.getConversationCwd(conversationId) ?? "/"],
      collaborationMode: conversation?.latestCollaborationMode ?? null,
      reasoningEffort: conversation?.latestReasoningEffort ?? null,
      serviceTier: null,
      sendRequest: async (role) => {
        try {
          const response = await manager.sendThreadFollowerRequest(role, "thread-follower-load-complete-history", { conversationId }, { timeoutMs: FOLLOWER_HISTORY_TIMEOUT_MS });
          if (response != null && role?.role === "follower")
            await manager.waitForConversationRevision(conversationId, role.ownerClientId, response.revision, 30_000);
          return response == null ? null : { result: response };
        } catch (error) {
          const message = errorToString(error);
          if (["client-disconnected", "webcontents-destroyed", "webview-disposed", "provider-disposed"].some((part) => message.includes(part)))
            throw Error(`no-client-found: ${message}`);
          throw error;
        }
      },
    });
    if (delegated == null) await manager.getCompleteConversationTurns(conversationId);
  }));
}
export const gve = ensureConversationHistoryLoaded;

export async function loadOlderConversationHistoryPage(manager: Manager, id: string, relatedIds: string[] = [], options: UnknownRecord = {}): Promise<void> {
  if (!manager.useTailHydration() && !manager.isConversationSuppressedAfterArchive(id)) return;
  await Promise.all([id, ...relatedIds].map(async (conversationId) => {
    const conversation = manager.getConversation(conversationId);
    if (manager.getHostId() === "durable" && (conversation?.resumeState ?? "needs_resume") === "needs_resume" &&
      !manager.hasInFlightConversationResume(conversationId)) {
      await manager.loadBackgroundThreadHistoryPage(conversationId);
      return;
    }
    await resumeHistoryOwner(manager, conversationId);
    await manager.loadOlderConversationTurnsPage(conversationId,
      conversationId === id || options.useCompactHistory !== true || manager.getConversation(conversationId)?.turnsPagination?.source === "compact"
        ? options : { itemsView: "summary" });
  }));
}
export const _ve = loadOlderConversationHistoryPage;

export function applyRollbackResponse(manager: Manager, { conversationId, conversationState, rollbackResponse }: {
  conversationId: string; conversationState: UnknownRecord; rollbackResponse: UnknownRecord;
}, accept: (turns: unknown[], truncatedBefore?: boolean) => void): void {
  const thread = rollbackResponse.thread as UnknownRecord;
  const projectedTurns = projectReadResponseTurns(rollbackResponse, {
    workspaceRoots: conversationState.cwd ? [conversationState.cwd] : [], fallbackCwd: conversationState.cwd ?? null,
    model: conversationState.latestModel, reasoningEffort: conversationState.latestReasoningEffort,
  });
  manager.updateConversationState(conversationId, (state) => {
    delete state.lastInjectedPassiveContextKey;
    applyConversationTurns(state as never, projectedTurns, true, undefined);
    state.turnsPagination = { olderCursor: null, oldestLoadedTurnId: null, isLoadingOlder: false, hasLoadedOldest: true };
    state.requests = []; state.resumeState = "resumed"; state.sessionId = thread.sessionId;
    state.rolloutPath = thread.path ?? state.rolloutPath; state.cwd = thread.cwd || state.cwd;
    state.originator = thread.originator ?? state.originator; state.source = thread.source;
    state.agentNickname = thread.agentNickname; state.forkedFromId = thread.forkedFromId == null ? null : String(thread.forkedFromId);
    state.gitInfo = thread.gitInfo; state.threadRuntimeStatus = thread.status; state.hasUnreadTurn = false;
    const updatedAt = Number(thread.updatedAt) * 1000;
    if (Number.isFinite(updatedAt)) state.updatedAt = updatedAt;
  });
  accept(thread.turns);
}
export const fve = applyRollbackResponse;

export function applyRevertResponse(manager: Manager, { conversationId, response, revertedTurns }: {
  conversationId: string; response: UnknownRecord; revertedTurns: Array<{ turnId?: string | null }>;
}, accept: (truncatedBefore: boolean) => void): void {
  const { thread, turnsBackwardsCursor, itemsBackwardsCursor } = response as {
    thread: UnknownRecord; turnsBackwardsCursor: string | null; itemsBackwardsCursor: string | null;
  };
  const removed = new Set(revertedTurns.map(({ turnId }) => turnId));
  manager.updateConversationState(conversationId, (state) => {
    delete state.lastInjectedPassiveContextKey;
    const history = state.turnHistory?.kind === "canonical" ? state.turnHistory.history : null;
    const tail = history == null ? null : exhaustedTailIsland(history);
    if (history == null) state.turns = state.turns.filter(({ turnId }: { turnId?: string | null }) => !removed.has(turnId));
    else {
      history.generation += 1;
      for (const island of history.islands)
        island.entries = island.entries.filter(({ value }: { value: string }) => {
          const turn = history.entitiesByKey[value];
          if (turn == null || (!removed.has(turn.turnId) && (island !== tail || turn.turnId != null))) return true;
          delete history.entitiesByKey[value];
          return false;
        });
    }
    if (tail?.entries.length === 0) {
      tail.olderBoundary = (turnsBackwardsCursor == null
        ? { status: "exhausted", boundaryId: `${tail.id}:older` }
        : { status: "available", boundaryId: `${tail.id}:older`, handle: { cursor: turnsBackwardsCursor, oldestLoadedTurnId: null }, progressKey: JSON.stringify([turnsBackwardsCursor, null]) }) as never;
      if (turnsBackwardsCursor == null && history?.islands.length === 1) history.isComplete = true;
      if (state.turnsPagination != null) {
        state.turnsPagination.olderCursor = turnsBackwardsCursor;
        state.turnsPagination.oldestLoadedTurnId = null;
        state.turnsPagination.hasLoadedOldest = turnsBackwardsCursor == null;
      }
    }
    state.sessionId = thread.sessionId; state.paginatedHistory = { itemsBackwardsCursor };
    state.rolloutPath = thread.path ?? state.rolloutPath; state.cwd = thread.cwd || state.cwd;
    state.threadRuntimeStatus = thread.status;
  });
  accept(turnsBackwardsCursor != null);
}
export const pve = applyRevertResponse;
