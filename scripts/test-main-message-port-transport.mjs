import assert from "node:assert/strict";
import fs from "node:fs";
import { MessagePortTransport, createMessagePortRemoteMainFactory } from "../src/main/main-app/app-server/message-port-transport.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const rejects = async (promise, message) => {
  await assert.rejects(promise, { message });
  assertions += 1;
};
const throws = (callback, message) => {
  assert.throws(callback, { message });
  assertions += 1;
};

class FakePort {
  handlers = new Map();
  posted = [];
  startCalls = 0;
  closeCalls = 0;
  throwOnPost = false;
  start() { this.startCalls += 1; }
  on(event, handler) { this.handlers.set(event, handler); }
  postMessage(message) {
    if (this.throwOnPost) throw new Error("post failed");
    this.posted.push(message);
  }
  close() { this.closeCalls += 1; }
  emit(event, value) { this.handlers.get(event)?.(value); }
}

{
  const port = new FakePort();
  const transport = new MessagePortTransport(port);
  equal(transport.encodingLevel, "structuredClonable");
  equal(port.startCalls, 1);
  transport.send({ hello: "world" });
  equal(port.posted, [{ hello: "world" }]);
  port.emit("message", { data: { index: 1 } });
  port.emit("message", { data: { index: 2 } });
  equal(await transport.receive(), { index: 1 });
  equal(await transport.receive(), { index: 2 });
  const pending = transport.receive();
  port.emit("message", { data: { index: 3 } });
  equal(await pending, { index: 3 });
}

{
  const port = new FakePort();
  const transport = new MessagePortTransport(port);
  const pending = transport.receive();
  port.emit("message", { data: null });
  await rejects(pending, "Peer closed MessagePort connection.");
  await rejects(transport.receive(), "Peer closed MessagePort connection.");
  throws(() => transport.send("late"), "Peer closed MessagePort connection.");
  port.emit("close");
  throws(() => transport.send("still late"), "Peer closed MessagePort connection.");
}

{
  const port = new FakePort();
  const transport = new MessagePortTransport(port);
  const pending = transport.receive();
  port.emit("close");
  await rejects(pending, "MessagePort message error.");
  equal(port.closeCalls, 0);
}

{
  const port = new FakePort();
  const transport = new MessagePortTransport(port);
  const error = new Error("aborted");
  transport.abort(error);
  equal(port.posted, [null]);
  equal(port.closeCalls, 1);
  throws(() => transport.send("late"), "aborted");
  await rejects(transport.receive(), "aborted");
}

{
  const port = new FakePort();
  const transport = new MessagePortTransport(port);
  port.throwOnPost = true;
  transport.abort(new Error("abort despite post failure"));
  equal(port.closeCalls, 1);
  await rejects(transport.receive(), "abort despite post failure");
}

{
  const calls = [];
  class RemoteMainTransport {
    constructor(transport, service, options) {
      calls.push({ transport, service, options });
    }
    getRemoteMain() { return { remote: true }; }
  }
  const createRemoteMain = createMessagePortRemoteMainFactory({ RemoteMainTransport });
  const port = new FakePort();
  const service = { id: "service" };
  const options = { id: "options" };
  equal(createRemoteMain(port, service, options), { remote: true });
  equal(calls.length, 1);
  equal(calls[0].transport instanceof MessagePortTransport, true);
  equal(calls[0].service, service);
  equal(calls[0].options, options);
  equal(port.startCalls, 1);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("lrt = createMessagePortRemoteMainFactory({"), true);
equal(main.includes("a = lrt(t, i)"), true);
equal(main.includes("var urt = class"), false);
equal(main.includes("function lrt("), false);
equal(main.includes("Peer closed MessagePort connection."), false);

console.log(`${assertions} main message-port transport assertions passed`);
