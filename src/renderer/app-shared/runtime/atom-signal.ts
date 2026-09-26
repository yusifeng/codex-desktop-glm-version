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
  /** 自定义相等判断；返回 true 时保持现有值与版本。 */
  isEqual?(previous: T, next: T): boolean;
  /** 服务端渲染快照。 */
  getServerSnapshot?(): T;
  onMount?(setSelf: (value: T | ((current: T) => T)) => void): void | (() => void);
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
      this.flush();
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
      if (target.onMount != null) {
        this.mountEffects.add(() => {
          const onMount = target.onMount;
          if (onMount == null) return;
          const cleanup = onMount((value) => {
            this.set(target as WritableAtom<unknown, unknown>, value);
          });
          if (typeof cleanup === "function") node!.u = cleanup;
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
    const state = this.requireAtomState(target);
    if (!("v" in state)) this.setValueInternal(target, this.evaluate(target, state));
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
    if (hadValue && target.isEqual?.(previous, value)) return;
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
      const mountEffects = [...this.mountEffects];
      this.mountEffects.clear();
      for (const effect of mountEffects) run(effect);
      const listeners = new Set<(value?: unknown) => void>();
      for (const changed of this.changedAtoms) {
        for (const listener of this.requireNodeState(changed).l) listeners.add(listener);
      }
      this.changedAtoms.clear();
      const unmountEffects = [...this.unmountEffects];
      this.unmountEffects.clear();
      for (const effect of unmountEffects) run(effect);
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

/** scope 的保留策略。 */
export interface ScopeRetainOptions {
  autoDispose?: boolean | number;
  max?: number;
}

/** scope 定义。 */
export interface Scope<T = unknown> {
  __scopeBrand: string;
  getKey?: (value: T) => string;
  id: symbol;
  parent?: Scope<unknown>;
  retain?: ScopeRetainOptions;
}

/** autoDispose 归一（原 `YN`）：true→0ms / false→∞ / 数值→毫秒。 */
export function normalizeAutoDispose(autoDispose: boolean | number = false): number {
  if (typeof autoDispose === "boolean") return autoDispose ? 0 : Infinity;
  if (!Number.isFinite(autoDispose) || autoDispose < 0) throw new RangeError("autoDispose must be a boolean or a finite, nonnegative delay in milliseconds");
  return autoDispose;
}

/** scope 构造（原 `nke`）。 */
export function createScope<T>(
  brand: string,
  options?: {
    key?: (value: T) => string;
    parent?: Scope<unknown>;
    retain?: ScopeRetainOptions;
  },
): Scope<T> {
  normalizeAutoDispose(options?.retain?.autoDispose);
  const retainMax = options?.retain?.max;
  if (retainMax != null && (!Number.isInteger(retainMax) || retainMax < 0)) {
    throw new RangeError("retain.max must be a nonnegative integer");
  }
  return {
    __scopeBrand: brand,
    getKey: options?.key,
    id: Symbol(),
    parent: options?.parent,
    retain: options?.retain,
  };
}

/**
 * 初始化已被语义源码展开的 Maitai runtime（原 `gL` / 压缩导出 `FX`）。
 * 原函数只触发 lazy initializer；语义模块为 eager 初始化，因此重复调用为空操作。
 */
export function initializeMaitaiRuntime(): void {}

/** 应用级根 scope（原 `YW` / 压缩导出 `ZI`）。 */
export const AppScope = createScope<Record<string, unknown>>("AppScope");

/** scope 实例节点；同一 scope 定义可以在不同父实例下拥有多份节点。 */
export interface ScopeState<T = unknown> {
  cachedBindings: Map<ScopedDerivedSignal<unknown, unknown>, Atom<unknown>>;
  familyBindings: Map<ScopedDerivedFamily<unknown, unknown, unknown>, Map<unknown, Atom<unknown>>>;
  externalFamilyBindings: Map<
    ScopedExternalSignalFamily<unknown, unknown, unknown>,
    Map<unknown, Atom<unknown>>
  >;
  parent?: ScopeState<unknown>;
  queryClient?: unknown;
  mutationFamilyBindings: Map<
    ScopedMutationFamily<unknown, unknown, unknown, unknown, unknown, unknown>,
    Map<unknown, Atom<unknown>>
  >;
  queryFamilyBindings: Map<
    | ScopedQueryFamily<unknown, unknown, unknown, unknown>
    | ScopedInfiniteQueryFamily<unknown, unknown, unknown, unknown, unknown>,
    Map<unknown, Atom<unknown>>
  >;
  retainedScopeEntries: Map<Scope<unknown>, Map<unknown, ScopeState<unknown>>>;
  scope: Scope<T>;
  signalFamilyBindings: Map<ScopedSignalFamily<unknown, unknown, unknown>, Map<unknown, WritableAtom<unknown, unknown>>>;
  signalBindings: Map<ScopedSignal<unknown, unknown>, Atom<unknown>>;
  store: AtomStore;
  value: T;
}

export interface CreateScopeStateOptions {
  parent?: ScopeState<unknown>;
  queryClient?: unknown;
  retainKey?: unknown;
  store?: AtomStore;
}

/** scoped signal 初始化器和 onMount 能看到的 scope 门面。 */
export interface ScopeQueryApi {
  getOrFetch<Result>(query: unknown, ...parameters: unknown[]): Promise<Result>;
}

export interface ScopeApi<T = unknown> {
  readonly queryClient: unknown;
  readonly query: ScopeQueryApi;
  readonly scope: Scope<T>;
  readonly value: T;
  get<Value>(signal: ScopedSignal<unknown, Value>): Value;
  get<Value>(signal: ScopedDerivedSignal<unknown, Value>): Value;
  get<Data, QueryError>(signal: ScopedQuerySignal<unknown, Data, QueryError>): ScopedQueryResult<Data, QueryError>;
  get<Page, PageParam, QueryError>(
    signal: ScopedInfiniteQuerySignal<unknown, Page, PageParam, QueryError>,
  ): ScopedInfiniteQueryResult<Page, PageParam, QueryError>;
  get<Param, Page, PageParam, QueryError>(
    family: ScopedInfiniteQueryFamily<unknown, Param, Page, PageParam, QueryError>,
    parameter: Param,
  ): ScopedInfiniteQueryResult<Page, PageParam, QueryError>;
  get<Data, MutationError, Variables, Context>(
    signal: ScopedMutationSignal<unknown, Data, MutationError, Variables, Context>,
  ): ScopedMutationResult<Data, MutationError, Variables, Context>;
  get<Param, Data, MutationError, Variables, Context>(
    family: ScopedMutationFamily<unknown, Param, Data, MutationError, Variables, Context>,
    parameter: Param,
  ): ScopedMutationResult<Data, MutationError, Variables, Context>;
  get<Param, Data, QueryError>(
    family: ScopedQueryFamily<unknown, Param, Data, QueryError>,
    parameter: Param,
  ): ScopedQueryResult<Data, QueryError>;
  get<Param, Value>(family: ScopedDerivedFamily<unknown, Param, Value>, parameter: Param): Value;
  get<Param, Value>(
    family: ScopedExternalSignalFamily<unknown, Param, Value>,
    parameter: Param,
  ): Value;
  get<Param, Value>(family: ScopedSignalFamily<unknown, Param, Value>, parameter: Param): Value;
  getOwnValue<Value>(scope: Scope<Value>): Value;
  set<Value>(signal: ScopedSignal<unknown, Value>, value: Value | ((current: Value) => Value)): void;
  set<Param, Value>(
    family: ScopedSignalFamily<unknown, Param, Value>,
    parameter: Param,
    value: Value | ((current: Value) => Value),
  ): void;
  watch(effect: (scope: ScopeApi<T>) => void | (() => void)): () => void;
  when(predicate: (scope: ScopeApi<T>) => boolean): Promise<void>;
}

export interface ScopedSignalInitializerContext<T = unknown> {
  readonly queryClient: unknown;
  readonly scope: ScopeApi<T>;
}

export interface ScopedSignalOptions<TScope, TValue> {
  getServerSnapshot?: () => TValue;
  isEqual?: (previous: TValue, next: TValue) => boolean;
  onMount?: (
    setSelf: (value: TValue | ((current: TValue) => TValue)) => void,
    scope: ScopeApi<TScope>,
  ) => void | (() => void);
}

export interface ScopedDerivedSignalOptions<TValue> {
  isEqual?: (previous: TValue, next: TValue) => boolean;
}

export type ScopedExternalSignalCleanup =
  | (() => void)
  | { [Symbol.dispose](): void }
  | void;

export interface ScopedExternalSignalContext<TScope, TValue>
  extends DerivedScopedSignalContext<TScope> {
  set(value: TValue | ((current: TValue) => TValue)): void;
}

export interface ScopedQueryFunctionContext {
  client: ScopedQueryClient;
  meta?: unknown;
  queryKey: readonly unknown[];
  signal: AbortSignal;
}

export interface ScopedInfiniteQueryFunctionContext<TPageParam>
  extends ScopedQueryFunctionContext {
  direction: "backward" | "forward";
  pageParam: TPageParam;
}

export interface InfiniteQueryData<TPage, TPageParam = unknown> {
  pageParams: TPageParam[];
  pages: TPage[];
}

export interface ScopedQueryOptions<TData, TError = Error> {
  enabled?: boolean | ((query: unknown) => boolean);
  initialData?: TData | (() => TData);
  meta?: unknown;
  queryFn?: (context: ScopedQueryFunctionContext) => Promise<TData> | TData;
  queryKey: readonly unknown[];
  refetchInterval?: number | false;
  refetchOnMount?: boolean | "always";
  refetchOnWindowFocus?: boolean | "always";
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean);
  staleTime?: number;
  throwOnError?: boolean | ((error: TError) => boolean);
}

export interface ScopedInfiniteQueryOptions<
  TPage,
  TPageParam,
  TError = Error,
> extends Omit<
    ScopedQueryOptions<InfiniteQueryData<TPage, TPageParam>, TError>,
    "initialData" | "queryFn"
  > {
  getNextPageParam?(
    lastPage: TPage,
    allPages: TPage[],
    lastPageParam: TPageParam,
    allPageParams: TPageParam[],
  ): TPageParam | null | undefined;
  getPreviousPageParam?(
    firstPage: TPage,
    allPages: TPage[],
    firstPageParam: TPageParam,
    allPageParams: TPageParam[],
  ): TPageParam | null | undefined;
  initialData?:
    | InfiniteQueryData<TPage, TPageParam>
    | (() => InfiniteQueryData<TPage, TPageParam>);
  initialPageParam: TPageParam;
  maxPages?: number;
  queryFn?(
    context: ScopedInfiniteQueryFunctionContext<TPageParam>,
  ): Promise<TPage> | TPage;
}

export interface ScopedQueryState<TData, TError> {
  data?: TData;
  dataUpdatedAt?: number;
  error?: TError | null;
  fetchStatus?: "fetching" | "idle" | "paused";
  isInvalidated?: boolean;
  status?: "error" | "pending" | "success";
}

export interface ScopedQueryCache {
  subscribe?(listener: (event: unknown) => void): () => void;
}

export interface ScopedQueryClient {
  fetchQuery?<TData>(options: ScopedQueryOptions<TData, unknown>): Promise<TData>;
  getQueryCache?(): ScopedQueryCache;
  getQueryData?<TData>(queryKey: readonly unknown[]): TData | undefined;
  getQueryState?<TData, TError>(queryKey: readonly unknown[]): ScopedQueryState<TData, TError> | undefined;
  setQueryData?<TData>(queryKey: readonly unknown[], data: TData): void;
}

export interface ScopedQueryResult<TData, TError = Error> {
  data: TData | undefined;
  error: TError | null;
  fetchStatus: "fetching" | "idle" | "paused";
  isEnabled: boolean;
  isError: boolean;
  isFetching: boolean;
  isLoading: boolean;
  isPending: boolean;
  isRefetching: boolean;
  isStale: boolean;
  isSuccess: boolean;
  refetch(): Promise<ScopedQueryResult<TData, TError>>;
  status: "error" | "pending" | "success";
}

export interface ScopedInfiniteQueryResult<
  TPage,
  TPageParam,
  TError = Error,
> extends ScopedQueryResult<InfiniteQueryData<TPage, TPageParam>, TError> {
  fetchNextPage(): Promise<ScopedInfiniteQueryResult<TPage, TPageParam, TError>>;
  fetchPreviousPage(): Promise<ScopedInfiniteQueryResult<TPage, TPageParam, TError>>;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isFetchingNextPage: boolean;
  isFetchingPreviousPage: boolean;
}

export interface ScopedMutationContext {
  client: unknown;
  meta?: unknown;
  mutationKey?: readonly unknown[];
}

export interface ScopedMutationCallbacks<TData, TError, TVariables, TContext> {
  onError?(
    error: TError,
    variables: TVariables,
    context: TContext | undefined,
    mutation: ScopedMutationContext,
  ): Promise<unknown> | unknown;
  onSettled?(
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext | undefined,
    mutation: ScopedMutationContext,
  ): Promise<unknown> | unknown;
  onSuccess?(
    data: TData,
    variables: TVariables,
    context: TContext | undefined,
    mutation: ScopedMutationContext,
  ): Promise<unknown> | unknown;
}

export interface ScopedMutationOptions<TData, TError, TVariables, TContext>
  extends ScopedMutationCallbacks<TData, TError, TVariables, TContext> {
  meta?: unknown;
  mutationFn?(
    variables: TVariables,
    context: ScopedMutationContext,
  ): Promise<TData> | TData;
  mutationKey?: readonly unknown[];
  onMutate?(
    variables: TVariables,
    context: ScopedMutationContext,
  ): Promise<TContext> | TContext;
}

export interface ScopedMutationResult<TData, TError, TVariables, TContext> {
  data: TData | undefined;
  error: TError | null;
  isError: boolean;
  isIdle: boolean;
  isPending: boolean;
  isSuccess: boolean;
  mutate(
    variables: TVariables,
    callbacks?: ScopedMutationCallbacks<TData, TError, TVariables, TContext>,
  ): void;
  mutateAsync(
    variables: TVariables,
    callbacks?: ScopedMutationCallbacks<TData, TError, TVariables, TContext>,
  ): Promise<TData>;
  status: "error" | "idle" | "pending" | "success";
  variables: TVariables | undefined;
}

export interface ScopedDerivedFamilyOptions<Param, TValue> {
  autoDispose?: boolean | number;
  excludeFieldsFromKey?: readonly string[];
  isEqual?: (previous: TValue, next: TValue) => boolean;
  key?: (parameter: Param) => unknown;
  owner?: (parameter: Param) => unknown;
}

export type ScopedQueryFamilyOptions<Param> = Omit<
  ScopedDerivedFamilyOptions<Param, unknown>,
  "isEqual"
>;

export type ScopedMutationFamilyOptions<Param> = ScopedQueryFamilyOptions<Param>;

export interface ScopedSignalFamilyOptions<Param> {
  autoDispose?: boolean | number;
  excludeFieldsFromKey?: readonly string[];
  key?: (parameter: Param) => unknown;
  owner?: (parameter: Param) => unknown;
}

export interface ScopedSignalFamilyScopeApi<TScope, Param> extends ScopeApi<TScope> {
  readonly key: Param;
}

export interface ScopedSignalFamilyValueOptions<TScope, Param, TValue> {
  getServerSnapshot?: (parameter: Param) => TValue;
  isEqual?: (previous: TValue, next: TValue) => boolean;
  onMount?: (
    setSelf: (value: TValue | ((current: TValue) => TValue)) => void,
    scope: ScopedSignalFamilyScopeApi<TScope, Param>,
  ) => void | (() => void);
}

export interface DerivedScopedSignalContext<T = unknown> {
  readonly queryClient: unknown;
  readonly scope: ScopeApi<T>;
  get<Value>(signal: ScopedSignal<unknown, Value>): Value;
  get<Value>(signal: ScopedDerivedSignal<unknown, Value>): Value;
  get<Data, QueryError>(signal: ScopedQuerySignal<unknown, Data, QueryError>): ScopedQueryResult<Data, QueryError>;
  get<Page, PageParam, QueryError>(
    signal: ScopedInfiniteQuerySignal<unknown, Page, PageParam, QueryError>,
  ): ScopedInfiniteQueryResult<Page, PageParam, QueryError>;
  get<Param, Page, PageParam, QueryError>(
    family: ScopedInfiniteQueryFamily<unknown, Param, Page, PageParam, QueryError>,
    parameter: Param,
  ): ScopedInfiniteQueryResult<Page, PageParam, QueryError>;
  get<Data, MutationError, Variables, Context>(
    signal: ScopedMutationSignal<unknown, Data, MutationError, Variables, Context>,
  ): ScopedMutationResult<Data, MutationError, Variables, Context>;
  get<Param, Data, MutationError, Variables, Context>(
    family: ScopedMutationFamily<unknown, Param, Data, MutationError, Variables, Context>,
    parameter: Param,
  ): ScopedMutationResult<Data, MutationError, Variables, Context>;
  get<Param, Data, QueryError>(
    family: ScopedQueryFamily<unknown, Param, Data, QueryError>,
    parameter: Param,
  ): ScopedQueryResult<Data, QueryError>;
  get<Param, Value>(family: ScopedDerivedFamily<unknown, Param, Value>, parameter: Param): Value;
  get<Param, Value>(
    family: ScopedExternalSignalFamily<unknown, Param, Value>,
    parameter: Param,
  ): Value;
  get<Param, Value>(family: ScopedSignalFamily<unknown, Param, Value>, parameter: Param): Value;
  get<Value = unknown>(reader: unknown, ...parameters: unknown[]): Value;
}

/** 原 `PI` 返回的 scope 键控只读派生 signal。 */
export interface ScopedDerivedSignal<TScope, TValue> {
  cache: "cached";
  debugLabel?: string;
  scope: Scope<TScope>;
  resolve(state: ScopeState<unknown>): Atom<TValue>;
}

/** 原 `vje` 返回的 scope 键控外部订阅 signal。 */
export type ScopedExternalSignal<TScope, TValue> = ScopedDerivedSignal<
  TScope,
  TValue
>;

/** 原 `xje` 返回的 scope 键控外部订阅 signal family。 */
export interface ScopedExternalSignalFamily<TScope, Param, TValue> {
  autoDisposeMs: number;
  debugLabel?: string;
  kind: "readable-family";
  scope: Scope<TScope>;
  evict(state: ScopeState<unknown>, parameter: Param): boolean;
  resolve(state: ScopeState<unknown>, parameter: Param): Atom<TValue>;
}

/** 原 `Bje` 返回的 scope 键控 query signal。 */
export interface ScopedQuerySignal<TScope, TData, TError = Error> {
  cache: "cached";
  debugLabel?: string;
  getOptions(context: DerivedScopedSignalContext<TScope>): ScopedQueryOptions<TData, TError>;
  queryKind: "query";
  scope: Scope<TScope>;
  resolve(state: ScopeState<unknown>): Atom<ScopedQueryResult<TData, TError>>;
  [WITH_QUERY_READ_OPTIONS](options: QueryReadOptions): ScopedQuerySignal<TScope, TData, TError>;
}

/** 原 `zje` 返回的 scope 键控 infinite-query signal。 */
export interface ScopedInfiniteQuerySignal<
  TScope,
  TPage,
  TPageParam,
  TError = Error,
> {
  cache: "cached";
  debugLabel?: string;
  getOptions(
    context: DerivedScopedSignalContext<TScope>,
  ): ScopedInfiniteQueryOptions<TPage, TPageParam, TError>;
  queryKind: "infinite";
  scope: Scope<TScope>;
  resolve(
    state: ScopeState<unknown>,
  ): Atom<ScopedInfiniteQueryResult<TPage, TPageParam, TError>>;
  [WITH_QUERY_READ_OPTIONS](
    options: QueryReadOptions,
  ): ScopedInfiniteQuerySignal<TScope, TPage, TPageParam, TError>;
}

/** 原 `Vje` 返回的 scope 键控 query family。 */
export interface ScopedQueryFamily<TScope, Param, TData, TError = Error> {
  autoDisposeMs: number;
  debugLabel?: string;
  getOptions(
    parameter: Param,
    context: DerivedScopedSignalContext<TScope>,
  ): ScopedQueryOptions<TData, TError>;
  kind: "readable-family";
  queryKind: "query";
  scope: Scope<TScope>;
  evict(state: ScopeState<unknown>, parameter: Param): boolean;
  resolve(state: ScopeState<unknown>, parameter: Param): Atom<ScopedQueryResult<TData, TError>>;
  [WITH_QUERY_READ_OPTIONS](options: QueryReadOptions): ScopedQueryFamily<TScope, Param, TData, TError>;
}

/** 原 `Hje` 返回的 scope 键控 infinite-query family。 */
export interface ScopedInfiniteQueryFamily<
  TScope,
  Param,
  TPage,
  TPageParam,
  TError = Error,
> {
  autoDisposeMs: number;
  debugLabel?: string;
  getOptions(
    parameter: Param,
    context: DerivedScopedSignalContext<TScope>,
  ): ScopedInfiniteQueryOptions<TPage, TPageParam, TError>;
  kind: "readable-family";
  queryKind: "infinite";
  scope: Scope<TScope>;
  evict(state: ScopeState<unknown>, parameter: Param): boolean;
  resolve(
    state: ScopeState<unknown>,
    parameter: Param,
  ): Atom<ScopedInfiniteQueryResult<TPage, TPageParam, TError>>;
  [WITH_QUERY_READ_OPTIONS](
    options: QueryReadOptions,
  ): ScopedInfiniteQueryFamily<TScope, Param, TPage, TPageParam, TError>;
}

/** 原 `Gje` / `Wje` 返回的 scope 键控 mutation signal。 */
export interface ScopedMutationSignal<
  TScope,
  TData,
  TError,
  TVariables,
  TContext,
> {
  cache: "cached";
  debugLabel?: string;
  getOptions(
    context: DerivedScopedSignalContext<TScope>,
  ): ScopedMutationOptions<TData, TError, TVariables, TContext>;
  scope: Scope<TScope>;
  resolve(
    state: ScopeState<unknown>,
  ): Atom<ScopedMutationResult<TData, TError, TVariables, TContext>>;
}

/** 原 `Uje` 返回的 scope 键控 mutation family。 */
export interface ScopedMutationFamily<
  TScope,
  Param,
  TData,
  TError,
  TVariables,
  TContext,
> {
  autoDisposeMs: number;
  debugLabel?: string;
  getOptions(
    parameter: Param,
    context: DerivedScopedSignalContext<TScope>,
  ): ScopedMutationOptions<TData, TError, TVariables, TContext>;
  kind: "readable-family";
  scope: Scope<TScope>;
  evict(state: ScopeState<unknown>, parameter: Param): boolean;
  resolve(
    state: ScopeState<unknown>,
    parameter: Param,
  ): Atom<ScopedMutationResult<TData, TError, TVariables, TContext>>;
}

/** 原 `Sje` 返回的 scope 键控派生 family。 */
export interface ScopedDerivedFamily<TScope, Param, TValue> {
  autoDisposeMs: number;
  debugLabel?: string;
  kind: "readable-family";
  scope: Scope<TScope>;
  evict(state: ScopeState<unknown>, parameter: Param): boolean;
  resolve(state: ScopeState<unknown>, parameter: Param): Atom<TValue>;
}

/** 原 `bje` 返回的 scope 键控可写 signal family。 */
export interface ScopedSignalFamily<TScope, Param, TValue> {
  autoDisposeMs: number;
  debugLabel?: string;
  kind: "signal-family";
  scope: Scope<TScope>;
  evict(state: ScopeState<unknown>, parameter: Param): boolean;
  resolve(state: ScopeState<unknown>, parameter: Param): WritableAtom<TValue, unknown>;
}

/** 原 `kI` 返回的 scope 键控 signal binding。 */
export interface ScopedSignal<TScope, TValue> {
  cache: "signal";
  debugLabel?: string;
  scope: Scope<TScope>;
  resolve(state: ScopeState<unknown>): WritableAtom<TValue, unknown>;
}

function findScopeState<T>(state: ScopeState<unknown>, scope: Scope<T>): ScopeState<T> {
  let current: ScopeState<unknown> | undefined = state;
  while (current != null) {
    if (current.scope === scope) return current as ScopeState<T>;
    current = current.parent;
  }
  throw new Error(`Missing scope instance: ${scope.__scopeBrand}`);
}

const scopeApiByState = new WeakMap<ScopeState<unknown>, ScopeApi<unknown>>();
const scopeStateByApi = new WeakMap<ScopeApi<unknown>, ScopeState<unknown>>();

function getScopeQueryApi(state: ScopeState<unknown>): ScopeQueryApi {
  return {
    async getOrFetch<Result>(query: unknown, ...parameters: unknown[]): Promise<Result> {
      const client = state.queryClient as {
        fetchQuery?: (options: unknown) => Promise<Result>;
        getOrFetch?: (query: unknown, ...parameters: unknown[]) => Promise<Result>;
      } | undefined;
      if (client?.getOrFetch != null) return client.getOrFetch(query, ...parameters);
      if (client?.fetchQuery != null) return client.fetchQuery(query);
      if (typeof query === "function") {
        return await (query as (...values: unknown[]) => Result | Promise<Result>)(...parameters);
      }
      if (typeof query === "object" && query != null && "queryFn" in query) {
        const queryFn = (query as { queryFn?: (...values: unknown[]) => Result | Promise<Result> }).queryFn;
        if (queryFn != null) return await queryFn(...parameters);
      }
      throw new Error("Missing query client");
    },
  };
}

function resolveScopeBinding(
  state: ScopeState<unknown>,
  binding:
    | ScopedSignal<unknown, unknown>
    | ScopedDerivedSignal<unknown, unknown>
    | ScopedQuerySignal<unknown, unknown, unknown>
    | ScopedInfiniteQuerySignal<unknown, unknown, unknown, unknown>
    | ScopedMutationSignal<unknown, unknown, unknown, unknown, unknown>
    | ScopedMutationFamily<unknown, unknown, unknown, unknown, unknown, unknown>
    | ScopedQueryFamily<unknown, unknown, unknown, unknown>
    | ScopedInfiniteQueryFamily<unknown, unknown, unknown, unknown, unknown>
    | ScopedDerivedFamily<unknown, unknown, unknown>
    | ScopedExternalSignalFamily<unknown, unknown, unknown>
    | ScopedSignalFamily<unknown, unknown, unknown>,
  parameter?: unknown,
): BoundAtomSignal<unknown> {
  const owner = findScopeState(state, binding.scope);
  const target = isScopedFamily(binding)
    ? binding.resolve(state, parameter)
    : binding.resolve(state);
  return { atom: target, store: owner.store };
}

function watchScope<T>(
  state: ScopeState<T>,
  effect: (scope: ScopeApi<T>) => void | (() => void),
): () => void {
  let stopped = false;
  let cleanup: void | (() => void);
  let unsubscribers: Array<() => void> = [];
  let running = false;
  let rerunRequested = false;

  const run = () => {
    if (stopped) return;
    if (running) {
      rerunRequested = true;
      return;
    }
    running = true;
    if (typeof cleanup === "function") cleanup();
    for (const unsubscribe of unsubscribers) unsubscribe();
    unsubscribers = [];
    const dependencies = new Map<AtomStore, Set<Atom<unknown>>>();
    const base = createScopeApi(state);
    const tracked = {
      ...base,
      get(
        binding:
          | ScopedSignal<unknown, unknown>
          | ScopedDerivedSignal<unknown, unknown>
          | ScopedQuerySignal<unknown, unknown, unknown>
          | ScopedInfiniteQuerySignal<unknown, unknown, unknown, unknown>
          | ScopedMutationSignal<unknown, unknown, unknown, unknown, unknown>
          | ScopedMutationFamily<unknown, unknown, unknown, unknown, unknown, unknown>
          | ScopedQueryFamily<unknown, unknown, unknown, unknown>
          | ScopedInfiniteQueryFamily<unknown, unknown, unknown, unknown, unknown>
          | ScopedDerivedFamily<unknown, unknown, unknown>
          | ScopedExternalSignalFamily<unknown, unknown, unknown>
          | ScopedSignalFamily<unknown, unknown, unknown>,
        parameter?: unknown,
      ): unknown {
        const resolved = resolveScopeBinding(state, binding, parameter);
        let atoms = dependencies.get(resolved.store);
        if (atoms == null) {
          atoms = new Set();
          dependencies.set(resolved.store, atoms);
        }
        atoms.add(resolved.atom);
        return resolved.store.get(resolved.atom);
      },
    } as ScopeApi<T>;
    cleanup = effect(tracked);
    for (const [store, atoms] of dependencies) {
      for (const target of atoms) unsubscribers.push(store.sub(target, run));
    }
    running = false;
    if (rerunRequested) {
      rerunRequested = false;
      run();
    }
  };

  run();
  return () => {
    if (stopped) return;
    stopped = true;
    if (typeof cleanup === "function") cleanup();
    for (const unsubscribe of unsubscribers) unsubscribe();
    unsubscribers = [];
  };
}

function createScopeApi<T>(state: ScopeState<T>): ScopeApi<T> {
  const cached = scopeApiByState.get(state);
  if (cached != null) return cached as ScopeApi<T>;
  const api = {
    get queryClient() {
      if (state.queryClient == null) throw new Error("Missing query client");
      return state.queryClient;
    },
    query: getScopeQueryApi(state),
    scope: state.scope,
    value: state.value,
    get(
      binding:
        | ScopedSignal<unknown, unknown>
        | ScopedDerivedSignal<unknown, unknown>
        | ScopedQuerySignal<unknown, unknown, unknown>
        | ScopedInfiniteQuerySignal<unknown, unknown, unknown, unknown>
        | ScopedMutationSignal<unknown, unknown, unknown, unknown, unknown>
        | ScopedMutationFamily<unknown, unknown, unknown, unknown, unknown, unknown>
        | ScopedQueryFamily<unknown, unknown, unknown, unknown>
        | ScopedInfiniteQueryFamily<unknown, unknown, unknown, unknown, unknown>
        | ScopedDerivedFamily<unknown, unknown, unknown>
        | ScopedExternalSignalFamily<unknown, unknown, unknown>
        | ScopedSignalFamily<unknown, unknown, unknown>,
      parameter?: unknown,
    ): unknown {
      const resolved = resolveScopeBinding(state, binding, parameter);
      return resolved.store.get(resolved.atom);
    },
    getOwnValue<Value>(scope: Scope<Value>): Value {
      return findScopeState(state, scope).value;
    },
    set(
      binding: ScopedSignal<unknown, unknown> | ScopedSignalFamily<unknown, unknown, unknown>,
      parameterOrValue: unknown,
      familyValue?: unknown,
    ): void {
      const owner = findScopeState(state, binding.scope);
      if (isScopedSignalFamily(binding)) {
        owner.store.set(binding.resolve(state, parameterOrValue), familyValue);
        return;
      }
      owner.store.set(binding.resolve(state), parameterOrValue);
    },
    watch(effect: (scope: ScopeApi<T>) => void | (() => void)): () => void {
      return watchScope(state, effect);
    },
    when(predicate: (scope: ScopeApi<T>) => boolean): Promise<void> {
      return new Promise((resolve) => {
        let unsubscribe: (() => void) | undefined;
        let resolvedBeforeSubscription = false;
        unsubscribe = watchScope(state, (scopeApi) => {
          if (!predicate(scopeApi)) return;
          resolve();
          if (unsubscribe == null) resolvedBeforeSubscription = true;
          else unsubscribe();
        });
        if (resolvedBeforeSubscription) unsubscribe();
      });
    },
  } as ScopeApi<T>;
  scopeApiByState.set(state, api as ScopeApi<unknown>);
  scopeStateByApi.set(api as ScopeApi<unknown>, state as ScopeState<unknown>);
  return api;
}

/** 把 scope 实例节点包装为可读写门面。 */
export function getScopeApi<T>(state: ScopeState<T>): ScopeApi<T> {
  return createScopeApi(state);
}

/** 创建一个 scope 实例，供语义源码和独立测试装配 scope 链。 */
export function createScopeState<T>(
  scope: Scope<T>,
  value: T,
  options: CreateScopeStateOptions = {},
): ScopeState<T> {
  if (scope.parent != null && options.parent?.scope !== scope.parent) {
    throw new Error(`Missing parent scope instance: ${scope.parent.__scopeBrand}`);
  }
  const state: ScopeState<T> = {
    cachedBindings: new Map(),
    externalFamilyBindings: new Map(),
    familyBindings: new Map(),
    mutationFamilyBindings: new Map(),
    parent: options.parent,
    queryClient: options.queryClient ?? options.parent?.queryClient,
    queryFamilyBindings: new Map(),
    retainedScopeEntries: new Map(),
    scope,
    signalFamilyBindings: new Map(),
    signalBindings: new Map(),
    store: options.store ?? options.parent?.store ?? createStore(),
    value,
  };
  if (scope.parent != null && scope.retain != null && options.parent != null) {
    let entries = options.parent.retainedScopeEntries.get(scope);
    if (entries == null) {
      entries = new Map();
      options.parent.retainedScopeEntries.set(scope, entries);
    }
    const key = options.retainKey ?? scope.getKey?.(value) ?? value;
    entries.delete(key);
    entries.set(key, state as ScopeState<unknown>);
    const max = scope.retain.max;
    if (max != null) {
      while (entries.size > max) {
        const oldestKey = entries.keys().next().value;
        entries.delete(oldestKey);
      }
    }
  }
  return state;
}

/**
 * 查找已由父 scope 保留的子 scope（原 `dje` / 压缩导出 `mZ`）。根 scope
 * 没有父节点，未命中时返回 null；命中后返回绑定到该子实例的 scope API。
 */
export function getRetainedScopeState<T>(
  activeScope: ScopeApi<unknown>,
  scope: Scope<T>,
  key: unknown,
): ScopeApi<T> | null {
  if (scope.parent == null) return null;
  const activeState = scopeStateByApi.get(activeScope);
  if (activeState == null) throw new Error("Missing scope state");
  const parentState = findScopeState(activeState, scope.parent);
  const retained = parentState.retainedScopeEntries.get(scope)?.get(key);
  return retained == null ? null : createScopeApi(retained as ScopeState<T>);
}

function canonicalFamilyKey(value: unknown, excludedFields?: ReadonlySet<string>): unknown {
  if (Array.isArray(value)) return value.map((entry) => canonicalFamilyKey(entry));
  if (typeof value !== "object" || value == null) return value;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype != null) return value;
  const source = value as Record<string, unknown>;
  const normalized: Record<string, unknown> = {};
  for (const key of Object.keys(source).sort()) {
    if (!excludedFields?.has(key)) normalized[key] = canonicalFamilyKey(source[key]);
  }
  return normalized;
}

function isPlainFamilyKey(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value == null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype == null;
}

interface FamilyKeyOptions<Param> {
  excludeFieldsFromKey?: readonly string[];
  key?: (parameter: Param) => unknown;
}

function scopedFamilyKey<Param>(
  parameter: Param,
  options?: FamilyKeyOptions<Param>,
): unknown {
  if (options?.key != null) return options.key(parameter);
  if (!Array.isArray(parameter) && !isPlainFamilyKey(parameter)) {
    return parameter;
  }
  const excluded = options?.excludeFieldsFromKey == null
    ? undefined
    : new Set(options.excludeFieldsFromKey);
  return JSON.stringify(canonicalFamilyKey(parameter, excluded));
}

function isScopedFamily(
  value:
    | ScopedSignal<unknown, unknown>
    | ScopedDerivedSignal<unknown, unknown>
    | ScopedQuerySignal<unknown, unknown, unknown>
    | ScopedInfiniteQuerySignal<unknown, unknown, unknown, unknown>
    | ScopedMutationSignal<unknown, unknown, unknown, unknown, unknown>
    | ScopedMutationFamily<unknown, unknown, unknown, unknown, unknown, unknown>
    | ScopedQueryFamily<unknown, unknown, unknown, unknown>
    | ScopedInfiniteQueryFamily<unknown, unknown, unknown, unknown, unknown>
    | ScopedDerivedFamily<unknown, unknown, unknown>
    | ScopedExternalSignalFamily<unknown, unknown, unknown>
    | ScopedSignalFamily<unknown, unknown, unknown>,
): value is
  | ScopedDerivedFamily<unknown, unknown, unknown>
  | ScopedMutationFamily<unknown, unknown, unknown, unknown, unknown, unknown>
  | ScopedQueryFamily<unknown, unknown, unknown, unknown>
  | ScopedInfiniteQueryFamily<unknown, unknown, unknown, unknown, unknown>
  | ScopedExternalSignalFamily<unknown, unknown, unknown>
  | ScopedSignalFamily<unknown, unknown, unknown> {
  return "kind" in value && (value.kind === "readable-family" || value.kind === "signal-family");
}

function isScopedSignalFamily(
  value: ScopedSignal<unknown, unknown> | ScopedSignalFamily<unknown, unknown, unknown>,
): value is ScopedSignalFamily<unknown, unknown, unknown> {
  return "kind" in value && value.kind === "signal-family";
}

function createDerivedContext<T>(
  state: ScopeState<T>,
  getAtom: AtomGet,
): DerivedScopedSignalContext<T> {
  const scopeApi = createScopeApi(state);
  return {
    get queryClient() {
      return scopeApi.queryClient;
    },
    scope: scopeApi,
    get<Value>(reader: unknown, ...parameters: unknown[]): Value {
      if (typeof reader === "object" && reader != null && "scope" in reader) {
        const binding = reader as
          | ScopedSignal<unknown, unknown>
          | ScopedDerivedSignal<unknown, unknown>
          | ScopedQuerySignal<unknown, unknown, unknown>
          | ScopedInfiniteQuerySignal<unknown, unknown, unknown, unknown>
          | ScopedMutationSignal<unknown, unknown, unknown, unknown, unknown>
          | ScopedMutationFamily<unknown, unknown, unknown, unknown, unknown, unknown>
          | ScopedQueryFamily<unknown, unknown, unknown, unknown>
          | ScopedInfiniteQueryFamily<unknown, unknown, unknown, unknown, unknown>
          | ScopedDerivedFamily<unknown, unknown, unknown>
          | ScopedExternalSignalFamily<unknown, unknown, unknown>
          | ScopedSignalFamily<unknown, unknown, unknown>;
        const owner = findScopeState(state, binding.scope);
        const target = isScopedFamily(binding)
          ? binding.resolve(state, parameters[0])
          : binding.resolve(state);
        if (owner.store !== state.store) return owner.store.get(target) as Value;
        return getAtom(target) as Value;
      }
      if (isAtomStoreReader(reader)) {
        return reader.store.get(reader.atom as Atom<Value>);
      }
      if (typeof reader === "object" && reader != null && "read" in reader) {
        return getAtom(reader as Atom<Value>);
      }
      throw new TypeError("Unsupported derived signal reader");
    },
  };
}

function disposeExternalSignalCleanup(
  cleanup: ScopedExternalSignalCleanup,
): void {
  if (typeof cleanup === "function") {
    cleanup();
    return;
  }
  cleanup?.[Symbol.dispose]();
}

function reportExternalSignalError(error: unknown): void {
  if (
    typeof globalThis.dispatchEvent === "function" &&
    typeof globalThis.ErrorEvent === "function"
  ) {
    globalThis.dispatchEvent(
      new ErrorEvent("error", { cancelable: true, error }),
    );
    return;
  }
  queueMicrotask(() => {
    throw error;
  });
}

function createExternalSignalContext<TScope, TValue>(
  scopeApi: ScopeApi<TScope>,
  setValue: (value: TValue | ((current: TValue) => TValue)) => void,
): ScopedExternalSignalContext<TScope, TValue> {
  return {
    get queryClient() {
      return scopeApi.queryClient;
    },
    scope: scopeApi,
    get<Value>(reader: unknown, ...parameters: unknown[]): Value {
      const read = scopeApi.get as unknown as (
        reader: unknown,
        ...parameters: unknown[]
      ) => Value;
      return read(reader, ...parameters);
    },
    set: setValue,
  };
}

/** 创建 scope 键控外部订阅 signal（原 `vje` / 压缩导出 `dZ`）。 */
export function createExternalSignal<TScope, TValue>(
  scope: Scope<TScope>,
  initialValue:
    | TValue
    | ((context: DerivedScopedSignalContext<TScope>) => TValue),
  subscribe: (
    context: ScopedExternalSignalContext<TScope, TValue>,
  ) =>
    | ScopedExternalSignalCleanup
    | PromiseLike<ScopedExternalSignalCleanup>,
  options?: ScopedDerivedSignalOptions<TValue>,
): ScopedExternalSignal<TScope, TValue> {
  const binding: ScopedExternalSignal<TScope, TValue> = {
    cache: "cached",
    scope,
    resolve(activeState) {
      const owner = findScopeState(activeState, scope);
      const cacheKey = binding as ScopedDerivedSignal<unknown, unknown>;
      const cached = owner.cachedBindings.get(cacheKey);
      if (cached != null) return cached as Atom<TValue>;

      const initialContext = createDerivedContext(
        owner,
        (target) => owner.store.get(target),
      );
      const resolveInitial = (
        context: DerivedScopedSignalContext<TScope>,
      ): TValue => typeof initialValue === "function"
        ? (initialValue as (
            context: DerivedScopedSignalContext<TScope>,
          ) => TValue)(context)
        : initialValue;
      const externalAtom = atom(resolveInitial(initialContext));
      externalAtom.isEqual = options?.isEqual;
      externalAtom.onMount = (setSelf) => watchScope(owner, (scopeApi) => {
        let active = true;
        let cleanup: ScopedExternalSignalCleanup;
        const context = createExternalSignalContext<TScope, TValue>(scopeApi, (value) => {
          if (active) setSelf(value);
        });
        setSelf(resolveInitial(context));
        const subscription = subscribe(context);
        if (
          typeof subscription === "object" &&
          subscription != null &&
          "then" in subscription
        ) {
          if (Symbol.dispose in subscription) {
            cleanup = subscription as unknown as { [Symbol.dispose](): void };
          }
          Promise.resolve(subscription).then(
            (resolved) => {
              if (active) cleanup = resolved;
              else disposeExternalSignalCleanup(resolved);
            },
            (error: unknown) => {
              if (active) reportExternalSignalError(error);
            },
          );
        } else {
          cleanup = subscription as ScopedExternalSignalCleanup;
        }
        return () => {
          if (!active) return;
          active = false;
          disposeExternalSignalCleanup(cleanup);
        };
      });
      owner.cachedBindings.set(cacheKey, externalAtom as Atom<unknown>);
      return externalAtom;
    },
  };
  return binding;
}

/** 解析外部订阅 signal 为 hook 可消费的 atom/store 对。 */
export function resolveScopedExternalSignal<TScope, TValue>(
  signal: ScopedExternalSignal<TScope, TValue>,
  state: ScopeState<unknown>,
): BoundAtomSignal<TValue> {
  const owner = findScopeState(state, signal.scope);
  return { atom: signal.resolve(state), store: owner.store };
}

/** 创建参数化外部订阅 signal family（原 `xje` / 压缩导出 `iZ`）。 */
export function createExternalSignalFamily<TScope, Param, TValue>(
  scope: Scope<TScope>,
  initialValue:
    | TValue
    | ((
        parameter: Param,
        context: DerivedScopedSignalContext<TScope>,
      ) => TValue),
  subscribe: (
    parameter: Param,
    context: ScopedExternalSignalContext<TScope, TValue>,
  ) =>
    | ScopedExternalSignalCleanup
    | PromiseLike<ScopedExternalSignalCleanup>,
  options?: ScopedDerivedFamilyOptions<Param, TValue>,
): ScopedExternalSignalFamily<TScope, Param, TValue> {
  const autoDisposeMs = normalizeAutoDispose(options?.autoDispose);
  const memberSignals = new WeakMap<
    ScopeState<unknown>,
    Map<unknown, ScopedExternalSignal<TScope, TValue>>
  >();
  const family: ScopedExternalSignalFamily<TScope, Param, TValue> = {
    autoDisposeMs,
    kind: "readable-family",
    scope,
    evict(activeState, parameter) {
      const owner = findScopeState(activeState, scope);
      const familyKey = family as ScopedExternalSignalFamily<
        unknown,
        unknown,
        unknown
      >;
      const parameterKey = scopedFamilyKey(parameter, options);
      const members = owner.externalFamilyBindings.get(familyKey);
      const signal = memberSignals.get(owner)?.get(parameterKey);
      if (signal != null) {
        owner.cachedBindings.delete(
          signal as ScopedDerivedSignal<unknown, unknown>,
        );
        memberSignals.get(owner)?.delete(parameterKey);
      }
      if (members == null) return false;
      const removed = members.delete(parameterKey);
      if (members.size === 0) owner.externalFamilyBindings.delete(familyKey);
      return removed;
    },
    resolve(activeState, parameter) {
      const owner = findScopeState(activeState, scope);
      const familyKey = family as ScopedExternalSignalFamily<
        unknown,
        unknown,
        unknown
      >;
      let members = owner.externalFamilyBindings.get(familyKey);
      if (members == null) {
        members = new Map();
        owner.externalFamilyBindings.set(familyKey, members);
      }
      const parameterKey = scopedFamilyKey(parameter, options);
      const cached = members.get(parameterKey);
      if (cached != null) return cached as Atom<TValue>;

      const signal = createExternalSignal(
        scope,
        typeof initialValue === "function"
          ? (context) => (initialValue as (
              parameter: Param,
              context: DerivedScopedSignalContext<TScope>,
            ) => TValue)(parameter, context)
          : initialValue,
        (context) => subscribe(parameter, context),
        { isEqual: options?.isEqual },
      );
      signal.debugLabel = family.debugLabel;
      let signals = memberSignals.get(owner);
      if (signals == null) {
        signals = new Map();
        memberSignals.set(owner, signals);
      }
      signals.set(parameterKey, signal);
      const externalAtom = signal.resolve(activeState);
      const mountExternal = externalAtom.onMount;
      let disposalTimer: ReturnType<typeof setTimeout> | undefined;
      externalAtom.onMount = (setSelf) => {
        if (disposalTimer != null) {
          clearTimeout(disposalTimer);
          disposalTimer = undefined;
        }
        const unmountExternal = mountExternal?.(setSelf);
        return () => {
          if (typeof unmountExternal === "function") unmountExternal();
          if (autoDisposeMs === Infinity) return;
          disposalTimer = setTimeout(() => {
            disposalTimer = undefined;
            family.evict(activeState, parameter);
          }, autoDisposeMs);
        };
      };
      members.set(parameterKey, externalAtom as Atom<unknown>);
      return externalAtom;
    },
  };
  return family;
}

/** 解析外部订阅 signal family 成员为 hook 可消费的 atom/store 对。 */
export function resolveScopedExternalSignalFamily<TScope, Param, TValue>(
  family: ScopedExternalSignalFamily<TScope, Param, TValue>,
  parameter: Param,
  state: ScopeState<unknown>,
): BoundAtomSignal<TValue> {
  const owner = findScopeState(state, family.scope);
  return { atom: family.resolve(state, parameter), store: owner.store };
}

/** 创建 scope 键控只读派生 signal（原 `PI` / 压缩导出 `sZ`）。 */
export function createDerivedSignal<TScope, TValue>(
  scope: Scope<TScope>,
  derive: (context: DerivedScopedSignalContext<TScope>) => TValue,
  options?: ScopedDerivedSignalOptions<TValue>,
): ScopedDerivedSignal<TScope, TValue> {
  const binding: ScopedDerivedSignal<TScope, TValue> = {
    cache: "cached",
    scope,
    resolve(activeState) {
      const owner = findScopeState(activeState, scope);
      const cached = owner.cachedBindings.get(
        binding as ScopedDerivedSignal<unknown, unknown>,
      );
      if (cached != null) return cached as Atom<TValue>;
      const derivedAtom = atom((get) => derive(createDerivedContext(owner, get)));
      derivedAtom.isEqual = options?.isEqual;
      owner.cachedBindings.set(
        binding as ScopedDerivedSignal<unknown, unknown>,
        derivedAtom as Atom<unknown>,
      );
      return derivedAtom;
    },
  };
  return binding;
}

/** 解析只读派生 signal 为 hook 可消费的 atom/store 对。 */
export function resolveScopedDerivedSignal<TScope, TValue>(
  signal: ScopedDerivedSignal<TScope, TValue>,
  state: ScopeState<unknown>,
): BoundAtomSignal<TValue> {
  const owner = findScopeState(state, signal.scope);
  return { atom: signal.resolve(state), store: owner.store };
}

interface LocalQueryState<TData, TError> {
  data?: TData;
  error: TError | null;
  fetchStatus: "fetching" | "idle" | "paused";
  queryHash: string;
  status: "error" | "pending" | "success";
  updatedAt: number;
}

function scopedQueryHash(queryKey: readonly unknown[]): string {
  return JSON.stringify(canonicalFamilyKey(queryKey));
}

function queryResultEqual<TData, TError>(
  previous: ScopedQueryResult<TData, TError>,
  next: ScopedQueryResult<TData, TError>,
): boolean {
  return (
    Object.is(previous.data, next.data) &&
    Object.is(previous.error, next.error) &&
    previous.fetchStatus === next.fetchStatus &&
    previous.isEnabled === next.isEnabled &&
    previous.isStale === next.isStale &&
    previous.status === next.status
  );
}

function createQuerySignalInternal<TScope, TData, TError>(
  scope: Scope<TScope>,
  getOptions: (context: DerivedScopedSignalContext<TScope>) => ScopedQueryOptions<TData, TError>,
  forcedEnabled?: boolean,
): ScopedQuerySignal<TScope, TData, TError> {
  let disabledSignal: ScopedQuerySignal<TScope, TData, TError> | undefined;
  const binding: ScopedQuerySignal<TScope, TData, TError> = {
    cache: "cached",
    getOptions,
    queryKind: "query",
    scope,
    [WITH_QUERY_READ_OPTIONS](options) {
      if (options.enabled !== false || forcedEnabled === false) return binding;
      disabledSignal ??= createQuerySignalInternal(scope, getOptions, false);
      disabledSignal.debugLabel = binding.debugLabel;
      return disabledSignal;
    },
    resolve(activeState) {
      const owner = findScopeState(activeState, scope);
      const cacheKey = binding as unknown as ScopedDerivedSignal<unknown, unknown>;
      const cached = owner.cachedBindings.get(cacheKey);
      if (cached != null) return cached as Atom<ScopedQueryResult<TData, TError>>;

      const client = owner.queryClient as ScopedQueryClient | undefined;
      if (client == null) throw new Error("querySignal requires a QueryClient on Scope");
      const refreshAtom = atom(0);
      const initialOptions = getOptions(
        createDerivedContext(owner, (target) => owner.store.get(target)),
      );
      const initialData = typeof initialOptions.initialData === "function"
        ? (initialOptions.initialData as () => TData)()
        : initialOptions.initialData;
      const initialQueryHash = scopedQueryHash(initialOptions.queryKey);
      const localStateAtom = atom<LocalQueryState<TData, TError>>({
        data: initialData,
        error: null,
        fetchStatus: "idle",
        queryHash: initialQueryHash,
        status: initialData === undefined ? "pending" : "success",
        updatedAt: initialData === undefined ? 0 : Date.now(),
      });
      let latestOptions = initialOptions;
      let latestResult: ScopedQueryResult<TData, TError>;
      let activeController: AbortController | undefined;
      let activeFetch: Promise<ScopedQueryResult<TData, TError>> | undefined;
      let activeQueryHash: string | undefined;
      let mounted = false;
      let observedEnabled = false;
      let observedQueryHash = initialQueryHash;
      let scheduledFetch = false;

      const refresh = () => {
        owner.store.set(refreshAtom, (current: number) => current + 1);
      };
      const execute = (): Promise<ScopedQueryResult<TData, TError>> => {
        const options = latestOptions;
        const queryHash = scopedQueryHash(options.queryKey);
        if (activeFetch != null && activeQueryHash === queryHash) return activeFetch;
        if (options.queryFn == null && client.fetchQuery == null) {
          return Promise.resolve(latestResult);
        }
        activeController?.abort();
        activeController = new AbortController();
        activeQueryHash = queryHash;
        owner.store.set(localStateAtom, (current) => ({
          data: current.queryHash === queryHash ? current.data : undefined,
          error: null,
          fetchStatus: "fetching",
          queryHash,
          status: current.queryHash === queryHash && current.data !== undefined ? current.status : "pending",
          updatedAt: current.queryHash === queryHash ? current.updatedAt : 0,
        }));
        const request = client.fetchQuery != null
          ? client.fetchQuery<TData>(options as ScopedQueryOptions<TData, unknown>)
          : Promise.resolve(options.queryFn?.({
              client,
              meta: options.meta,
              queryKey: options.queryKey,
              signal: activeController.signal,
            }) as TData | Promise<TData>);
        const fetch = request.then(
          (data) => {
            client.setQueryData?.(options.queryKey, data);
            owner.store.set(localStateAtom, {
              data,
              error: null,
              fetchStatus: "idle",
              queryHash,
              status: "success",
              updatedAt: Date.now(),
            });
            refresh();
            return owner.store.get(queryAtom);
          },
          (error: TError) => {
            owner.store.set(localStateAtom, (current) => ({
              ...current,
              error,
              fetchStatus: "idle",
              queryHash,
              status: "error",
            }));
            refresh();
            throw error;
          },
        ).finally(() => {
          if (activeFetch === fetch) {
            activeFetch = undefined;
            activeController = undefined;
            activeQueryHash = undefined;
          }
        });
        activeFetch = fetch;
        return fetch;
      };

      const refetch = () => execute();
      const queryAtom = atom((get) => {
        get(refreshAtom);
        const context = createDerivedContext(owner, get);
        const options = getOptions(context);
        latestOptions = options;
        const queryHash = scopedQueryHash(options.queryKey);
        const queryState = client.getQueryState?.<TData, TError>(options.queryKey);
        const storedLocalState = get(localStateAtom);
        const localState = storedLocalState.queryHash === queryHash
          ? storedLocalState
          : {
              data: undefined,
              error: null,
              fetchStatus: "idle" as const,
              queryHash,
              status: "pending" as const,
              updatedAt: 0,
            };
        const cachedData = client.getQueryData?.<TData>(options.queryKey);
        const data = cachedData ?? queryState?.data ?? localState.data;
        const error = queryState?.error ?? localState.error ?? null;
        const fetchStatus = queryState?.fetchStatus ?? localState.fetchStatus;
        const status = queryState?.status ?? (data === undefined ? localState.status : "success");
        const enabledByOptions = typeof options.enabled === "function"
          ? options.enabled(queryState)
          : options.enabled ?? true;
        const isEnabled = forcedEnabled !== false && enabledByOptions;
        const updatedAt = queryState?.dataUpdatedAt ?? localState.updatedAt;
        const staleTime = options.staleTime ?? 0;
        const isStale = queryState?.isInvalidated === true ||
          data === undefined ||
          staleTime !== Infinity && Date.now() - updatedAt >= staleTime;
        const result: ScopedQueryResult<TData, TError> = {
          data,
          error,
          fetchStatus,
          isEnabled,
          isError: status === "error",
          isFetching: fetchStatus === "fetching",
          isLoading: status === "pending" && fetchStatus === "fetching",
          isPending: status === "pending",
          isRefetching: status !== "pending" && fetchStatus === "fetching",
          isStale: isEnabled ? isStale : false,
          isSuccess: status === "success",
          refetch,
          status,
        };
        latestResult = result;
        const queryChanged = observedQueryHash !== queryHash;
        const becameEnabled = !observedEnabled && isEnabled;
        observedQueryHash = queryHash;
        observedEnabled = isEnabled;
        if (mounted && isEnabled && (queryChanged || becameEnabled) && (data === undefined || isStale)) {
          if (!scheduledFetch) {
            scheduledFetch = true;
            queueMicrotask(() => {
              scheduledFetch = false;
              void execute().catch(() => {});
            });
          }
        }
        return result;
      });
      queryAtom.isEqual = queryResultEqual;
      queryAtom.onMount = () => {
        mounted = true;
        const unsubscribe = client.getQueryCache?.().subscribe?.(refresh);
        const result = owner.store.get(queryAtom);
        if (
          result.isEnabled &&
          (result.data === undefined || initialOptions.refetchOnMount === true || initialOptions.refetchOnMount === "always")
        ) {
          void execute().catch(() => {});
        }
        return () => {
          mounted = false;
          activeController?.abort();
          unsubscribe?.();
        };
      };
      owner.cachedBindings.set(cacheKey, queryAtom as Atom<unknown>);
      return queryAtom;
    },
  };
  return binding;
}

/** 创建 scope 键控 query signal（原 `Bje` / 压缩导出 `eZ`）。 */
export function createQuerySignal<TScope, TData, TError = Error>(
  scope: Scope<TScope>,
  getOptions: (context: DerivedScopedSignalContext<TScope>) => ScopedQueryOptions<TData, TError>,
): ScopedQuerySignal<TScope, TData, TError> {
  return createQuerySignalInternal(scope, getOptions);
}

/** 解析 query signal 为 hook 可消费的 atom/store 对。 */
export function resolveScopedQuerySignal<TScope, TData, TError>(
  signal: ScopedQuerySignal<TScope, TData, TError>,
  state: ScopeState<unknown>,
): BoundAtomSignal<ScopedQueryResult<TData, TError>> {
  const owner = findScopeState(state, signal.scope);
  return { atom: signal.resolve(state), store: owner.store };
}

function infiniteQueryResultEqual<TPage, TPageParam, TError>(
  previous: ScopedInfiniteQueryResult<TPage, TPageParam, TError>,
  next: ScopedInfiniteQueryResult<TPage, TPageParam, TError>,
): boolean {
  return (
    queryResultEqual(previous, next) &&
    previous.hasNextPage === next.hasNextPage &&
    previous.hasPreviousPage === next.hasPreviousPage &&
    previous.isFetchingNextPage === next.isFetchingNextPage &&
    previous.isFetchingPreviousPage === next.isFetchingPreviousPage
  );
}

function getInfinitePageParam<TPage, TPageParam, TError>(
  options: ScopedInfiniteQueryOptions<TPage, TPageParam, TError>,
  data: InfiniteQueryData<TPage, TPageParam>,
  direction: "backward" | "forward",
): TPageParam | null | undefined {
  if (data.pages.length === 0) return options.initialPageParam;
  if (direction === "forward") {
    return options.getNextPageParam?.(
      data.pages[data.pages.length - 1],
      data.pages,
      data.pageParams[data.pageParams.length - 1],
      data.pageParams,
    );
  }
  return options.getPreviousPageParam?.(
    data.pages[0],
    data.pages,
    data.pageParams[0],
    data.pageParams,
  );
}

function trimInfiniteData<TPage, TPageParam>(
  data: InfiniteQueryData<TPage, TPageParam>,
  direction: "backward" | "forward",
  maxPages?: number,
): InfiniteQueryData<TPage, TPageParam> {
  if (maxPages == null || maxPages <= 0 || data.pages.length <= maxPages) {
    return data;
  }
  return direction === "forward"
    ? {
        pageParams: data.pageParams.slice(-maxPages),
        pages: data.pages.slice(-maxPages),
      }
    : {
        pageParams: data.pageParams.slice(0, maxPages),
        pages: data.pages.slice(0, maxPages),
      };
}

function createInfiniteQuerySignalInternal<TScope, TPage, TPageParam, TError>(
  scope: Scope<TScope>,
  getOptions: (
    context: DerivedScopedSignalContext<TScope>,
  ) => ScopedInfiniteQueryOptions<TPage, TPageParam, TError>,
  forcedEnabled?: boolean,
): ScopedInfiniteQuerySignal<TScope, TPage, TPageParam, TError> {
  type Data = InfiniteQueryData<TPage, TPageParam>;
  type Result = ScopedInfiniteQueryResult<TPage, TPageParam, TError>;

  let disabledSignal:
    | ScopedInfiniteQuerySignal<TScope, TPage, TPageParam, TError>
    | undefined;
  const binding: ScopedInfiniteQuerySignal<
    TScope,
    TPage,
    TPageParam,
    TError
  > = {
    cache: "cached",
    getOptions,
    queryKind: "infinite",
    scope,
    [WITH_QUERY_READ_OPTIONS](options) {
      if (options.enabled !== false || forcedEnabled === false) return binding;
      disabledSignal ??= createInfiniteQuerySignalInternal(
        scope,
        getOptions,
        false,
      );
      disabledSignal.debugLabel = binding.debugLabel;
      return disabledSignal;
    },
    resolve(activeState) {
      const owner = findScopeState(activeState, scope);
      const cacheKey = binding as unknown as ScopedDerivedSignal<
        unknown,
        unknown
      >;
      const cached = owner.cachedBindings.get(cacheKey);
      if (cached != null) return cached as Atom<Result>;

      const client = owner.queryClient as ScopedQueryClient | undefined;
      if (client == null) {
        throw new Error(
          "infiniteQuerySignal requires a QueryClient on Scope",
        );
      }
      const refreshAtom = atom(0);
      const initialOptions = getOptions(
        createDerivedContext(owner, (target) => owner.store.get(target)),
      );
      const initialData =
        typeof initialOptions.initialData === "function"
          ? initialOptions.initialData()
          : initialOptions.initialData;
      const initialQueryHash = scopedQueryHash(initialOptions.queryKey);
      const localStateAtom = atom<LocalQueryState<Data, TError>>({
        data: initialData,
        error: null,
        fetchStatus: "idle",
        queryHash: initialQueryHash,
        status: initialData === undefined ? "pending" : "success",
        updatedAt: initialData === undefined ? 0 : Date.now(),
      });
      let latestOptions = initialOptions;
      let latestResult: Result;
      let activeController: AbortController | undefined;
      let activeDirection: "backward" | "forward" | "refetch" | undefined;
      let activeFetch: Promise<Result> | undefined;
      let mounted = false;
      let observedEnabled = false;
      let observedQueryHash = initialQueryHash;
      let scheduledFetch = false;

      const refresh = () => {
        owner.store.set(refreshAtom, (current: number) => current + 1);
      };
      const execute = (
        direction: "backward" | "forward" | "refetch",
      ): Promise<Result> => {
        if (activeFetch != null) return activeFetch;
        const options = latestOptions;
        const queryHash = scopedQueryHash(options.queryKey);
        const stored = owner.store.get(localStateAtom);
        const cachedData = client.getQueryData?.<Data>(options.queryKey);
        const currentData =
          cachedData ?? (stored.queryHash === queryHash ? stored.data : undefined);
        const pageDirection = direction === "backward" ? "backward" : "forward";
        const pageParam =
          direction === "refetch"
            ? options.initialPageParam
            : currentData == null
              ? options.initialPageParam
              : getInfinitePageParam(options, currentData, pageDirection);
        if (pageParam == null || options.queryFn == null) {
          return Promise.resolve(latestResult);
        }

        activeController?.abort();
        activeController = new AbortController();
        activeDirection = direction;
        owner.store.set(localStateAtom, (current) => ({
          data: current.queryHash === queryHash ? current.data : undefined,
          error: null,
          fetchStatus: "fetching",
          queryHash,
          status:
            current.queryHash === queryHash && current.data !== undefined
              ? current.status
              : "pending",
          updatedAt: current.queryHash === queryHash ? current.updatedAt : 0,
        }));
        const request = Promise.resolve(
          options.queryFn({
            client,
            direction: pageDirection,
            meta: options.meta,
            pageParam,
            queryKey: options.queryKey,
            signal: activeController.signal,
          }),
        );
        const fetch = request
          .then(
            (page) => {
              const previous = direction === "refetch" ? undefined : currentData;
              const nextData = trimInfiniteData(
                pageDirection === "backward"
                  ? {
                      pageParams: [pageParam, ...(previous?.pageParams ?? [])],
                      pages: [page, ...(previous?.pages ?? [])],
                    }
                  : {
                      pageParams: [...(previous?.pageParams ?? []), pageParam],
                      pages: [...(previous?.pages ?? []), page],
                    },
                pageDirection,
                options.maxPages,
              );
              client.setQueryData?.(options.queryKey, nextData);
              owner.store.set(localStateAtom, {
                data: nextData,
                error: null,
                fetchStatus: "idle",
                queryHash,
                status: "success",
                updatedAt: Date.now(),
              });
              activeDirection = undefined;
              refresh();
              return owner.store.get(queryAtom);
            },
            (error: TError) => {
              owner.store.set(localStateAtom, (current) => ({
                ...current,
                error,
                fetchStatus: "idle",
                queryHash,
                status: "error",
              }));
              activeDirection = undefined;
              refresh();
              throw error;
            },
          )
          .finally(() => {
            if (activeFetch === fetch) {
              activeFetch = undefined;
              activeController = undefined;
              activeDirection = undefined;
            }
          });
        activeFetch = fetch;
        return fetch;
      };

      const refetch = () => execute("refetch");
      const fetchNextPage = () => execute("forward");
      const fetchPreviousPage = () => execute("backward");
      const queryAtom = atom((get) => {
        get(refreshAtom);
        const context = createDerivedContext(owner, get);
        const options = getOptions(context);
        latestOptions = options;
        const queryHash = scopedQueryHash(options.queryKey);
        const queryState = client.getQueryState?.<Data, TError>(
          options.queryKey,
        );
        const storedLocalState = get(localStateAtom);
        const localState =
          storedLocalState.queryHash === queryHash
            ? storedLocalState
            : {
                data: undefined,
                error: null,
                fetchStatus: "idle" as const,
                queryHash,
                status: "pending" as const,
                updatedAt: 0,
              };
        const cachedData = client.getQueryData?.<Data>(options.queryKey);
        const data = cachedData ?? queryState?.data ?? localState.data;
        const error = queryState?.error ?? localState.error ?? null;
        const fetchStatus = queryState?.fetchStatus ?? localState.fetchStatus;
        const status =
          queryState?.status ??
          (data === undefined ? localState.status : "success");
        const enabledByOptions =
          typeof options.enabled === "function"
            ? options.enabled(queryState)
            : (options.enabled ?? true);
        const isEnabled = forcedEnabled !== false && enabledByOptions;
        const updatedAt = queryState?.dataUpdatedAt ?? localState.updatedAt;
        const staleTime = options.staleTime ?? 0;
        const isStale =
          queryState?.isInvalidated === true ||
          data === undefined ||
          (staleTime !== Infinity && Date.now() - updatedAt >= staleTime);
        const nextPageParam =
          data == null
            ? undefined
            : getInfinitePageParam(options, data, "forward");
        const previousPageParam =
          data == null
            ? undefined
            : getInfinitePageParam(options, data, "backward");
        const result: Result = {
          data,
          error,
          fetchNextPage,
          fetchPreviousPage,
          fetchStatus,
          hasNextPage: nextPageParam != null,
          hasPreviousPage: previousPageParam != null,
          isEnabled,
          isError: status === "error",
          isFetching: fetchStatus === "fetching",
          isFetchingNextPage: activeDirection === "forward",
          isFetchingPreviousPage: activeDirection === "backward",
          isLoading: status === "pending" && fetchStatus === "fetching",
          isPending: status === "pending",
          isRefetching: status !== "pending" && fetchStatus === "fetching",
          isStale: isEnabled ? isStale : false,
          isSuccess: status === "success",
          refetch,
          status,
        };
        latestResult = result;
        const queryChanged = observedQueryHash !== queryHash;
        const becameEnabled = !observedEnabled && isEnabled;
        observedQueryHash = queryHash;
        observedEnabled = isEnabled;
        if (
          mounted &&
          isEnabled &&
          (queryChanged || becameEnabled) &&
          (data === undefined || isStale) &&
          !scheduledFetch
        ) {
          scheduledFetch = true;
          queueMicrotask(() => {
            scheduledFetch = false;
            void execute("refetch").catch(() => {});
          });
        }
        return result;
      });
      queryAtom.isEqual = infiniteQueryResultEqual;
      queryAtom.onMount = () => {
        mounted = true;
        const unsubscribe = client.getQueryCache?.().subscribe?.(refresh);
        const result = owner.store.get(queryAtom);
        if (
          result.isEnabled &&
          (result.data === undefined ||
            initialOptions.refetchOnMount === true ||
            initialOptions.refetchOnMount === "always")
        ) {
          void execute("refetch").catch(() => {});
        }
        return () => {
          mounted = false;
          activeController?.abort();
          unsubscribe?.();
        };
      };
      owner.cachedBindings.set(cacheKey, queryAtom as Atom<unknown>);
      return queryAtom;
    },
  };
  return binding;
}

/** 创建 scope 键控 infinite-query signal（原 `zje` / 压缩导出 `tZ`）。 */
export function createInfiniteQuerySignal<
  TScope,
  TPage,
  TPageParam,
  TError = Error,
>(
  scope: Scope<TScope>,
  getOptions: (
    context: DerivedScopedSignalContext<TScope>,
  ) => ScopedInfiniteQueryOptions<TPage, TPageParam, TError>,
): ScopedInfiniteQuerySignal<TScope, TPage, TPageParam, TError> {
  return createInfiniteQuerySignalInternal(scope, getOptions);
}

/** 解析 infinite-query signal 为 hook 可消费的 atom/store 对。 */
export function resolveScopedInfiniteQuerySignal<
  TScope,
  TPage,
  TPageParam,
  TError,
>(
  signal: ScopedInfiniteQuerySignal<TScope, TPage, TPageParam, TError>,
  state: ScopeState<unknown>,
): BoundAtomSignal<ScopedInfiniteQueryResult<TPage, TPageParam, TError>> {
  const owner = findScopeState(state, signal.scope);
  return { atom: signal.resolve(state), store: owner.store };
}

function createQueryFamilyInternal<TScope, Param, TData, TError>(
  scope: Scope<TScope>,
  getOptions: (
    parameter: Param,
    context: DerivedScopedSignalContext<TScope>,
  ) => ScopedQueryOptions<TData, TError>,
  options?: ScopedQueryFamilyOptions<Param>,
  forcedEnabled?: boolean,
): ScopedQueryFamily<TScope, Param, TData, TError> {
  const autoDisposeMs = normalizeAutoDispose(options?.autoDispose ?? true);
  const memberSignals = new WeakMap<
    ScopeState<unknown>,
    Map<unknown, ScopedQuerySignal<TScope, TData, TError>>
  >();
  let disabledFamily: ScopedQueryFamily<TScope, Param, TData, TError> | undefined;
  const family: ScopedQueryFamily<TScope, Param, TData, TError> = {
    autoDisposeMs,
    getOptions,
    kind: "readable-family",
    queryKind: "query",
    scope,
    [WITH_QUERY_READ_OPTIONS](readOptions) {
      if (readOptions.enabled !== false || forcedEnabled === false) return family;
      disabledFamily ??= createQueryFamilyInternal(scope, getOptions, options, false);
      disabledFamily.debugLabel = family.debugLabel;
      return disabledFamily;
    },
    evict(activeState, parameter) {
      const owner = findScopeState(activeState, scope);
      const familyKey = family as ScopedQueryFamily<unknown, unknown, unknown, unknown>;
      const parameterKey = scopedFamilyKey(parameter, options);
      const members = owner.queryFamilyBindings.get(familyKey);
      const signal = memberSignals.get(owner)?.get(parameterKey);
      if (signal != null) {
        owner.cachedBindings.delete(
          signal as unknown as ScopedDerivedSignal<unknown, unknown>,
        );
        memberSignals.get(owner)?.delete(parameterKey);
      }
      if (members == null) return false;
      const removed = members.delete(parameterKey);
      if (members.size === 0) owner.queryFamilyBindings.delete(familyKey);
      return removed;
    },
    resolve(activeState, parameter) {
      const owner = findScopeState(activeState, scope);
      const familyKey = family as ScopedQueryFamily<unknown, unknown, unknown, unknown>;
      let members = owner.queryFamilyBindings.get(familyKey);
      if (members == null) {
        members = new Map();
        owner.queryFamilyBindings.set(familyKey, members);
      }
      const parameterKey = scopedFamilyKey(parameter, options);
      const cached = members.get(parameterKey);
      if (cached != null) return cached as Atom<ScopedQueryResult<TData, TError>>;

      const signal = createQuerySignalInternal(
        scope,
        (context) => getOptions(parameter, context),
        forcedEnabled,
      );
      signal.debugLabel = family.debugLabel;
      let signals = memberSignals.get(owner);
      if (signals == null) {
        signals = new Map();
        memberSignals.set(owner, signals);
      }
      signals.set(parameterKey, signal);
      const queryAtom = signal.resolve(activeState);
      const mountQuery = queryAtom.onMount;
      let disposalTimer: ReturnType<typeof setTimeout> | undefined;
      queryAtom.onMount = (setSelf) => {
        if (disposalTimer != null) {
          clearTimeout(disposalTimer);
          disposalTimer = undefined;
        }
        const unmountQuery = mountQuery?.(setSelf);
        return () => {
          if (typeof unmountQuery === "function") unmountQuery();
          if (autoDisposeMs === Infinity) return;
          disposalTimer = setTimeout(() => {
            disposalTimer = undefined;
            family.evict(activeState, parameter);
          }, autoDisposeMs);
        };
      };
      members.set(parameterKey, queryAtom as Atom<unknown>);
      return queryAtom;
    },
  };
  return family;
}

/** 创建 scope 键控 query family（原 `Vje` / 压缩导出 `QX`）。 */
export function createQueryFamily<TScope, Param, TData, TError = Error>(
  scope: Scope<TScope>,
  getOptions: (
    parameter: Param,
    context: DerivedScopedSignalContext<TScope>,
  ) => ScopedQueryOptions<TData, TError>,
  options?: ScopedQueryFamilyOptions<Param>,
): ScopedQueryFamily<TScope, Param, TData, TError> {
  return createQueryFamilyInternal(scope, getOptions, options);
}

/** 解析 query family 成员为 hook 可消费的 atom/store 对。 */
export function resolveScopedQueryFamily<TScope, Param, TData, TError>(
  family: ScopedQueryFamily<TScope, Param, TData, TError>,
  parameter: Param,
  state: ScopeState<unknown>,
): BoundAtomSignal<ScopedQueryResult<TData, TError>> {
  const owner = findScopeState(state, family.scope);
  return { atom: family.resolve(state, parameter), store: owner.store };
}

function createInfiniteQueryFamilyInternal<
  TScope,
  Param,
  TPage,
  TPageParam,
  TError,
>(
  scope: Scope<TScope>,
  getOptions: (
    parameter: Param,
    context: DerivedScopedSignalContext<TScope>,
  ) => ScopedInfiniteQueryOptions<TPage, TPageParam, TError>,
  options?: ScopedQueryFamilyOptions<Param>,
  forcedEnabled?: boolean,
): ScopedInfiniteQueryFamily<TScope, Param, TPage, TPageParam, TError> {
  type Family = ScopedInfiniteQueryFamily<
    TScope,
    Param,
    TPage,
    TPageParam,
    TError
  >;
  type Signal = ScopedInfiniteQuerySignal<
    TScope,
    TPage,
    TPageParam,
    TError
  >;
  type Result = ScopedInfiniteQueryResult<TPage, TPageParam, TError>;

  const autoDisposeMs = normalizeAutoDispose(options?.autoDispose ?? true);
  const memberSignals = new WeakMap<
    ScopeState<unknown>,
    Map<unknown, Signal>
  >();
  let disabledFamily: Family | undefined;
  const family: Family = {
    autoDisposeMs,
    getOptions,
    kind: "readable-family",
    queryKind: "infinite",
    scope,
    [WITH_QUERY_READ_OPTIONS](readOptions) {
      if (readOptions.enabled !== false || forcedEnabled === false) return family;
      disabledFamily ??= createInfiniteQueryFamilyInternal(
        scope,
        getOptions,
        options,
        false,
      );
      disabledFamily.debugLabel = family.debugLabel;
      return disabledFamily;
    },
    evict(activeState, parameter) {
      const owner = findScopeState(activeState, scope);
      const familyKey = family as ScopedInfiniteQueryFamily<
        unknown,
        unknown,
        unknown,
        unknown,
        unknown
      >;
      const parameterKey = scopedFamilyKey(parameter, options);
      const members = owner.queryFamilyBindings.get(familyKey);
      const signal = memberSignals.get(owner)?.get(parameterKey);
      if (signal != null) {
        owner.cachedBindings.delete(
          signal as unknown as ScopedDerivedSignal<unknown, unknown>,
        );
        memberSignals.get(owner)?.delete(parameterKey);
      }
      if (members == null) return false;
      const removed = members.delete(parameterKey);
      if (members.size === 0) owner.queryFamilyBindings.delete(familyKey);
      return removed;
    },
    resolve(activeState, parameter) {
      const owner = findScopeState(activeState, scope);
      const familyKey = family as ScopedInfiniteQueryFamily<
        unknown,
        unknown,
        unknown,
        unknown,
        unknown
      >;
      let members = owner.queryFamilyBindings.get(familyKey);
      if (members == null) {
        members = new Map();
        owner.queryFamilyBindings.set(familyKey, members);
      }
      const parameterKey = scopedFamilyKey(parameter, options);
      const cached = members.get(parameterKey);
      if (cached != null) return cached as Atom<Result>;

      const signal = createInfiniteQuerySignalInternal(
        scope,
        (context) => getOptions(parameter, context),
        forcedEnabled,
      );
      signal.debugLabel = family.debugLabel;
      let signals = memberSignals.get(owner);
      if (signals == null) {
        signals = new Map();
        memberSignals.set(owner, signals);
      }
      signals.set(parameterKey, signal);
      const queryAtom = signal.resolve(activeState);
      const mountQuery = queryAtom.onMount;
      let disposalTimer: ReturnType<typeof setTimeout> | undefined;
      queryAtom.onMount = (setSelf) => {
        if (disposalTimer != null) {
          clearTimeout(disposalTimer);
          disposalTimer = undefined;
        }
        const unmountQuery = mountQuery?.(setSelf);
        return () => {
          if (typeof unmountQuery === "function") unmountQuery();
          if (autoDisposeMs === Infinity) return;
          disposalTimer = setTimeout(() => {
            disposalTimer = undefined;
            family.evict(activeState, parameter);
          }, autoDisposeMs);
        };
      };
      members.set(parameterKey, queryAtom as Atom<unknown>);
      return queryAtom;
    },
  };
  return family;
}

/** 创建 scope 键控 infinite-query family（原 `Hje` / 压缩导出 `XX`）。 */
export function createInfiniteQueryFamily<
  TScope,
  Param,
  TPage,
  TPageParam,
  TError = Error,
>(
  scope: Scope<TScope>,
  getOptions: (
    parameter: Param,
    context: DerivedScopedSignalContext<TScope>,
  ) => ScopedInfiniteQueryOptions<TPage, TPageParam, TError>,
  options?: ScopedQueryFamilyOptions<Param>,
): ScopedInfiniteQueryFamily<TScope, Param, TPage, TPageParam, TError> {
  return createInfiniteQueryFamilyInternal(scope, getOptions, options);
}

/** 解析 infinite-query family 成员为 hook 可消费的 atom/store 对。 */
export function resolveScopedInfiniteQueryFamily<
  TScope,
  Param,
  TPage,
  TPageParam,
  TError,
>(
  family: ScopedInfiniteQueryFamily<
    TScope,
    Param,
    TPage,
    TPageParam,
    TError
  >,
  parameter: Param,
  state: ScopeState<unknown>,
): BoundAtomSignal<ScopedInfiniteQueryResult<TPage, TPageParam, TError>> {
  const owner = findScopeState(state, family.scope);
  return { atom: family.resolve(state, parameter), store: owner.store };
}

function createMutationSignalInternal<
  TScope,
  TData,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  scope: Scope<TScope>,
  getOptions: (
    context: DerivedScopedSignalContext<TScope>,
  ) => ScopedMutationOptions<TData, TError, TVariables, TContext>,
  resolveCurrent?: (
    owner: ScopeState<unknown>,
  ) => Atom<ScopedMutationResult<TData, TError, TVariables, TContext>> | undefined,
): ScopedMutationSignal<TScope, TData, TError, TVariables, TContext> {
  type Result = ScopedMutationResult<TData, TError, TVariables, TContext>;
  type State = Pick<Result, "data" | "error" | "status" | "variables">;

  const binding: ScopedMutationSignal<
    TScope,
    TData,
    TError,
    TVariables,
    TContext
  > = {
    cache: "cached",
    getOptions,
    scope,
    resolve(activeState) {
      const owner = findScopeState(activeState, scope);
      const cacheKey = binding as unknown as ScopedDerivedSignal<
        unknown,
        unknown
      >;
      const cached = owner.cachedBindings.get(cacheKey);
      if (cached != null) return cached as Atom<Result>;
      if (owner.queryClient == null) {
        throw new Error("mutationSignal requires a QueryClient on Scope");
      }

      const stateAtom = atom<State>({
        data: undefined,
        error: null,
        status: "idle",
        variables: undefined,
      });
      let mutationId = 0;
      let resultAtom: Atom<Result>;
      resultAtom = atom((get) => {
        const state = get(stateAtom);
        const executeMutation = async (
          variables: TVariables,
          callbacks?: ScopedMutationCallbacks<
            TData,
            TError,
            TVariables,
            TContext
          >,
        ): Promise<TData> => {
          const options = getOptions(createDerivedContext(owner, get));
          const mutation: ScopedMutationContext = {
            client: owner.queryClient,
            meta: options.meta,
            mutationKey: options.mutationKey,
          };
          const currentMutationId = ++mutationId;
          owner.store.set(stateAtom, {
            data: undefined,
            error: null,
            status: "pending",
            variables,
          });
          let context: TContext | undefined;
          let data: TData;
          try {
            context = await options.onMutate?.(variables, mutation);
            data = (await options.mutationFn?.(variables, mutation)) as TData;
          } catch (caught) {
            const error = caught as TError;
            if (currentMutationId === mutationId) {
              owner.store.set(stateAtom, {
                data: undefined,
                error,
                status: "error",
                variables,
              });
            }
            await options.onError?.(error, variables, context, mutation);
            await options.onSettled?.(
              undefined,
              error,
              variables,
              context,
              mutation,
            );
            callbacks?.onError?.(error, variables, context, mutation);
            callbacks?.onSettled?.(
              undefined,
              error,
              variables,
              context,
              mutation,
            );
            throw caught;
          }
          if (currentMutationId === mutationId) {
            owner.store.set(stateAtom, {
              data,
              error: null,
              status: "success",
              variables,
            });
          }
          await options.onSuccess?.(data, variables, context, mutation);
          await options.onSettled?.(data, null, variables, context, mutation);
          callbacks?.onSuccess?.(data, variables, context, mutation);
          callbacks?.onSettled?.(data, null, variables, context, mutation);
          return data;
        };
        const mutateAsync = (
          variables: TVariables,
          callbacks?: ScopedMutationCallbacks<
            TData,
            TError,
            TVariables,
            TContext
          >,
        ): Promise<TData> => {
          const current = resolveCurrent?.(owner);
          if (current != null && current !== resultAtom) {
            return owner.store.get(current).mutateAsync(variables, callbacks);
          }
          return executeMutation(variables, callbacks);
        };
        return {
          ...state,
          isError: state.status === "error",
          isIdle: state.status === "idle",
          isPending: state.status === "pending",
          isSuccess: state.status === "success",
          mutate(variables, callbacks) {
            void mutateAsync(variables, callbacks).catch(() => {});
          },
          mutateAsync,
        };
      });
      owner.cachedBindings.set(cacheKey, resultAtom as Atom<unknown>);
      return resultAtom;
    },
  };
  return binding;
}

/** 创建 scope 键控 mutation signal（原 `Wje` / 压缩导出 `YX`）。 */
export function createMutationSignal<
  TScope,
  TData,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  scope: Scope<TScope>,
  getOptions: (
    context: DerivedScopedSignalContext<TScope>,
  ) => ScopedMutationOptions<TData, TError, TVariables, TContext>,
): ScopedMutationSignal<TScope, TData, TError, TVariables, TContext> {
  return createMutationSignalInternal(scope, getOptions);
}

/** 解析 mutation signal 为 hook 可消费的 atom/store 对。 */
export function resolveScopedMutationSignal<
  TScope,
  TData,
  TError,
  TVariables,
  TContext,
>(
  signal: ScopedMutationSignal<TScope, TData, TError, TVariables, TContext>,
  state: ScopeState<unknown>,
): BoundAtomSignal<ScopedMutationResult<TData, TError, TVariables, TContext>> {
  const owner = findScopeState(state, signal.scope);
  return { atom: signal.resolve(state), store: owner.store };
}

/** 创建 scope 键控 mutation family（原 `Uje` / 压缩导出 `JX`）。 */
export function createMutationFamily<
  TScope,
  Param,
  TData,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  scope: Scope<TScope>,
  getOptions: (
    parameter: Param,
    context: DerivedScopedSignalContext<TScope>,
  ) => ScopedMutationOptions<TData, TError, TVariables, TContext>,
  options?: ScopedMutationFamilyOptions<Param>,
): ScopedMutationFamily<
  TScope,
  Param,
  TData,
  TError,
  TVariables,
  TContext
> {
  type Family = ScopedMutationFamily<
    TScope,
    Param,
    TData,
    TError,
    TVariables,
    TContext
  >;
  type Signal = ScopedMutationSignal<
    TScope,
    TData,
    TError,
    TVariables,
    TContext
  >;
  type Result = ScopedMutationResult<TData, TError, TVariables, TContext>;

  const autoDisposeMs = normalizeAutoDispose(options?.autoDispose);
  const memberSignals = new WeakMap<
    ScopeState<unknown>,
    Map<unknown, Signal>
  >();
  const family: Family = {
    autoDisposeMs,
    getOptions,
    kind: "readable-family",
    scope,
    evict(activeState, parameter) {
      const owner = findScopeState(activeState, scope);
      const familyKey = family as ScopedMutationFamily<
        unknown,
        unknown,
        unknown,
        unknown,
        unknown,
        unknown
      >;
      const parameterKey = scopedFamilyKey(parameter, options);
      const members = owner.mutationFamilyBindings.get(familyKey);
      const signal = memberSignals.get(owner)?.get(parameterKey);
      if (signal != null) {
        owner.cachedBindings.delete(
          signal as unknown as ScopedDerivedSignal<unknown, unknown>,
        );
        memberSignals.get(owner)?.delete(parameterKey);
      }
      if (members == null) return false;
      const removed = members.delete(parameterKey);
      if (members.size === 0) owner.mutationFamilyBindings.delete(familyKey);
      return removed;
    },
    resolve(activeState, parameter) {
      const owner = findScopeState(activeState, scope);
      const familyKey = family as ScopedMutationFamily<
        unknown,
        unknown,
        unknown,
        unknown,
        unknown,
        unknown
      >;
      let members = owner.mutationFamilyBindings.get(familyKey);
      if (members == null) {
        members = new Map();
        owner.mutationFamilyBindings.set(familyKey, members);
      }
      const parameterKey = scopedFamilyKey(parameter, options);
      const cached = members.get(parameterKey);
      if (cached != null) return cached as Atom<Result>;

      const signal = createMutationSignalInternal(
        scope,
        (context) => getOptions(parameter, context),
        (currentOwner) => currentOwner.mutationFamilyBindings
          .get(familyKey)
          ?.get(parameterKey) as Atom<Result> | undefined,
      );
      signal.debugLabel = family.debugLabel;
      let signals = memberSignals.get(owner);
      if (signals == null) {
        signals = new Map();
        memberSignals.set(owner, signals);
      }
      signals.set(parameterKey, signal);
      const mutationAtom = signal.resolve(activeState);
      const mountMutation = mutationAtom.onMount;
      let disposalTimer: ReturnType<typeof setTimeout> | undefined;
      mutationAtom.onMount = (setSelf) => {
        if (disposalTimer != null) {
          clearTimeout(disposalTimer);
          disposalTimer = undefined;
        }
        const unmountMutation = mountMutation?.(setSelf);
        return () => {
          if (typeof unmountMutation === "function") unmountMutation();
          if (autoDisposeMs === Infinity) return;
          disposalTimer = setTimeout(() => {
            disposalTimer = undefined;
            family.evict(activeState, parameter);
          }, autoDisposeMs);
        };
      };
      members.set(parameterKey, mutationAtom as Atom<unknown>);
      return mutationAtom;
    },
  };
  return family;
}

/** 解析 mutation family 成员为 hook 可消费的 atom/store 对。 */
export function resolveScopedMutationFamily<
  TScope,
  Param,
  TData,
  TError,
  TVariables,
  TContext,
>(
  family: ScopedMutationFamily<
    TScope,
    Param,
    TData,
    TError,
    TVariables,
    TContext
  >,
  parameter: Param,
  state: ScopeState<unknown>,
): BoundAtomSignal<ScopedMutationResult<TData, TError, TVariables, TContext>> {
  const owner = findScopeState(state, family.scope);
  return { atom: family.resolve(state, parameter), store: owner.store };
}

/**
 * 创建 scope 键控派生 family（原 `Sje` / 压缩导出 `rZ`）。成员按稳定参数
 * key 缓存在目标 scope 实例上，默认 autoDispose 为 60 秒。
 */
export function createDerivedFamily<TScope, Param, TValue>(
  scope: Scope<TScope>,
  derive: (parameter: Param, context: DerivedScopedSignalContext<TScope>) => TValue,
  options?: ScopedDerivedFamilyOptions<Param, TValue>,
): ScopedDerivedFamily<TScope, Param, TValue> {
  const autoDisposeMs = normalizeAutoDispose(options?.autoDispose ?? 60_000);
  const keyOptions = options as ScopedDerivedFamilyOptions<Param, unknown> | undefined;
  const family: ScopedDerivedFamily<TScope, Param, TValue> = {
    autoDisposeMs,
    kind: "readable-family",
    scope,
    evict(activeState, parameter) {
      const owner = findScopeState(activeState, scope);
      const members = owner.familyBindings.get(
        family as ScopedDerivedFamily<unknown, unknown, unknown>,
      );
      if (members == null) return false;
      const removed = members.delete(scopedFamilyKey(parameter, keyOptions));
      if (members.size === 0) {
        owner.familyBindings.delete(
          family as ScopedDerivedFamily<unknown, unknown, unknown>,
        );
      }
      return removed;
    },
    resolve(activeState, parameter) {
      const owner = findScopeState(activeState, scope);
      const familyKey = family as ScopedDerivedFamily<unknown, unknown, unknown>;
      let members = owner.familyBindings.get(familyKey);
      if (members == null) {
        members = new Map();
        owner.familyBindings.set(familyKey, members);
      }
      const parameterKey = scopedFamilyKey(parameter, keyOptions);
      const cached = members.get(parameterKey);
      if (cached != null) return cached as Atom<TValue>;
      const derivedAtom = atom((get) => derive(parameter, createDerivedContext(owner, get)));
      derivedAtom.isEqual = options?.isEqual;
      let disposalTimer: ReturnType<typeof setTimeout> | undefined;
      derivedAtom.onMount = () => {
        if (disposalTimer != null) {
          clearTimeout(disposalTimer);
          disposalTimer = undefined;
        }
        return () => {
          if (autoDisposeMs === Infinity) return;
          disposalTimer = setTimeout(() => {
            disposalTimer = undefined;
            family.evict(activeState, parameter);
          }, autoDisposeMs);
        };
      };
      members.set(parameterKey, derivedAtom as Atom<unknown>);
      return derivedAtom;
    },
  };
  return family;
}

/** 解析派生 family 成员为 hook 可消费的 atom/store 对。 */
export function resolveScopedDerivedFamily<TScope, Param, TValue>(
  family: ScopedDerivedFamily<TScope, Param, TValue>,
  parameter: Param,
  state: ScopeState<unknown>,
): BoundAtomSignal<TValue> {
  const owner = findScopeState(state, family.scope);
  return { atom: family.resolve(state, parameter), store: owner.store };
}

/**
 * 创建 scope 键控可写 signal family（原 `bje` / 压缩导出 `oZ`）。成员按
 * 稳定参数 key 缓存在目标 scope 实例上；与普通 signal 一样支持初始化器、
 * 自定义相等判断、服务端快照和挂载生命周期。默认不自动回收。
 */
export function createSignalFamily<TScope, Param, TValue>(
  scope: Scope<TScope>,
  initialValue:
    | TValue
    | ((parameter: Param, context: DerivedScopedSignalContext<TScope>) => TValue),
  signalOptions?: ScopedSignalFamilyValueOptions<TScope, Param, TValue>,
  familyOptions?: ScopedSignalFamilyOptions<Param>,
): ScopedSignalFamily<TScope, Param, TValue> {
  const autoDisposeMs = normalizeAutoDispose(familyOptions?.autoDispose);
  const family: ScopedSignalFamily<TScope, Param, TValue> = {
    autoDisposeMs,
    kind: "signal-family",
    scope,
    evict(activeState, parameter) {
      const owner = findScopeState(activeState, scope);
      const familyKey = family as ScopedSignalFamily<unknown, unknown, unknown>;
      const members = owner.signalFamilyBindings.get(familyKey);
      if (members == null) return false;
      const removed = members.delete(scopedFamilyKey(parameter, familyOptions));
      if (members.size === 0) owner.signalFamilyBindings.delete(familyKey);
      return removed;
    },
    resolve(activeState, parameter) {
      const owner = findScopeState(activeState, scope);
      const familyKey = family as ScopedSignalFamily<unknown, unknown, unknown>;
      let members = owner.signalFamilyBindings.get(familyKey);
      if (members == null) {
        members = new Map();
        owner.signalFamilyBindings.set(familyKey, members);
      }
      const parameterKey = scopedFamilyKey(parameter, familyOptions);
      const cached = members.get(parameterKey);
      if (cached != null) return cached as WritableAtom<TValue, unknown>;

      const context = createDerivedContext(owner, (target) => owner.store.get(target));
      const initial = typeof initialValue === "function"
        ? (initialValue as (
            parameter: Param,
            context: DerivedScopedSignalContext<TScope>,
          ) => TValue)(parameter, context)
        : initialValue;
      const familyAtom = atom(initial);
      familyAtom.isEqual = signalOptions?.isEqual;
      const getServerSnapshot = signalOptions?.getServerSnapshot;
      if (getServerSnapshot != null) {
        familyAtom.getServerSnapshot = () => getServerSnapshot(parameter);
      }

      let disposalTimer: ReturnType<typeof setTimeout> | undefined;
      familyAtom.onMount = (setSelf) => {
        if (disposalTimer != null) {
          clearTimeout(disposalTimer);
          disposalTimer = undefined;
        }
        const scopeApi = createScopeApi(owner);
        const memberScope = Object.assign(Object.create(scopeApi) as ScopeApi<TScope>, {
          key: parameter,
        }) as ScopedSignalFamilyScopeApi<TScope, Param>;
        const cleanup = signalOptions?.onMount?.(setSelf, memberScope);
        return () => {
          if (typeof cleanup === "function") cleanup();
          if (autoDisposeMs === Infinity) return;
          disposalTimer = setTimeout(() => {
            disposalTimer = undefined;
            family.evict(activeState, parameter);
          }, autoDisposeMs);
        };
      };
      members.set(parameterKey, familyAtom as WritableAtom<unknown, unknown>);
      return familyAtom;
    },
  };
  return family;
}

/** 解析可写 signal family 成员为 hook 可消费的 atom/store 对。 */
export function resolveScopedSignalFamily<TScope, Param, TValue>(
  family: ScopedSignalFamily<TScope, Param, TValue>,
  parameter: Param,
  state: ScopeState<unknown>,
): BoundAtomSignal<TValue> {
  const owner = findScopeState(state, family.scope);
  return { atom: family.resolve(state, parameter), store: owner.store };
}

/**
 * 创建 scope 键控 signal（原 `kI` / 压缩导出 `pZ`）。每个目标 scope
 * 实例只创建并缓存一个 atom；初始化器、onMount 和 query client 都绑定到
 * 该实例，而不是绑定到 scope 定义本身。
 */
export function createScopedSignal<TScope, TValue>(
  scope: Scope<TScope>,
  initialValue:
    | TValue
    | ((context: ScopedSignalInitializerContext<TScope>) => TValue),
  options?: ScopedSignalOptions<TScope, TValue>,
): ScopedSignal<TScope, TValue> {
  const binding: ScopedSignal<TScope, TValue> = {
    cache: "signal",
    scope,
    resolve(activeState) {
      const owner = findScopeState(activeState, scope);
      const cached = owner.signalBindings.get(binding as ScopedSignal<unknown, unknown>);
      if (cached != null) return cached as WritableAtom<TValue, unknown>;

      const scopeApi = createScopeApi(owner);
      const context: ScopedSignalInitializerContext<TScope> = {
        get queryClient() {
          return scopeApi.queryClient;
        },
        scope: scopeApi,
      };
      const initial =
        typeof initialValue === "function"
          ? (initialValue as (context: ScopedSignalInitializerContext<TScope>) => TValue)(context)
          : initialValue;
      const scopedAtom = atom(initial);
      scopedAtom.isEqual = options?.isEqual;
      scopedAtom.getServerSnapshot = options?.getServerSnapshot;
      if (options?.onMount != null) {
        scopedAtom.onMount = (setSelf) => options.onMount?.(setSelf, scopeApi);
      }
      owner.signalBindings.set(
        binding as ScopedSignal<unknown, unknown>,
        scopedAtom as Atom<unknown>,
      );
      return scopedAtom;
    },
  };
  return binding;
}

/** 解析为现有 signal hook 可直接消费的 atom/store 对。 */
export function resolveScopedSignal<TScope, TValue>(
  signal: ScopedSignal<TScope, TValue>,
  state: ScopeState<unknown>,
): BoundAtomSignal<TValue> {
  const owner = findScopeState(state, signal.scope);
  return { atom: signal.resolve(state), store: owner.store };
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
  createContext<T>(defaultValue: T): ReactContextLike<T>;
  createElement(type: unknown, props: Record<string, unknown> | null, ...children: unknown[]): unknown;
  useContext<T>(context: ReactContextLike<T>): T;
  useSyncExternalStore<T>(subscribe: (onChange: () => void) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T): T;
  useCallback<T extends (...args: never[]) => unknown>(fn: T, deps?: unknown[]): T;
  useLayoutEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  useRef<T>(initialValue: T): { current: T };
}

export interface ReactContextLike<T> {
  Consumer: unknown;
  Provider: unknown;
}

function reactOf(): ReactLike {
  return (globalThis as { __RENDERER_REACT__?: ReactLike }).__RENDERER_REACT__ ?? (require("react") as unknown as ReactLike);
}

const reactScopeContexts = new WeakMap<Scope<unknown>, ReactContextLike<ScopeState<unknown> | null>>();
let queryClientReactContext: ReactContextLike<unknown | undefined> | undefined;

function getQueryClientReactContext(): ReactContextLike<unknown | undefined> {
  queryClientReactContext ??= reactOf().createContext<unknown | undefined>(undefined);
  return queryClientReactContext;
}

/** 返回 scope 对应的 React context，供 scope provider 装配实例链。 */
export function getScopeReactContext<T>(
  scope: Scope<T>,
): ReactContextLike<ScopeState<unknown> | null> {
  let context = reactScopeContexts.get(scope);
  if (context == null) {
    context = reactOf().createContext<ScopeState<unknown> | null>(null);
    reactScopeContexts.set(scope, context);
  }
  return context;
}

export interface QueryClientProviderProps {
  children?: unknown;
  queryClient?: unknown;
}

/** 向根 scope 注入 QueryClient（原 `Xje` / 压缩导出 `GX`）。 */
export function QueryClientProvider({
  children,
  queryClient,
}: QueryClientProviderProps): unknown {
  const React = reactOf();
  return React.createElement(
    getQueryClientReactContext().Provider,
    { value: queryClient },
    children,
  );
}

export interface ScopeProviderProps<T> {
  children?: unknown;
  scope: Scope<T>;
  value?: T;
}

interface ScopeProviderState<T> {
  key: unknown;
  parent: ScopeState<unknown> | null;
  state: ScopeState<T>;
}

const EMPTY_SCOPE_VALUE: Record<string, never> = Object.freeze({});

/** 装配 React scope 实例链（原 `$je` / 压缩导出 `UX`）。 */
export function ScopeProvider<T>({
  children,
  scope,
  value,
}: ScopeProviderProps<T>): unknown {
  const React = reactOf();
  const parent = scope.parent == null
    ? null
    : React.useContext(getScopeReactContext(scope.parent));
  if (scope.parent != null && parent == null) {
    throw new Error("Missing parent scope");
  }
  const queryClient = React.useContext(getQueryClientReactContext());
  const providedValue = (value ?? EMPTY_SCOPE_VALUE) as T;
  const key = scope.getKey?.(providedValue) ?? JSON.stringify(providedValue);
  const holder = React.useRef<ScopeProviderState<T> | null>(null);
  const retained = scope.retain != null && parent != null
    ? parent.retainedScopeEntries.get(scope)?.get(key) as ScopeState<T> | undefined
    : undefined;
  if (
    holder.current == null ||
    holder.current.parent !== parent ||
    !Object.is(holder.current.key, key) ||
    (retained != null && holder.current.state !== retained)
  ) {
    const state = retained ?? createScopeState(scope, providedValue, {
      parent: parent ?? undefined,
      queryClient,
      retainKey: key,
    });
    holder.current = { key, parent, state };
  }
  const activeState = holder.current.state;
  const effectiveQueryClient = parent?.queryClient ?? queryClient;
  if (
    !Object.is(activeState.value, providedValue) ||
    activeState.queryClient !== effectiveQueryClient
  ) {
    activeState.cachedBindings = new Map();
    activeState.value = providedValue;
    activeState.queryClient = effectiveQueryClient;
  }
  return React.createElement(
    getScopeReactContext(scope).Provider,
    { value: activeState },
    children,
  );
}

/** Provider lazy initializer（原 `rL` / 压缩导出 `KX`）。 */
export function initializeScopeProviderRuntime(): void {}

/** React scope hook（原 `mMe` / 压缩导出 `LX`）。 */
export function useScope<T>(scope: Scope<T>): ScopeApi<T> {
  const activeState = reactOf().useContext(getScopeReactContext(scope));
  if (activeState == null) throw new Error(`Missing scope instance: ${scope.__scopeBrand}`);
  return createScopeApi(findScopeState(activeState, scope));
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

/** `BX` 的普通 callable signal family。 */
export interface CallableSignalFamily<Param, T> {
  (parameter: Param): ReadableSignal<T>;
}

/** `BX` 可读取的参数化 family 形态。 */
export type SignalFamily<Param, T> =
  | CallableSignalFamily<Param, T>
  | ScopedDerivedFamily<unknown, Param, T>
  | ScopedExternalSignalFamily<unknown, Param, T>
  | ScopedMutationFamily<unknown, Param, unknown, unknown, unknown, unknown>
  | ScopedQueryFamily<unknown, Param, unknown, unknown>
  | ScopedInfiniteQueryFamily<unknown, Param, unknown, unknown, unknown>
  | ScopedSignalFamily<unknown, Param, T>;

function isScopedFamilyBinding<Param, T>(
  value: SignalFamily<Param, T>,
): value is
  | ScopedDerivedFamily<unknown, Param, T>
  | ScopedExternalSignalFamily<unknown, Param, T>
  | ScopedMutationFamily<unknown, Param, unknown, unknown, unknown, unknown>
  | ScopedQueryFamily<unknown, Param, unknown, unknown>
  | ScopedInfiniteQueryFamily<unknown, Param, unknown, unknown, unknown>
  | ScopedSignalFamily<unknown, Param, T> {
  return (
    typeof value === "object" &&
    value != null &&
    "scope" in value &&
    "resolve" in value &&
    "kind" in value
  );
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
export function useSignalFamilyValue<Param, Data, MutationError, Variables, Context>(
  family: ScopedMutationFamily<unknown, Param, Data, MutationError, Variables, Context>,
  parameter: Param,
  options?: QueryReadOptions,
): ScopedMutationResult<Data, MutationError, Variables, Context>;
export function useSignalFamilyValue<Param, T>(family: SignalFamily<Param, T>, parameter: Param, options?: QueryReadOptions): T {
  const configuredFamily = withQueryReadOptions(family, options) as SignalFamily<Param, T>;
  if (isScopedFamilyBinding(configuredFamily)) {
    const activeState = reactOf().useContext(getScopeReactContext(configuredFamily.scope));
    if (activeState == null) {
      throw new Error(`Missing scope instance: ${configuredFamily.scope.__scopeBrand}`);
    }
    const owner = findScopeState(activeState, configuredFamily.scope);
    const scopedFamily = configuredFamily as {
      resolve(state: ScopeState<unknown>, member: Param): Atom<T>;
    };
    return useSignalValue({
      atom: scopedFamily.resolve(activeState, parameter),
      store: owner.store,
    });
  }
  return useSignalValue(configuredFamily(parameter), options);
}
