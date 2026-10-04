import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "src/renderer/app-primary/runtime/normalize-suggested-followups.ts");
const source = fs.readFileSync(sourcePath, "utf8");
assert.equal(/\bany\b/.test(source), false);
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
let assertions = 1;
assert.deepEqual(module.normalizeSuggestedFollowups({ suggested_followups: [{ prompt: "  Explain this  ", title: " Explain " }, null, { prompt: "" }, { prompt: "Third" }, { prompt: "Fourth" }, { prompt: "Fifth" }] }), [
  { prompt: "Explain this", sourceIndex: 0, title: "Explain" },
  { prompt: "Third", sourceIndex: 3, title: "Third" },
  { prompt: "Fourth", sourceIndex: 4, title: "Fourth" },
]); assertions++;
assert.deepEqual(module.normalizeSuggestedFollowups({ suggested_followups: "invalid" }), []); assertions++;
assert.deepEqual(module.normalizeSuggestedFollowups(null), []); assertions++;
console.log(`app-primary normalize suggested followups: ${assertions} assertions passed`);
