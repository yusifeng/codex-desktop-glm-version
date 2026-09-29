// Mean-as-a-balance-point learning model. Release chunk: model-761532c576d5.js.
import "@rchunk/rolldown-runtime";

interface MeanBalanceValues {
  example: number; candidate: number; value0: number; value1: number; value2: number; value3: number; value4: number; value5: number;
}
interface PartialMeanBalanceValues {
  example?: number | null; candidate?: number | null; value0?: number | null; value1?: number | null; value2?: number | null;
  value3?: number | null; value4?: number | null; value5?: number | null;
}
type BalanceSide = "left" | "right" | "center";

let exampleDataSets: number[][];
let valuesFromState: (values: MeanBalanceValues) => number[];
let mean: (values: number[]) => number;
let valuesForExample: (example: number) => MeanBalanceValues;
let normalizeMeanBalanceValues: (values: PartialMeanBalanceValues) => MeanBalanceValues;
let classifyBalanceSide: (value: number, candidate: number) => BalanceSide;
let balanceTotals: (values: number[], candidate: number) => { left: number; right: number; leftCount: number; rightCount: number };
let isBalancedAt: (values: number[], candidate: number) => boolean;
let updateObservation: (values: MeanBalanceValues, index: number, value: number) => MeanBalanceValues;
let updateCandidate: (values: MeanBalanceValues, candidate: number) => MeanBalanceValues;
let initialized = false;

function initializeMeanAsBalancePointModel(): void {
  if (initialized) return;
  initialized = true;
  exampleDataSets = [
    [2, 4, 5, 7, 8, 10], [2, 2, 3, 4, 5, 10], [2, 3, 4, 7, 8, 9], [2, 3, 4, 4, 5, 12],
  ];
  const tolerance = 1e-7;
  const clampFinite = (value: number | null | undefined, minimum: number, maximum: number, fallback = minimum): number =>
    Math.min(maximum, Math.max(minimum, typeof value === "number" && Number.isFinite(value) ? value : fallback));
  const roundTenth = (value: number): number => Math.round(value * 10) / 10;
  valuesFromState = values => [values.value0, values.value1, values.value2, values.value3, values.value4, values.value5];
  mean = values => values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
  valuesForExample = example => {
    const normalizedExample = clampFinite(Math.round(example), 0, exampleDataSets.length - 1, 0);
    const dataSet = exampleDataSets[normalizedExample];
    return {
      example: normalizedExample, candidate: mean(dataSet), value0: dataSet[0], value1: dataSet[1], value2: dataSet[2],
      value3: dataSet[3], value4: dataSet[4], value5: dataSet[5],
    };
  };
  normalizeMeanBalanceValues = values => {
    const normalizedExample = clampFinite(Math.round(values.example ?? Number.NaN), 0, exampleDataSets.length - 1, 0);
    const fallbackData = exampleDataSets[normalizedExample];
    const normalizedValues = [values.value0, values.value1, values.value2, values.value3, values.value4, values.value5]
      .map((value, index) => clampFinite(value, 1, 12, fallbackData[index]));
    return {
      example: normalizedExample, candidate: clampFinite(values.candidate, 1, 12, mean(normalizedValues)),
      value0: normalizedValues[0], value1: normalizedValues[1], value2: normalizedValues[2],
      value3: normalizedValues[3], value4: normalizedValues[4], value5: normalizedValues[5],
    };
  };
  classifyBalanceSide = (value, candidate) => value < candidate - tolerance ? "left" : value > candidate + tolerance ? "right" : "center";
  balanceTotals = (values, candidate) => ({
    left: values.reduce((sum, value) => sum + Math.max(0, candidate - value), 0),
    right: values.reduce((sum, value) => sum + Math.max(0, value - candidate), 0),
    leftCount: values.filter(value => classifyBalanceSide(value, candidate) === "left").length,
    rightCount: values.filter(value => classifyBalanceSide(value, candidate) === "right").length,
  });
  isBalancedAt = (values, candidate) => {
    const totals = balanceTotals(values, candidate);
    return Math.abs(totals.left - totals.right) < tolerance;
  };
  updateObservation = (values, index, value) => {
    const data = valuesFromState(values);
    data[index] = clampFinite(roundTenth(value), 1, 12);
    return {
      ...values, candidate: mean(data), value0: data[0], value1: data[1], value2: data[2],
      value3: data[3], value4: data[4], value5: data[5],
    };
  };
  updateCandidate = (values, candidate) => {
    const normalizedCandidate = clampFinite(roundTenth(candidate), 1, 12, values.candidate);
    const actualMean = mean(valuesFromState(values));
    return { ...values, candidate: Math.abs(normalizedCandidate - actualMean) <= 0.050000100000000006 ? actualMean : normalizedCandidate };
  };
}

export {
  valuesFromState as a, valuesForExample as c, updateObservation as d, balanceTotals as i, normalizeMeanBalanceValues as l,
  mean as n, initializeMeanAsBalancePointModel as o, classifyBalanceSide as r, isBalancedAt as s, exampleDataSets as t, updateCandidate as u,
};
