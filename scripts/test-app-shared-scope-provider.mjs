import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let currentSlots = [];
let hookIndex = 0;
function render(slots, component) {
  currentSlots = slots;
  hookIndex = 0;
  return component();
}
globalThis.__RENDERER_REACT__ = {
  createContext(defaultValue) {
    const context = { Consumer: {}, defaultValue, currentValue: defaultValue };
    context.Provider = { context };
    return context;
  },
  createElement(type, props, ...children) {
    return {
      props: {
        ...(props ?? {}),
        children: children.length <= 1 ? children[0] : children,
      },
      type,
    };
  },
  useCallback(callback) {
    return callback;
  },
  useContext(context) {
    return context.currentValue;
  },
  useLayoutEffect() {},
  useRef(initialValue) {
    const slot = hookIndex++;
    currentSlots[slot] ??= { current: initialValue };
    return currentSlots[slot];
  },
  useSyncExternalStore(_subscribe, getSnapshot) {
    return getSnapshot();
  },
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/runtime/atom-signal.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  external: ["react"],
  write: false,
  logLevel: "silent",
});
const signals = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
function mountProvider(element) {
  element.type.context.currentValue = element.props.value;
  return element.props.value;
}

const firstClient = { name: "first-client" };
const queryElement = signals.QueryClientProvider({
  children: "application",
  queryClient: firstClient,
});
check(queryElement.props.children === "application", "preserves QueryClientProvider children");
check(queryElement.props.value === firstClient, "provides the supplied query client");
mountProvider(queryElement);

const rootScope = signals.createScope("ProviderRoot", { key: (value) => value.id });
const retainedScope = signals.createScope("ProviderRetained", {
  key: (value) => value.id,
  parent: rootScope,
  retain: { max: 2 },
});
assert.throws(
  () => render([], () => signals.ScopeProvider({ scope: retainedScope, value: { id: "missing" } })),
  /Missing parent scope/,
);
assertions += 1;

const rootSlots = [];
const rootElement = render(rootSlots, () => signals.ScopeProvider({
  children: "root-child",
  scope: rootScope,
  value: { id: "root", name: "first" },
}));
const rootState = mountProvider(rootElement);
check(rootElement.props.children === "root-child", "preserves ScopeProvider children");
check(rootState.scope === rootScope, "creates a state for the provided scope");
check(rootState.value.name === "first", "stores the provided scope value");
check(rootState.queryClient === firstClient, "inherits the ambient query client");
check(signals.useScope(rootScope).value.name === "first", "exposes provider state through useScope");

const derived = signals.createDerivedSignal(rootScope, ({ scope }) => scope.value.name);
const firstDerived = signals.resolveScopedDerivedSignal(derived, rootState);
firstDerived.store.get(firstDerived.atom);
const updatedRootElement = render(rootSlots, () => signals.ScopeProvider({
  scope: rootScope,
  value: { id: "root", name: "updated" },
}));
const updatedRootState = mountProvider(updatedRootElement);
check(updatedRootState === rootState, "keeps one state when the scope key is stable");
check(updatedRootState.value.name === "updated", "updates values on stable-key rerenders");
check(
  signals.resolveScopedDerivedSignal(derived, updatedRootState).atom !== firstDerived.atom,
  "invalidates cached bindings when the provided value changes",
);

const childSlots = [];
const childElement = render(childSlots, () => signals.ScopeProvider({
  scope: retainedScope,
  value: { id: "child-a", count: 1 },
}));
const childState = mountProvider(childElement);
check(childState.parent === rootState, "links child scope state to its parent");
check(childState.store === rootState.store, "shares the parent atom store");
check(childState.queryClient === firstClient, "inherits the parent query client");
check(signals.useScope(retainedScope).value.count === 1, "exposes child state through useScope");

const remountedChildElement = render([], () => signals.ScopeProvider({
  scope: retainedScope,
  value: { id: "child-a", count: 2 },
}));
const remountedChildState = mountProvider(remountedChildElement);
check(remountedChildState === childState, "reuses retained state across provider instances");
check(remountedChildState.value.count === 2, "refreshes a reused retained scope value");

const otherChildElement = render([], () => signals.ScopeProvider({
  scope: retainedScope,
  value: { id: "child-b", count: 3 },
}));
const otherChildState = mountProvider(otherChildElement);
check(otherChildState !== childState, "creates distinct retained states for distinct keys");

const secondClient = { name: "second-client" };
mountProvider(signals.QueryClientProvider({ queryClient: secondClient }));
const clientUpdatedElement = render(rootSlots, () => signals.ScopeProvider({
  scope: rootScope,
  value: { id: "root", name: "updated" },
}));
const clientUpdatedState = mountProvider(clientUpdatedElement);
check(clientUpdatedState === rootState, "keeps root identity when only the query client changes");
check(clientUpdatedState.queryClient === secondClient, "updates the root query client");

const defaultScope = signals.createScope("DefaultProviderValue");
const defaultElement = render([], () => signals.ScopeProvider({ scope: defaultScope }));
const defaultState = mountProvider(defaultElement);
check(
  typeof defaultState.value === "object" && Object.keys(defaultState.value).length === 0,
  "uses an empty object for omitted scope values",
);
check(signals.initializeScopeProviderRuntime() === undefined, "keeps provider initialization idempotent");

delete globalThis.__RENDERER_REACT__;
console.log(`app-shared scope provider behavior: ${assertions}/${assertions} assertions passed`);
