import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(root, "src/main/shared/command-registry-policy.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});
const policy = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);

assert.equal(policy.isMouseAccelerator("MouseBack"), true);
assert.equal(policy.isMouseAccelerator("CmdOrCtrl+R"), false);
assert.equal(policy.commandsConflict("closeTab", "closeWindow"), true);
assert.equal(policy.commandsConflict("closeTab", "newTask"), false);
assert.equal(policy.normalizeAccelerator("CmdOrCtrl+Shift+R", true), "meta+r+shift");
assert.equal(policy.normalizeAccelerator("Control+Option+P", true), "alt+ctrl+p");
assert.equal(policy.isModifiedEnter("CmdOrCtrl+Enter", true), true);
assert.equal(policy.isModifiedEnter("Ctrl+Enter", true), false);
assert.equal(policy.isModifiedEnter("Control+Enter", false), true);

console.log("9 worker command-registry policy assertions passed");
