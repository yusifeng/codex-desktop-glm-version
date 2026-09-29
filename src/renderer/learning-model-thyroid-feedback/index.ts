// Hypothalamic-pituitary-thyroid feedback learning-block model.
// Release chunk: app/webview/assets/model-e4734bd04660.js.

import "@rchunk/rolldown-runtime";

type ThyroidFeedbackStep = "trh-release" | "tsh-release" | "thyroid-output" | "restored-feedback";
interface ThyroidFeedbackValues { stepIndex?: number }
interface ThyroidFeedbackState { stepIndex: number }
interface StepRange { min: number; max: number; step: number; defaultValue: number }

let thyroidFeedbackSteps: ThyroidFeedbackStep[];
let stepRange: StepRange;
let clamp: (value: number, min: number, max: number) => number;
let normalizeThyroidFeedbackState: (values: ThyroidFeedbackValues) => ThyroidFeedbackState;
let getThyroidFeedbackStep: (values: ThyroidFeedbackValues) => ThyroidFeedbackStep;
let initialized = false;

function initializeThyroidFeedbackModel(): void {
  if (initialized) return;
  initialized = true;
  thyroidFeedbackSteps = ["trh-release", "tsh-release", "thyroid-output", "restored-feedback"];
  stepRange = { min: 0, max: thyroidFeedbackSteps.length - 1, step: 1, defaultValue: 0 };
  clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  normalizeThyroidFeedbackState = values => {
    const stepIndex = values.stepIndex;
    return {
      stepIndex: clamp(
        Math.round(typeof stepIndex === "number" && Number.isFinite(stepIndex) ? stepIndex : stepRange.defaultValue),
        stepRange.min,
        stepRange.max,
      ),
    };
  };
  getThyroidFeedbackStep = values => thyroidFeedbackSteps[normalizeThyroidFeedbackState(values).stepIndex];
}

export { normalizeThyroidFeedbackState as a, initializeThyroidFeedbackModel as i, stepRange as n, getThyroidFeedbackStep as r, thyroidFeedbackSteps as t };
