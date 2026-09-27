import {
  fnn as initializeTurnProjection,
  mnn as projectTurn,
} from "@rchunk/app-initial";
import {
  a as CenterTruncator,
  i as renderTurnToMarkdown,
  o as initializeCenterTruncator,
  r as renderConversationTitle,
  t as initializeConversationMarkdown,
} from "@rchunk/conversation-markdown";

export interface ProjectionBudget {
  fits(value: unknown): boolean;
  select<Value>(
    values: readonly Value[],
    predicate?: (value: Value) => boolean,
    limit?: number,
  ): Value[];
}

export interface VisibleTurnEntry {
  preserveServerUserMessages?: boolean;
  requests: unknown;
  turn: Record<string, unknown>;
}

export interface ConversationContextOptions {
  cwd: string | null;
  isBackgroundSubagentsEnabled: boolean;
  markdownLimit: {
    maxChars: number;
    truncationMarker: string;
  };
  projectlessOutputDirectory: string | null;
  title: string | null;
  visibleTurnEntries: VisibleTurnEntry[];
}

class TurnProjectionBudget implements ProjectionBudget {
  remainingChars: number;
  remainingNodes: number;
  truncated = false;

  constructor(maxChars: number) {
    this.remainingChars = Math.max(0, maxChars * 2);
    this.remainingNodes = Math.max(1, Math.min(2048, maxChars));
  }

  fits(value: unknown): boolean {
    const remainingChars = this.remainingChars;
    if (this.visit(value, 0)) return true;
    this.remainingChars = remainingChars;
    this.truncated = true;
    return false;
  }

  select<Value>(
    values: readonly Value[],
    predicate?: (value: Value) => boolean,
    limit = this.remainingNodes,
  ): Value[] {
    const count = Math.min(values.length, Math.max(0, limit));
    const midpoint = Math.ceil(count / 2);
    const selected: Value[] = [];
    for (let index = 0; index < count && this.remainingNodes > 0; index++) {
      this.remainingNodes -= 1;
      const value =
        values[index < midpoint ? index : values.length - count + index];
      if (predicate?.(value) !== false) selected.push(value);
    }
    this.truncated ||= selected.length !== values.length;
    return selected;
  }

  private visit(value: unknown, depth: number): boolean {
    if (this.remainingNodes-- <= 0 || depth > 32) return false;
    if (typeof value === "string") {
      this.remainingChars -= value.length;
      return this.remainingChars >= 0;
    }
    if (typeof value !== "object" || value == null) return true;
    if (Array.isArray(value)) {
      for (const item of value) if (!this.visit(item, depth + 1)) return false;
      return true;
    }
    for (const [key, item] of Object.entries(value)) {
      if (!this.visit(key, depth + 1) || !this.visit(item, depth + 1)) return false;
    }
    return true;
  }
}

function renderConversationContext({
  cwd,
  isBackgroundSubagentsEnabled,
  markdownLimit,
  projectlessOutputDirectory,
  title,
  visibleTurnEntries,
}: ConversationContextOptions): string {
  const output = new CenterTruncator(markdownLimit);
  output.append(renderConversationTitle(title, markdownLimit));

  const renderEntry = (entry: VisibleTurnEntry): string | null => {
    const projectionBudget = new TurnProjectionBudget(markdownLimit.maxChars);
    const turn = projectTurn(entry.turn, entry.requests, {
      includeTurnDiff: false,
      projectionBudget,
      isBackgroundSubagentsEnabled,
      preserveServerUserMessages: entry.preserveServerUserMessages,
    });
    const rendered = renderTurnToMarkdown({
      turn,
      cwd,
      projectlessOutputDirectory,
      markdownLimit,
    });
    return projectionBudget.truncated
      ? `${rendered ?? ""}${markdownLimit.truncationMarker}`
      : rendered;
  };

  let index = 0;
  while (index < visibleTurnEntries.length && !output.truncated) {
    const rendered = renderEntry(visibleTurnEntries[index++]);
    if (rendered != null) {
      output.append("\n\n");
      output.append(rendered);
    }
  }

  if (index < visibleTurnEntries.length) {
    const tailLimit = Math.ceil(
      (markdownLimit.maxChars - markdownLimit.truncationMarker.length) / 2,
    );
    let tail = "";
    for (
      let tailIndex = visibleTurnEntries.length - 1;
      tailIndex >= index && tail.length < tailLimit;
      tailIndex--
    ) {
      const rendered = renderEntry(visibleTurnEntries[tailIndex]);
      if (rendered != null) {
        tail = (tail.length === 0 ? rendered : `${rendered}\n\n${tail}`).slice(
          -tailLimit,
        );
      }
    }
    if (tail.length > 0) {
      output.append("\n\n");
      output.append(tail);
    }
  }
  return `${output.toString().trimEnd()}\n`;
}

function initializeConversationContextRenderer(): void {
  initializeConversationMarkdown();
  initializeTurnProjection();
  initializeCenterTruncator();
}

initializeConversationContextRenderer();

export { renderConversationContext };
