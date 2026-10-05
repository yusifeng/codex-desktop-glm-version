import assert from "node:assert/strict";
import { ADD_BROWSER_USE_DOWNLOAD_CHANGE_LISTENER } from "../app/.vite/build/main-app/browser-use/iab-api.js";
import { createBrowserUseNativePipeServer, MAX_INCOMING_FRAME_BYTES, MAX_OUTGOING_FRAME_BYTES } from "../app/.vite/build/main-app/browser-use/native-pipe-server.js";

const listeners = {};
const removed = [];
const api = {
  addCdpEventListener(listener) { listeners.cdp = listener; return () => removed.push("cdp"); },
  addCdpDetachListener(listener) { listeners.detach = listener; return () => removed.push("detach"); },
  addPageEventListener(listener) { listeners.page = listener; return () => removed.push("page"); },
  [ADD_BROWSER_USE_DOWNLOAD_CHANGE_LISTENER](listener) { listeners.download = listener; return () => removed.push("download"); },
  notifyWebMcpToolInvoked() {},
};
const sent = [];
let pipeDisposed = false;
let protocolDisposed = false;
const server = await createBrowserUseNativePipeServer({
  apiImpl: api,
  createPipe: async (options) => {
    assert.equal(options.maxIncomingFrameBytes, MAX_INCOMING_FRAME_BYTES);
    assert.equal(options.maxOutgoingFrameBytes, MAX_OUTGOING_FRAME_BYTES);
    return { pipePath: "test-pipe", dispose: () => { pipeDisposed = true; } };
  },
  createProtocol: () => ({
    sendCdpEvent: (event) => sent.push(["cdp", event]),
    sendCdpDetach: (event) => sent.push(["detach", event]),
    sendPageEvent: (event) => sent.push(["page", event]),
    sendDownloadChange: (change) => sent.push(["download", change]),
    dispose: () => { protocolDisposed = true; },
  }),
});
listeners.cdp({ method: "Runtime.executionContextCreated" });
listeners.detach({ tabId: "tab-1" });
listeners.page({ type: "navigation" });
listeners.download({ path: "/tmp/a", tabId: "tab-1" });
assert.deepEqual(sent.map(([kind]) => kind), ["cdp", "detach", "page", "download"]);
server.dispose();
assert.deepEqual(removed.sort(), ["cdp", "detach", "download", "page"]);
assert.equal(protocolDisposed, true);
assert.equal(pipeDisposed, true);
console.log("main native pipe server: 8 assertions passed");
