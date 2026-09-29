// Electrocardiogram waveform-parts learning model.
import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";

interface StageValues { stage?: number | null } interface MessageDescriptor { id: string; defaultMessage: string } interface MessageFormatter { formatMessage(descriptor: MessageDescriptor): string }
const ekgStages = [
  { id: "p-wave", label: { id: "learningBlock.ekgParts.stage.pWave", defaultMessage: "P wave" }, subtitle: { id: "learningBlock.ekgParts.subtitle.pWave", defaultMessage: "Signal spreads through the atria" }, segment: "M 98 90 C 108 90 112 70 126 70 C 140 70 144 90 154 90", point: { x: 126, y: 70 }, activation: "atria" },
  { id: "pr-segment", label: { id: "learningBlock.ekgParts.stage.prSegment", defaultMessage: "PR segment" }, subtitle: { id: "learningBlock.ekgParts.subtitle.prSegment", defaultMessage: "Signal pauses briefly at the AV node" }, segment: "M 154 90 L 220 90", point: { x: 187, y: 90 }, activation: "av-node" },
  { id: "qrs-complex", label: { id: "learningBlock.ekgParts.stage.qrs", defaultMessage: "QRS complex" }, subtitle: { id: "learningBlock.ekgParts.subtitle.qrs", defaultMessage: "Signal spreads through the ventricles" }, segment: "M 220 90 L 232 102 L 250 30 L 266 126 L 282 90", point: { x: 250, y: 30 }, activation: "ventricles" },
  { id: "st-segment", label: { id: "learningBlock.ekgParts.stage.stSegment", defaultMessage: "ST segment" }, subtitle: { id: "learningBlock.ekgParts.subtitle.stSegment", defaultMessage: "Ventricles stay electrically active" }, segment: "M 282 90 L 384 90", point: { x: 333, y: 90 }, activation: "ventricles-hold" },
  { id: "t-wave", label: { id: "learningBlock.ekgParts.stage.tWave", defaultMessage: "T wave" }, subtitle: { id: "learningBlock.ekgParts.subtitle.tWave", defaultMessage: "Ventricles electrically reset" }, segment: "M 384 90 C 405 90 416 55 440 55 C 464 55 475 90 496 90", point: { x: 440, y: 55 }, activation: "ventricles-reset" },
  { id: "tp-segment", label: { id: "learningBlock.ekgParts.stage.tpSegment", defaultMessage: "TP segment" }, subtitle: { id: "learningBlock.ekgParts.subtitle.tpSegment", defaultMessage: "Electrical baseline between beats" }, segment: "M 496 90 L 606 90", point: { x: 551, y: 90 }, activation: "rest" },
] as const;
const ekgStageControl = { min: 1, max: 6, step: 1, defaultValue: 1 };
const normalizeEkgStage = (values: StageValues) => ({ stage: Math.min(ekgStageControl.max, Math.max(ekgStageControl.min, Number.isFinite(values.stage) ? Math.round(Number(values.stage)) : ekgStageControl.defaultValue)) });
const deriveEkgStage = (values: StageValues) => { const safeValues = normalizeEkgStage(values); return { safeValues, activeStage: ekgStages[safeValues.stage - ekgStageControl.min] }; };
const formatEkgLabel = (stage: (typeof ekgStages)[number], formatter: MessageFormatter): string => formatter.formatMessage(stage.label);
const formatEkgSubtitle = (stage: (typeof ekgStages)[number], formatter: MessageFormatter): string => formatter.formatMessage(stage.subtitle);
const formatEkgDescription = (values: StageValues, formatter: MessageFormatter): string => { const { activeStage } = deriveEkgStage(values); return formatEkgLabel(activeStage, formatter) + ": " + formatEkgSubtitle(activeStage, formatter) + "."; };
function initializeEkgModel(): void {}
export { formatEkgSubtitle as a, formatEkgLabel as i, formatEkgDescription as n, initializeEkgModel as o, deriveEkgStage as r, normalizeEkgStage as s, ekgStageControl as t };
