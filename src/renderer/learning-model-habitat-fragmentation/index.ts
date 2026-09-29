// Habitat-fragmentation learning-block model.
// Release chunk: app/webview/assets/model-b2437ad8584d.js.

import "@rchunk/rolldown-runtime";

interface HabitatFragmentationValues { stage?: unknown; corridor?: unknown }
interface HabitatFragmentationState { stage: number; corridor: boolean }
interface HabitatFragmentationMetrics extends HabitatFragmentationState { connected: boolean; patchCount: number }

let defaultHabitatFragmentationState: HabitatFragmentationState;
let normalizeHabitatFragmentationState: (values: HabitatFragmentationValues) => HabitatFragmentationState;
let calculateHabitatFragmentationMetrics: (values: HabitatFragmentationValues) => HabitatFragmentationMetrics;
let initialized = false;

function initializeHabitatFragmentationModel(): void {
  if (initialized) return;
  initialized = true;
  defaultHabitatFragmentationState = { stage: 0, corridor: false };
  normalizeHabitatFragmentationState = values => {
    const parsedStage = Number(values.stage);
    const roundedStage = Number.isFinite(parsedStage) ? Math.round(parsedStage) : 0;
    return {
      stage: roundedStage <= 0 ? 0 : roundedStage >= 2 ? 2 : 1,
      corridor: values.corridor === true,
    };
  };
  calculateHabitatFragmentationMetrics = values => {
    const state = normalizeHabitatFragmentationState(values);
    return {
      ...state,
      connected: state.stage === 0 || (state.stage === 2 && state.corridor),
      patchCount: state.stage === 0 ? 1 : state.stage === 1 ? 2 : 4,
    };
  };
}

export { normalizeHabitatFragmentationState as i, calculateHabitatFragmentationMetrics as n, initializeHabitatFragmentationModel as r, defaultHabitatFragmentationState as t };
