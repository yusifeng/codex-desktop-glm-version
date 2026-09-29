// Carbon-budget learning model: compare future emissions with 1.5 C and 2 C budgets.
// Release chunk: app/webview/assets/model-b09e8c8b101b.js.
import "@rchunk/rolldown-runtime";

interface CarbonBudgetValues { warmingLimitIndex?: number | null; futureEmissions?: number | null }
interface NormalizedCarbonBudgetValues { warmingLimitIndex: number; futureEmissions: number }

let warmingLimitControl: { defaultValue: number; min: number; max: number; step: number };
let futureEmissionsControl: { defaultValue: number; min: number; max: number; step: number };
let warmingLimits: number[];
let initialRemainingBudgets: number[];
let historicalEmissions: number;
let warmingPerGigaton: number;
let warmingIntercept: number;
let gigatonsToTeratons: number;
let teratonsToGigatons: number;
let calculateCarbonBudget: (values: CarbonBudgetValues) => NormalizedCarbonBudgetValues & {
  warmingLimit: number; historicalEmissions: number; cumulativeEmissions: number; impliedWarming: number;
  allowableCumulativeEmissions: number; initialRemainingBudget: number; remainingBudget: number;
  overshoot: number; status: "at" | "within" | "beyond";
};
let initialized = false;

function initializeCarbonBudgetModel(): void {
  if (initialized) return;
  initialized = true;
  warmingLimitControl = { defaultValue: 0, min: 0, max: 1, step: 1 };
  futureEmissionsControl = { defaultValue: 100, min: 0, max: 1600, step: 5 };
  warmingLimits = [1.5, 2];
  initialRemainingBudgets = [170, 1055];
  historicalEmissions = 2770;
  warmingPerGigaton = (warmingLimits[1] - warmingLimits[0]) / (initialRemainingBudgets[1] - initialRemainingBudgets[0]);
  warmingIntercept = warmingLimits[0] - initialRemainingBudgets[0] * warmingPerGigaton;
  gigatonsToTeratons = 0.27 / 1_000;
  teratonsToGigatons = 0.63 / 1_000;
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
  const normalizeFinite = (value: number | null | undefined, fallback: number, minimum: number, maximum: number): number =>
    typeof value === "number" && Number.isFinite(value) ? clamp(value, minimum, maximum) : fallback;
  const normalizeValues = (values: CarbonBudgetValues): NormalizedCarbonBudgetValues => ({
    warmingLimitIndex: Math.round(normalizeFinite(values.warmingLimitIndex, warmingLimitControl.defaultValue, warmingLimitControl.min, warmingLimitControl.max)),
    futureEmissions: normalizeFinite(values.futureEmissions, futureEmissionsControl.defaultValue, futureEmissionsControl.min, futureEmissionsControl.max),
  });
  calculateCarbonBudget = values => {
    const normalized = normalizeValues(values);
    const warmingLimit = warmingLimits[normalized.warmingLimitIndex] ?? 1.5;
    const initialRemainingBudget = initialRemainingBudgets[normalized.warmingLimitIndex] ?? initialRemainingBudgets[0];
    const cumulativeEmissions = historicalEmissions + normalized.futureEmissions;
    const allowableCumulativeEmissions = historicalEmissions + initialRemainingBudget;
    const budgetDifference = initialRemainingBudget - normalized.futureEmissions;
    return {
      ...normalized, warmingLimit, historicalEmissions, cumulativeEmissions,
      impliedWarming: warmingIntercept + normalized.futureEmissions * warmingPerGigaton,
      allowableCumulativeEmissions, initialRemainingBudget, remainingBudget: Math.max(0, budgetDifference),
      overshoot: Math.max(0, -budgetDifference),
      status: Math.abs(budgetDifference) < 0.5 ? "at" : budgetDifference > 0 ? "within" : "beyond",
    };
  };
}

export {
  teratonsToGigatons as a, warmingPerGigaton as c, gigatonsToTeratons as i, calculateCarbonBudget as l,
  futureEmissionsControl as n, warmingLimits as o, historicalEmissions as r, warmingLimitControl as s,
  warmingIntercept as t, initializeCarbonBudgetModel as u,
};
