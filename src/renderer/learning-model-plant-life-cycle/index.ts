// Flowering-plant life-cycle learning model.
import "@rchunk/rolldown-runtime";

type PlantLifeStage = "germination" | "seedling" | "mature flowering plant" | "pollination" | "seed formation" | "seed dispersal";
interface PlantLifeValues { initial_stage?: string }

let plantLifeCycleManifest: { type: string; version: number; thumbnailAssetKey: string; parameters: { initial_stage: { kind: "enum"; defaultValue: string; allowedValues: string[] } } };
let plantLifeStages: PlantLifeStage[];
let defaultPlantLifeStage: PlantLifeStage;
let normalizePlantLifeCycleValues: (values: PlantLifeValues) => { initial_stage: PlantLifeStage };
let plantLifeStageIndex: (stage: PlantLifeStage) => number;
let plantLifeStageFromStep: (step: number) => PlantLifeStage;
let manifestInitialized = false;
let modelInitialized = false;

function initializePlantLifeCycleManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  plantLifeCycleManifest = { type: "PLANT_LIFE_CYCLE", version: 2, thumbnailAssetKey: "plant-life-cycle-v2", parameters: { initial_stage: { kind: "enum", defaultValue: "germination", allowedValues: ["germination", "seedling", "mature flowering plant", "pollination", "seed formation", "seed dispersal"] } } };
}

function initializePlantLifeCycleModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializePlantLifeCycleManifest();
  const isStage = (value: string | undefined): value is PlantLifeStage => value === "germination" || value === "seedling" || value === "mature flowering plant" || value === "pollination" || value === "seed formation" || value === "seed dispersal";
  plantLifeStages = plantLifeCycleManifest.parameters.initial_stage.allowedValues.filter(isStage);
  const manifestDefault = plantLifeCycleManifest.parameters.initial_stage.defaultValue;
  defaultPlantLifeStage = isStage(manifestDefault) ? manifestDefault : "germination";
  normalizePlantLifeCycleValues = values => ({ initial_stage: plantLifeStages.includes(values.initial_stage as PlantLifeStage) ? values.initial_stage as PlantLifeStage : defaultPlantLifeStage });
  plantLifeStageIndex = stage => plantLifeStages.indexOf(stage);
  plantLifeStageFromStep = step => plantLifeStages[Math.max(0, Math.min(plantLifeStages.length - 1, Math.round(step) - 1))] ?? defaultPlantLifeStage;
}

export { initializePlantLifeCycleModel as a, plantLifeCycleManifest as c, plantLifeStageIndex as i, plantLifeStages as n, normalizePlantLifeCycleValues as o, plantLifeStageFromStep as r, initializePlantLifeCycleManifest as s, defaultPlantLifeStage as t };
