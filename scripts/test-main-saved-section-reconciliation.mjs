import assert from "node:assert/strict";
import fs from "node:fs";
import { createSavedSectionReconciliationClass } from "../src/main/main-app/sidebar/saved-section-reconciliation.ts";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const rejects = async (promise, pattern) => { await assert.rejects(promise, pattern); assertions += 1; };
class DisposableBase {}
const Reconciliation = createSavedSectionReconciliationClass({
  EH: (state) => state,
  TH: (state) => state,
  _: { randomUUID: () => "uuid" },
  n: { Uf: DisposableBase },
  vH: async () => "applied",
});
const calls = [];
const state = { sections: [] };
const source = {
  read: () => state,
  isSourceCurrent: () => true,
  getConnection: (hostId) => { calls.push(["connection", hostId]); return {}; },
  server: {
    listSections: async (request) => { calls.push(["list", request]); return { sections: [] }; },
    listSectionThreadIds: async (request) => { calls.push(["members", request]); return ["thread"]; },
  },
};
const listQuery = new Reconciliation(source, "local", null, () => true);
equal(listQuery instanceof DisposableBase, true);
equal(await listQuery.readList(), { sections: [] });
equal(calls.some(([kind]) => kind === "list"), true);
await rejects(listQuery.readList(), /already read/);
equal(await listQuery.commitList({ threadHostIds: {}, boundThreadIds: [], operationId: "op" }), "applied");

const memberState = { sections: [{ id: "logical", hostSectionIds: { local: "section" } }] };
const memberSource = { ...source, read: () => memberState };
const memberQuery = new Reconciliation(memberSource, "local", "section", () => true);
equal(await memberQuery.readMembers(), ["thread"]);
equal(await memberQuery.commitMembers({ threadHostIds: {}, boundThreadIds: [], operationId: "op" }), "applied");
memberQuery[Symbol.dispose]();
await rejects(memberQuery.readMembers(), /Saved section query retired/);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("rBe = createSavedSectionReconciliationClass({"), true);
equal(main.includes("rBe = class"), false);
equal(main.includes("new rBe("), true);
console.log(`${assertions} main saved-section reconciliation assertions passed`);
