// Piano-roll note edits and their timing relationship to a partner note.
import "@rchunk/rolldown-runtime";

type NoteEdit = "retune" | "shift" | "duration";
interface PianoRollValues { beforePitchIndex?: number | null; beforeOnsetBeats?: number | null; beforeDurationBeats?: number | null; pitchIndex?: number | null; onsetBeats?: number | null; durationBeats?: number | null; lastEdit?: unknown }
interface PianoRollNote { pitchIndex: number; onsetBeats: number; offsetBeats: number; durationBeats: number }

const pitches = ["C5", "B4", "A4", "G4", "F4", "E4"];
const minimumDuration = 0.5;
const maximumDuration = 3.5;
const beatSnap = 0.25;
const initialNote: PianoRollNote = { pitchIndex: 3, onsetBeats: 1, offsetBeats: 3, durationBeats: 2 };
const partnerNote: PianoRollNote = { pitchIndex: 1, onsetBeats: 4, offsetBeats: 5.25, durationBeats: 1.25 };
const defaultPianoRollValues = { beforePitchIndex: initialNote.pitchIndex, beforeOnsetBeats: initialNote.onsetBeats, beforeDurationBeats: initialNote.durationBeats, pitchIndex: initialNote.pitchIndex, onsetBeats: 2.5, durationBeats: initialNote.durationBeats, lastEdit: "shift" as NoteEdit };
const clamp = (value: number, minimum: number, maximum: number): number => Math.min(maximum, Math.max(minimum, value));
const finiteOrDefault = (value: number, defaultValue: number): number => Number.isFinite(value) ? value : defaultValue;
const isNoteEdit = (value: unknown): value is NoteEdit => value === "retune" || value === "shift" || value === "duration";
const normalizePianoRollValues = (values: PianoRollValues) => {
  const beforeDurationBeats = clamp(finiteOrDefault(values.beforeDurationBeats ?? Number.NaN, defaultPianoRollValues.beforeDurationBeats), minimumDuration, maximumDuration);
  const beforeOnsetBeats = clamp(finiteOrDefault(values.beforeOnsetBeats ?? Number.NaN, defaultPianoRollValues.beforeOnsetBeats), 0, 6 - beforeDurationBeats);
  const durationBeats = clamp(finiteOrDefault(values.durationBeats ?? Number.NaN, defaultPianoRollValues.durationBeats), minimumDuration, maximumDuration);
  const onsetBeats = clamp(finiteOrDefault(values.onsetBeats ?? Number.NaN, defaultPianoRollValues.onsetBeats), 0, 6 - durationBeats);
  return {
    beforePitchIndex: clamp(Math.round(finiteOrDefault(values.beforePitchIndex ?? Number.NaN, defaultPianoRollValues.beforePitchIndex)), 0, pitches.length - 1),
    beforeOnsetBeats, beforeDurationBeats,
    pitchIndex: clamp(Math.round(finiteOrDefault(values.pitchIndex ?? Number.NaN, defaultPianoRollValues.pitchIndex)), 0, pitches.length - 1),
    onsetBeats, durationBeats, lastEdit: isNoteEdit(values.lastEdit) ? values.lastEdit : defaultPianoRollValues.lastEdit,
  };
};
const createNote = (pitchIndex: number, onsetBeats: number, durationBeats: number): PianoRollNote => ({ pitchIndex, onsetBeats, offsetBeats: onsetBeats + durationBeats, durationBeats });
const beforeNote = (values: PianoRollValues): PianoRollNote => { const normalized = normalizePianoRollValues(values); return createNote(normalized.beforePitchIndex, normalized.beforeOnsetBeats, normalized.beforeDurationBeats); };
const afterNote = (values: PianoRollValues): PianoRollNote => { const normalized = normalizePianoRollValues(values); return createNote(normalized.pitchIndex, normalized.onsetBeats, normalized.durationBeats); };
const noteRelationship = (left: PianoRollNote, right: PianoRollNote): "overlap" | "touching" | "separated" => {
  const overlap = Math.min(left.offsetBeats, right.offsetBeats) - Math.max(left.onsetBeats, right.onsetBeats);
  return overlap > 0 ? "overlap" : overlap === 0 ? "touching" : "separated";
};
const overlapBeats = (left: PianoRollNote, right: PianoRollNote): number => Math.max(0, Math.min(left.offsetBeats, right.offsetBeats) - Math.max(left.onsetBeats, right.onsetBeats));
const snapBeat = (beat: number): number => Math.round(beat / beatSnap) * beatSnap;
const separatedGap = (left: PianoRollNote, right: PianoRollNote) => left.offsetBeats < right.onsetBeats ? { startBeats: left.offsetBeats, endBeats: right.onsetBeats } : right.offsetBeats < left.onsetBeats ? { startBeats: right.offsetBeats, endBeats: left.onsetBeats } : null;
const beginPianoRollEdit = (values: PianoRollValues, lastEdit: NoteEdit) => {
  const normalized = normalizePianoRollValues(values);
  return { ...normalized, beforePitchIndex: normalized.pitchIndex, beforeOnsetBeats: normalized.onsetBeats, beforeDurationBeats: normalized.durationBeats, lastEdit };
};
const applyPianoRollEdit = (values: PianoRollValues, edit: NoteEdit, value: number) => {
  const normalized = normalizePianoRollValues(values);
  switch (edit) {
    case "retune": return normalizePianoRollValues({ ...normalized, pitchIndex: value, lastEdit: edit });
    case "duration": return normalizePianoRollValues({ ...normalized, durationBeats: clamp(value, minimumDuration, Math.min(maximumDuration, 6 - normalized.onsetBeats)), lastEdit: edit });
    default: return normalizePianoRollValues({ ...normalized, onsetBeats: value, lastEdit: edit });
  }
};
const calculatePianoRollRelationship = (values: PianoRollValues) => {
  const safeValues = normalizePianoRollValues(values);
  const before = beforeNote(safeValues);
  const after = afterNote(safeValues);
  return { safeValues, before, after, partner: partnerNote, relationship: noteRelationship(after, partnerNote), overlapBeats: overlapBeats(after, partnerNote), separatedGap: separatedGap(after, partnerNote) };
};

function initializePianoRollModel(): void {}

export { calculatePianoRollRelationship as a, beginPianoRollEdit as i, pitches as n, initializePianoRollModel as o, applyPianoRollEdit as r, snapBeat as s, defaultPianoRollValues as t };
