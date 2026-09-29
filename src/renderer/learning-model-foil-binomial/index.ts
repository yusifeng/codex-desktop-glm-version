// FOIL binomial learning-model manifest. Release chunk: type-49e9f66a2d98.js.
import "@rchunk/rolldown-runtime";

const foilBinomialSpecification = {
  type: "FOIL_BINOMIAL",
  version: 2,
  thumbnailAssetKey: "foil-binomial-v1",
  parameters: {
    a: { kind: "number" as const, defaultValue: 1, min: -12, max: 12 },
    b: { kind: "number" as const, defaultValue: 3, min: -12, max: 12 },
    c: { kind: "number" as const, defaultValue: 1, min: -12, max: 12 },
    d: { kind: "number" as const, defaultValue: 2, min: -12, max: 12 },
  },
};

function initializeFoilBinomialSpecification(): void {}

export { foilBinomialSpecification as n, initializeFoilBinomialSpecification as t };
