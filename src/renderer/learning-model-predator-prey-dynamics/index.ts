// Lotka-Volterra predator-prey trajectories integrated with RK4.
import "@rchunk/rolldown-runtime";

type StartingBalance = "balanced" | "prey-surge" | "predator-surge";
interface PredatorPreyValues { initial_prey_abundance?: number | null; initial_predator_abundance?: number | null; startingBalance?: unknown; selectedTime?: number | null }

const predatorPreySpecification = { type: "PREDATOR_PREY_DYNAMICS", version: 3, thumbnailAssetKey: "predator-prey-dynamics-v1", parameters: { initial_prey_abundance: { kind: "number" as const, defaultValue: 1.4, min: 0.65, max: 1.4 }, initial_predator_abundance: { kind: "number" as const, defaultValue: 0.65, min: 0.65, max: 1.4 } } };
const preyParameter = predatorPreySpecification.parameters.initial_prey_abundance;
const predatorParameter = predatorPreySpecification.parameters.initial_predator_abundance;
const simulationDuration = 20;
const simulationSteps = 500;
const surgeMultiplier = 2;
const steadyTolerance = 1e-6;
const maximumCachedTrajectories = 24;
const trajectoryCache = new Map<string, { preyPoints: Array<{ x: number; y: number }>; predatorPoints: Array<{ x: number; y: number }> }>();
const selectedTimeControl = { min: 0, max: simulationDuration, step: 0.25, defaultValue: 4 };
const defaultPredatorPreyValues = { initial_prey_abundance: preyParameter.defaultValue, initial_predator_abundance: predatorParameter.defaultValue, startingBalance: "balanced" as StartingBalance, selectedTime: selectedTimeControl.defaultValue };
const finiteOrDefault = (value: unknown, defaultValue: number): number => typeof value === "number" && Number.isFinite(value) ? value : defaultValue;
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const isStartingBalance = (value: unknown): value is StartingBalance => value === "balanced" || value === "prey-surge" || value === "predator-surge";
const normalizePredatorPreyValues = (values: PredatorPreyValues) => ({
  initial_prey_abundance: clamp(finiteOrDefault(values.initial_prey_abundance, defaultPredatorPreyValues.initial_prey_abundance), preyParameter.min, preyParameter.max),
  initial_predator_abundance: clamp(finiteOrDefault(values.initial_predator_abundance, defaultPredatorPreyValues.initial_predator_abundance), predatorParameter.min, predatorParameter.max),
  startingBalance: isStartingBalance(values.startingBalance) ? values.startingBalance : defaultPredatorPreyValues.startingBalance,
  selectedTime: clamp(finiteOrDefault(values.selectedTime, defaultPredatorPreyValues.selectedTime), selectedTimeControl.min, selectedTimeControl.max),
});
const predatorPreyDerivative = (prey: number, predator: number) => ({ prey: prey * (1 - predator), predator: predator * (prey - 1) });
const rk4Step = (prey: number, predator: number, stepSize: number) => {
  const first = predatorPreyDerivative(prey, predator);
  const second = predatorPreyDerivative(prey + first.prey * stepSize / 2, predator + first.predator * stepSize / 2);
  const third = predatorPreyDerivative(prey + second.prey * stepSize / 2, predator + second.predator * stepSize / 2);
  const fourth = predatorPreyDerivative(prey + third.prey * stepSize, predator + third.predator * stepSize);
  return { prey: prey + stepSize * (first.prey + 2 * second.prey + 2 * third.prey + fourth.prey) / 6, predator: predator + stepSize * (first.predator + 2 * second.predator + 2 * third.predator + fourth.predator) / 6 };
};
const directionForDerivative = (value: number): "steady" | "rising" | "falling" => Math.abs(value) <= steadyTolerance ? "steady" : value > 0 ? "rising" : "falling";
const trajectoryForValues = (values: ReturnType<typeof normalizePredatorPreyValues>) => {
  const key = [values.initial_prey_abundance, values.initial_predator_abundance, values.startingBalance].join(":");
  const cached = trajectoryCache.get(key);
  if (cached) return cached;
  let prey = values.initial_prey_abundance * (values.startingBalance === "prey-surge" ? surgeMultiplier : 1);
  let predator = values.initial_predator_abundance * (values.startingBalance === "predator-surge" ? surgeMultiplier : 1);
  const stepSize = simulationDuration / simulationSteps;
  const preyPoints: Array<{ x: number; y: number }> = [];
  const predatorPoints: Array<{ x: number; y: number }> = [];
  for (let step = 0; step <= simulationSteps; step += 1) { const x = step * stepSize; preyPoints.push({ x, y: prey }); predatorPoints.push({ x, y: predator }); if (step < simulationSteps) ({ prey, predator } = rk4Step(prey, predator, stepSize)); }
  const trajectory = { preyPoints, predatorPoints };
  trajectoryCache.set(key, trajectory);
  if (trajectoryCache.size > maximumCachedTrajectories) { const oldestKey = trajectoryCache.keys().next().value; if (oldestKey !== undefined) trajectoryCache.delete(oldestKey); }
  return trajectory;
};
const calculatePredatorPrey = (values: PredatorPreyValues) => {
  const normalized = normalizePredatorPreyValues(values);
  const trajectory = trajectoryForValues(normalized);
  const continuousIndex = normalized.selectedTime / simulationDuration * simulationSteps;
  const lowerIndex = Math.floor(continuousIndex);
  const upperIndex = Math.min(simulationSteps, lowerIndex + 1);
  const fraction = continuousIndex - lowerIndex;
  const prey = trajectory.preyPoints[lowerIndex].y * (1 - fraction) + trajectory.preyPoints[upperIndex].y * fraction;
  const predator = trajectory.predatorPoints[lowerIndex].y * (1 - fraction) + trajectory.predatorPoints[upperIndex].y * fraction;
  const derivative = predatorPreyDerivative(prey, predator);
  const preyDirection = directionForDerivative(derivative.prey);
  const predatorDirection = directionForDerivative(derivative.predator);
  return { values: normalized, ...trajectory, prey, predator, preyDirection, predatorDirection, isEquilibrium: preyDirection === "steady" && predatorDirection === "steady" };
};

function initializePredatorPreySpecification(): void {}
function initializePredatorPreyModel(): void {}

export { initializePredatorPreySpecification as a, initializePredatorPreyModel as i, selectedTimeControl as n, predatorPreySpecification as o, calculatePredatorPrey as r, defaultPredatorPreyValues as t };
