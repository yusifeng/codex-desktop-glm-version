import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerCache,
  BX as useSignalFamilyValue,
  FX as initializeSignalRuntime,
  G3 as hostMessageBridge,
  HX as useSignalValue,
  LX as useScope,
  QI as initializeScopedSignals,
  W3 as initializeHostMessageBridge,
  YF as streamRoleProductEvent,
  ZI as conversationIdScope,
  e6 as getReactRuntime,
  fI as initializeProductEvents,
} from "@rchunk/app-shared";
import {
  $en as conversationScope,
  HZt as initializeConversationSources,
  MQt as streamRoleSignal,
  al as getThreadPermissions,
  cl as initializeHeartbeatAutomation,
  cm as initializePermissionState,
  il as getCollaborationMode,
  itn as initializeConversationScope,
  lQt as activeConversationTurn,
  ol as threadPermissionOverrides,
  rQt as collaborationModeByConversation,
  rl as setThreadPermissionOverride,
  sQt as conversationMetadata,
  sl as conversationEligibilityReason,
  sm as conversationEligibility,
  xpn as dispatchProductEvent,
  ypn as initializeStreamRoles,
} from "@rchunk/app-initial";

export interface ConversationStreamRoleProps {
  conversationId: string;
}

function ConversationAutomationStateBridge({
  conversationId,
}: ConversationStreamRoleProps): null {
  const React = getReactRuntime();
  const scope = useScope(conversationIdScope) as {
    get(signal: unknown, parameter?: unknown): unknown;
    set(signal: unknown, update: unknown): void;
  };
  const readSignalFamily = useSignalFamilyValue as unknown as (
    signal: unknown,
    parameter: unknown,
  ) => unknown;
  const eligibility = readSignalFamily(conversationEligibility, conversationId) as {
    isEligible: boolean;
    reason?: unknown;
  };
  const collaborationMode = readSignalFamily(
    collaborationModeByConversation,
    conversationId,
  );
  const eligibilityReason = readSignalFamily(
    conversationEligibilityReason,
    conversationId,
  );
  const permissionOverrides = useSignalValue(threadPermissionOverrides) as
    | Record<string, unknown>
    | null;

  React.useEffect(() => {
    const activeTurn = scope.get(activeConversationTurn, conversationId);
    const metadata = scope.get(conversationMetadata, conversationId);
    const resolvedMode = getCollaborationMode(activeTurn, metadata);
    const permissions = getThreadPermissions(activeTurn, metadata, permissionOverrides?.[conversationId]);
    if (resolvedMode != null) {
      scope.set(threadPermissionOverrides, (current: Record<string, unknown> | null) =>
        setThreadPermissionOverride(current ?? {}, conversationId, resolvedMode),
      );
    }
    hostMessageBridge.dispatchMessage("heartbeat-automation-thread-state-changed", {
      threadId: conversationId,
      isEligible: eligibility.isEligible,
      collaborationMode,
      permissions,
      reason: eligibility.reason,
    });
  }, [
    permissionOverrides,
    conversationId,
    eligibility.isEligible,
    eligibility.reason,
    eligibilityReason,
    collaborationMode,
    scope,
  ]);
  return null;
}

function ConversationStreamRoleProductEvent({
  conversationId,
}: ConversationStreamRoleProps): null {
  const React = getReactRuntime();
  const scope = useScope(conversationScope) as unknown as {
    watch(callback: (context: { get(signal: unknown, parameter?: unknown): unknown }) => void): () => void;
  };
  const emitProductEvent = dispatchProductEvent as unknown as (
    targetScope: unknown,
    event: unknown,
    payload: Record<string, unknown>,
  ) => unknown;
  React.useEffect(() => {
    let dispatched = false;
    return scope.watch(({ get }) => {
      const streamRole = get(streamRoleSignal, conversationId) as { role?: unknown } | null;
      if (streamRole == null || dispatched) return;
      dispatched = true;
      emitProductEvent(scope, streamRoleProductEvent, { streamRole: streamRole.role });
    });
  }, [conversationId, scope]);
  return null;
}

function initializeConversationAutomationStateBridge(): void {
  initializeCompilerCache();
  initializeSignalRuntime();
  getReactRuntime();
  initializeConversationSources();
  initializeHostMessageBridge();
  initializeScopedSignals();
  initializePermissionState();
  initializeHeartbeatAutomation();
}

function initializeConversationStreamRoleProductEvent(): void {
  initializeCompilerCache();
  initializeProductEvents();
  initializeSignalRuntime();
  getReactRuntime();
  initializeConversationSources();
  initializeStreamRoles();
  initializeConversationScope();
}

export {
  initializeConversationAutomationStateBridge as i,
  initializeConversationStreamRoleProductEvent as n,
  ConversationAutomationStateBridge as r,
  ConversationStreamRoleProductEvent as t,
};
