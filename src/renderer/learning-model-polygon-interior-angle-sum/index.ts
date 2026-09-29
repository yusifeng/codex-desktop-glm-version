// Polygon angle-sum template and manifest. Release chunk: type-edf05c1a49b7.js.
import "@rchunk/rolldown-runtime";

const sideCountTemplateProperty = {
  label: "n",
  min: 3,
  max: 12,
  step: 1,
  defaultValue: 6,
};

const polygonInteriorAngleSumTemplate = {
  properties: { n: sideCountTemplateProperty },
};

const polygonInteriorAngleSumSpecification = {
  type: "POLYGON_INTERIOR_ANGLE_SUM",
  version: 1,
  thumbnailAssetKey: "polygon-interior-angle-sum-v1",
  canonicalFormula: "(n - 2)\\times 180^\\circ",
  canonicalFormulaAliases: [
    "(n - 2) \\times 180^\\circ",
    "S_n = (n - 2) \\cdot 180^\\circ",
    "S_n = (n - 2)(180^\\circ)",
    "S_n=(n-2)\\cdot(180)",
    "180^\\circ(n-2)",
  ],
  parameters: {
    n: { kind: "number" as const, defaultValue: 6, min: 3, max: 50 },
  },
};

function initializePolygonInteriorAngleSumTemplate(): void {}
function initializePolygonInteriorAngleSumSpecification(): void {}

export {
  initializePolygonInteriorAngleSumTemplate as a,
  polygonInteriorAngleSumTemplate as i,
  polygonInteriorAngleSumSpecification as n,
  sideCountTemplateProperty as r,
  initializePolygonInteriorAngleSumSpecification as t,
};
