#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { mergeTargetPlatformDescriptor, createTargetDescriptor, createEditorTargetDescriptor } = require(
  "../app/.vite/build/main-app/open-target/target-descriptor-policy.js",
);

const merged = mergeTargetPlatformDescriptor({
  label: "Editor",
  icon: "apps/editor.png",
  kind: "editor",
  platform: { label: "Custom", hidden: true, detect: () => "editor" },
});
assert.equal(merged.label, "Custom");
assert.equal(merged.icon, "apps/editor.png");
assert.equal(merged.kind, "editor");
assert.equal(merged.hidden, true);
assert.equal(typeof merged.detect, "function");
assert.equal(merged.args, undefined);

const target = createTargetDescriptor({
  id: "editor",
  label: "Editor",
  icon: "apps/editor.png",
  kind: "editor",
  hidden: false,
  darwin: { args: (path) => [path] },
  win32: { label: "Windows Editor", open: () => undefined },
});
assert.equal(target.id, "editor");
assert.equal(target.platforms.darwin?.label, "Editor");
assert.equal(target.platforms.darwin?.hidden, false);
assert.deepEqual(target.platforms.darwin?.args("/tmp/file"), ["/tmp/file"]);
assert.equal(target.platforms.win32?.label, "Windows Editor");
assert.equal(target.platforms.linux, undefined);

const fallback = createTargetDescriptor({ id: "terminal", label: "Terminal", icon: "terminal", kind: "terminal" });
assert.deepEqual(fallback, {
  id: "terminal",
  platforms: { darwin: undefined, win32: undefined, linux: undefined },
});

const defaultArgs = (path) => ["--file", path];
const linuxOpen = () => "opened";
const editor = createEditorTargetDescriptor({
  id: "code",
  label: "Code",
  icon: "apps/code.png",
  darwinDetect: () => "/usr/bin/open",
  linuxDetect: () => "/usr/bin/code",
  darwinEnv: { CODE_ENV: "1" },
  defaultArgs,
  linuxOpen,
});
assert.equal(editor.id, "code");
assert.equal(editor.platforms.darwin?.kind, "editor");
assert.deepEqual(editor.platforms.darwin?.env, { CODE_ENV: "1" });
assert.equal(editor.platforms.darwin?.args, defaultArgs);
assert.equal(editor.platforms.darwin?.supportsSsh, true);
assert.equal(editor.platforms.win32, undefined);
assert.equal(editor.platforms.linux?.detect instanceof Function, true);
assert.equal(editor.platforms.linux?.args, defaultArgs);
assert.equal(editor.platforms.linux?.open, linuxOpen);

console.log("15 main target descriptor policy assertions passed");
