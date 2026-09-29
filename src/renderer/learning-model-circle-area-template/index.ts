// Circle-area model and visualization template. Release chunk: template-97cafe2997c3.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "CIRCLE_AREA";
  version: 2;
  thumbnailAssetKey: "circle-area-v1";
  canonicalFormula: string;
  canonicalFormulaAliases: string[];
  parameters: {
    radius: { kind: "number"; defaultValue: 3; min: 0.01; max: 10000 };
  };
}
interface RadiusControl {
  label: "r";
  min: 0.5;
  max: 10;
  step: 0.1;
  defaultValue: 3;
  thumbnailDefaultValue: 10;
}
let specification: Specification;
let radiusControl: RadiusControl;
let visualizationTemplate: { properties: { radius: RadiusControl } };
let specInitialized = false;
let templateInitialized = false;
function initializeSpecification(): void {
  if (specInitialized) return;
  specInitialized = true;
  specification = {
    type: "CIRCLE_AREA",
    version: 2,
    thumbnailAssetKey: "circle-area-v1",
    canonicalFormula: "A = \\pi r^2",
    canonicalFormulaAliases: [
      "A = \\frac{\\pi d^2}{4}",
      "\\pi r^2",
      "\\frac{\\pi d^2}{4}",
      "pir^2=a",
      "pid^2/4=a",
    ],
    parameters: {
      radius: { kind: "number", defaultValue: 3, min: 0.01, max: 10000 },
    },
  };
}
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
  visualizationTemplate = { properties: { radius: radiusControl } };
}
export {
  specification as a,
  initializeSpecification as i,
  radiusControl as n,
  initializeTemplate as r,
  visualizationTemplate as t,
};
