// Hash-table collision resolution learning model. Release chunk: model-8a1ce53f2bd0.js.
import "@rchunk/rolldown-runtime";

type ResolutionStrategy = "separate chaining" | "linear probing";
type HashPhase = "mapping" | "insert" | "collision" | "trace" | "placed" | "lookup";
interface HashTableValues { resolution_strategy?: string | null; step?: number | null }
interface HashTableManifest {
  type: string; version: number; thumbnailAssetKey: string; canonicalFormula: string;
  parameters: { resolution_strategy: { kind: "enum"; defaultValue: ResolutionStrategy; allowedValues: ResolutionStrategy[] } };
}
interface HashTableState {
  activeKey: number | null; chainPath: number[]; chains: number[][]; comparisons: number; homeIndex: number | null;
  insertedCount: number; phase: HashPhase; probePath: number[]; slots: Array<number | null>;
  values: { resolution_strategy: ResolutionStrategy; step: number };
}

let hashTableManifest: HashTableManifest;
let hashKeys: number[];
let hashKey: (key: number) => number;
let normalizeHashTableValues: (values: HashTableValues) => { resolution_strategy: ResolutionStrategy; step: number };
let calculateHashTableState: (values: HashTableValues) => HashTableState;
let defaultHashTableValues: () => { resolution_strategy: ResolutionStrategy; step: number };
let manifestInitialized = false;
let modelInitialized = false;

function initializeHashTableManifest(): void {
  if (manifestInitialized) return;
  manifestInitialized = true;
  hashTableManifest = {
    type: "HASH_TABLE_COLLISIONS", version: 2, thumbnailAssetKey: "hash-table-collisions-v1", canonicalFormula: "h(k)=k\\bmod 7",
    parameters: { resolution_strategy: { kind: "enum", defaultValue: "separate chaining", allowedValues: ["separate chaining", "linear probing"] } },
  };
}

function initializeHashTableCollisionsModel(): void {
  if (modelInitialized) return;
  modelInitialized = true;
  initializeHashTableManifest();
  hashKeys = [7, 8, 13, 20, 27];
  const defaultStrategy: ResolutionStrategy = hashTableManifest.parameters.resolution_strategy.defaultValue === "linear probing"
    ? "linear probing" : "separate chaining";
  hashKey = key => key % 7;
  normalizeHashTableValues = values => ({
    resolution_strategy: values.resolution_strategy === "linear probing" || values.resolution_strategy === "separate chaining"
      ? values.resolution_strategy : defaultStrategy,
    step: typeof values.step === "number" && Number.isFinite(values.step) ? Math.min(Math.max(Math.round(values.step), 0), 9) : 0,
  });
  const insertedCountAtStep = (step: number): number => step === 0 ? 0 : step <= 3 ? step : step <= 4 ? 3 : step <= 7 ? 4 : 5;
  const activeKeyAtStep = (step: number): number | null => step === 0 ? null : step <= 3 ? hashKeys[step - 1] ?? null : step <= 5 ? 20 : 27;
  const phaseAtStep = (step: number): HashPhase => step === 0 ? "mapping" : step <= 3 ? "insert" : step === 4 || step === 6
    ? "collision" : step === 7 ? "trace" : step === 9 ? "lookup" : "placed";
  const buildLinearProbing = (count: number): { paths: Map<number, number[]>; slots: Array<number | null> } => {
    const slots: Array<number | null> = Array(7).fill(null);
    const paths = new Map<number, number[]>();
    hashKeys.slice(0, count).forEach(key => {
      const path: number[] = [];
      let index = hashKey(key);
      while (slots[index] !== null) { path.push(index); index = (index + 1) % 7; }
      path.push(index); slots[index] = key; paths.set(key, path);
    });
    return { paths, slots };
  };
  calculateHashTableState = values => {
    const normalized = normalizeHashTableValues(values);
    const insertedCount = insertedCountAtStep(normalized.step);
    const activeKey = activeKeyAtStep(normalized.step);
    const phase = phaseAtStep(normalized.step);
    const chains = Array.from({ length: 7 }, (_, bucket) => hashKeys.slice(0, insertedCount).filter(key => hashKey(key) === bucket));
    const { paths, slots } = buildLinearProbing(insertedCount);
    const chainPath = normalized.resolution_strategy === "separate chaining" && activeKey !== null && (phase === "trace" || phase === "lookup")
      ? chains[hashKey(activeKey)] ?? [] : [];
    let probePath: number[] = [];
    if (normalized.resolution_strategy === "linear probing" && activeKey !== null) {
      probePath = phase === "collision" ? [hashKey(activeKey)] : phase === "trace" && activeKey === 27 ? [6, 0, 1, 2] : paths.get(activeKey) ?? [];
    }
    return {
      activeKey, chainPath, chains,
      comparisons: normalized.resolution_strategy === "separate chaining" ? activeKey === null ? 0 : chains[hashKey(activeKey)]?.length ?? 0 : probePath.length,
      homeIndex: activeKey === null ? null : hashKey(activeKey), insertedCount, phase, probePath, slots, values: normalized,
    };
  };
  defaultHashTableValues = () => ({ resolution_strategy: defaultStrategy, step: 8 });
}

export { initializeHashTableCollisionsModel as a, hashKey as i, calculateHashTableState as n, initializeHashTableManifest as o, defaultHashTableValues as r, hashTableManifest as s, hashKeys as t };
