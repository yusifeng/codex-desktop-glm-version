// chart-stores —— 图表运行时的名称映射与组件状态外部 store 适配层。
// 原版：app/webview/assets/chart-stores-e252d78bbb86.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
let React: any;
let chartStateAtom: any;

function useChartStores() {
  const scope = appShared.LX(appShared.ZI);
  return {
    useNameToIdStore: createChartExternalStore(scope, "nameToId"),
    useWidgetStateStore: createChartExternalStore(scope, "widgetState"),
  };
}

function createChartRuntimeContext(
  theme: any,
  { useNameToIdStore, useWidgetStateStore }: any,
  flags: Record<string, any> = {},
) {
  return {
    activeBreakpoints: [],
    errorMode: "throw",
    evaluate: () => undefined,
    flags,
    getActiveBreakpointValue: (value: any) => value.default,
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

function createChartExternalStore(scope: any, key: "nameToId" | "widgetState") {
  const getState = () => scope.get(chartStateAtom)[key];
  const initialState = { nameToId: {}, widgetState: {} }[key];
  function setState(update: any, replace = false) {
    scope.set(chartStateAtom, (current: any) => {
      const previous = current[key];
      const next = typeof update === "function" ? update(previous) : update;
      if (Object.is(next, previous)) return current;
      return appInitial.Qhn(current, (draft: any) => {
        const target = draft[key];
        if (replace) {
          for (const entry of Object.keys(target)) delete target[entry];
        }
        Object.assign(target, next);
      });
    });
  }
  const getInitialState = () => initialState;
  function subscribe(listener: (next: any, previous: any) => void) {
    let previous = getState();
    return scope.watch((snapshot: any) => {
      const next = snapshot.get(chartStateAtom)[key];
      if (Object.is(next, previous)) return;
      const old = previous;
      previous = next;
      listener(next, old);
    });
  }
  function useStore(selector?: (value: any) => any) {
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
  appShared.$3();
  appInitial.Zhn();
  appShared.FX();
  React = appShared.e6();
  appShared.QI();
  chartStateAtom = appShared.pZ(appShared.ZI, () => ({
    nameToId: {},
    widgetState: {},
  }));
}

export {
  initializeChartStores as n,
  useChartStores as r,
  createChartRuntimeContext as t,
};
