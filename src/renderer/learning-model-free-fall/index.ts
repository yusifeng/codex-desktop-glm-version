// Free-fall initial-condition controls. Release chunk: type-6f5ca4a9b344.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "FREE_FALL";
  version: 1;
  thumbnailAssetKey: "free-fall-v1";
  canonicalFormula: string;
  parameters: {
    initialHeightMeters: { kind: "number"; defaultValue: 14; min: 4; max: 18 };
    initialVelocityMetersPerSecond: {
      kind: "number";
      defaultValue: 0;
      min: -8;
      max: 8;
    };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "FREE_FALL",
    version: 1,
    thumbnailAssetKey: "free-fall-v1",
    canonicalFormula: "h(t) = h_0 + v_0t - \\frac{1}{2}gt^2",
    parameters: {
      initialHeightMeters: {
        kind: "number",
        defaultValue: 14,
        min: 4,
        max: 18,
      },
      initialVelocityMetersPerSecond: {
        kind: "number",
        defaultValue: 0,
        min: -8,
        max: 8,
      },
    },
  };
}
export { specification as n, initialize as t };
