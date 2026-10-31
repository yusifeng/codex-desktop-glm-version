import assert from "node:assert/strict";
import { once } from "node:events";
import fs from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { createConnection } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  FrameDecoder,
  PipeFrameLimitError,
  decodeFrames,
  encodeFrame,
} from "../app/.vite/build/main-app/native-pipe/protocol.js";
import { createNativePipeServer } from "../app/.vite/build/main-app/native-pipe/server.js";
import {
  dispatchBrowserCommand,
  getBrowserUsePipePath,
  isBrowserUseCommandEnvelope,
  parseBrowserUseJsonRpcMessage,
} from "../app/.vite/build/main-app/browser-use/rpc-client.js";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const first = encodeFrame("hello");
const second = encodeFrame("world");
equal(decodeFrames(Buffer.concat([first, second])), {
  messages: ["hello", "world"],
  remainingData: Buffer.alloc(0),
});
const decoder = new FrameDecoder(1024);
equal(decoder.push(first.subarray(0, 3)), []);
equal(decoder.push(first.subarray(3)), ["hello"]);
assert.throws(() => encodeFrame("oversized", 2), (error) => {
  equal(error instanceof PipeFrameLimitError, true);
  equal(error.messageBytes, 9);
  equal(error.maxFrameBytes, 2);
  return true;
});

const directory = await mkdtemp(join(tmpdir(), "codex-native-pipe-"));
const server = await createNativePipeServer({
  nativePipeDirectory: directory,
  maxIncomingFrameBytes: 4096,
  maxOutgoingFrameBytes: 4096,
  socketPeerAuthorizer: () => ({ authorized: true }),
});
const received = new Promise((resolve) => server.setMessageCallback(resolve));
const client = createConnection(server.pipePath);
await once(client, "connect");
client.write(encodeFrame(JSON.stringify({ id: 7, jsonrpc: "2.0", method: "ping" })));
const request = await received;
equal(request.method, "ping");
equal(typeof request.id, "string");
equal(request.id.startsWith("__native_pipe_request_"), true);

const responseData = once(client, "data");
server.sendMessage({ id: request.id, jsonrpc: "2.0", result: "pong" });
const [responseChunk] = await responseData;
const response = JSON.parse(decodeFrames(responseChunk).messages[0]);
equal(response, { id: 7, jsonrpc: "2.0", result: "pong" });

equal(parseBrowserUseJsonRpcMessage({ jsonrpc: "2.0", id: 1, result: { ok: true } }), {
  jsonrpc: "2.0", id: 1, result: { ok: true },
});
equal(parseBrowserUseJsonRpcMessage({ jsonrpc: "2.0", id: 1.5, result: null }), null);
equal(isBrowserUseCommandEnvelope({ version: 1, type: "ping" }), true);
equal(getBrowserUsePipePath("win32"), "\\\\.\\pipe\\codex-browser-use");
equal(getBrowserUsePipePath("darwin"), "/tmp/codex-browser-use");
equal(await dispatchBrowserCommand({
  backendName: "test backend",
  commandSets: [{ commands: { ping: {} } }],
  handlers: { ping: ({ value }) => value },
  payload: { type: "ping", value: 42 },
}), 42);
await assert.rejects(
  dispatchBrowserCommand({
    backendName: "test backend",
    commandSets: [{ commands: {} }],
    handlers: {},
    payload: { type: "missing" },
  }),
  /does not support command "missing"/,
);
assertions += 1;

client.destroy();
await server.close();
await rm(directory, { force: true, recursive: true });

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/browser-use/rpc-client.js")'), true);
equal(main.includes("var Dn = `browser/config.toml`"), false);
equal(main.includes("class extends kn"), false);
equal(main.includes("function ste("), false);
equal(main.includes("async function lte("), false);

console.log(`${assertions} main native pipe foundation owner assertions passed`);
