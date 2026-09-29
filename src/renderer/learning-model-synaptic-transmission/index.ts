// Seven-stage synaptic-transmission learning model.
import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";

interface StageValues { stage?: number | null } interface MessageDescriptor { id: string; defaultMessage: string } interface MessageFormatter { formatMessage(descriptor: MessageDescriptor): string }
const synapticStageControl = { min: 0, max: 6, step: 1, defaultValue: 0 };
const synapticStages = [
  { id: "resting", label: { id: "learningBlock.synapticTransmission.stage.resting.label", defaultMessage: "Synapse is ready" }, summary: { id: "learningBlock.synapticTransmission.stage.resting.summary", defaultMessage: "The sending cell has neurotransmitter ready to release." } },
  { id: "action-potential", label: { id: "learningBlock.synapticTransmission.stage.actionPotential.label", defaultMessage: "Signal arrives" }, summary: { id: "learningBlock.synapticTransmission.stage.actionPotential.summary", defaultMessage: "An electrical signal reaches the sending cell." } },
  { id: "calcium", label: { id: "learningBlock.synapticTransmission.stage.calcium.label", defaultMessage: "Calcium enters" }, summary: { id: "learningBlock.synapticTransmission.stage.calcium.summary", defaultMessage: "The signal opens channels that let calcium enter the sending cell." } },
  { id: "fusion", label: { id: "learningBlock.synapticTransmission.stage.fusion.label", defaultMessage: "Neurotransmitter is released" }, summary: { id: "learningBlock.synapticTransmission.stage.fusion.summary", defaultMessage: "Calcium causes a vesicle to release neurotransmitter." } },
  { id: "diffusion", label: { id: "learningBlock.synapticTransmission.stage.diffusion.label", defaultMessage: "Message crosses the gap" }, summary: { id: "learningBlock.synapticTransmission.stage.diffusion.summary", defaultMessage: "Neurotransmitter carries the message across the gap between cells." } },
  { id: "receptor", label: { id: "learningBlock.synapticTransmission.stage.receptor.label", defaultMessage: "Receptors activate" }, summary: { id: "learningBlock.synapticTransmission.stage.receptor.summary", defaultMessage: "Neurotransmitter binds to receptors on the receiving cell." } },
  { id: "response", label: { id: "learningBlock.synapticTransmission.stage.response.label", defaultMessage: "Receiving cell responds" }, summary: { id: "learningBlock.synapticTransmission.stage.response.summary", defaultMessage: "The activated receptors start a new response in the receiving cell." } },
] as const;
const normalizeSynapticStage = (values: StageValues) => ({ stage: Math.min(synapticStageControl.max, Math.max(synapticStageControl.min, Math.round(typeof values.stage === "number" && Number.isFinite(values.stage) ? values.stage : synapticStageControl.defaultValue))) });
const deriveSynapticStage = (values: StageValues) => { const safeValues = normalizeSynapticStage(values); return { safeValues, activeStage: synapticStages[safeValues.stage] }; };
const formatSynapticLabel = (stage: (typeof synapticStages)[number], formatter: MessageFormatter): string => formatter.formatMessage(stage.label);
const formatSynapticSummary = (stage: (typeof synapticStages)[number], formatter: MessageFormatter): string => formatter.formatMessage(stage.summary);
function initializeSynapticTransmission(): void {}
export { initializeSynapticTransmission as a, formatSynapticSummary as i, deriveSynapticStage as n, normalizeSynapticStage as o, formatSynapticLabel as r, synapticStageControl as t };
