import "@rchunk/rolldown-runtime";
import {
  HZt as initializeSubagentsPanel,
  PQt as parentConversationIdFamily,
  RQt as pendingConversationIdsByHost,
  Ugn as getConversationHydrator,
  VZt as conversationHostFamily,
  Wgn as initializeConversationHydration,
  zZt as conversationExistsFamily,
} from "@rchunk/app-initial";
import {
  hn as descendantThreadsQuery,
  mn as initializeDescendantThreadsQuery,
} from "@rchunk/app-primary";

interface DescendantScope {
  get<Value>(signal: unknown, parameter?: unknown): Value;
}

interface VerifyDescendantInput {
  hostId: string;
  hydrateMissingAncestors?: boolean;
  parentConversationId: string;
  selectedConversationId: string;
}

function verifyDescendant(
  scope: DescendantScope,
  {
    hostId,
    hydrateMissingAncestors = false,
    parentConversationId,
    selectedConversationId,
  }: VerifyDescendantInput,
): boolean | Promise<boolean> {
  if (selectedConversationId === parentConversationId) return false;
  const visited = new Set<string>();
  let currentId = selectedConversationId;
  while (currentId !== parentConversationId) {
    if (visited.has(currentId)
      || scope.get<string[]>(pendingConversationIdsByHost, hostId).includes(currentId)) return false;
    visited.add(currentId);
    const currentHost = scope.get<string | null>(conversationHostFamily, currentId);
    if (currentHost != null && currentHost !== hostId) return false;
    const exists = scope.get<boolean>(conversationExistsFamily, currentId);
    const parentId = exists
      ? scope.get<string | null>(parentConversationIdFamily, currentId)
      : null;
    if (!exists || parentId == null) {
      const selectedParent = scope.get<string | null>(
        parentConversationIdFamily,
        selectedConversationId,
      );
      if (scope.get(conversationExistsFamily, selectedConversationId)
        && selectedParent != null
        && selectedParent !== parentConversationId) {
        const descendants = scope.get<{
          descendantThreads: Array<{ id: string }>;
          isComplete?: boolean;
        } | null>(descendantThreadsQuery, {
          conversationId: parentConversationId,
          hostId,
        });
        if (descendants?.descendantThreads.some((thread) => thread.id === selectedConversationId) !== true
          && (!hydrateMissingAncestors || descendants?.isComplete === true)) return false;
      }
      const missingId = currentId;
      return getConversationHydrator(scope, hostId)
        .hydrateBackgroundThreads([missingId], {
          includeTurns: missingId === selectedConversationId || exists,
        })
        .then(() => !scope.get(conversationExistsFamily, missingId)
          || scope.get(parentConversationIdFamily, missingId) == null
          ? false
          : verifyDescendant(scope, {
            hostId,
            hydrateMissingAncestors,
            parentConversationId,
            selectedConversationId,
          }));
    }
    currentId = parentId;
  }
  return true;
}

function initializeVerifyDescendant(): void {
  initializeConversationHydration();
  initializeSubagentsPanel();
  initializeDescendantThreadsQuery();
}

export {
  verifyDescendant as n,
  initializeVerifyDescendant as t,
};
