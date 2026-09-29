// Wilcoxon rank-sum learning model with tied-rank handling. Release chunk: model-65fc78301123.js.
import "@rchunk/rolldown-runtime";

type RankPattern = "intermingled" | "group-a-lower" | "group-a-higher" | "ties";
type Group = "A" | "B";
interface WilcoxonValues { initial_pattern?: string | null; stage?: number | null }
interface RankedObservation { id: string; group: Group; value: number; rank: number }
interface WilcoxonManifest {
  type: string; version: number; thumbnailAssetKey: string;
  parameters: { initial_pattern: { kind: "enum"; defaultValue: RankPattern; allowedValues: RankPattern[] } };
}

let wilcoxonManifest: WilcoxonManifest;
let defaultWilcoxonValues: { initial_pattern: RankPattern; stage: number };
let calculateWilcoxonRankSum: (values: WilcoxonValues) => {
  values: { initial_pattern: RankPattern; stage: number }; samples: { A: number[]; B: number[] }; pooled: RankedObservation[];
  ranksA: number[]; ranksB: number[]; sumA: number; sumB: number; uA: number; uB: number;
};
let manifestInitialized = false;
let modelInitialized = false;

function initializeWilcoxonManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  wilcoxonManifest = {
    type: "WILCOXON_RANK_SUM", version: 2, thumbnailAssetKey: "wilcoxon-rank-sum-v1",
    parameters: {
      initial_pattern: { kind: "enum", defaultValue: "intermingled", allowedValues: ["intermingled", "group-a-lower", "group-a-higher", "ties"] },
    },
  };
}

function initializeWilcoxonRankSumModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeWilcoxonManifest();
  const samplesByPattern: Record<RankPattern, { A: number[]; B: number[] }> = {
    intermingled: { A: [2, 4, 6, 8, 10], B: [1, 3, 5, 7, 9] },
    "group-a-lower": { A: [1, 2, 3, 4, 5], B: [6, 7, 8, 9, 10] },
    "group-a-higher": { A: [6, 7, 8, 9, 10], B: [1, 2, 3, 4, 5] },
    ties: { A: [1, 3, 3, 6, 8], B: [2, 3, 5, 6, 9] },
  };
  const allowedPatterns = wilcoxonManifest.parameters.initial_pattern.allowedValues;
  defaultWilcoxonValues = { initial_pattern: wilcoxonManifest.parameters.initial_pattern.defaultValue, stage: 3 };
  const isPattern = (value: unknown): value is RankPattern => allowedPatterns.some(pattern => pattern === value);
  calculateWilcoxonRankSum = values => {
    const initialPattern = isPattern(values.initial_pattern) ? values.initial_pattern : wilcoxonManifest.parameters.initial_pattern.defaultValue;
    const stage = typeof values.stage === "number" && Number.isFinite(values.stage)
      ? Math.min(3, Math.max(0, Math.round(values.stage)))
      : 3;
    const samples = samplesByPattern[initialPattern];
    const groups: Group[] = ["A", "B"];
    const pooled: RankedObservation[] = groups.flatMap(group =>
      samples[group].map((value, index) => ({ id: `${group}${index + 1}`, group, value, rank: 0 })),
    ).sort((left, right) => left.value - right.value);
    let start = 0;
    while (start < pooled.length) {
      let end = start + 1;
      while (end < pooled.length && pooled[end]?.value === pooled[start]?.value) end += 1;
      const averageRank = (start + 1 + end) / 2;
      for (let index = start; index < end; index += 1) {
        const observation = pooled[index];
        if (observation) observation.rank = averageRank;
      }
      start = end;
    }
    const ranksA = pooled.filter(observation => observation.group === "A").map(observation => observation.rank);
    const ranksB = pooled.filter(observation => observation.group === "B").map(observation => observation.rank);
    const sumA = ranksA.reduce((sum, rank) => sum + rank, 0);
    const sumB = ranksB.reduce((sum, rank) => sum + rank, 0);
    const uA = sumA - samples.A.length * (samples.A.length + 1) / 2;
    const uB = samples.A.length * samples.B.length - uA;
    return { values: { initial_pattern: initialPattern, stage }, samples, pooled, ranksA, ranksB, sumA, sumB, uA, uB };
  };
}

export {
  wilcoxonManifest as a, initializeWilcoxonManifest as i, defaultWilcoxonValues as n,
  initializeWilcoxonRankSumModel as r, calculateWilcoxonRankSum as t,
};
