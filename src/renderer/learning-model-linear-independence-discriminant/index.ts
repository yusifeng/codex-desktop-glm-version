// Linear-independence discriminant learning-model manifest. Release chunk: type-4e7d1b324604.js.
import "@rchunk/rolldown-runtime";

const linearIndependenceDiscriminantSpecification = {
  type: "LINEAR_INDEPENDENCE_DISCRIMINANT",
  version: 1,
  thumbnailAssetKey: "linear-independence-discriminant-v1",
  canonicalFormula: "A=\\left|\\det(\\mathbf{u},\\mathbf{v})\\right|",
  canonicalFormulaAliases: [
    "\\det(\\mathbf{u},\\mathbf{v})=u_xv_y-u_yv_x",
    "\\det(\\mathbf{u},\\mathbf{v})\\ne 0",
  ],
  parameters: {
    uX: { kind: "number" as const, defaultValue: 4, min: -20, max: 20 },
    uY: { kind: "number" as const, defaultValue: 1, min: -20, max: 20 },
    vX: { kind: "number" as const, defaultValue: 1, min: -20, max: 20 },
    vY: { kind: "number" as const, defaultValue: 3, min: -20, max: 20 },
  },
};

function initializeLinearIndependenceDiscriminantSpecification(): void {}

export {
  linearIndependenceDiscriminantSpecification as n,
  initializeLinearIndependenceDiscriminantSpecification as t,
};
