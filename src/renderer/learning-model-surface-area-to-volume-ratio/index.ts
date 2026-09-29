// Surface-area-to-volume-ratio learning-model manifest. Release chunk: type-96f57cd357c8.js.
import "@rchunk/rolldown-runtime";

const surfaceAreaToVolumeRatioSpecification = {
  type: "SURFACE_AREA_TO_VOLUME_RATIO",
  version: 1,
  thumbnailAssetKey: "surface-area-to-volume-ratio-v2",
  parameters: {
    side_length: { kind: "integer" as const, defaultValue: 3, min: 1, max: 6 },
  },
};

function initializeSurfaceAreaToVolumeRatioSpecification(): void {}

export { surfaceAreaToVolumeRatioSpecification as n, initializeSurfaceAreaToVolumeRatioSpecification as t };
