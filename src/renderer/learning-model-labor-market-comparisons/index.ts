// Labor-market comparison teaching model. Release chunk: model-22f6fd6b2321.js.
import "@rchunk/rolldown-runtime";

interface LaborMarketInput { comparison?: number }

const laborComparisonControl = { min: 0, max: 6, step: 1 };
const laborMarketDefaults = { comparison: 0 };
const laborMarketChartBounds = { employmentMin: 0, employmentMax: 100, wageMin: 0, wageMax: 110 };
const demandSlope = 0.7;
const supplySlope = 0.5;
const curveShift = 14;
const normalizeLaborMarketInput = (input: LaborMarketInput) => ({
  comparison: Number.isFinite(input.comparison)
    ? Math.min(laborComparisonControl.max, Math.max(laborComparisonControl.min, Math.round(input.comparison ?? 0)))
    : 0,
});
const calculateLaborMarketComparison = (input: LaborMarketInput) => {
  const { comparison } = normalizeLaborMarketInput(input);
  const demandIntercept = 90 + (comparison === 3 ? curveShift : comparison === 4 ? -curveShift : 0);
  const supplyIntercept = 20 + (comparison === 5 ? -curveShift : comparison === 6 ? curveShift : 0);
  const employment = (demandIntercept - supplyIntercept) / 1.2;
  const wage = supplyIntercept + supplySlope * employment;
  const selectedWage = comparison === 1 ? 64.16666666666667 : comparison === 2 ? 34.16666666666667 : undefined;
  return {
    comparison,
    demandIntercept,
    supplyIntercept,
    equilibrium: { employment, wage },
    baseline: { employment: 58.333333333333336, wage: 49.16666666666667 },
    selectedWage,
    quantityDemanded: selectedWage === undefined ? undefined : (90 - selectedWage) / demandSlope,
    quantitySupplied: selectedWage === undefined ? undefined : (selectedWage - 20) / supplySlope,
  };
};
function initializeLaborMarketComparisonsModel(): void {}

export { supplySlope as a, normalizeLaborMarketInput as c, demandSlope as i, laborComparisonControl as n, calculateLaborMarketComparison as o, laborMarketDefaults as r, initializeLaborMarketComparisonsModel as s, laborMarketChartBounds as t };
