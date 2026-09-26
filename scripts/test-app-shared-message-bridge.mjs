import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [
    path.join(ROOT, "src/renderer/app-shared/runtime/message-bridge.ts"),
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  external: ["react"],
  write: false,
  logLevel: "silent",
});

const sentMessages = [];
const acknowledgements = [];
const dispatchedEvents = [];
const listeners = new Map();
const fakeWindow = {
  location: { origin: "app://codex" },
  electronBridge: {
    sendMessageFromView: async (message) => sentMessages.push(message),
    acknowledgeChunkedMessage: (transferId, sequence) =>
      acknowledgements.push([transferId, sequence]),
  },
  addEventListener: (type, listener) => listeners.set(type, listener),
  removeEventListener: (type, listener) => {
    if (listeners.get(type) === listener) listeners.delete(type);
  },
  dispatchEvent: (event) => {
    dispatchedEvents.push(event);
    return true;
  },
};

class TestCustomEvent {
  constructor(type, options) {
    this.type = type;
    this.detail = options.detail;
  }
}

const effects = [];
globalThis.window = fakeWindow;
globalThis.CustomEvent = TestCustomEvent;
globalThis.__RENDERER_REACT__ = {
  useRef: (value) => ({ current: value }),
  useCallback: (callback) => callback,
  useEffect: (effect, dependencies) => effects.push({ effect, dependencies }),
};

const messageBridge = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
function throws(callback, pattern, message) {
  assert.throws(callback, pattern, message);
  assertions += 1;
}

const assembler = new messageBridge.ChunkedValueAssembler();
assembler.consume([
  { type: "object-start" },
  { type: "key", value: "type" },
  { type: "string-start", target: "value" },
  { type: "string-chunk", value: "mcp-" },
  { type: "string-chunk", value: "response" },
  { type: "string-end" },
  { type: "key", value: "items" },
  { type: "array-start" },
  { type: "value", value: 1 },
  { type: "value", value: true },
  { type: "container-end" },
  { type: "container-end" },
]);
equal(
  assembler.finish(),
  { type: "mcp-response", items: [1, true] },
  "assembles nested containers and chunked strings",
);

const keyAssembler = new messageBridge.ChunkedValueAssembler();
keyAssembler.consume([
  { type: "object-start" },
  { type: "string-start", target: "key" },
  { type: "string-chunk", value: "dynamic" },
  { type: "string-end" },
  { type: "value", value: null },
  { type: "container-end" },
]);
equal(keyAssembler.finish(), { dynamic: null }, "assembles chunked keys");
throws(
  () => new messageBridge.ChunkedValueAssembler().finish(),
  /before its value was complete/,
  "rejects incomplete values",
);
const unmatched = new messageBridge.ChunkedValueAssembler();
throws(
  () => unmatched.consume([{ type: "container-end" }]),
  /unmatched container end/,
  "rejects unmatched containers",
);

const marker = "codex-host-chunked-message-v1";
const receiver = new messageBridge.ChunkedMessageReceiver();
equal(
  receiver.receive({ type: "ready" }),
  { type: "passthrough", message: { type: "ready" } },
  "passes ordinary messages through",
);
equal(
  receiver.receive({ marker, transferId: "one", sequence: 4, kind: "start" }),
  {
    type: "pending",
    acknowledgement: { transferId: "one", sequence: 4 },
  },
  "starts a transfer",
);
equal(
  receiver.receive({
    marker,
    transferId: "one",
    sequence: 5,
    kind: "chunk",
    tokens: [
      { type: "object-start" },
      { type: "key", value: "type" },
      { type: "value", value: "ready" },
      { type: "container-end" },
    ],
  }).type,
  "pending",
  "accepts the next sequence",
);
equal(
  receiver.receive({ marker, transferId: "one", sequence: 6, kind: "end" }),
  {
    type: "complete",
    message: { type: "ready" },
    acknowledgement: { transferId: "one", sequence: 6 },
  },
  "completes a transfer",
);
receiver.receive({ marker, transferId: "one", sequence: 10, kind: "start" });
equal(
  receiver.receive({ marker, transferId: "one", sequence: 12, kind: "end" }),
  { type: "pending", acknowledgement: null },
  "drops out-of-sequence transfers",
);

const logs = [];
messageBridge.setViewLogger((type, payload) => logs.push([type, payload]));
messageBridge.bridgeLogger.warning("Could not send", {
  safe: { type: "request" },
});
equal(logs[0][0], "log-message", "routes renderer logs through the bridge");
equal(logs[0][1].level, "warning", "preserves renderer log levels");
equal(logs[0][1].tags.sensitive, {}, "normalizes sensitive log tags");

messageBridge.initializeHostMessageBridge();
const bridge = messageBridge.VscodeHostMessageBridge.getInstance();
equal(listeners.has("message"), true, "installs the host message listener");
equal(
  bridge,
  messageBridge.VscodeHostMessageBridge.getInstance(),
  "keeps a stable bridge singleton",
);

sentMessages.length = 0;
dispatchedEvents.length = 0;
bridge.dispatchMessage("open", { id: 7 });
await Promise.resolve();
equal(sentMessages, [{ type: "open", id: 7 }], "forwards messages to Electron");
equal(
  dispatchedEvents[0].type,
  "codex-message-from-view",
  "dispatches compatibility events",
);
equal(
  dispatchedEvents[0].detail,
  { type: "open", id: 7 },
  "preserves event details",
);
equal(
  dispatchedEvents[0].__codexForwardedViaBridge,
  true,
  "marks events already forwarded by Electron",
);

const delivered = [];
const unsubscribe = bridge.subscribe("ready", (message, reply) => {
  delivered.push(message);
  reply("reply", { requestId: message.requestId });
});
bridge.dispatchHostMessage({ type: "ready", requestId: "r1" });
equal(
  delivered,
  [{ type: "ready", requestId: "r1" }],
  "delivers subscribed messages",
);
equal(
  sentMessages.at(-1),
  { type: "reply", requestId: "r1" },
  "provides a reply dispatcher",
);
unsubscribe();
bridge.dispatchHostMessage({ type: "ready", requestId: "r2" });
equal(delivered.length, 1, "removes unsubscribed handlers");

const firstBuffered = { type: "mcp-response", id: 1 };
const secondBuffered = { type: "mcp-response", id: 2 };
bridge.dispatchHostMessage(firstBuffered);
bridge.dispatchHostMessage(secondBuffered);
equal(
  bridge.hasHandledBufferedMessage(firstBuffered),
  true,
  "tracks buffered message objects",
);
const replayed = [];
bridge.subscribe("mcp-response", (message) => replayed.push(message.id));
equal(replayed, [1, 2], "replays MCP messages in order");

bridge.dispatchHostMessage({
  type: "personal-workspace-access-blocked",
  id: 1,
});
bridge.dispatchHostMessage({
  type: "personal-workspace-access-blocked",
  id: 2,
});
const blocked = [];
bridge.subscribe("personal-workspace-access-blocked", (message) =>
  blocked.push(message.id),
);
equal(blocked, [2], "retains only the latest workspace block message");

acknowledgements.length = 0;
const listener = listeners.get("message");
listener({
  data: { marker, transferId: "event", sequence: 1, kind: "start" },
  origin: "app://codex",
  source: fakeWindow,
});
listener({
  data: {
    marker,
    transferId: "event",
    sequence: 2,
    kind: "chunk",
    tokens: [
      { type: "object-start" },
      { type: "key", value: "type" },
      { type: "value", value: "window-event" },
      { type: "container-end" },
    ],
  },
  origin: "app://codex",
  source: fakeWindow,
});
const windowMessages = [];
bridge.subscribe("window-event", (message) =>
  windowMessages.push(message.type),
);
listener({
  data: { marker, transferId: "event", sequence: 3, kind: "end" },
  origin: "app://codex",
  source: fakeWindow,
});
equal(
  windowMessages,
  ["window-event"],
  "reassembles window messages before delivery",
);
equal(
  acknowledgements,
  [
    ["event", 1],
    ["event", 2],
    ["event", 3],
  ],
  "acknowledges valid chunk records",
);

listener({
  data: { type: "window-event" },
  origin: "https://foreign",
  source: fakeWindow,
});
equal(windowMessages.length, 1, "rejects mismatched same-window origins");

effects.length = 0;
messageBridge.useElectronMessageHandler("notice", () => undefined, ["dep"]);
equal(effects.length, 1, "registers a React subscription effect");
equal(
  effects[0].dependencies.slice(0, 1),
  ["notice"],
  "tracks the message type",
);
equal(effects[0].dependencies.at(-1), "dep", "tracks caller dependencies");
const cleanup = effects[0].effect();
equal(typeof cleanup, "function", "returns the subscription cleanup");
cleanup();

bridge.stopWindowMessageListener();
equal(listeners.has("message"), false, "removes the window listener");
throws(
  () => bridge.startTestWindowMessageListener(),
  /only available in tests/,
  "guards the unavailable test listener",
);
bridge.reset();

console.log(
  `app-shared message bridge behavior: ${assertions}/${assertions} assertions passed`,
);
