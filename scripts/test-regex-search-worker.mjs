import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/regex-search-worker/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
assert.doesNotMatch(source, /\bany\b/u);
assert.doesNotMatch(source, /@rchunk\//u);

const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "browser", target: "esnext", write: false, logLevel: "silent" });
const messages = [];
globalThis.self = { onmessage: null, postMessage(message) { messages.push(message); } };
await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
const search = (data) => { messages.length = 0; globalThis.self.onmessage({ data }); return messages[0]; };

assert.deepEqual(search({ texts: ["Alpha beta ALPHA"], query: "alpha", maxMatches: 10 }), { offsets: [[{ start: 0, end: 5 }, { start: 11, end: 16 }]], totalMatches: 2 });
assert.deepEqual(search({ texts: ["one one", "one"], query: "one", maxMatches: 2 }), { offsets: [[{ start: 0, end: 3 }, { start: 4, end: 7 }], []], totalMatches: 3 });
assert.deepEqual(search({ texts: ["abc"], query: "[", maxMatches: 5 }), { offsets: [], totalMatches: 0, error: "invalid-regex" });
assert.deepEqual(search({ texts: ["aaa"], query: "(?=a)", maxMatches: 5 }), { offsets: [[]], totalMatches: 0 });
assert.deepEqual(search({ texts: ["x \\frac{a}{b} y"], query: "a", maxMatches: 5, mathTexts: [true] }), { offsets: [[{ start: 2, end: 13 }]], totalMatches: 1 });
assert.deepEqual(search({ texts: ["x \\sqrt[3]{abc} y"], query: "sqrt", maxMatches: 5, mathTexts: [true] }), { offsets: [[{ start: 2, end: 15 }]], totalMatches: 1 });
assert.deepEqual(search({ texts: ["{alpha beta}"], query: "\\{alpha", maxMatches: 5, mathTexts: [true] }), { offsets: [[{ start: 0, end: 12 }]], totalMatches: 1 });
assert.deepEqual(search({ texts: ["\\text{ab}\\text{cd}"], query: "text", maxMatches: 5, mathTexts: [true] }), { offsets: [[{ start: 0, end: 9 }, { start: 9, end: 18 }]], totalMatches: 2 });

console.log("regex-search-worker tests passed (10 assertions)");
