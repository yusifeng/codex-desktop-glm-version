import { ArchivedThreadPreviewRead } from "./archived-preview";
import { Cs as isDurableHost } from "@chunk/shared";
import { AUTOMATION_DETECTOR } from "./automation-detector";
import { attachmentsFromInput, projectItems, projectTurns } from "./hydration";
import { mergeTurnLists } from "../turns/item-merge";
import { exhaustedTailIsland } from "../turns/canonical-history";
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
  manager: { broadcastConversationSnapshot(id: string): unknown },
  _policy: unknown,
  match: { conversationId: string },
): Promise<void> {
  manager.broadcastConversationSnapshot(match.conversationId);
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
