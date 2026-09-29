// Triangle-area controls and formula metadata. Release chunk: type-dc693d0c1945.js.
import "@rchunk/rolldown-runtime";

interface DimensionControl {
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  thumbnailDefaultValue: number;
}

let baseControl: DimensionControl;
let heightControl: DimensionControl;
let visualizationTemplate: {
  properties: { base: DimensionControl; height: DimensionControl };
};
let specification: {
  type: "TRIANGLE_AREA";
  version: 2;
  thumbnailAssetKey: "triangle-area-v1";
  canonicalFormula: string;
  canonicalFormulaAliases: string[];
  parameters: {
    base: { kind: "number"; defaultValue: 8; min: 0.01; max: 10000 };
    height: { kind: "number"; defaultValue: 6; min: 0.01; max: 10000 };
  };
};
let templateInitialized = false;
let specificationInitialized = false;

function initializeTemplate(): void {
  if (templateInitialized) return;
  templateInitialized = true;
  baseControl = {
    label: "b",
    min: 2,
    max: 20,
    step: 0.5,
    defaultValue: 8,
    thumbnailDefaultValue: 20,
  };
  heightControl = {
    label: "h",
    min: 2,
    max: 16,
    step: 0.5,
    defaultValue: 6,
    thumbnailDefaultValue: 16,
  };
  visualizationTemplate = {
    properties: { base: baseControl, height: heightControl },
  };
}

function initializeSpecification(): void {
  if (specificationInitialized) return;
  specificationInitialized = true;
  specification = {
    type: "TRIANGLE_AREA",
    version: 2,
    thumbnailAssetKey: "triangle-area-v1",
    canonicalFormula: "A = \\frac{1}{2}bh",
    canonicalFormulaAliases: [
      "A = \\frac{1}{2} b h",
      "a=bh/2",
      "1/2bh=a",
      "bh/2=a",
      "1/2bh",
      "b = \\frac{2A}{h}",
      "h = \\frac{2A}{b}",
    ],
    parameters: {
      base: { kind: "number", defaultValue: 8, min: 0.01, max: 10000 },
      height: { kind: "number", defaultValue: 6, min: 0.01, max: 10000 },
    },
  };
}

export {
  visualizationTemplate as a,
  heightControl as i,
  specification as n,
  initializeTemplate as o,
  baseControl as r,
  initializeSpecification as t,
};
