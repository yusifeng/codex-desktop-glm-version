import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "src/renderer/app-primary/runtime/panel-target-policy.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const result = await esbuild.build({
  entryPoints: [sourcePath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});
const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
const isBrowserTab = (tab) => tab?.type === "browser";
const tabs = {
  bottom: { type: "browser", id: "bottom" },
  right: { type: "browser", id: "right" },
};
let assertions = 0;
const equal = (actual, expected) => {
  assertions += 1;
  assert.equal(actual, expected);
};

equal(/\bany\b/.test(source), false);
equal(module.getFallbackPanelTarget("bottom-panel", tabs, isBrowserTab), "bottom");
equal(module.getFallbackPanelTarget("right-panel", tabs, isBrowserTab), "right");
equal(module.getFallbackPanelTarget("unknown", tabs, isBrowserTab), "right");
equal(module.getFallbackPanelTarget("right-panel", { bottom: tabs.bottom, right: null }, isBrowserTab), "bottom");
equal(module.getFallbackPanelTarget("unknown", { bottom: null, right: null }, isBrowserTab), null);
equal(module.getPreferredPanelTarget("unknown", tabs, { bottom: false, right: true }, isBrowserTab), "right");
equal(module.getPreferredPanelTarget("unknown", tabs, { bottom: true, right: false }, isBrowserTab), "bottom");
equal(module.getPreferredPanelTarget("unknown", tabs, { bottom: false, right: false }, isBrowserTab), null);
console.log(`renderer panel target policy tests passed (${assertions} assertions)`);
