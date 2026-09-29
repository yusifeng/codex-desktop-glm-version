// Fixed-ratio scaling metadata. Release chunk: type-4a4927d40e3e.js.
import "@rchunk/rolldown-runtime";

interface FixedRatioScalingSpecification {
  type: "FIXED_RATIO_SCALING";
  version: 2;
  thumbnailAssetKey: "fixed-ratio-scaling-v1";
  parameters: {
    scaleFactor: { kind: "number"; defaultValue: 1.5; min: 0.5; max: 2 };
  };
}

let fixedRatioScalingSpecification: FixedRatioScalingSpecification;
let initialized = false;
function initializeFixedRatioScalingSpecification(): void {
  if (initialized) return;
  initialized = true;
  fixedRatioScalingSpecification = {
    type: "FIXED_RATIO_SCALING",
    version: 2,
    thumbnailAssetKey: "fixed-ratio-scaling-v1",
    parameters: {
      scaleFactor: { kind: "number", defaultValue: 1.5, min: 0.5, max: 2 },
    },
  };
}

export {
  fixedRatioScalingSpecification as n,
  initializeFixedRatioScalingSpecification as t,
};
