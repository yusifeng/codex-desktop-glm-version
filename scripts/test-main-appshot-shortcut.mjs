#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import * as esbuild from "esbuild";

const source = await fs.readFile("src/main/main-app/hotkey/appshot-shortcut.ts", "utf8");
const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" });
const module = { exports: {} };
vm.runInNewContext(code, { module, exports: module.exports });
const shortcut = module.exports;

for (const value of ["DoubleAlt", "double-alt", " double_alt ", "LEFTALT+RIGHTALT", "DoubleShift", "left_shift+right_shift"]) {
  assert.equal(shortcut.isDoubleModifierShortcut(value), true, value);
}
for (const value of ["Alt", "DoubleCtrl", "LeftAlt+LeftAlt", "LeftShift+RightAlt", "", "DoubleAlt+Extra"]) {
  assert.equal(shortcut.isDoubleModifierShortcut(value), false, value);
}

const manager = await fs.readFile(
  "src/main/main-app/hotkey/appshot-hotkey-manager.ts",
  "utf8",
);
assert.match(manager, /import \{ isDoubleModifierShortcut \} from "\.\/appshot-shortcut"/);
assert.match(manager, /isDoubleModifierShortcut\(this\.configuredHotkey\)/);
console.log("12 appshot shortcut assertions passed");
