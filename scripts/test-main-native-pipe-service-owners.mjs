import assert from "node:assert/strict";
import { once } from "node:events";
import fs from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { createConnection } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createDynamicAppToolsServer } from "../app/.vite/build/main-app/native-pipe/dynamic-app-tools-server.js";
import { createHostServicesServer } from "../app/.vite/build/main-app/native-pipe/host-services-server.js";
import { decodeFrames, encodeFrame } from "../app/.vite/build/main-app/native-pipe/protocol.js";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const authorize = () => ({ authorized: true });
const connect = async (path) => {
  const socket = createConnection(path);
  await once(socket, "connect");
  return socket;
};
const request = async (socket, payload) => {
  const data = once(socket, "data");
  socket.write(encodeFrame(JSON.stringify(payload)));
  const [chunk] = await data;
  return JSON.parse(decodeFrames(chunk).messages[0]);
};

const directory = await mkdtemp(join(tmpdir(), "codex-native-services-"));
const calls = [];
const dynamic = await createDynamicAppToolsServer({
  pipePath: join(directory, "dynamic.sock"),
  socketPeerAuthorizer: authorize,
  listTools: async (kind) => {
    calls.push(["list", kind]);
    return [
      { type: "namespace", name: "codex_app", tools: [{ name: "open", description: "Open", inputSchema: {} }] },
      { type: "namespace", name: "untrusted", tools: [{ name: "hidden" }] },
    ];
  },
  callTool: async (toolRequest) => {
    calls.push(["call", toolRequest.hostId, toolRequest.params.tool]);
    return { ok: true };
  },
});
const dynamicClient = await connect(dynamic.pipePath);
const listResponse = await request(dynamicClient, {
  id: 1, jsonrpc: "2.0", method: "tools/list", params: { threadStartKind: "all" },
});
equal(listResponse.result.tools, [{ name: "open", description: "Open", inputSchema: {}, namespace: "codex_app" }]);
equal(calls[0], ["list", "all"]);
const callResponse = await request(dynamicClient, {
  id: "call-1",
  jsonrpc: "2.0",
  method: "tools/call",
  params: {
    arguments: {}, callId: "call", namespace: "codex_app", threadId: "thread",
    tool: "open", turnId: "turn",
  },
});
equal(callResponse.result, { ok: true });
equal(calls[1], ["call", "local", "open"]);
const invalidResponse = await request(dynamicClient, {
  id: 2, jsonrpc: "2.0", method: "tools/call", params: { namespace: "untrusted" },
});
equal(invalidResponse.error.code, -32602);

const host = await createHostServicesServer({
  pipePath: join(directory, "host.sock"),
  socketPeerAuthorizer: authorize,
  services: new Map([
    ["computer-use", async () => ({ pid: 42 })],
    ["empty", async () => undefined],
  ]),
});
const hostClient = await connect(host.pipePath);
equal((await request(hostClient, {
  id: 3, jsonrpc: "2.0", method: "ensureService", params: { service: "computer-use" },
})).result, { pid: 42 });
equal((await request(hostClient, {
  id: 4, jsonrpc: "2.0", method: "ensureService", params: { service: "empty" },
})).result, {});
equal((await request(hostClient, {
  id: 5, jsonrpc: "2.0", method: "ensureService", params: { service: "missing" },
})).error.message, "Unsupported host service: missing");

dynamicClient.destroy();
hostClient.destroy();
await dynamic.dispose();
await host.dispose();
await rm(directory, { force: true, recursive: true });

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/native-pipe/dynamic-app-tools-server.js")'), true);
equal(main.includes('require("./main-app/native-pipe/host-services-server.js")'), true);
equal(main.includes("async function Hse("), false);
equal(main.includes("async function Hce("), false);
equal(main.includes("createDynamicAppToolsServer({"), true);
equal(main.includes("createHostServicesServer({"), true);

console.log(`${assertions} main native pipe service owner assertions passed`);
