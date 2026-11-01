import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__workspaceFileMenuTest = {
  initializers: [],
  requested: null,
  scope: { id: "route-scope" },
  jsx: {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
  },
});

async function bundle(entryDirectory) {
  const result = await esbuild.build({
    entryPoints: [
      path.join(ROOT, "src/renderer", entryDirectory, "index.ts"),
    ],
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
                    export const $3 = () => { globalThis.__workspaceFileMenuTest.initializers.push("runtime"); const cache = []; return { c: size => { while (cache.length < size) cache.push(Symbol.for("react.memo_cache_sentinel")); return cache; } }; };
                    export const FX = () => globalThis.__workspaceFileMenuTest.initializers.push("signals");
                    export const Of = () => globalThis.__workspaceFileMenuTest.initializers.push("menu");
                    export const I3 = () => globalThis.__workspaceFileMenuTest.jsx;
                    export const LX = () => globalThis.__workspaceFileMenuTest.scope;
                    export const Df = "ContextMenu";
                  `
                  : importPath === "app-initial"
                    ? `
                      export const $en = "routeScope";
                      export const itn = () => globalThis.__workspaceFileMenuTest.initializers.push("files");
                      export const Yut = () => globalThis.__workspaceFileMenuTest.initializers.push("items");
                      export const Jut = async (scope, options) => { globalThis.__workspaceFileMenuTest.requested = { scope, options }; return [{ id: "copy" }]; };
                      export const Kut = () => globalThis.__workspaceFileMenuTest.initializers.push("tabs");
                      export const Gut = () => ["items"];
                      export const qut = () => "prefetched";
                    `
                    : "export const sideEffect = true;",
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
  );
}

const trigger = await bundle("workspace-file-context-menu-trigger");
assert.deepEqual(state.initializers, ["runtime", "signals", "menu", "files", "items"]);
const child = { type: "button", props: {} };
const rendered = trigger.t({ children: child, hostId: "local", path: "/tmp/a.ts" });
assert.equal(rendered.type, "ContextMenu");
assert.equal(rendered.props.children, child);
assert.deepEqual(await rendered.props.getItems(), [{ id: "copy" }]);
assert.deepEqual(state.requested, {
  scope: state.scope,
  options: { hostId: "local", path: "/tmp/a.ts" },
});

state.initializers = [];
const tabMenu = await bundle("workspace-file-tab-context-menu");
assert.deepEqual(state.initializers, ["tabs"]);
assert.deepEqual(tabMenu.getWorkspaceFileTabContextMenuItems(), ["items"]);
assert.equal(tabMenu.prefetchWorkspaceFileTabContextMenuItems(), "prefetched");

console.log("8 workspace file context menu assertions passed");
