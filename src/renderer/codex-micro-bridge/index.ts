import "@rchunk/app-shared";
import { pnt as appServices } from "@rchunk/app-initial";
import "@rchunk/app-primary";
import {
  i as initializeCodexMicroCommands,
  n as getCodexMicroCommand,
} from "@rchunk/codex-micro-commands";
import {
  a as resolveSlotAction,
  o as initializeCodexMicroLayout,
  t as parseActionSlotId,
} from "@rchunk/codex-micro-layout";
import { o as initializeOnboardingAnimation } from "@rchunk/codex-micro-onboarding-animation";
import { r as initializeSlotSignals } from "@rchunk/codex-micro-slot-signals";
import { r as initializeJoystickFeedback } from "@rchunk/codex-micro-joystick-feedback";
import { s as initializeMiniGames } from "@rchunk/codex-micro-mini-games";

interface CodexMicroDeviceState {
  model?: string;
  status: string;
  [key: string]: unknown;
}
interface CodexMicroLightingState extends Record<string, unknown> {
  slots?: readonly Record<string, unknown>[];
}
interface CodexMicroService {
  getState(): Promise<CodexMicroDeviceState>;
  ownsPrimaryWindow(): Promise<boolean>;
  updateAgentThreadKeys?(
    threadKeys: Array<string | null>,
    kinds: string[],
    singleTapAgentKeys: boolean,
  ): Promise<void> | void;
  updateLighting?(state: CodexMicroLightingState): Promise<void>;
}
interface HardwareKeyEvent { act: number; key: string }
interface SlotConfig {
  action?: Record<string, unknown>;
  commandId?: string;
  keycapId: string;
}
interface LayoutConfig {
  separateMicrophoneKeys: boolean;
  slots: Record<string, SlotConfig>;
}
type BridgeAction =
  | Record<string, unknown>
  | { type: "encoder-press" | "encoder-release" | "push-to-talk-press" | "push-to-talk-release" };

const bridgeControllers = new WeakMap<CodexMicroService, CodexMicroBridgeController>();

class CodexMicroBridgeController {
  #active = true;
  #deviceState: CodexMicroDeviceState | null = null;
  #isOwner = false;
  #lightingInFlight = false;
  #pendingLighting: CodexMicroLightingState | null = null;
  #removeListeners: Array<() => void> = [];

  constructor(
    readonly service: CodexMicroService,
    readonly eventTarget: EventTarget,
  ) {
    this.#listen("codex-micro-device-state-changed", (detail) => {
      const state = detail.state;
      if (isDeviceState(state)) this.#deviceState = state;
    });
    this.#listen("codex-micro-window-ownership-changed", (detail) => {
      this.#isOwner = detail.isOwner === true;
      if (!this.#isOwner) this.#pendingLighting = null;
    });
    this.#listen("codex-micro-device-lifecycle", (detail) => {
      if (isDeviceState(detail.state)) this.#deviceState = detail.state;
    });
    this.#listen("codex-micro-lighting-state-changed", (detail) => {
      if (isRecord(detail.state)) this.queueLighting(detail.state);
    });
    this.#listen("codex-micro-agent-keys-changed", (detail) => {
      const threadKeys = Array.isArray(detail.threadKeys)
        ? detail.threadKeys.map((value) => typeof value === "string" ? value : null)
        : [];
      const kinds = Array.isArray(detail.kinds)
        ? detail.kinds.map((value) => typeof value === "string" ? value : "thread")
        : [];
      void this.service.updateAgentThreadKeys?.(threadKeys, kinds, detail.singleTapAgentKeys === true);
    });
    this.#listen("codex-micro-key-event", (detail) => {
      if (!isHardwareKeyEvent(detail.event) || !isLayoutConfig(detail.layout)) return;
      const action = resolveHardwareAction(detail.event, detail.layout, isRecord(detail.assignment) ? detail.assignment : null);
      if (action != null) this.eventTarget.dispatchEvent(createDetailEvent("codex-micro-action", { action }));
    });
    void this.synchronize();
  }

  get deviceState(): CodexMicroDeviceState | null { return this.#deviceState; }
  get isOwner(): boolean { return this.#isOwner; }

  async synchronize(): Promise<void> {
    const [state, isOwner] = await Promise.all([
      this.service.getState(),
      this.service.ownsPrimaryWindow(),
    ]);
    if (!this.#active) return;
    this.#deviceState = state;
    this.#isOwner = isOwner;
  }

  queueLighting(state: CodexMicroLightingState): void {
    if (!this.#active || !this.#isOwner || this.service.updateLighting == null) return;
    this.#pendingLighting = state;
    if (!this.#lightingInFlight) void this.#drainLighting();
  }

  dispose(): void {
    this.#active = false;
    this.#pendingLighting = null;
    for (const remove of this.#removeListeners.splice(0)) remove();
    bridgeControllers.delete(this.service);
  }

  async #drainLighting(): Promise<void> {
    this.#lightingInFlight = true;
    while (this.#active && this.#isOwner && this.#pendingLighting != null) {
      const state = this.#pendingLighting;
      this.#pendingLighting = null;
      try { await this.service.updateLighting?.(state); }
      catch { /* A later state must still be allowed to refresh the device. */ }
    }
    this.#lightingInFlight = false;
  }

  #listen(type: string, listener: (detail: Record<string, unknown>) => void): void {
    const handler = (event: Event) => {
      const detail = "detail" in event && isRecord(event.detail) ? event.detail : {};
      listener(detail);
    };
    this.eventTarget.addEventListener(type, handler);
    this.#removeListeners.push(() => this.eventTarget.removeEventListener(type, handler));
  }
}

function resolveHardwareAction(
  event: HardwareKeyEvent,
  layout: LayoutConfig,
  assignment: Record<string, unknown> | null,
): BridgeAction | null {
  if (event.key === "ENC_CW" || event.key === "ENC_CC") return null;
  if (event.key.startsWith("ENC")) {
    if (event.act === 1) return { type: "encoder-press" };
    if (event.act === 0) return { type: "encoder-release" };
    return null;
  }
  let action: Record<string, unknown> | null = null;
  if (assignment != null && !("threadKey" in assignment)) {
    if (assignment.type === "command" && typeof assignment.commandId === "string") {
      const command = getCodexMicroCommand(assignment.commandId) as { id?: unknown } | null;
      return event.act === 1 && typeof command?.id === "string"
        ? { type: "command", command: command.id }
        : null;
    }
    if (assignment.type === "skill") return event.act === 1 ? assignment : null;
    if (assignment.type === "keycap" && typeof assignment.keycapId === "string") {
      action = resolveSlotAction({ keycapId: assignment.keycapId }) as Record<string, unknown> | null;
    }
  } else {
    const slotId = !layout.separateMicrophoneKeys && (event.key === "ACT10" || event.key === "ACT11")
      ? "ACT10_ACT11" : parseActionSlotId(event.key);
    if (slotId == null || (!layout.separateMicrophoneKeys && event.key === "ACT11")) return null;
    const slot = layout.slots[slotId];
    if (slot == null) return null;
    action = resolveSlotAction(
      slot as Parameters<typeof resolveSlotAction>[0],
    ) as Record<string, unknown> | null;
  }
  if (action == null) return null;
  if (action.type === "push-to-talk") {
    if (event.act === 1) return { type: "push-to-talk-press" };
    if (event.act === 0) return { type: "push-to-talk-release" };
    return null;
  }
  return event.act === 1 ? action : null;
}

function CodexMicroBridge(): null {
  const service = appServices.codexMicro as unknown as CodexMicroService | undefined;
  if (service == null) return null;
  const eventTarget = globalThis as unknown as EventTarget;
  if (!bridgeControllers.has(service)) {
    bridgeControllers.set(service, new CodexMicroBridgeController(service, eventTarget));
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null;
}
function isDeviceState(value: unknown): value is CodexMicroDeviceState {
  return isRecord(value) && typeof value.status === "string";
}
function isHardwareKeyEvent(value: unknown): value is HardwareKeyEvent {
  return isRecord(value) && typeof value.act === "number" && typeof value.key === "string";
}
function isLayoutConfig(value: unknown): value is LayoutConfig {
  return isRecord(value) && typeof value.separateMicrophoneKeys === "boolean" && isRecord(value.slots);
}
function createDetailEvent(type: string, detail: Record<string, unknown>): Event {
  if (typeof CustomEvent === "function") return new CustomEvent(type, { detail });
  const event = new Event(type) as Event & { detail?: Record<string, unknown> };
  event.detail = detail;
  return event;
}

initializeCodexMicroCommands();
initializeCodexMicroLayout();
initializeOnboardingAnimation();
initializeSlotSignals();
initializeJoystickFeedback();
initializeMiniGames();

export { CodexMicroBridge };
