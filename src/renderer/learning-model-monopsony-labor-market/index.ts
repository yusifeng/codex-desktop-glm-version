// Monopsony labor-market-power teaching model. Release chunk: model-810bae520b6d.js.
import "@rchunk/rolldown-runtime";

interface MonopsonyInput { employerPower?: number }

const employerPowerControl = { min: 0, max: 100, step: 5, defaultValue: 60 };
const monopsonyDefaults = { employerPower: employerPowerControl.defaultValue };
const laborChartBounds = { employmentMin: 0, employmentMax: 100, wageMin: 0, wageMax: 110 };
const demandSlope = 0.8;
const maximumSupplySlope = 0.8;
const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));
const normalizeMonopsonyInput = (input: MonopsonyInput) => ({
  employerPower: Number.isFinite(input.employerPower)
    ? clamp(input.employerPower ?? employerPowerControl.defaultValue, employerPowerControl.min, employerPowerControl.max)
    : employerPowerControl.defaultValue,
});
const laborDemandWage = (employment: number): number => 100 - demandSlope * employment;
const calculateMonopsonyLaborMarket = (input: MonopsonyInput) => {
  const { employerPower } = normalizeMonopsonyInput(input);
  const supplySlope = employerPower / 100 * maximumSupplySlope;
  const competitiveWage = laborDemandWage(60);
  const supplyIntercept = competitiveWage - supplySlope * 60;
  const monopsonyEmployment = (100 - supplyIntercept) / (demandSlope + 2 * supplySlope);
  const monopsonyWage = supplyIntercept + supplySlope * monopsonyEmployment;
  return {
    employerPower,
    supplySlope,
    supplyIntercept,
    competitiveEmployment: 60,
    competitiveWage,
    monopsonyEmployment,
    monopsonyWage,
    marginalLaborCost: supplyIntercept + 2 * supplySlope * monopsonyEmployment,
    totalLaborCost: monopsonyWage * monopsonyEmployment,
    unhiredWorkers: 60 - monopsonyEmployment,
  };
};
function initializeMonopsonyModel(): void {}

export { laborDemandWage as a, calculateMonopsonyLaborMarket as i, monopsonyDefaults as n, initializeMonopsonyModel as o, employerPowerControl as r, normalizeMonopsonyInput as s, laborChartBounds as t };
