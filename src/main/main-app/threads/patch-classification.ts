import { conversationTurns, lastTurn, type ConversationLike } from "../turns/canonical-history";

type Settings = Record<string, any>;

function activePermissionProfilePatch(settings: Settings): Settings {
  if (settings.activePermissionProfile !== undefined)
    return { activePermissionProfile: settings.activePermissionProfile };
  if (settings.sandboxPolicy !== undefined) return { activePermissionProfile: null };
  if (settings.permissions === undefined) return {};
  return {
    activePermissionProfile:
      settings.permissions == null ? null : { id: settings.permissions, extends: null },
  };
}

function mergedCollaborationMode(current: Settings, patch: Settings): Settings {
  if (patch.collaborationMode != null) return patch.collaborationMode;
  if (patch.model == null && patch.effort === undefined) return current;
  return {
    ...current,
    settings: {
      ...current.settings,
      model: patch.model ?? current.settings.model,
      reasoning_effort:
        patch.effort === undefined ? current.settings.reasoning_effort : patch.effort,
    },
  };
}

function mergedEffort(current: unknown, patch: Settings): unknown {
  return patch.effort === undefined
    ? patch.collaborationMode == null
      ? current
      : patch.collaborationMode.settings.reasoning_effort
    : patch.effort;
}

function updatePreviousTurnModel(
  conversation: Settings,
  previousModel: string,
  nextModel: string,
): void {
  if (lastTurn(conversation as ConversationLike) == null || previousModel.length === 0 || nextModel === previousModel)
    return;
  if (conversation.previousTurnModel == null) conversation.previousTurnModel = previousModel;
  else if (nextModel === conversation.previousTurnModel) conversation.previousTurnModel = null;
}

export function applyModelSettingsUpdate(conversation: Settings, settings: Settings): void {
  const previousModel = conversation.latestCollaborationMode.settings.model;
  conversation.latestThreadSettings = settings;
  conversation.latestModel = settings.model;
  conversation.modelProvider = settings.modelProvider;
  conversation.latestReasoningEffort = settings.effort;
  conversation.latestCollaborationMode = settings.collaborationMode;
  conversation.cwd = settings.cwd;
  updatePreviousTurnModel(conversation, previousModel, settings.collaborationMode.settings.model);
}
export const O_e = applyModelSettingsUpdate;

export function applyThreadSettingsUpdate(conversation: Settings, patch: Settings): void {
  const collaborationMode = mergedCollaborationMode(conversation.latestCollaborationMode, patch);
  const previousModel = conversation.latestCollaborationMode.settings.model;
  conversation.latestThreadSettings = {
    ...conversation.latestThreadSettings,
    ...patch,
    ...activePermissionProfilePatch(patch),
    ...(patch.sandboxPolicy !== undefined && patch.permissions === undefined
      ? { permissions: null }
      : {}),
    model:
      patch.model ??
      patch.collaborationMode?.settings.model ??
      conversation.latestThreadSettings?.model ??
      conversation.latestModel,
    effort: mergedEffort(
      conversation.latestThreadSettings?.effort === undefined
        ? conversation.latestReasoningEffort
        : conversation.latestThreadSettings.effort,
      patch,
    ),
    collaborationMode,
  };
  conversation.latestModel = conversation.latestThreadSettings.model ?? conversation.latestModel;
  if (conversation.latestThreadSettings.effort !== undefined)
    conversation.latestReasoningEffort = conversation.latestThreadSettings.effort;
  conversation.latestCollaborationMode = collaborationMode;
  conversation.cwd = patch.cwd ?? conversation.cwd;
  updatePreviousTurnModel(conversation, previousModel, collaborationMode.settings.model);
}
export const zv = applyThreadSettingsUpdate;

export function buildModelSettingsUpdate(
  response: Settings,
  model: unknown,
  effort: unknown,
  cwd: unknown,
  collaborationMode: unknown,
): Settings {
  return {
    cwd,
    approvalPolicy: response.approvalPolicy,
    approvalsReviewer: response.approvalsReviewer,
    activePermissionProfile: response.activePermissionProfile,
    sandboxPolicy: response.sandbox,
    permissions: response.activePermissionProfile?.id ?? null,
    model,
    serviceTier: response.serviceTier,
    effort,
    multiAgentMode: response.multiAgentMode,
    collaborationMode,
  };
}
export const Bv = buildModelSettingsUpdate;

export function permissionSettingsUpdate(config: Settings): Settings {
  return {
    approvalPolicy: config.approvalPolicy,
    approvalsReviewer: config.approvalsReviewer,
    activePermissionProfile: config.activePermissionProfile,
    sandboxPolicy: config.sandboxPolicy,
    permissions: config.activePermissionProfile?.id ?? null,
  };
}
export const Vv = permissionSettingsUpdate;

export function collectConversationMetrics(input: Settings): Settings {
  let turnCount = 0;
  let itemCount = 0;
  let maxTurns = 0;
  let maxItems = 0;
  let inflightTurns = 0;
  let threadsWithInflightTurn = 0;
  let streamingOwners = 0;
  let streamingFollowers = 0;
  let streamingWithoutRole = 0;
  let streamingWithActiveRuntime = 0;
  for (const conversationId of input.streamingConversations) {
    switch (input.getStreamRole(conversationId)?.role) {
      case "owner": streamingOwners += 1; break;
      case "follower": streamingFollowers += 1; break;
      case undefined: streamingWithoutRole += 1;
    }
    if (input.conversations.get(conversationId)?.threadRuntimeStatus?.type === "active")
      streamingWithActiveRuntime += 1;
  }
  for (const conversation of input.conversations.values()) {
    const turns = conversationTurns(conversation as ConversationLike);
    let hasInflightTurn = false;
    turnCount += turns.length;
    maxTurns = Math.max(maxTurns, turns.length);
    for (const turn of turns) {
      itemCount += turn.items.length;
      if (turn.status === "inProgress") {
        inflightTurns += 1;
        hasInflightTurn = true;
      }
      maxItems = Math.max(maxItems, turn.items.length);
    }
    if (hasInflightTurn) threadsWithInflightTurn += 1;
  }
  return {
    threadCountTotal: input.conversations.size,
    threadCountLoadedRecent: input.recentConversationIds.length,
    threadCountActive: input.streamingConversations.size,
    threadCountStreamingOwner: streamingOwners,
    threadCountStreamingFollower: streamingFollowers,
    threadCountStreamingWithoutRole: streamingWithoutRole,
    threadCountStreamingWithActiveRuntime: streamingWithActiveRuntime,
    threadCountStreamingWithoutActiveRuntime:
      input.streamingConversations.size - streamingWithActiveRuntime,
    threadCountWithInflightTurn: threadsWithInflightTurn,
    turnCountTotalLoaded: turnCount,
    itemCountTotalLoaded: itemCount,
    maxTurnsInSingleThread: maxTurns,
    maxItemsInSingleTurn: maxItems,
    pendingRequestCount: input.pendingRequestCount,
    inflightTurnCount: inflightTurns,
    reviewDiffFilesTotal: input.reviewPaneSnapshotMetrics.reviewDiffFilesTotal,
    reviewDiffLinesTotal: input.reviewPaneSnapshotMetrics.reviewDiffLinesTotal,
    reviewDiffBytesEstimate: input.reviewPaneSnapshotMetrics.reviewDiffBytesEstimate,
  };
}
export const D_e = collectConversationMetrics;
