// Box-plot comparison model: compare quartiles, skew, spread, and outliers.
import "@rchunk/rolldown-runtime";

type BoxPlotScenario = "similar spread" | "wider middle spread" | "right-skewed" | "left-skewed" | "possible outlier";
interface BoxPlotStats { low: number; q1: number; median: number; q3: number; high: number; outliers: number[] }

const boxPlotScenarios: readonly BoxPlotScenario[] = ["similar spread", "wider middle spread", "right-skewed", "left-skewed", "possible outlier"];
const referenceBoxPlot: BoxPlotStats = { low: 20, q1: 40, median: 52, q3: 64, high: 82, outliers: [] };
const comparisonBoxPlots: Record<BoxPlotScenario, BoxPlotStats> = {
  "similar spread": { low: 22, q1: 42, median: 54, q3: 66, high: 84, outliers: [] },
  "wider middle spread": { low: 10, q1: 28, median: 50, q3: 74, high: 92, outliers: [] },
  "right-skewed": { low: 20, q1: 36, median: 43, q3: 54, high: 78, outliers: [] },
  "left-skewed": { low: 22, q1: 46, median: 57, q3: 64, high: 80, outliers: [] },
  "possible outlier": { low: 20, q1: 40, median: 50, q3: 60, high: 78, outliers: [96] },
};
const normalizeBoxPlotScenario = (value: string): BoxPlotScenario => boxPlotScenarios.find((scenario) => scenario === value) ?? boxPlotScenarios[0];
const addBoxPlotFences = (stats: BoxPlotStats) => {
  const iqr = stats.q3 - stats.q1;
  return { ...stats, iqr, lowerFence: stats.q1 - 1.5 * iqr, upperFence: stats.q3 + 1.5 * iqr };
};
function initializeBoxPlotModel(): void {}

export { initializeBoxPlotModel as a, addBoxPlotFences as i, boxPlotScenarios as n, normalizeBoxPlotScenario as o, referenceBoxPlot as r, comparisonBoxPlots as t };
