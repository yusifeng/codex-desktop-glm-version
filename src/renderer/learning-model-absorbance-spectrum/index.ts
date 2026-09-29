// Absorbance-spectrum learning-model manifest. Release chunk: type-725e1a69e8d4.js.
import "@rchunk/rolldown-runtime";

const absorbanceSpectrumSpecification = {
  type: "ABSORBANCE_SPECTRUM",
  version: 2,
  thumbnailAssetKey: "absorbance-spectrum-v1",
  parameters: {
    lambda_max_nm: { kind: "number" as const, defaultValue: 520, min: 210, max: 740 },
  },
};

function initializeAbsorbanceSpectrumSpecification(): void {}

export { absorbanceSpectrumSpecification as n, initializeAbsorbanceSpectrumSpecification as t };
