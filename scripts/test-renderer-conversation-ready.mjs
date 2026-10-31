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
equal(consumerSource.includes('Ur as ensureConversationAvailable'), false);
equal(consumerSource.includes('hasCompleteConversationHistory(conversation)'), true);
const serviceCalls = [];
const conversations = new Map();
const scope = {
  getConversationStore: () => ({ getConversation: (id) => conversations.get(id) }),
  getHydrationService: () => ({
    hydrateBackgroundThreads: async (ids) => { serviceCalls.push(["hydrate", ...ids]); conversations.set(ids[0], { state: "resumed", messages: ["loaded"] }); },
    loadOlderConversationHistoryPage: async (id) => { serviceCalls.push(["older", id]); },
  }),
};
const readiness = { isResumed: (conversation) => conversation.state === "resumed", hasSufficientHistory: (conversation) => conversation.messages.length > 0 || conversation.historyComplete === true };
equal(await module.ensureConversationReady(scope, "missing", "local", readiness), true);
equal(serviceCalls, [["hydrate", "missing"]]);
equal(await module.ensureConversationReady(scope, "missing", "local", readiness), true);
equal(serviceCalls, [["hydrate", "missing"]]);
conversations.set("partial", { state: "resumed", messages: [] });
equal(await module.ensureConversationReady(scope, "partial", "local", readiness), true);
equal(serviceCalls.at(-1), ["older", "partial"]);
conversations.set("ready", { state: "resumed", messages: ["m"] });
equal(module.ensureConversationReady(scope, "ready", "local", readiness), true);
conversations.set("complete-empty", { state: "resumed", messages: [], historyComplete: true });
equal(module.ensureConversationReady(scope, "complete-empty", "local", readiness), true);
conversations.set("paused", { state: "paused", messages: ["m"] });
equal(await module.ensureConversationReady(scope, "paused", "local", readiness), true);
equal(serviceCalls.at(-1), ["older", "paused"]);
console.log(`renderer conversation-ready tests passed (${assertions} assertions)`);
