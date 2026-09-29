// Blood-pressure negative-feedback learning model.
// Release chunk: app/webview/assets/model-e9d53ce0f19d.js.
import "@rchunk/rolldown-runtime";

type PressureCondition = "low" | "normal" | "high";
type RegulationStage = "disturbance" | "sensing" | "integration" | "effector response" | "restoration";
interface RegulationValues { initial_pressure_condition?: string | null; stageIndex?: number | null }
interface RegulationState { initial_pressure_condition: PressureCondition; stageIndex: number }
interface TypeManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: { initial_pressure_condition: { kind: "enum"; defaultValue: PressureCondition; allowedValues: PressureCondition[] } };
}

let bloodPressureRegulationManifest: TypeManifest;
let pressureConditions: PressureCondition[];
let regulationStages: RegulationStage[];
let stageRange: { min: number; max: number; step: number; defaultValue: number };
let defaultPressureCondition: PressureCondition;
let normalizeRegulationState: (values: RegulationValues) => RegulationState;
let setPressureCondition: (values: RegulationValues, condition: PressureCondition) => RegulationState;
let setRegulationStage: (values: RegulationValues, stageIndex: number) => RegulationState;
let manifestInitialized = false;
let modelInitialized = false;

function initializeBloodPressureRegulationManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  bloodPressureRegulationManifest = {
    type: "BLOOD_PRESSURE_REGULATION", version: 2, thumbnailAssetKey: "blood-pressure-regulation-v1",
    parameters: {
      initial_pressure_condition: { kind: "enum", defaultValue: "high", allowedValues: ["low", "normal", "high"] },
    },
  };
}

function initializeBloodPressureRegulationModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeBloodPressureRegulationManifest();
  pressureConditions = ["low", "normal", "high"];
  regulationStages = ["disturbance", "sensing", "integration", "effector response", "restoration"];
  stageRange = { min: 0, max: regulationStages.length - 1, step: 1, defaultValue: 4 };
  const isPressureCondition = (value: unknown): value is PressureCondition =>
    pressureConditions.some(condition => condition === value);
  const manifestDefault = bloodPressureRegulationManifest.parameters.initial_pressure_condition.defaultValue;
  if (!isPressureCondition(manifestDefault)) throw Error("Invalid initial pressure condition in type manifest");
  defaultPressureCondition = manifestDefault;
  normalizeRegulationState = values => {
    const stageIndex = typeof values.stageIndex === "number" && Number.isFinite(values.stageIndex)
      ? Math.round(values.stageIndex)
      : stageRange.defaultValue;
    return {
      initial_pressure_condition: isPressureCondition(values.initial_pressure_condition)
        ? values.initial_pressure_condition
        : defaultPressureCondition,
      stageIndex: Math.min(stageRange.max, Math.max(stageRange.min, stageIndex)),
    };
  };
  setPressureCondition = (values, condition) => ({ ...normalizeRegulationState(values), initial_pressure_condition: condition });
  setRegulationStage = (values, stageIndex) => normalizeRegulationState({ ...values, stageIndex });
}

export {
  initializeBloodPressureRegulationModel as a, setPressureCondition as c, pressureConditions as i,
  initializeBloodPressureRegulationManifest as l, stageRange as n, normalizeRegulationState as o,
  defaultPressureCondition as r, setRegulationStage as s, regulationStages as t, bloodPressureRegulationManifest as u,
};
