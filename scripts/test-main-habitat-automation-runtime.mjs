import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL("../src/main/main-app/automations/habitat-runtime.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const { createHabitatAutomationRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(transpiled.code).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};
const flush = async () => {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
};

const serviceInstances = [];
class HabitatAutomationsService {
  constructor(...args) {
    this.args = args;
    this.principals = [];
    this.syncCalls = 0;
    serviceInstances.push(this);
  }
  handlePrincipalChanged(principal) { this.principals.push(principal); }
  async sync() { this.syncCalls += 1; }
  deleteArchivedHeartbeat(id) { return `deleted:${id}`; }
  getHostedInstallationId() { return "installation"; }
  isLocalMigrationActive() { return true; }
}

const warnings = [];
const ownerRequests = [];
const runtime = createHabitatAutomationRuntime({
  HabitatAutomationsService,
  getDesktopFeatureAvailability: () => ({ localAutomationHabitatMigration: true }),
  fetch: async () => "fetched",
  completionSchema: { safeParse: (value) => ({ success: value?.hosted === true }) },
  threadIdOf: (value) => `parsed:${value}`,
  async requestThreadOwner(coordination, hostId, threadId) {
    ownerRequests.push([coordination, hostId, threadId]);
    if (coordination === "reject") throw Error("unavailable");
    return coordination === "owner";
  },
  logger: { warning: (...args) => warnings.push(args) },
});

let principalHandler;
let notificationHandler;
const cleanup = [];
const connection = {
  registerInternalAuthenticatedPrincipalChangeHandler(handler) {
    principalHandler = handler;
    return () => cleanup.push("principal");
  },
  registerInternalNotificationHandler(handler) {
    notificationHandler = handler;
    return () => cleanup.push("notification");
  },
};
let disposeCallback;
const invalidations = [];
const service = runtime.createHabitatAutomationsService(
  connection,
  "desktop-api",
  "app-state",
  { add: (callback) => { disposeCallback = callback; } },
  (...args) => invalidations.push(args),
);
equal(serviceInstances, [service]);
equal(service.args.slice(0, 3), [connection, "desktop-api", "app-state"]);
equal(service.args[3](), true);
equal(await service.args[4](), "fetched");
service.args[5](false);
equal(invalidations, [
  [["vscode", "list-automations"], false],
  [["vscode", "inbox-items"], false],
  [["cloud-automations"]],
  [["local-automation-habitat-migration"]],
]);

principalHandler({ current: { accountId: "account" } });
equal(service.principals, [{ accountId: "account" }]);
equal(invalidations.slice(-4), [
  [["vscode", "list-automations"], true],
  [["vscode", "inbox-items"], true],
  [["cloud-automations"]],
  [["local-automation-habitat-migration"]],
]);
notificationHandler({ method: "item/completed", params: { hosted: false } });
notificationHandler({ method: "other", params: { hosted: true } });
equal(service.syncCalls, 0);
notificationHandler({ method: "item/completed", params: { hosted: true } });
await flush();
equal(service.syncCalls, 1);
disposeCallback();
equal(cleanup, ["principal", "notification"]);

const localCallbacks = runtime.habitatAutomationHostCallbacks("local", () => service);
equal(localCallbacks.onDeleteAutomation("automation"), "deleted:automation");
equal(localCallbacks.getHostedAutomationInstallationId(), "installation");
equal(localCallbacks.isAutomationMigrationInProgress(), true);
equal(runtime.habitatAutomationHostCallbacks("remote", () => service), {});

const unsubscribed = [];
const subscriptions = { unsubscribeThread: async (threadId) => unsubscribed.push(threadId) };
const event = { automationKind: "cron", hostId: "local", threadId: "thread-1" };
await runtime.unsubscribeCompletedAutomationIfUnowned(
  subscriptions,
  { ...event, automationKind: "heartbeat" },
  () => [],
  [],
);
equal(unsubscribed, []);
await runtime.unsubscribeCompletedAutomationIfUnowned(
  subscriptions,
  event,
  () => [{ ownsThread: () => true }],
  [{ services: Promise.resolve({ clientCoordination: "unused" }) }],
);
equal(ownerRequests, []);
await runtime.unsubscribeCompletedAutomationIfUnowned(
  subscriptions,
  event,
  () => [],
  [{ services: Promise.resolve({ clientCoordination: "owner" }) }],
);
equal(unsubscribed, []);
equal(ownerRequests.at(-1), ["owner", "local", "parsed:thread-1"]);
await runtime.unsubscribeCompletedAutomationIfUnowned(
  subscriptions,
  event,
  () => [],
  [{ services: Promise.resolve({ clientCoordination: "none" }) }],
);
equal(unsubscribed, ["thread-1"]);
await runtime.unsubscribeCompletedAutomationIfUnowned(
  subscriptions,
  event,
  () => [],
  [{ services: Promise.resolve({ clientCoordination: "reject" }) }],
);
equal(unsubscribed, ["thread-1"], "uncertain remote ownership must retain the subscription");
equal(warnings.length, 0, "settled owner lookup failures are conservative, not logged failures");

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const windowContext = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context.ts", import.meta.url),
  "utf8",
);
for (const token of [
  "createHabitatAutomationRuntime({",
  "createHabitatAutomationsService,",
  "habitatAutomationHostCallbacks,",
  "unsubscribeCompletedAutomationIfUnowned,",
]) {
  equal(main.includes(token), true, `${token} must be wired`);
}
for (const removed of ["function NOe(", "function POe(", "async function FOe("]) {
  equal(main.includes(removed), false, `${removed} must be removed`);
}
equal(windowContext.includes("createHabitatAutomationsService(r,"), true);
equal(windowContext.includes("unsubscribeCompletedAutomationIfUnowned("), true);
equal(windowContext.includes("habitatAutomationHostCallbacks(e,"), true);

console.log(`${assertions} main habitat automation runtime assertions passed`);
