// Hypothalamic-pituitary-adrenal axis learning-block model.
// Release chunk: app/webview/assets/model-81531df3f2e2.js.

import "@rchunk/rolldown-runtime";

type HpaAxisStep = "stressor" | "crh" | "acth" | "cortisol" | "feedback";
interface HpaAxisValues { stepIndex?: number }
interface HpaAxisState { stepIndex: number }
interface StepRange { min: number; max: number; step: number; defaultValue: number }

let hpaAxisSteps: HpaAxisStep[];
let stepRange: StepRange;
let normalizeHpaAxisState: (values: HpaAxisValues) => HpaAxisState;
let getHpaAxisStep: (values: HpaAxisValues) => HpaAxisStep;
let initialized = false;

function initializeHpaAxisModel(): void {
  if (initialized) return;
  initialized = true;
  hpaAxisSteps = ["stressor", "crh", "acth", "cortisol", "feedback"];
  stepRange = { min: 0, max: hpaAxisSteps.length - 1, step: 1, defaultValue: 0 };
  normalizeHpaAxisState = values => {
    const candidate = typeof values.stepIndex === "number" && Number.isFinite(values.stepIndex)
      ? Math.round(values.stepIndex)
      : stepRange.defaultValue;
    return { stepIndex: Math.min(Math.max(candidate, stepRange.min), stepRange.max) };
  };
  getHpaAxisStep = values => hpaAxisSteps[normalizeHpaAxisState(values).stepIndex];
}

export { normalizeHpaAxisState as a, initializeHpaAxisModel as i, stepRange as n, getHpaAxisStep as r, hpaAxisSteps as t };
