// Beta-oxidation reaction-cycle learning model.
import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";

interface StepValues { stepIndex?: number | null } interface MessageDescriptor { id: string; defaultMessage: string } interface MessageFormatter { formatMessage(descriptor: MessageDescriptor): string }
const betaOxidationControl = { min: 0, max: 4, step: 1, defaultValue: 0 };
const betaOxidationSteps = [
  { key: "start", label: { id: "learningBlock.betaOxidationCycle.step.start", defaultMessage: "Starting molecule" }, caption: { id: "learningBlock.betaOxidationCycle.caption.start", defaultMessage: "A saturated fatty acyl-CoA enters the cycle with its beta carbon two bonds from the CoA end." }, completedReactions: 0, hasFadh2: false, hasNadh: false, hasAcetylCoa: false },
  { key: "fadOxidation", label: { id: "learningBlock.betaOxidationCycle.step.fadOxidation", defaultMessage: "First oxidation" }, caption: { id: "learningBlock.betaOxidationCycle.caption.fadOxidation", defaultMessage: "FAD accepts electrons as a double bond forms between the alpha and beta carbons." }, completedReactions: 1, hasFadh2: true, hasNadh: false, hasAcetylCoa: false },
  { key: "hydration", label: { id: "learningBlock.betaOxidationCycle.step.hydration", defaultMessage: "Hydration" }, caption: { id: "learningBlock.betaOxidationCycle.caption.hydration", defaultMessage: "Water adds across the double bond, placing OH on the beta carbon." }, completedReactions: 2, hasFadh2: true, hasNadh: false, hasAcetylCoa: false },
  { key: "nadOxidation", label: { id: "learningBlock.betaOxidationCycle.step.nadOxidation", defaultMessage: "Second oxidation" }, caption: { id: "learningBlock.betaOxidationCycle.caption.nadOxidation", defaultMessage: "NAD⁺ accepts electrons as the beta-carbon OH becomes a carbonyl." }, completedReactions: 3, hasFadh2: true, hasNadh: true, hasAcetylCoa: false },
  { key: "thiolysis", label: { id: "learningBlock.betaOxidationCycle.step.thiolysis", defaultMessage: "Thiolysis" }, caption: { id: "learningBlock.betaOxidationCycle.caption.thiolysis", defaultMessage: "CoA-SH splits the bond between the alpha and beta carbons, releasing acetyl-CoA and a chain shortened by two carbons." }, completedReactions: 4, hasFadh2: true, hasNadh: true, hasAcetylCoa: true },
] as const;
const normalizeBetaOxidationValues = (values: StepValues) => ({ stepIndex: Math.min(betaOxidationControl.max, Math.max(betaOxidationControl.min, Math.round(Number.isFinite(values.stepIndex) ? Number(values.stepIndex) : betaOxidationControl.defaultValue))) });
const deriveBetaOxidationStep = (values: StepValues) => { const safeValues = normalizeBetaOxidationValues(values); return { safeValues, activeStep: betaOxidationSteps[safeValues.stepIndex] }; };
const formatMessage = (descriptor: MessageDescriptor, formatter?: MessageFormatter): string => formatter ? formatter.formatMessage(descriptor) : descriptor.defaultMessage;
const formatBetaOxidationLabel = (step: (typeof betaOxidationSteps)[number], formatter?: MessageFormatter): string => formatMessage(step.label, formatter);
const formatBetaOxidationCaption = (values: StepValues, formatter?: MessageFormatter): string => formatMessage(deriveBetaOxidationStep(values).activeStep.caption, formatter);
function initializeBetaOxidationModel(): void {}
export { initializeBetaOxidationModel as a, formatBetaOxidationLabel as i, deriveBetaOxidationStep as n, normalizeBetaOxidationValues as o, formatBetaOxidationCaption as r, betaOxidationControl as t };
