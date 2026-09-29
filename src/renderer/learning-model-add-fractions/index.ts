// Fraction-addition operand metadata. Release chunk: type-86695f24afe6.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "ADD_FRACTIONS";
  version: 2;
  thumbnailAssetKey: "add-fractions-v1";
  parameters: {
    firstNumerator: { kind: "integer"; defaultValue: 1; min: 1; max: 4 };
    firstDenominator: { kind: "integer"; defaultValue: 3; min: 2; max: 6 };
    secondNumerator: { kind: "integer"; defaultValue: 3; min: 1; max: 4 };
    secondDenominator: { kind: "integer"; defaultValue: 6; min: 2; max: 6 };
  };
}
let specification: Specification;
let initialized = false;
function initialize(): void {
  if (initialized) return;
  initialized = true;
  specification = {
    type: "ADD_FRACTIONS",
    version: 2,
    thumbnailAssetKey: "add-fractions-v1",
    parameters: {
      firstNumerator: { kind: "integer", defaultValue: 1, min: 1, max: 4 },
      firstDenominator: { kind: "integer", defaultValue: 3, min: 2, max: 6 },
      secondNumerator: { kind: "integer", defaultValue: 3, min: 1, max: 4 },
      secondDenominator: { kind: "integer", defaultValue: 6, min: 2, max: 6 },
    },
  };
}
export { specification as n, initialize as t };
