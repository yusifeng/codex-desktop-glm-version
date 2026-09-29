// Electrolyte conductivity specification. Release chunk: type-856560998265.js.
import "@rchunk/rolldown-runtime";

interface Specification {
  type: "ELECTROLYTE_CONDUCTIVITY";
  version: 2;
  thumbnailAssetKey: "electrolyte-conductivity-v2";
  parameters: {
    initial_solution: {
      kind: "enum";
      defaultValue: "potassium-chloride";
      allowedValues: ["potassium-chloride", "acetic-acid", "ethanol"];
    };
    initial_concentration: {
      kind: "number";
      defaultValue: 0.6;
      min: 0.1;
      max: 1;
    };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "ELECTROLYTE_CONDUCTIVITY",
    version: 2,
    thumbnailAssetKey: "electrolyte-conductivity-v2",
    parameters: {
      initial_solution: {
        kind: "enum",
        defaultValue: "potassium-chloride",
        allowedValues: ["potassium-chloride", "acetic-acid", "ethanol"],
      },
      initial_concentration: {
        kind: "number",
        defaultValue: 0.6,
        min: 0.1,
        max: 1,
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
