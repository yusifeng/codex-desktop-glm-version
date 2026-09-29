// Musical-harmonic-series learning-model manifest. Release chunk: type-eb61c94728f0.js.
import "@rchunk/rolldown-runtime";

const musicalHarmonicSeriesSpecification = {
  type: "MUSICAL_HARMONIC_SERIES",
  version: 2,
  thumbnailAssetKey: "musical-harmonic-series-v1",
  parameters: {
    fundamental_frequency_hz: { kind: "number" as const, defaultValue: 220, min: 20, max: 2_000 },
  },
};

function initializeMusicalHarmonicSeriesSpecification(): void {}

export { musicalHarmonicSeriesSpecification as n, initializeMusicalHarmonicSeriesSpecification as t };
