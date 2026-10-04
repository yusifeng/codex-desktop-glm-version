#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { mergeTargetPlatformDescriptor, createTargetDescriptor } = require(
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

console.log("6 main target descriptor policy assertions passed");
