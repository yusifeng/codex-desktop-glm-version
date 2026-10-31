import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/files/open-file-watches.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
class ResumeNotReadyError extends Error { constructor(result) { super("not ready"); this.result = result; } }
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)(
  (specifier) => specifier === "@chunk/shared"
    ? { Wn: ResumeNotReadyError, Zo: (error) => error instanceof Error ? error.message : String(error) }
    : (() => { throw new Error(`unexpected require ${specifier}`); })(),
  module,
  module.exports,
);
const owner = module.exports;
equal(await owner.delegateRequestToFollowerOwner({
  conversationId: "thread-1",
  getStreamRole: () => ({ role: "owner" }),
  markConversationNeedsResumeForUnavailableOwner() {},
  resumeConversationForUnavailableOwner: async () => ({ status: "ready" }),
  workspaceRoots: ["/work"], collaborationMode: null, reasoningEffort: null,
  sendRequest: async () => ({ result: { ok: true } }),
}), { result: { ok: true } });

const recovery = [];
equal(await owner.delegateRequestToFollowerOwner({
  conversationId: "thread-2",
  getStreamRole: () => ({ role: "follower", ownerClientId: "owner-1" }),
  markConversationNeedsResumeForUnavailableOwner: (...args) => recovery.push(["mark", ...args]),
  resumeConversationForUnavailableOwner: async (options) => (recovery.push(["resume", options]), { status: "ready" }),
  workspaceRoots: ["/work"], collaborationMode: { mode: "default" }, reasoningEffort: "high", serviceTier: "fast",
  sendRequest: async () => { throw new Error("no-client-found: gone"); },
}), null);
equal(recovery[0], ["mark", "thread-2", "owner-1"]);
equal(recovery[1][1].serviceTier, "fast");

let role = { role: "follower", ownerClientId: "owner-2" };
const compactCalls = [];
const manager = {
  waitForPendingThreadSettingsUpdate: async () => compactCalls.push("wait"),
  getStreamRole: () => role,
  getConversation: () => ({ latestCollaborationMode: { mode: "default" }, latestReasoningEffort: "medium" }),
  getConversationCwd: () => "/workspace",
  sendRequest: async (...args) => compactCalls.push(["local", ...args]),
};
await owner.compactThreadViaFollower(manager, "thread-3", {
  ownerWindowError: "continue on owner",
  markConversationNeedsResumeForUnavailableOwner: (...args) => compactCalls.push(["mark", ...args]),
  resumeConversationForUnavailableOwner: async () => (role = { role: "owner" }, { status: "ready" }),
  sendThreadFollowerRequest: async () => { throw new Error("no-client-found"); },
  registerPendingManualContextCompaction: (id) => compactCalls.push(["register", id]),
  removePendingManualContextCompaction: (id) => compactCalls.push(["remove", id]),
});
equal(compactCalls.includes("wait"), true);
equal(compactCalls.some((entry) => Array.isArray(entry) && entry[0] === "register"), true);
equal(compactCalls.some((entry) => Array.isArray(entry) && entry[0] === "local" && entry[1] === "thread/compact/start"), true);

const delegatedCalls = [];
role = { role: "follower", ownerClientId: "owner-3" };
await owner.compactThreadViaFollower(manager, "thread-4", {
  ownerWindowError: "continue on owner",
  markConversationNeedsResumeForUnavailableOwner() {},
  resumeConversationForUnavailableOwner: async () => ({ status: "ready" }),
  sendThreadFollowerRequest: async () => ({ ok: true }),
  registerPendingManualContextCompaction: () => delegatedCalls.push("register"),
  removePendingManualContextCompaction() {},
});
equal(delegatedCalls, []);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('const { ny } = require("./main-app/files/open-file-watches.js")'), true);
equal(main.includes("async function ny({"), false);
equal(main.includes("async function ave("), false);

console.log(`${assertions} main follower delegation owner assertions passed`);
