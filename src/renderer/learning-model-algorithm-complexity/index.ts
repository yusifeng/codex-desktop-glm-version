// Algorithm-complexity learning model: compare common operation-count growth classes.
import "@rchunk/rolldown-runtime";

type ComplexityKind = "constant" | "exponential" | "linear" | "linearithmic" | "logarithmic" | "quadratic";
interface ComplexityValues { inputIndex?: number | null }
interface OperationCounts extends Record<ComplexityKind, number> {}
interface ComplexityPoint { x: number; y: number }

const inputSizes = [4, 8, 16, 32, 64] as const;
const defaultComplexityValues = { inputIndex: 2 };

function operationCounts(inputSize: number): OperationCounts {
  return {
    constant: 1,
    logarithmic: Math.log2(inputSize),
    linear: inputSize,
    linearithmic: inputSize * Math.log2(inputSize),
    quadratic: inputSize ** 2,
    exponential: 2 ** inputSize,
  };
}

function sampleComplexity(kind: ComplexityKind, maximumInput: number, visibleMaximum: number): ComplexityPoint[] {
  const points: ComplexityPoint[] = [];
  const stopThreshold = visibleMaximum * 1.5;
  for (let input = 1; input <= maximumInput; input += 1) {
    const operations = operationCounts(input)[kind];
    points.push({ x: input, y: operations });
    if (operations >= stopThreshold) break;
  }
  return points;
}

function normalizeComplexityValues(values: ComplexityValues) {
  const candidate = values.inputIndex;
  const inputIndex = Number.isFinite(candidate)
    ? Math.max(0, Math.min(inputSizes.length - 1, Math.round(candidate ?? 0)))
    : defaultComplexityValues.inputIndex;
  const inputSize = inputSizes[inputIndex] ?? inputSizes[2];
  return { inputIndex, inputSize, operations: operationCounts(inputSize) };
}

function initializeAlgorithmComplexityModel(): void {}

export {
  initializeAlgorithmComplexityModel as a,
  sampleComplexity as i,
  inputSizes as n,
  normalizeComplexityValues as r,
  defaultComplexityValues as t,
};
