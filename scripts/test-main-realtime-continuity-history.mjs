import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRealtimeContinuityHistoryRuntime } from "../src/main/main-app/realtime/continuity-history.ts";

class Schema {
  parse(value) {
    if (value?.version !== 1 || typeof value.threads !== "object") throw new Error("invalid history");
    return value;
  }
}
const schema = new Schema();
let stored = null;
let failNextWrite = false;
const calls = [];
const fileSystem = {
  async readFile(target, encoding) {
    calls.push(["read", target, encoding]);
    if (stored == null) throw new Error("missing");
    return stored;
  },
  async mkdir(target, options) { calls.push(["mkdir", target, options]); },
  async writeFile(target, value, encoding) {
    calls.push(["write", target, value, encoding]);
    if (failNextWrite) { failNextWrite = false; throw new Error("write failed"); }
    stored = value;
  },
};
const runtime = createRealtimeContinuityHistoryRuntime({
  runtime: {
    Uf: class {},
    wf: () => schema,
    df: () => schema,
    Of: () => schema,
    bf: () => schema,
    Ef: () => schema,
    hf: () => schema,
  },
  fs: fileSystem,
  path,
});

assert.equal(runtime.historyPath("/codex"), "/codex/realtime-voice-continuity.json");
assert.deepEqual(runtime.normalizeItem({ role: "user", text: "  hello world  " }, 5), { role: "user", text: "hello" });
assert.equal(runtime.normalizeItem({ role: "assistant", text: "   " }, 20), null);
assert.deepEqual(await runtime.readHistory("/codex"), { version: 1, threads: {} });

const hostCalls = [];
const history = new runtime.RealtimeContinuityHistory({
  async codexHome() { hostCalls.push("home"); return "/codex"; },
});
await history.record({
  threadId: "thread-one",
  item: { role: "user", text: "  first message  " },
  maxItems: 2,
  maxTextLength: 50,
});
assert.equal(hostCalls.length, 1);
assert.equal(stored.endsWith("\n"), true);
assert.deepEqual(JSON.parse(stored), {
  version: 1,
  threads: { "thread-one": { items: [{ role: "user", text: "first message" }] } },
});
assert.deepEqual(calls.find((call) => call[0] === "mkdir"), ["mkdir", "/codex", { recursive: true }]);

await history.record({
  threadId: "thread-one",
  item: { role: "assistant", text: "second" },
  maxItems: 2,
  maxTextLength: 50,
});
await history.record({
  threadId: "thread-one",
  item: { role: "user", text: "third" },
  maxItems: 2,
  maxTextLength: 50,
});
assert.deepEqual(JSON.parse(stored).threads["thread-one"].items, [
  { role: "assistant", text: "second" },
  { role: "user", text: "third" },
]);
assert.deepEqual(await history.read({ threadId: "thread-one", maxItems: 1 }), [
  { role: "user", text: "third" },
]);

const writesBeforeBlank = calls.filter((call) => call[0] === "write").length;
await history.record({
  threadId: "thread-one",
  item: { role: "user", text: "   " },
  maxItems: 2,
  maxTextLength: 50,
});
assert.equal(calls.filter((call) => call[0] === "write").length, writesBeforeBlank);

failNextWrite = true;
await assert.rejects(
  history.record({
    threadId: "thread-two",
    item: { role: "user", text: "fails" },
    maxItems: 2,
    maxTextLength: 50,
  }),
  /write failed/,
);
await history.record({
  threadId: "thread-two",
  item: { role: "assistant", text: "recovers" },
  maxItems: 2,
  maxTextLength: 50,
});
assert.deepEqual(JSON.parse(stored).threads["thread-two"].items, [
  { role: "assistant", text: "recovers" },
]);

stored = "not json";
assert.deepEqual(await history.read({ threadId: "thread-one", maxItems: 5 }), []);
assert.equal(calls.every((call) => call[0] !== "write" || call[3] === "utf8"), true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /createRealtimeContinuityHistoryRuntime\(\{/);
assert.doesNotMatch(main, /g8e = class/);
assert.doesNotMatch(main, /async function y2\(/);
assert.doesNotMatch(main, /function v8e\(/);
assert.match(main, /let m = new g8e\(r\)/);

console.log("realtime continuity history assertions: 22");
