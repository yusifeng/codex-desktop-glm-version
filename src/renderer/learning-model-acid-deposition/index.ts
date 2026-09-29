// Acid deposition learning-block stage model.
// Release chunk: app/webview/assets/model-7840deb060fa.js.

import "@rchunk/rolldown-runtime";

interface AcidDepositionValues { stageIndex?: number }
interface AcidDepositionState { stageIndex: number }
interface StageBounds { min: number; max: number; defaultValue: number }

let stageBounds: StageBounds;
let normalizeAcidDepositionState: (values: AcidDepositionValues) => AcidDepositionState;
let initialized = false;

function initializeAcidDepositionModel(): void {
  if (initialized) return;
  initialized = true;
  stageBounds = { min: 0, max: 3, defaultValue: 0 };
  normalizeAcidDepositionState = values => {
    const candidate = Number.isFinite(values.stageIndex)
      ? Math.round(values.stageIndex as number)
      : stageBounds.defaultValue;
    return { stageIndex: Math.min(stageBounds.max, Math.max(stageBounds.min, candidate)) };
  };
}

export { initializeAcidDepositionModel as n, normalizeAcidDepositionState as r, stageBounds as t };
