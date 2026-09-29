// Ideal-gas PV=nRT specification. Release chunk: type-4bab13b66760.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "PV_NRT_EQUATION";
  version: 2;
  thumbnailAssetKey: "pvnrt-v1";
  canonicalFormula: "PV = nRT";
  canonicalFormulaAliases: string[];
  parameters: {
    P: NumberParameter;
    V: NumberParameter;
    n: NumberParameter;
    T: NumberParameter;
    solveFor: {
      kind: "enum";
      defaultValue: "P";
      allowedValues: ["P", "V", "n", "T"];
    };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "PV_NRT_EQUATION",
    version: 2,
    thumbnailAssetKey: "pvnrt-v1",
    canonicalFormula: "PV = nRT",
    canonicalFormulaAliases: [
      "P V = n R T",
      "P = nRT / V",
      "P = \\frac{nRT}{V}",
      "V = nRT / P",
      "V = \\frac{nRT}{P}",
      "n = PV / RT",
      "n = \\frac{PV}{RT}",
      "T = PV / nR",
      "T = \\frac{PV}{nR}",
      "R = PV / nT",
      "R = \\frac{PV}{nT}",
    ],
    parameters: {
      P: { kind: "number", defaultValue: 1, min: 0.01, max: 100 },
      V: { kind: "number", defaultValue: 24, min: 0.01, max: 10_000 },
      n: { kind: "number", defaultValue: 1, min: 0.01, max: 1_000 },
      T: { kind: "number", defaultValue: 298, min: 1, max: 5_000 },
      solveFor: {
        kind: "enum",
        defaultValue: "P",
        allowedValues: ["P", "V", "n", "T"],
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
