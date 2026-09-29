// Quadratic vertex-form teaching model. Release chunk: model-10252d82a04c.js.
import "@rchunk/rolldown-runtime";
const coefficientControl = { defaultValue: 1, min: -3, max: 3 };
const specification = { type: "QUADRATIC_VERTEX_FORM", version: 1, thumbnailAssetKey: "quadratic-vertex-form-v1", canonicalFormula: "y = a(x - h)^2 + k", parameters: { h: { kind: "number", defaultValue: 0, min: -5, max: 5 }, k: { kind: "number", defaultValue: 0, min: -5, max: 5 } } };
function initializeCoefficientControl(): void {}
function initializeQuadraticVertexFormSpecification(): void {}
export { specification as i, initializeCoefficientControl as n, initializeQuadraticVertexFormSpecification as r, coefficientControl as t };
