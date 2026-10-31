import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";
import { createSavedSectionTransitionClass } from "../src/main/main-app/sidebar/saved-section-transition.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const sourceText = fs.readFileSync(
  new URL("../src/main/main-app/sidebar/saved-section-transition.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(sourceText, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
let classNode;
const visit = (node) => {
  if (node == null || typeof node !== "object") return;
  if (node.type === "ClassExpression" && node.id?.name === "SavedSectionTransition") classNode = node;
  for (const value of Object.values(node)) Array.isArray(value) ? value.forEach(visit) : visit(value);
};
visit(ast);
assert.ok(classNode);
assertions += 1;
equal(classNode.body.body.length, 32);

class RpcHandlerBase {}
const warnings = [];
const Transition = createSavedSectionTransitionClass({
  RpcHandlerBase,
  createLogger: () => () => ({ warning: (...args) => warnings.push(args) }),
  isInternalThreadId: (id) => id.startsWith("internal-"),
});

const serverCalls = [];
const changed = [];
const releases = [];
const state = {
  sections: [
    {
      id: "logical-1",
      name: "Important",
      itemKeys: ["codex:thread:local:thread-1"],
      hostSectionIds: { "host-1": "replica-1" },
    },
  ],
};
const source = {
  server: {
    async listSections(options, context) {
      serverCalls.push(["listSections", options]);
      context.assertCurrent();
      return {
        hostIds: ["host-1"],
        sections: [{ hostId: "host-1", id: "replica-1", name: "Important" }],
      };
    },
    async listSectionThreadIds(request, context) {
      serverCalls.push(["listSectionThreadIds", request]);
      context.assertSourceCurrent();
      return ["thread-1"];
    },
    async createSection(request, context, onMoved) {
      serverCalls.push(["createSection", request]);
      context.getConnection(request.hostId);
      onMoved({ threadId: "thread-1", previousSectionId: null });
      return { id: "created-replica" };
    },
    async updateSection(request) { serverCalls.push(["updateSection", request]); },
    async deleteSection(request) { serverCalls.push(["deleteSection", request]); },
    async setThreadSection(request) {
      serverCalls.push(["setThreadSection", request]);
      return true;
    },
    async discardCreatedSection(...args) { serverCalls.push(["discard", ...args]); },
  },
  read: () => state,
  isSourceCurrent: () => true,
  getConnection: (hostId) => ({ hostId }),
  reserveCreation: (hostId, logicalSectionId) => {
    serverCalls.push(["reserve", hostId, logicalSectionId]);
    return () => releases.push([hostId, logicalSectionId]);
  },
  async onServerChanged(hostId, assertCurrent, request) {
    assertCurrent();
    changed.push([hostId, request]);
  },
};
const affectedState = {
  sections: [
    {
      id: "logical-1",
      before: {
        id: "logical-1",
        name: "Important",
        itemKeys: ["codex:thread:local:thread-1"],
        hostSectionIds: { "host-1": "replica-1" },
      },
      after: {
        id: "logical-1",
        name: "Important",
        itemKeys: ["codex:thread:local:thread-1"],
        hostSectionIds: { "host-1": "replica-1" },
      },
    },
  ],
};
let currentChecks = 0;
const savedReplicas = [];
const completedMigrations = [];
const transition = new Transition(
  source,
  (operation) => operation(),
  (operation) => operation(),
  affectedState,
  { "thread-1": "host-1" },
  "codex:thread:local:thread-1",
  () => { currentChecks += 1; },
  (...args) => {
    savedReplicas.push(args);
    state.sections[0].hostSectionIds[args[1]] = args[2];
    return "applied";
  },
  "host-1",
  (...args) => {
    completedMigrations.push(args);
    return "applied";
  },
);

await transition.listSections({ hostId: "host-1" });
equal(serverCalls[0], ["listSections", { hostId: "host-1" }]);
await transition.listSectionThreadIds({ hostId: "host-1", sectionId: "replica-1" });
equal(serverCalls[1][0], "listSectionThreadIds");
equal(await transition.completeMigration({ hostId: "host-1", operationId: "migration-1" }), "applied");
equal(completedMigrations, [["host-1", "migration-1"]]);
state.sections[0].hostSectionIds = {};

const replica = await transition.createSection({
  hostId: "host-1",
  logicalSectionId: "logical-1",
  name: "Important",
  threadIdToMove: "thread-1",
});
equal(replica, { id: "created-replica" });
equal(
  await transition.saveReplica({
    sectionId: "logical-1",
    hostId: "host-1",
    replicaId: "created-replica",
  }),
  "applied",
);
equal(savedReplicas, [["logical-1", "host-1", "created-replica"]]);
equal(releases, [["host-1", "logical-1"]]);
equal(changed.length, 2);

await transition.updateSection({ hostId: "host-1", sectionId: "replica-1", name: "Renamed" });
equal(serverCalls.some(([name]) => name === "updateSection"), true);
await transition.setThreadSection({ hostId: "host-1", threadId: "thread-1", sectionId: "replica-1" });
equal(serverCalls.some(([name]) => name === "setThreadSection"), true);
await assert.rejects(
  transition.updateSection({ hostId: "host-1", sectionId: "outside" }),
  /Replica is outside this transition/,
);
assertions += 1;
equal(currentChecks > 0, true);

transition[Symbol.dispose]();
await assert.rejects(transition.listSections(), { name: "AbortError" });
assertions += 1;
equal(warnings, []);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("tBe = createSavedSectionTransitionClass({"), true);
equal(main.includes("var tBe = class"), false);
equal(main.includes("tBe,"), true);

console.log(`${assertions} main saved section transition assertions passed`);
