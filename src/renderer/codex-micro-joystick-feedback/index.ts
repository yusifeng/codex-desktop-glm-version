import {
  FX as initializeSignalRuntime,
  QI as initializeScopedSignals,
  ZI as appScope,
  pZ as createScopedSignal,
  type MaitaiScopeApi,
  type ScopedSignal,
} from "@rchunk/app-shared";
import "@rchunk/app-initial";

export type JoystickDirection = "up" | "right" | "down" | "left";
export interface JoystickEvent { angle: number; distance: number }
export type JoystickAction = Record<string, unknown> | null;
export type JoystickFeedbackStatus =
  | "game-gesture" | "tracking" | "triggered" | "unassigned" | "unavailable";
export interface JoystickFeedback {
  action: JoystickAction;
  direction: JoystickDirection;
  event: JoystickEvent;
  gameActivationProgress?: number;
  status: JoystickFeedbackStatus;
  visible: boolean;
}
export interface JoystickFeedbackUpdate {
  activeDirection: JoystickDirection | null;
  enabled: boolean;
  event: JoystickEvent;
  executionStatus?: JoystickFeedbackStatus | null;
  mapping: Partial<Record<JoystickDirection, JoystickAction>>;
  previousActiveDirection: JoystickDirection | null;
}

const activationThreshold = 0.1;
const initialFeedback: JoystickFeedback = {
  action: null,
  direction: "right",
  event: { angle: 0, distance: 0 },
  status: "tracking",
  visible: false,
};
let feedbackSignal: ScopedSignal<Record<string, unknown>, JoystickFeedback>;

function directionForEvent(event: JoystickEvent, threshold = activationThreshold): JoystickDirection | null {
  if (event.distance < threshold) return null;
  const normalized = ((event.angle % 1) + 1) % 1;
  if (normalized >= 0.875 || normalized < 0.125) return "right";
  if (normalized < 0.375) return "down";
  if (normalized < 0.625) return "left";
  return "up";
}

function reduceFeedback(current: JoystickFeedback, update: JoystickFeedbackUpdate): JoystickFeedback {
  if (!update.enabled) return hideFeedback(current);
  if (update.event.distance < activationThreshold) {
    return current.visible ? { ...current, event: update.event } : current;
  }
  const direction = directionForEvent(update.event);
  if (direction == null) return current;
  const action = update.mapping[direction] ?? null;
  if (update.activeDirection === direction && update.previousActiveDirection !== direction) {
    return {
      action,
      direction,
      event: update.event,
      status: action == null ? "unassigned" : (update.executionStatus ?? "unavailable"),
      visible: true,
    };
  }
  return {
    action,
    direction,
    event: update.event,
    status: current.visible && current.direction === direction
      && update.activeDirection === direction && update.previousActiveDirection === direction
      && current.status !== "tracking" ? current.status : "tracking",
    visible: true,
  };
}

function gameGestureFeedback(current: JoystickFeedback, event: JoystickEvent, progress: number): JoystickFeedback {
  return {
    action: null,
    direction: directionForEvent(event) ?? current.direction,
    event,
    gameActivationProgress: Math.min(Math.max(progress, 0), 1),
    status: "game-gesture",
    visible: true,
  };
}

function hideFeedback(current: JoystickFeedback): JoystickFeedback {
  return current.visible ? { ...current, visible: false } : current;
}

function updateFeedback(scope: MaitaiScopeApi<unknown>, update: JoystickFeedbackUpdate): JoystickFeedback {
  const next = reduceFeedback(scope.get(feedbackSignal), update);
  scope.set(feedbackSignal, next);
  return next;
}

function showGameGesture(scope: MaitaiScopeApi<unknown>, event: JoystickEvent, progress: number): void {
  scope.set(feedbackSignal, gameGestureFeedback(scope.get(feedbackSignal), event, progress));
}

function hideJoystickFeedback(scope: MaitaiScopeApi<unknown>): void {
  scope.set(feedbackSignal, hideFeedback);
}

function resetJoystickFeedback(scope: MaitaiScopeApi<unknown>): void {
  scope.set(feedbackSignal, initialFeedback);
}

function initializeJoystickFeedback(): void {
  initializeSignalRuntime();
  initializeScopedSignals();
  feedbackSignal = createScopedSignal(appScope, initialFeedback);
}

export {
  updateFeedback as a,
  resetJoystickFeedback as i,
  hideJoystickFeedback as n,
  showGameGesture as o,
  initializeJoystickFeedback as r,
  feedbackSignal as t,
};
