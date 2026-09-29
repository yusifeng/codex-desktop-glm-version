// Safe-following stopping-distance learning-model manifest. Release chunk: type-1cd86e5f325c.js.
import "@rchunk/rolldown-runtime";

const stoppingDistanceSafeFollowingSpecification = {
  type: "STOPPING_DISTANCE_SAFE_FOLLOWING",
  version: 2,
  thumbnailAssetKey: "stopping-distance-safe-following-v2",
  canonicalFormula: "d_{\\mathrm{stop}}=d_{\\mathrm{reaction}}+d_{\\mathrm{braking}}",
  parameters: {
    speedKmh: { kind: "number" as const, defaultValue: 60, min: 30, max: 100 },
    reactionTimeSeconds: { kind: "number" as const, defaultValue: 1, min: 0.5, max: 2 },
    roadCondition: {
      kind: "enum" as const,
      defaultValue: "dry",
      allowedValues: ["dry", "wet", "snow_ice"],
    },
  },
};

function initializeStoppingDistanceSafeFollowingSpecification(): void {}

export {
  stoppingDistanceSafeFollowingSpecification as n,
  initializeStoppingDistanceSafeFollowingSpecification as t,
};
