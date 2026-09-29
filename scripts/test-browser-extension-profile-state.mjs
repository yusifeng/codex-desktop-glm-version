import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(
  ROOT,
  "src/renderer/browser-extension-profile-state/index.ts",
);
const source = fs.readFileSync(sourcePath, "utf8");
const dependencies = new Set(
  [...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"/]+)"/g)].map(
    (match) => match[1],
  ),
);
assert.deepEqual([...dependencies].sort(), [
  "app-initial",
  "app-shared",
  "profile",
  "rolldown-runtime",
]);
assert.doesNotMatch(source, /import\s*\(/);
assert.doesNotMatch(source, /\bany\b/);
assert.doesNotMatch(source, /\bprofileChunk\s*\./);

const state = (globalThis.__browserExtensionProfileStateTest = {
  external: null,
  host: { id: "browser-host" },
  initializers: [],
  initializeCalls: [],
  listeners: new Set(),
  sets: [],
  snapshot: null,
  store: null,
});
state.store = {
  getSnapshot: () => state.snapshot,
  initialize: async (host) => {
    state.initializeCalls.push(host);
  },
  subscribe: (listener) => {
    state.listeners.add(listener);
    return () => state.listeners.delete(listener);
  },
};

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": `
    const state=globalThis.__browserExtensionProfileStateTest;
    export const FX=()=>state.initializers.push("maitai");
    export const QI=()=>state.initializers.push("external-signals");
    export const ZI={ id: "app-scope" };
    export const dZ=(scope,getSnapshot,subscribe)=>{
      state.external={scope,getSnapshot,subscribe};
      return { kind: "external-signal", scope, getSnapshot, subscribe };
    };
  `,
  "app-initial": `
    const state=globalThis.__browserExtensionProfileStateTest;
    export const mnt=()=>state.initializers.push("app-services");
    export const pnt={ browserHost: state.host };
  `,
  profile: `
    const state=globalThis.__browserExtensionProfileStateTest;
    export let t;
    export const n=()=>{ state.initializers.push("profile-store"); t=state.store; };
  `,
};
const result = await esbuild.build({
  entryPoints: [sourcePath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "browser-extension-profile-state-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({
          loader: "js",
          contents: mocks[importPath] ?? "export {};",
        }));
      },
    },
  ],
});
const module = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 4;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

check(Object.keys(module).sort().join(",") === "n,r,t", "preserves n, r, and t exports");
check(module.t === undefined, "defers signal creation until initialization");
module.n();
const signal = module.t;
module.n();
check(module.t === signal, "initializes the external signal only once");
check(
  state.initializers.join(",") ===
    "maitai,app-services,external-signals,profile-store",
  "initializes dependencies in published order",
);
check(signal.kind === "external-signal", "exports the created external signal");
check(state.external.scope.id === "app-scope", "binds the signal to app scope");
check(state.external.getSnapshot() === null, "uses the profile store snapshot getter");

const cleanup = state.external.subscribe({
  set(value) {
    state.sets.push(value);
  },
});
state.snapshot = { id: "profile-1" };
for (const listener of state.listeners) listener();
check(state.sets[0] === state.snapshot, "pushes store updates into the external signal");
cleanup();
check(state.listeners.size === 0, "returns the store subscription cleanup");
await module.r();
check(state.initializeCalls[0] === state.host, "initializes the store with browserHost");

console.log(`${assertions} browser extension profile state assertions passed`);
