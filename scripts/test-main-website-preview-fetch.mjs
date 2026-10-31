import assert from "node:assert/strict";
import fs from "node:fs";
import { createWebsitePreviewFetch } from "../src/main/main-app/network/website-preview-fetch.ts";

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

class Emitter {
  listeners = new Map();

  on(name, listener) {
    const listeners = this.listeners.get(name) ?? [];
    listeners.push(listener);
    this.listeners.set(name, listeners);
    return this;
  }

  emit(name, ...args) {
    for (const listener of [...(this.listeners.get(name) ?? [])]) listener(...args);
  }
}

class FakeRequest extends Emitter {
  endCalls = 0;
  abortCalls = 0;

  end() {
    this.endCalls += 1;
  }

  abort() {
    this.abortCalls += 1;
  }
}

class FakeIncomingResponse extends Emitter {
  constructor(statusCode, headers = {}) {
    super();
    this.statusCode = statusCode;
    this.headers = headers;
  }
}

function createSignal() {
  return {
    aborted: false,
    reason: undefined,
    listeners: [],
    addCalls: [],
    removeCalls: [],
    throwIfAborted() {
      if (this.aborted) throw this.reason;
    },
    addEventListener(name, listener, options) {
      this.addCalls.push({ name, options });
      this.listeners.push(listener);
    },
    removeEventListener(name, listener) {
      this.removeCalls.push({ name, listener });
      this.listeners = this.listeners.filter((candidate) => candidate !== listener);
    },
    abort(reason = new DOMException("external", "AbortError")) {
      this.aborted = true;
      this.reason = reason;
      for (const listener of [...this.listeners]) listener();
    },
  };
}

function createHarness(overrides = {}) {
  const requests = [];
  const options = [];
  const fetchPreview = createWebsitePreviewFetch({
    request(requestOptions) {
      options.push(requestOptions);
      const request = new FakeRequest();
      requests.push(request);
      return request;
    },
    ...overrides,
  });
  return { fetchPreview, requests, options };
}

{
  const harness = createHarness();
  const signal = createSignal();
  const pending = harness.fetchPreview("https://example.com/article", { signal });
  equal(harness.options, [{
    url: "https://example.com/article",
    method: "GET",
    credentials: "omit",
    redirect: "manual",
    referrerPolicy: "no-referrer",
  }]);
  equal(harness.requests[0].endCalls, 1);
  equal(harness.requests[0].abortCalls, 0);
  equal(signal.addCalls, [{ name: "abort", options: { once: true } }]);
  const incoming = new FakeIncomingResponse(200, {
    "content-type": "text/plain",
    "set-cookie": ["one=1", "two=2"],
  });
  harness.requests[0].emit("response", incoming);
  const response = await pending;
  equal(response.status, 200);
  equal(response.headers.get("content-type"), "text/plain");
  equal(response.headers.get("set-cookie"), "one=1, two=2");
  incoming.emit("data", new TextEncoder().encode("hello "));
  incoming.emit("data", new TextEncoder().encode("world"));
  incoming.emit("end");
  equal(await response.text(), "hello world");
  equal(signal.removeCalls.length, 1);
  equal(signal.listeners.length, 0);
}

{
  const harness = createHarness();
  const reason = Error("already canceled");
  const signal = createSignal();
  signal.aborted = true;
  signal.reason = reason;
  assert.throws(() => harness.fetchPreview("https://example.com", { signal }), reason);
  assertions += 1;
  equal(harness.requests.length, 0, "pre-aborted requests must not allocate Electron net state");
}

{
  const harness = createHarness();
  const signal = createSignal();
  const pending = harness.fetchPreview("https://example.com", { signal });
  signal.abort();
  await assert.rejects(pending, (error) => error.name === "AbortError" && error.message === "Website preview canceled");
  assertions += 1;
  equal(harness.requests[0].abortCalls, 1);
  equal(signal.removeCalls.length, 1);
  harness.requests[0].emit("error", Error("late"));
  equal(harness.requests[0].abortCalls, 1, "terminal errors must settle only once");
}

{
  const harness = createHarness();
  const pending = harness.fetchPreview("https://example.com");
  const failure = Error("network down");
  harness.requests[0].emit("error", failure);
  await assert.rejects(pending, failure);
  assertions += 1;
  equal(harness.requests[0].abortCalls, 1);
}

{
  const harness = createHarness();
  const signal = createSignal();
  const pending = harness.fetchPreview("https://example.com/start", { signal });
  harness.requests[0].emit("redirect", 302, "GET", "https://example.com/final");
  const response = await pending;
  equal(response.status, 302);
  equal(response.headers.get("location"), "https://example.com/final");
  equal(harness.requests[0].abortCalls, 1);
  equal(signal.listeners.length, 0);
  harness.requests[0].emit("response", new FakeIncomingResponse(200));
  equal(harness.requests[0].abortCalls, 1);
}

{
  const harness = createHarness();
  const pending = harness.fetchPreview("https://example.com");
  harness.requests[0].emit("redirect", 999, "GET", "https://example.com/final");
  await assert.rejects(
    pending,
    (error) => error.message === "Invalid website preview redirect" && error.cause instanceof RangeError,
  );
  assertions += 1;
  equal(harness.requests[0].abortCalls, 1);
}

for (const statusCode of [204, 205, 304]) {
  const harness = createHarness();
  const signal = createSignal();
  const pending = harness.fetchPreview("https://example.com/no-body", { signal });
  const incoming = new FakeIncomingResponse(statusCode, { "x-preview": "empty" });
  harness.requests[0].emit("response", incoming);
  const response = await pending;
  equal(response.status, statusCode);
  equal(response.body, null);
  equal(response.headers.get("x-preview"), "empty");
  await Promise.resolve();
  equal(harness.requests[0].abortCalls, 1);
  equal(signal.listeners.length, 0);
}

{
  const harness = createHarness({ maxResponseBytes: 5 });
  const pending = harness.fetchPreview("https://example.com/large");
  const incoming = new FakeIncomingResponse(200);
  harness.requests[0].emit("response", incoming);
  const response = await pending;
  const body = response.text();
  incoming.emit("data", new TextEncoder().encode("12345"));
  equal(harness.requests[0].abortCalls, 0, "the exact response limit remains valid");
  incoming.emit("data", new TextEncoder().encode("6"));
  await assert.rejects(body, /Website preview response is too large/);
  assertions += 1;
  equal(harness.requests[0].abortCalls, 1);
}

{
  const harness = createHarness();
  const signal = createSignal();
  const pending = harness.fetchPreview("https://example.com/stream-error", { signal });
  const incoming = new FakeIncomingResponse(200);
  harness.requests[0].emit("response", incoming);
  const response = await pending;
  const body = response.text();
  const failure = Error("body failed");
  incoming.emit("error", failure);
  await assert.rejects(body, failure);
  assertions += 1;
  equal(harness.requests[0].abortCalls, 1);
  equal(signal.listeners.length, 0);
}

{
  const harness = createHarness();
  const pending = harness.fetchPreview("https://example.com/aborted-stream");
  const incoming = new FakeIncomingResponse(200);
  harness.requests[0].emit("response", incoming);
  const response = await pending;
  const body = response.text();
  incoming.emit("aborted");
  await assert.rejects(body, (error) => error.name === "AbortError");
  assertions += 1;
  equal(harness.requests[0].abortCalls, 1);
}

{
  const harness = createHarness();
  const pending = harness.fetchPreview("https://example.com/cancel");
  const incoming = new FakeIncomingResponse(200);
  harness.requests[0].emit("response", incoming);
  const response = await pending;
  await response.body.cancel();
  equal(harness.requests[0].abortCalls, 1);
  incoming.emit("data", new Uint8Array([1]));
  equal(harness.requests[0].abortCalls, 1);
}

{
  const harness = createHarness();
  const pending = harness.fetchPreview("https://example.com/invalid-response");
  harness.requests[0].emit("response", new FakeIncomingResponse(999));
  await assert.rejects(
    pending,
    (error) => error.message === "Invalid website preview response" && error.cause instanceof RangeError,
  );
  assertions += 1;
  equal(harness.requests[0].abortCalls, 1);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const windowContext = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context.ts", import.meta.url),
  "utf8",
);
equal(main.includes("var qnt = createWebsitePreviewFetch({"), true);
equal(main.includes("function qnt("), false);
equal(windowContext.includes("new n.nf(qnt)"), true, "WindowContext must keep consuming the migrated fetch");
equal(main.includes("Website preview response is too large"), false);

console.log(`${assertions} main website-preview fetch assertions passed`);
