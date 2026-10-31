import assert from "node:assert/strict";
import fs from "node:fs";
import { createAuthorizedThreadCatalogServiceClass } from "../src/main/main-app/thread-catalog/authorized-service.ts";

const calls = [];
let principalChange;
let statusListener;
let observationListener;
let populationDisposals = 0;
let sourceDisposals = 0;
let statusSubscriptionDisposals = 0;
let observationSubscriptionDisposals = 0;
let principalUnsubscribes = 0;
let currentPrincipal = { accountId: "account-1", userId: "user-1" };
const coordinators = new Map([
  ["local", { handleNotification: (value) => calls.push(["notification", value]), invalidateSource: () => calls.push(["invalidate"]) }],
]);
const manager = {
  readThreadCount: (hostId) => `count:${hostId}`,
  readPage: (request) => request,
  readEntries: (requests) => requests,
  removeMissingEntry: (request) => request,
  readStatus: () => ({ hosts: [{ hostId: "local" }, { hostId: "chatgpt:account-1:user-1" }, { hostId: "chatgpt:other:user" }] }),
  subscribeStatus: (listener) => { statusListener = listener; return { dispose: () => statusSubscriptionDisposals++ }; },
  subscribeThreadObservations: (listener) => { observationListener = listener; return { dispose: () => observationSubscriptionDisposals++ }; },
  acquirePopulation: () => ({ dispose: () => populationDisposals++ }),
  acquireSource: (source) => {
    calls.push(["source", source]);
    coordinators.set(source.hostId, { handleNotification: (value) => calls.push(["cloud-notification", value]), invalidateSource: () => calls.push(["cloud-invalidate"]) });
    return { dispose: () => sourceDisposals++ };
  },
  getCoordinator: (hostId) => coordinators.get(hostId),
  requestSync: async (hosts, priority) => calls.push(["sync", hosts, priority]),
  requestStartupSync: async () => calls.push(["startup-sync"]),
};
const principal = {
  onPrincipalChange: (listener) => { principalChange = listener; return () => principalUnsubscribes++; },
  getPrincipal: async () => currentPrincipal,
  createSource: (hostId) => ({ hostId }),
};
const scope = {
  en: () => ({
    error: undefined,
    u(value) { return value; },
    set e(error) { this.error = error; },
    d() { if (this.error) throw this.error; },
  }),
};
const AuthorizedService = createAuthorizedThreadCatalogServiceClass({
  runtime: { Uf: class {} },
  disposalScope: scope,
});
const service = new AuthorizedService(manager, principal);

assert.equal(service.readThreadCount("local"), "count:local");
assert.throws(() => service.readThreadCount("chatgpt:account-1:user-1"), /not authorized/);
assert.deepEqual(service.readStatus().hosts.map(({ hostId }) => hostId), ["local"]);

await service.setSourceEnabled({ kind: "app-server" }, true);
await service.setSourceEnabled({ kind: "app-server" }, true);
await service.setSourceEnabled({ kind: "app-server" }, false);
assert.equal(populationDisposals, 1);

await service.setSourceEnabled({ kind: "account", accountId: "account-1" }, true);
const cloudHost = "chatgpt:account-1:user-1";
assert.equal(calls.some(([kind, source]) => kind === "source" && source.hostId === cloudHost), true);
assert.deepEqual(service.readStatus().hosts.map(({ hostId }) => hostId), ["local", cloudHost]);
assert.equal(service.readThreadCount(cloudHost), `count:${cloudHost}`);

await service.notifyThread({ hostId: "local", threadId: "thread-1" }, "remove");
assert.deepEqual(calls.find(([kind]) => kind === "notification")[1], { method: "thread/archived", params: { threadId: "thread-1" } });
service.invalidateSource("local");
assert.equal(calls.some(([kind]) => kind === "invalidate"), true);
await service.requestSync(["local", cloudHost]);
await service.requestStartupSync();
assert.equal(calls.some(([kind]) => kind === "sync"), true);
assert.equal(calls.some(([kind]) => kind === "startup-sync"), true);

function createRpcCallback(deliveries) {
  const callback = (value) => deliveries.push(value);
  callback.dup = () => callback;
  callback.onRpcBroken = (handler) => { callback.break = handler; };
  callback[Symbol.dispose] = () => { callback.disposals = (callback.disposals ?? 0) + 1; };
  return callback;
}
const statuses = [];
const statusCallback = createRpcCallback(statuses);
service.subscribeStatus(statusCallback);
statusListener(manager.readStatus());
assert.deepEqual(statuses.at(-1).hosts.map(({ hostId }) => hostId), ["local", cloudHost]);

const observations = [];
const observationCallback = createRpcCallback(observations);
service.subscribeThreadObservations(observationCallback);
observationListener({ hostId: "chatgpt:other:user", threadId: "ignored" });
observationListener({ hostId: cloudHost, threadId: "accepted" });
observationListener({ hostId: "local", threadId: "local" });
assert.deepEqual(observations.map(({ threadId }) => threadId), ["accepted", "local"]);

currentPrincipal = { accountId: "other", userId: "user-2" };
principalChange({ current: currentPrincipal });
assert.equal(sourceDisposals, 1);
assert.deepEqual(service.readStatus().hosts.map(({ hostId }) => hostId), ["local"]);

service[Symbol.dispose]();
assert.equal(statusSubscriptionDisposals, 1);
assert.equal(observationSubscriptionDisposals, 1);
assert.equal(statusCallback.disposals, 1);
assert.equal(observationCallback.disposals, 1);
assert.equal(principalUnsubscribes, 1);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /d1e = createAuthorizedThreadCatalogServiceClass\(\{/);
assert.doesNotMatch(main, /d1e = class/);

console.log("authorized thread catalog service assertions: 25");
