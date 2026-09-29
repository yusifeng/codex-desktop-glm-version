// Musical tempo markings and their overlapping beats-per-minute ranges.
import "@rchunk/rolldown-runtime";

interface TempoRange { marking: string; min: number; max: number }
interface TempoValues { tempo_marking?: unknown; bpm?: unknown }

const tempoRanges: TempoRange[] = [
  { marking: "grave", min: 20, max: 44 },
  { marking: "largo", min: 40, max: 60 },
  { marking: "adagio", min: 60, max: 80 },
  { marking: "andante", min: 76, max: 108 },
  { marking: "moderato", min: 104, max: 120 },
  { marking: "allegro", min: 116, max: 168 },
  { marking: "vivace", min: 156, max: 184 },
  { marking: "presto", min: 168, max: 208 },
];
const defaultTempoMarking = "andante";
const isTempoMarking = (value: unknown): value is string => tempoRanges.some((range) => range.marking === value);
const tempoRangeForMarking = (marking: unknown): TempoRange =>
  tempoRanges.find((range) => range.marking === marking) ?? tempoRanges[3];
const midpointBpm = (marking: unknown): number => {
  const range = tempoRangeForMarking(marking);
  return Math.round((range.min + range.max) / 2);
};
const defaultTempoValues = (marking: unknown) => {
  const validMarking = tempoRangeForMarking(marking).marking;
  return { tempo_marking: validMarking, bpm: midpointBpm(validMarking) };
};
const normalizeTempoValues = (values: TempoValues) => {
  const marking = isTempoMarking(values.tempo_marking) ? values.tempo_marking : defaultTempoMarking;
  const bpm = Number(values.bpm);
  return {
    tempo_marking: marking,
    bpm: Number.isFinite(bpm) ? Math.min(208, Math.max(20, Math.round(bpm))) : midpointBpm(marking),
  };
};
const calculateTempoCompatibility = (values: TempoValues) => {
  const normalized = normalizeTempoValues(values);
  const selected = tempoRangeForMarking(normalized.tempo_marking);
  const matches = tempoRanges.filter((range) => normalized.bpm >= range.min && normalized.bpm <= range.max);
  return { ...normalized, selected, matches, selectedMatches: matches.some((range) => range.marking === normalized.tempo_marking) };
};

function initializeMusicalTempoMarkingsModel(): void {}

export { midpointBpm as a, defaultTempoValues as i, calculateTempoCompatibility as n, initializeMusicalTempoMarkingsModel as r, tempoRanges as t };
