import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__appgenAccessEntryTest = { initialized: 0 };
const aliasMap = {
  canManageAppgenProject: "t",
  getAppgenAccessModeOptions: "n",
  getAppgenAccessState: "r",
  getAppgenAccessUpdate: "i",
  getAppgenAccessUpdateWithoutGroup: "a",
  getAppgenAccessUpdateWithoutUser: "o",
  isAppgenAccessOwnerOnly: "c",
};
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/appgen-access-entry/index.ts")],
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
              importPath === "appgen-access"
                ? `
                  export const a = "a"; export const c = "c"; export const i = "i";
                  export const n = "n"; export const o = "o"; export const r = "r"; export const t = "t";
                  export const s = () => globalThis.__appgenAccessEntryTest.initialized++;
                `
                : "export const sideEffect = true;",
            loader: "js",
          }),
        );
      },
    },
  ],
});
const entry = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

assert.equal(globalThis.__appgenAccessEntryTest.initialized, 1);
let assertions = 1;
for (const [semanticName, alias] of Object.entries(aliasMap)) {
  assert.equal(entry[semanticName], alias, semanticName);
  assertions += 1;
}
assert.deepEqual(Object.keys(entry).sort(), Object.keys(aliasMap).sort());
assertions += 1;
console.log(`${assertions} Appgen access entry assertions passed`);
