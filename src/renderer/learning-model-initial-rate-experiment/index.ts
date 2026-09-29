// Initial-rate experiment learning model for inferring reaction orders.
import "@rchunk/rolldown-runtime";

type ReactionOrder = "zero" | "first" | "second";
type Reactant = "A" | "B";
interface InitialRateValues { order_a?: unknown; order_b?: unknown; variedReactant?: unknown; concentrationMultiplier?: number | null }

const initialRateType = "INITIAL_RATE_EXPERIMENT";
const initialRateThumbnail = "initial-rate-experiment-v1";
const initialRateFormula = "\\frac{r_{0,2}}{r_{0,1}}=\\left(\\frac{[X]_{0,2}}{[X]_{0,1}}\\right)^p";
const initialRateParameters = {
  order_a: { kind: "enum", defaultValue: "first" as ReactionOrder, allowedValues: ["zero", "first", "second"] as ReactionOrder[] },
  order_b: { kind: "enum", defaultValue: "second" as ReactionOrder, allowedValues: ["zero", "first", "second"] as ReactionOrder[] },
};
const initialRateDefinition = { type: initialRateType, version: 2, thumbnailAssetKey: initialRateThumbnail, canonicalFormula: initialRateFormula, parameters: initialRateParameters };
const isReactionOrder = (value: unknown): value is ReactionOrder => value === "zero" || value === "first" || value === "second";
const isReactant = (value: unknown): value is Reactant => value === "A" || value === "B";
const orderAParameter = initialRateDefinition.parameters.order_a;
const orderBParameter = initialRateDefinition.parameters.order_b;
if (!isReactionOrder(orderAParameter.defaultValue) || !isReactionOrder(orderBParameter.defaultValue) || !orderAParameter.allowedValues.every(isReactionOrder) || !orderBParameter.allowedValues.every(isReactionOrder)) {
  throw Error("Initial-rate experiment manifest contains an invalid order");
}
const concentrationMultiplierControl = { defaultValue: 2, min: 1, max: 4, step: 1 };
const defaultInitialRateValues = { order_a: orderAParameter.defaultValue, order_b: orderBParameter.defaultValue, variedReactant: "A" as Reactant, concentrationMultiplier: concentrationMultiplierControl.defaultValue };
const normalizeMultiplier = (value: number | null | undefined): number => Number.isFinite(value)
  ? Math.min(concentrationMultiplierControl.max, Math.max(concentrationMultiplierControl.min, Math.round(value as number)))
  : concentrationMultiplierControl.defaultValue;
const normalizeInitialRateValues = (values: InitialRateValues) => ({
  order_a: isReactionOrder(values.order_a) ? values.order_a : defaultInitialRateValues.order_a,
  order_b: isReactionOrder(values.order_b) ? values.order_b : defaultInitialRateValues.order_b,
  variedReactant: isReactant(values.variedReactant) ? values.variedReactant : defaultInitialRateValues.variedReactant,
  concentrationMultiplier: normalizeMultiplier(values.concentrationMultiplier),
});
const orderExponents: Record<ReactionOrder, number> = { zero: 0, first: 1, second: 2 };

function deriveInitialRateState(values: InitialRateValues) {
  const safeValues = normalizeInitialRateValues(values);
  const order = safeValues.variedReactant === "A" ? safeValues.order_a : safeValues.order_b;
  const exponent = orderExponents[order];
  const rateRatio = safeValues.concentrationMultiplier ** exponent;
  return { safeValues, variedReactant: safeValues.variedReactant, heldReactant: safeValues.variedReactant === "A" ? "B" : "A", order, exponent, concentrationRatio: safeValues.concentrationMultiplier, baselineRate: 1, comparisonRate: rateRatio, rateRatio, tangentEndTime: Math.min(1.15, 3.8 / rateRatio), canInferOrder: safeValues.concentrationMultiplier > 1 };
}
const productConcentrationAt = (time: number, rate: number): number => 5 * (1 - Math.exp(-time * rate / 5));
const buildInitialRateCurve = (rate: number) => Array.from({ length: 121 }, (_unused, index) => {
  const time = 4 * index / 120;
  return { x: time, y: productConcentrationAt(time, rate) };
});

function initializeInitialRateSchema(): void {}
function initializeInitialRateModel(): void {}

export {
  initializeInitialRateModel as a,
  initializeInitialRateSchema as c,
  buildInitialRateCurve as i,
  initialRateDefinition as l,
  defaultInitialRateValues as n,
  productConcentrationAt as o,
  deriveInitialRateState as r,
  normalizeInitialRateValues as s,
  concentrationMultiplierControl as t,
};
