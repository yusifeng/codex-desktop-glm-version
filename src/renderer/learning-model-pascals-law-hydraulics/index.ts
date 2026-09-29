// Pascal's law hydraulics specification. Release chunk: type-d4e64b7c7369.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "PASCALS_LAW_HYDRAULICS";
  version: 1;
  thumbnailAssetKey: "pascals-law-hydraulics-v2";
  canonicalFormula: "p = \\frac{F}{A}";
  parameters: {
    inputForceNewtons: NumberParameter;
    inputAreaSquareCentimeters: NumberParameter;
    outputAreaSquareCentimeters: NumberParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "PASCALS_LAW_HYDRAULICS",
    version: 1,
    thumbnailAssetKey: "pascals-law-hydraulics-v2",
    canonicalFormula: "p = \\frac{F}{A}",
    parameters: {
      inputForceNewtons: {
        kind: "number",
        defaultValue: 100,
        min: 20,
        max: 200,
      },
      inputAreaSquareCentimeters: {
        kind: "number",
        defaultValue: 10,
        min: 5,
        max: 25,
      },
      outputAreaSquareCentimeters: {
        kind: "number",
        defaultValue: 50,
        min: 25,
        max: 100,
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
