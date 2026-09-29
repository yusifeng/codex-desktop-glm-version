// Eutrophication process learning model. Release chunk: model-6d7b03cccde0.js.
import "@rchunk/rolldown-runtime";

type WaterBody = "freshwater lake" | "estuary" | "coastal bay";
type NutrientInput = "typical nutrient input" | "excess nutrient input";
type EutrophicationStage = "nutrient input" | "algal bloom" | "die-off and decomposition" | "hypoxia";
interface EutrophicationValues { waterBody?: string | null; nutrientInput?: string | null; stageIndex?: number | string | null }
interface EutrophicationState { waterBody: WaterBody; nutrientInput: NutrientInput; stageIndex: number }
interface EutrophicationManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: { waterBody: { kind: "enum"; defaultValue: WaterBody; allowedValues: WaterBody[] } };
}

let eutrophicationManifest: EutrophicationManifest;
let eutrophicationStages: EutrophicationStage[];
let defaultEutrophicationValues: EutrophicationState;
let calculateEutrophicationState: (values: EutrophicationValues) => EutrophicationState & {
  stage: EutrophicationStage; excess: boolean; runoffCount: number; bloomStrength: number; lightStrength: number;
  detritusCount: number; oxygenLevel: "low" | "adequate" | "high"; fishState: "stressed" | "leaving" | "healthy";
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeEutrophicationManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  eutrophicationManifest = {
    type: "EUTROPHICATION", version: 2, thumbnailAssetKey: "eutrophication-v3",
    parameters: {
      waterBody: { kind: "enum", defaultValue: "freshwater lake", allowedValues: ["freshwater lake", "estuary", "coastal bay"] },
    },
  };
}

function initializeEutrophicationModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeEutrophicationManifest();
  eutrophicationStages = ["nutrient input", "algal bloom", "die-off and decomposition", "hypoxia"];
  const waterBodyParameter = eutrophicationManifest.parameters.waterBody;
  const isWaterBody = (value: unknown): value is WaterBody =>
    value === "freshwater lake" || value === "estuary" || value === "coastal bay";
  waterBodyParameter.allowedValues.filter(isWaterBody);
  defaultEutrophicationValues = {
    waterBody: isWaterBody(waterBodyParameter.defaultValue) ? waterBodyParameter.defaultValue : "freshwater lake",
    nutrientInput: "excess nutrient input", stageIndex: 0,
  };
  const normalize = (values: EutrophicationValues): EutrophicationState => {
    const waterBody = isWaterBody(values.waterBody) ? values.waterBody : defaultEutrophicationValues.waterBody;
    const nutrientInput = values.nutrientInput === "typical nutrient input" || values.nutrientInput === "excess nutrient input"
      ? values.nutrientInput
      : defaultEutrophicationValues.nutrientInput;
    const stageNumber = Number(values.stageIndex);
    return {
      waterBody, nutrientInput,
      stageIndex: Number.isFinite(stageNumber)
        ? Math.max(0, Math.min(eutrophicationStages.length - 1, Math.round(stageNumber)))
        : defaultEutrophicationValues.stageIndex,
    };
  };
  calculateEutrophicationState = values => {
    const normalized = normalize(values);
    const excess = normalized.nutrientInput === "excess nutrient input";
    return {
      ...normalized, stage: eutrophicationStages[normalized.stageIndex], excess, runoffCount: excess ? 8 : 3,
      bloomStrength: normalized.stageIndex >= 1 ? excess ? 1 : 0.28 : 0,
      lightStrength: normalized.stageIndex >= 1 && excess ? 0.25 : 0.9,
      detritusCount: normalized.stageIndex >= 2 ? excess ? 13 : 4 : 0,
      oxygenLevel: normalized.stageIndex >= 3 ? excess ? "low" : "adequate" : "high",
      fishState: normalized.stageIndex >= 3 && excess ? "stressed" : normalized.stageIndex >= 2 && excess ? "leaving" : "healthy",
    };
  };
}

export {
  initializeEutrophicationManifest as a, initializeEutrophicationModel as i, eutrophicationStages as n,
  eutrophicationManifest as o, calculateEutrophicationState as r, defaultEutrophicationValues as t,
};
