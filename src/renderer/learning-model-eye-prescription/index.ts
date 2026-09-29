// Eye-prescription controls. Release chunk: type-ba89e7f5dcc4.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "EYE_PRESCRIPTION";
  version: 1;
  thumbnailAssetKey: "eye-prescription-v1";
  parameters: {
    sphereDiopters: { kind: "number"; defaultValue: 2.5; min: -10; max: 10 };
    cylinderDiopters: { kind: "number"; defaultValue: -0.5; min: -6; max: 6 };
    axisDegrees: { kind: "number"; defaultValue: 135; min: 0; max: 180 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "EYE_PRESCRIPTION",
    version: 1,
    thumbnailAssetKey: "eye-prescription-v1",
    parameters: {
      sphereDiopters: { kind: "number", defaultValue: 2.5, min: -10, max: 10 },
      cylinderDiopters: { kind: "number", defaultValue: -0.5, min: -6, max: 6 },
      axisDegrees: { kind: "number", defaultValue: 135, min: 0, max: 180 },
    },
  };
}
export { specification as n, initialize as t };
