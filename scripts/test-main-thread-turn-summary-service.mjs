import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { createThreadTurnSummaryServiceClass } from "../src/main/main-app/threads/thread-turn-summary-service.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const deferred = () => {
  let resolve;
  const promise = new Promise((onResolve) => { resolve = onResolve; });
  return { promise, resolve };
};

function createHarness({ principal = { userId: "user", accountId: "account" }, getPrincipal } = {}) {
  const records = new Map();
  const storeCalls = [];
  const warnings = [];
  const scopes = [];
  let hostKey = "host-key";
  let hostRemoved;
  let principalChanged;
  let hostUnsubscribes = 0;
  let principalUnsubscribes = 0;
  const key = (principalIdentity, currentHostKey, threadId) =>
    `${principalIdentity}\0${currentHostKey}\0${threadId}`;
  const store = {
    readMany(principalIdentity, currentHostKey, threadIds) {
      storeCalls.push(["readMany", principalIdentity, currentHostKey, threadIds]);
      return threadIds.flatMap((threadId) => {
        const value = records.get(key(principalIdentity, currentHostKey, threadId));
        return value == null ? [] : [{ threadId, ...value }];
      });
    },
    set(principalIdentity, currentHostKey, threadId, summary, revision, compactSummary, compactSummaryTurnKey) {
      storeCalls.push(["set", principalIdentity, currentHostKey, threadId, summary, revision, compactSummary, compactSummaryTurnKey]);
      const storageKey = key(principalIdentity, currentHostKey, threadId);
      if ((records.get(storageKey)?.revision ?? -1) >= revision) return false;
      records.set(storageKey, { summary, revision, ...(compactSummary == null ? {} : { compactSummary, compactSummaryTurnKey }) });
      return true;
    },
    delete(principalIdentity, currentHostKey, threadId) {
      storeCalls.push(["delete", principalIdentity, currentHostKey, threadId]);
      records.delete(key(principalIdentity, currentHostKey, threadId));
    },
  };
  const ThreadTurnSummaryService = createThreadTurnSummaryServiceClass({
    RpcHandlerBase: class {},
    createLogger: (name) => ({ warning(message, details) { warnings.push([name, message, details]); } }),
    createHash,
    createUsingScope: () => ({
      e: undefined,
      u(value) { scopes.push(["use", value]); return value; },
      d() { scopes.push(["dispose"]); },
    }),
  });
  const service = new ThreadTurnSummaryService({
    getPrincipal: getPrincipal ?? (async () => principal),
    getStore: () => store,
    getHostKey: () => hostKey,
    onHostRemoved(listener) { hostRemoved = listener; return () => { hostUnsubscribes += 1; }; },
    onPrincipalChange(listener) { principalChanged = listener; return () => { principalUnsubscribes += 1; }; },
  });
  return {
    records,
    service,
    scopes,
    store,
    storeCalls,
    warnings,
    hostRemoved: (hostId) => hostRemoved(hostId),
    principalChanged: (event) => principalChanged(event),
    setHostKey: (value) => { hostKey = value; },
    get hostUnsubscribes() { return hostUnsubscribes; },
    get principalUnsubscribes() { return principalUnsubscribes; },
  };
}

function createCallbackHandle() {
  const events = [];
  let broken;
  let disposals = 0;
  const callback = (event) => { events.push(event); return `delivered:${events.length}`; };
  callback.onRpcBroken = (listener) => { broken = listener; };
  callback[Symbol.dispose] = () => { disposals += 1; };
  return {
    events,
    handle: { dup: () => callback },
    breakRpc: () => broken(),
    get disposals() { return disposals; },
  };
}

const principalIdentity = createHash("sha256").update("user\0account").digest("hex");

{
  const harness = createHarness();
  equal(await harness.service.getPrincipalIdentity({ hostId: "local" }), principalIdentity);
  harness.setHostKey(null);
  equal(await harness.service.getPrincipalIdentity({ hostId: "local" }), null);
  equal(await harness.service.readMany({ hostId: "local", threadIds: [] }), []);
}

{
  const harness = createHarness();
  harness.records.set(`${principalIdentity}\0host-key\0thread-1`, { summary: "Stored", revision: 2 });
  equal(await harness.service.readMany({ hostId: "local", threadIds: ["thread-1", "missing"] }), [
    { hostId: "local", threadId: "thread-1", summary: "Stored", revision: 2 },
  ]);
  equal(harness.service.visibleSummaries.size, 1);
}

{
  const harness = createHarness();
  const callback = createCallbackHandle();
  const subscription = await harness.service.subscribe(callback.handle);
  equal(
    await harness.service.setSummary({
      hostId: "local",
      threadId: "thread-1",
      summary: "  A   useful   summary  ",
      compactSummary: " compact   summary ",
      compactSummaryTurnKey: "turn-3",
      revision: 3,
      principalIdentity,
    }),
    true,
  );
  equal(callback.events, [{
    hostId: "local",
    threadId: "thread-1",
    summary: "A useful summary",
    compactSummary: "compact summary",
    compactSummaryTurnKey: "turn-3",
    revision: 3,
  }]);
  equal(harness.storeCalls.find(([name]) => name === "set").slice(3), [
    "thread-1", "A useful summary", 3, "compact summary", "turn-3",
  ]);
  equal(harness.scopes.length, 2);
  subscription.unsubscribe();
  subscription.unsubscribe();
  equal(callback.disposals, 1);
  callback.breakRpc();
  equal(callback.disposals, 1);
}

{
  const harness = createHarness();
  const invalid = [
    { threadId: "", summary: "ok", revision: 0 },
    { threadId: "t", summary: "   ", revision: 0 },
    { threadId: "t", summary: "ok", compactSummary: "", compactSummaryTurnKey: "turn", revision: 0 },
    { threadId: "t", summary: "ok", compactSummary: "compact", revision: 0 },
    { threadId: "t", summary: "ok", compactSummaryTurnKey: "turn", revision: 0 },
    { threadId: "t", summary: "ok", revision: -1 },
    { threadId: "t", summary: "ok", revision: 1.5 },
  ];
  for (const input of invalid) {
    equal(await harness.service.setSummary({ hostId: "local", principalIdentity, ...input }), false);
  }
  equal(await harness.service.setSummary({ hostId: "local", threadId: "t", summary: "ok", revision: 0, principalIdentity: "wrong" }), false);
  equal(harness.storeCalls.length, 0);
}

{
  const harness = createHarness();
  const callback = createCallbackHandle();
  await harness.service.subscribe(callback.handle);
  equal(await harness.service.setSummary({ hostId: "local", threadId: "thread-1", summary: "one", revision: 5, principalIdentity }), true);
  await harness.service.delete({ hostId: "local", threadId: "thread-1" });
  equal(callback.events.at(-1), { hostId: "local", threadId: "thread-1", summary: null, revision: 6 });
  await harness.service.delete({ hostId: "local", threadId: "thread-1" });
  equal(callback.events.at(-1).revision, 7);
  equal(await harness.service.setSummary({ hostId: "local", threadId: "thread-1", summary: "stale", revision: 7, principalIdentity }), false);
  equal(await harness.service.setSummary({ hostId: "local", threadId: "thread-1", summary: "fresh", revision: 8, principalIdentity }), true);
}

{
  const harness = createHarness();
  const callback = createCallbackHandle();
  await harness.service.subscribe(callback.handle);
  equal(await harness.service.setSummary({ hostId: "remote", threadId: "thread-1", summary: "visible", revision: 1, principalIdentity }), true);
  harness.hostRemoved("other");
  equal(callback.events.length, 1);
  harness.hostRemoved("remote");
  equal(callback.events.at(-1), { hostId: "remote", threadId: "thread-1", summary: null, revision: 2 });
  equal(harness.service.visibleSummaries.size, 0);
}

{
  const principalRequest = deferred();
  const harness = createHarness({ getPrincipal: () => principalRequest.promise });
  const pending = harness.service.getPrincipalIdentity({ hostId: "local" });
  harness.principalChanged({ previous: { userId: "old" } });
  principalRequest.resolve({ userId: "user", accountId: "account" });
  equal(await pending, null);
}

{
  const expectedError = Error("principal failed");
  const harness = createHarness({ getPrincipal: async () => { throw expectedError; } });
  equal(await harness.service.readMany({ hostId: "local", threadIds: ["one"] }), []);
  equal(harness.warnings[0][1], "Failed to access task turn summaries");
  equal(harness.warnings[0][2].sensitive.error, expectedError);
}

{
  const harness = createHarness();
  const callback = createCallbackHandle();
  await harness.service.subscribe(callback.handle);
  harness.service.dispose();
  harness.service.dispose();
  equal(callback.disposals, 1);
  equal(harness.hostUnsubscribes, 1);
  equal(harness.principalUnsubscribes, 1);
  equal(await harness.service.getPrincipalIdentity({ hostId: "local" }), null);
  await assert.rejects(harness.service.subscribe(createCallbackHandle().handle), (error) => error.name === "AbortError");
  assertions += 1;
}

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("Nnt = createThreadTurnSummaryServiceClass({"), true);
equal(main.includes("new Nnt({"), true);
equal(main.includes("Nnt = class"), false);
equal(main.includes("Pnt = class"), false);
equal(main.includes("function z5("), false);
equal(main.includes("function B5("), false);

console.log(`${assertions} main thread turn-summary service assertions passed`);
