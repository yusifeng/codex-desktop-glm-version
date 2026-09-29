// Decision-tree classification-path learning model.
import "@rchunk/rolldown-runtime";

interface DecisionTreeValues { x1?: number | null; x2?: number | null }
interface DecisionStep { nodeId: string; test: string; outcome: boolean }

const decisionTreeType = "DECISION_TREE_CLASSIFICATION_PATH";
const decisionTreeThumbnail = "decision-tree-classification-path-v1";
const decisionTreeParameters = {
  x1: { kind: "number", defaultValue: 5.5, min: 0, max: 10 },
  x2: { kind: "number", defaultValue: 3.5, min: 0, max: 10 },
};
const decisionTreeDefinition = { type: decisionTreeType, version: 1, thumbnailAssetKey: decisionTreeThumbnail, parameters: decisionTreeParameters };
const x1Parameter = decisionTreeDefinition.parameters.x1;
const x2Parameter = decisionTreeDefinition.parameters.x2;
const decisionTreeControls = {
  x1: { min: x1Parameter.min, max: x1Parameter.max, step: 0.1, defaultValue: x1Parameter.defaultValue },
  x2: { min: x2Parameter.min, max: x2Parameter.max, step: 0.1, defaultValue: x2Parameter.defaultValue },
};
const decisionThresholds = { lowX1: 4, highX2: 6, highX1: 7 };
const defaultDecisionTreeValues = { x1: decisionTreeControls.x1.defaultValue, x2: decisionTreeControls.x2.defaultValue };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const normalizeFeature = (value: number | null | undefined, control: { min: number; max: number; defaultValue: number }): number =>
  clamp(Number.isFinite(value) ? value as number : control.defaultValue, control.min, control.max);
const normalizeDecisionTreeValues = (values: DecisionTreeValues) => ({
  x1: normalizeFeature(values.x1, decisionTreeControls.x1),
  x2: normalizeFeature(values.x2, decisionTreeControls.x2),
});
const createClassificationResult = (record: { x1: number; x2: number }, classLabel: "A" | "B", leafId: string, steps: DecisionStep[]) => ({
  record, classLabel, leafId, regionId: leafId, steps, visitedNodeIds: steps.map((step) => step.nodeId),
});

function classifyDecisionTreeRecord(values: DecisionTreeValues) {
  const record = normalizeDecisionTreeValues(values);
  const lowX1: DecisionStep = { nodeId: "x1-low", test: "x1 < 4", outcome: record.x1 < decisionThresholds.lowX1 };
  if (lowX1.outcome) return createClassificationResult(record, "A", "left-a", [lowX1]);
  const highX2: DecisionStep = { nodeId: "x2-high", test: "x2 > 6", outcome: record.x2 > decisionThresholds.highX2 };
  if (highX2.outcome) return createClassificationResult(record, "A", "upper-a", [lowX1, highX2]);
  const highX1: DecisionStep = { nodeId: "x1-high", test: "x1 > 7", outcome: record.x1 > decisionThresholds.highX1 };
  return highX1.outcome
    ? createClassificationResult(record, "A", "right-a", [lowX1, highX2, highX1])
    : createClassificationResult(record, "B", "center-b", [lowX1, highX2, highX1]);
}
const formatDecisionValue = (value: number): string => value.toFixed(1).replace(/\.0$/, "");

function initializeDecisionTreeSchema(): void {}
function initializeDecisionTreeModel(): void {}

export {
  formatDecisionValue as a,
  initializeDecisionTreeSchema as c,
  classifyDecisionTreeRecord as i,
  decisionTreeDefinition as l,
  decisionTreeControls as n,
  initializeDecisionTreeModel as o,
  decisionThresholds as r,
  normalizeDecisionTreeValues as s,
  defaultDecisionTreeValues as t,
};
