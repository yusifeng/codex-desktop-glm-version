// Generic negative-feedback-loop learning model. Release chunk: model-66d4b6ae060b.js.
import "@rchunk/rolldown-runtime";

type FeedbackExample = "body_temperature" | "blood_glucose" | "thermostat";
type InitialDeviation = "above" | "below";
type FeedbackStage = "sensing" | "response" | "return";
interface FeedbackValues { example?: string | null; initial_deviation?: string | null; stageIndex?: number | null }
interface FeedbackState { example: FeedbackExample; initial_deviation: InitialDeviation; stageIndex: number }
interface FeedbackManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: {
    example: { kind: "enum"; defaultValue: FeedbackExample; allowedValues: FeedbackExample[] };
    initial_deviation: { kind: "enum"; defaultValue: InitialDeviation; allowedValues: InitialDeviation[] };
  };
}

let negativeFeedbackManifest: FeedbackManifest;
let stageControl: { min: number; max: number; step: number; defaultValue: number };
let feedbackStages: FeedbackStage[];
let deviations: InitialDeviation[];
let defaultExample: FeedbackExample;
let defaultDeviation: InitialDeviation;
let normalizeFeedbackState: (values: FeedbackValues) => FeedbackState;
let setFeedbackDeviation: (values: FeedbackValues, deviation: InitialDeviation) => FeedbackState;
let setFeedbackStage: (values: FeedbackValues, stageIndex: number) => FeedbackState;
let manifestInitialized = false;
let modelInitialized = false;

function initializeNegativeFeedbackManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  negativeFeedbackManifest = {
    type: "NEGATIVE_FEEDBACK_LOOP", version: 1, thumbnailAssetKey: "negative-feedback-loop-v1",
    parameters: {
      example: { kind: "enum", defaultValue: "body_temperature", allowedValues: ["body_temperature", "blood_glucose", "thermostat"] },
      initial_deviation: { kind: "enum", defaultValue: "above", allowedValues: ["above", "below"] },
    },
  };
}

function initializeNegativeFeedbackLoopModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeNegativeFeedbackManifest();
  const examples: FeedbackExample[] = ["body_temperature", "blood_glucose", "thermostat"];
  deviations = ["above", "below"];
  feedbackStages = ["sensing", "response", "return"];
  stageControl = { min: 0, max: feedbackStages.length - 1, step: 1, defaultValue: 0 };
  const isExample = (value: unknown): value is FeedbackExample => examples.some(example => example === value);
  const isDeviation = (value: unknown): value is InitialDeviation => deviations.some(deviation => deviation === value);
  const manifestExample = negativeFeedbackManifest.parameters.example.defaultValue;
  const manifestDeviation = negativeFeedbackManifest.parameters.initial_deviation.defaultValue;
  if (!isExample(manifestExample) || !isDeviation(manifestDeviation)) throw Error("Invalid negative feedback defaults in type manifest");
  defaultExample = manifestExample;
  defaultDeviation = manifestDeviation;
  normalizeFeedbackState = values => {
    const candidateStage = typeof values.stageIndex === "number" && Number.isFinite(values.stageIndex)
      ? Math.round(values.stageIndex)
      : stageControl.defaultValue;
    return {
      example: isExample(values.example) ? values.example : defaultExample,
      initial_deviation: isDeviation(values.initial_deviation) ? values.initial_deviation : defaultDeviation,
      stageIndex: Math.min(stageControl.max, Math.max(stageControl.min, candidateStage)),
    };
  };
  setFeedbackDeviation = (values, deviation) => ({ ...normalizeFeedbackState(values), initial_deviation: deviation, stageIndex: stageControl.defaultValue });
  setFeedbackStage = (values, stageIndex) => normalizeFeedbackState({ ...values, stageIndex });
}

export {
  stageControl as a, setFeedbackDeviation as c, negativeFeedbackManifest as d, feedbackStages as i,
  setFeedbackStage as l, defaultExample as n, initializeNegativeFeedbackLoopModel as o, deviations as r,
  normalizeFeedbackState as s, defaultDeviation as t, initializeNegativeFeedbackManifest as u,
};
