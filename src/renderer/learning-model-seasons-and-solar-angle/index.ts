// Seasons and solar-angle learning-model manifest. Release chunk: type-afd9de5814d9.js.
import "@rchunk/rolldown-runtime";

const seasonsAndSolarAngleSpecification = {
  type: "SEASONS_AND_SOLAR_ANGLE",
  version: 3,
  thumbnailAssetKey: "seasons-and-solar-angle-v2",
  parameters: {
    latitude_degrees: { kind: "number" as const, defaultValue: 40, min: -80, max: 80 },
  },
};

function initializeSeasonsAndSolarAngleSpecification(): void {}

export { seasonsAndSolarAngleSpecification as n, initializeSeasonsAndSolarAngleSpecification as t };
