// chart-stores —— 图表运行时的名称映射与组件状态外部 store 适配层。
// 原版：app/webview/assets/chart-stores-e252d78bbb86.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import type {
  MaitaiScopeApi,
  ReactRuntime,
  ScopedSignal,
} from "@rchunk/app-shared";

void runtimeChunk;

type ChartPartition = Record<string, unknown>;

interface ChartState {
  nameToId: ChartPartition;
  widgetState: ChartPartition;
}

type ChartStateUpdate<State> = State | ((current: State) => State);

export interface ChartExternalStore<State> {
  <Selection = State>(selector?: (value: State) => Selection): Selection;
  getInitialState(): State;
  getState(): State;
  setState(update: ChartStateUpdate<State>, replace?: boolean): void;
  subscribe(listener: (next: State, previous: State) => void): () => void;
}

export interface ChartStores {
  useNameToIdStore: ChartExternalStore<ChartPartition>;
  useWidgetStateStore: ChartExternalStore<ChartPartition>;
}

export interface ChartRuntimeContext {
  activeBreakpoints: readonly unknown[];
  errorMode: "throw";
  evaluate(): undefined;
  flags: Record<string, unknown>;
  getActiveBreakpointValue<Value>(value: { default: Value }): Value;
  isPrimarilyTouchDevice: false;
  mapboxAccessToken: null;
  onAction(): Promise<undefined>;
  onError(): undefined;
  onSoftFailure(): undefined;
  onStateMutation(): undefined;
  preferNativeControls: false;
  setRootWidgetElement(): undefined;
  showRenderFailureDebugInfo: false;
  streaming: false;
  theme: unknown;
  useNameToIdStore: ChartExternalStore<ChartPartition>;
  usePointerDown: false;
  useWidgetStateStore: ChartExternalStore<ChartPartition>;
}

const {
  $3: initializeRuntimeLazy,
  FX: initializeSignalRuntime,
  LX: useSignalScope,
  QI: initializeAppScope,
  ZI: appScope,
  e6: getReactRuntime,
  pZ: createScopedSignal,
} = appSharedChunk;
const {
  Qhn: produceImmutable,
  Zhn: initializeImmutableState,
} = appInitialChunk;

let React: ReactRuntime;
let chartStateAtom: ScopedSignal<Record<string, unknown>, ChartState>;

function useChartStores(): ChartStores {
  const scope = useSignalScope(appScope);
  return {
    useNameToIdStore: createChartExternalStore(scope, "nameToId"),
    useWidgetStateStore: createChartExternalStore(scope, "widgetState"),
  };
}

function createChartRuntimeContext(
  theme: unknown,
  { useNameToIdStore, useWidgetStateStore }: ChartStores,
  flags: Record<string, unknown> = {},
): ChartRuntimeContext {
  return {
    activeBreakpoints: [],
    errorMode: "throw",
    evaluate: () => undefined,
    flags,
    getActiveBreakpointValue: <Value>(value: { default: Value }) => value.default,
    isPrimarilyTouchDevice: false,
    mapboxAccessToken: null,
    onAction: async () => undefined,
    onError: () => undefined,
    onSoftFailure: () => undefined,
    onStateMutation: () => undefined,
    preferNativeControls: false,
    setRootWidgetElement: () => undefined,
    showRenderFailureDebugInfo: false,
    streaming: false,
    theme,
    useNameToIdStore,
    usePointerDown: false,
    useWidgetStateStore,
  };
}

function createChartExternalStore<Key extends keyof ChartState>(
  scope: MaitaiScopeApi<Record<string, unknown>>,
  key: Key,
): ChartExternalStore<ChartState[Key]> {
  const getState = () => scope.get(chartStateAtom)[key];
  const initialState: ChartState[Key] = { nameToId: {}, widgetState: {} }[key];
  function setState(update: ChartStateUpdate<ChartState[Key]>, replace = false) {
    scope.set(chartStateAtom, (current) => {
      const previous = current[key];
      const next = typeof update === "function" ? update(previous) : update;
      if (Object.is(next, previous)) return current;
      return produceImmutable(current, (draft) => {
        const target = draft[key];
        if (replace) {
          for (const entry of Object.keys(target)) delete target[entry];
        }
        Object.assign(target, next);
      });
    });
  }
  const getInitialState = () => initialState;
  function subscribe(
    listener: (next: ChartState[Key], previous: ChartState[Key]) => void,
  ) {
    let previous = getState();
    return scope.watch((snapshot) => {
      const next = snapshot.get(chartStateAtom)[key];
      if (Object.is(next, previous)) return;
      const old = previous;
      previous = next;
      listener(next, old);
    });
  }
  function useStore(): ChartState[Key];
  function useStore<Selection>(
    selector: (value: ChartState[Key]) => Selection,
  ): Selection;
  function useStore<Selection>(
    selector?: (value: ChartState[Key]) => Selection,
  ): Selection | ChartState[Key] {
    const getSnapshot = () =>
      selector == null ? getState() : selector(getState());
    const getServerSnapshot = () =>
      selector == null ? getInitialState() : selector(getInitialState());
    return React.useSyncExternalStore(
      subscribe,
      getSnapshot,
      getServerSnapshot,
    );
  }
  return Object.assign(useStore, {
    getInitialState,
    getState,
    setState,
    subscribe,
  });
}

function initializeChartStores(): void {
  initializeRuntimeLazy();
  initializeImmutableState();
  initializeSignalRuntime();
  React = getReactRuntime();
  initializeAppScope();
  chartStateAtom = createScopedSignal(appScope, () => ({
    nameToId: {},
    widgetState: {},
  }));
}

export {
  initializeChartStores as n,
  useChartStores as r,
  createChartRuntimeContext as t,
};
