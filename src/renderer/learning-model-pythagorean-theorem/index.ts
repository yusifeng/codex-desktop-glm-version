// Pythagorean-theorem template and manifest. Release chunk: type-e9e5c33af31e.js.
import "@rchunk/rolldown-runtime";

const legTemplateBounds = { min: 5, max: 15, step: 0.1 };
const firstLegTemplateProperty = { ...legTemplateBounds, label: "a", defaultValue: 15 };
const secondLegTemplateProperty = { ...legTemplateBounds, label: "b", defaultValue: 15 };

const pythagoreanTheoremTemplate = {
  properties: {
    a: firstLegTemplateProperty,
    b: secondLegTemplateProperty,
  },
};

const pythagoreanTheoremSpecification = {
  type: "PYTHAGOREAN_THEOREM",
  version: 2,
  thumbnailAssetKey: "pythagorean-v1",
  canonicalFormula: "a^2 + b^2 = c^2",
  canonicalFormulaAliases: [
    "c^2 = a^2 + b^2",
    "c = \\sqrt{a^2 + b^2}",
    "c = \\sqrt{(a^2 + b^2)}",
  ],
  parameters: {
    a: { kind: "number" as const, defaultValue: 15, min: 0.01, max: 10_000 },
    b: { kind: "number" as const, defaultValue: 15, min: 0.01, max: 10_000 },
  },
};

function initializePythagoreanTheoremTemplate(): void {}
function initializePythagoreanTheoremSpecification(): void {}

export {
  pythagoreanTheoremTemplate as a,
  secondLegTemplateProperty as i,
  pythagoreanTheoremSpecification as n,
  initializePythagoreanTheoremTemplate as o,
  firstLegTemplateProperty as r,
  initializePythagoreanTheoremSpecification as t,
};
