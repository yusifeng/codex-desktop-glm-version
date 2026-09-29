// Two-input Boolean truth-table learning model.
import "@rchunk/rolldown-runtime";

type BooleanOperator = "AND" | "OR" | "XOR" | "XNOR";
interface TruthTableValues { inputA?: unknown; inputB?: unknown; operator?: unknown }

const booleanTruthTableType = "BOOLEAN_TRUTH_TABLE";
const booleanTruthTableThumbnail = "boolean-truth-table-v1";
const booleanTruthTableParameters = {
  inputA: { kind: "boolean", defaultValue: true },
  inputB: { kind: "boolean", defaultValue: true },
  operator: { kind: "enum", defaultValue: "OR" as BooleanOperator, allowedValues: ["AND", "OR", "XOR", "XNOR"] as BooleanOperator[] },
};
const booleanTruthTableDefinition = { type: booleanTruthTableType, version: 1, thumbnailAssetKey: booleanTruthTableThumbnail, parameters: booleanTruthTableParameters };
const isBooleanOperator = (value: unknown): value is BooleanOperator => typeof value === "string" && booleanTruthTableDefinition.parameters.operator.allowedValues.some((operator) => operator === value);
const getDefaultOperator = (): BooleanOperator => {
  const defaultOperator = booleanTruthTableDefinition.parameters.operator.defaultValue;
  if (!isBooleanOperator(defaultOperator)) throw Error("Invalid default operator in boolean truth table manifest");
  return defaultOperator;
};
const booleanOperators = booleanTruthTableDefinition.parameters.operator.allowedValues.filter(isBooleanOperator);
const defaultTruthTableValues = { inputA: booleanTruthTableDefinition.parameters.inputA.defaultValue, inputB: booleanTruthTableDefinition.parameters.inputB.defaultValue, operator: getDefaultOperator() };
const truthTableInputs = [[0, 0], [0, 1], [1, 0], [1, 1]] as const;
const toBit = (value: boolean): number => +value;
const evaluateBooleanOperator = (operator: BooleanOperator, inputA: number, inputB: number): number => {
  switch (operator) {
    case "AND": return +(inputA === 1 && inputB === 1);
    case "OR": return +(inputA === 1 || inputB === 1);
    case "XOR": return inputA === inputB ? 0 : 1;
    case "XNOR": return +(inputA === inputB);
  }
};
const buildTruthTableRows = (operator: BooleanOperator) => truthTableInputs.map(([inputA, inputB]) => ({ inputA, inputB, output: evaluateBooleanOperator(operator, inputA, inputB) }));
const outputPattern = (rows: Array<{ output: number }>): string => rows.map(({ output }) => output).join("");
const booleanOr = (value: unknown, fallback: boolean): boolean => typeof value === "boolean" ? value : fallback;
const normalizeOperator = (value: unknown): BooleanOperator => isBooleanOperator(value) ? value : defaultTruthTableValues.operator;

function deriveTruthTableState(values: TruthTableValues) {
  const inputA = booleanOr(values.inputA, defaultTruthTableValues.inputA);
  const inputB = booleanOr(values.inputB, defaultTruthTableValues.inputB);
  const operator = normalizeOperator(values.operator);
  const inputABit = toBit(inputA);
  const inputBBit = toBit(inputB);
  const rows = buildTruthTableRows(operator);
  const activeRowIndex = inputABit * 2 + inputBBit;
  return { inputA, inputB, operator, inputABit, inputBBit, output: rows[activeRowIndex].output, activeRowIndex, rows, outputPattern: outputPattern(rows) };
}

function initializeBooleanTruthTableSchema(): void {}
function initializeBooleanTruthTableModel(): void {}

export {
  initializeBooleanTruthTableSchema as a,
  deriveTruthTableState as i,
  defaultTruthTableValues as n,
  booleanTruthTableDefinition as o,
  initializeBooleanTruthTableModel as r,
  booleanOperators as t,
};
