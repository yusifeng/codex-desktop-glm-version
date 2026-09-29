// Stage labels and explanations for municipal wastewater treatment.
import "@rchunk/rolldown-runtime";

interface WastewaterValues { stageIndex?: number | null }
interface MessageFormatter { formatMessage(descriptor: { id: string; defaultMessage: string }): string }

const wastewaterStageControl = { min: 0, max: 5, step: 1, defaultValue: 0 };
const normalizeWastewaterValues = (values: WastewaterValues) => {
  const stageIndex = typeof values.stageIndex === "number" && Number.isFinite(values.stageIndex) ? Math.round(values.stageIndex) : wastewaterStageControl.defaultValue;
  return { stageIndex: Math.min(wastewaterStageControl.max, Math.max(wastewaterStageControl.min, stageIndex)) };
};
const wastewaterStageTitle = (formatter: MessageFormatter, stageIndex: number): string => {
  switch (stageIndex) {
    case 0: return formatter.formatMessage({ id: "learningBlock.wastewaterTreatment.stage.screening.title", defaultMessage: "Screening and grit removal" });
    case 1: return formatter.formatMessage({ id: "learningBlock.wastewaterTreatment.stage.primary.title", defaultMessage: "Primary settling" });
    case 2: return formatter.formatMessage({ id: "learningBlock.wastewaterTreatment.stage.aeration.title", defaultMessage: "Biological aeration" });
    case 3: return formatter.formatMessage({ id: "learningBlock.wastewaterTreatment.stage.clarification.title", defaultMessage: "Secondary clarification" });
    case 4: return formatter.formatMessage({ id: "learningBlock.wastewaterTreatment.stage.final.title", defaultMessage: "Final polishing and disinfection" });
    default: return formatter.formatMessage({ id: "learningBlock.wastewaterTreatment.stage.outcomes.title", defaultMessage: "Effluent and sludge outcomes" });
  }
};
const wastewaterStageSentence = (formatter: MessageFormatter, stageIndex: number): string => {
  switch (stageIndex) {
    case 0: return formatter.formatMessage({ id: "learningBlock.wastewaterTreatment.stage.screening.sentence", defaultMessage: "Screens and grit removal take out debris, sand, and stones; fines continue." });
    case 1: return formatter.formatMessage({ id: "learningBlock.wastewaterTreatment.stage.primary.sentence", defaultMessage: "Heavy solids settle, floating material is skimmed, and dissolved organics continue." });
    case 2: return formatter.formatMessage({ id: "learningBlock.wastewaterTreatment.stage.aeration.sentence", defaultMessage: "Air helps microbes consume biodegradable organics and form settleable flocs." });
    case 3: return formatter.formatMessage({ id: "learningBlock.wastewaterTreatment.stage.clarification.sentence", defaultMessage: "Flocs settle; some return to aeration and the excess becomes waste sludge." });
    case 4: return formatter.formatMessage({ id: "learningBlock.wastewaterTreatment.stage.final.sentence", defaultMessage: "Final treatment removes fines or nutrients and reduces pathogens." });
    default: return formatter.formatMessage({ id: "learningBlock.wastewaterTreatment.stage.outcomes.sentence", defaultMessage: "Effluent can be discharged or reused, not drunk; separated solids need treatment." });
  }
};

function initializeWastewaterTreatmentModel(): void {}

export { normalizeWastewaterValues as a, initializeWastewaterTreatmentModel as i, wastewaterStageSentence as n, wastewaterStageTitle as r, wastewaterStageControl as t };
