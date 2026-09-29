// Tangent ratio specification. Release chunk: type-6fdfb08a7fa3.js.
import "@rchunk/rolldown-runtime";

interface Specification {
  type: "TRIG_RATIO_TANGENT";
  version: 2;
  thumbnailAssetKey: "trig-ratio-tangent-v1";
  canonicalFormula: "\\tan(\\theta) = \\frac{\\sin(\\theta)}{\\cos(\\theta)}";
  canonicalFormulaAliases: [
    "\\tan x = \\frac{\\sin x}{\\cos x}",
    "\\tan(\\theta)=\\frac{opposite}{adjacent}",
  ];
  parameters: {
    angleDeg: { kind: "number"; defaultValue: 35; min: 0.01; max: 89.99 };
    angleLabel: {
      kind: "enum";
      defaultValue: "θ";
      allowedValues: ["θ", "α", "β", "φ", "γ"];
    };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "TRIG_RATIO_TANGENT",
    version: 2,
    thumbnailAssetKey: "trig-ratio-tangent-v1",
    canonicalFormula: "\\tan(\\theta) = \\frac{\\sin(\\theta)}{\\cos(\\theta)}",
    canonicalFormulaAliases: [
      "\\tan x = \\frac{\\sin x}{\\cos x}",
      "\\tan(\\theta)=\\frac{opposite}{adjacent}",
    ],
    parameters: {
      angleDeg: { kind: "number", defaultValue: 35, min: 0.01, max: 89.99 },
      angleLabel: {
        kind: "enum",
        defaultValue: "θ",
        allowedValues: ["θ", "α", "β", "φ", "γ"],
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
