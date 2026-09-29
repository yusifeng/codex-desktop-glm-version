// Musical interval chart learning-model manifest. Release chunk: type-b02d73c8ed7c.js.
import "@rchunk/rolldown-runtime";

const musicalIntervalChartSpecification = {
  type: "MUSICAL_INTERVAL_CHART",
  version: 3,
  thumbnailAssetKey: "musical-interval-chart-v2",
  parameters: {
    lower_note: {
      kind: "enum" as const,
      defaultValue: "C",
      allowedValues: [
        "C",
        "C-sharp",
        "D-flat",
        "D",
        "E-flat",
        "E",
        "F",
        "F-sharp",
        "G-flat",
        "G",
        "A-flat",
        "A",
        "B-flat",
        "B",
      ],
    },
  },
};

function initializeMusicalIntervalChartSpecification(): void {}

export {
  musicalIntervalChartSpecification as n,
  initializeMusicalIntervalChartSpecification as t,
};
