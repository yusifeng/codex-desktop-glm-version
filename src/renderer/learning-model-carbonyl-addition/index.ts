// Carbonyl nucleophilic-addition learning-block model.
// Release chunk: app/webview/assets/model-3074940ffbb8.js.

import "@rchunk/rolldown-runtime";

type CarbonylSubstrateClass = "aldehyde" | "ketone";
interface CarbonylAdditionValues { substrate_class?: unknown; stage?: number }
interface CarbonylAdditionState { substrateClass: CarbonylSubstrateClass; stage: number }

let substrateClasses: CarbonylSubstrateClass[];
let normalizeCarbonylAdditionState: (values: CarbonylAdditionValues) => CarbonylAdditionState;
let initialized = false;

function initializeCarbonylAdditionModel(): void {
  if (initialized) return;
  initialized = true;
  substrateClasses = ["aldehyde", "ketone"];
  normalizeCarbonylAdditionState = values => ({
    substrateClass: substrateClasses.includes(values.substrate_class as CarbonylSubstrateClass)
      ? values.substrate_class as CarbonylSubstrateClass
      : "aldehyde",
    stage: Number.isFinite(values.stage)
      ? Math.max(0, Math.min(3, Math.round(values.stage as number)))
      : 0,
  });
}

export { initializeCarbonylAdditionModel as n, normalizeCarbonylAdditionState as r, substrateClasses as t };
