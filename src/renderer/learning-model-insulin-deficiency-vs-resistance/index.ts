// Insulin deficiency versus resistance teaching model. Release chunk: model-fe380b24f817.js.
import "@rchunk/rolldown-runtime";
type Condition = "normal" | "deficiency" | "resistance";
type Checkpoint = 0 | 1 | 2 | 3 | 4;
interface Formatter {
  formatMessage(message: { id: string; defaultMessage: string }): string;
}
const conditions: Condition[] = ["normal", "deficiency", "resistance"];
const checkpoints: Checkpoint[] = [0, 1, 2, 3, 4];
const defaults: { condition: Condition; checkpoint: Checkpoint } = {
  condition: "normal",
  checkpoint: 0,
};
const normalize = (input: { condition?: unknown; checkpoint?: unknown }) => ({
  condition: conditions.some((value) => value === input.condition)
    ? (input.condition as Condition)
    : defaults.condition,
  checkpoint: checkpoints.some((value) => value === input.checkpoint)
    ? (input.checkpoint as Checkpoint)
    : defaults.checkpoint,
});
const state = (condition: Condition) =>
  condition === "normal"
    ? {
        insulinCount: 3,
        signalStrength: 1,
        membraneGlut4Count: 4,
        uptakeCount: 4,
        bloodGlucoseCount: 2,
        firstDivergence: null,
      }
    : condition === "deficiency"
      ? {
          insulinCount: 1,
          signalStrength: 0.35,
          membraneGlut4Count: 1,
          uptakeCount: 1,
          bloodGlucoseCount: 5,
          firstDivergence: 0,
        }
      : {
          insulinCount: 4,
          signalStrength: 0.42,
          membraneGlut4Count: 2,
          uptakeCount: 2,
          bloodGlucoseCount: 4,
          firstDivergence: 2,
        };
const conditionLabel = (formatter: Formatter, condition: Condition) =>
  formatter.formatMessage({
    id: `learningBlock.insulinDeficiencyVsResistanceV2.condition.${condition}`,
    defaultMessage:
      condition === "normal"
        ? "Normal insulin response"
        : condition === "deficiency"
          ? "Insulin deficiency"
          : "Insulin resistance",
  });
const checkpointDefaults = [
  "Pancreas responds",
  "Insulin reaches receptor",
  "Cell responds",
  "GLUT4 moves",
  "Glucose uptake",
];
const checkpointKeys = ["pancreas", "receptor", "response", "glut4", "uptake"];
const checkpointLabel = (formatter: Formatter, checkpoint: Checkpoint) =>
  formatter.formatMessage({
    id: `learningBlock.insulinDeficiencyVsResistanceV2.checkpoint.${checkpointKeys[checkpoint]}`,
    defaultMessage: checkpointDefaults[checkpoint]!,
  });
const captions: Record<Condition, string[]> = {
  normal: [
    "The pancreas releases insulin when blood glucose rises",
    "Insulin binds to a receptor on the muscle cell",
    "The muscle cell responds to the insulin signal",
    "The signal moves GLUT4 transporters to the cell membrane",
    "Glucose enters the muscle cell, lowering blood glucose",
  ],
  deficiency: [
    "The pancreas releases too little insulin",
    "Less insulin reaches the muscle cell",
    "The muscle cell receives a weaker overall insulin signal",
    "Fewer GLUT4 transporters move to the cell membrane",
    "Less glucose enters the muscle cell, so more stays in the blood",
  ],
  resistance: [
    "The pancreas releases insulin",
    "Insulin reaches the muscle cell receptor",
    "The muscle cell responds weakly to insulin",
    "Fewer GLUT4 transporters move to the cell membrane",
    "Less glucose enters the muscle cell, so more stays in the blood",
  ],
};
const caption = (
  formatter: Formatter,
  condition: Condition,
  checkpoint: Checkpoint,
) =>
  formatter.formatMessage({
    id: `learningBlock.insulinDeficiencyVsResistanceV2.caption.${condition}${checkpointKeys[checkpoint]![0]!.toUpperCase()}${checkpointKeys[checkpoint]!.slice(1)}`,
    defaultMessage: captions[condition][checkpoint]!,
  });
function initializeModel(): void {}
export {
  checkpointLabel as a,
  state as c,
  caption as i,
  normalize as l,
  conditions as n,
  conditionLabel as o,
  defaults as r,
  initializeModel as s,
  checkpoints as t,
};
