// RAAS-and-ADH learning model: stage the response to volume or osmotic stress.
import "@rchunk/rolldown-runtime";

type InitialCondition = "normal" | "volume loss" | "increased osmolality";
interface RaasAdhValues { initial_condition?: string | null; stage?: number | null }

const raasAdhType = "RAAS_AND_ADH";
const raasAdhThumbnail = "raas-and-adh-v2";
const raasAdhParameters = {
  initial_condition: { kind: "enum", defaultValue: "volume loss" as InitialCondition, allowedValues: ["normal", "volume loss", "increased osmolality"] as InitialCondition[] },
};
const raasAdhDefinition = { type: raasAdhType, version: 2, thumbnailAssetKey: raasAdhThumbnail, parameters: raasAdhParameters };
const initialConditionParameter = raasAdhDefinition.parameters.initial_condition;
const initialConditions = initialConditionParameter.allowedValues;
const initialConditionControl = { min: 0, max: initialConditions.length - 1, step: 1, defaultValue: initialConditionParameter.defaultValue };
const raasAdhStageControl = { min: 0, max: 3, step: 1, defaultValue: 0 };
const initialConditionToIndex = (condition: string): number => Math.max(0, initialConditions.indexOf(condition as InitialCondition));
const indexToInitialCondition = (index: number): InitialCondition =>
  initialConditions[Math.min(Math.max(Math.round(index), 0), initialConditions.length - 1)] ?? initialConditionControl.defaultValue;
const isInitialCondition = (value: string): value is InitialCondition => initialConditions.includes(value as InitialCondition);
const normalizeRaasAdhValues = (values: RaasAdhValues) => ({
  initial_condition: isInitialCondition(values.initial_condition ?? "") ? values.initial_condition as InitialCondition : initialConditionControl.defaultValue,
  stage: Number.isFinite(values.stage)
    ? Math.min(Math.max(Math.round(values.stage ?? raasAdhStageControl.defaultValue), 0), 3)
    : raasAdhStageControl.defaultValue,
});

function deriveRaasAdhState(values: RaasAdhValues) {
  const normalized = normalizeRaasAdhValues(values);
  const volumeLoss = normalized.initial_condition === "volume loss";
  const osmotic = normalized.initial_condition === "increased osmolality";
  const cascade = volumeLoss && normalized.stage >= 1;
  const effectors = normalized.stage >= 2;
  const restored = normalized.stage >= 3;
  return {
    ...normalized,
    volumeLoss,
    osmotic,
    cascade,
    constriction: cascade && effectors,
    aldosterone: cascade && effectors,
    adh: (volumeLoss || osmotic) && effectors,
    pressure: volumeLoss && restored,
    volume: volumeLoss && restored,
    waterBalance: osmotic && restored,
    feedback: (volumeLoss || osmotic) && restored,
  };
}

function initializeRaasAdhSchema(): void {}
function initializeRaasAdhModel(): void {}

export {
  initialConditionToIndex as a,
  initializeRaasAdhSchema as c,
  indexToInitialCondition as i,
  raasAdhDefinition as l,
  raasAdhStageControl as n,
  initializeRaasAdhModel as o,
  deriveRaasAdhState as r,
  normalizeRaasAdhValues as s,
  initialConditionControl as t,
};
