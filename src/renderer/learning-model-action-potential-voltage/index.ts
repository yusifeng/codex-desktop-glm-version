// Action-potential voltage teaching model. Release chunk: model-a6184aabc0d8.js.
import "@rchunk/rolldown-runtime";
import {
  G2 as defineMessages,
  K2 as initializeAppShared,
} from "@rchunk/app-shared";
interface Message {
  id: string;
  defaultMessage: string;
}
interface Formatter {
  formatMessage(message: Message): string;
}
interface Point {
  x: number;
  y: number;
}
interface Stage {
  id: string;
  label: Message;
  status: Message;
  caption: Message;
  representativeVoltage: number;
  point: Point;
  traceStartIndex: number;
  traceEndIndex: number;
}
const voltageTrace: Point[] = [
  [0, -70],
  [0.8, -70],
  [1.4, -70],
  [1.8, -70],
  [2, -69],
  [2.1, -65],
  [2.2, -60],
  [2.3, -55],
  [2.4, -43],
  [2.5, -25],
  [2.6, -5],
  [2.7, 15],
  [2.8, 30],
  [2.9, 38],
  [3, 40],
  [3.1, 38],
  [3.2, 32],
  [3.3, 20],
  [3.45, 0],
  [3.6, -20],
  [3.8, -40],
  [4, -55],
  [4.2, -65],
  [4.4, -72],
  [4.6, -78],
  [4.8, -83],
  [5, -85],
  [5.2, -84],
  [5.5, -80],
  [5.8, -76],
  [6.1, -73],
  [6.5, -71],
  [7, -70],
  [8.5, -70],
  [10, -70],
].map(([x, y]) => ({ x: x!, y: y! }));
const messages = defineMessages({
  restingPotentialLabel: {
    id: "learningBlock.actionPotentialVoltage.stage.restingPotential",
    defaultMessage: "Resting potential",
  },
  thresholdLabel: {
    id: "learningBlock.actionPotentialVoltage.stage.threshold",
    defaultMessage: "Threshold",
  },
  depolarizationLabel: {
    id: "learningBlock.actionPotentialVoltage.stage.depolarization",
    defaultMessage: "Depolarization",
  },
  peakLabel: {
    id: "learningBlock.actionPotentialVoltage.stage.peak",
    defaultMessage: "Peak",
  },
  repolarizationLabel: {
    id: "learningBlock.actionPotentialVoltage.stage.repolarization",
    defaultMessage: "Repolarization",
  },
  hyperpolarizationLabel: {
    id: "learningBlock.actionPotentialVoltage.stage.hyperpolarization",
    defaultMessage: "Hyperpolarization",
  },
  returnToRestLabel: {
    id: "learningBlock.actionPotentialVoltage.stage.returnToRest",
    defaultMessage: "Return to resting potential",
  },
  stableStatus: {
    id: "learningBlock.actionPotentialVoltage.status.stable",
    defaultMessage: "stable",
  },
  risingStatus: {
    id: "learningBlock.actionPotentialVoltage.status.rising",
    defaultMessage: "rising",
  },
  fallingStatus: {
    id: "learningBlock.actionPotentialVoltage.status.falling",
    defaultMessage: "falling",
  },
  belowRestStatus: {
    id: "learningBlock.actionPotentialVoltage.status.belowRest",
    defaultMessage: "below rest",
  },
  restingPotentialCaption: {
    id: "learningBlock.actionPotentialVoltage.caption.restingPotential",
    defaultMessage: "The membrane voltage is steady at its resting level.",
  },
  thresholdCaption: {
    id: "learningBlock.actionPotentialVoltage.caption.threshold",
    defaultMessage: "The membrane reaches threshold and begins to rise.",
  },
  depolarizationCaption: {
    id: "learningBlock.actionPotentialVoltage.caption.depolarization",
    defaultMessage:
      "Sodium enters the neuron, making the membrane voltage rise quickly.",
  },
  peakCaption: {
    id: "learningBlock.actionPotentialVoltage.caption.peak",
    defaultMessage: "Sodium entry stops and potassium begins to leave.",
  },
  repolarizationCaption: {
    id: "learningBlock.actionPotentialVoltage.caption.repolarization",
    defaultMessage:
      "Potassium leaves the neuron, making the membrane voltage fall.",
  },
  hyperpolarizationCaption: {
    id: "learningBlock.actionPotentialVoltage.caption.hyperpolarization",
    defaultMessage:
      "Continued potassium loss briefly lowers the voltage below rest.",
  },
  returnToRestCaption: {
    id: "learningBlock.actionPotentialVoltage.caption.returnToRest",
    defaultMessage: "The membrane voltage returns to its resting level.",
  },
});
const stages: Stage[] = [
  {
    id: "resting-potential",
    label: messages.restingPotentialLabel,
    status: messages.stableStatus,
    caption: messages.restingPotentialCaption,
    representativeVoltage: -70,
    point: { x: 0.8, y: -70 },
    traceStartIndex: 0,
    traceEndIndex: 4,
  },
  {
    id: "threshold",
    label: messages.thresholdLabel,
    status: messages.risingStatus,
    caption: messages.thresholdCaption,
    representativeVoltage: -55,
    point: { x: 2.3, y: -55 },
    traceStartIndex: 4,
    traceEndIndex: 9,
  },
  {
    id: "depolarization",
    label: messages.depolarizationLabel,
    status: messages.risingStatus,
    caption: messages.depolarizationCaption,
    representativeVoltage: -5,
    point: { x: 2.6, y: -5 },
    traceStartIndex: 7,
    traceEndIndex: 15,
  },
  {
    id: "peak",
    label: messages.peakLabel,
    status: messages.stableStatus,
    caption: messages.peakCaption,
    representativeVoltage: 40,
    point: { x: 3, y: 40 },
    traceStartIndex: 13,
    traceEndIndex: 17,
  },
  {
    id: "repolarization",
    label: messages.repolarizationLabel,
    status: messages.fallingStatus,
    caption: messages.repolarizationCaption,
    representativeVoltage: -20,
    point: { x: 3.6, y: -20 },
    traceStartIndex: 15,
    traceEndIndex: 23,
  },
  {
    id: "hyperpolarization",
    label: messages.hyperpolarizationLabel,
    status: messages.belowRestStatus,
    caption: messages.hyperpolarizationCaption,
    representativeVoltage: -85,
    point: { x: 5, y: -85 },
    traceStartIndex: 22,
    traceEndIndex: 29,
  },
  {
    id: "return-to-rest",
    label: messages.returnToRestLabel,
    status: messages.risingStatus,
    caption: messages.returnToRestCaption,
    representativeVoltage: -76,
    point: { x: 5.8, y: -76 },
    traceStartIndex: 26,
    traceEndIndex: 35,
  },
];
const control = { min: 1, max: stages.length, step: 1, defaultValue: 1 };
const normalize = (input: { stage?: number | null }) => ({
  stage: Math.min(
    Math.max(
      Number.isFinite(input.stage)
        ? Math.round(Number(input.stage))
        : control.defaultValue,
      control.min,
    ),
    control.max,
  ),
});
const derive = (input: { stage?: number | null }) => {
  const safeValues = normalize(input),
    activeStage = stages[safeValues.stage - control.min];
  if (!activeStage)
    throw Error("Action-potential model is missing its active stage.");
  return {
    safeValues,
    activeStage,
    activeTrace: voltageTrace.slice(
      activeStage.traceStartIndex,
      activeStage.traceEndIndex,
    ),
  };
};
const label = (stage: Stage, formatter: Formatter) =>
  formatter.formatMessage(stage.label);
const status = (stage: Stage, formatter: Formatter) =>
  formatter.formatMessage(stage.status);
const caption = (stage: Stage, formatter: Formatter) =>
  formatter.formatMessage(stage.caption);
function initializeModel(): void {
  initializeAppShared();
}
export {
  label as a,
  normalize as c,
  caption as i,
  voltageTrace as n,
  status as o,
  derive as r,
  initializeModel as s,
  control as t,
};
