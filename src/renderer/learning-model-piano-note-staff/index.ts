// Piano-note staff learning model: map a diatonic index to pitch, keyboard, and staff geometry.
import "@rchunk/rolldown-runtime";

interface PianoNote {
  hasBlackKeyAfter: boolean;
  index: number;
  letter: string;
  octave: number;
  pitch: string;
  staffY: number;
}

const noteLetters = ["C", "D", "E", "F", "G", "A", "B"] as const;

function normalizeNoteIndex(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(14, Math.round(value))) : 7;
}

function getPianoNote(value: number): PianoNote {
  const index = normalizeNoteIndex(value);
  const letter = noteLetters[index % noteLetters.length];
  const octave = 3 + Math.floor(index / noteLetters.length);
  return {
    index,
    letter,
    octave,
    pitch: `${letter}${octave}`,
    hasBlackKeyAfter: letter !== "E" && letter !== "B",
    staffY: 256 - index * 14,
  };
}

const getPianoNotes = (): PianoNote[] => Array.from({ length: 15 }, (_unused, index) => getPianoNote(index));

function getMatchingLetterNotes(value: number): PianoNote[] {
  const selected = getPianoNote(value);
  return getPianoNotes().filter((note) => note.letter === selected.letter);
}

const isMiddleC = (value: number): boolean => normalizeNoteIndex(value) === 7;
function initializePianoNoteStaffModel(): void {}

export {
  isMiddleC as a,
  initializePianoNoteStaffModel as i,
  getPianoNotes as n,
  normalizeNoteIndex as o,
  getMatchingLetterNotes as r,
  getPianoNote as t,
};
