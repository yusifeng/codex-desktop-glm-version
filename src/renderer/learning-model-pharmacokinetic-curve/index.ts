// Pharmacokinetic curve specification. Release chunk: type-df7152d06cac.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "PHARMACOKINETIC_CURVE";
  version: 2;
  thumbnailAssetKey: "pharmacokinetic-curve-v1";
  parameters: {
    dose_mg: NumberParameter;
    elimination_half_life_hours: NumberParameter;
    minimum_effective_concentration: NumberParameter;
    minimum_toxic_concentration: NumberParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "PHARMACOKINETIC_CURVE",
    version: 2,
    thumbnailAssetKey: "pharmacokinetic-curve-v1",
    parameters: {
      dose_mg: { kind: "number", defaultValue: 240, min: 80, max: 400 },
      elimination_half_life_hours: {
        kind: "number",
        defaultValue: 6,
        min: 2,
        max: 10,
      },
      minimum_effective_concentration: {
        kind: "number",
        defaultValue: 1.5,
        min: 0.8,
        max: 2.5,
      },
      minimum_toxic_concentration: {
        kind: "number",
        defaultValue: 5.5,
        min: 4,
        max: 8,
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
