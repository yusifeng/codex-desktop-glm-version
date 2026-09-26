import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/gpt-management-url/index.ts")],
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
        build.onResolve({ filter: /^@rchunk\// }, ({ path }) => ({
          path,
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
          contents: "export {};",
          loader: "js",
        }));
      },
    },
  ],
});
const url = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);
assert.equal(
  url.t("/gpts/editor/gizmo-1"),
  "https://chatgpt.com/gpts/editor/gizmo-1",
);
assert.equal(url.t("https://example.com/gpt"), "https://example.com/gpt");
console.log("2 GPT management URL assertions passed");
