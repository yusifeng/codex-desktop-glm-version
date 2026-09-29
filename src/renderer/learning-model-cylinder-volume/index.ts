// Cylinder-volume controls and formula metadata. Release chunk: type-d71c312af838.js.
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
let heightControl: DimensionControl;
let visualizationTemplate: {
  properties: { radius: DimensionControl; height: DimensionControl };
};
let specification: {
  type: "CYLINDER_VOLUME";
  version: 2;
  thumbnailAssetKey: "cylinder-volume-v1";
  canonicalFormula: string;
  canonicalFormulaAliases: string[];
  parameters: {
    radius: { kind: "number"; defaultValue: 3; min: 0.01; max: 10000 };
    height: { kind: "number"; defaultValue: 8; min: 0.01; max: 10000 };
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
  heightControl = {
    label: "h",
    min: 1,
    max: 20,
    step: 0.5,
    defaultValue: 8,
    thumbnailDefaultValue: 20,
  };
  visualizationTemplate = {
    properties: { radius: radiusControl, height: heightControl },
  };
}

function initializeSpecification(): void {
  if (specificationInitialized) return;
  specificationInitialized = true;
  specification = {
    type: "CYLINDER_VOLUME",
    version: 2,
    thumbnailAssetKey: "cylinder-volume-v1",
    canonicalFormula: "V = \\pi r^2 h",
    canonicalFormulaAliases: [
      "V = \\pi h r^2",
      "\\pi r^2 h = V",
      "\\pi h r^2 = V",
      "h = \\frac{V}{\\pi r^2}",
      "r^2 = \\frac{V}{\\pi h}",
    ],
    parameters: {
      radius: { kind: "number", defaultValue: 3, min: 0.01, max: 10000 },
      height: { kind: "number", defaultValue: 8, min: 0.01, max: 10000 },
    },
  };
}

export {
  radiusControl as a,
  heightControl as i,
  specification as n,
  initializeTemplate as o,
  visualizationTemplate as r,
  initializeSpecification as t,
};
