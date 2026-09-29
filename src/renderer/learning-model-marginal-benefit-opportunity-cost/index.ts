// Marginal-analysis learning model: compare an additional unit's benefit and opportunity cost.
// Release chunk: app/webview/assets/model-124c142a08f6.js.
import "@rchunk/rolldown-runtime";

interface MarginalAnalysisValues { quantity?: number | null }

let quantityControl: { min: number; max: number; step: number };
let defaultMarginalAnalysisValues: { quantity: number };
let chartBounds: { quantityMin: number; quantityMax: number; marginalMin: number; marginalMax: number };
let marginalBenefit: (quantity: number) => number;
let marginalOpportunityCost: (quantity: number) => number;
let calculateMarginalDecision: (values: MarginalAnalysisValues) => {
  quantity: number; marginalBenefit: number; marginalCost: number; marginalNet: number;
  efficientQuantity: number; efficientMarginalValue: number; intervalStart: number; intervalEnd: number; intervalWidth: number;
  additionalBenefit: number; additionalOpportunityCost: number; localNetContribution: number;
  decision: "increase" | "decrease" | "hold";
};
let initialized = false;

function initializeMarginalBenefitOpportunityCostModel(): void {
  if (initialized) return;
  initialized = true;
  quantityControl = { min: 0, max: 10, step: 0.1 };
  defaultMarginalAnalysisValues = { quantity: 2.5 };
  chartBounds = { quantityMin: 0, quantityMax: 10, marginalMin: 0, marginalMax: 110 };
  const benefitIntercept = 100;
  const benefitSlope = -8;
  const costIntercept = 20;
  const costSlope = 8;
  const comparisonWidth = 0.6;
  const equalityTolerance = 1e-7;
  const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
  marginalBenefit = quantity => benefitIntercept + benefitSlope * quantity;
  marginalOpportunityCost = quantity => costIntercept + costSlope * quantity;
  const integrateLinear = (intercept: number, slope: number, start: number, end: number): number =>
    intercept * (end - start) + slope * (end ** 2 - start ** 2) / 2;
  calculateMarginalDecision = values => {
    const quantity = typeof values.quantity === "number" && Number.isFinite(values.quantity)
      ? clamp(values.quantity, quantityControl.min, quantityControl.max)
      : defaultMarginalAnalysisValues.quantity;
    const benefit = marginalBenefit(quantity);
    const opportunityCost = marginalOpportunityCost(quantity);
    const marginalNet = benefit - opportunityCost;
    const decision = Math.abs(marginalNet) < equalityTolerance ? "hold" : marginalNet > 0 ? "increase" : "decrease";
    const intervalWidth = decision === "hold" ? comparisonWidth : Math.min(comparisonWidth, Math.abs(5 - quantity));
    const intervalStart = decision === "increase" ? quantity : decision === "decrease" ? quantity - intervalWidth : quantity - intervalWidth / 2;
    const intervalEnd = intervalStart + intervalWidth;
    const additionalBenefit = integrateLinear(benefitIntercept, benefitSlope, intervalStart, intervalEnd);
    const additionalOpportunityCost = integrateLinear(costIntercept, costSlope, intervalStart, intervalEnd);
    return {
      quantity, marginalBenefit: benefit, marginalCost: opportunityCost, marginalNet, efficientQuantity: 5,
      efficientMarginalValue: marginalBenefit(5), intervalStart, intervalEnd, intervalWidth, additionalBenefit,
      additionalOpportunityCost, localNetContribution: additionalBenefit - additionalOpportunityCost, decision,
    };
  };
}

export {
  marginalBenefit as a, calculateMarginalDecision as i, defaultMarginalAnalysisValues as n,
  marginalOpportunityCost as o, quantityControl as r, initializeMarginalBenefitOpportunityCostModel as s, chartBounds as t,
};
