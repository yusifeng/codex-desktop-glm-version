// Integration-by-parts derivation stage model.
// Release chunk: app/webview/assets/model-4dfc962979f9.js.

import "@rchunk/rolldown-runtime";

interface IntegrationByPartsValues { stage?: unknown }
interface PresentationContext { presentationMode?: string }
interface IntegrationByPartsState { stage: number }
interface StageRange { min: number; max: number; step: number }

let stageRange: StageRange;
let stageCount: number;
let normalizeStage: (value: unknown) => number;
let normalizeIntegrationByPartsState: (values: IntegrationByPartsValues) => IntegrationByPartsState;
let initialIntegrationByPartsState: (values: IntegrationByPartsValues, context: PresentationContext) => IntegrationByPartsState;
let initialized = false;

function initializeIntegrationByPartsModel(): void {
  if (initialized) return;
  initialized = true;
  stageRange = { min: 0, max: 4, step: 1 };
  stageCount = stageRange.max - stageRange.min + 1;
  normalizeStage = value => {
    const candidate = typeof value === "number" ? value : Number.NaN;
    return Number.isFinite(candidate)
      ? Math.min(stageRange.max, Math.max(stageRange.min, Math.round(candidate)))
      : stageRange.min;
  };
  normalizeIntegrationByPartsState = values => ({
    stage: values.stage === undefined ? stageRange.min : normalizeStage(values.stage),
  });
  initialIntegrationByPartsState = (_values, context) => ({
    stage: context.presentationMode === "thumbnail" ? stageRange.max : stageRange.min,
  });
}

export { normalizeStage as a, initialIntegrationByPartsState as i, stageRange as n, normalizeIntegrationByPartsState as o, initializeIntegrationByPartsModel as r, stageCount as t };
