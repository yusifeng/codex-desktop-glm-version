import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = "/Users/david/Workspace/ppio_github/chatgpt-desktop-src/app/webview/assets";
const preserved = [
  ["action-1e2563405a5e.js", "virtual-try-on-product-action"], ["add-method-afab5885229a.js", "add-payment-method-dialog"],
  ["delinquent-upgrade-preparation-846faddf31c3.js", "delinquent-upgrade-preparation"], ["details-a0d511b36499.js", "skill-details"],
  ["details-cache-1e493bfd7846.js", "product-details-prefetch"], ["draft-state-252f268b22b4.js", "business-agent-draft-state"],
  ["editable-plan-tab-8cd53c10d41a.js", "editable-plan-tab-open"], ["export-22cc6e2352c3.js", "image-markup-export"],
  ["middleware-75f9c3c91f3c.js", "destination-middleware"], ["open-1b0a301cf0a9.js", "image-preview-open"],
  ["open-b6f75ec82551.js", "review-link-open"], ["open-chatgpt-file-24878c96465f.js", "chatgpt-file-open"],
  ["open-tab-16d5f147da46.js", "browser-thread-panel-tab-open"], ["persona-f7ec1fc1014b.js", "age-verification-start"],
  ["pet-install-state-6816a4423a9e.js", "pet-install-state"], ["plaid-link-987be8700124.js", "personal-finance-plaid-link"],
  ["quick-chat-state-17d2fafb85f9.js", "quick-chat-entity-open"], ["quick-chat-window-e97b2c4526e4.js", "quick-chat-window"],
  ["submit-feedback-8cb673d3211e.js", "codex-feedback-submit"], ["tab-558b44c65ee3.js", "image-preview-tab-open"],
  ["tab-identity-b378dc7c1330.js", "thread-browser-tab-identity"], ["thumbnail-1390eeb9998f.js", "create-text-file-thumbnail"],
  ["trusted-contact-actions-6d04a3870e90.js", "trusted-contact-beacon-action"],
];
const rewritten = [
  ["dsp-d76b3132336b.js", "voice-dsp-state", ["a", "i", "n", "r", "t"]],
  ["gracefulDecodeURIComponent-c5c02606df15.js", "graceful-uri-decoder", ["n", "t"]],
];
let sourceAssertions = 0;
for (const [asset, semantic] of preserved) {
  const source = fs.readFileSync(path.join(ASSETS, asset), "utf8");
  assert.ok(source.length <= 400, semantic + " must remain a thin bridge");
  assert.match(source, /^import /);
  assert.match(source, /export \{/);
  assert.equal(/import\("/.test(source), false);
  assert.equal(/async function|class\s|=>\s*\{/.test(source), false);
  sourceAssertions += 5;
}
const depNames = source => [...source.matchAll(/(?:from\s+|import\s*)"(?:\.\/|@rchunk\/)([^"/]+?)(?:-[a-f0-9]{12}\.js)?"/g)].map(match => match[1]);
for (const [asset, semantic, expectedExports] of rewritten) {
  const original = fs.readFileSync(path.join(ASSETS, asset), "utf8");
  const restored = fs.readFileSync(path.join(ROOT, "src/renderer", semantic, "index.ts"), "utf8");
  assert.deepEqual(depNames(restored), depNames(original));
  assert.equal(/\bany\b|@ts-expect-error|@ts-nocheck/.test(restored), false);
  assert.ok(expectedExports.every(name => new RegExp("\\bas " + name + "(?:\\s|,| })").test(restored) || new RegExp("export \\{[^}]*\\b" + name + "\\b").test(restored)));
  sourceAssertions += 3;
}
assert.equal(preserved.length + rewritten.length, 25);
sourceAssertions++;

globalThis.__hub = { atoms: [] };
function mock(name) {
  if (name === "@rchunk/app-shared") return "export const FX=()=>{};export const QI=()=>{};export const ZI={};export const pZ=(store,factory)=>{const atom={value:factory(),get(){return this.value},set(value){this.value=value}};globalThis.__hub.atoms.push(atom);return atom};";
  return "export const n=()=>{};";
}
async function bundle(semantic) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", semantic, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mock", setup(build) { build.onResolve({ filter: /^@rchunk\// }, args => ({ path: args.path, namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, args => ({ contents: mock(args.path), loader: "js" })); } }] });
  return import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64") + "#" + semantic);
}
let runtimeAssertions = 0;
const decoder = await bundle("graceful-uri-decoder");
assert.deepEqual(Object.keys(decoder).sort(), ["n", "t"]); assert.equal(decoder.t("hello+world%21"), "hello world!"); assert.equal(decoder.t("bad%ZZ"), "bad%ZZ"); runtimeAssertions += 3;
const dsp = await bundle("voice-dsp-state");
assert.deepEqual(Object.keys(dsp).sort(), ["a", "i", "n", "r", "t"]); assert.equal(globalThis.__hub.atoms.length, 5); dsp.t.set("mic-1"); assert.equal(dsp.t.get(), "mic-1"); dsp.i(); assert.equal(globalThis.__hub.atoms.length, 5); runtimeAssertions += 5;
delete globalThis.__hub;
console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
