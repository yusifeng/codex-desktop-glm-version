// Flower-pollination teaching model. Release chunk: model-eed880ff8885.js.
import "@rchunk/rolldown-runtime";

type PollinationType = "self-pollination" | "cross-pollination";
interface PollinationInput { pollination_type?: string; stage?: number }

const flowerPollinationDefinition = {
  type: "FLOWER_POLLINATION",
  version: 2,
  thumbnailAssetKey: "flower-pollination-v3",
  parameters: { pollination_type: { kind: "enum", defaultValue: "cross-pollination", allowedValues: ["self-pollination", "cross-pollination"] } },
} as const;
const pollinationTypeParameter = flowerPollinationDefinition.parameters.pollination_type;
const pollinationTypes: readonly PollinationType[] = pollinationTypeParameter.allowedValues;
const pollinationTypeControl = { min: 0, max: pollinationTypes.length - 1, step: 1, defaultValue: pollinationTypeParameter.defaultValue };
const pollinationStageControl = { min: 0, max: 3, step: 1, defaultValue: 0 };
const isPollinationType = (value: string): value is PollinationType => pollinationTypes.includes(value as PollinationType);
const normalizePollinationInput = (input: PollinationInput) => ({
  pollination_type: typeof input.pollination_type === "string" && isPollinationType(input.pollination_type) ? input.pollination_type : pollinationTypeControl.defaultValue,
  stage: typeof input.stage === "number" && Number.isFinite(input.stage) ? Math.min(pollinationStageControl.max, Math.max(pollinationStageControl.min, Math.round(input.stage))) : pollinationStageControl.defaultValue,
});
const pollinationTypeIndex = (value: PollinationType): number => Math.max(0, pollinationTypes.indexOf(value));
const pollinationTypeAtIndex = (index: number): PollinationType => pollinationTypes[Math.min(Math.max(Math.round(index), 0), pollinationTypes.length - 1)] ?? pollinationTypeControl.defaultValue;
const calculatePollinationStage = (stage: number) => ({ pollenOnAnther: stage <= 1, pollenOnPollinator: stage === 1, pollenOnStigma: stage >= 2, pollenTube: stage === 3 });
function initializeFlowerPollinationDefinition(): void {}
function initializeFlowerPollinationModel(): void {}

export { pollinationTypeIndex as a, initializeFlowerPollinationDefinition as c, pollinationTypeAtIndex as i, flowerPollinationDefinition as l, pollinationStageControl as n, initializeFlowerPollinationModel as o, calculatePollinationStage as r, normalizePollinationInput as s, pollinationTypeControl as t };
