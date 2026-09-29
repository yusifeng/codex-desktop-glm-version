// Mixing solutions specification. Release chunk: type-d31ca122ade1.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "MIXING_SOLUTIONS";
  version: 1;
  thumbnailAssetKey: "mixing-solutions-v1";
  canonicalFormula: "C_{\\mathrm{mix}}=\\frac{C_1V_1+C_2V_2}{V_1+V_2}";
  parameters: {
    solution1VolumeLiters: NumberParameter;
    solution1ConcentrationMolesPerLiter: NumberParameter;
    solution2VolumeLiters: NumberParameter;
    solution2ConcentrationMolesPerLiter: NumberParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "MIXING_SOLUTIONS",
    version: 1,
    thumbnailAssetKey: "mixing-solutions-v1",
    canonicalFormula: "C_{\\mathrm{mix}}=\\frac{C_1V_1+C_2V_2}{V_1+V_2}",
    parameters: {
      solution1VolumeLiters: {
        kind: "number",
        defaultValue: 0.8,
        min: 0.01,
        max: 1_000,
      },
      solution1ConcentrationMolesPerLiter: {
        kind: "number",
        defaultValue: 2,
        min: 0,
        max: 20,
      },
      solution2VolumeLiters: {
        kind: "number",
        defaultValue: 1.2,
        min: 0.01,
        max: 1_000,
      },
      solution2ConcentrationMolesPerLiter: {
        kind: "number",
        defaultValue: 0.5,
        min: 0,
        max: 20,
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
