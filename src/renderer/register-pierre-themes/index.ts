import { I3 as getJsxRuntime, e6 as getReactRuntime, type JsxRuntime, type ReactRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";

export interface HighlightPool { setRenderOptions(options: { lineDiffType: string; theme: string }): unknown; terminate?(): void }
export interface HighlightPoolOptions { createPool?: (poolOptions: Record<string, unknown>, highlighterOptions: Record<string, unknown>) => HighlightPool; [key: string]: unknown }

class LRUMap<Key, Value> implements Iterable<[Key, Value]> {
  readonly limit: number;
  private readonly valuesByKey = new Map<Key, Value>();
  constructor(limit = 0, entries?: Iterable<[Key, Value]>) {
    this.limit = limit;
    if (entries != null) this.assign(entries);
  }
  get size(): number { return this.valuesByKey.size; }
  assign(entries: Iterable<[Key, Value]>): void { this.clear(); for (const [key, value] of entries) this.set(key, value); }
  get(key: Key): Value | undefined { const value = this.valuesByKey.get(key); if (value !== undefined) { this.valuesByKey.delete(key); this.valuesByKey.set(key, value); } return value; }
  find(key: Key): Value | undefined { return this.valuesByKey.get(key); }
  has(key: Key): boolean { return this.valuesByKey.has(key); }
  set(key: Key, value: Value): this {
    this.valuesByKey.delete(key); this.valuesByKey.set(key, value);
    if (this.limit > 0 && this.valuesByKey.size > this.limit) this.shift();
    return this;
  }
  shift(): [Key, Value] | undefined { const first = this.valuesByKey.entries().next(); if (first.done) return undefined; this.valuesByKey.delete(first.value[0]); return first.value; }
  delete(key: Key): Value | undefined { const value = this.valuesByKey.get(key); this.valuesByKey.delete(key); return value; }
  clear(): void { this.valuesByKey.clear(); }
  keys(): IterableIterator<Key> { return this.valuesByKey.keys(); }
  values(): IterableIterator<Value> { return this.valuesByKey.values(); }
  entries(): IterableIterator<[Key, Value]> { return this.valuesByKey.entries(); }
  [Symbol.iterator](): IterableIterator<[Key, Value]> { return this.entries(); }
  forEach(callback: (value: Value, key: Key, map: this) => void, receiver: unknown = this): void { for (const [key, value] of this) callback.call(receiver, value, key, this); }
  toJSON(): Array<{ key: Key; value: Value }> { return [...this].map(([key, value]) => ({ key, value })); }
  toString(): string { return [...this].map(([key, value]) => `${String(key)}:${String(value)}`).join(" < "); }
}

let react: ReactRuntime;
let jsx: JsxRuntime;
let HighlightPoolContext: unknown;
let singletonPool: HighlightPool | undefined;
let mountedProviders = 0;

function initializePoolManager(): void {}
function getOrCreatePool(poolOptions: HighlightPoolOptions, highlighterOptions: Record<string, unknown>): HighlightPool {
  singletonPool ??= poolOptions.createPool?.(poolOptions, highlighterOptions) ?? { setRenderOptions: (options) => options };
  return singletonPool;
}
function terminatePool(): void { singletonPool?.terminate?.(); singletonPool = undefined; }

function initializeProvider(): void {
  initializePoolManager();
  react = getReactRuntime(); jsx = getJsxRuntime();
  HighlightPoolContext = react.createContext<HighlightPool | undefined>(undefined);
}

function HighlightPoolProvider(props: { children?: unknown; highlighterOptions: Record<string, unknown>; poolOptions: HighlightPoolOptions }): unknown {
  ensureRuntime();
  const [pool] = react.useState(() => typeof window === "undefined" ? undefined : getOrCreatePool(props.poolOptions, props.highlighterOptions));
  react.useInsertionEffect(() => { if (pool == null) return; mountedProviders += 1; return () => { mountedProviders -= 1; }; }, [pool]);
  react.useEffect(() => () => { if (mountedProviders === 0) terminatePool(); }, []);
  const context = HighlightPoolContext as { Provider: unknown };
  return jsx.jsx(context.Provider, { value: pool, children: props.children });
}

function useHighlightPool(): HighlightPool | undefined { ensureRuntime(); return react.useContext(HighlightPoolContext as { Provider: unknown; Consumer: unknown }); }
function registerPierreThemes(): void {}
function ensureRuntime(): void { if (react == null || jsx == null || HighlightPoolContext == null) initializeProvider(); }

const lruModule = { LRUMap };

export { useHighlightPool as a, initializeProvider as i, HighlightPoolContext as n, lruModule as o, HighlightPoolProvider as r, registerPierreThemes as t };
