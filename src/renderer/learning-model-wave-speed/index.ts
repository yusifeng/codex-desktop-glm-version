// Wave speed specification. Release chunk: type-8e1db5391d62.js.
import "@rchunk/rolldown-runtime";

interface Specification {
  type: "WAVE_SPEED";
  version: 1;
  thumbnailAssetKey: "wave-speed-v1";
  canonicalFormula: "v = f\\lambda";
  canonicalFormulaAliases: [
    "\\nu = \\frac{c}{\\lambda}",
    "v = f lambda",
    "v=flambda",
    "v=lambdaf",
    "flambda=v",
    "lambdaf=v",
    "f=v/lambda",
    "lambda=v/f",
  ];
  parameters: {
    frequency: { kind: "number"; defaultValue: 2; min: 0.1; max: 20_000 };
    wavelength: { kind: "number"; defaultValue: 3; min: 0.1; max: 10_000 };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "WAVE_SPEED",
    version: 1,
    thumbnailAssetKey: "wave-speed-v1",
    canonicalFormula: "v = f\\lambda",
    canonicalFormulaAliases: [
      "\\nu = \\frac{c}{\\lambda}",
      "v = f lambda",
      "v=flambda",
      "v=lambdaf",
      "flambda=v",
      "lambdaf=v",
      "f=v/lambda",
      "lambda=v/f",
    ],
    parameters: {
      frequency: { kind: "number", defaultValue: 2, min: 0.1, max: 20_000 },
      wavelength: { kind: "number", defaultValue: 3, min: 0.1, max: 10_000 },
    },
  };
}
export { specification as n, initializeSpecification as t };
