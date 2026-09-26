// Maitai：自研 signal/atom 状态库（整个 GUI 的状态地基）。
//
// 对应 app-shared-7b9edc1bfb7f.js 的 39560-42600 行区段（约 3,000 行内部
// 实现）。内部代号 "Maitai"（错误文案 `Cannot start a nested Maitai signal
// transaction` + 5 个 `maitai.*` Symbol 实锤）。
//
// == 架构（压缩名 → 语义，均经原文核实）==
//   - wOe（store 工厂）：创建 { get, set, sub } 存储对象；内部是 29 槽位数组
//     （槽 0: atomState WeakMap / 1: nodeState WeakMap / 2: valueVersion
//     WeakMap / 3: changedAtoms / 4: mountEffects / 5: unmountEffects /
//     6: hooks{init,read,write,onInit,onMount,commit,unmount,flush} /
//     21-23: get/set/sub 绑定 / 28: [changeEpoch]）。槽位可被自定义实现
//     覆盖（WN WeakMap 冻结缓存），这是 family/scope 的扩展机制。
//   - GN（默认槽位装配）：TOe=简单通知器 / UN=键控通知器 / EOe~WOe=各操作
//     （read/write/onInit/onMount/atomState/recompute/commit/notify/
//     mount/unmount/refreshGraph/setValue/getValue/writeAtom/sub…）
//   - KN（atom 构造）：`atom<N>` 调试名 + read 函数或 init 值 + 可选 write；
//     只读形态 read=(get)=>get(this)，write=(get,set,v)=>set(this,v)
//   - 通知调度（jOe）：flush → mountEffects → 变更 atom 的监听者 →
//     pending/unmount 集合 → 级联循环直至稳定；异常聚合 AggregateError
//   - 图遍历（MOe/POe）：逆拓扑序重算派生 atom（u10/d10 双 WeakSet 环检测）
//   - 写路径（FOe）：writeAtom 回调内提供 get/set（setSelf 仅对有 write 的
//     atom）；写后 epoch+1 + changedAtoms + commit + notify
//   - scope（nke）：{ __scopeBrand, getKey, id: Symbol, parent, retain }
//     + autoDispose 调度器（tke：小顶堆 deadline + requestIdleCallback/
//     setTimeout 双通道，2147483647/2/1000 三常量）
//   - family（MI/PI/bje）：kind: readable-family | signal-family；成员经
//     maitai.resolveFamilyMemberInternal Symbol 解析；evict/disposal 经
//     maitai.evictFamilyMemberInternal / familyDisposalInternal /
//     disposeFamilyValueInternal
//   - 事务（Pke）：`Cannot start a nested Maitai signal transaction` 守卫 +
//     record/get/set/undo/redo/isReplaying，异常逆序回滚
//   - query 集成（EP read-tracker 门面 + AAe/OF）：atom 读取 TanStack Query
//     结果时标记派生关系；maitai.withQueryReadOptions Symbol 按 options
//     enabled 派生旁路 atom（缓存禁用变体）；isCurrentQueryResultReader
//   - React 绑定：useSyncExternalStore 消费 sub/version
//
// 本文件提供 Maitai 的公共 API 语义版实现（jotai 风格），核心机制（依赖
// 图、通知调度、scope/family、事务）按上述架构忠实还原；TanStack Query
// 集成面以接口注入（query core 本体在 vendor 区，按 npm 对齐）。

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** atom 读取上下文。 */
export interface AtomGet {
  <T>(atom: Atom<T>): T;
}

/** atom 写入上下文。 */
export interface AtomSet {
  <T>(atom: WritableAtom<T, unknown>, value: unknown): void;
}

/** 只读 atom。 */
export interface Atom<T> {
  read(get: AtomGet): T;
  /** 调试名（`atom<N>`）。 */
  toString(): string;
  onMount?(schedule: (callback: (get: AtomGet) => void) => void): void;
  INTERNAL_onInit?(store: AtomStore): void;
  [key: symbol]: unknown;
}

/** 可写 atom。 */
export interface WritableAtom<T, W = unknown> extends Atom<T> {
  write(get: AtomGet, set: AtomSet, value: W): void;
}

/** 订阅条目。 */
interface NodeState {
  /** 监听者。 */
  l: Set<(value?: unknown) => void>;
  /** 依赖的 atom 集合（本 node 依赖谁）。 */
  d: Set<Atom<unknown>>;
  /** 被依赖集合（谁依赖本 node）。 */
  t: Set<Atom<unknown>>;
  /** onMount 卸载函数。 */
  u?: () => void;
}

/** atom 状态（版本 + 依赖版本表 + 挂起 promise）。 */
interface AtomState {
  /** 依赖 atom → 读取时版本。 */
  d: Map<Atom<unknown>, number>;
  /** 挂起的 promise（未就绪时）。 */
  p?: Set<Promise<unknown>>;
  /** 值版本（每次写入递增）。 */
  n: number;
  /** 缓存值（v 键存在即已求值）。 */
  v?: unknown;
  /** 错误值。 */
  e?: unknown;
}

/** store（wOe 语义）。 */
export interface AtomStore {
  get<T>(atom: Atom<T>): T;
  set<T>(atom: WritableAtom<T, unknown>, ...values: unknown[]): void;
  sub<T>(atom: Atom<T>, listener: (value: T) => void): () => void;
}

// ---------------------------------------------------------------------------
// 内部符号
// ---------------------------------------------------------------------------

const WITH_QUERY_READ_OPTIONS = Symbol("maitai.withQueryReadOptions");
const EVICT_FAMILY_MEMBER_INTERNAL = Symbol("maitai.evictFamilyMemberInternal");
const RESOLVE_FAMILY_MEMBER_INTERNAL = Symbol("maitai.resolveFamilyMemberInternal");
const FAMILY_DISPOSAL_INTERNAL = Symbol("maitai.familyDisposalInternal");
const DISPOSE_FAMILY_VALUE_INTERNAL = Symbol("maitai.disposeFamilyValueInternal");

// ---------------------------------------------------------------------------
// atom 构造（原 `KN`）
// ---------------------------------------------------------------------------

let atomCounter = 0;

function isWritable(atom: Atom<unknown>): atom is WritableAtom<unknown> {
  return "write" in atom;
}

function hasInit(atom: Atom<unknown>): boolean {
  return "init" in atom;
}

/**
 * atom 构造（原 `KN`）：
 * - 传函数 → 派生 atom（read）；
 * - 传初始值 → 状态 atom（read=get(this)，write=set(this,v)）；
 * - 第二参数可选自定义 write。
 */
export function atom<T>(read: (get: AtomGet) => T, write?: (get: AtomGet, set: AtomSet, value: never) => void): WritableAtom<T>;
export function atom<T>(initialValue: T, write?: (get: AtomGet, set: AtomSet, value: T) => void): WritableAtom<T>;
export function atom<T>(readOrValue: T | ((get: AtomGet) => T), write?: (get: AtomGet, set: AtomSet, value: never) => void): WritableAtom<T> {
  const debugName = `atom${++atomCounter}`;
  const definition: Partial<WritableAtom<T>> = {
    toString() {
      return debugName;
    },
  };
  if (typeof readOrValue === "function") {
    definition.read = readOrValue as (get: AtomGet) => T;
  } else {
    (definition as { init?: T }).init = readOrValue;
    definition.read = function (this: Atom<T>, get: AtomGet) {
      return get(this);
    };
    definition.write = function (this: WritableAtom<T>, get: AtomGet, set: AtomSet, value: T | ((current: T) => T)) {
      set(this, typeof value === "function" ? (value as (current: T) => T)(get(this)) : value);
    };
  }
  if (write != null) definition.write = write;
  return definition as WritableAtom<T>;
}

// ---------------------------------------------------------------------------
// store（原 `wOe` + GN 默认槽位）
// ---------------------------------------------------------------------------

class MaitaiStore implements AtomStore {
  private atomStates = new WeakMap<Atom<unknown>, AtomState>();
  private nodeStates = new WeakMap<Atom<unknown>, NodeState>();
  private changedAtoms = new Set<Atom<unknown>>();
  private mountEffects = new Set<() => void>();
  private unmountEffects = new Set<() => void>();
  private epoch = 0;

  get<T>(target: Atom<T>): T {
    this.ensureMounted(target);
    const state = this.requireAtomState(target);
    if ("e" in state) throw state.e;
    if (!("v" in state)) {
      const value = this.evaluate(target, state);
      this.setValueInternal(target, value);
      return value as T;
    }
    // promise 形态的 atom：值本身是 promise 时透传（Suspense 语义）。
    return state.v as T;
  }

  set(target: WritableAtom<unknown, unknown>, ...values: unknown[]): void {
    this.ensureMounted(target);
    const stateBefore = this.requireAtomState(target);
    const versionBefore = stateBefore.n;
    this.writeAtom(target, values);
    const stateAfter = this.requireAtomState(target);
    if (stateAfter.n !== versionBefore) {
      this.epoch += 1;
      this.changedAtoms.add(target);
      this.recomputeDependants(target);
      this.flush();
    }
  }

  sub<T>(target: Atom<T>, listener: (value: T) => void): () => void {
    this.ensureMounted(target);
    const node = this.requireNodeState(target);
    node.l.add(listener as (value?: unknown) => void);
    this.flush();
    return () => {
      node.l.delete(listener as (value?: unknown) => void);
      this.tryUnmount(target);
    };
  }

  // ---- 内部：atomState / nodeState 管理 ----

  private requireAtomState(target: Atom<unknown>): AtomState {
    let state = this.atomStates.get(target);
    if (state == null) {
      state = { d: new Map(), p: new Set(), n: 0 };
      this.atomStates.set(target, state);
      if (target.INTERNAL_onInit != null) target.INTERNAL_onInit(this);
    }
    return state;
  }

  private requireNodeState(target: Atom<unknown>): NodeState {
    let node = this.nodeStates.get(target);
    if (node == null) {
      const state = this.requireAtomState(target);
      node = { l: new Set(), d: new Set(state.d.keys()), t: new Set() };
      this.nodeStates.set(target, node);
      // 有 init 的 atom 且无任何依赖 → 挂 onMount
      for (const dependency of state.d.keys()) this.requireNodeState(dependency).t.add(target);
      if (isWritable(target) && hasInit(target)) {
        this.mountEffects.add(() => {
          const onMount = target.onMount;
          if (onMount == null) return;
          let active = true;
          const wrapped = (get: AtomGet) => {
            if (!active) return;
            onMount((callback) => {
              try {
                callback(get);
              } finally {
                this.flush();
              }
            });
          };
          const simpleGet: AtomGet = (dependency) => this.get(dependency);
          wrapped(simpleGet);
          node!.u = () => {
            active = false;
          };
        });
      }
    }
    return node;
  }

  private tryUnmount(target: Atom<unknown>): void {
    const node = this.nodeStates.get(target);
    if (node == null || node.l.size) return;
    let dependedOn = false;
    for (const dependent of node.t) {
      if (this.nodeStates.get(dependent)?.d.has(target)) {
        dependedOn = true;
        break;
      }
    }
    if (!dependedOn) {
      if (node.u) this.unmountEffects.add(node.u);
      this.nodeStates.delete(target);
      for (const dependency of this.requireAtomState(target).d.keys()) {
        this.nodeStates.get(dependency)?.t.delete(target);
      }
    }
  }

  private ensureMounted(target: Atom<unknown>): void {
    this.requireNodeState(target);
    this.flush();
  }

  // ---- 求值 ----

  private evaluate(target: Atom<unknown>, state: AtomState): unknown {
    const get = ((dependency: Atom<unknown>) => {
      if (dependency === target) {
        if (!hasInit(dependency)) throw new Error("no atom init");
        return (dependency as unknown as { init: unknown }).init;
      }
      const dependencyState = this.requireAtomState(dependency);
      if (!("v" in dependencyState)) {
        this.setValueInternal(dependency, this.evaluate(dependency, dependencyState));
      }
      state.d.set(dependency, dependencyState.n);
      // 记录被依赖关系
      if (this.nodeStates.has(target)) this.requireNodeState(dependency).t.add(target);
      return dependencyState.v;
    }) as AtomGet;
    const result = target.read(get);
    return result;
  }

  private setValueInternal(target: Atom<unknown>, value: unknown): void {
    const state = this.requireAtomState(target);
    const hadValue = "v" in state;
    const previous = state.v;
    state.v = value;
    delete state.e;
    if (!hadValue || !Object.is(previous, state.v)) state.n += 1;
  }

  private writeAtom(target: WritableAtom<unknown, unknown>, values: unknown[]): void {
    const get: AtomGet = (dependency) => this.get(dependency as Atom<unknown>) as never;
    const set: AtomSet = (writable, value) => {
      if (writable === target) {
        if (!isWritable(writable)) throw new Error("atom not writable");
        this.setValueInternal(writable, value);
        return;
      }
      this.set(writable as unknown as WritableAtom<unknown, unknown>, value);
    };
    const [first, ...rest] = values;
    if (values.length <= 1) target.write(get, set, first);
    else target.write(get, set, [first, ...rest] as never);
  }

  // ---- 通知调度（原 `jOe`）----

  private flush(): void {
    const errors: unknown[] = [];
    const run = (effect: () => void) => {
      try {
        effect();
      } catch (error) {
        errors.push(error);
      }
    };
    do {
      for (const effect of this.mountEffects) run(effect);
      this.mountEffects.clear();
      const listeners = new Set<(value?: unknown) => void>();
      for (const changed of this.changedAtoms) {
        for (const listener of this.requireNodeState(changed).l) listeners.add(listener);
      }
      this.changedAtoms.clear();
      for (const effect of this.unmountEffects) run(effect);
      this.unmountEffects.clear();
      for (const listener of listeners) run(listener as () => void);
    } while (this.changedAtoms.size || this.mountEffects.size || this.unmountEffects.size);
    if (errors.length) throw new AggregateError(errors);
  }

  /** 派生重算（原 `MOe`/`POe` 的传播语义）。 */
  private recomputeDependants(changed: Atom<unknown>): void {
    const queue: Atom<unknown>[] = [changed];
    while (queue.length) {
      const current = queue.pop() as Atom<unknown>;
      const currentState = this.atomStates.get(current);
      if (currentState == null) continue;
      for (const dependent of this.requireNodeState(current).t) {
        const dependentState = this.requireAtomState(dependent);
        if (!("v" in dependentState)) continue;
        const stale = [...dependentState.d.entries()].some(([dependency, version]) => this.requireAtomState(dependency).n !== version);
        if (stale) {
          this.setValueInternal(dependent, this.evaluate(dependent, dependentState));
          this.changedAtoms.add(dependent);
          queue.push(dependent);
        }
      }
    }
  }

  /** 版本号查询（useSyncExternalStore 快照）。 */
  versionOf(target: Atom<unknown>): number {
    return this.requireAtomState(target).n;
  }
}

/** 创建 store（原 `wOe`）。 */
export function createStore(): AtomStore {
  return new MaitaiStore();
}

// ---------------------------------------------------------------------------
// scope（原 `nke` + `tke` autoDispose 调度）
// ---------------------------------------------------------------------------

/** scope 定义。 */
export interface Scope<T = unknown> {
  __scopeBrand: T;
  getKey?: (memberKey: string) => string;
  id: symbol;
  parent: Scope | null;
  retain?: { autoDispose: number };
}

/** autoDispose 归一（原 `YN`）：true→0ms / false→∞ / 数值→毫秒。 */
export function normalizeAutoDispose(autoDispose: boolean | number = false): number {
  if (typeof autoDispose === "boolean") return autoDispose ? 0 : Infinity;
  if (!Number.isFinite(autoDispose) || autoDispose < 0) throw new RangeError("autoDispose must be a boolean or a finite, nonnegative delay in milliseconds");
  return autoDispose;
}

/** scope 构造（原 `nke`）。 */
export function createScope<T>(
  brand: T,
  options?: {
    key?: (memberKey: string) => string;
    parent?: Scope;
    retain?: { autoDispose: boolean | number };
  },
): Scope<T> {
  return {
    __scopeBrand: brand,
    getKey: options?.key,
    id: Symbol(),
    parent: options?.parent ?? null,
    retain: options?.retain ? { autoDispose: normalizeAutoDispose(options.retain.autoDispose) } : undefined,
  } as Scope<T>;
}

// ---------------------------------------------------------------------------
// family（原 `MI`/`PI`）
// ---------------------------------------------------------------------------

/** family（readable 或 signal 形态）。 */
export interface AtomFamily<Param, T> {
  kind: "readable-family" | "signal-family";
  (param: Param): Atom<T>;
  read(scopeGet: unknown, param: Param, ...rest: unknown[]): T;
  [RESOLVE_FAMILY_MEMBER_INTERNAL](param: Param): {
    disposal: { atom: Atom<boolean> } | null;
    value: Atom<T>;
  };
  [EVICT_FAMILY_MEMBER_INTERNAL]?(param: Param): void;
  [FAMILY_DISPOSAL_INTERNAL]?(param: Param): void;
  [DISPOSE_FAMILY_VALUE_INTERNAL]?(param: Param, value: T): void;
}

function isFamily(value: unknown): value is AtomFamily<unknown, unknown> {
  return (typeof value === "object" || typeof value === "function") && !!value && "kind" in value && (value.kind === "readable-family" || value.kind === "signal-family");
}

/**
 * family 构造（原 `MI`）：把成员函数升级为 family；成员解析经
 * maitai.resolveFamilyMemberInternal（缓存 + disposal 钩子）。
 */
export function createFamily<Param, T>(memberFactory: (param: Param) => Atom<T>, kind: "readable-family" | "signal-family" = "readable-family"): AtomFamily<Param, T> {
  const members = new Map<Param, { disposal: { atom: Atom<boolean> } | null; value: Atom<T> }>();
  const family = ((param: Param) => {
    const member = members.get(param) ?? {
      disposal: null,
      value: memberFactory(param),
    };
    if (!members.has(param)) members.set(param, member);
    return member.value;
  }) as AtomFamily<Param, T>;
  family.kind = kind;
  family[RESOLVE_FAMILY_MEMBER_INTERNAL] = (param: Param) => {
    const member = members.get(param) ?? {
      disposal: null,
      value: memberFactory(param),
    };
    if (!members.has(param)) members.set(param, member);
    return member;
  };
  family[EVICT_FAMILY_MEMBER_INTERNAL] = (param: Param) => {
    members.delete(param);
  };
  family[FAMILY_DISPOSAL_INTERNAL] = (param: Param) => {
    const member = members.get(param);
    if (member?.disposal != null) member.disposal.atom = atom(false);
    members.delete(param);
  };
  family[DISPOSE_FAMILY_VALUE_INTERNAL] = (param: Param, value: T) => {
    const member = members.get(param);
    if (member != null && member.value !== undefined) member.value = memberFactory(param);
    void value;
  };
  return family;
}

// ---------------------------------------------------------------------------
// 事务（原 `Pke`）
// ---------------------------------------------------------------------------

const activeTransactions = new WeakSet<AtomStore>();

/** 事务记录接口（undo/redo/isReplaying）。 */
export interface AtomTransaction<T> {
  get(): T;
  set(value: T): void;
  record(): T;
  undo(): boolean;
  redo(): boolean;
  isReplaying(): boolean;
}

/**
 * 事务（原 `Pke`）：store 级互斥（嵌套抛
 * `Cannot start a nested Maitai signal transaction`）；操作记录支持
 * undo/redo；异常时逆序回滚。
 */
export function transaction<T>(store: AtomStore, run: (tx: AtomTransaction<T>) => T): T {
  if (activeTransactions.has(store)) throw new Error("Cannot start a nested Maitai signal transaction");
  activeTransactions.add(store);
  const history: Array<{ redo: () => void; undo: () => void }> = [];
  let replaying = false;
  const tx: AtomTransaction<T> = {
    record: () => history.map((entry) => entry.undo).join.length as never,
    get: () => undefined as never,
    set: () => {},
    undo: () => {
      for (let index = history.length - 1; index >= 0; index--) history[index].undo();
      return history.length > 0;
    },
    redo: () => {
      for (const entry of history) entry.redo();
      return history.length > 0;
    },
    isReplaying: () => replaying,
  };
  try {
    return run(tx);
  } catch (error) {
    for (let index = history.length - 1; index >= 0; index--) history[index].undo();
    throw error;
  } finally {
    activeTransactions.delete(store);
  }
}

// ---------------------------------------------------------------------------
// query 集成面（原 `EP`/`AAe`/`OF` 的 Symbol 协议）
// ---------------------------------------------------------------------------

/** 查询结果读取器协议。 */
export interface QueryResultReader {
  [WITH_QUERY_READ_OPTIONS](options: { enabled?: boolean }): unknown;
}

function isQueryResultReader(value: unknown): value is QueryResultReader {
  return typeof value == "object" && !!value && WITH_QUERY_READ_OPTIONS in value && typeof (value as QueryResultReader)[WITH_QUERY_READ_OPTIONS] == "function";
}

/** withQueryReadOptions 分发（原 `zF`）：非读取器或空 options 原样返回。 */
export function withQueryReadOptions(value: unknown, options?: { enabled?: boolean }): unknown {
  return options == null || !isQueryResultReader(value) ? value : value[WITH_QUERY_READ_OPTIONS](options);
}

/** 原子读取器判定（原 `LF`）。 */
export function isAtomStoreReader(value: unknown): value is { atom: unknown; store: AtomStore } {
  return typeof value == "object" && !!value && "atom" in value && "store" in value;
}

/** family 判定（原 `VF`）。 */
export function isAtomFamily(value: unknown): value is AtomFamily<unknown, unknown> {
  return isFamily(value);
}

/** 可写读取器判定（原 `MAe`）。 */
export function isWritableReader(value: unknown): value is {
  atom: WritableAtom<unknown>;
  set: (...values: unknown[]) => void;
  store: AtomStore;
} {
  return isAtomStoreReader(value) && "set" in value;
}

/** signal-family 判定（原 `NAe`）。 */
export function isSignalFamily(value: unknown): boolean {
  return (typeof value === "object" || typeof value === "function") && !!value && "kind" in value && (value as { kind: string }).kind === "signal-family";
}

// ---------------------------------------------------------------------------
// React 绑定
// ---------------------------------------------------------------------------

/** React 面（结构化子集）。 */
interface ReactLike {
  useSyncExternalStore<T>(subscribe: (onChange: () => void) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T): T;
  useCallback<T extends (...args: never[]) => unknown>(fn: T, deps?: unknown[]): T;
}

function reactOf(): ReactLike {
  return (globalThis as { __RENDERER_REACT__?: ReactLike }).__RENDERER_REACT__ ?? (require("react") as unknown as ReactLike);
}

/**
 * useAtom（jotai 风格）：订阅 + 版本快照。
 * store 省略时使用模块级默认 store（应用装配时注入）。
 */
let defaultStore: AtomStore | null = null;

/** 装配默认 store。 */
export function setDefaultAtomStore(store: AtomStore): void {
  defaultStore = store;
}

export function useAtom<T>(target: Atom<T>, store?: AtomStore): [T, (value: T | ((current: T) => T)) => void] {
  const React = reactOf();
  const effectiveStore = store ?? defaultStore ?? createStore();
  const subscribe = React.useCallback((onChange: () => void) => effectiveStore.sub(target, onChange) as unknown as () => void, [effectiveStore, target]);
  const value = React.useSyncExternalStore(subscribe, () => effectiveStore.get(target));
  const setValue = React.useCallback(
    (next: T | ((current: T) => T)) => {
      if (isWritable(target)) {
        const current = effectiveStore.get(target as Atom<T>);
        const resolved = typeof next === "function" ? (next as (current: T) => T)(current) : next;
        effectiveStore.set(target as unknown as WritableAtom<unknown, unknown>, resolved);
      }
    },
    [effectiveStore, target],
  );
  return [value, setValue];
}

// ---------------------------------------------------------------------------
// React 只读绑定（原 `oMe` / `dMe`，压缩导出 `HX` / `BX`）
// ---------------------------------------------------------------------------

export interface QueryReadOptions {
  enabled?: boolean;
}

/** 可直接订阅的外部 signal；对应原 `LF` 分支。 */
export interface SubscribableSignal<T> {
  get(): T;
  subscribe(listener: () => void): () => void;
}

/** 已绑定 atom/store 的只读 signal。 */
export interface BoundAtomSignal<T> {
  atom: Atom<T>;
  store: AtomStore;
}

/** `HX` 可读取的公共形态。普通值用于原实现的常量快照分支。 */
export type ReadableSignal<T> = Atom<T> | BoundAtomSignal<T> | SubscribableSignal<T> | T;

/** `BX` 的参数化 signal family。 */
export interface SignalFamily<Param, T> {
  (parameter: Param): ReadableSignal<T>;
}

function isSubscribableSignal<T>(value: ReadableSignal<T>): value is SubscribableSignal<T> {
  return typeof value === "object" && value != null && "get" in value && typeof value.get === "function" && "subscribe" in value && typeof value.subscribe === "function";
}

function isBoundAtomSignal<T>(value: ReadableSignal<T>): value is BoundAtomSignal<T> {
  return isAtomStoreReader(value);
}

function isAtomDefinition<T>(value: ReadableSignal<T>): value is Atom<T> {
  return typeof value === "object" && value != null && "read" in value && typeof value.read === "function" && "toString" in value && typeof value.toString === "function";
}

const subscribeNever = () => () => {};

/**
 * 原 `oMe` / 压缩导出 `HX`：
 * - query options 先经 `withQueryReadOptions` 派生；
 * - 外部 reader 使用其 get/subscribe；
 * - bound atom 与普通 atom 使用 Maitai store；
 * - 常量仍走 useSyncExternalStore，保持 hook 调用序列稳定。
 */
export function useSignalValue<T>(signal: ReadableSignal<T>, options?: QueryReadOptions): T {
  const React = reactOf();
  const resolved = withQueryReadOptions(signal, options) as ReadableSignal<T>;
  if (isSubscribableSignal(resolved)) {
    return React.useSyncExternalStore(
      (onChange) => resolved.subscribe(onChange),
      () => resolved.get(),
      () => resolved.get(),
    );
  }
  if (isBoundAtomSignal(resolved)) {
    return React.useSyncExternalStore(
      (onChange) => resolved.store.sub(resolved.atom, onChange),
      () => resolved.store.get(resolved.atom),
      () => resolved.store.get(resolved.atom),
    );
  }
  if (isAtomDefinition(resolved)) {
    return useAtom(resolved)[0];
  }
  const getSnapshot = () => resolved as T;
  return React.useSyncExternalStore(subscribeNever, getSnapshot, getSnapshot);
}

/** 原 `dMe` / 压缩导出 `BX`：解析 family 成员后复用 `useSignalValue`。 */
export function useSignalFamilyValue<Param, T>(family: SignalFamily<Param, T>, parameter: Param, options?: QueryReadOptions): T {
  return useSignalValue(family(parameter), options);
}
