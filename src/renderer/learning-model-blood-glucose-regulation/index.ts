// Insulin/glucagon negative-feedback learning model.
import "@rchunk/rolldown-runtime";

type BloodGlucoseCondition = "high" | "low";
type BloodGlucoseStage = "glucose_changes" | "pancreas_responds" | "targets_act" | "glucose_returns";
interface BloodGlucoseValues { initial_condition?: string; stageIndex?: number }

let bloodGlucoseManifest: { type: string; version: number; thumbnailAssetKey: string; parameters: { initial_condition: { kind: "enum"; defaultValue: string; allowedValues: string[] } } };
let bloodGlucoseConditions: BloodGlucoseCondition[];
let bloodGlucoseStageRange: { min: number; max: number; step: number; defaultValue: number };
let defaultBloodGlucoseCondition: BloodGlucoseCondition;
let normalizeBloodGlucoseState: (values: BloodGlucoseValues) => { initial_condition: BloodGlucoseCondition; stageIndex: number };
let manifestInitialized = false;
let modelInitialized = false;

function initializeBloodGlucoseManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  bloodGlucoseManifest = { type: "BLOOD_GLUCOSE_REGULATION", version: 3, thumbnailAssetKey: "blood-glucose-regulation-v1", parameters: { initial_condition: { kind: "enum", defaultValue: "high", allowedValues: ["high", "low"] } } };
}

function initializeBloodGlucoseModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeBloodGlucoseManifest();
  bloodGlucoseConditions = ["high", "low"];
  const stages: BloodGlucoseStage[] = ["glucose_changes", "pancreas_responds", "targets_act", "glucose_returns"];
  bloodGlucoseStageRange = { min: 0, max: stages.length - 1, step: 1, defaultValue: 0 };
  const isCondition = (value: string | undefined): value is BloodGlucoseCondition => bloodGlucoseConditions.some(condition => condition === value);
  const manifestDefault = bloodGlucoseManifest.parameters.initial_condition.defaultValue;
  if (!isCondition(manifestDefault)) throw new Error("Invalid initial blood glucose condition in type manifest");
  defaultBloodGlucoseCondition = manifestDefault;
  normalizeBloodGlucoseState = values => {
    const candidate = typeof values.stageIndex === "number" && Number.isFinite(values.stageIndex) ? Math.round(values.stageIndex) : bloodGlucoseStageRange.defaultValue;
    return { initial_condition: isCondition(values.initial_condition) ? values.initial_condition : defaultBloodGlucoseCondition, stageIndex: Math.min(bloodGlucoseStageRange.max, Math.max(bloodGlucoseStageRange.min, candidate)) };
  };
}

export { normalizeBloodGlucoseState as a, initializeBloodGlucoseModel as i, bloodGlucoseConditions as n, initializeBloodGlucoseManifest as o, bloodGlucoseStageRange as r, bloodGlucoseManifest as s, defaultBloodGlucoseCondition as t };
