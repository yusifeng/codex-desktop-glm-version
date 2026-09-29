// Turnstile finite-state-machine learning model.
import "@rchunk/rolldown-runtime";

type TurnstileInput = "coin" | "push";
type TurnstileState = "locked" | "unlocked";
interface TurnstileHistoryValues { history?: unknown; priorState?: unknown; processedCount?: number | null }
interface TurnstileStoredValues { history: TurnstileInput[]; priorState: TurnstileState; processedCount: number }

const createDefaultTurnstileValues = (): TurnstileStoredValues => ({ history: [], priorState: "locked", processedCount: 0 });
const transitionTurnstile = (state: TurnstileState, input: TurnstileInput): TurnstileState =>
  state === "locked" ? input === "coin" ? "unlocked" : "locked" : input === "push" ? "locked" : "unlocked";
const isTurnstileInput = (value: unknown): value is TurnstileInput => value === "coin" || value === "push";

function deriveTurnstileState(values: TurnstileHistoryValues) {
  const allHistory = (Array.isArray(values.history) ? values.history : []).filter(isTurnstileInput);
  const omittedHistory = allHistory.slice(0, -12);
  const history = allHistory.slice(-12);
  const priorState = omittedHistory.reduce(transitionTurnstile, values.priorState === "unlocked" ? "unlocked" : "locked");
  const processedCount = Math.max(
    allHistory.length,
    Number.isSafeInteger(values.processedCount) && (values.processedCount as number) > 0 ? values.processedCount as number : 0,
  );
  const latestInput = history.at(-1) ?? null;
  const previousState = latestInput ? history.slice(0, -1).reduce(transitionTurnstile, priorState) : null;
  return {
    history,
    state: history.reduce(transitionTurnstile, priorState),
    previousState,
    latestInput,
    processedCount,
    omittedCount: Math.max(0, processedCount - history.length),
    priorState,
  };
}

function appendTurnstileInput(values: TurnstileHistoryValues, input: TurnstileInput): TurnstileStoredValues {
  const current = deriveTurnstileState(values);
  const history = [...current.history, input];
  const omittedInput = history.length > 12 ? history.shift() : undefined;
  return {
    history,
    priorState: omittedInput ? transitionTurnstile(current.priorState, omittedInput) : current.priorState,
    processedCount: Math.min(2 ** 53 - 1, current.processedCount + 1),
  };
}

function initializeTurnstileFiniteStateMachineModel(): void {}

export {
  initializeTurnstileFiniteStateMachineModel as i,
  appendTurnstileInput as n,
  createDefaultTurnstileValues as r,
  deriveTurnstileState as t,
};
