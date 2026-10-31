import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/threads/history-policy.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const automationDetector = { isAutomationUserInput: () => false, isAutomationAssistantMessage: () => false };
const calls = [];
const projectItems = (items) => { calls.push(["items", items]); return ["projected-items"]; };
const projectTurns = (input) => { calls.push(["turns", input]); return ["projected-turns"]; };
const attachmentsFromInput = (input) => { calls.push(["attachments", input]); return [{ path: "/attachment" }]; };
const mergeTurnLists = (left, right, options) => { calls.push(["merge", left, right, options]); return ["merged"]; };
class ArchivedThreadPreviewRead {}
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)(
  (specifier) => {
    if (specifier === "./archived-preview") return { ArchivedThreadPreviewRead };
    if (specifier === "@chunk/shared") return { Cs: (hostId) => hostId === "durable" };
    if (specifier === "./automation-detector") return { AUTOMATION_DETECTOR: automationDetector };
    if (specifier === "./hydration") return { attachmentsFromInput, projectItems, projectTurns };
    if (specifier === "../turns/item-merge") return { mergeTurnLists };
    throw new Error(`unexpected require ${specifier}`);
  },
  module,
  module.exports,
);
const policyModule = module.exports;
const policy = policyModule.Cve;

equal(policy.turnMergePolicy, automationDetector);
equal(policy.mapThreadItems([1]), ["projected-items"]);
equal(policy.mapThreadTurns({ turns: [2] }), ["projected-turns"]);
equal(policy.mergeTurns([{ turnId: "a" }], [{ turnId: "b" }], { isResumeSnapshot: true }), ["merged"]);
equal(calls.at(-1), [
  "merge",
  [{ turnId: "a" }],
  [{ turnId: "b" }],
  { isResumeSnapshot: true, policy: automationDetector },
]);
const turn = { params: { model: "gpt" } };
const item = { type: "userMessage", content: [{ type: "text", text: "hello" }], clientId: "client" };
policy.applyOldestUserInput(turn, item);
equal(turn, {
  params: {
    model: "gpt",
    input: item.content,
    clientUserMessageId: "client",
    attachments: [{ path: "/attachment" }],
  },
});
equal(calls.at(-1), ["attachments", item.content]);
equal(policyModule.Tve("durable", true, false), 50);
equal(policyModule.Tve("local", false, false), 50);
equal(policyModule.Tve("local", true, true), 0);
equal(policyModule.Tve("local", true, false), 500);
equal(policyModule.yve, ArchivedThreadPreviewRead);

const hydration = fs.readFileSync(new URL("../src/main/main-app/threads/hydration.ts", import.meta.url), "utf8");
equal(hydration.includes("export function projectItems("), true);
equal(source.includes('import { mergeTurnLists } from "../turns/item-merge"'), true);
equal(source.includes('import { AUTOMATION_DETECTOR } from "./automation-detector"'), true);
equal(source.includes("turnMergePolicy: {}"), false);

const manager = fs.readFileSync(new URL("../src/main/main-app/conversation/app-server-manager.ts", import.meta.url), "utf8");
equal(manager.includes('import { Cve as historyPolicyDefaults, Tve as recentHistoryLimit } from "../threads/history-policy"'), true);
equal(manager.includes("historyPolicyDefaults"), true);
equal(manager.includes("recentHistoryLimit("), true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("var Cve = {"), false);
equal(main.includes("function Tve("), false);
equal(main.includes("function wve("), false);
equal(main.includes('const { AppServerConversationManager } = require("./main-app/conversation/app-server-manager.js");'), true);

console.log(`${assertions} main thread history policy owner assertions passed`);
