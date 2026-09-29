// Diminishing-marginal-utility learning-block model.
// Release chunk: app/webview/assets/model-fa57376c055c.js.

import "@rchunk/rolldown-runtime";

interface UtilityState { quantity: number; marginalUtility: number; totalUtility: number; totals: number[] }

let marginalUtilities: number[];
let totalUtilities: number[];
let calculateUtility: (quantity: number) => UtilityState;
let initialized = false;

function initializeDiminishingMarginalUtilityModel(): void {
  if (initialized) return;
  initialized = true;
  marginalUtilities = [24, 19, 15, 11, 8, 6, 4, 0, -4];
  totalUtilities = marginalUtilities.reduce<number[]>((totals, marginalUtility) => {
    totals.push(totals[totals.length - 1] + marginalUtility);
    return totals;
  }, [0]);
  calculateUtility = quantity => {
    const normalizedQuantity = Number.isFinite(quantity)
      ? Math.min(marginalUtilities.length, Math.max(0, Math.round(quantity)))
      : 0;
    return {
      quantity: normalizedQuantity,
      marginalUtility: normalizedQuantity === 0 ? 0 : marginalUtilities[normalizedQuantity - 1],
      totalUtility: totalUtilities[normalizedQuantity],
      totals: totalUtilities,
    };
  };
}

export { calculateUtility as n, initializeDiminishingMarginalUtilityModel as r, marginalUtilities as t };
