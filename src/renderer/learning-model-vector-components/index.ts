// Vector-components learning-model manifest. Release chunk: type-8f4414a8a97c.js.
import "@rchunk/rolldown-runtime";

const vectorComponentsSpecification = {
  type: "VECTOR_COMPONENTS",
  version: 1,
  thumbnailAssetKey: "vector-components-v1",
  canonicalFormula: "x=r\\cos\\theta,\\qquad y=r\\sin\\theta",
  canonicalFormulaAliases: [
    "\\vec v=\\langle r\\cos\\theta,\\ r\\sin\\theta\\rangle",
    "(x,y)=(r\\cos\\theta,r\\sin\\theta)",
  ],
  parameters: {
    magnitude: { kind: "number" as const, defaultValue: 6, min: 0.1, max: 100 },
    angleDeg: { kind: "number" as const, defaultValue: 35, min: -180, max: 180 },
  },
};

function initializeVectorComponentsSpecification(): void {}

export { vectorComponentsSpecification as n, initializeVectorComponentsSpecification as t };
