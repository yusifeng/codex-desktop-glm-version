import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const ownerText = fs.readFileSync(new URL("../src/main/main-app/sidebar/saved-section-undo-redo-stack.ts", import.meta.url), "utf8");
const ownerRuntime = await transform(ownerText, { loader: "ts", format: "cjs", target: "es2022" });
const ownerModule = { exports: {} };
Function("module", "exports", ownerRuntime.code)(ownerModule, ownerModule.exports);
const { createSavedSectionUndoRedoStackClass } = ownerModule.exports;

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
class DisposableBase {}
const Stack = createSavedSectionUndoRedoStackClass({
  CH: (state) => ({ sections: state.sections }),
  G: () => true,
  SH: () => ({}),
  _H: () => ({}),
  bH: () => ({ sections: [], collections: [], structure: false }),
  n: { Uf: DisposableBase },
  tBe: () => ({}),
  wH: () => ({}),
  xH: () => ({ snapshot: true }),
});
const source = {};
const before = { sections: [], threadHostIds: {} };
const after = { sections: [], threadHostIds: {} };
const stack = new Stack(source, before, after, null, null);
equal(stack instanceof DisposableBase, true);
equal(Stack.affectedState(stack), { affectedBefore: { sections: [] }, affectedAfter: { sections: [] } });
const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
const manager = fs.readFileSync(new URL("../src/main/main-app/sidebar/saved-custom-sections-manager.ts", import.meta.url), "utf8");
equal(main.includes("yH = createSavedSectionUndoRedoStackClass({"), true);
equal(main.includes("var yH = class"), false);
equal(manager.includes("new yH("), true);
console.log(`${assertions} main saved-section undo-redo stack assertions passed`);
