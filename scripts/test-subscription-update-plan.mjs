import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__subscriptionPlanInit = 0;

const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/subscription-update-plan/index.ts"),
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
          path: importPath,
          namespace: "mock",
        }));
        build.onLoad(
          { filter: /.*/, namespace: "mock" },
          ({ path: importPath }) => ({
            contents:
              importPath === "@rchunk/app-initial"
                ? `
                export const Pdn = { GO: "go", PLUS: "plus", PROLITE: "prolite", PRO: "pro" };
                export const Rln = () => { globalThis.__subscriptionPlanInit += 1; };
              `
                : "export const n = value => value;",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const plans = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

assert.deepEqual(Object.keys(plans).sort(), ["n", "r", "t"]);
assert.equal(globalThis.__subscriptionPlanInit, 1);
for (const [plan, slug] of [
  ["go", "chatgptgoplan"],
  ["plus", "chatgptplusplan"],
  ["prolite", "chatgptprolite"],
  ["pro", "chatgptpro"],
]) {
  assert.equal(plans.t(plan), slug);
  assert.equal(plans.n(slug), plan);
}
assert.equal(plans.t("team"), undefined);
assert.equal(plans.n("chatgptteamplan"), undefined);
plans.r();
assert.equal(globalThis.__subscriptionPlanInit, 2);

console.log("13 subscription update plan assertions passed");
