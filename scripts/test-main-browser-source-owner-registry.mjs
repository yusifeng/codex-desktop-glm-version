import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/window/browser-source-owner-registry.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const declaration = (name) => ast.body.find((node) =>
  (node.type === "ClassDeclaration" || node.type === "FunctionDeclaration") && node.id?.name === name,
);
const nodes = ["ownerKey", "DisposableRegistration", "BrowserSourceOwnerService", "BrowserSourceOwnerRegistry"].map(declaration);
assert.ok(nodes.every(Boolean)); assertions += 1;
equal(nodes[1].body.body.length, 3);
equal(nodes[2].body.body.length, 6);
equal(nodes[3].body.body.length, 14);

class EventEmitterBase {}
const window = { isDestroyed: () => false };
const BrowserWindow = { fromWebContents: () => window };
const definitions = nodes.map((node) => transpiled.code.slice(node.start, node.end)).join("\n");
const BrowserSourceOwnerRegistry = Function(
  "EventEmitterBase", "BrowserWindow",
  `${definitions}; return BrowserSourceOwnerRegistry;`,
)(EventEmitterBase, BrowserWindow);
const shown = [];
const manager = new BrowserSourceOwnerRegistry(
  { showWindow: (...args) => { shown.push(args); return true; } },
  { focus: () => false },
);
const destroyed = [];
const origin = { isDestroyed: () => false, once: (event, callback) => destroyed.push([event, callback]) };
const makeHandler = (result = "revealed") => {
  const state = { disposed: 0, broken: null };
  const handler = {
    dup: () => handler,
    onRpcBroken: (callback) => { state.broken = callback; },
    reveal: async () => result,
    [Symbol.dispose]: () => { state.disposed += 1; },
    state,
  };
  return handler;
};
const owner = { accountId: "a", hostId: "local", threadId: "t", clientThreadId: "c", tabId: "tab" };
const handler1 = makeHandler();
manager.registerOwner(origin, owner, handler1);
equal(manager.getOwners("a"), [owner]);
equal(manager.getOwners("b"), []);
const handler2 = makeHandler();
const registration = manager.registerOwner(origin, owner, handler2);
equal(handler1.state.disposed, 1);
equal(manager.getOwners("a"), [owner]);
equal(await manager.reveal(owner), "revealed");
equal(shown.length, 1);

const published = [];
const listener = async (owners) => { published.push(owners); };
listener.dup = () => listener;
listener.onRpcBroken = () => {};
listener[Symbol.dispose] = () => {};
const service = manager.createService(origin);
equal(destroyed[0][0], "destroyed");
const subscription = await service.subscribeOwners("a", listener);
await Promise.resolve();
equal(published.at(-1), [owner]);
subscription[Symbol.dispose]();
registration[Symbol.dispose]();
equal(manager.getOwners("a"), []);
equal(handler2.state.disposed, 1);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('const { BrowserSourceOwnerRegistry: rje } = require("./main-app/window/browser-source-owner-registry.js");'), true);
equal(main.includes("rje = class"), false);
equal(main.includes("ije = class"), false);
equal(main.includes("function DN("), false);
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
equal(windowContext.includes("new rje(this.options.windowManager, this.detachedWindowManager)"), true);
console.log(`${assertions} main browser source owner registry assertions passed`);
