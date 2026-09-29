// Mediation direct/indirect-effect controls. Release chunk: type-e52ae9a5f679.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "MEDIATION_INDIRECT_EFFECT";
  version: 1;
  thumbnailAssetKey: "mediation-indirect-effect-v1";
  canonicalFormula: string;
  parameters: {
    a: { kind: "number"; defaultValue: 0.6; min: -1; max: 1 };
    b: { kind: "number"; defaultValue: 0.5; min: -1; max: 1 };
    directEffect: { kind: "number"; defaultValue: 0.2; min: -1; max: 1 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "MEDIATION_INDIRECT_EFFECT",
    version: 1,
    thumbnailAssetKey: "mediation-indirect-effect-v1",
    canonicalFormula: "c = c^{\\prime} + a \\times b",
    parameters: {
      a: { kind: "number", defaultValue: 0.6, min: -1, max: 1 },
      b: { kind: "number", defaultValue: 0.5, min: -1, max: 1 },
      directEffect: { kind: "number", defaultValue: 0.2, min: -1, max: 1 },
    },
  };
}
export { specification as n, initialize as t };
