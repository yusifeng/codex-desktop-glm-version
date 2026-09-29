// Insertion-sort teaching model. Release chunk: model-9ce2e0b98e4f.js.
import "@rchunk/rolldown-runtime";
type Key = `value${1 | 2 | 3 | 4 | 5 | 6 | 7}`;
interface Values extends Partial<Record<Key, number>> {
  step?: number | null;
}
interface Item {
  id: string;
  originPosition: number;
  value: number;
}
interface Frame {
  activeEnd: number;
  items: Item[];
  passNumber: number;
  phase: "initial" | "select" | "compare" | "shift" | "insert" | "complete";
  sortedPrefixEnd: number;
  keyId?: string;
  comparisonId?: string;
  comparisonOutcome?: "shift" | "stop";
  insertionReason?: "front" | "predecessor";
}
const keys: Key[] = [
  "value1",
  "value2",
  "value3",
  "value4",
  "value5",
  "value6",
  "value7",
];
const defaults = [7, 3, 8, 2, 6, 4, 5];
const definition = {
  type: "INSERTION_SORT",
  version: 1,
  thumbnailAssetKey: "insertion-sort-v1",
  parameters: Object.fromEntries(
    keys.map((key, index) => [
      key,
      {
        kind: "number",
        defaultValue: defaults[index],
        min: 1,
        max: 9,
        multipleOf: 1,
      },
    ]),
  ),
};
const maxValue = 9;
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const normalize = (input: Values): Record<Key, number> =>
  Object.fromEntries(
    keys.map((key, index) => [
      key,
      clamp(
        Math.round(
          Number.isFinite(input[key]) ? Number(input[key]) : defaults[index],
        ),
        1,
        9,
      ),
    ]),
  ) as Record<Key, number>;
const defaultValues = () => ({ ...normalize({}), step: 0 });
const items = (values: Record<Key, number>): Item[] =>
  keys.map((key, index) => ({
    id: `source-${index + 1}`,
    originPosition: index + 1,
    value: values[key],
  }));
const trace = (values: Record<Key, number>): Frame[] => {
  const list = items(values),
    frames: Frame[] = [
      {
        activeEnd: 0,
        items: [...list],
        passNumber: 0,
        phase: "initial",
        sortedPrefixEnd: 0,
      },
    ];
  for (let pass = 1; pass < list.length; pass += 1) {
    const key = list[pass];
    if (!key) throw Error("Insertion sort pass is missing its key item.");
    frames.push({
      activeEnd: pass,
      items: [...list],
      keyId: key.id,
      passNumber: pass,
      phase: "select",
      sortedPrefixEnd: pass - 1,
    });
    let index = pass,
      reason: "front" | "predecessor" = "front";
    while (index > 0) {
      const previous = list[index - 1];
      if (!previous)
        throw Error("Insertion sort comparison is missing its predecessor.");
      const shift = previous.value > key.value;
      frames.push({
        activeEnd: pass,
        comparisonId: previous.id,
        comparisonOutcome: shift ? "shift" : "stop",
        items: [...list],
        keyId: key.id,
        passNumber: pass,
        phase: "compare",
        sortedPrefixEnd: pass - 1,
      });
      if (!shift) {
        reason = "predecessor";
        break;
      }
      list[index] = previous;
      list[index - 1] = key;
      index -= 1;
      frames.push({
        activeEnd: pass,
        comparisonId: previous.id,
        items: [...list],
        keyId: key.id,
        passNumber: pass,
        phase: "shift",
        sortedPrefixEnd: pass - 1,
      });
    }
    frames.push({
      activeEnd: pass,
      items: [...list],
      insertionReason: reason,
      keyId: key.id,
      passNumber: pass,
      phase: "insert",
      sortedPrefixEnd: pass,
    });
  }
  frames.push({
    activeEnd: list.length - 1,
    items: [...list],
    passNumber: list.length - 1,
    phase: "complete",
    sortedPrefixEnd: list.length - 1,
  });
  return frames;
};
const derive = (input: Values) => {
  const safe = normalize(input),
    frames = trace(safe),
    maxStep = frames.length - 1,
    step = clamp(
      Math.round(Number.isFinite(input.step) ? Number(input.step) : 0),
      0,
      maxStep,
    );
  return {
    frame: frames[step] ?? frames[0],
    frames,
    maxStep,
    values: { ...safe, step },
  };
};
const nextBoundary = (frames: Frame[], step: number) => {
  const current = clamp(Math.round(step), 0, frames.length - 1),
    frame = frames[current];
  if (!frame || frame.phase === "complete") return current;
  const pass =
    frame.phase === "initial"
      ? 1
      : frame.phase === "insert"
        ? frame.passNumber + 1
        : frame.passNumber;
  for (let index = current + 1; index < frames.length; index += 1) {
    const candidate = frames[index];
    if (candidate?.phase === "insert" && candidate.passNumber === pass)
      return index;
  }
  return frames.length - 1;
};
const shuffle = (input: Values, random: () => number = Math.random) => {
  const safe = normalize(input),
    original = keys.map((key) => safe[key]),
    shuffled = [...original];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = clamp(Math.floor(random() * (index + 1)), 0, index);
    [shuffled[index], shuffled[target]] = [shuffled[target]!, shuffled[index]!];
  }
  if (
    shuffled.every((value, index) => value === original[index]) &&
    original.some((value) => value !== original[0])
  )
    shuffled.push(shuffled.shift()!);
  return {
    ...Object.fromEntries(keys.map((key, index) => [key, shuffled[index]])),
    step: 0,
  } as Record<Key, number> & { step: number };
};
const findItem = (frame: Frame, id: string) => {
  const item = frame.items.find((candidate) => candidate.id === id);
  if (!item) throw Error(`Insertion sort frame is missing item ${id}.`);
  return item;
};
function initializeSpecification(): void {}
function initializeModel(): void {}
export {
  nextBoundary as a,
  initializeSpecification as c,
  findItem as i,
  definition as l,
  derive as n,
  initializeModel as o,
  defaultValues as r,
  shuffle as s,
  maxValue as t,
};
