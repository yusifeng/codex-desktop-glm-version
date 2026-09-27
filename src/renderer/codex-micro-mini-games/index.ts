import "@rchunk/rolldown-runtime";
import {
  FX as initializeSignalRuntime,
  QI as initializeQueryRuntime,
  ZI as appScope,
  pZ as createSignal,
} from "@rchunk/app-shared";
import {
  Evt as initializeMiniGameInput,
  Ovt as isElementVisible,
} from "@rchunk/app-initial";

type MiniGame = "asteroids" | "brick-breaker" | "snake";
interface RotationState {
  accumulatedTurns: number;
  direction: number;
  lastAngle: number | null;
  lastAt: number | null;
  startedAt: number | null;
}

const games: MiniGame[] = ["brick-breaker", "asteroids", "snake"];
const bindings = new Map<HTMLElement, string>();
const idleRotation: RotationState = {
  accumulatedTurns: 0, direction: 0, lastAngle: null, lastAt: null, startedAt: null,
};
let activeMiniGame: unknown;

function registerMiniGameElement(id: string, element: HTMLElement, onLastRemoved?: () => void): () => void {
  bindings.set(element, id);
  return () => {
    bindings.delete(element);
    queueMicrotask(() => {
      for (const value of bindings.values()) if (value === id) return;
      onLastRemoved?.();
    });
  };
}

function getVisibleMiniGameId(): string | null {
  for (const [element, id] of bindings) {
    if (element.isConnected && isElementVisible(element)) return id;
  }
  return null;
}

function chooseMiniGame(random: () => number = Math.random): MiniGame {
  return games[Math.floor(random() * games.length)] ?? "brick-breaker";
}

function clearMiniGame(scope: { set(signal: unknown, value: unknown): void }): void {
  scope.set(activeMiniGame, null);
}

function isActivationInput(input: { act: number; key: string }): boolean {
  return input.key === "AG00" && input.act === 1;
}

function shouldActivateAsteroids(game: { game?: string } | null, input: { act: number; key: string }): boolean {
  return game?.game === "asteroids" && isActivationInput(input);
}

function miniGameAgentSlots(game: { game: string } | null) {
  return game == null ? null : Array.from({ length: 6 }, (_unused, index) => ({
    id: index, threadKey: null, title: null,
    status: game.game === "asteroids" && index === 0 ? "working" : "off",
    selected: false,
  }));
}

function beginRotation(angle: number, now: number): RotationState {
  return { accumulatedTurns: 0, direction: 0, lastAngle: angle, lastAt: now, startedAt: now };
}
function rotationProgress(turns: number): number { return Math.min(Math.abs(turns) / 1.9, 1); }
function angleDelta(previous: number, next: number): number {
  const delta = next - previous;
  return delta > 0.5 ? delta - 1 : delta < -0.5 ? delta + 1 : delta;
}
function updateRotationGesture(
  state: RotationState,
  pointer: { angle: number; distance: number },
  now: number,
) {
  if (pointer.distance < 0.2) return { activated: false, captured: false, progress: 0, state: idleRotation };
  if (state.lastAngle == null || state.lastAt == null || state.startedAt == null
    || now - state.lastAt > 1000 || now - state.startedAt > 6000) {
    return { activated: false, captured: false, progress: 0, state: beginRotation(pointer.angle, now) };
  }
  const delta = angleDelta(state.lastAngle, pointer.angle);
  if (Math.abs(delta) < 0.002) return {
    activated: false, captured: Math.abs(state.accumulatedTurns) >= 0.04,
    progress: rotationProgress(state.accumulatedTurns),
    state: { ...state, lastAngle: pointer.angle, lastAt: now },
  };
  const direction = delta > 0 ? 1 : -1;
  if (state.direction !== 0 && direction !== state.direction && Math.abs(delta) >= 0.02) {
    return { activated: false, captured: false, progress: 0, state: beginRotation(pointer.angle, now) };
  }
  const accumulatedTurns = state.accumulatedTurns + delta;
  return Math.abs(accumulatedTurns) >= 1.9
    ? { activated: true, captured: true, progress: 1, state: idleRotation }
    : { activated: false, captured: Math.abs(accumulatedTurns) >= 0.04,
      progress: rotationProgress(accumulatedTurns),
      state: { accumulatedTurns, direction: state.direction === 0 ? direction : state.direction,
        lastAngle: pointer.angle, lastAt: now, startedAt: state.startedAt } };
}

function initializeCodexMicroMiniGames(): void {
  initializeSignalRuntime();
  initializeMiniGameInput();
  initializeQueryRuntime();
  activeMiniGame = createSignal(appScope, null);
}

export {
  miniGameAgentSlots as a, idleRotation as c, registerMiniGameElement as d,
  updateRotationGesture as i, isActivationInput as l, activeMiniGame as n,
  chooseMiniGame as o, getVisibleMiniGameId as r, initializeCodexMicroMiniGames as s,
  clearMiniGame as t, shouldActivateAsteroids as u,
};
