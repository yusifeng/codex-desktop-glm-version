// Coin-toss simulation learning model. Release chunk: model-a922e6cdd48b.js.
import "@rchunk/rolldown-runtime";

type CoinResult = "none" | "heads" | "tails";
interface CoinTossValues { heads?: number | null; tails?: number | null; lastResult?: string | null }
interface CoinTossState { heads: number; tails: number; lastResult: CoinResult }

let maximumTossCount: number;
let defaultCoinTossState: CoinTossState;
let summarizeCoinTosses: (values: CoinTossValues) => {
  safeValues: CoinTossState; total: number; headsPercent: number; tailsPercent: number;
  headsDisplayPercent: number; tailsDisplayPercent: number;
};
let runCoinTosses: (values: CoinTossValues, tossCount: number, random: () => number) => CoinTossState;
let initialized = false;

function initializeCoinTossSimulationModel(): void {
  if (initialized) return;
  initialized = true;
  maximumTossCount = 1_000_000;
  const countRange = { defaultValue: 0, min: 0, max: maximumTossCount };
  const resultRange: { defaultValue: CoinResult; allowedValues: CoinResult[] } = {
    defaultValue: "none", allowedValues: ["none", "heads", "tails"],
  };
  defaultCoinTossState = { heads: countRange.defaultValue, tails: countRange.defaultValue, lastResult: resultRange.defaultValue };
  const normalizeCount = (value: number | null | undefined): number =>
    typeof value !== "number" || !Number.isFinite(value)
      ? countRange.defaultValue
      : Math.min(Math.max(Math.floor(value), countRange.min), countRange.max);
  const isCoinResult = (value: unknown): value is CoinResult => resultRange.allowedValues.some(result => result === value);
  const normalizeCoinTossState = (values: CoinTossValues): CoinTossState => {
    const heads = normalizeCount(values.heads);
    const tails = normalizeCount(values.tails);
    const candidate = isCoinResult(values.lastResult) ? values.lastResult : defaultCoinTossState.lastResult;
    const lastResult = candidate === "heads" && heads > 0 || candidate === "tails" && tails > 0
      ? candidate
      : defaultCoinTossState.lastResult;
    return { heads, tails, lastResult };
  };
  summarizeCoinTosses = values => {
    const safeValues = normalizeCoinTossState(values);
    const total = safeValues.heads + safeValues.tails;
    const headsPercent = total === 0 ? 0 : safeValues.heads / total * 100;
    const tailsPercent = total === 0 ? 0 : safeValues.tails / total * 100;
    const headsDisplayPercent = total === 0 ? 0 : Math.round(headsPercent);
    return {
      safeValues, total, headsPercent, tailsPercent, headsDisplayPercent,
      tailsDisplayPercent: total === 0 ? 0 : 100 - headsDisplayPercent,
    };
  };
  runCoinTosses = (values, tossCount, random) => {
    const state = normalizeCoinTossState(values);
    const requestedTosses = Math.max(0, Math.floor(tossCount));
    const remainingCapacity = Math.max(0, maximumTossCount - state.heads - state.tails);
    if (requestedTosses === 0 || requestedTosses > remainingCapacity) return state;
    let heads = 0;
    let tails = 0;
    let lastResult = state.lastResult;
    for (let index = 0; index < requestedTosses; index += 1) {
      lastResult = random() < 0.5 ? "heads" : "tails";
      if (lastResult === "heads") heads += 1;
      else tails += 1;
    }
    return normalizeCoinTossState({ heads: state.heads + heads, tails: state.tails + tails, lastResult });
  };
}

export {
  initializeCoinTossSimulationModel as a, summarizeCoinTosses as i, maximumTossCount as n,
  runCoinTosses as r, defaultCoinTossState as t,
};
