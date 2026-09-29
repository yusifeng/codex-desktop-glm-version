// Positive-feedback-loop model: step through childbirth and ice-albedo examples.
import "@rchunk/rolldown-runtime";

type FeedbackExample = "childbirth" | "ice-albedo";
interface FeedbackInput { example?: string | null; step?: number | null }

const positiveFeedbackSchema = { type: "POSITIVE_FEEDBACK_LOOP", version: 2, thumbnailAssetKey: "positive-feedback-loop-v3", parameters: { example: { kind: "enum", defaultValue: "childbirth" as FeedbackExample, allowedValues: ["childbirth", "ice-albedo"] as const } } };
const feedbackExamples = positiveFeedbackSchema.parameters.example.allowedValues;
const exampleControl = { min: 0, max: feedbackExamples.length - 1, step: 1, defaultValue: positiveFeedbackSchema.parameters.example.defaultValue };
const stepControl = { min: 0, max: 3, step: 1, defaultValue: 0 };
const exampleFromIndex = (index: number): FeedbackExample => feedbackExamples[Math.min(Math.max(Math.round(index), 0), feedbackExamples.length - 1)] ?? exampleControl.defaultValue;
const exampleToIndex = (example: string): number => Math.max(0, feedbackExamples.indexOf(example as FeedbackExample));
const normalizeFeedbackInput = (input: FeedbackInput) => ({
  example: feedbackExamples.includes((input.example ?? "") as FeedbackExample) ? input.example as FeedbackExample : exampleControl.defaultValue,
  step: Math.min(Math.max(Math.round(input.step ?? stepControl.defaultValue), stepControl.min), stepControl.max),
});
function initializePositiveFeedbackSchema(): void {}
function initializePositiveFeedbackModel(): void {}

export { initializePositiveFeedbackModel as a, positiveFeedbackSchema as c, exampleToIndex as i, stepControl as n, normalizeFeedbackInput as o, exampleFromIndex as r, initializePositiveFeedbackSchema as s, exampleControl as t };
