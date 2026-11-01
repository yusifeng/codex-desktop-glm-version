import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "src/renderer/app-primary/runtime/ensure-conversation-ready.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const consumerSource = fs.readFileSync(path.join(root, "src/renderer/open-local-conversation-background-agent/index.ts"), "utf8");
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
let assertions = 0;
const equal = (actual, expected) => { assertions += 1; assert.deepEqual(actual, expected); };
equal(/\bany\b/.test(source), false);
equal(consumerSource.includes('../app-primary/runtime/ensure-conversation-ready'), true);
equal(consumerSource.includes('Ur as ensureConversationReady'), false);
equal(consumerSource.includes('Lin as hasCompleteConversationHistory'), true);
equal(consumerSource.includes('Pin as getConversationMessages'), true);
const serviceCalls = [];
const conversations = new Map();
const conversationStore = Symbol("conversation-store");
const scope = {
  get: (signal) => signal === conversationStore ? ({ getConversation: (id) => conversations.get(id) }) : undefined,
};
const readiness = {
  conversationStore,
  getHydrationService: () => ({
    hydrateBackgroundThreads: async (ids) => { serviceCalls.push(["hydrate", ...ids]); conversations.set(ids[0], { resumeState: "resumed", messages: ["loaded"] }); },
    loadOlderConversationHistoryPage: async (id) => { serviceCalls.push(["older", id]); },
  }),
  getMessages: (conversation) => conversation.messages,
  hasCompleteHistory: (conversation) => conversation.historyComplete === true,
};
equal(await module.ensureConversationReady(scope, "missing", "local", readiness), true);
equal(serviceCalls, [["hydrate", "missing"]]);
equal(await module.ensureConversationReady(scope, "missing", "local", readiness), true);
equal(serviceCalls, [["hydrate", "missing"]]);
conversations.set("partial", { resumeState: "resumed", messages: [] });
equal(await module.ensureConversationReady(scope, "partial", "local", readiness), true);
equal(serviceCalls.at(-1), ["older", "partial"]);
conversations.set("ready", { resumeState: "resumed", messages: ["m"] });
equal(module.ensureConversationReady(scope, "ready", "local", readiness), true);
conversations.set("complete-empty", { resumeState: "resumed", messages: [], historyComplete: true });
equal(module.ensureConversationReady(scope, "complete-empty", "local", readiness), true);
conversations.set("paused", { resumeState: "paused", messages: ["m"] });
equal(await module.ensureConversationReady(scope, "paused", "local", readiness), true);
equal(serviceCalls.at(-1), ["older", "paused"]);
console.log(`renderer conversation-ready tests passed (${assertions} assertions)`);
