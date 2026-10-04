import "@rchunk/rolldown-runtime";
import {
  FX as initializeSignalRuntime,
  QI as initializeScopedSignals,
  ZI as conversationIdScope,
  lZ as createScopedState,
  rZ as createScopedDerived,
} from "@rchunk/app-shared";
import {
  F_t as sourceEntityList,
  HZt as initializeConversationSources,
  OZt as sourceEntityByKey,
  O_t as initializeSourceEntities,
  TQt as sourceFallbackSignal,
  Tfn as areConversationTurnsEqual,
  lQt as activeConversationTurn,
  n$t as priorConversationTurns,
  t$t as sourceHistorySignal,
  wQt as hostIdByConversation,
} from "@rchunk/app-initial";
import { flattenConversationItems } from "../app-initial/runtime/flatten-conversation-items";

export interface SourceTurn {
  attachments?: unknown;
  items: unknown[];
  params: {
    attachments?: unknown;
    input?: unknown;
    threadId?: string;
  };
  status: string;
  turnId?: string;
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (typeof left !== "object" || left == null || typeof right !== "object" || right == null) {
    return false;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => deepEqual(value, right[index]))
    );
  }
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const keys = Object.keys(leftRecord);
  return (
    keys.length === Object.keys(rightRecord).length &&
    keys.every((key) => Object.hasOwn(rightRecord, key) && deepEqual(leftRecord[key], rightRecord[key]))
  );
}

function getRelevantSourceItems(turn: SourceTurn): unknown[] {
  return (flattenConversationItems(turn.items) as Array<{ type?: string }>).filter(
    (item) =>
      item.type === "userMessage" ||
      item.type === "steeringUserMessage" ||
      item.type === "webSearch" ||
      item.type === "mcpToolCall",
  );
}

function areSourceTurnsEqual(
  left: SourceTurn | null | undefined,
  right: SourceTurn | null | undefined,
): boolean {
  if (left == null || right == null) return left === right;
  return (
    left.turnId === right.turnId &&
    left.status === right.status &&
    left.params.threadId === right.params.threadId &&
    deepEqual(left.params.input, right.params.input) &&
    deepEqual(left.params.attachments, right.params.attachments) &&
    deepEqual(getRelevantSourceItems(left), getRelevantSourceItems(right))
  );
}

let sourceLinksByThread: unknown;
let conversationTurnsForSources: unknown;
let activeTurnForSources: unknown;
let allConversationTurnsForSources: unknown;

function initializeLocalConversationSourcesSignals(): void {
  initializeSignalRuntime();
  initializeConversationSources();
  initializeSourceEntities();
  initializeScopedSignals();

  sourceLinksByThread = createScopedState(
    conversationIdScope,
    () => new WeakMap<object, unknown>(),
    undefined,
    { owner: (value: { threadId?: string } | null | undefined) => value?.threadId },
  );

  conversationTurnsForSources = createScopedDerived(
    conversationIdScope,
    (conversationId: string | null, { get }: { get(signal: unknown, parameter?: unknown): unknown }) => {
      if (conversationId == null) return null;
      const hostId = get(hostIdByConversation, conversationId);
      const entities = get(sourceEntityList, { hostId, threadId: conversationId }) as
        | Array<{ type: string; value: unknown }>
        | null;
      if (entities == null) {
        get(sourceFallbackSignal, conversationId);
        get(sourceHistorySignal, conversationId);
        return (get(priorConversationTurns, conversationId) as unknown[] | null)?.slice(0, -1) ?? null;
      }
      const keys = entities.flatMap((entity) =>
        entity.type === "content" ? [entity.value] : [],
      );
      const turns: unknown[] = [];
      for (const key of keys.slice(0, -1)) {
        const turn = get(sourceEntityByKey, { conversationId, entityKey: key });
        if (turn == null) {
          return (get(priorConversationTurns, conversationId) as unknown[] | null)?.slice(0, -1) ?? null;
        }
        turns.push(turn);
      }
      return turns;
    },
    {
      isEqual: (left: unknown[] | null, right: unknown[] | null) =>
        left == null || right == null ? left === right : areConversationTurnsEqual(left, right),
    },
  );

  activeTurnForSources = createScopedDerived(
    conversationIdScope,
    (conversationId: string | null, { get }: { get(signal: unknown, parameter?: unknown): unknown }) =>
      get(activeConversationTurn, conversationId),
    { isEqual: areSourceTurnsEqual },
  );

  allConversationTurnsForSources = createScopedDerived(
    conversationIdScope,
    (conversationId: string | null, { get }: { get(signal: unknown, parameter?: unknown): unknown }) => {
      if (conversationId == null) return null;
      const turns = (get(conversationTurnsForSources, conversationId) as SourceTurn[] | null) ?? [];
      const activeTurn = get(activeTurnForSources, conversationId) as SourceTurn | null;
      return activeTurn == null ? turns : [...turns, activeTurn];
    },
    {
      isEqual: (left: SourceTurn[] | null, right: SourceTurn[] | null) =>
        left == null || right == null
          ? left === right
          : left.length === right.length &&
            left.every((turn, index) => turn === right[index] || areSourceTurnsEqual(turn, right[index])),
    },
  );
}

export {
  sourceLinksByThread as i,
  initializeLocalConversationSourcesSignals as n,
  conversationTurnsForSources as r,
  allConversationTurnsForSources as t,
};
