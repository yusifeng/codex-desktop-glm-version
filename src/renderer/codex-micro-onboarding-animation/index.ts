// codex-micro-onboarding-animation —— Codex Micro 引导页的演示状态机与埋点转换。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const {
  cs: deviceLifecycleEvent,
  ds: onboardingLifecycleEvent,
  fs: onboardingLifecycleSteps,
  ls: deviceLifecycleSteps,
  ms: initializeCodexMicroAnalyticsEvents,
  ps: onboardingScreens,
  ss: connectionTransports,
  us: inputMonitoringPermissionStates,
  xpn: logAnalyticsEvent,
  ypn: initializeAnalytics,
} = appInitialChunk;
const {
  FX: initializeSignalRuntime,
  QI: initializeSharedRuntime,
  ZI: applicationScope,
  pZ: createScopedSignal,
  sZ: createDerivedSignal,
} = appSharedChunk;

const TICK_INTERVAL_MS = 100;
const CYCLE_DURATION_MS = 12_000;
const AGENT_STAGGER_MS = 800;
const KEYCAP_STAGGER_MS = 700;
const PHASE_BOUNDARIES_MS = [
  [0.25, 0.33],
  [0.58, 0.66],
  [0.92, 1],
].map(([start, end]) => Math.round(((start + end) / 2) * CYCLE_DURATION_MS));

const AGENT_STATUS_CYCLES = [
  ["working", "awaiting-approval", "error"],
  ["unread", "working", "idle"],
  ["awaiting-approval", "idle", "working"],
  ["idle", "error", "unread"],
  ["working", "unread", "awaiting-response"],
  ["awaiting-response", "working", "idle"],
] as const;

const ACTION_KEYCAP_CYCLES = [
  ["FAST", "PLAY", "BUG"],
  ["APPR", "SPLIT", "SETUP"],
  ["REJ", "NEW", "CODEX"],
  ["SPLIT", "BUG", "FAST"],
  ["MIC", "NEW", "PLAY"],
  ["CODEX", "APPR", "SETUP"],
] as const;

type AgentStatus = (typeof AGENT_STATUS_CYCLES)[number][number];
type ActionKeycapId = (typeof ACTION_KEYCAP_CYCLES)[number][number];

interface AnimationAgentSlot {
  id: number;
  selected: false;
  status: AgentStatus;
  threadKey: null;
  title: null;
}

interface CodexMicroOnboardingAnimationFrame {
  actionKeycapIds: ActionKeycapId[];
  agentSlots: AnimationAgentSlot[];
}

type ScopedSignal<Value> = import("@rchunk/app-shared").ScopedSignal<
  unknown,
  Value
>;
type DerivedSignal<Value> = import("@rchunk/app-shared").ScopedDerivedSignal<
  unknown,
  Value
>;

let elapsedAnimationTimeState = Symbol(
  "codex-micro-onboarding-elapsed",
) as unknown as ScopedSignal<number | null>;
let animationFrameSignal = Symbol(
  "codex-micro-onboarding-frame",
) as unknown as DerivedSignal<CodexMicroOnboardingAnimationFrame | null>;
let agentSlotsSignal = Symbol(
  "codex-micro-onboarding-agent-slots",
) as unknown as DerivedSignal<AnimationAgentSlot[] | null>;
let initialized = false;

function mapDeviceLifecycleStatus(status: string): unknown {
  switch (status) {
    case "connected":
      return deviceLifecycleSteps.CODEX_MICRO_DEVICE_LIFECYCLE_STEP_TYPE_CONNECTED;
    case "connection-failed":
      return deviceLifecycleSteps.CODEX_MICRO_DEVICE_LIFECYCLE_STEP_TYPE_CONNECTION_FAILED;
    case "connection-lost":
      return deviceLifecycleSteps.CODEX_MICRO_DEVICE_LIFECYCLE_STEP_TYPE_CONNECTION_LOST;
    case "reconnected":
      return deviceLifecycleSteps.CODEX_MICRO_DEVICE_LIFECYCLE_STEP_TYPE_RECONNECTED;
  }
}

function mapConnectionTransport(transport: string | null): unknown {
  switch (transport) {
    case "bluetooth":
      return connectionTransports.CODEX_MICRO_CONNECTION_TRANSPORT_BLUETOOTH;
    case "usb":
      return connectionTransports.CODEX_MICRO_CONNECTION_TRANSPORT_USB;
    case "unknown":
    case null:
      return connectionTransports.CODEX_MICRO_CONNECTION_TRANSPORT_UNSPECIFIED;
  }
}

function mapOnboardingStep(step: string): unknown {
  const steps = onboardingLifecycleSteps;
  switch (step) {
    case "flow-completed":
      return steps?.CODEX_MICRO_ONBOARDING_LIFECYCLE_STEP_TYPE_FLOW_COMPLETED;
    case "flow-dismissed":
      return steps?.CODEX_MICRO_ONBOARDING_LIFECYCLE_STEP_TYPE_FLOW_DISMISSED;
    case "input-monitoring-permission-granted":
      return steps?.CODEX_MICRO_ONBOARDING_LIFECYCLE_STEP_TYPE_INPUT_MONITORING_PERMISSION_GRANTED;
    case "input-monitoring-settings-opened":
      return steps?.CODEX_MICRO_ONBOARDING_LIFECYCLE_STEP_TYPE_INPUT_MONITORING_SETTINGS_OPENED;
    case "screen-continued":
      return steps?.CODEX_MICRO_ONBOARDING_LIFECYCLE_STEP_TYPE_SCREEN_CONTINUED;
    case "screen-shown":
      return steps?.CODEX_MICRO_ONBOARDING_LIFECYCLE_STEP_TYPE_SCREEN_SHOWN;
    case "settings-opened":
      return steps?.CODEX_MICRO_ONBOARDING_LIFECYCLE_STEP_TYPE_SETTINGS_OPENED;
  }
}

function mapOnboardingScreen(screen: string): unknown {
  switch (screen) {
    case "welcome":
      return onboardingScreens.CODEX_MICRO_ONBOARDING_SCREEN_WELCOME;
    case "agent-keys":
      return onboardingScreens.CODEX_MICRO_ONBOARDING_SCREEN_AGENT_KEYS;
    case "command-keys":
      return onboardingScreens.CODEX_MICRO_ONBOARDING_SCREEN_COMMAND_KEYS;
  }
}

function mapInputMonitoringPermission(state: string): unknown {
  const states = inputMonitoringPermissionStates;
  switch (state) {
    case "granted":
      return states?.CODEX_MICRO_INPUT_MONITORING_PERMISSION_STATE_GRANTED;
    case "denied":
      return states?.CODEX_MICRO_INPUT_MONITORING_PERMISSION_STATE_DENIED;
    case "unavailable":
      return states?.CODEX_MICRO_INPUT_MONITORING_PERMISSION_STATE_UNAVAILABLE;
    case "not-applicable":
      return states?.CODEX_MICRO_INPUT_MONITORING_PERMISSION_STATE_NOT_APPLICABLE;
  }
}

function recordDeviceLifecycleStep(
  scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
  stepType: unknown,
  transport: string | null,
): void {
  logAnalyticsEvent?.(scope, deviceLifecycleEvent, {
    connectionTransport: mapConnectionTransport(transport),
    stepType,
  });
}

function recordDeviceLifecycleTransition(
  scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
  device: { status: string },
  transition: string | null,
  transport: string | null,
  previouslyDetected: boolean,
): void {
  if (
    !previouslyDetected &&
    (device.status === "detected" || device.status === "connected")
  ) {
    recordDeviceLifecycleStep(
      scope,
      deviceLifecycleSteps.CODEX_MICRO_DEVICE_LIFECYCLE_STEP_TYPE_FIRST_DETECTED,
      transport,
    );
  }
  if (transition != null) {
    recordDeviceLifecycleStep(
      scope,
      mapDeviceLifecycleStatus(transition),
      transport,
    );
  }
}

function recordOnboardingLifecycleStep(
  scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
  input: {
    flowId: string;
    inputMonitoringPermissionState: string;
    screen: string;
    step: string;
  },
): void {
  logAnalyticsEvent?.(scope, onboardingLifecycleEvent, {
    flowId: input.flowId,
    inputMonitoringPermissionState: mapInputMonitoringPermission(
      input.inputMonitoringPermissionState,
    ),
    screen: mapOnboardingScreen(input.screen),
    stepType: mapOnboardingStep(input.step),
  });
}

function initializeCodexMicroAnalytics(): void {
  initializeCodexMicroAnalyticsEvents?.();
  initializeAnalytics?.();
}

function phaseIndex(elapsedMs: number): number {
  return elapsedMs < PHASE_BOUNDARIES_MS[0]
    ? 0
    : elapsedMs < PHASE_BOUNDARIES_MS[1]
      ? 1
      : elapsedMs < PHASE_BOUNDARIES_MS[2]
        ? 2
        : 0;
}

function cycleValue<T>(
  values: readonly T[],
  elapsedMs: number,
  offsetMs: number,
): T {
  return values[phaseIndex((elapsedMs + offsetMs) % CYCLE_DURATION_MS)];
}

function buildCodexMicroOnboardingAnimationFrame(
  elapsedMs: number,
): CodexMicroOnboardingAnimationFrame {
  const reducedMotion = elapsedMs === -1;
  const normalizedElapsed = reducedMotion ? 0 : elapsedMs;
  return {
    actionKeycapIds: ACTION_KEYCAP_CYCLES.map((cycle, index) =>
      cycleValue(
        cycle,
        normalizedElapsed,
        reducedMotion ? 0 : (index + 1) * KEYCAP_STAGGER_MS,
      ),
    ),
    agentSlots: AGENT_STATUS_CYCLES.map((cycle, index) => ({
      id: index,
      threadKey: null,
      title: null,
      status: cycleValue(
        cycle,
        normalizedElapsed,
        reducedMotion ? 0 : index * AGENT_STAGGER_MS,
      ),
      selected: false,
    })),
  };
}

function startCodexMicroOnboardingAnimation(
  scope: { set(signal: unknown, value: unknown): void },
  reducedMotion: boolean,
): () => void {
  initializeCodexMicroOnboardingAnimation();
  const startedAt = globalThis.performance.now();
  scope.set(elapsedAnimationTimeState, reducedMotion ? -1 : 0);
  const interval = reducedMotion
    ? null
    : globalThis.setInterval(() => {
        scope.set(
          elapsedAnimationTimeState,
          globalThis.performance.now() - startedAt,
        );
      }, TICK_INTERVAL_MS);
  return () => {
    if (interval != null) globalThis.clearInterval(interval);
    scope.set(elapsedAnimationTimeState, null);
  };
}

function initializeCodexMicroOnboardingAnimation(): void {
  if (initialized) return;
  initialized = true;
  initializeSignalRuntime?.();
  initializeSharedRuntime?.();
  elapsedAnimationTimeState =
    createScopedSignal(applicationScope, null);
  animationFrameSignal =
    createDerivedSignal(applicationScope, ({ get }) => {
      const elapsed = get(elapsedAnimationTimeState);
      return elapsed == null
        ? null
        : buildCodexMicroOnboardingAnimationFrame(elapsed);
    });
  agentSlotsSignal =
    createDerivedSignal(applicationScope, ({ get }) => {
      return get(animationFrameSignal)?.agentSlots ?? null;
    });
}

initializeCodexMicroOnboardingAnimation();

export {
  startCodexMicroOnboardingAnimation as a,
  recordOnboardingLifecycleStep as c,
  initializeCodexMicroOnboardingAnimation as i,
  agentSlotsSignal as n,
  initializeCodexMicroAnalytics as o,
  buildCodexMicroOnboardingAnimationFrame as r,
  recordDeviceLifecycleTransition as s,
  animationFrameSignal as t,
};
