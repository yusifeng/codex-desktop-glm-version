// El Nino and La Nina learning-model manifest. Release chunk: type-44fc1ec684df.js.
import "@rchunk/rolldown-runtime";

type ClimatePhase = "La Niña" | "Neutral" | "El Niño";

const elNinoAndLaNinaSpecification = {
  type: "EL_NINO_AND_LA_NINA",
  version: 2,
  thumbnailAssetKey: "el-nino-and-la-nina-v3",
  parameters: {
    initial_phase: {
      kind: "enum" as const,
      defaultValue: "Neutral" as ClimatePhase,
      allowedValues: ["La Niña", "Neutral", "El Niño"] as ClimatePhase[],
    },
  },
};

function initializeElNinoAndLaNinaSpecification(): void {}

export { elNinoAndLaNinaSpecification as n, initializeElNinoAndLaNinaSpecification as t };
