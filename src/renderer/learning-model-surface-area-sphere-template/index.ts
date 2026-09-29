// Surface-area-of-a-sphere model and visualization template. Release chunk: template-dc2706837280.js.
import "@rchunk/rolldown-runtime";
interface Specification {
  type: "SURFACE_AREA_SPHERE";
  version: 2;
  thumbnailAssetKey: "surface-area-sphere-v1";
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
    type: "SURFACE_AREA_SPHERE",
    version: 2,
    thumbnailAssetKey: "surface-area-sphere-v1",
    canonicalFormula: "S = 4\\pi r^2",
    canonicalFormulaAliases: [
      "S = 4\\pi r^2;",
      "a=4pir^2",
      "4pir^2=a",
      "4pir^2=s",
      "4pir^2",
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
  visualizationTemplate as n,
  initializeTemplate as r,
  radiusControl as t,
};
