// Five-stage virus life-cycle learning model with localized descriptions.
import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";

interface StageValues { stage?: number | null } interface MessageDescriptor { id: string; defaultMessage: string } interface MessageFormatter { formatMessage(descriptor: MessageDescriptor): string }
const virusStageControl = { min: 1, max: 5, step: 1, defaultValue: 1 };
const virusStages = [
  { id: "attach", label: { id: "learningBlock.virusLifeCycle.stage.attach", defaultMessage: "Attach" }, summary: { id: "learningBlock.virusLifeCycle.summary.attach", defaultMessage: "A virus first binds to the host cell surface." } },
  { id: "enter", label: { id: "learningBlock.virusLifeCycle.stage.enter", defaultMessage: "Enter" }, summary: { id: "learningBlock.virusLifeCycle.summary.enter", defaultMessage: "The virus enters the host cell before copying begins." } },
  { id: "copy", label: { id: "learningBlock.virusLifeCycle.stage.copy", defaultMessage: "Copy" }, summary: { id: "learningBlock.virusLifeCycle.summary.copy", defaultMessage: "The cell is used to make viral genomes and parts." } },
  { id: "assemble", label: { id: "learningBlock.virusLifeCycle.stage.assemble", defaultMessage: "Assemble" }, summary: { id: "learningBlock.virusLifeCycle.summary.assemble", defaultMessage: "New virus particles are put together inside the cell." } },
  { id: "release", label: { id: "learningBlock.virusLifeCycle.stage.release", defaultMessage: "Release" }, summary: { id: "learningBlock.virusLifeCycle.summary.release", defaultMessage: "Many newly made viruses spread away from the infected cell." } },
] as const;
const normalizeVirusStage = (values: StageValues) => ({ stage: Math.min(virusStageControl.max, Math.max(virusStageControl.min, Math.round(Number.isFinite(values.stage) ? Number(values.stage) : virusStageControl.defaultValue))) });
const deriveVirusLifeCycle = (values: StageValues) => { const safeValues = normalizeVirusStage(values); return { safeValues, activeStage: virusStages[safeValues.stage - 1] }; };
const findVirusStage = (id: string) => { const stage = virusStages.find((candidate) => candidate.id === id); if (!stage) throw Error("Unknown virus life-cycle stage: " + id); return stage; };
const formatMessage = (descriptor: MessageDescriptor, formatter?: MessageFormatter): string => formatter ? formatter.formatMessage(descriptor) : descriptor.defaultMessage;
const formatVirusStageLabel = (id: string, formatter?: MessageFormatter): string => formatMessage(findVirusStage(id).label, formatter);
const formatVirusStageSummary = (id: string, formatter?: MessageFormatter): string => formatMessage(findVirusStage(id).summary, formatter);
const formatVirusStageDescription = (values: StageValues, formatter?: MessageFormatter): string => { const { activeStage } = deriveVirusLifeCycle(values); const label = formatVirusStageLabel(activeStage.id, formatter); const summary = formatVirusStageSummary(activeStage.id, formatter); return summary ? label + "\n" + summary : label; };
function initializeVirusLifeCycle(): void {}
export { formatVirusStageSummary as a, formatVirusStageLabel as i, formatVirusStageDescription as n, initializeVirusLifeCycle as o, deriveVirusLifeCycle as r, normalizeVirusStage as s, virusStageControl as t };
