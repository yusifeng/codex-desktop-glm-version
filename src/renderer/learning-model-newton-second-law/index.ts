// Newton's second law specification. Release chunk: type-b1c6d85108ef.js.
import "@rchunk/rolldown-runtime";

interface Specification {
  type: "NEWTON_SECOND_LAW";
  version: 2;
  thumbnailAssetKey: "newton-second-law-v1";
  canonicalFormula: "F_{\\mathrm{net}} = ma";
  canonicalFormulaAliases: ["F=ma", "a=F/m", "m=F/a"];
  parameters: {
    netForceNewtons: { kind: "number"; defaultValue: 8; min: 2; max: 12 };
    massKilograms: { kind: "number"; defaultValue: 2; min: 1; max: 4 };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "NEWTON_SECOND_LAW",
    version: 2,
    thumbnailAssetKey: "newton-second-law-v1",
    canonicalFormula: "F_{\\mathrm{net}} = ma",
    canonicalFormulaAliases: ["F=ma", "a=F/m", "m=F/a"],
    parameters: {
      netForceNewtons: { kind: "number", defaultValue: 8, min: 2, max: 12 },
      massKilograms: { kind: "number", defaultValue: 2, min: 1, max: 4 },
    },
  };
}
export { specification as n, initializeSpecification as t };
