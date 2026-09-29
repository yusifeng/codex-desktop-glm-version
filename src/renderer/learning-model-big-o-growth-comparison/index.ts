// Growth-rate comparison for common Big O complexity classes.
import "@rchunk/rolldown-runtime";

interface IntegerParameter { kind: "integer"; defaultValue: number; min: number; max: number }
interface BigOValues { n?: number | null }
interface ComplexityClass { key: string; label: string; expression: string; referenceFunction: (n: number) => number }

const bigOGrowthType = "BIG_O_GROWTH_COMPARISON";
const bigOGrowthThumbnail = "big-o-growth-comparison-v1";
const bigOGrowthParameters: { n: IntegerParameter } = { n: { kind: "integer", defaultValue: 10, min: 1, max: 20 } };
const bigOGrowthSpecification = { type: bigOGrowthType, version: 1, thumbnailAssetKey: bigOGrowthThumbnail, parameters: bigOGrowthParameters };
const inputSizeParameter = bigOGrowthSpecification.parameters.n;
const inputSizeControl = { min: inputSizeParameter.min, max: inputSizeParameter.max, step: 1, defaultValue: inputSizeParameter.defaultValue };
const complexityClasses: ComplexityClass[] = [
  { key: "constant", label: "O(1)", expression: "1", referenceFunction: () => 1 },
  { key: "logarithmic", label: "O(log n)", expression: "log₂ n", referenceFunction: (n) => Math.log2(n) },
  { key: "linear", label: "O(n)", expression: "n", referenceFunction: (n) => n },
  { key: "linearithmic", label: "O(n log n)", expression: "n log₂ n", referenceFunction: (n) => n * Math.log2(n) },
  { key: "quadratic", label: "O(n²)", expression: "n²", referenceFunction: (n) => n * n },
  { key: "exponential", label: "O(2ⁿ)", expression: "2ⁿ", referenceFunction: (n) => 2 ** n },
];
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const normalizeBigOValues = (values: BigOValues) => {
  const inputSize = Number.isFinite(values.n) ? values.n ?? inputSizeControl.defaultValue : inputSizeControl.defaultValue;
  return { n: clamp(Math.round(inputSize), inputSizeControl.min, inputSizeControl.max) };
};
const maximumReferenceValue = 2 ** inputSizeControl.max;
const logarithmicScaleMaximum = Math.log2(1 + maximumReferenceValue);
const logarithmicScale = (value: number): number => !Number.isFinite(value) || value <= 0 ? 0 : Math.log2(1 + value);
const normalizedLogarithmicScale = (value: number): number => logarithmicScale(value) / logarithmicScaleMaximum;
const referenceValue = (complexity: ComplexityClass, inputSize: number): number => complexity.referenceFunction(clamp(inputSize, inputSizeControl.min, inputSizeControl.max));
const complexityValues = (inputSize: number) => complexityClasses.map((complexity) => ({ ...complexity, referenceValue: referenceValue(complexity, inputSize) }));

function initializeBigOGrowthSpecification(): void {}
function initializeBigOGrowthModel(): void {}

export { initializeBigOGrowthModel as a, initializeBigOGrowthSpecification as c, complexityValues as i, bigOGrowthSpecification as l, inputSizeControl as n, normalizedLogarithmicScale as o, referenceValue as r, normalizeBigOValues as s, complexityClasses as t };
