import "@rchunk/rolldown-runtime";
import { l3 as initializeDeepEqual } from "@rchunk/app-shared";
import {
  A_ as isEstimatedTurnEntry,
  E9t as initializeArtifactParser,
  T9t as parseArtifacts,
  fnn as initializeConversationProjection,
  k_ as initializeTurnEntryModel,
  mnn as projectConversationTurn,
  nWt as initializeTurnEntryRuntime,
  w9t as resolveArtifactResourcePaths,
} from "@rchunk/app-initial";
import {
  a as initializeTimestampConstants,
  i as attachTimestampSeparators,
} from "@rchunk/timestamps";
import {
  n as splitProjectedItems,
  t as initializeSplitItemsIntoRenderGroups,
} from "@rchunk/split-items-into-render-groups";
import {
  n as buildGeneratedImageGroup,
  r as initializeGeneratedImageOutputVisibility,
} from "@rchunk/generated-image-output-visibility";

interface ConversationTurn {
  finalAssistantStartedAtMs?: number;
  items: Array<{ id?: string; src?: string | null; text?: string; type: string }>;
  params: { input: unknown[] };
  status?: string;
  turnStartedAtMs?: number;
}

interface VisibleTurnEntry extends Record<string, unknown> {
  historyEntityKey?: string;
  historyPositionKey?: string;
  isLatestTurn?: boolean;
  preserveServerUserMessages?: boolean;
  requests?: unknown;
  turn?: ConversationTurn;
  turnId?: string;
  turnKey: string;
  turnSearchKey: string;
}

interface RenderedTurnEntry extends Record<string, unknown> {
  generatedImages?: unknown[];
  isAeonThread?: boolean;
  preserveServerUserMessages?: boolean;
  threadHandoffOperation?: { id: string };
  transcriptBlock?: { key: string; type: string; [key: string]: unknown } | null;
  turn?: ConversationTurn;
  turnId?: string;
  turnKey: string;
  turnSearchKey?: string;
}

interface BuildTurnEntriesOptions extends Record<string, unknown> {
  compactAeonAssistantMessageRevealState?: {
    hasSeededInitialSnapshot: boolean;
    messageStates: { clear(): void };
  } | null;
  completedThreadGoal?: unknown;
  completedThreadGoalTurnKey?: string;
  conversationId: string;
  cwd?: string;
  generatedImageTurnEntries: VisibleTurnEntry[];
  hasInheritedParentTurns?: boolean;
  hostId: string;
  isAeonThread?: boolean;
  isBackgroundSubagentsEnabled: boolean;
  isProjectlessConversation?: boolean;
  isReadOnly?: boolean;
  latestLoadedUserTurnId?: string;
  modelProvider?: unknown;
  onEditLastTurnMessage?: unknown;
  onForkTurnMessage?: unknown;
  previousEntries: RenderedTurnEntry[];
  projectlessOutputDirectory?: string | null;
  renderEntries: VisibleTurnEntry[];
  renderMcpApps?: boolean;
  requestUserInputAsyncUiEnabled: boolean;
  resolvedApps?: unknown;
  showFullTranscript?: boolean;
  showInProgressFixedContent?: boolean;
  showStrictReviewNotices?: boolean;
  supersededMcpAppWidgetCallIds?: unknown;
  threadHandoffOperation?: { id: string } | null;
  visibleSubagentParentThreadId?: string;
}

function isRenderedTurnEntry(entry: RenderedTurnEntry): boolean {
  return (
    !isEstimatedTurnEntry(entry) &&
    !(
      "type" in entry &&
      ["child-elicitation", "voice-nux", "voice-presentation", "voice-transcript"].includes(
        String(entry.type),
      )
    )
  );
}

function collectGeneratedImages({
  isAeonThread,
  isBackgroundSubagentsEnabled,
  requestUserInputAsyncUiEnabled,
  previousEntries,
  projectlessOutputDirectory,
  visibleTurnEntries,
}: {
  isAeonThread?: boolean;
  isBackgroundSubagentsEnabled: boolean;
  previousEntries: RenderedTurnEntry[];
  projectlessOutputDirectory: string | null;
  requestUserInputAsyncUiEnabled: boolean;
  visibleTurnEntries: VisibleTurnEntry[];
}): unknown[] {
  const previous = previousEntries[0]?.generatedImages;
  const images = visibleTurnEntries.flatMap(({ preserveServerUserMessages, requests, turn }) => {
    if (
      turn == null ||
      !turn.items.some((item) => item.type === "imageGeneration" && item.src != null)
    ) {
      return [];
    }
    const projected = (projectConversationTurn as unknown as (
      turn: Record<string, unknown>,
      requests: unknown,
      options: Record<string, unknown>,
    ) => { items: unknown[]; status: unknown })(
      turn as unknown as Record<string, unknown>,
      requests,
      {
        includeAeonProjection: isAeonThread || preserveServerUserMessages,
        isBackgroundSubagentsEnabled,
        requestUserInputAsyncUiEnabled,
        preserveServerUserMessages,
      },
    );
    const groups = splitProjectedItems(projected.items, projected.status, "all") as {
      assistantItem?: { content?: unknown };
      toolOutputItems: Array<{ src?: string | null }>;
    };
    const resourcePaths = resolveArtifactResourcePaths(
      parseArtifacts({
        assistantContent: groups.assistantItem?.content ?? null,
        projectlessOutputDirectory,
        turn: projected,
      }),
    );
    return (
      (buildGeneratedImageGroup({
        completedImages: groups.toolOutputItems.filter(({ src }) => src != null),
        endResourcePaths: resourcePaths,
        pendingPlaceholderCount: 0,
      }) as { images?: unknown[] } | null)?.images ?? []
    );
  });
  return deepEqual(previous, images) ? previous ?? [] : images;
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => deepEqual(value, right[index]));
  }
  if (typeof left === "object" && left != null && typeof right === "object" && right != null) {
    const leftRecord = left as Record<string, unknown>;
    const rightRecord = right as Record<string, unknown>;
    const keys = Object.keys(leftRecord);
    return keys.length === Object.keys(rightRecord).length && keys.every((key) => deepEqual(leftRecord[key], rightRecord[key]));
  }
  return false;
}

function areTranscriptBlocksEqual(
  previous: RenderedTurnEntry["transcriptBlock"],
  next: RenderedTurnEntry["transcriptBlock"],
): boolean {
  if (previous == null || next == null) return previous === next;
  if (previous.type !== next.type || previous.key !== next.key) return false;
  if (previous.type !== "assistant-message" || next.type !== "assistant-message") return true;
  if (!deepEqual(previous.item, next.item)) return false;
  const previousActivities = (previous.attachedActivityItems as Array<{ key: string }> | undefined) ?? [];
  const nextActivities = (next.attachedActivityItems as Array<{ key: string }> | undefined) ?? [];
  return (
    previousActivities.length === nextActivities.length &&
    previousActivities.every(({ key }, index) => key === nextActivities[index]?.key)
  );
}

function canReuseTurnEntry(previous: RenderedTurnEntry, next: RenderedTurnEntry): boolean {
  const comparedKeys = [
    "gapBeforePx",
    "minHeightPx",
    "timestampSeparatorAtMs",
    "aeonThreadTimestampMarkerSentAtMs",
    "aeonThreadTimestampFallbackMs",
    "aeonChannelChange",
    "showReplyQuote",
    "conversationId",
    "activitySummaryWithoutAssistant",
    "hideUserMessageActions",
    "voiceWorkActivity",
    "cwd",
    "historyEntityKey",
    "hostId",
    "isAeonThread",
    "isLatestTurn",
    "isMostRecentTurn",
    "isReadOnly",
    "totalTurnCount",
    "turnNumber",
    "isProjectlessConversation",
    "modelProvider",
    "onEditLastTurnMessage",
    "onForkTurnMessage",
    "completedThreadGoal",
    "generatedImages",
    "parentThreadAttachmentSourceConversationId",
    "preserveServerUserMessages",
    "renderMcpApps",
    "requests",
    "resolvedApps",
    "showFullTranscript",
    "showInProgressFixedContent",
    "threadHandoffOperation",
    "turnId",
    "turnKey",
    "turnSearchKey",
    "includeTranscriptTurnExtras",
    "isBackgroundSubagentsEnabled",
    "requestUserInputAsyncUiEnabled",
  ];
  if (comparedKeys.some((key) => previous[key] !== next[key])) return false;
  if (!deepEqual(previous.replyChain, next.replyChain)) return false;
  if (!deepEqual(previous.supersededMcpAppWidgetCallIds, next.supersededMcpAppWidgetCallIds)) return false;
  if (previous.turn?.status !== next.turn?.status) return false;
  if (previous.turn !== next.turn) {
    const stableItems =
      next.historyEntityKey != null &&
      previous.turnState == null &&
      next.turnState == null &&
      previous.turn?.items.length === next.turn?.items.length &&
      previous.turn?.items.every((item, index) => item.id === next.turn?.items[index]?.id);
    if (!stableItems) return false;
  }
  return (
    (previous.turnState as { transcriptItems?: unknown } | undefined)?.transcriptItems ===
      (next.turnState as { transcriptItems?: unknown } | undefined)?.transcriptItems &&
    areTranscriptBlocksEqual(previous.transcriptBlock, next.transcriptBlock)
  );
}

function buildLocalConversationTurnEntries(
  options: BuildTurnEntriesOptions,
): {
  entries: RenderedTurnEntry[];
  initialAeonMessageSentAtMs: null;
  latestRenderedTurnKey: string | null;
  nextCompactAeonRevealAt: null;
} {
  options.compactAeonAssistantMessageRevealState?.messageStates.clear();
  if (options.compactAeonAssistantMessageRevealState != null) {
    options.compactAeonAssistantMessageRevealState.hasSeededInitialSnapshot = false;
  }
  const previousByKey = new Map(options.previousEntries.map((entry) => [entry.turnKey, entry]));
  const previousVisible = options.previousEntries.filter(isRenderedTurnEntry);
  const handoffTurnKey =
    options.threadHandoffOperation == null
      ? null
      : previousVisible.find(
          (entry) => entry.threadHandoffOperation?.id === options.threadHandoffOperation?.id,
        )?.turnKey ?? null;
  const visibleEntries = options.renderEntries.filter((entry) => !isEstimatedTurnEntry(entry));
  const generatedImages = collectGeneratedImages({
    isAeonThread: options.isAeonThread,
    isBackgroundSubagentsEnabled: options.isBackgroundSubagentsEnabled,
    requestUserInputAsyncUiEnabled: options.requestUserInputAsyncUiEnabled,
    previousEntries: previousVisible,
    projectlessOutputDirectory: options.projectlessOutputDirectory ?? null,
    visibleTurnEntries: options.generatedImageTurnEntries,
  });
  const entries: RenderedTurnEntry[] = [];
  const turnNumberByIndex = new Map<number, number>();
  let latestRenderedTurnKey: string | null = null;
  let turnNumber = 0;
  let visibleIndex = 0;
  for (const entry of options.renderEntries) {
    if (isEstimatedTurnEntry(entry)) {
      const previous = previousByKey.get(entry.turnKey);
      entries.push(
        previous != null &&
        isEstimatedTurnEntry(previous) &&
        previous.estimatedHeightPx === entry.estimatedHeightPx
          ? previous
          : entry,
      );
      continue;
    }
    turnNumber += 1;
    const turnKey = entry.historyPositionKey ?? entry.turnSearchKey;
    const rendered: RenderedTurnEntry = {
      timestampSeparatorAtMs: null,
      aeonThreadTimestampMarkerSentAtMs: null,
      conversationId: options.conversationId,
      cwd: options.cwd,
      historyEntityKey: entry.historyEntityKey,
      hostId: options.hostId,
      isAeonThread: options.isAeonThread,
      isLatestTurn: entry.isLatestTurn,
      isMostRecentTurn: visibleIndex === visibleEntries.length - 1,
      isReadOnly: options.isReadOnly,
      showStrictReviewNotices: options.showStrictReviewNotices,
      totalTurnCount: visibleEntries.length,
      turnNumber,
      isProjectlessConversation: options.isProjectlessConversation,
      latestLoadedUserTurnId: options.latestLoadedUserTurnId,
      modelProvider: options.modelProvider,
      projectlessOutputDirectory: options.projectlessOutputDirectory ?? null,
      onEditLastTurnMessage: options.onEditLastTurnMessage,
      onForkTurnMessage: options.onForkTurnMessage,
      completedThreadGoal:
        options.completedThreadGoalTurnKey === entry.turnSearchKey
          ? options.completedThreadGoal
          : null,
      generatedImages,
      parentThreadAttachmentSourceConversationId:
        visibleIndex === 0 &&
        options.hasInheritedParentTurns &&
        options.visibleSubagentParentThreadId != null
          ? options.visibleSubagentParentThreadId
          : undefined,
      preserveServerUserMessages: entry.preserveServerUserMessages,
      renderMcpApps: options.renderMcpApps,
      requests: entry.requests,
      resolvedApps: options.resolvedApps,
      showFullTranscript: options.showFullTranscript,
      showInProgressFixedContent:
        options.showInProgressFixedContent && visibleIndex === visibleEntries.length - 1,
      supersededMcpAppWidgetCallIds: options.supersededMcpAppWidgetCallIds,
      turnId: entry.turnId,
      turnKey,
      turnSearchKey: entry.turnSearchKey,
      turn: entry.turn,
      isBackgroundSubagentsEnabled: options.isBackgroundSubagentsEnabled,
      requestUserInputAsyncUiEnabled: options.requestUserInputAsyncUiEnabled,
    };
    latestRenderedTurnKey = turnKey;
    turnNumberByIndex.set(entries.length, turnNumber);
    entries.push(rendered);
    visibleIndex += 1;
  }

  const timestampSeparators = attachTimestampSeparators(
    entries.map((entry) => {
      if (!isRenderedTurnEntry(entry) || entry.isAeonThread || entry.preserveServerUserMessages || entry.turn == null) return null;
      const timestamps: Array<{ role: string; sentAtMs?: number }> = [];
      if (entry.turn.params.input.length > 0) timestamps.push({ role: "user", sentAtMs: entry.turn.turnStartedAtMs });
      if (entry.turn.items.some(({ type }) => type === "agentMessage")) {
        timestamps.push({ role: "assistant", sentAtMs: entry.turn.finalAssistantStartedAtMs });
      }
      return timestamps;
    }),
  ) as Array<number | null>;
  const handoffTarget =
    handoffTurnKey != null && entries.some((entry) => isRenderedTurnEntry(entry) && entry.turnKey === handoffTurnKey)
      ? handoffTurnKey
      : latestRenderedTurnKey;
  let previousReplyChainId: unknown;
  for (const [index, entry] of entries.entries()) {
    if (!isRenderedTurnEntry(entry) || isEstimatedTurnEntry(entry)) continue;
    const numberedTurn = turnNumberByIndex.get(index);
    if (numberedTurn == null) continue;
    const replyChain = entry.replyChain as { id?: unknown } | undefined;
    const showReplyQuote = replyChain != null && replyChain.id !== previousReplyChainId;
    if (entry.transcriptBlock?.type === "user-message" || entry.transcriptBlock?.type === "assistant-message") {
      previousReplyChainId = replyChain?.id;
    }
    const next: RenderedTurnEntry = {
      ...entry,
      replyChain: undefined,
      showReplyQuote,
      gapBeforePx: undefined,
      timestampSeparatorAtMs: timestampSeparators[index] ?? null,
      aeonThreadTimestampMarkerSentAtMs: null,
      aeonChannelChange: undefined,
      isMostRecentTurn: numberedTurn === turnNumber,
      showInProgressFixedContent:
        options.showInProgressFixedContent && numberedTurn === turnNumber,
      threadHandoffOperation:
        entry.turnKey === handoffTarget ? options.threadHandoffOperation ?? undefined : undefined,
      totalTurnCount: turnNumber,
      turnNumber: numberedTurn,
    };
    const previous = previousByKey.get(entry.turnKey);
    entries[index] = previous != null && isRenderedTurnEntry(previous) && canReuseTurnEntry(previous, next)
      ? previous
      : next;
  }
  const stableEntries =
    options.previousEntries.length === entries.length &&
    entries.every((entry, index) => options.previousEntries[index] === entry)
      ? options.previousEntries
      : entries;
  return {
    entries: stableEntries,
    initialAeonMessageSentAtMs: null,
    latestRenderedTurnKey,
    nextCompactAeonRevealAt: null,
  };
}

function initializeLocalConversationThreadTurnEntries(): void {
  initializeTurnEntryRuntime();
  initializeTimestampConstants();
  initializeGeneratedImageOutputVisibility();
  initializeConversationProjection();
  initializeArtifactParser();
  initializeTurnEntryModel();
  void initializeDeepEqual;
  initializeSplitItemsIntoRenderGroups();
}

function initializeTurnEntryModelOnly(): void {
  initializeTurnEntryModel();
}

export {
  isRenderedTurnEntry as a,
  initializeTurnEntryModelOnly as i,
  collectGeneratedImages as n,
  initializeLocalConversationThreadTurnEntries as r,
  buildLocalConversationTurnEntries as t,
};
