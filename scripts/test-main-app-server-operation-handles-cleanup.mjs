import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/app-server/operation-handle.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const classSlice = (name) => {
  const node = ast.body.find((entry) => entry.type === "ClassDeclaration" && entry.id?.name === name);
  assert.ok(node, `missing ${name}`);
  assertions += 1;
  return transpiled.code.slice(node.start, node.end);
};

class EventEmitter {}
const classes = Function(
  "EventEmitter",
  `${classSlice("AppServerOperationHandle")}; ${classSlice("CancellableOperationHandle")}; return { AppServerOperationHandle, CancellableOperationHandle };`,
)(EventEmitter);
const handle = new classes.AppServerOperationHandle(Promise.resolve({ threadId: "thread", completion: "done" }));
equal(await handle.getStartResult(), { threadId: "thread" });
equal(await handle.waitForCompletion(), "done");
await assert.rejects(
  new classes.AppServerOperationHandle(Promise.resolve({ threadId: "thread", completion: null })).waitForCompletion(),
  /did not start/,
);
assertions += 1;

const controller = new AbortController();
const cancellable = new classes.CancellableOperationHandle(Promise.resolve({ completion: "done" }), controller);
cancellable.cancel();
equal(controller.signal.aborted, true);
const secondController = new AbortController();
new classes.CancellableOperationHandle(Promise.resolve({ completion: "done" }), secondController)[Symbol.dispose]();
equal(secondController.signal.aborted, true);

const manager = fs.readFileSync(new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url), "utf8");
equal(manager.includes("Lv as AppServerOperationHandle"), true);
equal(manager.includes("Rv as LoginOperationHandle"), true);
equal(manager.includes("return new LoginOperationHandle(this.loginWithChatGPT"), true);
equal(manager.includes("return new AppServerOperationHandle(this.startWindowsSandboxSetup"), true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("var Lv = class"), false);
equal(main.includes("Rv = class extends Lv"), false);
equal(main.includes('const { AppServerConversationManager } = require("./main-app/conversation/app-server-manager.js");'), true);

console.log(`${assertions} main app-server operation handle cleanup assertions passed`);
