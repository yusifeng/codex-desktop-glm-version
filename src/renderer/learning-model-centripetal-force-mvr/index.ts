// Centripetal-force controls. Release chunk: type-3b03c35824de.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "CENTRIPETAL_FORCE_MVR";
  version: 2;
  thumbnailAssetKey: "centripetal-force-mvr-v1";
  canonicalFormula: string;
  parameters: {
    massKilograms: { kind: "number"; defaultValue: 2; min: 0.5; max: 5 };
    speedMetersPerSecond: { kind: "number"; defaultValue: 4; min: 0; max: 8 };
    radiusMeters: { kind: "number"; defaultValue: 2; min: 1; max: 5 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "CENTRIPETAL_FORCE_MVR",
    version: 2,
    thumbnailAssetKey: "centripetal-force-mvr-v1",
    canonicalFormula: "F_c = \\frac{mv^2}{r}",
    parameters: {
      massKilograms: { kind: "number", defaultValue: 2, min: 0.5, max: 5 },
      speedMetersPerSecond: { kind: "number", defaultValue: 4, min: 0, max: 8 },
      radiusMeters: { kind: "number", defaultValue: 2, min: 1, max: 5 },
    },
  };
}
export { specification as n, initialize as t };
