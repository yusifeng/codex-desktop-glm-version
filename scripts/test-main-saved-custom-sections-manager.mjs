import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const ownerText = fs.readFileSync(new URL("../src/main/main-app/sidebar/saved-custom-sections-manager.ts", import.meta.url), "utf8");
const ownerRuntime = await transform(ownerText, { loader: "ts", format: "cjs", target: "es2022" });
const ownerModule = { exports: {} };
Function("module", "exports", ownerRuntime.code)(ownerModule, ownerModule.exports);
const { createSavedCustomSectionsManagerClass } = ownerModule.exports;

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
class DisposableBase {}
class Reconciliation {}
class UndoRedo {}
const Manager = createSavedCustomSectionsManagerClass({
  G: { default: () => true }, Hb: "saved", Ub: { safeParse: () => ({ success: false }) },
  Wb: (value) => value, _H: (state) => state, a: { J: "atoms" }, aBe: () => true,
  n: { Uf: DisposableBase }, rBe: Reconciliation, yH: UndoRedo,
});
const args = [{}, {}, {}, {}, {}, async () => {}];
const manager = new Manager(...args);
equal(manager instanceof DisposableBase, true);
equal(typeof manager.applySavedCustomSectionCommand, "function");
equal(typeof manager.beginSavedCustomSectionReconciliation, "function");
equal(typeof manager.beginSavedCustomSectionMigration, "function");
equal(typeof manager.importLegacySavedCustomSections, "function");
const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("iBe = createSavedCustomSectionsManagerClass({"), true);
equal(main.includes("iBe = class"), false);
equal(main.includes("SavedCustomSectionsManager: iBe"), true);
console.log(`${assertions} main saved custom sections manager assertions passed`);
