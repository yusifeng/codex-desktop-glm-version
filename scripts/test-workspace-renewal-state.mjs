import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__renewalStateTest = { queryConfig: null };
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/workspace-renewal-state/index.ts"),
  ],
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
              importPath === "app-shared"
                ? `
                  export const FX = () => {}; export const QI = () => {}; export const ek = () => {};
                  export const ZI = Symbol("scope"); export const $O = { ONE_MINUTE: 60000 };
                  export const QX = (_scope, build) => { globalThis.__renewalStateTest.queryConfig = build; return "query"; };
                `
                : importPath === "app-initial"
                  ? `export const pdn = () => {}; export const udn = { safeGet: (...args) => args };`
                  : "export {};",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const state = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
const start = Date.parse("2027-01-01T00:00:00Z");
const subscription = {
  is_delinquent: true,
  will_renew: true,
  became_delinquent_timestamp: new Date(start).toISOString(),
  grace_period_end_timestamp: new Date(start + 7 * 86400000).toISOString(),
};
assert.equal(state.t(subscription, new Date(start + 86400000)), null);
assert.equal(
  state.t(subscription, new Date(start + 3 * 86400000)),
  subscription.grace_period_end_timestamp,
);
assert.equal(state.t(subscription, new Date(start + 8 * 86400000)), null);
assert.equal(
  state.t(
    { ...subscription, will_renew: false },
    new Date(start + 3 * 86400000),
  ),
  null,
);
const disabled = globalThis.__renewalStateTest.queryConfig(null);
assert.equal(disabled.enabled, false);
const enabled = globalThis.__renewalStateTest.queryConfig("workspace-1");
assert.equal(enabled.enabled, true);
assert.deepEqual(enabled.queryKey, [
  "workspace-renewal-subscription",
  "workspace-1",
]);
assert.equal(enabled.refetchInterval, 60000);
console.log("8 workspace renewal state assertions passed");
