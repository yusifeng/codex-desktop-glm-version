// Cone-volume controls and formula metadata. Release chunk: type-27a1646b6027.js.
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
  type: "CONE_VOLUME";
  version: 2;
  thumbnailAssetKey: "cone-volume-v1";
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
    type: "CONE_VOLUME",
    version: 2,
    thumbnailAssetKey: "cone-volume-v1",
    canonicalFormula: "V = \\frac{1}{3}\\pi r^2 h",
    canonicalFormulaAliases: [
      "V = \\frac{1}{3} \\pi r^2 h",
      "V = \\frac{1}{3} \\pi h r^2",
      "V = \\pi r^2 h / 3",
      "V = \\pi h r^2 / 3",
      "\\frac{1}{3} \\pi r^2 h = V",
      "\\frac{1}{3} \\pi h r^2 = V",
      "\\pi r^2 h / 3 = V",
      "\\pi h r^2 / 3 = V",
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
