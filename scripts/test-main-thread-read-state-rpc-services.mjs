import assert from "node:assert/strict";
import fs from "node:fs";
import { createThreadReadStateRpcServices } from "../src/main/main-app/thread-read-state/rpc-services.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

function createCallbackHandle() {
  const events = [];
  let brokenHandler;
  let disposals = 0;
  const callback = (event) => {
    events.push(event);
    return { disposed: false };
  };
  callback.onRpcBroken = (handler) => { brokenHandler = handler; };
  callback[Symbol.dispose] = () => { disposals += 1; };
  return {
    events,
    handle: { dup: () => callback },
    breakRpc: () => brokenHandler(),
    get disposals() { return disposals; },
  };
}

function createHarness(openImpl) {
  const scopeCalls = [];
  const sessionCalls = [];
  const session = {
    set(value) { sessionCalls.push(["set", value]); return "set-result"; },
    clearForLogout() { sessionCalls.push(["clearForLogout"]); return "clear-result"; },
    [Symbol.dispose]() { sessionCalls.push(["dispose"]); },
  };
  const owner = {
    executionHostKeysByHostId: new Map([["local", "key"]]),
    async open(listener, options) {
      return openImpl ? openImpl(listener, options, session) : { status: "ready", session, revision: 3 };
    },
  };
  const classes = createThreadReadStateRpcServices({
    RpcHandlerBase: class {},
    createUsingScope: () => ({
      e: undefined,
      u(value) { scopeCalls.push(["use", value]); return value; },
      d() { scopeCalls.push(["disposeScope"]); },
    }),
  });
  return {
    ...classes,
    owner,
    scopeCalls,
    service: new classes.ThreadReadStateService(owner),
    session,
    sessionCalls,
  };
}

{
  const harness = createHarness();
  equal(await harness.service.getExecutionHostKeys(), new Map([["local", "key"]]));
}

{
  let listener;
  let receivedOptions;
  const harness = createHarness(async (nextListener, options, session) => {
    listener = nextListener;
    receivedOptions = options;
    return { status: "ready", session, revision: 7 };
  });
  const callback = createCallbackHandle();
  const result = await harness.service.open(callback.handle, { hostId: "local" });
  equal(receivedOptions, { hostId: "local" });
  equal(result.status, "ready");
  equal(result.revision, 7);
  equal(result.session instanceof harness.ThreadReadStateSession, true);
  equal(result.session.set({ unread: true }), "set-result");
  equal(result.session.clearForLogout(), "clear-result");
  equal(harness.sessionCalls, [["set", { unread: true }], ["clearForLogout"]]);
  listener({ type: "updated", unread: true });
  equal(callback.events, [{ type: "updated", unread: true }]);
  equal(harness.scopeCalls.length, 2);
  callback.breakRpc();
  equal(harness.sessionCalls.at(-1), ["dispose"]);
  equal(callback.disposals, 1);
  result.session.unsubscribe();
  equal(harness.sessionCalls.filter(([name]) => name === "dispose").length, 2);
  equal(callback.disposals, 1);
}

{
  const callback = createCallbackHandle();
  const harness = createHarness(async () => ({ status: "unavailable", reason: "logged-out" }));
  equal(await harness.service.open(callback.handle, { hostId: "local" }), {
    status: "unavailable",
    reason: "logged-out",
  });
  equal(callback.disposals, 1);
  equal(harness.sessionCalls, []);
}

{
  const expectedError = Error("open failed");
  const callback = createCallbackHandle();
  const harness = createHarness(async () => { throw expectedError; });
  await assert.rejects(harness.service.open(callback.handle, {}), expectedError);
  assertions += 1;
  equal(callback.disposals, 1);
}

{
  const callback = createCallbackHandle();
  const harness = createHarness(async (listener, _options, session) => {
    listener({ type: "retired" });
    return { status: "ready", session };
  });
  const result = await harness.service.open(callback.handle, {});
  equal(callback.events, [{ type: "retired" }]);
  equal(harness.sessionCalls, [["dispose"]]);
  equal(callback.disposals, 1);
  equal(result.session instanceof harness.ThreadReadStateSession, true);
}

{
  let listener;
  const callback = createCallbackHandle();
  const harness = createHarness(async (nextListener, _options, session) => {
    listener = nextListener;
    return { status: "ready", session };
  });
  await harness.service.open(callback.handle, {});
  listener({ type: "retired" });
  equal(harness.sessionCalls, [["dispose"]]);
  equal(callback.disposals, 1);
}

{
  let cleanupCalls = 0;
  let sessionDisposals = 0;
  const { ThreadReadStateSession } = createHarness();
  const session = new ThreadReadStateSession(
    { [Symbol.dispose]() { sessionDisposals += 1; } },
    () => { cleanupCalls += 1; },
  );
  session[Symbol.dispose]();
  session[Symbol.dispose]();
  equal(sessionDisposals, 2);
  equal(cleanupCalls, 1);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("ThreadReadStateService: jnt"), true);
equal(main.includes("ThreadReadStateSession: Mnt"), true);
equal(main.includes("threadReadState: new jnt(this.threadReadState.owner)"), true);
equal(main.includes("jnt = class"), false);
equal(main.includes("Mnt = class"), false);

console.log(`${assertions} main thread read-state RPC service assertions passed`);
