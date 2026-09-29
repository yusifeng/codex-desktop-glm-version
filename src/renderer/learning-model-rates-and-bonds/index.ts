// Rates-and-bonds learning model: discount fixed cash flows at a changing yield.
import "@rchunk/rolldown-runtime";

interface BondYieldValues { yieldChangePercentagePoints?: number | null }

const ratesAndBondsType = "RATES_AND_BONDS";
const ratesAndBondsThumbnail = "rates-and-bonds-v1";
const ratesAndBondsParameters = { yieldChangePercentagePoints: { kind: "number", defaultValue: 0, min: -3, max: 3 } };
const ratesAndBondsDefinition = { type: ratesAndBondsType, version: 1, thumbnailAssetKey: ratesAndBondsThumbnail, parameters: ratesAndBondsParameters };
const yieldChangeParameter = ratesAndBondsDefinition.parameters.yieldChangePercentagePoints;
const yieldChangeControl = { min: yieldChangeParameter.min, max: yieldChangeParameter.max, step: 0.25, defaultValue: yieldChangeParameter.defaultValue };
const exampleBond = { faceValue: 1000, annualCouponRate: 0.04, yearsRemaining: 7, baselineYield: 0.04 };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeBondYieldValues = (values: BondYieldValues) => ({
  yieldChangePercentagePoints: clamp(
    Number.isFinite(values.yieldChangePercentagePoints) ? values.yieldChangePercentagePoints ?? yieldChangeControl.defaultValue : yieldChangeControl.defaultValue,
    yieldChangeControl.min,
    yieldChangeControl.max,
  ),
});

function priceExampleBond(yieldRate: number): number {
  const annualCoupon = exampleBond.faceValue * exampleBond.annualCouponRate;
  let presentValue = 0;
  for (let year = 1; year <= exampleBond.yearsRemaining; year += 1) presentValue += annualCoupon / (1 + yieldRate) ** year;
  return presentValue + exampleBond.faceValue / (1 + yieldRate) ** exampleBond.yearsRemaining;
}

function calculateRateAndBondState(values: BondYieldValues) {
  const safeValues = normalizeBondYieldValues(values);
  const marketYield = exampleBond.baselineYield + safeValues.yieldChangePercentagePoints / 100;
  const baselinePrice = priceExampleBond(exampleBond.baselineYield);
  const bondPrice = priceExampleBond(marketYield);
  const priceChange = bondPrice - baselinePrice;
  return {
    safeValues,
    marketYield,
    baselinePrice,
    bondPrice,
    priceChange,
    priceChangePercent: priceChange / baselinePrice * 100,
    direction: safeValues.yieldChangePercentagePoints > 0 ? "yieldUp" : safeValues.yieldChangePercentagePoints < 0 ? "yieldDown" : "unchanged",
  };
}

function initializeRatesAndBondsSchema(): void {}
function initializeRatesAndBondsModel(): void {}

export {
  initializeRatesAndBondsSchema as a,
  normalizeBondYieldValues as i,
  calculateRateAndBondState as n,
  ratesAndBondsDefinition as o,
  initializeRatesAndBondsModel as r,
  yieldChangeControl as t,
};
