// Calcium homeostasis feedback model involving PTH and calcitonin.
import "@rchunk/rolldown-runtime";

type CalciumCondition = "low" | "high";
type CalciumFeedbackStage = "sensing" | "hormones" | "targets" | "feedback";
interface CalciumFeedbackValues { calciumCondition?: string; stageIndex?: number }

let calciumFeedbackManifest: { type: string; version: number; thumbnailAssetKey: string; parameters: { calciumCondition: { kind: "enum"; defaultValue: string; allowedValues: string[] } } };
let calciumConditions: CalciumCondition[];
let calciumFeedbackStages: CalciumFeedbackStage[];
let stageRange: { min: number; max: number; step: number; defaultValue: number };
let defaultCalciumCondition: CalciumCondition;
let normalizeCalciumFeedbackState: (values: CalciumFeedbackValues) => { calciumCondition: CalciumCondition; stageIndex: number };
let manifestInitialized = false;
let modelInitialized = false;

function initializeCalciumFeedbackManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  calciumFeedbackManifest = { type: "CALCIUM_PTH_CALCITONIN_FEEDBACK", version: 2, thumbnailAssetKey: "calcium-pth-calcitonin-feedback-v1", parameters: { calciumCondition: { kind: "enum", defaultValue: "low", allowedValues: ["low", "high"] } } };
}

function initializeCalciumFeedbackModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeCalciumFeedbackManifest();
  calciumConditions = ["low", "high"];
  calciumFeedbackStages = ["sensing", "hormones", "targets", "feedback"];
  stageRange = { min: 0, max: calciumFeedbackStages.length - 1, step: 1, defaultValue: 0 };
  const isCondition = (value: string | undefined): value is CalciumCondition => calciumConditions.some(condition => condition === value);
  const manifestDefault = calciumFeedbackManifest.parameters.calciumCondition.defaultValue;
  if (!isCondition(manifestDefault)) throw new Error("Invalid default calcium condition in type manifest");
  defaultCalciumCondition = manifestDefault;
  normalizeCalciumFeedbackState = values => {
    const candidate = typeof values.stageIndex === "number" && Number.isFinite(values.stageIndex) ? Math.round(values.stageIndex) : stageRange.defaultValue;
    return { calciumCondition: isCondition(values.calciumCondition) ? values.calciumCondition : defaultCalciumCondition, stageIndex: Math.min(Math.max(candidate, stageRange.min), stageRange.max) };
  };
}

export { initializeCalciumFeedbackModel as a, calciumFeedbackManifest as c, defaultCalciumCondition as i, calciumFeedbackStages as n, normalizeCalciumFeedbackState as o, stageRange as r, initializeCalciumFeedbackManifest as s, calciumConditions as t };
