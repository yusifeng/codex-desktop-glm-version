// Saturated-solution learning-block mass model.
// Release chunk: app/webview/assets/model-e852ad5f07c0.js.

import "@rchunk/rolldown-runtime";

interface SaturatedSolutionValues { soluteAddedGrams?: number }
interface SaturatedSolutionState { addedGrams: number; dissolvedGrams: number; excessGrams: number; isSaturated: boolean }

let calculateSaturatedSolution: (values: SaturatedSolutionValues) => SaturatedSolutionState;
let initialized = false;

function initializeSaturatedSolutionModel(): void {
  if (initialized) return;
  initialized = true;
  calculateSaturatedSolution = values => {
    const addedGrams = Number.isFinite(values.soluteAddedGrams)
      ? Math.min(Math.max(values.soluteAddedGrams as number, 0), 72)
      : 48;
    const dissolvedGrams = Math.min(addedGrams, 36);
    return {
      addedGrams,
      dissolvedGrams,
      excessGrams: addedGrams - dissolvedGrams,
      isSaturated: addedGrams >= 36,
    };
  };
}

export { initializeSaturatedSolutionModel as n, calculateSaturatedSolution as t };
