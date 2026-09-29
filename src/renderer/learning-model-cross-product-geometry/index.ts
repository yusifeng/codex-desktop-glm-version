// Cross product geometry specification. Release chunk: type-25a004ce6551.js.
import "@rchunk/rolldown-runtime";

interface NumberParameter {
  kind: "number";
  defaultValue: number;
  min: number;
  max: number;
}
interface Specification {
  type: "CROSS_PRODUCT_GEOMETRY";
  version: 1;
  thumbnailAssetKey: "cross-product-geometry-v1";
  canonicalFormula: "|a\\times b|=|a||b|\\sin(\\theta)";
  canonicalFormulaAliases: string[];
  parameters: {
    magnitudeA: NumberParameter;
    magnitudeB: NumberParameter;
    angleDeg: NumberParameter;
    order: { kind: "enum"; defaultValue: "axb"; allowedValues: ["axb", "bxa"] };
  };
}
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "CROSS_PRODUCT_GEOMETRY",
    version: 1,
    thumbnailAssetKey: "cross-product-geometry-v1",
    canonicalFormula: "|a\\times b|=|a||b|\\sin(\\theta)",
    canonicalFormulaAliases: [
      "\\|\\vec a\\times\\vec b\\|=\\|\\vec a\\|\\|\\vec b\\|\\sin(\\theta)",
      "\\vec a\\times\\vec b",
      "\\vec b\\times\\vec a=-(\\vec a\\times\\vec b)",
      "\\|\\vec a\\times\\vec b\\|=\\text{parallelogram area}",
    ],
    parameters: {
      magnitudeA: { kind: "number", defaultValue: 3, min: 0.5, max: 6 },
      magnitudeB: { kind: "number", defaultValue: 2.5, min: 0.5, max: 6 },
      angleDeg: { kind: "number", defaultValue: 60, min: 5, max: 175 },
      order: {
        kind: "enum",
        defaultValue: "axb",
        allowedValues: ["axb", "bxa"],
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
