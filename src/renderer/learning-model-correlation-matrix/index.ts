// Correlation-matrix learning model across three four-variable datasets.
import "@rchunk/rolldown-runtime";

type ExampleContext = "body-measurements" | "vehicle-features" | "student-survey";
interface CorrelationValues { exampleContext?: unknown; selectedPair?: number | null }

const correlationMatrixType = "CORRELATION_MATRIX";
const correlationMatrixThumbnail = "correlation-matrix-v1";
const exampleContexts: ExampleContext[] = ["body-measurements", "vehicle-features", "student-survey"];
const correlationMatrixParameters = { exampleContext: { kind: "enum", defaultValue: "body-measurements" as ExampleContext, allowedValues: exampleContexts } };
const correlationMatrixDefinition = { type: correlationMatrixType, version: 2, thumbnailAssetKey: correlationMatrixThumbnail, parameters: correlationMatrixParameters };
const defaultExampleContext = exampleContexts.find((context) => context === correlationMatrixDefinition.parameters.exampleContext.defaultValue) ?? exampleContexts[0];
const variablePairs: Array<[number, number]> = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
const datasets: Record<ExampleContext, { variableKeys: string[]; observations: number[][] }> = {
  "body-measurements": { variableKeys: ["height", "weight", "arm-span", "pulse"], observations: [[151,49,150,77],[155,54,157,65],[158,53,157,84],[161,58,162,70],[164,57,163,81],[167,63,169,68],[170,65,169,86],[173,68,174,73],[176,70,178,79],[179,76,178,66],[182,77,184,83],[186,84,185,72]] },
  "vehicle-features": { variableKeys: ["weight", "power", "economy", "zero-to-sixty-time"], observations: [[2200,105,39,10.7],[2400,132,36,9.6],[2600,120,35,10.1],[2800,166,33,8.7],[3000,158,31,9.1],[3200,197,29,7.8],[3400,184,28,8.2],[3600,228,25,7.1],[3800,214,24,7.5],[4000,256,21,6.7],[4200,245,20,7],[4400,289,18,6.1]] },
  "student-survey": { variableKeys: ["study-time", "score", "sleep", "screen-time"], observations: [[1,54,8.5,7.5],[2,62,7.2,6.8],[3,59,8,6.4],[4,69,6.5,5.9],[5,66,7.8,5.6],[6,75,7,5.2],[7,73,8.3,4.9],[8,82,6.8,4.5],[9,79,7.5,4],[10,88,6.3,3.6],[11,85,8.1,3.2],[12,93,7.3,2.8]] },
};
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(Math.max(value, minimum), maximum);
const correlation = (observations: number[][], firstColumn: number, secondColumn: number): number => {
  const firstMean = observations.reduce((sum, row) => sum + row[firstColumn], 0) / observations.length;
  const secondMean = observations.reduce((sum, row) => sum + row[secondColumn], 0) / observations.length;
  let covariance = 0; let firstVariance = 0; let secondVariance = 0;
  for (const row of observations) { const first = row[firstColumn] - firstMean; const second = row[secondColumn] - secondMean; covariance += first * second; firstVariance += first ** 2; secondVariance += second ** 2; }
  return clamp(covariance / Math.sqrt(firstVariance * secondVariance), -1, 1);
};
const normalizedColumn = (observations: number[][], column: number): number[] => {
  const values = observations.map((row) => row[column]);
  const minimum = Math.min(...values); const maximum = Math.max(...values);
  return values.map((value) => (value - minimum) / (maximum - minimum) * 10);
};

function deriveCorrelationMatrix(values: CorrelationValues) {
  const exampleContext = exampleContexts.includes(values.exampleContext as ExampleContext) ? values.exampleContext as ExampleContext : defaultExampleContext;
  const pairIndex = Number.isFinite(values.selectedPair) ? clamp(Math.round(values.selectedPair ?? 0), 0, variablePairs.length - 1) : 0;
  const pair = variablePairs[pairIndex] ?? variablePairs[0];
  const dataset = datasets[exampleContext];
  const matrix = dataset.variableKeys.map((_rowKey, row) => dataset.variableKeys.map((_columnKey, column) => row === column ? 1 : correlation(dataset.observations, row, column)));
  const xValues = normalizedColumn(dataset.observations, pair[0]); const yValues = normalizedColumn(dataset.observations, pair[1]);
  return { exampleContext, variableKeys: dataset.variableKeys, matrix, pair, pairIndex, points: xValues.map((x, index) => ({ x, y: yValues[index] })), correlation: matrix[pair[0]][pair[1]] };
}

function initializeCorrelationMatrixSchema(): void {}
function initializeCorrelationMatrixModel(): void {}
export { initializeCorrelationMatrixModel as a, deriveCorrelationMatrix as i, exampleContexts as n, initializeCorrelationMatrixSchema as o, variablePairs as r, correlationMatrixDefinition as s, defaultExampleContext as t };
