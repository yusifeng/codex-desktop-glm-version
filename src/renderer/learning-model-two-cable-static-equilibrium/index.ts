// Two-cable static equilibrium specification. Release chunk: type-e01a2e47390f.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "TWO_CABLE_STATIC_EQUILIBRIUM";
  version: 1;
  thumbnailAssetKey: "two-cable-static-equilibrium-v1";
  parameters: {
    leftAngleDegrees: NumberParameter;
    rightAngleDegrees: NumberParameter;
    weightNewtons: NumberParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "TWO_CABLE_STATIC_EQUILIBRIUM",
    version: 1,
    thumbnailAssetKey: "two-cable-static-equilibrium-v1",
    parameters: {
      leftAngleDegrees: { kind: "number", defaultValue: 45, min: 10, max: 80 },
      rightAngleDegrees: { kind: "number", defaultValue: 45, min: 10, max: 80 },
      weightNewtons: { kind: "number", defaultValue: 200, min: 50, max: 500 },
    },
  };
}
export { specification as n, initializeSpecification as t };
