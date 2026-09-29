// Energy-efficiency Sankey diagram specification. Release chunk: type-835190510733.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "ENERGY_EFFICIENCY_SANKEY_DIAGRAM";
  version: 1;
  thumbnailAssetKey: "energy-efficiency-sankey-diagram-v1";
  canonicalFormula: "\\text{Efficiency}=\\frac{\\text{useful output}}{\\text{total input}}";
  parameters: {
    energy_system: {
      kind: "enum";
      defaultValue: "light bulb";
      allowedValues: ["light bulb", "electric motor", "car engine"];
    };
    input_energy_joules: NumberParameter;
    initial_efficiency_percent: NumberParameter;
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "ENERGY_EFFICIENCY_SANKEY_DIAGRAM",
    version: 1,
    thumbnailAssetKey: "energy-efficiency-sankey-diagram-v1",
    canonicalFormula:
      "\\text{Efficiency}=\\frac{\\text{useful output}}{\\text{total input}}",
    parameters: {
      energy_system: {
        kind: "enum",
        defaultValue: "light bulb",
        allowedValues: ["light bulb", "electric motor", "car engine"],
      },
      input_energy_joules: {
        kind: "number",
        defaultValue: 100,
        min: 1,
        max: 10_000,
      },
      initial_efficiency_percent: {
        kind: "number",
        defaultValue: 40,
        min: 0,
        max: 100,
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
