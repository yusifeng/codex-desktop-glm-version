import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = (globalThis.__openAppgenShareDialogTest = {
  analytics: [],
  init: [],
  opened: [],
  preload: null,
  throwAnalytics: false,
});

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/open-appgen-share-dialog/index.ts"),
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
              {
                "app-shared": `
                  export const EF = "analytics-client";
                  export const TF = { CODEX_SITES_SHARING_ACTION_OPENED: "sites-share-opened" };
                  export const V3 = async (loader, dependencies, url) => { globalThis.__openAppgenShareDialogTest.preload = { dependencies, url }; return loader(); };
                  export const fI = () => globalThis.__openAppgenShareDialogTest.init.push("fI");
                  export const H3 = () => globalThis.__openAppgenShareDialogTest.init.push("H3");
                `,
                "app-initial": `
                  export const xpn = (...args) => { if (globalThis.__openAppgenShareDialogTest.throwAnalytics) throw Error("analytics unavailable"); globalThis.__openAppgenShareDialogTest.analytics.push(args); };
                  export const Uzt = (...args) => globalThis.__openAppgenShareDialogTest.opened.push(args);
                  export const Vzt = () => globalThis.__openAppgenShareDialogTest.init.push("Vzt");
                  export const ypn = () => globalThis.__openAppgenShareDialogTest.init.push("ypn");
                `,
                "appgen-share-dialog": `export const AppgenShareDialog = "AppgenShareDialog";`,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const opener = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
opener.t();
check(
  state.init.join(",") === "fI,Vzt,ypn,H3",
  "initializes sharing dependencies in release order",
);

const scope = { id: "scope" };
opener.n(scope, "project-1", { source: "toolbar", invitationId: "invite-1" });
await new Promise((resolve) => setImmediate(resolve));
check(
  state.preload.dependencies.length === 12 &&
    state.preload.dependencies.includes(
      "./permission-dropdown-faa59c51006d.js",
    ),
  "preloads the full sharing dialog dependency graph",
);
check(state.analytics.length === 1, "records the dialog-open analytics event");
check(
  state.analytics[0][0] === scope &&
    state.analytics[0][1] === "analytics-client" &&
    state.analytics[0][2].action === "sites-share-opened",
  "uses the Sites sharing analytics contract",
);
check(
  state.analytics[0][2].projectId === "project-1" &&
    state.analytics[0][2].source === "toolbar",
  "records project and source context",
);
check(
  state.opened[0][0] === scope && state.opened[0][1] === "AppgenShareDialog",
  "opens the lazily loaded dialog in the current scope",
);
check(
  state.opened[0][2].projectId === "project-1" &&
    state.opened[0][2].invitationId === "invite-1",
  "forwards project id and caller options",
);

state.throwAnalytics = true;
opener.n(scope, "project-2", { source: "menu" });
await new Promise((resolve) => setImmediate(resolve));
check(
  state.opened.length === 2 && state.opened[1][2].projectId === "project-2",
  "still opens the dialog if analytics throws",
);

console.log(`${assertions} open Appgen share dialog assertions passed`);
