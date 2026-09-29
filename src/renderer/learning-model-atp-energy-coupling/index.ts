// ATP-hydrolysis energy-coupling learning model.
import "@rchunk/rolldown-runtime";

interface EnergyCouplingValues {
  trace?: number | null;
  workCost?: number | null;
}

const traceControl = { min: 0, max: 1, step: 1 };
const workCostControl = { min: 5, max: 50, step: 1, unit: "kJ/mol" };
const defaultEnergyCouplingValues = { trace: 1, workCost: 20 };
const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

function calculateEnergyCoupling(values: EnergyCouplingValues) {
  const trace = Number.isFinite(values.trace)
    ? Math.round(clamp(values.trace ?? 1, traceControl.min, traceControl.max))
    : defaultEnergyCouplingValues.trace;
  const workCost = Number.isFinite(values.workCost)
    ? clamp(values.workCost ?? 20, workCostControl.min, workCostControl.max)
    : defaultEnergyCouplingValues.workCost;
  const netDeltaG = workCost - 30;
  const isFavorable = netDeltaG < 0;
  const isAtThreshold = netDeltaG === 0;
  const workCompletion = isFavorable
    ? 1
    : isAtThreshold
      ? 0.82
      : 0.82 - 0.3 * ((workCost - 30) / (workCostControl.max - 30));
  return {
    trace,
    workCost,
    netDeltaG,
    isFavorable,
    isAtThreshold,
    isWorkFocused: trace === 1,
    workCompletion,
    workEnergyMarks: workCost / 5,
    hydrolysisEnergyMarks: 6,
  };
}

function initializeAtpEnergyCouplingModel(): void {}

export {
  initializeAtpEnergyCouplingModel as a,
  calculateEnergyCoupling as i,
  traceControl as n,
  workCostControl as r,
  defaultEnergyCouplingValues as t,
};
