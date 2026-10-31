import assert from "node:assert/strict";
import fs from "node:fs";
import { createRealtimeMemorySummaryClass } from "../src/main/main-app/realtime/memory-summary.ts";

class RpcHandlerBase {}
const calls = [];
let content = "# Memory\nUseful context\n";
let failure = null;
const RealtimeMemorySummary = createRealtimeMemorySummaryClass({
  RpcHandlerBase,
  readRemoteFile: async (...args) => {
    calls.push(["read", ...args]);
    if (failure) throw failure;
    return content;
  },
});
const pathApi = {
  join: (...parts) => {
    calls.push(["join", ...parts]);
    return parts.join("/");
  },
};
const executionHost = {
  async codexHome() { calls.push(["home"]); return "/codex"; },
  async platformPath() { calls.push(["path"]); return pathApi; },
};
const service = new RealtimeMemorySummary(executionHost);
assert.equal(service instanceof RpcHandlerBase, true);
assert.equal(await service.readSummary(), content);
assert.equal(calls[0][0], "home");
assert.equal(calls[1][0], "path");
assert.deepEqual(calls[2], ["join", "/codex", "memories", "memory_summary.md"]);
assert.deepEqual(calls[3], ["read", "/codex/memories/memory_summary.md", executionHost]);

content = "  \n\t";
assert.equal(await service.readSummary(), null);
content = "  retained whitespace  ";
assert.equal(await service.readSummary(), "  retained whitespace  ");
failure = new Error("missing");
assert.equal(await service.readSummary(), null);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /y8e = createRealtimeMemorySummaryClass\(\{/);
assert.doesNotMatch(main, /y8e = class/);
assert.match(main, /g = new y8e\(r\)/);

console.log("realtime memory summary assertions: 12");
