import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__lightweightPagesTest = {
  access: false,
  auth: { authMethod: "codex", isLoading: false },
  location: { search: "", hash: "", state: null },
  navigated: null,
  params: {},
  searchParams: new URLSearchParams(),
  jsx: {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
  },
});
globalThis.window = { location: { origin: "https://chatgpt.com" } };

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
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
                    export const $3 = () => {};
                    export const I3 = () => globalThis.__lightweightPagesTest.jsx;
                    export const h4 = () => {};
                    export const m4 = (...values) => values.filter(Boolean).join(" ");
                  `
                  : importPath === "app-initial"
                    ? `
                      export const C4 = () => {}; export const Qgn = () => {}; export const M6t = () => {};
                      export const E4 = () => globalThis.__lightweightPagesTest.access;
                      export const Ygn = "Navigate";
                      export const Fx = value => new URL(value, "https://chatgpt.com").toString();
                      export const Ix = () => {};
                      export const d_n = () => [globalThis.__lightweightPagesTest.searchParams];
                      export const N6t = () => globalThis.__lightweightPagesTest.auth;
                      export const i_n = () => globalThis.__lightweightPagesTest.location;
                      export const l_n = () => globalThis.__lightweightPagesTest.params;
                      export const o_n = () => value => { globalThis.__lightweightPagesTest.navigated = value; };
                    `
                    : importPath === "scheduled-shared-task-dialog-core"
                      ? `export const n = () => {}; export const t = "ScheduledSharedTaskDialog";`
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

const remote = await bundle("remote-connections-page");
assert.equal(remote.RemoteConnectionsPage().props.to, "/");
state.access = true;
assert.equal(remote.RemoteConnectionsPage().props.to, "/settings/connections");

const detail = await bundle("detail-page");
detail.r();
const detailNode = detail.n({ children: "content" });
assert.equal(detailNode.props.children, "content");
assert.match(detailNode.props.className, /detail-page-section-gap/);
assert.equal(detail.t, "flex flex-col gap-[var(--detail-page-section-gap)]");

state.searchParams = new URLSearchParams({
  toUrl: encodeURIComponent("/settings/connections?tab=apps#linked"),
});
const load = await bundle("browser-load-page");
const loadNode = load.BrowserLoadPageWithAuth();
assert.equal(loadNode.type, "Navigate");
assert.equal(loadNode.props.to, "/settings/connections?tab=apps#linked");

const grid = await bundle("skills-page-grid");
grid.r();
assert.equal(grid.t({ children: "items", className: "outer" }).props.className, "outer @container/skills-grid");
assert.match(grid.n({ children: "items", gap: "catalog" }).props.className, /gap-x-6 gap-y-2/);
assert.doesNotMatch(grid.n({ isSingleColumn: true }).props.className, /grid-cols-2/);

const shared = await bundle("scheduled-shared-task-route");
state.auth = { authMethod: "codex", isLoading: true };
assert.equal(shared.ScheduledSharedTaskRoute(), null);
state.auth = { authMethod: "codex", isLoading: false };
state.params = {};
assert.equal(shared.ScheduledSharedTaskRoute().props.to, "/");
state.params = { postId: "post-1" };
state.auth = { authMethod: "chatgpt", isLoading: false };
state.location = { search: "?keep=1", hash: "#section", state: { from: "share" } };
const scheduledRedirect = shared.ScheduledSharedTaskRoute();
assert.equal(scheduledRedirect.props.to.pathname, "/scheduled");
assert.equal(scheduledRedirect.props.to.search, "?keep=1&shared_task=post-1");
assert.equal(scheduledRedirect.props.to.hash, "#section");
assert.deepEqual(scheduledRedirect.props.state, { from: "share" });
state.auth = { authMethod: "codex", isLoading: false };
const dialog = shared.ScheduledSharedTaskRoute();
assert.equal(dialog.type, "ScheduledSharedTaskDialog");
assert.equal(dialog.props.postId, "post-1");
dialog.props.onClose();
assert.equal(state.navigated, "/");

console.log("20 lightweight page cluster assertions passed");
