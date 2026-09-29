// Spreadsheet IF-function learning model. Release chunk: model-379965cd8d4f.js.
import "@rchunk/rolldown-runtime";

type ComparisonOperator = ">" | ">=" | "<" | "<=";
interface IfFunctionValues { comparison_operator?: string | null; initial_input_value?: number | null; initial_comparison_value?: number | null }
interface NumberParameter { kind: "number"; defaultValue: number; min: number; max: number }
interface IfFunctionManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: {
    comparison_operator: { kind: "enum"; defaultValue: ComparisonOperator; allowedValues: ComparisonOperator[] };
    initial_input_value: NumberParameter; initial_comparison_value: NumberParameter;
  };
}

let ifFunctionManifest: IfFunctionManifest;
let inputValueParameter: NumberParameter;
let comparisonValueParameter: NumberParameter;
let defaultIfFunctionValues: { comparison_operator: ComparisonOperator; initial_input_value: number; initial_comparison_value: number };
let calculateIfFunction: (values: IfFunctionValues) => {
  safeValues: { comparison_operator: ComparisonOperator; initial_input_value: number; initial_comparison_value: number };
  inputRatio: number; comparisonRatio: number; isTrue: boolean; isEqual: boolean;
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeIfFunctionManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  ifFunctionManifest = {
    type: "SPREADSHEET_IF_FUNCTION", version: 2, thumbnailAssetKey: "spreadsheet-if-function-v1",
    parameters: {
      comparison_operator: { kind: "enum", defaultValue: ">=", allowedValues: [">", ">=", "<", "<="] },
      initial_input_value: { kind: "number", defaultValue: 8, min: 0, max: 20 },
      initial_comparison_value: { kind: "number", defaultValue: 10, min: 0, max: 20 },
    },
  };
}

function initializeSpreadsheetIfFunctionModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeIfFunctionManifest();
  const isOperator = (value: unknown): value is ComparisonOperator =>
    typeof value === "string" && ifFunctionManifest.parameters.comparison_operator.allowedValues.some(operator => operator === value);
  const defaultOperator = ifFunctionManifest.parameters.comparison_operator.defaultValue;
  if (!isOperator(defaultOperator)) throw Error("Invalid spreadsheet IF comparison operator default");
  inputValueParameter = ifFunctionManifest.parameters.initial_input_value;
  comparisonValueParameter = ifFunctionManifest.parameters.initial_comparison_value;
  defaultIfFunctionValues = {
    comparison_operator: defaultOperator, initial_input_value: inputValueParameter.defaultValue,
    initial_comparison_value: comparisonValueParameter.defaultValue,
  };
  const normalizeNumber = (value: number | null | undefined, parameter: NumberParameter): number =>
    typeof value === "number" && Number.isFinite(value)
      ? Math.min(parameter.max, Math.max(parameter.min, value))
      : parameter.defaultValue;
  const ratioWithinParameter = (value: number, parameter: NumberParameter): number =>
    (value - parameter.min) / (parameter.max - parameter.min);
  const compare = (input: number, comparison: number, operator: ComparisonOperator): boolean => {
    switch (operator) {
      case ">": return input > comparison;
      case ">=": return input >= comparison;
      case "<": return input < comparison;
      case "<=": return input <= comparison;
    }
  };
  calculateIfFunction = values => {
    const safeValues = {
      comparison_operator: isOperator(values.comparison_operator) ? values.comparison_operator : defaultIfFunctionValues.comparison_operator,
      initial_input_value: normalizeNumber(values.initial_input_value, inputValueParameter),
      initial_comparison_value: normalizeNumber(values.initial_comparison_value, comparisonValueParameter),
    };
    return {
      safeValues, inputRatio: ratioWithinParameter(safeValues.initial_input_value, inputValueParameter),
      comparisonRatio: ratioWithinParameter(safeValues.initial_comparison_value, comparisonValueParameter),
      isTrue: compare(safeValues.initial_input_value, safeValues.initial_comparison_value, safeValues.comparison_operator),
      isEqual: safeValues.initial_input_value === safeValues.initial_comparison_value,
    };
  };
}

export {
  initializeSpreadsheetIfFunctionModel as a, calculateIfFunction as i, inputValueParameter as n,
  initializeIfFunctionManifest as o, defaultIfFunctionValues as r, ifFunctionManifest as s, comparisonValueParameter as t,
};
