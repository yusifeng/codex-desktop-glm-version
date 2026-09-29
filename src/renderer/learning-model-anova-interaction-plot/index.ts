// Two-factor ANOVA interaction-plot teaching model. Release chunk: model-18f5968002b2.js.
import "@rchunk/rolldown-runtime";

type InteractionPattern = "no-interaction" | "non-crossover-interaction" | "crossover-interaction";
interface InteractionPlotInput { initial_pattern?: string }

const anovaInteractionDefinition = {
  type: "ANOVA_INTERACTION_PLOT",
  version: 1,
  thumbnailAssetKey: "anova-interaction-plot-v1",
  parameters: { initial_pattern: { kind: "enum", defaultValue: "no-interaction", allowedValues: ["no-interaction", "non-crossover-interaction", "crossover-interaction"] } },
} as const;
const interactionPatterns: Record<InteractionPattern, { b1: [number, number]; b2: [number, number] }> = {
  "no-interaction": { b1: [28, 52], b2: [52, 76] },
  "non-crossover-interaction": { b1: [28, 42], b2: [52, 82] },
  "crossover-interaction": { b1: [28, 76], b2: [72, 36] },
};
const isInteractionPattern = (value: string): value is InteractionPattern => value in interactionPatterns;
const defaultInteractionPattern: InteractionPattern = isInteractionPattern(anovaInteractionDefinition.parameters.initial_pattern.defaultValue) ? anovaInteractionDefinition.parameters.initial_pattern.defaultValue : "no-interaction";
const allowedInteractionPatterns = anovaInteractionDefinition.parameters.initial_pattern.allowedValues.filter(isInteractionPattern);
const normalizeInteractionPlotInput = (input: InteractionPlotInput) => ({ initial_pattern: typeof input.initial_pattern === "string" && isInteractionPattern(input.initial_pattern) ? input.initial_pattern : defaultInteractionPattern });
const calculateInteractionPlot = (input: InteractionPlotInput) => {
  const { initial_pattern: pattern } = normalizeInteractionPlotInput(input);
  const { b1, b2 } = interactionPatterns[pattern];
  return { pattern, b1, b2, simpleEffectB1: b1[1] - b1[0], simpleEffectB2: b2[1] - b2[0] };
};
function initializeAnovaInteractionDefinition(): void {}
function initializeAnovaInteractionModel(): void {}

export { initializeAnovaInteractionDefinition as a, initializeAnovaInteractionModel as i, allowedInteractionPatterns as n, anovaInteractionDefinition as o, calculateInteractionPlot as r, defaultInteractionPattern as t };
