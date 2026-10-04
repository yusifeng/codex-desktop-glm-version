import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as esbuild from "esbuild";

const source = await fs.readFile("src/main/worker/open-in-target-descriptors.ts", "utf8");
const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" });
const module = { exports: {} };
new Function("module", "exports", code)(module, module.exports);
const { mergePlatformTarget, createCrossPlatformTarget, createEditorTarget } = module.exports;

const detect = () => true;
const args = () => [];
assert.deepEqual(mergePlatformTarget({ label: "Base", icon: "base.png", kind: "terminal", platform: { detect } }), {
  label: "Base", icon: "base.png", kind: "terminal", hidden: undefined, detect,
  iconPath: undefined, args: undefined, env: undefined, open: undefined,
});
assert.equal(mergePlatformTarget({ label: "Base", icon: "base.png", kind: "terminal", platform: { label: "Override" } }).label, "Override");

const target = createCrossPlatformTarget({
  id: "terminal", label: "Terminal", icon: "terminal.png", kind: "terminal", hidden: true,
  darwin: { detect }, linux: { label: "Linux terminal", args },
});
assert.equal(target.id, "terminal");
assert.equal(target.platforms.darwin.hidden, true);
assert.equal(target.platforms.linux.label, "Linux terminal");
assert.equal(target.platforms.linux.args, args);
assert.equal(target.platforms.win32, undefined);

const opened = [];
const editor = createEditorTarget({
  id: "editor", label: "Editor", icon: "editor.png", darwinDetect: detect,
  linuxDetect: detect, defaultArgs: args, openLinux: (request, selectedArgs) => opened.push([request, selectedArgs]),
});
assert.equal(editor.platforms.darwin.kind, "editor");
assert.equal(editor.platforms.darwin.supportsSsh, true);
assert.equal(editor.platforms.darwin.args, args);
assert.equal(editor.platforms.win32, undefined);
editor.platforms.linux.open({ path: "/tmp/project" });
assert.deepEqual(opened, [[{ path: "/tmp/project" }, args]]);

console.log("worker open-in target descriptor tests passed (12 assertions)");
