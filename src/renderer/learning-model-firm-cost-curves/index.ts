// Firm-cost curves learning model: compare marginal cost with AVC and ATC.
import "@rchunk/rolldown-runtime";

type CostDirection = "falling" | "minimum" | "rising";
interface FirmCostValues { output?: number | null }
interface FirmCostState {
  atcDirection: CostDirection;
  avcDirection: CostDirection;
  averageFixedCost: number;
  averageTotalCost: number;
  averageVariableCost: number;
  marginalCost: number;
  output: number;
}

const outputControl = { defaultValue: 4.5, min: 1, max: 8, step: 0.1 };
const fixedCost = 50;
const comparisonTolerance = 1e-9;

function costDirection(marginalCost: number, averageCost: number): CostDirection {
  return Math.abs(marginalCost - averageCost) <= comparisonTolerance
    ? "minimum"
    : marginalCost < averageCost ? "falling" : "rising";
}

function normalizeFirmCostValues(values: FirmCostValues): { output: number } {
  return {
    output: Number.isFinite(values.output)
      ? Math.min(Math.max(values.output ?? outputControl.defaultValue, outputControl.min), outputControl.max)
      : outputControl.defaultValue,
  };
}

function calculateFirmCosts(values: FirmCostValues): FirmCostState {
  const { output } = normalizeFirmCostValues(values);
  const averageVariableCost = 35 - 8 * output + output ** 2;
  const averageFixedCost = fixedCost / output;
  const averageTotalCost = averageVariableCost + averageFixedCost;
  const marginalCost = 35 - 16 * output + 3 * output ** 2;
  return {
    output,
    marginalCost,
    averageVariableCost,
    averageFixedCost,
    averageTotalCost,
    avcDirection: costDirection(marginalCost, averageVariableCost),
    atcDirection: costDirection(marginalCost, averageTotalCost),
  };
}

function initializeFirmCostCurvesModel(): void {}

export { normalizeFirmCostValues as i, calculateFirmCosts as n, initializeFirmCostCurvesModel as r, outputControl as t };
