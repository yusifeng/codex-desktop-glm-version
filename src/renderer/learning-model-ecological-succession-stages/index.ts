// Primary and secondary ecological succession stages.
import "@rchunk/rolldown-runtime";

type SuccessionType = "primary" | "secondary";
interface SuccessionValues { successionType?: unknown; stageIndex?: unknown }
interface SuccessionStage { key: string; soil: number; biomass: number; structure: number; soilDepth: number }

const ecologicalSuccessionType = "ECOLOGICAL_SUCCESSION_STAGES";
const ecologicalSuccessionThumbnail = "ecological-succession-stages-v2";
const ecologicalSuccessionParameters = { successionType: { kind: "enum" as const, defaultValue: "primary" as SuccessionType, allowedValues: ["primary", "secondary"] as SuccessionType[] } };
const ecologicalSuccessionSpecification = { type: ecologicalSuccessionType, version: 1, thumbnailAssetKey: ecologicalSuccessionThumbnail, parameters: ecologicalSuccessionParameters };
const successionTypeParameter = ecologicalSuccessionSpecification.parameters.successionType;
const successionStageControl = { min: 0, max: 4, defaultValue: 0 };
const successionStageCount = successionStageControl.max - successionStageControl.min + 1;
const defaultSuccessionValues = { successionType: successionTypeParameter.defaultValue, stageIndex: successionStageControl.defaultValue };
const primaryStages: SuccessionStage[] = [
  { key: "start", soil: 0, biomass: 0, structure: 0, soilDepth: 0 }, { key: "pioneers", soil: 1, biomass: 1, structure: 1, soilDepth: 10 },
  { key: "grasses", soil: 2, biomass: 2, structure: 2, soilDepth: 20 }, { key: "shrubs", soil: 3, biomass: 3, structure: 3, soilDepth: 30 },
  { key: "trees", soil: 4, biomass: 4, structure: 4, soilDepth: 40 },
];
const secondaryStages: SuccessionStage[] = [
  { key: "start", soil: 3, biomass: 1, structure: 1, soilDepth: 30 }, { key: "pioneers", soil: 3, biomass: 1, structure: 2, soilDepth: 30 },
  { key: "grasses", soil: 3, biomass: 2, structure: 2, soilDepth: 30 }, { key: "shrubs", soil: 4, biomass: 3, structure: 3, soilDepth: 40 },
  { key: "trees", soil: 4, biomass: 4, structure: 4, soilDepth: 40 },
];
const stagesByType: Record<SuccessionType, SuccessionStage[]> = { primary: primaryStages, secondary: secondaryStages };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeSuccessionType = (value: unknown): SuccessionType => typeof value === "string" && successionTypeParameter.allowedValues.some((type) => type === value) ? value as SuccessionType : defaultSuccessionValues.successionType;
const normalizeStageIndex = (value: unknown): number => { const numericValue = typeof value === "number" ? value : Number.NaN; return clamp(Number.isFinite(numericValue) ? Math.round(numericValue) : defaultSuccessionValues.stageIndex, successionStageControl.min, successionStageControl.max); };
const normalizeSuccessionValues = (values: SuccessionValues) => ({ successionType: normalizeSuccessionType(values.successionType), stageIndex: normalizeStageIndex(values.stageIndex) });
const calculateSuccessionStage = (values: SuccessionValues) => { const normalized = normalizeSuccessionValues(values); return { values: normalized, stage: stagesByType[normalized.successionType][normalized.stageIndex - successionStageControl.min] }; };

function initializeEcologicalSuccessionSpecification(): void {}
function initializeEcologicalSuccessionModel(): void {}

export { initializeEcologicalSuccessionModel as a, ecologicalSuccessionSpecification as c, calculateSuccessionStage as i, successionStageCount as n, normalizeSuccessionValues as o, successionStageControl as r, initializeEcologicalSuccessionSpecification as s, defaultSuccessionValues as t };
