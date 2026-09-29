// Central-limit-theorem learning-model manifest. Release chunk: type-33287eb94059.js.
import "@rchunk/rolldown-runtime";

type PopulationShape = "right-skewed" | "uniform" | "bimodal" | "normal";

const centralLimitTheoremSpecification = {
  type: "CENTRAL_LIMIT_THEOREM",
  version: 3,
  thumbnailAssetKey: "central-limit-theorem-v1",
  parameters: {
    population_shape: {
      kind: "enum" as const,
      defaultValue: "right-skewed" as PopulationShape,
      allowedValues: ["right-skewed", "uniform", "bimodal", "normal"] as PopulationShape[],
    },
    sample_size: { kind: "integer" as const, defaultValue: 5, min: 1, max: 100 },
  },
};

function initializeCentralLimitTheoremSpecification(): void {}

export { centralLimitTheoremSpecification as n, initializeCentralLimitTheoremSpecification as t };
