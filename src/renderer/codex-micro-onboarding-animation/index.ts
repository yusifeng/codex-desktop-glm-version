// codex-micro-onboarding-animation —— Codex Micro 引导页的演示状态机与埋点转换。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const appInitial = appInitialChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;

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

let elapsedAnimationTimeState: any = Symbol("codex-micro-onboarding-elapsed");
let animationFrameSignal: any = Symbol("codex-micro-onboarding-frame");
let agentSlotsSignal: any = Symbol("codex-micro-onboarding-agent-slots");
let initialized = false;

function mapDeviceLifecycleStatus(status: string): unknown {
  switch (status) {
    case "connected":
      return appInitial.ls?.CODEX_MICRO_DEVICE_LIFECYCLE_STEP_TYPE_CONNECTED;
    case "connection-failed":
      return appInitial.ls
        ?.CODEX_MICRO_DEVICE_LIFECYCLE_STEP_TYPE_CONNECTION_FAILED;
    case "connection-lost":
      return appInitial.ls
        ?.CODEX_MICRO_DEVICE_LIFECYCLE_STEP_TYPE_CONNECTION_LOST;
    case "reconnected":
      return appInitial.ls?.CODEX_MICRO_DEVICE_LIFECYCLE_STEP_TYPE_RECONNECTED;
  }
}

function mapConnectionTransport(transport: string | null): unknown {
  switch (transport) {
    case "bluetooth":
      return appInitial.ss?.CODEX_MICRO_CONNECTION_TRANSPORT_BLUETOOTH;
    case "usb":
      return appInitial.ss?.CODEX_MICRO_CONNECTION_TRANSPORT_USB;
    case "unknown":
    case null:
      return appInitial.ss?.CODEX_MICRO_CONNECTION_TRANSPORT_UNSPECIFIED;
  }
}

function mapOnboardingStep(step: string): unknown {
  const steps = appInitial.fs;
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
      return appInitial.ps?.CODEX_MICRO_ONBOARDING_SCREEN_WELCOME;
    case "agent-keys":
      return appInitial.ps?.CODEX_MICRO_ONBOARDING_SCREEN_AGENT_KEYS;
    case "command-keys":
      return appInitial.ps?.CODEX_MICRO_ONBOARDING_SCREEN_COMMAND_KEYS;
  }
}

function mapInputMonitoringPermission(state: string): unknown {
  const states = appInitial.us;
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
  scope: unknown,
  stepType: unknown,
  transport: string | null,
): void {
  appInitial.xpn?.(scope, appInitial.cs, {
    connectionTransport: mapConnectionTransport(transport),
    stepType,
  });
}

function recordDeviceLifecycleTransition(
  scope: unknown,
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
      appInitial.ls?.CODEX_MICRO_DEVICE_LIFECYCLE_STEP_TYPE_FIRST_DETECTED,
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
  scope: unknown,
  input: {
    flowId: string;
    inputMonitoringPermissionState: string;
    screen: string;
    step: string;
  },
): void {
  appInitial.xpn?.(scope, appInitial.ds, {
    flowId: input.flowId,
    inputMonitoringPermissionState: mapInputMonitoringPermission(
      input.inputMonitoringPermissionState,
    ),
    screen: mapOnboardingScreen(input.screen),
    stepType: mapOnboardingStep(input.step),
  });
}

function initializeCodexMicroAnalytics(): void {
  appInitial.ms?.();
  appInitial.ypn?.();
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

function buildCodexMicroOnboardingAnimationFrame(elapsedMs: number) {
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
  appShared.FX?.();
  appShared.QI?.();
  elapsedAnimationTimeState =
    appShared.pZ?.(appShared.ZI, null) ?? elapsedAnimationTimeState;
  animationFrameSignal =
    appShared.sZ?.(appShared.ZI, ({ get }: any) => {
      const elapsed = get(elapsedAnimationTimeState);
      return elapsed == null
        ? null
        : buildCodexMicroOnboardingAnimationFrame(elapsed);
    }) ?? animationFrameSignal;
  agentSlotsSignal =
    appShared.sZ?.(appShared.ZI, ({ get }: any) => {
      return get(animationFrameSignal)?.agentSlots ?? null;
    }) ?? agentSlotsSignal;
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
