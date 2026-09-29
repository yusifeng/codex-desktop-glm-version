// Immune-cell phagocytosis stage learning model.
import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";

interface StageValues { stage?: number | null } interface MessageDescriptor { id: string; defaultMessage: string } interface MessageFormatter { formatMessage(descriptor: MessageDescriptor): string }
const phagocytosisStageControl = { min: 1, max: 5, step: 1, defaultValue: 1 };
const phagocytosisStages = [
  { id: "recognition", label: { id: "learningBlock.immuneCellPhagocytosis.stage.recognition", defaultMessage: "Recognition" }, caption: { id: "learningBlock.immuneCellPhagocytosis.caption.recognition", defaultMessage: "Recognition: receptors bind the pathogen." } },
  { id: "cup", label: { id: "learningBlock.immuneCellPhagocytosis.stage.cup", defaultMessage: "Membrane wrapping" }, caption: { id: "learningBlock.immuneCellPhagocytosis.caption.cup", defaultMessage: "Membrane wrapping: the cell surrounds it." } },
  { id: "phagosome", label: { id: "learningBlock.immuneCellPhagocytosis.stage.phagosome", defaultMessage: "Sealed phagosome" }, caption: { id: "learningBlock.immuneCellPhagocytosis.caption.phagosome", defaultMessage: "Sealed phagosome: a vesicle encloses it." } },
  { id: "fusion", label: { id: "learningBlock.immuneCellPhagocytosis.stage.fusion", defaultMessage: "Lysosome fusion" }, caption: { id: "learningBlock.immuneCellPhagocytosis.caption.fusion", defaultMessage: "Lysosome fusion: the compartments merge." } },
  { id: "digestion", label: { id: "learningBlock.immuneCellPhagocytosis.stage.digestion", defaultMessage: "Digestion" }, caption: { id: "learningBlock.immuneCellPhagocytosis.caption.digestion", defaultMessage: "Digestion: enzymes break down the pathogen." } },
] as const;
const normalizePhagocytosisStage = (values: StageValues) => ({ stage: Math.min(phagocytosisStageControl.max, Math.max(phagocytosisStageControl.min, Number.isFinite(values.stage) ? Math.round(Number(values.stage)) : phagocytosisStageControl.defaultValue)) });
const derivePhagocytosisStage = (values: StageValues) => { const safeValues = normalizePhagocytosisStage(values); return { safeValues, activeStage: phagocytosisStages[safeValues.stage - 1] }; };
const formatMessage = (descriptor: MessageDescriptor, formatter?: MessageFormatter): string => formatter ? formatter.formatMessage(descriptor) : descriptor.defaultMessage;
const formatPhagocytosisLabel = (stage: (typeof phagocytosisStages)[number], formatter?: MessageFormatter): string => formatMessage(stage.label, formatter);
const formatPhagocytosisCaption = (stage: (typeof phagocytosisStages)[number], formatter?: MessageFormatter): string => formatMessage(stage.caption, formatter);
function initializePhagocytosisModel(): void {}
export { initializePhagocytosisModel as a, formatPhagocytosisLabel as i, derivePhagocytosisStage as n, normalizePhagocytosisStage as o, formatPhagocytosisCaption as r, phagocytosisStageControl as t };
