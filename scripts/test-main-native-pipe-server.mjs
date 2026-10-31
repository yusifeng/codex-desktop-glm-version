import assert from "node:assert/strict";
import fs from "node:fs";
import { ADD_BROWSER_USE_DOWNLOAD_CHANGE_LISTENER } from "../app/.vite/build/main-app/browser-use/iab-api.js";
import { createBrowserUseNativePipeServer, MAX_INCOMING_FRAME_BYTES, MAX_OUTGOING_FRAME_BYTES, NativePipeFrameTooLargeError } from "../app/.vite/build/main-app/browser-use/native-pipe-server.js";

const listeners = {};
const removed = [];
let apiDisposeCount = 0;
const api = {
  moveMouse() {},
  addCdpEventListener(listener) { listeners.cdp = listener; return () => removed.push("cdp"); },
  addCdpDetachListener(listener) { listeners.detach = listener; return () => removed.push("detach"); },
  addPageEventListener(listener) { listeners.page = listener; return () => removed.push("page"); },
  [ADD_BROWSER_USE_DOWNLOAD_CHANGE_LISTENER](listener) { listeners.download = listener; return () => removed.push("download"); },
  notifyWebMcpToolInvoked() {},
  dispose() { apiDisposeCount += 1; },
};
const sent = [];
let protocolCallbacks;
const invocations = [];
let throwOnCdp = false;
let pipeDisposed = false;
const server = await createBrowserUseNativePipeServer({
  apiImpl: api,
  socketPeerAuthorizer: () => ({ authorized: true }),
  createPipe: async (options) => {
    assert.equal(options.maxIncomingFrameBytes, MAX_INCOMING_FRAME_BYTES);
    assert.equal(options.maxOutgoingFrameBytes, MAX_OUTGOING_FRAME_BYTES);
    return { pipePath: "test-pipe", dispose: () => { pipeDisposed = true; } };
  },
  createProtocol: (_pipe, _api, callbacks) => {
    protocolCallbacks = callbacks;
    return {
    sendCdpEvent: (event) => {
      if (throwOnCdp) throw new NativePipeFrameTooLargeError(10, 11);
      sent.push(["cdp", event]);
    },
    sendCdpDetach: (event) => sent.push(["detach", event]),
    sendPageEvent: (event) => sent.push(["page", event]),
    sendDownloadChange: (change) => sent.push(["download", change]),
    };
  },
});
api.notifyWebMcpToolInvoked = (invocation) => invocations.push(invocation);
protocolCallbacks.onWebMcpToolInvoked({ session_id: "s1", tabId: 1, toolName: "tool", turn_id: "turn-1" });
assert.equal(invocations.length, 1);
protocolCallbacks.onWebMcpToolInvoked({ session_id: "s1", tabId: 0, toolName: "tool", turn_id: "turn-1" });
assert.equal(invocations.length, 1);
listeners.cdp({ method: "Runtime.executionContextCreated" });
listeners.detach({ tabId: "tab-1" });
listeners.page({ type: "navigation" });
listeners.download({ path: "/tmp/a", tabId: "tab-1" });
assert.deepEqual(sent.map(([kind]) => kind), ["cdp", "detach", "page", "download"]);
throwOnCdp = true;
listeners.cdp({ method: "Network.dataReceived" });
assert.equal(sent.length, 4);
await server.dispose();
throwOnCdp = false;
const second = await createBrowserUseNativePipeServer({
  apiImpl: api,
  socketPeerAuthorizer: () => ({ authorized: true }),
  createPipe: async () => ({ pipePath: "test-pipe-2", dispose() {} }),
  createProtocol: () => ({
    sendCdpEvent: () => { throw new Error("unexpected protocol failure"); },
    sendCdpDetach() {}, sendPageEvent() {}, sendDownloadChange() {},
  }),
});
assert.throws(() => listeners.cdp({ method: "Runtime.exceptionThrown" }), /unexpected protocol failure/);
await second.dispose();
assert.deepEqual(removed.sort(), ["cdp", "cdp", "detach", "detach", "download", "download", "page", "page"]);
assert.equal(pipeDisposed, true);
assert.equal(apiDisposeCount, 2);

const failedApi = { ...api, dispose() { apiDisposeCount += 1; } };
await assert.rejects(
  createBrowserUseNativePipeServer({
    apiImpl: failedApi,
    socketPeerAuthorizer: () => ({ authorized: true }),
    createPipe: async () => { throw new Error("listen failed"); },
  }),
  /listen failed/,
);
assert.equal(apiDisposeCount, 3);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
assert.equal(main.includes('require("./main-app/native-pipe/protocol.js")'), false);
assert.equal(main.includes('require("./main-app/native-pipe/server.js")'), false);
assert.equal(main.includes('require("./main-app/native-pipe/peer-socket-authorizer.js")'), true);
assert.equal(main.includes('require("./main-app/browser-use/native-pipe-server.js")'), true);
assert.equal(main.includes("var Bl = class extends Error"), false);
assert.equal(main.includes("async function ql("), false);
assert.equal(main.includes("function Ql()"), false);
assert.equal(main.includes("async function JYe("), false);
const sessionRegistry = fs.readFileSync(
  new URL("../src/main/main-app/browser-use/session-registry.ts", import.meta.url),
  "utf8",
);
assert.equal(sessionRegistry.includes("createBrowserUseNativePipeServer({"), true);
assert.equal(sessionRegistry.includes("socketPeerAuthorizer: createSocketPeerAuthorizer()"), true);

console.log("main native pipe server: 26 assertions passed");
