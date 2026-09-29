// Momentum formula metadata. Release chunk: type-5e07bdb97091.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "MOMENTUM";
  version: 1;
  thumbnailAssetKey: "momentum-v1";
  canonicalFormula: "p = mv";
  canonicalFormulaAliases: string[];
  parameters: {
    m1: { kind: "number"; defaultValue: 4; min: 0.01; max: 10000 };
    m2: { kind: "number"; defaultValue: 4; min: 0.01; max: 10000 };
    v: { kind: "number"; defaultValue: 6; min: 0; max: 10000 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "MOMENTUM",
    version: 1,
    thumbnailAssetKey: "momentum-v1",
    canonicalFormula: "p = mv",
    canonicalFormulaAliases: ["v = p/m", "p=vm", "mv=p", "vm=p", "m=p/v"],
    parameters: {
      m1: { kind: "number", defaultValue: 4, min: 0.01, max: 10000 },
      m2: { kind: "number", defaultValue: 4, min: 0.01, max: 10000 },
      v: { kind: "number", defaultValue: 6, min: 0, max: 10000 },
    },
  };
}
export { specification as n, initialize as t };
