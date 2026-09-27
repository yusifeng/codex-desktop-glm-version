import "@rchunk/rolldown-runtime";
import {
  HI as normalizePath,
  IK as pathsEqual,
  RI as joinPath,
} from "@rchunk/app-shared";
import {
  Dhn as getCanonicalHistoryEntries,
  Dpn as initializeConversationHistory,
  Fin as getConversationTurns,
  HZt as initializeSidePanelRoutes,
  Iin as initializeArtifactOrigins,
  arn as initializeTurnItems,
  d9t as getTurnMessageId,
  f9t as initializeTurnMessages,
  irn as getTurnFileChanges,
  jin as getForkPoint,
  u9t as getTurnInputMessageId,
  vZt as hostServiceById,
} from "@rchunk/app-initial";

export interface ArtifactOriginatingTurn {
  inputMessageId?: string | null;
  messageId?: string | null;
  turnId: string;
}

export interface ArtifactRouteScope {
  value: {
    conversationId?: string;
    hostId?: string | null;
    routeKind: string;
  };
  get(signal: unknown, parameter?: unknown): unknown;
}

export interface ResolveArtifactOriginOptions {
  fallback?: ArtifactOriginatingTurn | null;
  hostId: string;
  path: string;
  conversationId: string;
}

export interface ResolvedArtifactOrigin {
  inputMessageId: string | null;
  messageId: string | null;
  threadId: string | null;
  turnId: string | null;
}

function resolveArtifactOriginFromRoute(
  scope: ArtifactRouteScope,
  {
    hostId,
    originatingTurn,
    path,
    threadId,
  }: {
    hostId: string;
    originatingTurn?: ArtifactOriginatingTurn | null;
    path: string;
    threadId: string;
  },
): ResolvedArtifactOrigin {
  const route = scope.value;
  const routeThreadId =
    route.routeKind === "local-thread" && route.conversationId === threadId
      ? route.conversationId
      : null;
  const origin =
    routeThreadId == null
      ? undefined
      : findArtifactOriginatingTurn(scope, {
          conversationId: routeThreadId,
          fallback: originatingTurn,
          hostId,
          path,
        });
  return {
    threadId: routeThreadId,
    turnId: origin?.turnId ?? null,
    inputMessageId: origin?.inputMessageId ?? null,
    messageId: origin?.messageId ?? null,
  };
}

function findArtifactOriginatingTurn(
  scope: ArtifactRouteScope,
  { conversationId, fallback, hostId, path }: ResolveArtifactOriginOptions,
): ArtifactOriginatingTurn | undefined {
  const route = scope.value;
  if (
    route.routeKind !== "local-thread" ||
    route.conversationId !== conversationId ||
    (route.hostId != null && route.hostId !== hostId)
  ) {
    return undefined;
  }

  const hostService = scope.get(hostServiceById, hostId) as
    | {
        getHostId(): string;
        getConversation(id: string): Record<string, unknown> | null;
      }
    | null
    | undefined;
  if (hostService?.getHostId() !== hostId) return undefined;
  const conversation = hostService.getConversation(conversationId);
  if (conversation == null || conversation.id !== conversationId) return undefined;

  const turns = getConversationTurns(conversation) as Array<Record<string, unknown>>;
  let candidateTurns = turns;
  if (getForkPoint(conversation) == null) {
    const turnHistory = conversation.turnHistory as
      | { kind: string; history: { entries?: unknown[]; entitiesByKey: Record<string, unknown> } }
      | undefined;
    if (turnHistory?.kind !== "canonical") return undefined;
    const firstEntry = getCanonicalHistoryEntries(turnHistory.history)?.entries[0] as
      | { value: string }
      | undefined;
    const firstEntity =
      firstEntry == null ? null : turnHistory.history.entitiesByKey[firstEntry.value];
    const firstTurnId = (firstEntity as { turnId?: string } | null)?.turnId;
    if (firstTurnId == null) return undefined;
    const firstIndex = turns.findIndex((turn) => turn.turnId === firstTurnId);
    if (firstIndex < 0) return undefined;
    candidateTurns = turns.slice(firstIndex);
  }

  for (let index = candidateTurns.length - 1; index >= 0; index -= 1) {
    const turn = candidateTurns[index];
    if (turn?.status !== "completed") return undefined;
    if ((turn.itemsPagination as { hasLoadedOldest?: boolean } | undefined)?.hasLoadedOldest === false) {
      return undefined;
    }
    const changes = getTurnFileChanges(turn) as {
      editedFilePaths: string[];
      outputFilePaths: string[];
    };
    const cwd = typeof turn.params === "object" && turn.params != null
      ? String((turn.params as { cwd?: string }).cwd ?? "")
      : "";
    const containsPath = [...changes.outputFilePaths, ...changes.editedFilePaths].some(
      (filePath) => pathsEqual(normalizePath(joinPath(cwd, filePath)), path),
    );
    if (!containsPath) continue;
    if (typeof turn.turnId !== "string") return undefined;
    const fallbackForTurn = fallback?.turnId === turn.turnId ? fallback : undefined;
    return {
      turnId: turn.turnId,
      inputMessageId:
        (getTurnInputMessageId(turn) as string | null | undefined) ??
        fallbackForTurn?.inputMessageId ??
        null,
      messageId:
        (getTurnMessageId(turn) as string | null | undefined) ??
        fallbackForTurn?.messageId ??
        null,
    };
  }
  return undefined;
}

function initializeArtifactOriginatingTurn(): void {
  initializeConversationHistory();
  initializeSidePanelRoutes();
  initializeArtifactOrigins();
  initializeTurnMessages();
  initializeTurnItems();
}

export {
  initializeArtifactOriginatingTurn as n,
  findArtifactOriginatingTurn as r,
  resolveArtifactOriginFromRoute as t,
};
