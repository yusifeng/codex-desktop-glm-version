// Inclined-plane acceleration controls. Release chunk: type-3ebb2891016a.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "INCLINED_PLANE_ACCELERATION";
  version: 1;
  thumbnailAssetKey: "inclined-plane-acceleration-v1";
  canonicalFormula: string;
  parameters: {
    planeAngleDegrees: { kind: "number"; defaultValue: 30; min: 15; max: 45 };
    boxMassKilograms: { kind: "number"; defaultValue: 4; min: 2; max: 6 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "INCLINED_PLANE_ACCELERATION",
    version: 1,
    thumbnailAssetKey: "inclined-plane-acceleration-v1",
    canonicalFormula: "a = g \\sin \\theta",
    parameters: {
      planeAngleDegrees: { kind: "number", defaultValue: 30, min: 15, max: 45 },
      boxMassKilograms: { kind: "number", defaultValue: 4, min: 2, max: 6 },
    },
  };
}
export { specification as n, initialize as t };
