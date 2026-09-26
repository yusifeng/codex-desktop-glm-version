import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__legacyHomeEntryTest = { initialized: 0 };
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/codex-home-announcements-entry/index.ts"),
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
              importPath === "codex-home-announcements"
                ? `
                  export const n = "HomeComposerAnnouncements";
                  export const r = () => { globalThis.__legacyHomeEntryTest.initialized += 1; };
                `
                : importPath === "home-announcement-state"
                  ? "export const t = () => {};"
                  : "export {};",
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

assert.equal(entry.HomeComposerAnnouncements, "HomeComposerAnnouncements");
assert.equal(globalThis.__legacyHomeEntryTest.initialized, 1);
console.log("2 legacy Home announcement entry assertions passed");
