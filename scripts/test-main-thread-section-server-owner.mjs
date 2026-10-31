import assert from "node:assert/strict";
import fs from "node:fs";
import { createThreadSectionServerClass } from "../src/main/main-app/sidebar/thread-section-server.ts";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
class SectionEngine {
  constructor(transport) { this.transport = transport; }
}
const dependencies = new Proxy({ Se: SectionEngine }, {
  get(target, property) { return Object.hasOwn(target, property) ? target[property] : (() => undefined); },
});
const ThreadSectionServer = createThreadSectionServerClass(dependencies);
const globalState = { get: () => [], set: () => {} };
const registry = { getAllHostIds: () => [], getMaybeConnection: () => null };
const server = new ThreadSectionServer(globalState, registry);
equal(ThreadSectionServer.name, "ThreadSectionServer");
equal(server.globalState, globalState);
equal(server.appServerConnectionRegistry, registry);
equal(server.threadSectionEngine instanceof SectionEngine, true);
equal(Object.keys(server.threadSectionEngine.transport).sort(), [
  "createSection",
  "deleteSection",
  "listSections",
  "listThreads",
  "moveThread",
  "readThread",
  "updateSection",
]);
equal(server.observedConnections instanceof WeakSet, true);
equal(server.threadLookupsByConnection instanceof WeakMap, true);
equal(server.pendingHostMutations instanceof Map, true);
equal(server.pendingMigrationMarkers instanceof Set, true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("$ze = createThreadSectionServerClass({"), true);
equal(main.includes("$ze = class"), false);
equal(main.includes("PinnedThreadServer: $ze"), true);
const owner = fs.readFileSync(new URL("../src/main/main-app/sidebar/thread-section-server.ts", import.meta.url), "utf8");
equal(owner.includes("return class ThreadSectionServer"), true);
equal(owner.split("\n").length > 450, true);

console.log(`${assertions} main thread section server assertions passed`);
