// Successive percent-change controls. Release chunk: type-dbcd7d4a7976.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "SUCCESSIVE_PERCENT_CHANGE";
  version: 1;
  thumbnailAssetKey: "successive-percent-change-v1";
  canonicalFormula: string;
  parameters: {
    firstChangePercent: {
      kind: "number";
      defaultValue: 50;
      min: -95;
      max: 100;
    };
    secondChangePercent: {
      kind: "number";
      defaultValue: -50;
      min: -100;
      max: 100;
    };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "SUCCESSIVE_PERCENT_CHANGE",
    version: 1,
    thumbnailAssetKey: "successive-percent-change-v1",
    canonicalFormula:
      "100\\left(1+\\frac{p_1}{100}\\right)\\left(1+\\frac{p_2}{100}\\right)",
    parameters: {
      firstChangePercent: {
        kind: "number",
        defaultValue: 50,
        min: -95,
        max: 100,
      },
      secondChangePercent: {
        kind: "number",
        defaultValue: -50,
        min: -100,
        max: 100,
      },
    },
  };
}
export { specification as n, initialize as t };
