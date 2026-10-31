import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/onboarding/conversational-onboarding.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const classNode = ast.body.find(
  (node) => node.type === "ClassDeclaration" && node.id?.name === "ConversationalOnboardingService",
);
assert.ok(classNode);
assertions += 1;
equal(classNode.body.body.length, 25);

const classSource = transpiled.code.slice(classNode.start, classNode.end);
const ConversationalOnboardingService = Function(
  "createTaggedLogger",
  "threadDeletedParamsSchema",
  "conversationalOnboardingResultSchema",
  "CONVERSATIONAL_ONBOARDING_COMPLETIONS_KEY",
  "wslPathAltOrSelf",
  "wslPathOrSelf",
  "basename",
  "join",
  "writeFile",
  "execFileAsync",
  "nativeTheme",
  "resolvedAppPath",
  "checkLocalFilesAccess",
  `${classSource}; return ConversationalOnboardingService;`,
)(
  () => ({ warning() {} }),
  { safeParse: (value) => ({ success: typeof value?.threadId === "string", data: value }) },
  { safeParse: (value) => ({ success: value?.kind === "done", data: value }) },
  "completions",
  (value) => value,
  (value) => value,
  (value) => value.split("/").at(-1),
  (...parts) => parts.join("/"),
  async () => {},
  async () => ({ stdout: "0" }),
  { shouldUseDarkColors: false },
  async () => "/desktop",
  async () => null,
);

let notificationHandler;
let notificationDisposed = 0;
let current = true;
const principal = { accountId: "account-1", userId: "user-1" };
const connection = {
  registerInternalNotificationHandler(handler) {
    notificationHandler = handler;
    return () => { notificationDisposed += 1; };
  },
  captureRequestLifetime() {
    return () => {
      if (!current) throw new DOMException("stale", "AbortError");
    };
  },
  async getAuthenticatedPrincipal() { return principal; },
};
const state = new Map();
const globalState = {
  get: (key) => state.get(key),
  update(key, update) { state.set(key, update(state.get(key))); },
};
const invalidations = [];
const service = new ConversationalOnboardingService(
  connection,
  globalState,
  null,
  (conversationId) => invalidations.push(conversationId),
);

equal(await service.expectTaskCompletion({
  hostId: "remote",
  conversationId: "thread-remote",
  selectedTask: "task",
  isRevert: false,
}), false);
equal(await service.expectTaskCompletion({
  hostId: "local",
  conversationId: "thread-1",
  selectedTask: "task-1",
  isRevert: true,
}), true);
equal(invalidations, ["thread-1"]);
equal(await service.getTaskCompletionState({ hostId: "local", conversationId: "thread-1" }), {
  status: "pending",
});

const assignment = state.get("completions")[0];
state.set("electron-conversational-onboarding-completions-v1", [assignment]);
equal(await service.completeTask({
  hostId: "local",
  conversationId: "thread-1",
  argumentsValue: { kind: "done", value: 42 },
}), {
  completion: { kind: "done", value: 42 },
  selectedTask: "task-1",
  isRevert: true,
});
equal(await service.getTaskCompletionState({ hostId: "local", conversationId: "thread-1" }), {
  status: "completed",
  completion: { kind: "done", value: 42 },
});
equal(invalidations, ["thread-1", "thread-1"]);

await service.expectTaskCompletion({
  hostId: "local",
  conversationId: "thread-2",
  selectedTask: "task-2",
  isRevert: false,
});
notificationHandler({ method: "unrelated", params: { threadId: "thread-2" } });
equal((await service.getTaskCompletionState({ hostId: "local", conversationId: "thread-2" })).status, "pending");
notificationHandler({ method: "thread/deleted", params: { threadId: "thread-2" } });
await Promise.resolve();
await Promise.resolve();
equal((await service.getTaskCompletionState({ hostId: "local", conversationId: "thread-2" })).status, "pending");

current = false;
equal(await service.expectTaskCompletion({
  hostId: "local",
  conversationId: "thread-stale",
  selectedTask: "task",
  isRevert: false,
}), false);
current = true;

ConversationalOnboardingService.dispose(service);
ConversationalOnboardingService.dispose(service);
equal(notificationDisposed, 1);
equal(await service.getTaskCompletionState({ hostId: "local", conversationId: "thread-1" }), {
  status: "unavailable",
});

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(
  main.includes('const { ConversationalOnboardingService } = require("./main-app/onboarding/conversational-onboarding.js");'),
  true,
);
equal(main.includes("var kN = ConversationalOnboardingService,"), true);
equal(main.includes("kN = class"), false);
equal(main.includes("this.conversationalOnboarding = new kN("), false);

const windowContext = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context.ts", import.meta.url),
  "utf8",
);
equal(windowContext.includes("this.conversationalOnboarding = new kN("), true);
equal(windowContext.includes("kN.dispose(this.conversationalOnboarding)"), true);

console.log(`${assertions} main conversational onboarding owner assertions passed`);
