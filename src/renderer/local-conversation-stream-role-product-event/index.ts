import "@rchunk/rolldown-runtime";
import {
  $3 as getCompilerRuntime,
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

interface CompilerRuntime {
  c(size: number): unknown[];
}

let automationCompilerRuntime: CompilerRuntime;
let automationReact: ReturnType<typeof getReactRuntime>;
let streamCompilerRuntime: CompilerRuntime;
let streamReact: ReturnType<typeof getReactRuntime>;

function ConversationAutomationStateBridge({
  conversationId,
}: ConversationStreamRoleProps): null {
  const cache = automationCompilerRuntime.c(15);
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

  let synchronize: () => void;
  if (
    cache[0] !== permissionOverrides?.[conversationId] ||
    cache[1] !== conversationId ||
    cache[2] !== eligibility.isEligible ||
    cache[3] !== eligibility.reason ||
    cache[4] !== collaborationMode ||
    cache[5] !== scope
  ) {
    const conversationPermissionOverrides = permissionOverrides?.[conversationId];
    synchronize = () => {
    const activeTurn = scope.get(activeConversationTurn, conversationId);
    const metadata = scope.get(conversationMetadata, conversationId);
    const resolvedMode = getCollaborationMode(activeTurn, metadata);
    const permissions = getThreadPermissions(activeTurn, metadata, conversationPermissionOverrides);
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
    };
    cache[0] = conversationPermissionOverrides;
    cache[1] = conversationId;
    cache[2] = eligibility.isEligible;
    cache[3] = eligibility.reason;
    cache[4] = collaborationMode;
    cache[5] = scope;
    cache[6] = synchronize;
  } else {
    synchronize = cache[6] as () => void;
  }
  let dependencies: unknown[];
  if (
    cache[7] !== permissionOverrides?.[conversationId] ||
    cache[8] !== conversationId ||
    cache[9] !== eligibility.isEligible ||
    cache[10] !== eligibility.reason ||
    cache[11] !== eligibilityReason ||
    cache[12] !== collaborationMode ||
    cache[13] !== scope
  ) {
    dependencies = [
      permissionOverrides?.[conversationId], conversationId, eligibility.isEligible,
      eligibility.reason, eligibilityReason, collaborationMode, scope,
    ];
    cache[7] = permissionOverrides?.[conversationId];
    cache[8] = conversationId;
    cache[9] = eligibility.isEligible;
    cache[10] = eligibility.reason;
    cache[11] = eligibilityReason;
    cache[12] = collaborationMode;
    cache[13] = scope;
    cache[14] = dependencies;
  } else {
    dependencies = cache[14] as unknown[];
  }
  automationReact.useEffect(synchronize, dependencies);
  return null;
}

function ConversationStreamRoleProductEvent({
  conversationId,
}: ConversationStreamRoleProps): null {
  const cache = streamCompilerRuntime.c(4);
  const scope = useScope(conversationScope) as unknown as {
    watch(callback: (context: { get(signal: unknown, parameter?: unknown): unknown }) => void): () => void;
  };
  const emitProductEvent = dispatchProductEvent as unknown as (
    targetScope: unknown,
    event: unknown,
    payload: Record<string, unknown>,
  ) => unknown;
  let watchStreamRole: () => () => void;
  let dependencies: unknown[];
  if (cache[0] !== conversationId || cache[1] !== scope) {
    watchStreamRole = () => {
      let dispatched = false;
      return scope.watch(({ get }) => {
        const streamRole = get(streamRoleSignal, conversationId) as { role?: unknown } | null;
        if (streamRole == null || dispatched) return;
        dispatched = true;
        emitProductEvent(scope, streamRoleProductEvent, { streamRole: streamRole.role });
      });
    };
    dependencies = [conversationId, scope];
    cache[0] = conversationId;
    cache[1] = scope;
    cache[2] = watchStreamRole;
    cache[3] = dependencies;
  } else {
    watchStreamRole = cache[2] as () => () => void;
    dependencies = cache[3] as unknown[];
  }
  streamReact.useEffect(watchStreamRole, dependencies);
  return null;
}

function initializeConversationAutomationStateBridge(): void {
  automationCompilerRuntime = getCompilerRuntime() as unknown as CompilerRuntime;
  initializeSignalRuntime();
  automationReact = getReactRuntime();
  initializeConversationSources();
  initializeHostMessageBridge();
  initializeScopedSignals();
  initializePermissionState();
  initializeHeartbeatAutomation();
}

function initializeConversationStreamRoleProductEvent(): void {
  streamCompilerRuntime = getCompilerRuntime() as unknown as CompilerRuntime;
  initializeProductEvents();
  initializeSignalRuntime();
  streamReact = getReactRuntime();
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
