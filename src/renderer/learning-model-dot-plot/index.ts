// Dot-plot learning model with progressively revealed observations.
import "@rchunk/rolldown-runtime";

type DotPlotExample = "clustered" | "spread-out" | "gap-and-unusual-value";
interface DotPlotValues { example?: string; revealed?: number }
interface DotPlotPoint { observation: number; value: number; lane: number }

let calculateDotPlot: (values: DotPlotValues) => { example: DotPlotExample; revealed: number; total: number; points: DotPlotPoint[]; frequencies: number[]; latestValue: number; latestFrequency: number; intervalCount: number; minimum: number; maximum: number };
let initialized = false;

function initializeDotPlotModel(): void {
  if (initialized) return;
  initialized = true;
  const examples: Record<DotPlotExample, number[]> = {
    clustered: [6, 5, 7, 6, 5, 6, 8, 4, 7, 6, 5, 7, 6, 5, 7, 6],
    "spread-out": [6, 2, 10, 4, 8, 0, 12, 5, 7, 3, 9, 1, 11, 4, 8, 6],
    "gap-and-unusual-value": [5, 6, 4, 7, 5, 6, 4, 7, 5, 6, 12, 4, 5, 6, 7, 5],
  };
  const isExample = (value: string | undefined): value is DotPlotExample => value === "clustered" || value === "spread-out" || value === "gap-and-unusual-value";
  calculateDotPlot = values => {
    const example = isExample(values.example) ? values.example : "clustered";
    const observations = examples[example];
    const revealed = Number.isFinite(values.revealed) ? Math.max(1, Math.min(observations.length, Math.round(values.revealed as number))) : 10;
    const visible = observations.slice(0, revealed);
    const frequencies = Array.from({ length: 13 }, () => 0);
    const points = visible.map((value, observation) => {
      const lane = frequencies[value];
      frequencies[value] += 1;
      return { observation, value, lane };
    });
    const latestValue = visible[visible.length - 1];
    return { example, revealed, total: observations.length, points, frequencies, latestValue, latestFrequency: frequencies[latestValue], intervalCount: visible.filter(value => value >= 4 && value <= 8).length, minimum: Math.min(...visible), maximum: Math.max(...visible) };
  };
}

export { initializeDotPlotModel as n, calculateDotPlot as t };
