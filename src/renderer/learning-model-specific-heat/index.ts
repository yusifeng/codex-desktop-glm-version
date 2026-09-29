// Specific heat specification. Release chunk: type-34ba530d4dd9.js.
import "@rchunk/rolldown-runtime";

interface Specification {
  type: "SPECIFIC_HEAT";
  version: 1;
  thumbnailAssetKey: "specific-heat-v2";
  canonicalFormula: "\\Delta T = \\frac{q}{mc}";
  parameters: {
    material: {
      kind: "enum";
      defaultValue: "water";
      allowedValues: ["copper", "sand", "water"];
    };
    heatKj: { kind: "number"; defaultValue: 40; min: 0; max: 60 };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "SPECIFIC_HEAT",
    version: 1,
    thumbnailAssetKey: "specific-heat-v2",
    canonicalFormula: "\\Delta T = \\frac{q}{mc}",
    parameters: {
      material: {
        kind: "enum",
        defaultValue: "water",
        allowedValues: ["copper", "sand", "water"],
      },
      heatKj: { kind: "number", defaultValue: 40, min: 0, max: 60 },
    },
  };
}
export { specification as n, initializeSpecification as t };
