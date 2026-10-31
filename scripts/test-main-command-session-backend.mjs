import assert from "node:assert/strict";
import { StringDecoder } from "node:string_decoder";
import fs from "node:fs";
import { createCommandSessionBackendClass } from "../src/main/main-app/terminal/command-session-backend.ts";

const Backend = createCommandSessionBackendClass({
  createUtf8Decoder: () => new StringDecoder("utf8"),
  formatError: (error) => `formatted:${error.message}`,
});
const response = Promise.withResolvers();
const calls = [];
const session = {
  response: response.promise,
  write: async (value) => calls.push(["write", value.toString("utf8")]),
  resize: async (value) => calls.push(["resize", value]),
  terminate: async () => calls.push(["terminate"]),
};
const backend = new Backend(
  Promise.resolve(session),
  {
    onData: (value) => calls.push(["data", value]),
    onExit: (value) => calls.push(["exit", value]),
  },
  { serializeWrites: true },
);

backend.handleOutputDelta({ chunk: Buffer.from([0xe2, 0x82]) });
assert.equal(calls.length, 0);
backend.handleOutputDelta({ chunk: Buffer.from([0xac]) });
assert.deepEqual(calls, [["data", "€"]]);
const firstWrite = backend.write("a");
const secondWrite = backend.write("b");
assert.equal(firstWrite, secondWrite);
await firstWrite;
assert.deepEqual(calls.find(([kind]) => kind === "write"), ["write", "ab"]);
await backend.resize(80, 24);
await backend.terminate();
assert.deepEqual(calls.find(([kind]) => kind === "resize"), ["resize", { cols: 80, rows: 24 }]);
assert.equal(calls.filter(([kind]) => kind === "terminate").length, 1);
response.resolve({ exitCode: 7 });
await new Promise((resolve) => setTimeout(resolve, 0));
assert.deepEqual(calls.find(([kind]) => kind === "exit"), [
  "exit",
  { code: 7, signal: null },
]);
assert.equal(backend.settled, true);
await backend.write("ignored");
assert.equal(calls.filter(([kind]) => kind === "write").length, 1);

const failures = [];
new Backend(Promise.reject(new Error("boom")), {
  onData: (value) => failures.push(["data", value]),
  onExit: (value) => failures.push(["exit", value]),
});
await new Promise((resolve) => setTimeout(resolve, 0));
assert.deepEqual(failures, [[
  "exit",
  { code: null, signal: null, error: "formatted:boom" },
]]);

const pendingResponse = Promise.withResolvers();
let disposedTerminations = 0;
const disposable = new Backend(
  Promise.resolve({
    response: pendingResponse.promise,
    terminate: async () => { disposedTerminations++; },
    write: async () => {},
    resize: async () => {},
  }),
  { onData: () => assert.fail("disposed backend emitted data"), onExit: () => assert.fail("disposed backend exited") },
);
await disposable.dispose();
await disposable.dispose();
assert.equal(disposedTerminations, 1);
pendingResponse.resolve({ exitCode: 0 });
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(disposable.settled, true);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
assert.match(main, /var NQ = createCommandSessionBackendClass\(\{/);
assert.doesNotMatch(main, /NQ = class/);

console.log("command session backend assertions: 19");
