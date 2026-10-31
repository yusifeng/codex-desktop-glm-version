import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/app-server/stream-subscription.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const module = { exports: {} };
class EventEmitter {}
Function("require", "module", "exports", transpiled.code)(
  (specifier) => specifier === "@chunk/shared" ? { Uf: EventEmitter } : (() => { throw new Error(specifier); })(),
  module,
  module.exports,
);
const { ConversationStreamSubscription } = module.exports;

const fallbackConnection = {};
const fallbackResult = { kind: "fallback" };
equal(ConversationStreamSubscription.subscribe(fallbackConnection, (value) => {
  equal(value, fallbackConnection);
  return fallbackResult;
}), fallbackResult);

let directCallback;
let directUnsubscribed = 0;
let directStreamDisposed = 0;
let directResultDisposed = 0;
let rpcBroken;
const directStream = () => {
  const result = Promise.resolve();
  result[Symbol.dispose] = () => { directResultDisposed += 1; };
  return result;
};
directStream.onRpcBroken = (callback) => { rpcBroken = callback; };
directStream[Symbol.dispose] = () => { directStreamDisposed += 1; };
const direct = ConversationStreamSubscription.subscribe(
  { dup: () => directStream },
  (callback) => { directCallback = callback; return () => { directUnsubscribed += 1; }; },
);
directCallback({ type: "started" });
equal(directResultDisposed, 1);
direct.unsubscribe();
direct.unsubscribe();
equal(directUnsubscribed, 1);
equal(directStreamDisposed, 1);

let resolveFirst;
const first = new Promise((resolve) => { resolveFirst = resolve; });
let conversationResultDisposed = 0;
const received = [];
const conversationStream = (notification) => {
  received.push(notification);
  const result = received.length === 1 ? first : Promise.resolve();
  result[Symbol.dispose] = () => { conversationResultDisposed += 1; };
  return result;
};
conversationStream.onRpcBroken = () => {};
conversationStream[Symbol.dispose] = () => {};
let conversationCallback;
const conversation = ConversationStreamSubscription.subscribeConversation(
  { dup: () => conversationStream },
  (callback) => { conversationCallback = callback; return () => {}; },
  () => ({ type: "reset" }),
);
conversationCallback({ type: "started" });
conversationCallback({ type: "changes", changes: [1] });
conversationCallback({ type: "changes", changes: [2] });
equal(received, [{ type: "started" }]);
resolveFirst();
await new Promise((resolve) => setImmediate(resolve));
equal(received, [
  { type: "started" },
  { type: "changes", changes: [1, 2] },
]);
equal(conversationResultDisposed, 2);
conversation[Symbol.dispose]();

rpcBroken();
equal(directUnsubscribed, 1);
equal(source.includes("MAX_QUEUED_NOTIFICATION_BYTES = 262_144"), true);
equal(source.includes("stream.onRpcBroken(() => subscription.unsubscribe())"), true);

const manager = fs.readFileSync(new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url), "utf8");
const queued = fs.readFileSync(new URL("../src/main/main-app/conversation/queued-follow-ups.ts", import.meta.url), "utf8");
equal(manager.includes('from "../app-server/stream-subscription"'), true);
equal(manager.includes("ConversationStreamSubscription.subscribeConversation("), true);
equal(queued.includes('from "../app-server/stream-subscription"'), true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("Sm = class"), false);
equal(main.includes("function Cm("), false);
equal(main.includes('const { AppServerConversationManager } = require("./main-app/conversation/app-server-manager.js");'), true);

console.log(`${assertions} main conversation stream subscription cleanup assertions passed`);
