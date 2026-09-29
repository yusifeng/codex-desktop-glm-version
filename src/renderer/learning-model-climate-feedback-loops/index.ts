// Climate-feedback-loops learning-model manifest. Release chunk: type-81172b31949f.js.
import "@rchunk/rolldown-runtime";

type FeedbackMechanism = "ice-albedo" | "water-vapor" | "radiative-response";
type ClimateChange = "warming" | "cooling";

const climateFeedbackLoopsSpecification = {
  type: "CLIMATE_FEEDBACK_LOOPS",
  version: 2,
  thumbnailAssetKey: "climate-feedback-loops-v2",
  parameters: {
    initial_mechanism: {
      kind: "enum" as const,
      defaultValue: "ice-albedo" as FeedbackMechanism,
      allowedValues: ["ice-albedo", "water-vapor", "radiative-response"] as FeedbackMechanism[],
    },
    initial_change: {
      kind: "enum" as const,
      defaultValue: "warming" as ClimateChange,
      allowedValues: ["warming", "cooling"] as ClimateChange[],
    },
  },
};

function initializeClimateFeedbackLoopsSpecification(): void {}

export { climateFeedbackLoopsSpecification as n, initializeClimateFeedbackLoopsSpecification as t };
