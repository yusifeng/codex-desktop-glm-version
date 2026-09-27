import {
  FX as initializeSignalRuntime,
  TX as getIdleTimeoutMilliseconds,
  ZI as appScope,
  pZ as createScopedSignal,
  rJ as isClientThreadId,
  sZ as createDerivedSignal,
  vX as agentKeyIds,
  wL as initializeSharedConfig,
  type CodexMicroStatus,
  type MaitaiScopeApi,
  type ScopedDerivedSignal,
  type ScopedSignal,
} from "@rchunk/app-shared";
import { dun as createPersistedSignal } from "@rchunk/app-initial";
import { i as initializeCodexMicroCommands } from "@rchunk/codex-micro-commands";

export type AgentKeyId = (typeof agentKeyIds)[number];
export interface ThreadAssignment { hostId: string; threadKey: string; title?: string | null }
export interface CommandAssignment { commandId: string; type: "command" }
export interface SkillAssignment { keycapId: string; skillName: string; type: "skill" }
export type AgentAssignment = ThreadAssignment | CommandAssignment | SkillAssignment | null;
export type AgentAssignments = Record<AgentKeyId, AgentAssignment>;
export interface PendingAssignment { agentKeyId: AgentKeyId; clientThreadId: string }
export interface AgentSlot {
  id: number;
  selected: boolean;
  status: CodexMicroStatus;
  threadKey: string | null;
  title: string | null;
}
export interface ThreadDisplayState {
  localStatus?: { pendingChip?: "approval" | "response" | null; status?: string | null; unread?: boolean };
  remoteStatus?: { latestTurnStatus?: "failed" | "in_progress" | "pending" | null; unread?: boolean };
  threadKey: string;
  title?: string | null;
}
export interface DeviceState {
  brightness: number;
  inactivityTimeoutMs: number | null;
  preserveSelectionLighting?: boolean;
  slots: AgentSlot[];
  snakingAmbientStatus?: unknown;
  suspendDeviceStatusRefresh?: boolean;
  voiceState: unknown;
}

const emptyAssignments: AgentAssignments = {
  AG00: null, AG01: null, AG02: null, AG03: null, AG04: null, AG05: null,
};
let customAssignmentsSignal: ScopedSignal<Record<string, unknown>, AgentAssignments>;
let pendingAssignmentSignal: ScopedSignal<Record<string, unknown>, PendingAssignment | null>;
let agentSlotsSignal: ScopedDerivedSignal<Record<string, unknown>, AgentSlot[]>;
let deviceStateSignal: ScopedDerivedSignal<Record<string, unknown>, DeviceState>;

function setAssignment(assignments: AgentAssignments, agentKeyId: AgentKeyId, assignment: AgentAssignment): AgentAssignments {
  const next = { ...assignments };
  if (assignment != null && "threadKey" in assignment) {
    for (const key of agentKeyIds) {
      const current = next[key];
      if (current != null && "threadKey" in current
        && current.threadKey === assignment.threadKey && current.hostId === assignment.hostId) next[key] = null;
    }
  }
  next[agentKeyId] = assignment;
  return next;
}

function promotePendingAssignment(input: {
  assignments: AgentAssignments;
  clientThreadId: string;
  conversationId: string;
  hostId: string;
  pending: PendingAssignment | null;
  title?: string | null;
}): AgentAssignments | null {
  if (input.pending?.clientThreadId !== input.clientThreadId) return null;
  return setAssignment(input.assignments, input.pending.agentKeyId, {
    hostId: input.hostId,
    threadKey: input.conversationId,
    title: input.title,
  });
}

function rememberPendingAssignment(scope: MaitaiScopeApi<unknown>, agentKeyId: AgentKeyId, clientThreadId: string): boolean {
  if (!isClientThreadId(clientThreadId)) return false;
  scope.set(pendingAssignmentSignal, { agentKeyId, clientThreadId });
  return true;
}

function updateCustomAssignment(scope: MaitaiScopeApi<unknown>, agentKeyId: AgentKeyId, assignment: AgentAssignment): void {
  const current = scope.get(customAssignmentsSignal) ?? emptyAssignments;
  scope.set(customAssignmentsSignal, setAssignment(current, agentKeyId, assignment));
  if (scope.get(pendingAssignmentSignal)?.agentKeyId === agentKeyId) scope.set(pendingAssignmentSignal, null);
}

function getAgentKeyId(index: number): AgentKeyId | null {
  return agentKeyIds[index] ?? null;
}

function serializeDeviceState(state: DeviceState): string {
  return JSON.stringify({
    brightness: state.brightness,
    inactivityTimeoutMs: state.inactivityTimeoutMs,
    preserveSelectionLighting: Boolean(state.preserveSelectionLighting),
    snakingAmbientStatus: state.snakingAmbientStatus,
    suspendDeviceStatusRefresh: Boolean(state.suspendDeviceStatusRefresh),
    slots: state.slots.map(({ id, selected, status, threadKey, ...slot }) => ({
      id, pulsing: Boolean((slot as { pulsing?: boolean }).pulsing), selected, status, threadKey,
    })),
    voiceState: state.voiceState,
  });
}

function getThreadStatus(thread: ThreadDisplayState): CodexMicroStatus {
  if (thread.localStatus != null) {
    const { pendingChip, status, unread } = thread.localStatus;
    if (status === "error") return "error";
    if (pendingChip === "approval") return "awaiting-approval";
    if (pendingChip === "response") return "awaiting-response";
    if (status === "loading") return "working";
    return unread ? "unread" : "idle";
  }
  const remote = thread.remoteStatus;
  if (remote?.latestTurnStatus === "failed") return "error";
  if (remote?.latestTurnStatus === "pending" || remote?.latestTurnStatus === "in_progress") return "working";
  return remote?.unread ? "unread" : "idle";
}

function buildAgentSlots(input: {
  isAppWindowFocused: boolean;
  selectedThreadKey: string | null;
  threadKeys: Array<string | null>;
  threads: ThreadDisplayState[];
}): AgentSlot[] {
  return Array.from({ length: 6 }, (_, id) => {
    const threadKey = input.threadKeys[id];
    if (threadKey == null) return { id, threadKey: null, title: null, status: "off", selected: false };
    const thread = input.threads.find((candidate) => candidate.threadKey === threadKey)
      ?? { threadKey, title: null };
    const selected = threadKey === input.selectedThreadKey;
    const status = getThreadStatus(thread);
    return { id, threadKey, title: thread.title ?? null, selected,
      status: selected && input.isAppWindowFocused && status === "unread" ? "idle" : status };
  });
}

function selectThreadKeys(input: {
  customAgentThreadKeys: Array<string | null>;
  pinnedProjectThreadKeys: string[];
  pinnedThreadKeys: string[];
  priorityThreadKeys: string[];
  recentlyUpdatedThreadKeys: string[];
  source: "custom" | "pinned" | "priority" | "recent";
}): Array<string | null> {
  switch (input.source) {
    case "pinned": return [...input.pinnedThreadKeys, ...input.pinnedProjectThreadKeys].slice(0, 6);
    case "recent": return input.recentlyUpdatedThreadKeys.slice(0, 6);
    case "priority": return input.priorityThreadKeys.slice(0, 6);
    case "custom": return input.customAgentThreadKeys.slice(0, 6);
  }
}

function initializeAssignmentSignals(): void {
  initializeSignalRuntime();
  initializeSharedConfig();
  customAssignmentsSignal = createPersistedSignal("codex-micro-custom-agent-assignments", emptyAssignments);
  pendingAssignmentSignal = createScopedSignal(appScope, null);
}

function initializeStatusHelpers(): void {}

function initializeCodexMicroSlotSignals(): void {
  initializeAssignmentSignals();
  initializeCodexMicroCommands();
  agentSlotsSignal = createDerivedSignal(appScope, () => buildAgentSlots({
    isAppWindowFocused: false, selectedThreadKey: null, threadKeys: [], threads: [],
  }));
  deviceStateSignal = createDerivedSignal(appScope, () => ({
    brightness: 1,
    inactivityTimeoutMs: getIdleTimeoutMilliseconds("off"),
    slots: [],
    voiceState: null,
  }));
}

function promotePendingConversation(): boolean { return false; }
function activateAssignedThread(): void {}

export {
  initializeStatusHelpers as a,
  updateCustomAssignment as c,
  getAgentKeyId as d,
  initializeAssignmentSignals as f,
  serializeDeviceState as i,
  promotePendingConversation as l,
  agentSlotsSignal as n,
  emptyAssignments as o,
  activateAssignedThread as p,
  initializeCodexMicroSlotSignals as r,
  rememberPendingAssignment as s,
  deviceStateSignal as t,
  customAssignmentsSignal as u,
};
