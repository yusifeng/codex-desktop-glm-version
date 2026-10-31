import assert from "node:assert/strict";
import fs from "node:fs";
import { createWindowContextClass } from "../src/main/main-app/window/window-context.ts";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };

let universal;
universal = new Proxy(function universalStub() {}, {
  get(_target, property) {
    if (property === "then") return undefined;
    if (property === Symbol.iterator) return function* emptyIterator() {};
    if (property === Symbol.dispose) return () => {};
    if (property === "length") return 0;
    if (property === "kind") return "chatgpt";
    if (property === "type") return "desktop";
    return universal;
  },
  apply() { return universal; },
  construct() { return universal; },
  set() { return true; },
  ownKeys() { return []; },
  getOwnPropertyDescriptor() { return { configurable: true }; },
});

const WindowContext = createWindowContextClass(universal);
equal(WindowContext.name, "WindowContext");
// The connection creation boundary performs concrete transport validation. Stub only that
// boundary so the test can exercise the complete synchronous composition constructor.
WindowContext.prototype.createAppServerConnection = () => universal;
const context = new WindowContext(universal);
equal(context.options, universal);
equal(context.scopedState, universal);
equal(context.appServerConnectionRegistry, universal);
equal(context.projectsManager, universal);
equal(context.fetchHandler, universal);
equal(context.messageHandler, universal);
equal(context.disposables, universal);
equal(context.threadProjectAssignments, universal);
equal(Object.keys(context).length > 60, true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("ert = createWindowContextClass({"), true);
equal(main.includes("ert = class"), false);
equal(main.includes("new ert({"), true);
const owner = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
equal(owner.includes("return class WindowContext"), true);
equal(owner.includes("not wired"), false);
equal(owner.split("\n").length > 2_000, true);

console.log(`${assertions} main window context owner assertions passed`);
