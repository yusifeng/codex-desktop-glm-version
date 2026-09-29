// Bacterial growth-curve learning model. Release chunk: model-4298405efab5.js.
import "@rchunk/rolldown-runtime";

interface GrowthValues { generation_time_minutes?: number | null; selectedTimeHours?: number | null }
interface GrowthManifest { type: string; version: number; thumbnailAssetKey: string; parameters: { generation_time_minutes: { kind: "number"; defaultValue: number; min: number; max: number } } }
interface GrowthBoundaries { lagEnd: number; logEnd: number; stationaryEnd: number; end: number }
type GrowthPhase = "lag" | "log" | "stationary" | "death";

let bacterialGrowthManifest: GrowthManifest;
let defaultGrowthValues: { generation_time_minutes: number; selectedTimeHours: number };
let tangentMinimum = 0.25;
let growthChartBounds: { min: number; max: number };
let calculateGrowthCurve: (values: GrowthValues) => { values: { generation_time_minutes: number; selectedTimeHours: number }; boundaries: GrowthBoundaries; phase: GrowthPhase; slope: number; logViableCount: number; tangentStart: { x: number; y: number }; tangentEnd: { x: number; y: number } };
let growthCurvePoints: (generationTimeMinutes: number) => Array<{ x: number; y: number }>;
let manifestInitialized = false;
let modelInitialized = false;

function initializeBacterialGrowthManifest(): void {
  if (manifestInitialized) return; manifestInitialized = true;
  bacterialGrowthManifest = { type: "BACTERIAL_GROWTH_CURVE", version: 3, thumbnailAssetKey: "bacterial-growth-curve-v2", parameters: { generation_time_minutes: { kind: "number", defaultValue: 30, min: 15, max: 90 } } };
}
function initializeBacterialGrowthModel(): void {
  if (modelInitialized) return; modelInitialized = true; initializeBacterialGrowthManifest();
  const generationParameter = bacterialGrowthManifest.parameters.generation_time_minutes;
  const lagCount = 4; const stationaryCount = 9; const lagDuration = 3; const stationaryDuration = 6; const deathDuration = 8; const deathDrop = 3; const logTwo = Math.log10(2);
  const boundariesFor = (generationTime: number): GrowthBoundaries => { const logEnd = lagDuration + 5 / logTwo * (generationTime / 60); const stationaryEnd = logEnd + stationaryDuration; return { lagEnd: lagDuration, logEnd, stationaryEnd, end: stationaryEnd + deathDuration }; };
  defaultGrowthValues = { generation_time_minutes: generationParameter.defaultValue, selectedTimeHours: 7 };
  const finite = (value: number | null | undefined, fallback: number): number => typeof value === "number" && Number.isFinite(value) ? value : fallback;
  const normalize = (values: GrowthValues) => { const generation_time_minutes = Math.min(generationParameter.max, Math.max(generationParameter.min, finite(values.generation_time_minutes, defaultGrowthValues.generation_time_minutes))); const { end } = boundariesFor(generation_time_minutes); return { generation_time_minutes, selectedTimeHours: Math.min(end, Math.max(0, finite(values.selectedTimeHours, defaultGrowthValues.selectedTimeHours))) }; };
  const countAt = (time: number, generation: number, boundaries = boundariesFor(generation)): number => time <= boundaries.lagEnd ? lagCount : time <= boundaries.logEnd ? lagCount + (time - boundaries.lagEnd) * 60 * logTwo / generation : time <= boundaries.stationaryEnd ? stationaryCount : stationaryCount - (time - boundaries.stationaryEnd) * deathDrop / deathDuration;
  calculateGrowthCurve = values => {
    const normalized = normalize(values); const boundaries = boundariesFor(normalized.generation_time_minutes); const time = normalized.selectedTimeHours;
    const phase: GrowthPhase = time < boundaries.lagEnd ? "lag" : time < boundaries.logEnd ? "log" : time < boundaries.stationaryEnd ? "stationary" : "death";
    const slope = phase === "log" ? 60 * logTwo / normalized.generation_time_minutes : phase === "death" ? -3 / deathDuration : 0;
    const span = Math.min(2.2, boundaries.end / 7); const segmentStart = phase === "lag" ? 0 : phase === "log" ? boundaries.lagEnd : phase === "stationary" ? boundaries.logEnd : boundaries.stationaryEnd; const segmentEnd = phase === "lag" ? boundaries.lagEnd : phase === "log" ? boundaries.logEnd : phase === "stationary" ? boundaries.stationaryEnd : boundaries.end; const start = Math.max(segmentStart, Math.min(time - span / 2, segmentEnd - span)); const end = Math.min(segmentEnd, start + span); const count = countAt(time, normalized.generation_time_minutes, boundaries);
    return { values: normalized, boundaries, phase, slope, logViableCount: count, tangentStart: { x: start, y: count + slope * (start - time) }, tangentEnd: { x: end, y: count + slope * (end - time) } };
  };
  growthCurvePoints = generation => { const boundaries = boundariesFor(generation); return [{ x: 0, y: lagCount }, { x: boundaries.lagEnd, y: lagCount }, { x: boundaries.logEnd, y: stationaryCount }, { x: boundaries.stationaryEnd, y: stationaryCount }, { x: boundaries.end, y: 6 }]; };
  growthChartBounds = { min: 3.55, max: 11.05 };
}
export { growthCurvePoints as a, bacterialGrowthManifest as c, calculateGrowthCurve as i, growthChartBounds as n, initializeBacterialGrowthModel as o, tangentMinimum as r, initializeBacterialGrowthManifest as s, defaultGrowthValues as t };
