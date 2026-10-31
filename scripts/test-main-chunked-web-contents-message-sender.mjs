import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const build = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/window/chunked-web-contents-message-sender.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createChunkedWebContentsMessageSenderClass, installChunkedMessageAcknowledgement } = await import(
  `data:text/javascript;base64,${Buffer.from(build.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); assertions += 1; };
const deepEqual = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };

let baseOptions;
const forwarded = [];
class FakeChunkedSender {
  constructor(options) { baseOptions = options; }
  send(...args) { forwarded.push(["send", ...args]); }
  sendInline(...args) { forwarded.push(["inline", ...args]); }
  sendCritical(...args) { forwarded.push(["critical", ...args]); }
  acknowledge(...args) { forwarded.push(["ack", ...args]); }
}
const warnings = [];
const Sender = createChunkedWebContentsMessageSenderClass({
  ChunkedMessageSenderBase: FakeChunkedSender,
  createLogger: (tag) => () => ({ warning: (...args) => warnings.push([tag, ...args]) }),
  inlineMessageChannel: "message-for-view",
});
const sender = new Sender({ custom: true, retryDelayMs: 5 });

equal(baseOptions.custom, true, "preserves caller options");
equal(baseOptions.retryDelayMs, 1_000, "enforces the original retry delay after caller options");

const sent = [];
const listeners = new Map();
const removed = [];
const target = {
  id: 7,
  destroyed: false,
  loading: true,
  isDestroyed() { return this.destroyed; },
  isLoading() { return this.loading; },
  send: (...args) => sent.push(args),
  once: (event, listener) => listeners.set(event, listener),
  on: (event, listener) => listeners.set(event, listener),
  removeListener: (event, listener) => removed.push([event, listener]),
};

equal(baseOptions.isAvailable(target), true, "reports live web contents as available");
equal(baseOptions.isLoading(target), true, "projects the optional loading state");
baseOptions.deliver(target, { channel: "updates", payload: "whole" }, "chunk");
baseOptions.deliver(target, { channel: "updates", payload: "whole" }, null);
deepEqual(sent, [["updates", "chunk"], ["updates", "whole"]], "delivers chunks and nullish whole payloads faithfully");

const callbacks = { onDestroyed() {}, onLoading() {}, onLoaded() {} };
const unsubscribe = baseOptions.subscribe(target, callbacks);
deepEqual([...listeners.keys()], ["destroyed", "did-start-loading", "did-stop-loading"], "subscribes to destruction and loading transitions");
unsubscribe();
deepEqual(removed.map(([event]) => event), ["destroyed", "did-start-loading", "did-stop-loading"], "removes every installed listener");

baseOptions.onSendError(target, new Error("send failed"));
equal(warnings[0][0], "ChunkedMessageSender", "uses the semantic sender logger tag");
equal(warnings[0][1], "chunked_message_send_failed", "reports the stable send failure event");
deepEqual(warnings[0][2].safe, { webContentsId: 7 }, "keeps webContents id in safe metadata");

sender.send(target, "plain", { value: 1 });
sender.sendInline(target, "inline-channel", { value: 2 });
sender.sendCritical(target, "critical-channel", { value: 3 });
sender.sendInlineMessageForView(target, { value: 4 });
deepEqual(forwarded.slice(0, 4).map(([kind, , message]) => [kind, message]), [
  ["send", { channel: "plain", payload: { value: 1 } }],
  ["inline", { channel: "inline-channel", payload: { value: 2 } }],
  ["critical", { channel: "critical-channel", payload: { value: 3 } }],
  ["inline", { channel: "message-for-view", payload: { value: 4 } }],
], "forwards all priority modes through one payload envelope");
target.destroyed = true;
sender.send(target, "ignored", null);
sender.sendInline(target, "ignored", null);
sender.sendCritical(target, "ignored", null);
equal(forwarded.length, 4, "suppresses every send mode after destruction");

let acknowledgementListener;
installChunkedMessageAcknowledgement({
  acknowledgementChannel: "chunk-ack",
  chunkedMessageSender: sender,
  ipcMain: { on(channel, listener) { equal(channel, "chunk-ack", "registers the configured acknowledgement channel"); acknowledgementListener = listener; } },
  isTrustedIpcEvent: (event) => event.trusted === true,
});
acknowledgementListener({ trusted: false, sender: target }, "message", 1);
acknowledgementListener({ trusted: true, sender: target }, 7, 1);
acknowledgementListener({ trusted: true, sender: target }, "message", 1.5);
equal(forwarded.length, 4, "rejects untrusted and malformed acknowledgements");
acknowledgementListener({ trusted: true, sender: target }, "message", 2);
deepEqual(forwarded[4], ["ack", target, "message", 2], "forwards a trusted validated acknowledgement");

console.log(`${assertions} chunked web-contents sender assertions passed`);
