import assert from "node:assert/strict";
import fs from "node:fs";
import { createTracingRpcServiceClass } from "../src/main/main-app/tracing/tracing-rpc-service.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const calls = [];
const TracingRpcService = createTracingRpcServiceClass({
  RpcHandlerBase: class {},
  async exportTraceBatch(batch) { calls.push(["export", batch]); },
  setDesktopTracingSampleRate(value) { calls.push(["desktopRate", value]); },
  async confirmTraceRecordingStart() { calls.push(["confirm"]); return "confirmed"; },
  async cancelTraceRecordingStart() { calls.push(["cancel"]); return "cancelled"; },
  async keepTraceRecordingLocal() { calls.push(["keepLocal"]); return "kept"; },
  async submitTraceRecording(details) { calls.push(["submit", details]); return "submitted"; },
});
const service = new TracingRpcService(
  (value) => calls.push(["gitWorkerRate", value]),
  (value) => calls.push(["saveRate", value]),
);

await service.exportTraceBatch({ spans: [1] });
equal(calls.at(-1), ["export", { spans: [1] }]);

for (const [input, expected] of [
  [0.25, 0.25],
  [-2, 0],
  [4, 1],
  [Number.NaN, 0],
  [Number.POSITIVE_INFINITY, 0],
]) {
  const start = calls.length;
  await service.setSampleRate(input);
  equal(calls.slice(start), [
    ["desktopRate", expected],
    ["gitWorkerRate", expected],
    ["saveRate", expected],
  ]);
}

equal(await service.confirmTraceRecordingStart(), "confirmed");
equal(calls.at(-1), ["confirm"]);
equal(await service.cancelTraceRecordingStart(), "cancelled");
equal(calls.at(-1), ["cancel"]);
equal(
  await service.submitTraceRecordingDetails({
    keepLocal: true,
    note: "ignored",
    conversationId: "ignored",
  }),
  "kept",
);
equal(calls.at(-1), ["keepLocal"]);
equal(
  await service.submitTraceRecordingDetails({
    keepLocal: false,
    note: "diagnostic note",
    conversationId: "thread-1",
    ignored: true,
  }),
  "submitted",
);
equal(calls.at(-1), ["submit", { note: "diagnostic note", conversationId: "thread-1" }]);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("Fnt = createTracingRpcServiceClass({"), true);
equal(main.includes("tracing: new Fnt("), true);
equal(main.includes("Fnt = class"), false);
equal(main.includes("setDesktopTracingSampleRate: a.E"), true);

console.log(`${assertions} main tracing RPC service assertions passed`);
