import { ArchivedThreadPreviewRead } from "./archived-preview";
import { Cs as isDurableHost, kd as defaultPermissions } from "@chunk/shared";
import { AUTOMATION_DETECTOR } from "./automation-detector";
import { attachmentsFromInput, projectItems, projectTurns } from "./hydration";
import { mergeTurnLists } from "../turns/item-merge";
import { appendHistoryIsland, exhaustedTailIsland, lastTurnWithTurnId } from "../turns/canonical-history";
import { listTurnItems } from "../turns/history-requests";
import { freezeIdentity } from "../vendor/immer";
type Turn = {
  turnId?: string | null;
  items: Array<Record<string, unknown>>;
  [key: string]: unknown;
};
type Conversation = {
  turns?: Turn[];
  turnHistory?: {
    kind?: string;
    history?: {
      islands?: Array<{ entries: Array<{ value: string }> }>;
      entitiesByKey?: Record<string, Turn>;
    };
  };
};
export const Cve = {
  turnMergePolicy: AUTOMATION_DETECTOR,
  applyOldestUserInput(
    turn: Record<string, unknown>,
    item: Record<string, unknown>,
  ) {
    if (item.type === "userMessage")
      Object.assign(turn.params as Record<string, unknown>, {
        input: item.content,
        clientUserMessageId: item.clientId,
        attachments: attachmentsFromInput(item.content as Array<{ type: string; text?: string }>),
      });
  },
  mapThreadItems: projectItems,
  mapThreadTurns: projectTurns,
  mergeTurns(left: Turn[], right: Turn[], options: Record<string, unknown> = {}) {
    return mergeTurnLists(left as any[], right as any[], {
      ...options,
      policy: AUTOMATION_DETECTOR,
    }) as Turn[];
  },
};
export function Tve(
  hostId: string,
  hasDesktopRuntime: boolean,
  catalogEnabled: boolean,
): number {
  return isDurableHost(hostId) || (!hasDesktopRuntime && hostId === "local")
    ? 50
    : catalogEnabled
      ? 0
      : 500;
}
export function uy(
  conversation: Conversation | null | undefined,
  policy: { mergeTurns(left: Turn[], right: Turn[]): Turn[] },
): Turn[] {
  if (conversation == null) return [];
  if (conversation.turnHistory?.kind !== "canonical") return conversation.turns ?? [];
  const history = conversation.turnHistory.history;
  const island = history == null ? null : exhaustedTailIsland(history as never);
  const turns =
    island?.entries
      .map((entry) => history?.entitiesByKey?.[entry.value])
      .filter((turn): turn is Turn => turn != null) ?? [];
  return policy.mergeTurns(turns, conversation.turns ?? []);
}
export function wve(
  conversation: Conversation | null | undefined,
  { maxItems, maxTextLength }: { maxItems: number; maxTextLength: number },
): Array<{ role: "user" | "assistant"; text: string }> | null {
  if (conversation == null) return null;
  const result: Array<{ role: "user" | "assistant"; text: string }> = [];
  const turns = uy(conversation, Cve);
  for (
    let ti = turns.length - 1;
    ti >= 0 && result.length < maxItems;
    ti -= 1
  ) {
    const items = turns[ti]?.items ?? [];
    for (
      let ii = items.length - 1;
      ii >= 0 && result.length < maxItems;
      ii -= 1
    ) {
      const item = items[ii];
      if (item?.type === "userMessage" && Array.isArray(item.content)) {
        const text = item.content
          .filter(
            (part) =>
              typeof part === "object" &&
              part != null &&
              "type" in part &&
              part.type === "text" &&
              "text" in part &&
              typeof part.text === "string",
          )
          .map((part) => (part as { text: string }).text)
          .join("\n")
          .trim();
        if (text)
          result.unshift({ role: "user", text: text.slice(-maxTextLength) });
      } else if (
        item?.type === "agentMessage" &&
        typeof item.text === "string"
      ) {
        const text = item.text.trim();
        if (text)
          result.unshift({
            role: "assistant",
            text: text.slice(-maxTextLength),
          });
      }
    }
  }
  return result;
}
export function bx(mode: string | undefined, action: string): void {
  if (mode === "paginated")
    throw Error(
      `${action} is not available for threads using paginated history yet.`,
    );
}
export async function bve(
  manager: any,
  policy: any,
  { conversationId, itemId, turnCursor, turnId }: { conversationId: string; itemId: string; turnCursor: string | null; turnId: string },
): Promise<void> {
  const initial = manager.getConversation(conversationId);
  const existingTurn = initial == null ? null : (initial.turnHistory?.kind === "canonical"
    ? Object.values(initial.turnHistory.history.entitiesByKey).find((turn: any) => turn.turnId === turnId)
    : initial.turns.find((turn: any) => turn.turnId === turnId));
  if (existingTurn?.items.some((item: any) => item.id === itemId) && !existingTurn.itemsPagination?.summaryItemIds?.includes(itemId)) return;
  const requestOptions = { priority: "interactive", source: "thread_hydration" };
  const [older, newer] = await Promise.all([
    manager.listThreadTurns(conversationId, { cursor: turnCursor, limit: 5, sortDirection: "desc", requestOptions }),
    manager.listThreadTurns(conversationId, { cursor: turnCursor, limit: 5, sortDirection: "asc", requestOptions }),
  ]);
  const conversation = manager.getConversation(conversationId);
  if (conversation == null) throw Error("Conversation disappeared while hydrating a search match");
  const rawTurns = [...older.response.data.slice().reverse(), ...newer.response.data.slice(1)];
  const paginationByTurnId = { ...newer.itemsPaginationByTurnId, ...older.itemsPaginationByTurnId };
  const matched = rawTurns.find((turn: any) => turn.id === turnId);
  const items = matched?.items.slice().reverse() ?? [];
  const itemIds = new Set(items.map((item: any) => item.id));
  let pagination = paginationByTurnId[turnId];
  if (pagination != null) pagination = { ...pagination };
  while (matched != null && pagination != null && !itemIds.has(itemId) && !pagination.hasLoadedOldest) {
    const page = await listTurnItems(manager.sendRequest.bind(manager), conversationId, turnId, pagination.olderCursor, requestOptions);
    const fresh = page.items.filter((item: any) => !itemIds.has(item.id));
    for (const item of fresh.reverse()) { itemIds.add(item.id); items.push(item); }
    matched.itemsView = page.nextCursor == null ? "full" : "summary";
    pagination.olderCursor = page.nextCursor;
    pagination.isLoadingOlder = false;
    pagination.hasLoadedOldest = page.nextCursor == null;
    paginationByTurnId[turnId] = pagination;
  }
  if (matched == null || !itemIds.has(itemId)) throw Error("Persisted conversation search match is no longer available");
  if (items.length !== matched.items.length) matched.items = items.reverse();
  const latestParams = lastTurnWithTurnId(conversation)?.params;
  const settings = conversation.latestThreadSettings;
  const cwd = settings?.cwd ?? conversation.cwd ?? latestParams?.cwd ?? "/";
  const defaults = defaultPermissions([cwd]);
  const permissions = {
    approvalPolicy: settings?.approvalPolicy ?? latestParams?.approvalPolicy ?? conversation.currentPermissions?.approvalPolicy ?? defaults.approvalPolicy,
    approvalsReviewer: settings?.approvalsReviewer ?? latestParams?.approvalsReviewer ?? conversation.currentPermissions?.approvalsReviewer ?? defaults.approvalsReviewer,
    sandboxPolicy: settings?.sandboxPolicy ?? latestParams?.sandboxPolicy ?? conversation.currentPermissions?.sandboxPolicy ?? defaults.sandboxPolicy,
  };
  const turns = policy.mapThreadTurns({
    threadId: conversationId, turns: rawTurns, model: conversation.latestModel,
    reasoningEffort: conversation.latestReasoningEffort, cwd, permissions, itemsPaginationByTurnId: paginationByTurnId,
  });
  let placed = false;
  manager.updateConversationState(conversationId, (state: any) => {
    placed = placeSearchHistoryIsland(state, policy.createSearchIslandId, {
      turns, olderCursor: older.response.nextCursor, newerCursor: newer.response.nextCursor,
    });
  });
  if (!placed) throw Error("Persisted conversation search match could not be placed");
  manager.broadcastConversationSnapshot(conversationId);
}

function searchHistoryPositions(history: any, entries: any[], read: (key: string) => any): Map<string, number> | null {
  const positions = new Map<string, number>();
  const keysByTurnId = new Map<string, string>();
  const stride = entries.length + 1;
  let position = 0;
  for (const island of history.islands) {
    for (const entry of island.entries) {
      positions.set(entry.value, position);
      const turnId = read(entry.value)?.turnId;
      if (turnId != null) keysByTurnId.set(turnId, entry.value);
      position += stride;
    }
    position += stride;
  }
  const anchorIndex = entries.findIndex((entry) => {
    const turnId = read(entry.value)?.turnId;
    return turnId != null && keysByTurnId.has(turnId);
  });
  if (anchorIndex !== -1) {
    const anchor = entries[anchorIndex];
    const turnId = anchor == null ? null : read(anchor.value)?.turnId;
    const existingKey = turnId == null ? null : (keysByTurnId.get(turnId) ?? null);
    const anchorPosition = existingKey == null ? null : (positions.get(existingKey) ?? null);
    if (anchorPosition == null) return null;
    const result = new Map(positions);
    for (const [index, entry] of entries.entries()) result.set(entry.value, anchorPosition + index - anchorIndex);
    return result;
  }
  const allKeys = Array.from(new Set([...history.islands.flatMap((island: any) => island.entries.map((entry: any) => entry.value)), ...entries.map((entry) => entry.value)]));
  if (allKeys.some((key) => read(key)?.turnStartedAtMs == null)) return null;
  allKeys.sort((left, right) => {
    const a = read(left); const b = read(right);
    return a.turnStartedAtMs === b.turnStartedAtMs
      ? (a.turnId ?? left).localeCompare(b.turnId ?? right)
      : a.turnStartedAtMs - b.turnStartedAtMs;
  });
  return new Map(allKeys.map((key, index) => [key, index]));
}

function placeSearchHistoryIsland(conversation: any, createId: () => string, { newerCursor, olderCursor, turns }: any): boolean {
  const history = conversation.turnHistory?.kind === "canonical" ? conversation.turnHistory.history : null;
  if (history == null || turns.length === 0) return false;
  const islandId = `search:${createId()}`;
  const additions: Record<string, any> = {};
  const read = (key: string) => additions[key] ?? history.entitiesByKey[key] ?? null;
  const entries = turns.map((turn: any, index: number) => {
    const entityKey = turn.turnId == null ? `${islandId}:local:${index}` : `turn:${turn.turnId}`;
    const existing = read(entityKey);
    additions[entityKey] = { ...(existing == null ? turn : (policyMergeTurn(existing, turn) ?? turn)) };
    return { key: `${islandId}:${index}`, value: entityKey };
  });
  const retained = new Set(entries.map((entry: any) => entry.value));
  const positions = searchHistoryPositions(history, entries, read);
  if (positions == null) return false;
  const boundary = (cursor: string | null, edge: string) => cursor == null
    ? { status: "exhausted", boundaryId: `${islandId}:${edge}` }
    : { status: "available", boundaryId: `${islandId}:${edge}`, handle: { cursor, oldestLoadedTurnId: turns[0]?.turnId ?? null }, progressKey: cursor };
  const topology = appendHistoryIsland(history, {
    id: islandId, entries, olderBoundary: boundary(olderCursor, "older") as never, newerBoundary: boundary(newerCursor, "newer") as never,
  }, {
    getIdentity: (key) => read(key)?.turnId ?? null,
    getPosition: ({ value }) => {
      const position = positions.get(value!);
      if (position == null) throw Error(`Missing search history position for ${value}`);
      return position;
    },
    merge: (existing, incoming) => { if (incoming !== existing) retained.delete(incoming); return existing; },
  });
  for (const [key, turn] of Object.entries(additions)) if (retained.has(key)) history.entitiesByKey[key] = freezeIdentity(turn);
  history.islands = freezeIdentity(topology.islands);
  history.isComplete = topology.isComplete;
  return true;
}

function policyMergeTurn(existing: any, incoming: any): any {
  return Cve.mergeTurns([existing], [incoming])[0];
}
export async function Tye({
  manager,
  conversationId,
  stopEphemeralThread,
}: {
  manager: {
    getConversation(id: string): { turns?: Turn[] } | null;
    interruptConversation?(id: string, mode: string): Promise<unknown>;
    sendRequest(
      method: string,
      params: unknown,
      options?: unknown,
    ): Promise<unknown>;
    logger?: { warning(message: string, data: unknown): void };
  };
  conversationId: string;
  stopEphemeralThread: boolean;
}
): Promise<void> {
  const conversation = manager.getConversation(conversationId);
  if (conversation?.turns?.some((turn) => turn.status === "inProgress"))
    try {
      await manager.interruptConversation?.(conversationId, "user-stop");
    } catch (error) {
      manager.logger?.warning("Failed to interrupt ephemeral thread", {
        sensitive: { error },
      });
    }
  await manager.sendRequest(
    stopEphemeralThread ? "thread/stop" : "thread/unsubscribe",
    { threadId: conversationId },
    { timeoutMs: 30000 },
  );
}
export { ArchivedThreadPreviewRead as yve };
