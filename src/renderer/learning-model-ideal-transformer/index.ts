// Ideal transformer specification. Release chunk: type-221c87938b30.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "IDEAL_TRANSFORMER";
  version: 1;
  thumbnailAssetKey: "ideal-transformer-v2";
  canonicalFormula: "\\frac{V_s}{V_p}=\\frac{N_s}{N_p}";
  parameters: {
    turnsRatio: NumberParameter;
    loadResistanceOhms: NumberParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "IDEAL_TRANSFORMER",
    version: 1,
    thumbnailAssetKey: "ideal-transformer-v2",
    canonicalFormula: "\\frac{V_s}{V_p}=\\frac{N_s}{N_p}",
    parameters: {
      turnsRatio: { kind: "number", defaultValue: 2, min: 0.1, max: 10 },
      loadResistanceOhms: {
        kind: "number",
        defaultValue: 30,
        min: 1,
        max: 10_000,
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
