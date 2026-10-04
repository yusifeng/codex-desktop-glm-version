#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "src/renderer/tweaks-toolbar-view/index.ts"), "utf8");
assert.match(source, /import \{ isElement \} from "\.\.\/app-primary\/runtime\/is-element"/);
assert.doesNotMatch(source, /\bJc\s+as\s+isElement\b/);
const output = path.join(root, ".tmp-test-app-primary-is-element.mjs");
await build({
  entryPoints: [path.join(root, "src/renderer/app-primary/runtime/is-element.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: output,
});
const { isElement } = await import(`${output}?test=${Date.now()}`);
assert.equal(isElement(null), false);
assert.equal(isElement({}), false);
const document = { defaultView: { Node: { ELEMENT_NODE: 1 } } };
assert.equal(isElement({ nodeType: 1, ownerDocument: document, getBoundingClientRect() {}, tagName: "DIV" }), true);
assert.equal(isElement({ nodeType: 3, ownerDocument: document, getBoundingClientRect() {}, tagName: "#text" }), false);
console.log("4 app-primary isElement assertions passed");
