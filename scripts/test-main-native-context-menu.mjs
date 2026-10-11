import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "native-context-menu-"));
const output = path.join(tempDir, "native-context-menu.cjs");
await esbuild.build({ entryPoints: [path.join(root, "src/main/main-app/window/native-context-menu.ts")], outfile: output, bundle: true, format: "cjs", platform: "node", target: "esnext", logLevel: "silent" });
const { decodeFileUrl, installNativeContextMenu } = createRequire(import.meta.url)(output);

assert.equal(decodeFileUrl("file:///tmp/a%20b.png"), "/tmp/a b.png");
assert.equal(decodeFileUrl("https://example.test/a.png"), null);

const events = [];
const mainFrame = { id: "main" };
const window = {
  webContents: { mainFrame },
  listeners: new Map(),
  on(event, listener) { this.listeners.set(event, listener); },
};
let menuOptions;
let menuDisposeCount = 0;
const copy = { id: "copy", click: (...args) => events.push(["copy-default", args]) };
const save = { id: "save", click: (...args) => events.push(["save-default", args]) };
const menu = {
  cut: () => ({}), copy: () => ({}), paste: () => ({}),
  copyImage: () => copy,
  saveImageAs: () => save,
};
const dispose = installNativeContextMenu({
  window,
  createContextMenu: (options) => { menuOptions = options; return () => { menuDisposeCount += 1; }; },
  revealLabel: "Reveal",
  showItemInFolder: (value) => events.push(["reveal", value]),
  sendVisualContentAction: (action) => events.push(["action", action]),
  allowInspectElement: true,
});
assert.equal(menuOptions.showCopyImage, false);
assert.equal(menuOptions.showInspectElement, true);
const nonImage = menuOptions.prepend(menu, { mediaType: "none" });
assert.deepEqual(nonImage, []);
const imageItems = menuOptions.prepend(menu, { mediaType: "image", srcURL: "file:///tmp/photo.png", frame: mainFrame });
assert.equal(imageItems.length, 3);
assert.equal(imageItems[0].label, "Reveal");
imageItems[0].click();
imageItems[1].click("a");
imageItems[2].click("b");
assert.deepEqual(events, [["reveal", "/tmp/photo.png"], ["copy-default", ["a"]], ["action", "copy-image"], ["save-default", ["b"]], ["action", "save-image"]]);
const childItems = menuOptions.prepend(menu, { mediaType: "image", srcURL: "file:///tmp/photo.png", frame: { id: "child" } });
assert.equal(childItems.length, 2);
window.listeners.get("closed")();
dispose();
assert.equal(menuDisposeCount, 1);
console.log("test-main-native-context-menu: 10 assertions passed");
