// Distributive-property learning-model manifest. Release chunk: type-50c9fc73ec1d.js.
import "@rchunk/rolldown-runtime";

const distributivePropertySpecification = {
  type: "DISTRIBUTIVE_PROPERTY",
  version: 2,
  thumbnailAssetKey: "distributive-property-v1",
  canonicalFormula: "a(b+c)=ab+ac",
  parameters: {
    a: { kind: "integer" as const, defaultValue: 8, min: 2, max: 8 },
    b: { kind: "integer" as const, defaultValue: 7, min: 2, max: 8 },
    c: { kind: "integer" as const, defaultValue: 7, min: 2, max: 8 },
  },
};

function initializeDistributivePropertySpecification(): void {}

export { distributivePropertySpecification as n, initializeDistributivePropertySpecification as t };
