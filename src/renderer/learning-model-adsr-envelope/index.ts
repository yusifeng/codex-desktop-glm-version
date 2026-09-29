// ADSR sound-envelope learning model with note-on and note-off interactions.
import "@rchunk/rolldown-runtime";

type AdsrParameter = "attack" | "decay" | "sustain" | "release";
interface AdsrValues { attackSeconds?: number | null; decaySeconds?: number | null; sustainLevel?: number | null; releaseSeconds?: number | null; selectedParameter?: unknown; noteHeld?: unknown; noteOffSeconds?: number | null; noteOnTimestampMs?: number | null }
interface Point { x: number; y: number }

const adsrParameters: AdsrParameter[] = ["attack", "decay", "sustain", "release"];
const durationControl = { min: 0.05, max: 1.5, step: 0.05 };
const sustainControl = { min: 0, max: 1, step: 0.05 };
const plotMaximumSeconds = 4.8;
const noteOffControl = { min: 0.05, max: plotMaximumSeconds - durationControl.max };
const defaultAdsrValues = { attackSeconds: 0.45, decaySeconds: 0.65, sustainLevel: 0.6, releaseSeconds: 0.8, selectedParameter: "attack" as AdsrParameter, noteHeld: false, noteOffSeconds: 2.35, noteOnTimestampMs: 0 };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const finiteOr = (value: number | null | undefined, fallback: number): number => Number.isFinite(value) ? Number(value) : fallback;
const normalizeAdsrValues = (values: AdsrValues) => ({
  attackSeconds: clamp(finiteOr(values.attackSeconds, defaultAdsrValues.attackSeconds), durationControl.min, durationControl.max), decaySeconds: clamp(finiteOr(values.decaySeconds, defaultAdsrValues.decaySeconds), durationControl.min, durationControl.max), sustainLevel: clamp(finiteOr(values.sustainLevel, defaultAdsrValues.sustainLevel), sustainControl.min, sustainControl.max), releaseSeconds: clamp(finiteOr(values.releaseSeconds, defaultAdsrValues.releaseSeconds), durationControl.min, durationControl.max), selectedParameter: adsrParameters.includes(values.selectedParameter as AdsrParameter) ? values.selectedParameter as AdsrParameter : defaultAdsrValues.selectedParameter, noteHeld: typeof values.noteHeld === "boolean" ? values.noteHeld : defaultAdsrValues.noteHeld, noteOffSeconds: clamp(finiteOr(values.noteOffSeconds, defaultAdsrValues.noteOffSeconds), noteOffControl.min, noteOffControl.max), noteOnTimestampMs: Math.max(0, finiteOr(values.noteOnTimestampMs, defaultAdsrValues.noteOnTimestampMs)),
});

function deriveAdsrEnvelope(values: AdsrValues) {
  const safeValues = normalizeAdsrValues(values); const attackEnd = safeValues.attackSeconds; const decayEnd = attackEnd + safeValues.decaySeconds; const noteOff = safeValues.noteOffSeconds; const releaseEnd = noteOff + safeValues.releaseSeconds;
  const levelAtNoteOff = noteOff <= attackEnd ? noteOff / attackEnd : noteOff <= decayEnd ? 1 - (noteOff - attackEnd) / safeValues.decaySeconds * (1 - safeValues.sustainLevel) : safeValues.sustainLevel;
  const stages: Partial<Record<AdsrParameter, { from: Point; to: Point }>> = {};
  const attackTo = safeValues.noteHeld ? attackEnd : Math.min(attackEnd, noteOff); stages.attack = { from: { x: 0, y: 0 }, to: { x: attackTo, y: attackTo / attackEnd } };
  if (safeValues.noteHeld || noteOff > attackEnd) { const end = safeValues.noteHeld ? decayEnd : Math.min(decayEnd, noteOff); stages.decay = { from: { x: attackEnd, y: 1 }, to: { x: end, y: end >= decayEnd ? safeValues.sustainLevel : 1 - (end - attackEnd) / safeValues.decaySeconds * (1 - safeValues.sustainLevel) } }; }
  if (safeValues.noteHeld || noteOff > decayEnd) stages.sustain = { from: { x: decayEnd, y: safeValues.sustainLevel }, to: { x: safeValues.noteHeld ? plotMaximumSeconds : noteOff, y: safeValues.sustainLevel } };
  if (!safeValues.noteHeld) stages.release = { from: { x: noteOff, y: levelAtNoteOff }, to: { x: releaseEnd, y: 0 } };
  const orderedStages = adsrParameters.flatMap((parameter) => stages[parameter] ? [{ parameter, ...stages[parameter] }] : []);
  return { safeValues, attackEnd, decayEnd, noteOff, releaseEnd, levelAtNoteOff, stages, points: [orderedStages[0]?.from ?? { x: 0, y: 0 }, ...orderedStages.map((stage) => stage.to)] };
}
const deriveAdsrViewport = ({ plotWidth, noteHeld, releaseEnds }: { plotWidth: number; noteHeld: boolean; releaseEnds: number[] }) => ({ xMin: plotWidth < 480 ? -1.2 : -0.35, xMax: noteHeld || releaseEnds.every((end) => end <= 4) ? 4 : plotMaximumSeconds });
const startAdsrNote = (values: AdsrValues, timestampMs: number) => normalizeAdsrValues({ ...values, noteHeld: true, noteOnTimestampMs: timestampMs });
const releaseAdsrNote = (values: AdsrValues, timestampMs: number) => { const safe = normalizeAdsrValues(values); return normalizeAdsrValues({ ...safe, noteHeld: false, noteOffSeconds: (finiteOr(timestampMs, safe.noteOnTimestampMs) - safe.noteOnTimestampMs) / 1000 }); };
const selectedAdsrValue = (values: ReturnType<typeof normalizeAdsrValues>): number => values.selectedParameter === "attack" ? values.attackSeconds : values.selectedParameter === "decay" ? values.decaySeconds : values.selectedParameter === "sustain" ? values.sustainLevel : values.releaseSeconds;
const updateSelectedAdsrValue = (values: AdsrValues, value: number) => { const safe = normalizeAdsrValues(values); return normalizeAdsrValues({ ...safe, ...(safe.selectedParameter === "attack" ? { attackSeconds: value } : safe.selectedParameter === "decay" ? { decaySeconds: value } : safe.selectedParameter === "sustain" ? { sustainLevel: value } : { releaseSeconds: value }) }); };
function initializeAdsrEnvelopeModel(): void {}
export { durationControl as a, startAdsrNote as c, normalizeAdsrValues as d, selectedAdsrValue as f, plotMaximumSeconds as i, releaseAdsrNote as l, defaultAdsrValues as n, deriveAdsrEnvelope as o, updateSelectedAdsrValue as p, sustainControl as r, initializeAdsrEnvelopeModel as s, adsrParameters as t, deriveAdsrViewport as u };
