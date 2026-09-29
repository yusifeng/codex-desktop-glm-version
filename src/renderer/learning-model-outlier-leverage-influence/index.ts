// Outlier, leverage, and influence manifest. Release chunk: type-8b31d5042d39.js.
import "@rchunk/rolldown-runtime";

type OutlierCase = "central-outlier" | "aligned-high-leverage" | "influential";

const outlierLeverageInfluenceSpecification = {
  type: "OUTLIER_LEVERAGE_INFLUENCE",
  version: 2,
  thumbnailAssetKey: "outlier-leverage-influence-v1",
  parameters: {
    initial_case: {
      kind: "enum" as const,
      defaultValue: "influential" as OutlierCase,
      allowedValues: ["central-outlier", "aligned-high-leverage", "influential"] as OutlierCase[],
    },
  },
};

function initializeOutlierLeverageInfluenceSpecification(): void {}

export { outlierLeverageInfluenceSpecification as n, initializeOutlierLeverageInfluenceSpecification as t };
