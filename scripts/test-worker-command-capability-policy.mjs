import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(root, "src/main/shared/command-capability-policy.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});
const policy = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);

const local = { id: "local", kind: "webview", requiredAccess: "codexLocal" };
const work = { id: "work", kind: "webview", requiredAccess: "codexOrWorkLocal" };
const open = { id: "open", kind: "webview" };
const vscode = { id: "vscode", kind: "vscode-only", vscodeCommand: { title: "VS Code" } };
const mouse = { id: "mouse", kind: "webview", electron: { defaultKeybindings: [{ key: "MouseBack" }] } };

assert.equal(policy.commandAvailableForAccess(local, { codexLocal: true, workLocal: false }), true);
assert.equal(policy.commandAvailableForAccess(local, { codexLocal: false, workLocal: true }), false);
assert.equal(policy.commandAvailableForAccess(work, { codexLocal: false, workLocal: true }), true);
assert.equal(policy.commandAvailableForAccess(open, { codexLocal: false, workLocal: false }), true);
assert.equal(policy.isShortcutConfigurable(vscode), false);
assert.equal(policy.isShortcutConfigurable(mouse), false);
assert.equal(policy.isShortcutConfigurable(open), true);

console.log("7 worker command capability policy assertions passed");
