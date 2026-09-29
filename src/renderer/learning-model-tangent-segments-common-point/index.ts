// Equal tangent-segment geometry controls. Release chunk: type-32562c107c2d.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "TANGENT_SEGMENTS_COMMON_POINT";
  version: 1;
  thumbnailAssetKey: "tangent-segments-common-point-v1";
  canonicalFormula: "PA = PB";
  parameters: {
    radius: { kind: "number"; defaultValue: 3.5; min: 2.5; max: 4.5 };
    pointDistance: { kind: "number"; defaultValue: 7.2; min: 5.8; max: 7.2 };
    pointAngleDeg: { kind: "number"; defaultValue: 180; min: 145; max: 215 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "TANGENT_SEGMENTS_COMMON_POINT",
    version: 1,
    thumbnailAssetKey: "tangent-segments-common-point-v1",
    canonicalFormula: "PA = PB",
    parameters: {
      radius: { kind: "number", defaultValue: 3.5, min: 2.5, max: 4.5 },
      pointDistance: { kind: "number", defaultValue: 7.2, min: 5.8, max: 7.2 },
      pointAngleDeg: { kind: "number", defaultValue: 180, min: 145, max: 215 },
    },
  };
}
export { specification as n, initialize as t };
