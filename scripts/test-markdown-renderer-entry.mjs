import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "src/renderer/markdown-renderer-entry/index.ts");
const source = fs.readFileSync(SOURCE, "utf8");

assert.deepEqual(
  [...new Set([...source.matchAll(/@rchunk\/([^\"]+)/g)].map((match) => match[1]))],
  ["app-initial"],
);
assert.deepEqual([...source.matchAll(/import\("@rchunk\/([^\"]+)"\)/g)], []);
assert.equal(/\bany\b/.test(source), false);
assert.equal(/import \* as/.test(source), false);
assert.match(source, /initializeMarkdownRenderer\(\);/);

const runtime = { initializeCalls: 0 };
const Markdown = function Markdown() {};
globalThis.__markdownRendererEntry = { Markdown, runtime };

const build = await esbuild.build({
  entryPoints: [SOURCE],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "markdown-renderer-entry-mock",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\/app-initial$/ }, () => ({ path: "app-initial", namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
          contents: [
            "const state = globalThis.__markdownRendererEntry;",
            "export const BY = state.Markdown;",
            "export const LY = () => { state.runtime.initializeCalls += 1; };",
          ].join("\n"),
          loader: "js",
        }));
      },
    },
  ],
});

const module = await import(
  "data:text/javascript;base64," + Buffer.from(build.outputFiles[0].text).toString("base64")
);

assert.deepEqual(Object.keys(module), ["Markdown"]);
assert.equal(module.Markdown, Markdown);
assert.equal(runtime.initializeCalls, 1);

const count = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\./g)].length;
console.log(count + " markdown renderer entry assertions passed");
