// Lagrange gradient-parallelism manifest. Release chunk: type-b77b9fb94c5f.js.
import "@rchunk/rolldown-runtime";

const lagrangeGradientParallelismSpecification = {
  type: "LAGRANGE_GRADIENT_PARALLELISM",
  version: 1,
  thumbnailAssetKey: "lagrange-gradient-parallelism-v1",
  canonicalFormula: "\\nabla f \\parallel \\nabla g",
  parameters: {
    angleDegrees: { kind: "number" as const, defaultValue: 30, min: 0, max: 360 },
  },
};

function initializeLagrangeGradientParallelismSpecification(): void {}

export { lagrangeGradientParallelismSpecification as n, initializeLagrangeGradientParallelismSpecification as t };
