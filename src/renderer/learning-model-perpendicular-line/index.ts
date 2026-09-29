// Perpendicular-line learning-model manifest. Release chunk: type-39f5bace963c.js.
import "@rchunk/rolldown-runtime";

const perpendicularLineSpecification = {
  type: "PERPENDICULAR_LINE",
  version: 2,
  thumbnailAssetKey: "perpendicular-line-v1",
  parameters: {
    slope: { kind: "number" as const, defaultValue: 2, min: -10_000, max: 10_000, multipleOf: 0.0001 },
    intercept: { kind: "number" as const, defaultValue: 1, min: -10_000, max: 10_000 },
    perpendicularIntercept: { kind: "number" as const, defaultValue: -2, min: -10_000, max: 10_000 },
  },
};

function initializePerpendicularLineSpecification(): void {}

export { perpendicularLineSpecification as n, initializePerpendicularLineSpecification as t };
