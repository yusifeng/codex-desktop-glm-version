import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { createThreadReadStateOwnerClass } from "../src/main/main-app/thread-read-state/thread-read-state-owner.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const READ_STATE_KEY = "electron-thread-read-state-v1";
const LEGACY_STATE_KEY = "legacy-state";
const LEGACY_PROPERTY = "unread-thread-ids-by-host-v1";
const identity = { kind: "chatgpt", accountId: "account", userId: "user" };

function createHarness({ initialState = {}, currentIdentity = identity, legacyParse = true } = {}) {
  const values = new Map(Object.entries(initialState));
  const accepted = [];
  let identityListener;
  let hostsListener;
  let identityUnsubscribes = 0;
  let hostUnsubscribes = 0;
  let hostKeys = { local: "local-key", remote: "remote-key" };
  let activeIdentity = currentIdentity;
  const globalState = {
    get(key) { return values.get(key); },
    update(key, updater) { values.set(key, updater(values.get(key))); },
  };
  const runtime = createThreadReadStateOwnerClass({
    createHash,
    identityEquals: (left, right) => JSON.stringify(left) === JSON.stringify(right),
    normalizeThreadId: (threadId) => `normalized:${threadId}`,
    readStateKey: READ_STATE_KEY,
    legacyStateKey: LEGACY_STATE_KEY,
    legacyUnreadProperty: LEGACY_PROPERTY,
    legacyUnreadSchema: {
      safeParse(value) {
        return legacyParse && value != null
          ? { success: true, data: value }
          : { success: false };
      },
    },
  });
  const owner = new runtime.ThreadReadStateOwner({
    globalState,
    async readIdentity() { return activeIdentity; },
    getHostKey(hostId) { return hostKeys[hostId] ?? null; },
    listHostKeys() { return { ...hostKeys }; },
    onIdentityChanged(listener) {
      identityListener = listener;
      return () => { identityUnsubscribes += 1; };
    },
    onHostsChanged(listener) {
      hostsListener = listener;
      return () => { hostUnsubscribes += 1; };
    },
    onAcceptedChange(change) { accepted.push(change); },
  });
  return {
    ...runtime,
    accepted,
    globalState,
    owner,
    values,
    emitIdentity: (event) => identityListener(event),
    emitHosts: () => hostsListener(),
    setHostKeys: (value) => { hostKeys = value; },
    setIdentity: (value) => { activeIdentity = value; },
    get identityUnsubscribes() { return identityUnsubscribes; },
    get hostUnsubscribes() { return hostUnsubscribes; },
  };
}

{
  const harness = createHarness();
  equal(harness.identityKey(identity), createHash("sha256").update(JSON.stringify(["chatgpt", "account", "user"])).digest("hex"));
  equal(harness.identityKey({ kind: "api", authMode: "key" }), createHash("sha256").update(JSON.stringify(["api", "key"])).digest("hex"));
  equal(harness.createEmptyReadState(), { version: 1, unreadByIdentity: {} });
  equal(harness.owner.executionHostKeysByHostId, { local: "local-key", remote: "remote-key" });
}

{
  const identityKey = createHarness().identityKey(identity);
  const harness = createHarness({
    initialState: {
      [READ_STATE_KEY]: {
        version: 1,
        unreadByIdentity: { [identityKey]: { "local-key": ["existing"] } },
      },
    },
  });
  const firstEvents = [];
  const secondEvents = [];
  const first = await harness.owner.open((event) => firstEvents.push(event));
  const second = await harness.owner.open((event) => secondEvents.push(event));
  equal(first.status, "ready");
  equal(first.identity, identity);
  equal(first.executionHostKeysByHostId, { local: "local-key", remote: "remote-key" });
  equal(first.unreadThreadIdsByHostId, {
    local: ["normalized:existing"],
    remote: [],
  });
  equal(await first.session.set({ hostId: "local", threadId: "new", hasUnreadTurn: true }), { status: "ok" });
  equal(firstEvents.at(-1), { type: "changed", origin: "self", hostId: "local", threadId: "new", hasUnreadTurn: true });
  equal(secondEvents.at(-1), { type: "changed", origin: "external", hostId: "local", threadId: "new", hasUnreadTurn: true });
  equal(harness.accepted.length, 1);
  equal(harness.accepted[0].context, { identity, executionHostKey: "local-key" });
  const eventCount = firstEvents.length;
  equal(await first.session.set({ hostId: "local", threadId: "new", hasUnreadTurn: true }), { status: "ok" });
  equal(firstEvents.length, eventCount);
  equal(await first.session.set({ hostId: "missing", threadId: "new", hasUnreadTurn: true }), { status: "unavailable" });
  harness.setHostKeys({ local: "changed-key", remote: "remote-key" });
  equal(await first.session.set({ hostId: "local", threadId: "later", hasUnreadTurn: true }), { status: "retired" });
  first.session.unsubscribe();
  equal(await first.session.set({ hostId: "remote", threadId: "later", hasUnreadTurn: true }), { status: "retired" });
}

{
  const harness = createHarness();
  const captured = await harness.owner.captureContext("local");
  equal(captured.context, { identity, executionHostKey: "local-key" });
  equal(captured.isCurrent(), true);
  harness.setHostKeys({ local: "changed-key" });
  equal(captured.isCurrent(), false);
  equal(await harness.owner.captureContext("missing"), null);
}

{
  const harness = createHarness();
  const events = [];
  await harness.owner.open((event) => events.push(event));
  equal(await harness.owner.acceptBroadcast({
    hostId: "local",
    threadId: "broadcast",
    hasUnreadTurn: true,
    context: { identity, executionHostKey: "local-key" },
  }), { status: "ok" });
  equal(events.at(-1).origin, "external");
  equal(harness.accepted.length, 0);
  equal(await harness.owner.acceptBroadcast({
    hostId: "local",
    threadId: "wrong",
    hasUnreadTurn: true,
    context: { identity: { ...identity, userId: "other" }, executionHostKey: "local-key" },
  }), { status: "retired" });
}

{
  const harness = createHarness();
  let retired = 0;
  const writer = harness.owner.openWriter("local", () => { retired += 1; });
  equal(await writer.set({ hostId: "remote", threadId: "one", hasUnreadTurn: true }), { status: "unavailable" });
  equal(await writer.set({ hostId: "local", threadId: "one", hasUnreadTurn: true }), { status: "ok" });
  writer.dispose();
  equal(await writer.set({ hostId: "local", threadId: "two", hasUnreadTurn: true }), { status: "retired" });
  equal(retired, 0);
}

{
  const harness = createHarness();
  const events = [];
  const opened = await harness.owner.open((event) => events.push(event));
  equal(await opened.session.clearForLogout(), { status: "ok" });
  equal(events.at(-1), { type: "retired", reason: "identity" });
  equal(harness.values.get(READ_STATE_KEY).unreadByIdentity, {});
  equal(await opened.session.clearForLogout(), { status: "retired" });
  equal(await harness.owner.captureContext("local"), null);
  harness.emitIdentity({ type: "identity", identity });
  const reopened = await harness.owner.open(() => {});
  equal(reopened.status, "ready");
}

{
  const harness = createHarness();
  const events = [];
  await harness.owner.open((event) => events.push(event));
  harness.emitHosts();
  equal(events.at(-1), { type: "retired", reason: "hosts" });
  harness.owner.dispose();
  harness.owner.dispose();
  equal(harness.identityUnsubscribes, 1);
  equal(harness.hostUnsubscribes, 1);
  equal(await harness.owner.open(() => {}), { status: "unavailable" });
}

{
  const harness = createHarness({
    initialState: {
      [LEGACY_STATE_KEY]: {
        [LEGACY_PROPERTY]: { local: ["legacy-one", "legacy-two"] },
        retained: true,
      },
    },
  });
  const opened = await harness.owner.open(() => {});
  equal(opened.unreadThreadIdsByHostId.local, ["normalized:legacy-one", "normalized:legacy-two"]);
  equal(harness.values.get(LEGACY_STATE_KEY), { retained: true });
  const migration = harness.values.get(READ_STATE_KEY).legacyMigration;
  equal(migration.adoptedHostIds, { local: "local-key" });
}

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("ThreadReadStateOwner: Ont"), true);
equal(main.includes("g = new Ont({"), true);
equal(main.includes("Ont = class"), false);
equal(main.includes("function L5("), false);
equal(main.includes("function R5("), false);

console.log(`${assertions} main thread read-state owner assertions passed`);
