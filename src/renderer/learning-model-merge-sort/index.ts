// Merge-sort teaching model. Release chunk: model-4513eb800a0e.js.
import "@rchunk/rolldown-runtime";
type Key = `value${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
interface Values extends Partial<Record<Key, number>> {
  activeCount?: number | null;
  step?: number | null;
}
interface Item {
  id: string;
  value: number;
}
interface Run {
  items: Item[];
  level: number;
  start: number;
}
interface Frame {
  activeLeft: Item[];
  activeRight: Item[];
  completedRuns: Run[];
  leftIndex: number;
  mergeLevel: number;
  mergeStart: number;
  output: Item[];
  phase:
    "initial" | "split" | "base" | "compare" | "append" | "merged" | "complete";
  rightIndex: number;
  splitDepth: number;
  chosenSide?: "left" | "right";
}
const keys: Key[] = [
    "value1",
    "value2",
    "value3",
    "value4",
    "value5",
    "value6",
    "value7",
    "value8",
  ],
  defaults = [38, 12, 27, 43, 9, 31, 18, 25];
const definition = {
  type: "MERGE_SORT",
  version: 2,
  thumbnailAssetKey: "merge-sort-v1",
  parameters: Object.fromEntries(
    keys.map((key, index) => [
      key,
      { kind: "integer", defaultValue: defaults[index], min: 1, max: 99 },
    ]),
  ),
};
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);
const activeCount = (value: unknown) => (value === 7 ? 7 : 8);
const normalize = (input: Values): Record<Key, number> =>
  Object.fromEntries(
    keys.map((key, index) => [
      key,
      clamp(
        Math.round(
          Number.isFinite(input[key]) ? Number(input[key]) : defaults[index],
        ),
        1,
        99,
      ),
    ]),
  ) as Record<Key, number>;
const defaultValues = () => ({ ...normalize({}), activeCount: 8, step: 0 });
const splitRows = (items: Item[]) => {
  const rows: Item[][][] = [[[...items]]];
  let row = rows[0]!;
  while (row.some((run) => run.length > 1)) {
    row = row.flatMap((run) =>
      run.length === 1
        ? [run]
        : [
            run.slice(0, Math.floor(run.length / 2)),
            run.slice(Math.floor(run.length / 2)),
          ],
    );
    rows.push(row);
  }
  return rows;
};
const emptyFrame = (phase: Frame["phase"], depth: number): Frame => ({
  activeLeft: [],
  activeRight: [],
  completedRuns: [],
  leftIndex: 0,
  mergeLevel: 0,
  mergeStart: 0,
  output: [],
  phase,
  rightIndex: 0,
  splitDepth: depth,
});
const buildTrace = (values: Record<Key, number>, requested = 8) => {
  const count = activeCount(requested),
    source = keys
      .slice(0, count)
      .map((key, index) => ({ id: `source-${index + 1}`, value: values[key] })),
    rows = splitRows(source),
    depth = rows.length - 1,
    frames: Frame[] = [emptyFrame("initial", 0)];
  for (let index = 1; index < depth; index += 1)
    frames.push(emptyFrame("split", index));
  frames.push(emptyFrame("base", depth));
  const completed: Run[] = [];
  const merge = (items: Item[], start: number): Item[] => {
    if (items.length === 1) return [...items];
    const middle = Math.floor(items.length / 2),
      left = merge(items.slice(0, middle), start),
      right = merge(items.slice(middle), start + middle),
      level = Math.ceil(Math.log2(items.length)),
      output: Item[] = [];
    let leftIndex = 0,
      rightIndex = 0;
    while (leftIndex < left.length && rightIndex < right.length) {
      const leftItem = left[leftIndex],
        rightItem = right[rightIndex];
      if (!leftItem || !rightItem)
        throw Error("Merge sort comparison is missing a front element.");
      const chosenSide = leftItem.value <= rightItem.value ? "left" : "right";
      frames.push({
        activeLeft: [...left],
        activeRight: [...right],
        chosenSide,
        completedRuns: [...completed],
        leftIndex,
        mergeLevel: level,
        mergeStart: start,
        output: [...output],
        phase: "compare",
        rightIndex,
        splitDepth: depth,
      });
      if (chosenSide === "left") {
        output.push(leftItem);
        leftIndex += 1;
      } else {
        output.push(rightItem);
        rightIndex += 1;
      }
    }
    frames.push({
      activeLeft: [...left],
      activeRight: [...right],
      completedRuns: [...completed],
      leftIndex,
      mergeLevel: level,
      mergeStart: start,
      output: [...output],
      phase: "append",
      rightIndex,
      splitDepth: depth,
    });
    output.push(...left.slice(leftIndex), ...right.slice(rightIndex));
    completed.push({ items: [...output], level, start });
    frames.push({
      activeLeft: [...left],
      activeRight: [...right],
      completedRuns: [...completed],
      leftIndex: left.length,
      mergeLevel: level,
      mergeStart: start,
      output: [...output],
      phase: "merged",
      rightIndex: right.length,
      splitDepth: depth,
    });
    return output;
  };
  const sorted = merge(source, 0);
  frames.push({
    activeLeft: [],
    activeRight: [],
    completedRuns: [...completed],
    leftIndex: 0,
    mergeLevel: depth,
    mergeStart: 0,
    output: [...sorted],
    phase: "complete",
    rightIndex: 0,
    splitDepth: depth,
  });
  return { completedMerges: completed, frames, splitRows: rows };
};
const derive = (input: Values) => {
  const safe = normalize(input),
    count = activeCount(input.activeCount),
    trace = buildTrace(safe, count),
    maxStep = trace.frames.length - 1,
    step = clamp(
      Math.round(Number.isFinite(input.step) ? Number(input.step) : 0),
      0,
      maxStep,
    );
  return {
    ...trace,
    frame: trace.frames[step] ?? trace.frames[0],
    maxStep,
    values: { ...safe, activeCount: count, step },
  };
};
const shuffle = (input: Values, random: () => number = Math.random) => {
  const safe = normalize(input),
    count = activeCount(input.activeCount),
    all = keys.map((key) => safe[key]),
    head = all.slice(0, count),
    mixed = [...head];
  for (let index = mixed.length - 1; index > 0; index -= 1) {
    const target = clamp(Math.floor(random() * (index + 1)), 0, index);
    [mixed[index], mixed[target]] = [mixed[target]!, mixed[index]!];
  }
  if (
    mixed.every((value, index) => value === head[index]) &&
    head.some((value) => value !== head[0])
  )
    mixed.push(mixed.shift()!);
  return {
    ...Object.fromEntries(
      keys.map((key, index) => [key, [...mixed, ...all.slice(count)][index]]),
    ),
    activeCount: count,
    step: 0,
  } as Record<Key, number> & { activeCount: number; step: number };
};
function initializeSpecification(): void {}
function initializeModel(): void {}
export {
  initializeSpecification as a,
  shuffle as i,
  defaultValues as n,
  definition as o,
  initializeModel as r,
  derive as t,
};
