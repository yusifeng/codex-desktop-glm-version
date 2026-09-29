// Endocrine-feedback-axis learning model for thyroid and adrenal axes.
import "@rchunk/rolldown-runtime";

type EndocrineAxis = "thyroid" | "adrenal";
type HormoneState = "low" | "normal" | "high";
interface EndocrineFeedbackValues { axis?: string | null; hormoneState?: string | null }

const endocrineFeedbackType = "ENDOCRINE_FEEDBACK_AXIS";
const endocrineFeedbackThumbnail = "endocrine-feedback-axis-v1";
const endocrineFeedbackParameters = { axis: { kind: "enum", defaultValue: "thyroid" as EndocrineAxis, allowedValues: ["thyroid", "adrenal"] as EndocrineAxis[] } };
const endocrineFeedbackDefinition = { type: endocrineFeedbackType, version: 3, thumbnailAssetKey: endocrineFeedbackThumbnail, parameters: endocrineFeedbackParameters };
const endocrineAxes = endocrineFeedbackDefinition.parameters.axis.allowedValues;
const hormoneStates: HormoneState[] = ["low", "normal", "high"];
const hormoneStateControl = { min: 0, max: hormoneStates.length - 1, step: 1, defaultValue: "normal" as HormoneState };
const defaultEndocrineAxis = endocrineFeedbackDefinition.parameters.axis.defaultValue;
const hormoneStateToIndex = (state: string): number => hormoneStates.indexOf(state as HormoneState);
const indexToHormoneState = (index: number): HormoneState => hormoneStates[Math.min(Math.max(Math.round(index), 0), hormoneStates.length - 1)] ?? hormoneStateControl.defaultValue;
const isEndocrineAxis = (value: string): value is EndocrineAxis => endocrineAxes.includes(value as EndocrineAxis);
const isHormoneState = (value: string): value is HormoneState => hormoneStates.includes(value as HormoneState);
const normalizeEndocrineFeedbackValues = (values: EndocrineFeedbackValues) => ({
  axis: isEndocrineAxis(values.axis ?? "") ? values.axis as EndocrineAxis : defaultEndocrineAxis,
  hormoneState: isHormoneState(values.hormoneState ?? "") ? values.hormoneState as HormoneState : hormoneStateControl.defaultValue,
});

function deriveEndocrineFeedbackState(values: EndocrineFeedbackValues) {
  const { axis, hormoneState } = normalizeEndocrineFeedbackValues(values);
  const axisLabels = axis === "thyroid"
    ? { releasingHormone: "TRH", tropicHormone: "TSH", targetGland: "Thyroid gland", finalHormone: "T3/T4" }
    : { releasingHormone: "CRH", tropicHormone: "ACTH", targetGland: "Adrenal cortex", finalHormone: "Cortisol" };
  const feedback = hormoneState === "low"
    ? { upstreamDirection: "up", feedbackDirection: "weak", upstreamLevel: 3, feedbackLevel: 1 }
    : hormoneState === "high"
      ? { upstreamDirection: "down", feedbackDirection: "strong", upstreamLevel: 1, feedbackLevel: 3 }
      : { upstreamDirection: "normal", feedbackDirection: "normal", upstreamLevel: 2, feedbackLevel: 2 };
  return { axis, hormoneState, ...axisLabels, ...feedback };
}

function initializeEndocrineFeedbackSchema(): void {}
function initializeEndocrineFeedbackModel(): void {}

export {
  hormoneStateToIndex as a,
  endocrineFeedbackDefinition as c,
  indexToHormoneState as i,
  hormoneStateControl as n,
  initializeEndocrineFeedbackModel as o,
  deriveEndocrineFeedbackState as r,
  initializeEndocrineFeedbackSchema as s,
  defaultEndocrineAxis as t,
};
