type Settings = Record<string, unknown>;
function permissionSettings(config: unknown): Settings {
  if (typeof config !== "object" || config == null) return {};
  const value = config as Settings;
  return {
    approvalPolicy: value.approvalPolicy,
    approvalsReviewer: value.approvalsReviewer,
    activePermissionProfile:
      value.activePermissionProfile ?? value.permissionProfileId,
    sandboxPolicy: value.sandboxPolicy,
    permissions:
      value.permissions ??
      value.activePermissionProfile ??
      value.permissionProfileId,
  };
}
export function applyThreadSettingsUpdate(
  conversation: Settings,
  patch: Settings,
): void {
  const previousModel = conversation.latestModel;
  const current = {
    ...((conversation.latestThreadSettings as Settings | undefined) ?? {}),
    ...patch,
  };
  conversation.latestThreadSettings = current;
  if (patch.model !== undefined) conversation.latestModel = patch.model;
  if (patch.reasoningEffort !== undefined)
    conversation.latestReasoningEffort = patch.reasoningEffort;
  if (patch.collaborationMode !== undefined)
    conversation.latestCollaborationMode = patch.collaborationMode;
  if (patch.cwd !== undefined) conversation.cwd = patch.cwd;
  if (previousModel !== conversation.latestModel)
    conversation.previousTurnModel = previousModel;
}
export const zv = applyThreadSettingsUpdate;
export function applyModelSettingsUpdate(
  conversation: Settings,
  settings: Settings,
): void {
  conversation.latestThreadSettings = { ...settings };
  applyThreadSettingsUpdate(conversation, settings);
}
export function buildModelSettingsUpdate(
  response: Settings,
  model: unknown,
  reasoningEffort: unknown,
  cwd: unknown,
  collaborationMode: unknown,
): Settings {
  return {
    cwd,
    approvalPolicy: response.approvalPolicy,
    approvalsReviewer: response.approvalsReviewer,
    activePermissionProfile: response.activePermissionProfile,
    sandboxPolicy: response.sandbox ?? response.sandboxPolicy,
    permissions: response.activePermissionProfile ?? response.permissions,
    model,
    serviceTier: response.serviceTier,
    reasoningEffort,
    multiAgentMode: response.multiAgentMode,
    collaborationMode,
  };
}
export const Bv = buildModelSettingsUpdate;
export function permissionSettingsUpdate(config: unknown): Settings {
  return permissionSettings(config);
}
export const Vv = permissionSettingsUpdate;
export function collectConversationMetrics(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const conversations = Array.isArray(input.conversations)
    ? input.conversations
    : input.conversations instanceof Map
      ? [...input.conversations.values()]
      : [];
  let turns = 0,
    items = 0;
  for (const conversation of conversations) {
    if (typeof conversation !== "object" || conversation == null) continue;
    const list =
      (conversation as { turns?: Array<{ items?: unknown[] }> }).turns ?? [];
    turns += list.length;
    items += list.reduce((sum, turn) => sum + (turn.items?.length ?? 0), 0);
  }
  return {
    loadedThreadCount: conversations.length,
    loadedTurnCount: turns,
    loadedItemCount: items,
  };
}
export const D_e = collectConversationMetrics;
