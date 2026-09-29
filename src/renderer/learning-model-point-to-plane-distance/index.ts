// Point-to-plane distance controls. Release chunk: type-96ed8dbb8a85.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "POINT_TO_PLANE_DISTANCE";
  version: 2;
  thumbnailAssetKey: "point-to-plane-distance-v1";
  canonicalFormula: "d = PH";
  parameters: {
    pointX: { kind: "number"; defaultValue: 1.5; min: -3; max: 3 };
    pointY: { kind: "number"; defaultValue: 4; min: 2; max: 5.5 };
    planeAngleDegrees: { kind: "number"; defaultValue: -10; min: -25; max: 25 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "POINT_TO_PLANE_DISTANCE",
    version: 2,
    thumbnailAssetKey: "point-to-plane-distance-v1",
    canonicalFormula: "d = PH",
    parameters: {
      pointX: { kind: "number", defaultValue: 1.5, min: -3, max: 3 },
      pointY: { kind: "number", defaultValue: 4, min: 2, max: 5.5 },
      planeAngleDegrees: {
        kind: "number",
        defaultValue: -10,
        min: -25,
        max: 25,
      },
    },
  };
}
export { specification as n, initialize as t };
