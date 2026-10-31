import assert from "node:assert/strict";
import fs from "node:fs";
import { createAutomationsServiceClass } from "../src/main/main-app/automations/automations-service.ts";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const rejects = async (promise, pattern) => { await assert.rejects(promise, pattern); assertions += 1; };
const calls = [];
class DisposableBase {}
const AutomationsService = createAutomationsServiceClass({
  DisposableBase,
  assertWorktreeTargetRequirements: (input) => calls.push(["requirements", input]),
  createLocalAutomation: (input, cwds) => ({ id: "created", input, cwds }),
  executeUpdateTool: async (operations, request, customizeFailure) => {
    calls.push(["tool", request, customizeFailure("ignored")]);
    return { response: { success: true }, operations };
  },
  getLocalAutomation: (id) => ({ id }),
  missingAutomationMessage: "missing automation",
  removeAutomationRegistryEntry: (id) => calls.push(["cleanup", id]),
  removeLocalAutomation: (id) => id === "missing" ? "not_found" : "deleted",
  resolveCompatibilityCwds: (_state, projectId) => [`/projects/${projectId}`],
  updateLocalAutomation: (input, cwds) => input.fail ? null : ({ id: "updated", input, cwds }),
});
let notifications = 0;
const registry = { getConnection: (hostId) => ({ notifyAutomationRunsUpdated: () => { equal(hostId, "local"); notifications += 1; } }) };
const service = new AutomationsService({}, registry, null);
equal(await service.create({ kind: "cron", projectId: "p", executionEnvironment: "local" }), {
  item: { id: "created", input: { kind: "cron", projectId: "p", executionEnvironment: "local" }, cwds: ["/projects/p"] },
});
equal(calls[0], ["requirements", { compatibilityCwds: ["/projects/p"], executionEnvironment: "local", projectId: "p" }]);
equal(await service.create({ kind: "heartbeat", projectId: null }), {
  item: { id: "created", input: { kind: "heartbeat", projectId: null }, cwds: [] },
});
equal(await service.update({ kind: "cron", projectId: "p", executionEnvironment: "local" }), {
  item: { id: "updated", input: { kind: "cron", projectId: "p", executionEnvironment: "local" }, cwds: ["/projects/p"] },
});
await rejects(service.update({ kind: "heartbeat", fail: true }), /missing automation/);
equal(await service.delete({ id: "a" }), { item: { id: "a" }, success: true, status: "deleted" });
equal(await service.delete({ id: "missing" }), { item: { id: "missing" }, success: true, status: "not_found" });
equal(notifications, 2);

const remote = await service.executeUpdateTool({ hostId: "ssh", threadId: "t" });
equal(remote.response.success, false);
equal(remote.response.contentItems[0].text, "Automations are only supported for local threads.");
const local = await service.executeUpdateTool({ hostId: "local", threadId: "t" });
equal(local.response.success, true);
equal(calls.some(([kind]) => kind === "tool"), true);

let asserted = 0;
let contextNotifications = 0;
const context = {
  assertCurrent: () => { asserted += 1; },
  connection: { notifyAutomationRunsUpdated: () => { contextNotifications += 1; } },
};
await service.executeNativeUpdateTool({ hostId: "local", threadId: "t" }, context);
equal(asserted, 1);
await service.deleteWithContext("context", context);
equal(asserted, 2);
equal(contextNotifications, 1);

const habitatCalls = [];
const habitat = {
  create: async (input, cwds) => { habitatCalls.push(["create", input, cwds]); return { id: "habitat" }; },
  update: async (input, cwds) => { habitatCalls.push(["update", input, cwds]); return { id: "habitat" }; },
  delete: async (id) => ({ item: { id }, status: "remove_failed" }),
  isLocalMigrationActive: () => true,
};
const habitatService = new AutomationsService({}, registry, habitat);
equal(await habitatService.create({ kind: "heartbeat" }), { item: { id: "habitat" } });
equal(habitatCalls[0], ["create", { kind: "heartbeat" }, []]);
equal(await habitatService.delete({ id: "x" }), { item: { id: "x" }, success: false, status: "remove_failed" });
equal((await habitatService.executeUpdateTool({ hostId: "local" })).response.contentItems[0].text, "Local automation changes must use the Automations app after migration consent.");

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
const electronFetchHandler = fs.readFileSync(
  new URL("../src/main/main-app/fetch-handler/electron-fetch-handler.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createAutomationsServiceClass({"), true);
equal(main.includes("var CMe = class"), false);
equal(electronFetchHandler.includes("new CMe("), true);

console.log(`${assertions} main automations service assertions passed`);
