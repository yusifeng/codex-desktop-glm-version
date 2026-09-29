// Receiver-operating-characteristic metadata. Release chunk: type-f95346c939a7.js.
import "@rchunk/rolldown-runtime";

interface RocCurveSpecification {
  type: "ROC_CURVE";
  version: 2;
  thumbnailAssetKey: "roc-curve-v1";
  parameters: {
    auroc: { kind: "number"; defaultValue: 0.75; min: 0.5; max: 0.95 };
    threshold: { kind: "number"; defaultValue: 0.5; min: 0; max: 1 };
  };
}

let rocCurveSpecification: RocCurveSpecification;
let initialized = false;
function initializeRocCurveSpecification(): void {
  if (initialized) return;
  initialized = true;
  rocCurveSpecification = {
    type: "ROC_CURVE",
    version: 2,
    thumbnailAssetKey: "roc-curve-v1",
    parameters: {
      auroc: { kind: "number", defaultValue: 0.75, min: 0.5, max: 0.95 },
      threshold: { kind: "number", defaultValue: 0.5, min: 0, max: 1 },
    },
  };
}

export { rocCurveSpecification as n, initializeRocCurveSpecification as t };
