// Root-position triad chord-construction learning model. Release chunk: model-cc7884047369.js.
import "@rchunk/rolldown-runtime";

type ChordRoot = "C" | "D" | "E" | "F" | "G" | "A";
type ChordQuality = "major" | "minor" | "diminished" | "augmented";
type PresentationMode = "thumbnail" | string;
interface ChordValues { root?: string | null; quality?: string | null }
interface IntervalInfo { short: string; semitones: number }
interface ChordInfo { quality: ChordQuality; notes: string[]; third: IntervalInfo; fifth: IntervalInfo }

let chordRoots: ChordRoot[];
let chordQualities: ChordQuality[];
let normalizeChordRoot: (value: unknown) => ChordRoot;
let normalizeChordQuality: (value: unknown) => ChordQuality;
let normalizeChordValues: (values: ChordValues) => { root: ChordRoot; quality: ChordQuality };
let chordInfo: (root: ChordRoot, quality: ChordQuality) => ChordInfo;
let chordQualitiesForRoot: (root: ChordRoot) => ChordInfo[];
let accidentalSuffix: (note: string) => string;
let staffLayoutForRoot: (root: ChordRoot, presentationMode: PresentationMode) => { lineGap: number; lineYs: number[]; memberYs: number[]; rootY: number };
let alterationForMember: (quality: ChordQuality, memberIndex: number) => "lowered" | "raised" | undefined;
let initialized = false;

function initializeChordConstructionModel(): void {
  if (initialized) return;
  initialized = true;
  chordRoots = ["C", "D", "E", "F", "G", "A"];
  chordQualities = ["major", "minor", "diminished", "augmented"];
  const notes: Record<ChordRoot, Record<ChordQuality, string[]>> = {
    C: { major: ["C", "E", "G"], minor: ["C", "E♭", "G"], diminished: ["C", "E♭", "G♭"], augmented: ["C", "E", "G♯"] },
    D: { major: ["D", "F♯", "A"], minor: ["D", "F", "A"], diminished: ["D", "F", "A♭"], augmented: ["D", "F♯", "A♯"] },
    E: { major: ["E", "G♯", "B"], minor: ["E", "G", "B"], diminished: ["E", "G", "B♭"], augmented: ["E", "G♯", "B♯"] },
    F: { major: ["F", "A", "C"], minor: ["F", "A♭", "C"], diminished: ["F", "A♭", "C♭"], augmented: ["F", "A", "C♯"] },
    G: { major: ["G", "B", "D"], minor: ["G", "B♭", "D"], diminished: ["G", "B♭", "D♭"], augmented: ["G", "B", "D♯"] },
    A: { major: ["A", "C♯", "E"], minor: ["A", "C", "E"], diminished: ["A", "C", "E♭"], augmented: ["A", "C♯", "E♯"] },
  };
  const intervals: Record<ChordQuality, { third: IntervalInfo; fifth: IntervalInfo }> = {
    major: { third: { short: "M3", semitones: 4 }, fifth: { short: "P5", semitones: 7 } },
    minor: { third: { short: "m3", semitones: 3 }, fifth: { short: "P5", semitones: 7 } },
    diminished: { third: { short: "m3", semitones: 3 }, fifth: { short: "d5", semitones: 6 } },
    augmented: { third: { short: "M3", semitones: 4 }, fifth: { short: "A5", semitones: 8 } },
  };
  normalizeChordRoot = value => chordRoots.find(root => root === value) ?? "C";
  normalizeChordQuality = value => chordQualities.find(quality => quality === value) ?? "major";
  normalizeChordValues = values => ({ root: normalizeChordRoot(values.root), quality: normalizeChordQuality(values.quality) });
  chordInfo = (root, quality) => ({ quality, notes: notes[root][quality], ...intervals[quality] });
  chordQualitiesForRoot = root => chordQualities.map(quality => chordInfo(root, quality));
  const rootIndex = (root: ChordRoot): number => chordRoots.indexOf(root);
  accidentalSuffix = note => note.slice(1);
  staffLayoutForRoot = (root, presentationMode) => {
    const lineGap = presentationMode === "thumbnail" ? 12 : 18;
    const firstLineY = presentationMode === "thumbnail" ? 12 : 30;
    const rootY = firstLineY + lineGap * 5 - rootIndex(root) * (lineGap / 2);
    return {
      lineGap, lineYs: Array.from({ length: 5 }, (_unused, index) => firstLineY + index * lineGap),
      memberYs: [rootY, rootY - lineGap, rootY - lineGap * 2], rootY,
    };
  };
  alterationForMember = (quality, memberIndex) => {
    if (memberIndex === 1 && (quality === "minor" || quality === "diminished") || memberIndex === 2 && quality === "diminished") return "lowered";
    if (memberIndex === 2 && quality === "augmented") return "raised";
    return undefined;
  };
}

export {
  chordInfo as a, normalizeChordQuality as c, staffLayoutForRoot as d, chordQualitiesForRoot as i, normalizeChordRoot as l,
  chordRoots as n, initializeChordConstructionModel as o, accidentalSuffix as r, alterationForMember as s,
  chordQualities as t, normalizeChordValues as u,
};
