// Cone-surface-area controls and formula metadata. Release chunk: type-3a1bd5a62fd7.js.
import "@rchunk/rolldown-runtime";

interface DimensionControl {
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  thumbnailDefaultValue: number;
}

let radiusControl: DimensionControl;
let slantHeightControl: DimensionControl;
let visualizationTemplate: {
  properties: { radius: DimensionControl; slantHeight: DimensionControl };
};
let specification: {
  type: "CONE_SURFACE_AREA";
  version: 2;
  thumbnailAssetKey: "cone-surface-area-v1";
  canonicalFormula: string;
  canonicalFormulaAliases: string[];
  parameters: {
    radius: { kind: "number"; defaultValue: 3; min: 0.01; max: 10000 };
    slantHeight: { kind: "number"; defaultValue: 6; min: 0.01; max: 10000 };
  };
};
let templateInitialized = false;
let specificationInitialized = false;

function initializeTemplate(): void {
  if (templateInitialized) return;
  templateInitialized = true;
  radiusControl = {
    label: "r",
    min: 0.5,
    max: 10,
    step: 0.1,
    defaultValue: 3,
    thumbnailDefaultValue: 10,
  };
  slantHeightControl = {
    label: "l",
    min: 1,
    max: 15,
    step: 0.5,
    defaultValue: 6,
    thumbnailDefaultValue: 15,
  };
  visualizationTemplate = {
    properties: { radius: radiusControl, slantHeight: slantHeightControl },
  };
}

function initializeSpecification(): void {
  if (specificationInitialized) return;
  specificationInitialized = true;
  specification = {
    type: "CONE_SURFACE_AREA",
    version: 2,
    thumbnailAssetKey: "cone-surface-area-v1",
    canonicalFormula: "A = \\pi r(r + l)",
    canonicalFormulaAliases: [
      "A = \\pi r (r + l)",
      "A = \\pi r^2 + \\pi r l",
      "A = \\pi r l + \\pi r^2",
      "\\pi r (r + l) = A",
      "\\pi r^2 + \\pi r l = A",
      "\\pi r l + \\pi r^2 = A",
    ],
    parameters: {
      radius: { kind: "number", defaultValue: 3, min: 0.01, max: 10000 },
      slantHeight: { kind: "number", defaultValue: 6, min: 0.01, max: 10000 },
    },
  };
}

export {
  slantHeightControl as a,
  radiusControl as i,
  specification as n,
  initializeTemplate as o,
  visualizationTemplate as r,
  initializeSpecification as t,
};
