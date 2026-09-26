import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__chartStoresTest = {
  initialized: [],
  atom: null,
  value: null,
  watchers: [],
});
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/chart-stores/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "mock-renderer-chunks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock-renderer-chunk",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock-renderer-chunk" },
          ({ path: importPath }) => ({
            contents:
              importPath === "app-shared"
                ? `
                  const state = globalThis.__chartStoresTest; export const ZI = "scope";
                  export const $3 = () => state.initialized.push("$3"); export const FX = () => state.initialized.push("FX"); export const QI = () => state.initialized.push("QI");
                  export const e6 = () => { state.initialized.push("e6"); return { useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot() }; };
                  export const pZ = (_scope, factory) => { state.atom = "chartAtom"; state.value = factory(); return state.atom; };
                  export const LX = () => ({
                    get: () => state.value,
                    set: (_atom, update) => { state.value = update(state.value); for (const watcher of state.watchers) watcher({ get: () => state.value }); },
                    watch: (watcher) => { state.watchers.push(watcher); return () => state.watchers.splice(state.watchers.indexOf(watcher), 1); },
                  });
                `
                : `
                  export const Zhn = () => globalThis.__chartStoresTest.initialized.push("Zhn");
                  export const Qhn = (value, recipe) => { const copy = structuredClone(value); recipe(copy); return copy; };
                `,
            loader: "js",
          }),
        );
      },
    },
  ],
});
const stores = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
stores.n();
check(
  state.initialized.length === 5,
  "initializes all chart store dependencies",
);
check(
  state.value.nameToId && state.value.widgetState,
  "creates both chart state partitions",
);

const chartStores = stores.r();
const names = chartStores.useNameToIdStore;
const widgets = chartStores.useWidgetStateStore;
check(names.getState() === state.value.nameToId, "reads the current name map");
check(
  widgets.getInitialState() !== widgets.getState(),
  "keeps an isolated empty initial state",
);
names.setState({ revenue: "chart-1" });
check(names.getState().revenue === "chart-1", "merges chart name mappings");
names.setState((current) => ({ ...current, traffic: "chart-2" }));
check(
  names.getState().traffic === "chart-2",
  "supports functional store updates",
);
names.setState({ only: "chart-3" }, true);
check(
  Object.keys(names.getState()).join(",") === "only",
  "replaces state when requested",
);

let observed = null;
const unsubscribe = names.subscribe((next, previous) => {
  observed = { next, previous };
});
names.setState({ extra: "chart-4" });
check(
  observed.previous.only === "chart-3" && observed.next.extra === "chart-4",
  "notifies subscribers with next and previous states",
);
unsubscribe();
check(state.watchers.length === 0, "unsubscribes from the scope watcher");
check(
  names((value) => value.extra) === "chart-4",
  "selects values through useSyncExternalStore",
);

const context = stores.t("dark", chartStores, { animations: false });
check(
  context.theme === "dark" && context.flags.animations === false,
  "builds the chart runtime context",
);
check(
  context.errorMode === "throw" && context.streaming === false,
  "uses deterministic runtime defaults",
);
check(
  context.getActiveBreakpointValue({ default: 42 }) === 42,
  "resolves default breakpoint values",
);
check(
  (await context.onAction()) === undefined,
  "provides a no-op async action handler",
);

console.log(`${assertions} chart-stores assertions passed`);
