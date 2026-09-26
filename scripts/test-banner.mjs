import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__bannerTest = {
  enabled: true,
  kept: null,
  navigated: null,
  jsx: { jsx: (type, props, key) => ({ type, props, key }) },
};
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/banner/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "mock-chunks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: importPath }) => ({
            contents:
              {
                "app-shared": `
                  export const I3 = () => globalThis.__bannerTest.jsx;
                  export const ZI = Symbol("scope"); export const LX = () => ({});
                  export const BX = (source) => source === "experiment" ? globalThis.__bannerTest.enabled : source === "query" ? { data: { gizmo: { migrated_plugin_id: "plugin", display: { name: "My GPT" } } } } : true;
                  export const $3 = () => {}; export const FX = () => {}; export const QI = () => {};
                `,
                "app-initial": `
                  export const mfn = "experiment"; export const fN = "query";
                  export const i_n = () => ({ pathname: "/g/gizmo" });
                  export const o_n = () => path => { globalThis.__bannerTest.navigated = path; };
                  export const Qgn = () => {}; export const pfn = () => {}; export const mN = () => {};
                `,
                "app-primary": `
                  export const Pp = "visit";
                  export const Mp = (_scope, value) => { globalThis.__bannerTest.kept = value; };
                  export const Lp = () => {};
                `,
                "chat-choice-view": `export const n = () => {}; export const t = "ChoiceView";`,
                "gpt-plugin-migration-banner-content": `export const GptPluginMigrationBannerContent = "MigrationContent";`,
              }[importPath] ?? "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const banner = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
const visible = banner.t({ gizmoId: "gizmo-1" });
assert.equal(visible.type, "MigrationContent");
assert.equal(visible.props.gizmoId, "gizmo-1");
assert.equal(visible.key, "gizmo-1");
globalThis.__bannerTest.enabled = false;
assert.equal(banner.t({ gizmoId: "gizmo-1" }), null);
console.log("4 GPT plugin migration banner assertions passed");
