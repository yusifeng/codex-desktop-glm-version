// Set-operations learning model over labeled Venn-diagram regions.
import "@rchunk/rolldown-runtime";

type SetOperation = "union" | "intersection" | "a_minus_b" | "b_minus_a" | "a_complement" | "b_complement";
type VennRegion = "outside" | "only_a" | "intersection" | "only_b";
interface SetOperationValues { operation?: unknown }

const setOperationsType = "SET_OPERATIONS_VENN_REGIONS";
const setOperationsThumbnail = "set-operations-venn-regions-v1";
const setOperationsParameters = { operation: { kind: "enum", defaultValue: "union" as SetOperation, allowedValues: ["union", "intersection", "a_minus_b", "b_minus_a", "a_complement", "b_complement"] as SetOperation[] } };
const setOperationsDefinition = { type: setOperationsType, version: 2, thumbnailAssetKey: setOperationsThumbnail, parameters: setOperationsParameters };
const operationParameter = setOperationsDefinition.parameters.operation;
const isSetOperation = (value: unknown): value is SetOperation => typeof value === "string" && operationParameter.allowedValues.some((operation) => operation === value);
const defaultSetOperation = isSetOperation(operationParameter.defaultValue) ? operationParameter.defaultValue : "union";
const setOperations = operationParameter.allowedValues.filter(isSetOperation);
const vennElements: Array<{ value: number; region: VennRegion; x: number; y: number }> = [
  { value: 1, region: "outside", x: 60, y: 100 }, { value: 2, region: "only_a", x: 105, y: 145 },
  { value: 3, region: "only_a", x: 112, y: 204 }, { value: 4, region: "intersection", x: 190, y: 144 },
  { value: 5, region: "intersection", x: 190, y: 195 }, { value: 6, region: "only_b", x: 275, y: 145 },
  { value: 7, region: "only_b", x: 268, y: 204 }, { value: 8, region: "outside", x: 320, y: 100 },
  { value: 9, region: "outside", x: 68, y: 234 }, { value: 10, region: "outside", x: 312, y: 234 },
];
const operationDefinitions: Record<SetOperation, { operationLatex: string; selectedRegions: VennRegion[] }> = {
  union: { operationLatex: "A \\cup B", selectedRegions: ["only_a", "intersection", "only_b"] },
  intersection: { operationLatex: "A \\cap B", selectedRegions: ["intersection"] },
  a_minus_b: { operationLatex: "A \\setminus B", selectedRegions: ["only_a"] },
  b_minus_a: { operationLatex: "B \\setminus A", selectedRegions: ["only_b"] },
  a_complement: { operationLatex: "A^{c}", selectedRegions: ["outside", "only_b"] },
  b_complement: { operationLatex: "B^{c}", selectedRegions: ["outside", "only_a"] },
};
const normalizeSetOperation = (values: SetOperationValues) => ({ operation: isSetOperation(values.operation) ? values.operation : defaultSetOperation });
const deriveSetOperationState = (values: SetOperationValues) => {
  const { operation } = normalizeSetOperation(values);
  const { operationLatex, selectedRegions } = operationDefinitions[operation];
  const selectedElements = vennElements.filter(({ region }) => selectedRegions.includes(region)).map(({ value }) => value);
  return { operation, operationLatex, resultLatex: `${operationLatex} = \\{${selectedElements.join(",")}\\}`, selectedElements, selectedRegions };
};

function initializeSetOperationsSchema(): void {}
function initializeSetOperationsModel(): void {}

export {
  initializeSetOperationsModel as a,
  setOperationsDefinition as c,
  deriveSetOperationState as i,
  setOperations as n,
  normalizeSetOperation as o,
  vennElements as r,
  initializeSetOperationsSchema as s,
  defaultSetOperation as t,
};
