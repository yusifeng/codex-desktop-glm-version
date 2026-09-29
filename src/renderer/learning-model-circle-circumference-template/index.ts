// Circle-circumference template and manifest. Release chunk: template-a78ebcc58f49.js.
import "@rchunk/rolldown-runtime";

const circleCircumferenceSpecification = {
  type: "CIRCLE_CIRCUMFERENCE",
  version: 2,
  thumbnailAssetKey: "circle-circumference-v1",
  canonicalFormula: "C = 2\\pi r",
  canonicalFormulaAliases: [
    "2\\pi r = C",
    "C = \\pi d",
    "\\pi d = C",
    "r = \\frac{C}{2\\pi}",
    "d = \\frac{C}{\\pi}",
  ],
  parameters: {
    radius: { kind: "number" as const, defaultValue: 3, min: 0.01, max: 10_000 },
  },
};

const radiusTemplateProperty = {
  label: "r",
  min: 0.5,
  max: 20,
  step: 0.1,
  defaultValue: 3,
  thumbnailDefaultValue: 3,
};

const circleCircumferenceTemplate = {
  properties: { radius: radiusTemplateProperty },
};

function initializeCircleCircumferenceSpecification(): void {}
function initializeCircleCircumferenceTemplate(): void {}

export {
  circleCircumferenceSpecification as a,
  initializeCircleCircumferenceSpecification as i,
  radiusTemplateProperty as n,
  initializeCircleCircumferenceTemplate as r,
  circleCircumferenceTemplate as t,
};
