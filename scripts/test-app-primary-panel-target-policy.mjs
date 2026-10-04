#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, ".tmp-test-app-primary-panel-target-policy.mjs");
await build({
  entryPoints: [path.join(root, "src/renderer/app-primary/runtime/panel-target-policy.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: output,
});
const { getFallbackPanelTarget, getPreferredPanelTarget } = await import(`${output}?test=${Date.now()}`);
const isTab = (tab) => tab?.kind === "browser";
assert.equal(getFallbackPanelTarget("bottom-panel", { bottom: { kind: "browser" }, right: { kind: "browser" } }, isTab), "bottom");
assert.equal(getFallbackPanelTarget("right-panel", { bottom: { kind: "browser" }, right: { kind: "browser" } }, isTab), "right");
assert.equal(getFallbackPanelTarget("bottom-panel", { bottom: null, right: { kind: "browser" } }, isTab), "right");
assert.equal(getPreferredPanelTarget("right-panel", { bottom: { kind: "browser" }, right: { kind: "browser" } }, { bottom: true, right: false }, isTab), "bottom");
assert.equal(getPreferredPanelTarget("right-panel", { bottom: { kind: "browser" }, right: { kind: "browser" } }, { bottom: false, right: false }, isTab), null);
console.log("5 app-primary panel target policy assertions passed");
