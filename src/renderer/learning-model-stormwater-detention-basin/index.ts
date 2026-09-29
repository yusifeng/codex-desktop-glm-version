// Stormwater detention-basin teaching model. Release chunk: model-362f6f6503f1.js.
import "@rchunk/rolldown-runtime";

type BasinCondition = "intact" | "degraded";
interface BasinInput { stormStage?: number; condition?: BasinCondition | string }

const basinDefaults = { stormStage: 1, condition: "intact" as BasinCondition };
const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);
const normalizeBasinInput = (input: BasinInput) => ({
  stormStage: clamp(
    Number.isFinite(input.stormStage) ? Math.round(input.stormStage ?? basinDefaults.stormStage) : basinDefaults.stormStage,
    0,
    2,
  ),
  condition: input.condition === "degraded" ? "degraded" as const : "intact" as const,
});
const calculateDetentionBasin = (input: BasinInput) => {
  const safe = normalizeBasinInput(input);
  const degraded = safe.condition === "degraded";
  const stage = safe.stormStage;
  return {
    ...safe,
    waterLevel: degraded ? [0.24, 0.9, 0.26][stage] : [0.32, 0.82, 0.58][stage],
    capacityLevel: degraded ? 0.62 : 0.92,
    basinDepth: degraded ? 0.58 : 1,
    inflow: [1, 0.82, 0.18][stage],
    outflow: degraded ? [0.58, 1, 0.62][stage] : [0.2, 0.38, 0.46][stage],
    incomingLoad: [1, 0.82, 0.24][stage],
    outgoingLoad: degraded ? [0.78, 1, 0.66][stage] : [0.22, 0.36, 0.18][stage],
    retainedLoad: degraded ? [0.16, 0.26, 0.22][stage] : [0.48, 0.94, 0.88][stage],
    overtopping: degraded && stage === 1,
  };
};
function initializeDetentionBasinModel(): void {}

export { normalizeBasinInput as i, calculateDetentionBasin as n, initializeDetentionBasinModel as r, basinDefaults as t };
