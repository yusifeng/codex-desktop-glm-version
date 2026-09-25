// persisted-atom：渲染侧持久化原子存储（localStorage 遗留 + host 同步）。
//
// 对应 app-initial-51da50e6c6e3.js 的 30391-30600 行区段（压缩名 → 语义）：
//   - Bat/Cf/Vat/Hat/wf/Uat/Wat/Gat/Kat/qat/Jat（Tf() 装配）：
//     localStorage 键前缀 `codex:persisted-atom:` + 值缓存 Map + 精确订阅表 +
//     前缀订阅表 + 待写（debounce）表 + 待失效键集合 + host 持久化函数 +
//     store 版本号 + 同步就绪 promise
//   - _f（30391）：host 持久化函数访问（未初始化抛错）
//   - gat（30396）：值通知（精确订阅者 + 前缀订阅者）
//   - vf/_at/vat/yat（30409-30430）：写缓存/取消待写/清空全部待写/待写到期
//     提交（token + storeRevision 双守卫防陈旧提交；shouldPublish 否决回滚）
//   - yf/Eat/Dat（30452-30470）：读缓存（SSR 回退默认值）/按值反查键/前缀键列表
//   - bf/xf/Oat/kat/Aat（30471-30505）：立即写 / 记录级合并写
//     （recordUpdate.entries 以 hostId 段合并）/ 延迟写（debounce 毫秒）/
//     单键冲刷 / 全部冲刷
//   - Sf（30485）：前缀失效（删缓存并广播 undefined）
//   - jat/Mat/Nat/Pat/Fat（30495-30525）：精确订阅（带 fallback）/前缀订阅/
//     无通知写 / 待失效键集合的注册与查询
//   - Iat（30528）：批量替换（清待写 + 版本号推进 + 删多余键 + 广播 +
//     localStorage 遗留键清除）
//   - bat/xat/Sat/Cat/wat/Tat（30436-30451）：host 全量同步接收（Wat 装配 +
//     整表替换 + sidebar-custom-sections-v3 特例通知参数）/就绪 resolve/
//     等待就绪/读取就绪状态/store 版本号
//   - Lat/Rat/zat（30543-30560）：localStorage 遗留读取/前缀扫描（损坏且
//     非白名单即删除）/清理不在保留集的遗留键
//
// host 同步消息（app-initial 205267 区消费）：persisted-atom-sync /
// persisted-atom-updated / persisted-atom-sync-request；主进程侧存储键为
// electron-persisted-atom-state（见 main-app 各服务）。
//
// 本模块为语义版；键表（vz，~100 键）在 app-shared 45800-45900，见
// settings-schema.ts 与本模块 HOST_STORAGE_KEYS。

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 持久化函数：host 侧写入（key, value, recordUpdate）。 */
export type PersistFunction = (key: string, value: unknown, recordUpdate?: RecordUpdate) => void;

/** 记录级合并更新。 */
export interface RecordUpdate {
  entries: Record<string, unknown>;
  legacyStorageKey?: string;
  [key: string]: unknown;
}

/** 待写条目。 */
interface PendingWrite {
  baseValue: unknown;
  recordUpdate?: RecordUpdate;
  shouldPublish?: () => boolean;
  storeRevision: number;
  timeoutId: ReturnType<typeof setTimeout>;
  token: symbol;
  value: unknown;
}

const STORAGE_KEY_PREFIX = "codex:persisted-atom:";

const values = new Map<string, unknown>();
const exactSubscribers = new Map<string, Set<{ callback: (value: unknown, meta?: unknown) => void; fallback: unknown }>>();
const prefixSubscribers = new Map<string, Set<() => void>>();
const pendingWrites = new Map<string, PendingWrite>();
const pendingInvalidations = new Set<string>();
let persistFunction: PersistFunction | null = null;
let storeRevision = 0;
let readyState: unknown = null;
let readyResolve: ((value: unknown) => void) | null = null;
const readyPromise = new Promise<unknown>((resolve) => {
  readyResolve = resolve;
});

// ---------------------------------------------------------------------------
// 持久化函数访问（原 `_f`）
// ---------------------------------------------------------------------------

function requirePersistFunction(): PersistFunction {
  const fn = persistFunction;
  if (fn) return fn;
  throw new Error("Persisted atom store accessed before initialization");
}

// ---------------------------------------------------------------------------
// 通知（原 `gat`）
// ---------------------------------------------------------------------------

function notifySubscribers(key: string, meta?: unknown): void {
  const subscribers = exactSubscribers.get(key);
  if (subscribers) {
    const hasValue = values.has(key);
    const value = hasValue ? values.get(key) : undefined;
    subscribers.forEach((subscriber) => {
      const effective = hasValue ? value : subscriber.fallback;
      if (meta == null) subscriber.callback(effective);
      else subscriber.callback(effective, meta);
    });
  }
  prefixSubscribers.forEach((subscribersForPrefix, prefix) => {
    if (key.startsWith(prefix)) subscribersForPrefix.forEach((listener) => listener());
  });
}

// ---------------------------------------------------------------------------
// 写与待写管理（原 `vf`/`_at`/`vat`/`yat`）
// ---------------------------------------------------------------------------

/** 写缓存并可选持久化 + 通知（原 `vf`）。 */
function writeValue(key: string, value: unknown, persist: boolean, recordUpdate?: RecordUpdate, meta?: unknown): void {
  const persistFn = requirePersistFunction();
  if (value === undefined) values.delete(key);
  else values.set(key, value);
  if (persist) persistFn(key, value, recordUpdate);
  notifySubscribers(key, meta);
}

/** 取消单键待写（原 `_at`）。 */
function cancelPendingWrite(key: string): void {
  const pending = pendingWrites.get(key);
  if (pending != null) {
    clearTimeout(pending.timeoutId);
    pendingWrites.delete(key);
  }
}

/** 清空全部待写（原 `vat`）。 */
function cancelAllPendingWrites(): void {
  pendingWrites.forEach(({ timeoutId }) => clearTimeout(timeoutId));
  pendingWrites.clear();
}

/** 待写到期提交（原 `yat`）：token + storeRevision 双守卫；shouldPublish 否决回滚。 */
function flushPendingWrite(key: string, token: symbol): void {
  const pending = pendingWrites.get(key);
  if (pending != null && pending.token === token && pending.storeRevision === storeRevision) {
    clearTimeout(pending.timeoutId);
    pendingWrites.delete(key);
    if (pending.shouldPublish?.() === false) {
      writeValue(key, pending.baseValue, false);
      return;
    }
    requirePersistFunction()(key, pending.value, pending.recordUpdate);
  }
}

// ---------------------------------------------------------------------------
// 读（原 `yf`/`Eat`/`Dat`）
// ---------------------------------------------------------------------------

/** 读缓存（SSR 或未初始化回退默认值，原 `yf`）。 */
export function readPersistedAtom<T>(key: string, fallback: T): T {
  return typeof window > "u" ? fallback : values.has(key) ? (values.get(key) as T) : fallback;
}

/** 按值反查首个匹配键（原 `Eat`）。 */
export function findKeyByValue(keyPrefix: string, value: unknown): string | null {
  if (typeof window > "u") return null;
  for (const [key, stored] of values) if (key.startsWith(keyPrefix) && stored === value) return key;
  return null;
}

/** 前缀键列表（原 `Dat`）。 */
export function keysWithPrefix(keyPrefix: string): string[] {
  return typeof window > "u" ? [] : Array.from(values.keys()).filter((key) => key.startsWith(keyPrefix));
}

// ---------------------------------------------------------------------------
// 写 API（原 `bf`/`xf`/`Oat`/`kat`/`Aat`）
// ---------------------------------------------------------------------------

/** 立即写（原 `bf`）。 */
export function writePersistedAtom(key: string, value: unknown): void {
  cancelPendingWrite(key);
  writeValue(key, value, true);
}

/** 记录级合并写（原 `xf`）：entries 按 hostId 段合并，可延迟。 */
export function mergeRecordPersistedAtom(key: string, update: RecordUpdate, debounceMs = 0): void {
  const pending = pendingWrites.get(key);
  const mergedEntries = new Map(Object.entries(pending?.recordUpdate?.entries ?? {}));
  for (const [entryKey, entryValue] of Object.entries(update.entries)) {
    mergedEntries.delete(entryKey);
    mergedEntries.set(entryKey, entryValue);
  }
  const mergedUpdate: RecordUpdate = { ...pending?.recordUpdate, ...update, entries: Object.fromEntries(mergedEntries) };
  const mergedValue = applyRecordUpdate(values.get(key) ?? (mergedUpdate.legacyStorageKey == null ? undefined : values.get(mergedUpdate.legacyStorageKey)), mergedUpdate);
  if (debounceMs === 0) {
    cancelPendingWrite(key);
    writeValue(key, mergedValue, true, mergedUpdate);
  } else if (pending?.recordUpdate == null) {
    schedulePendingWrite(key, mergedValue, debounceMs, { recordUpdate: mergedUpdate });
  } else {
    pending.recordUpdate = mergedUpdate;
    pending.value = mergedValue;
    writeValue(key, mergedValue, false);
  }
}

/** 延迟写（原 `Oat`）。 */
function schedulePendingWrite(key: string, value: unknown, debounceMs: number, options: { recordUpdate?: RecordUpdate; shouldPublish?: () => boolean } = {}): void {
  if (Object.is(pendingWrites.get(key)?.value, value)) return;
  const existing = pendingWrites.get(key);
  const baseValue = existing == null ? values.get(key) : existing.baseValue;
  cancelPendingWrite(key);
  const token = Symbol();
  const timeoutId = setTimeout(() => {
    flushPendingWrite(key, token);
  }, debounceMs);
  pendingWrites.set(key, {
    baseValue,
    recordUpdate: options.recordUpdate,
    shouldPublish: options.shouldPublish,
    storeRevision,
    timeoutId,
    token,
    value,
  });
  writeValue(key, value, false);
}

/** 单键冲刷（原 `kat`）。 */
export function flushPersistedAtom(key: string): void {
  const pending = pendingWrites.get(key);
  if (pending != null) flushPendingWrite(key, pending.token);
}

/** 全部冲刷（原 `Aat`）。 */
export function flushAllPersistedAtoms(): void {
  Array.from(pendingWrites.keys()).forEach(flushPersistedAtom);
}

/** 前缀失效（原 `Sf`）：删缓存并广播 undefined。 */
export function invalidatePersistedAtoms(keyPrefix: string): void {
  new Set([...values.keys(), ...pendingWrites.keys()]).forEach((key) => {
    if (key.startsWith(keyPrefix)) {
      cancelPendingWrite(key);
      writeValue(key, undefined, true);
    }
  });
}

/** recordUpdate 应用到基础值（原 `Ait`，entries 覆盖段合并）。 */
function applyRecordUpdate(baseValue: unknown, update: RecordUpdate): unknown {
  const base = (typeof baseValue == "object" && baseValue != null ? baseValue : {}) as Record<string, unknown>;
  return { ...base, ...update.entries };
}

// ---------------------------------------------------------------------------
// 订阅 API（原 `jat`/`Mat`/`Nat`/`Pat`/`Fat`）
// ---------------------------------------------------------------------------

/** 精确订阅（原 `jat`）：带 fallback。 */
export function subscribePersistedAtom<T>(key: string, fallback: T, callback: (value: T, meta?: unknown) => void): () => void {
  const subscribers = exactSubscribers.get(key) ?? new Set<{ callback: (value: unknown, meta?: unknown) => void; fallback: unknown }>();
  subscribers.add({ callback: callback as (value: unknown, meta?: unknown) => void, fallback });
  exactSubscribers.set(key, subscribers);
  return () => {
    const current = exactSubscribers.get(key);
    if (current != null) {
      current.delete(subscribers.values().next().value!);
      if (current.size === 0) exactSubscribers.delete(key);
    }
  };
}

/** 前缀订阅（原 `Mat`）。 */
export function subscribePersistedAtomPrefix(keyPrefix: string, listener: () => void): () => void {
  const subscribers = prefixSubscribers.get(keyPrefix) ?? new Set<() => void>();
  subscribers.add(listener);
  prefixSubscribers.set(keyPrefix, subscribers);
  return () => {
    subscribers.delete(listener);
    if (subscribers.size === 0) prefixSubscribers.delete(keyPrefix);
  };
}

/** 无通知写（原 `Nat`）：待写 recordUpdate 场景下仅更新基础值。 */
export function writePersistedAtomWithoutNotify(key: string, value: unknown, meta?: unknown): void {
  const pending = pendingWrites.get(key);
  if (pending?.recordUpdate != null && value !== undefined) {
    pending.baseValue = value;
    pending.value = applyRecordUpdate(value, pending.recordUpdate);
    writeValue(key, pending.value, false);
    return;
  }
  if (pending != null && pending.recordUpdate == null && Object.is(value, pending.baseValue)) return;
  cancelPendingWrite(key);
  writeValue(key, value, false, undefined, meta);
}

/** 待失效键注册（原 `Pat`）。 */
export function registerPendingInvalidation(key: string): () => void {
  pendingInvalidations.add(key);
  return () => pendingInvalidations.delete(key);
}

/** 待失效键查询（原 `Fat`）。 */
export function hasPendingInvalidation(key: string): boolean {
  return pendingInvalidations.has(key);
}

// ---------------------------------------------------------------------------
// host 批量同步（原 `Iat`/`bat`/`xat`/`Sat`/`Cat`/`wat`/`Tat`）
// ---------------------------------------------------------------------------

/**
 * 批量替换（原 `Iat`）：
 * 保留键之外全部删除并广播；版本号推进；清除保留集之外的 localStorage 遗留键。
 */
export function replacePersistedAtomState(retainedKeys: Iterable<string>): void {
  const retained = new Set(retainedKeys);
  retained.forEach(flushPersistedAtom);
  const toRemove = Array.from(new Set([...values.keys(), ...pendingWrites.keys()])).filter((key) => !retained.has(key));
  cancelAllPendingWrites();
  storeRevision += 1;
  toRemove.forEach((key) => values.delete(key));
  const persistFn = persistFunction;
  if (persistFn) toRemove.forEach((key) => persistFn(key, undefined));
  toRemove.forEach((key) => notifySubscribers(key));
  pruneLegacyLocalStorage(retained);
}

/** host 全量同步接收（原 `bat`）：装配持久化函数 + 整表替换。 */
export function installPersistedAtomHost(
  state: Record<string, unknown>,
  persist: PersistFunction,
  specialMeta?: unknown,
): void {
  cancelAllPendingWrites();
  storeRevision += 1;
  const allKeys = new Set([...values.keys(), ...Object.keys(state)]);
  values.clear();
  Object.entries(state).forEach(([key, value]) => {
    if (value !== undefined) values.set(key, value);
  });
  persistFunction = persist;
  allKeys.forEach((key) =>
    notifySubscribers(key, key === "sidebar-custom-sections-v3" ? specialMeta : undefined),
  );
}

/** 同步就绪 resolve（原 `xat`）。 */
export function markPersistedAtomSyncReady(state: unknown): void {
  if (readyResolve != null) {
    readyState = state;
    readyResolve(state);
    readyResolve = null;
  }
}

/** 等待同步就绪（原 `Sat`）。 */
export async function waitForPersistedAtomSync(): Promise<unknown> {
  await readyPromise;
  return readyState;
}

/** 就绪状态（原 `Cat`）。 */
export function persistedAtomSyncReadyState(): unknown {
  return readyState;
}

/** 就绪 promise（原 `wat`）。 */
export function persistedAtomSyncPromise(): Promise<unknown> {
  return readyPromise;
}

/** store 版本号（原 `Tat`）。 */
export function persistedAtomStoreRevision(): number {
  return storeRevision;
}

// ---------------------------------------------------------------------------
// localStorage 遗留（原 `Lat`/`Rat`/`zat`）
// ---------------------------------------------------------------------------

/** 单键遗留读取（原 `Lat`）。 */
function readLegacyLocalStorage(key: string): unknown {
  if (typeof window > "u") return undefined;
  const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
  if (raw != null) {
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/** 前缀扫描遗留（原 `Rat`）：跳过已知键；损坏且非白名单即删除。 */
export function readLegacyLocalStorageByPrefix(prefix: string, knownKeys?: Set<string>, corruptedAllowlist: string[] = []): Record<string, unknown> {
  if (typeof window > "u" || !window.localStorage) return {};
  const result: Record<string, unknown> = {};
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const storageKey = window.localStorage.key(index);
    if (!storageKey || !storageKey.startsWith(prefix) || knownKeys?.has(storageKey.slice(prefix.length))) continue;
    const raw = window.localStorage.getItem(storageKey);
    if (raw != null) {
      try {
        result[storageKey.replace(prefix, "")] = JSON.parse(raw);
      } catch {
        if (!corruptedAllowlist.includes(storageKey.slice(prefix.length))) window.localStorage.removeItem(storageKey);
      }
    }
  }
  return result;
}

/** 清理不在保留集的遗留键（原 `zat`）。 */
function pruneLegacyLocalStorage(retainedKeys?: Iterable<string>): void {
  if (typeof window > "u" || !window.localStorage) return;
  const retained = retainedKeys == null ? [] : Array.from(retainedKeys);
  const toRemove: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const storageKey = window.localStorage.key(index);
    if (storageKey && storageKey.startsWith(STORAGE_KEY_PREFIX) && !retained.includes(storageKey.slice(STORAGE_KEY_PREFIX.length)))
      toRemove.push(storageKey);
  }
  toRemove.forEach((storageKey) => window.localStorage.removeItem(storageKey));
}

export { readLegacyLocalStorage, STORAGE_KEY_PREFIX };
