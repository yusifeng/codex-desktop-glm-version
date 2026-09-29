// Homogeneous-ODE roots learning-model manifest. Release chunk: type-ad01baf2ce65.js.
import "@rchunk/rolldown-runtime";

const homogeneousOdeRootsSpecification = {
  type: "HOMOGENEOUS_ODE_ROOTS",
  version: 1,
  thumbnailAssetKey: "homogenous-ode-roots-v1",
  canonicalFormula: "ay''+by'+cy=0",
  parameters: {
    a: { kind: "number" as const, defaultValue: 1, min: 0.1, max: 100 },
    b: { kind: "number" as const, defaultValue: 2, min: -10_000, max: 10_000 },
    c: { kind: "number" as const, defaultValue: 5, min: -10_000, max: 10_000 },
  },
};

function initializeHomogeneousOdeRootsSpecification(): void {}

export { homogeneousOdeRootsSpecification as n, initializeHomogeneousOdeRootsSpecification as t };
