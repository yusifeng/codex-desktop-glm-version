// Accuracy-versus-precision target controls. Release chunk: type-c3de85d12da6.js.
import "@rchunk/rolldown-runtime";
type MeanPosition = "centered" | "offset";
type MeasurementSpread = "small" | "large";
interface Specification {
  type: "ACCURACY_VS_PRECISION_TARGETS";
  version: 1;
  thumbnailAssetKey: "accuracy-vs-precision-targets-v1";
  parameters: {
    meanPosition: {
      kind: "enum";
      defaultValue: MeanPosition;
      allowedValues: MeanPosition[];
    };
    measurementSpread: {
      kind: "enum";
      defaultValue: MeasurementSpread;
      allowedValues: MeasurementSpread[];
    };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "ACCURACY_VS_PRECISION_TARGETS",
    version: 1,
    thumbnailAssetKey: "accuracy-vs-precision-targets-v1",
    parameters: {
      meanPosition: {
        kind: "enum",
        defaultValue: "centered",
        allowedValues: ["centered", "offset"],
      },
      measurementSpread: {
        kind: "enum",
        defaultValue: "small",
        allowedValues: ["small", "large"],
      },
    },
  };
}
export { specification as n, initialize as t };
