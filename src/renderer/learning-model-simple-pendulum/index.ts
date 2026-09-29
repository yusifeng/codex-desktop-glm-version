// Simple-pendulum controls. Release chunk: type-fff8bf6df8e9.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "SIMPLE_PENDULUM";
  version: 1;
  thumbnailAssetKey: "simple-pendulum-v1";
  canonicalFormula: string;
  parameters: {
    lengthMeters: { kind: "number"; defaultValue: 1.2; min: 0.5; max: 2 };
    startingAngleDegrees: { kind: "number"; defaultValue: 35; min: 5; max: 60 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "SIMPLE_PENDULUM",
    version: 1,
    thumbnailAssetKey: "simple-pendulum-v1",
    canonicalFormula: "T \\approx 2\\pi\\sqrt{\\frac{L}{g}}",
    parameters: {
      lengthMeters: { kind: "number", defaultValue: 1.2, min: 0.5, max: 2 },
      startingAngleDegrees: {
        kind: "number",
        defaultValue: 35,
        min: 5,
        max: 60,
      },
    },
  };
}
export { specification as n, initialize as t };
