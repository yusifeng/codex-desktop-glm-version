import "@rchunk/rolldown-runtime";
import {
  ojt as initializeConversationPlanModel,
  sjt as normalizePlanTitle,
} from "@rchunk/app-initial";

export interface ConversationPlanItem {
  id: string;
  text: string;
  type: string;
}

export interface ConversationPlanTurn {
  items: Array<ConversationPlanItem | null>;
  status: string;
  turnId?: string | null;
}

export interface ConversationPlan {
  content: string;
  key: string;
  title: string | null;
}

function findLatestConversationPlan(
  turns: Array<ConversationPlanTurn | null>,
  requestedTurnId?: string | null,
): ConversationPlan | null {
  for (let turnIndex = turns.length - 1; turnIndex >= 0; turnIndex -= 1) {
    const turn = turns[turnIndex];
    if (turn == null || turn.status === "inProgress") continue;

    for (let itemIndex = turn.items.length - 1; itemIndex >= 0; itemIndex -= 1) {
      const item = turn.items[itemIndex];
      if (item == null || item.type !== "plan") continue;

      const key = turn.turnId ?? item.id;
      if (requestedTurnId != null && key !== requestedTurnId) continue;

      const heading = item.text.match(/^#\s+(.+)$/m)?.[1]?.trim();
      return {
        content: item.text,
        key,
        title: heading == null ? null : normalizePlanTitle(heading),
      };
    }
  }
  return null;
}

function initializeLocalConversationPlanModel(): void {
  initializeConversationPlanModel();
}

export {
  initializeLocalConversationPlanModel as n,
  findLatestConversationPlan as t,
};
