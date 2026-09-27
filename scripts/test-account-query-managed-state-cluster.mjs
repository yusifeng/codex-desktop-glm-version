import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiCalls = [];
const apiResponses = [];
globalThis.__accountStateTest = {
  api: {
    async safeGet(path, options) { apiCalls.push(["get", path, options]); return apiResponses.shift() ?? {}; },
    async safePatch(path, options) { apiCalls.push(["patch", path, options]); return apiResponses.shift() ?? {}; },
    async safePost(path, options) { apiCalls.push(["post", path, options]); return apiResponses.shift() ?? {}; },
    async getResponse(path, options) { apiCalls.push(["response", path, options]); return apiResponses.shift(); },
  },
};
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "account-state-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: path.basename(importPath) === "app-initial" ? "export const rJt=globalThis.__accountStateTest.api;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }

// chatgpt-voices-query: 10
const voices = await bundle("chatgpt-voices-query");
assert.deepEqual(Object.keys(voices), ["n", "r", "t"]);
assert.deepEqual(voices.t, ["chatgpt-settings-voices"]);
const voiceOptions = voices.n.getOptions({ spoken_language: "auto" }, { accountId: "a1", defaultLanguage: "fr" });
assert.deepEqual(voiceOptions.queryKey, ["chatgpt-settings-voices", "a1", "advanced", "fr"]);
assert.equal(voiceOptions.staleTime, 0);
assert.equal(voiceOptions.refetchOnMount, "always");
apiResponses.push({ voices: [{ voice: "ember", description: null, preview_url: "preview" }, { voice: "cove", name: "Cove" }] });
const voiceResponse = await voiceOptions.queryFn();
assert.equal(apiCalls.at(-1)[1], "/settings/voices");
const selectedVoices = voiceOptions.select(voiceResponse).voices;
assert.equal(selectedVoices[0].description, "");
assert.equal(selectedVoices[0].name, "ember");
assert.equal(selectedVoices[1].name, "Cove");
assert.equal(selectedVoices[0].orbTreatment, "advanced-blue");

// departments: 14
const departments = await bundle("departments");
assert.deepEqual(Object.keys(departments), ["a", "i", "n", "o", "r", "s", "t"]);
assert.equal(departments.a, "oai/apps/hasSeenOnboarding");
assert.ok(departments.t.physician.includes("cardiology"));
assert.equal(departments.t.physician, departments.t.np_pa);
assert.ok(departments.t.registered_nurse.includes("icu_rn"));
const identity = { accountId: "account", userId: "user" };
const invalidations = []; let onboardingData;
const departmentScope = { currentIdentity: () => identity, invalidate(key) { invalidations.push(key); }, setOnboardingData(_identity, data) { onboardingData = data; } };
apiResponses.push({ ok: true }, { ok: true });
await departments.s(departmentScope, identity, { role: "physician", departments: ["cardiology"] }, { role_user_message: "hello" });
assert.equal(apiCalls.at(-2)[0], "patch");
assert.equal(apiCalls.at(-2)[2].requestBody.onboarding_information.role, "physician");
assert.equal(apiCalls.at(-1)[1], "/user_system_messages");
assert.equal(onboardingData.departments[0], "cardiology");
assert.equal(invalidations.length, 2);
const departmentQuery = departments.i.getOptions(identity);
assert.deepEqual(departmentQuery.queryKey, ["health-onboarding-info", "account", "user"]);
assert.equal(departmentQuery.retry, false);
await assert.rejects(() => departments.s({ currentIdentity: () => ({ accountId: "other", userId: "user" }) }, identity, { role: "", departments: [] }), { name: "AbortError" });
apiResponses.push({ ok: true });
await departments.r(departmentScope, identity);
assert.equal(apiCalls.at(-1)[2].parameters.query.announcement_id, departments.a);

// cme-state: 18
const cme = await bundle("cme-state");
assert.deepEqual(Object.keys(cme), ["a", "c", "i", "l", "n", "o", "r", "s", "t"]);
assert.deepEqual(cme.i.evaluate(identity), identity);
assert.equal(cme.i.evaluate(), null);
const accountOptions = cme.t.getOptions(identity, identity);
assert.deepEqual(accountOptions.queryKey, ["cme-account", "account", "user"]);
assert.equal(accountOptions.enabled, true);
assert.equal(cme.t.getOptions(identity, { accountId: "other", userId: "user" }).enabled, false);
const conversationOptions = cme.n.getOptions(identity, identity);
assert.equal(conversationOptions.initialPageParam, 1);
assert.equal(conversationOptions.getNextPageParam({ next_page: 3 }), 3);
assert.equal(conversationOptions.getNextPageParam({}), undefined);
const cmeInvalidations = []; let cmeData; let downloaded;
const cmeScope = { currentIdentity: () => identity, invalidate(key) { cmeInvalidations.push(key); }, setData(key, _identity, data) { cmeData = [key, data]; }, download(_blob, name) { downloaded = name; } };
apiResponses.push({ status: "active" });
assert.deepEqual(await cme.l(cmeScope, identity, { profession: "doctor" }), { status: "active" });
assert.equal(cmeData[0], "cme-account");
assert.equal(cmeInvalidations.at(-1), "cme-account");
apiResponses.push({ id: "claim" });
assert.deepEqual(await cme.c(cmeScope, identity, { credits: 1 }), { id: "claim" });
assert.deepEqual(cmeInvalidations.slice(-2), ["cme-conversations", "cme-credits"]);
apiResponses.push({ ok: true });
await cme.s(cmeScope, identity, "conversation");
assert.equal(apiCalls.at(-1)[2].parameters.path.conversation_id, "conversation");
apiResponses.push(new Response(new Blob(["pdf"]), { headers: { "Content-Disposition": "attachment; filename*=UTF-8''transcript%202026.pdf" } }));
await cme.a(cmeScope, identity, 2026);
assert.equal(downloaded, "transcript 2026.pdf");
apiResponses.push(new Response(new Blob(["pdf"]), { headers: { "Content-Disposition": "attachment; filename=../bad.pdf" } }));
await cme.a(cmeScope, identity, 2025);
assert.equal(downloaded, "cme-transcript-2025.pdf");
await assert.rejects(() => cme.l({ currentIdentity: () => ({ accountId: "changed", userId: "user" }) }, identity, {}), /workspace or user changed/);

// pca-connector-action: 17
const pca = await bundle("pca-connector-action");
assert.deepEqual(Object.keys(pca), ["n", "r", "t"]);
const mapping = { root: { message: { id: "assistant", author: { role: "assistant" } }, parent: "prompt" }, prompt: { message: { id: "user-message", author: { role: "user" }, content: { parts: ["hello"] } }, parent: null } };
const captureScope = { getConversationId: () => "server-conversation", getLeafId: () => "root", getMapping: () => mapping };
const target = pca.t(captureScope, { connectorId: "drive", conversationId: "local", includeConnectorSystemHint: true, triggerTurnAfterLink: true });
assert.equal(target.kind, "chatgpt-pca-beacon");
assert.equal(target.serverConversationId, "server-conversation");
assert.equal(target.capturedPromptId, "user-message");
assert.equal(target.connectorId, "drive");
assert.equal(pca.t(captureScope, { connectorId: "", conversationId: "local" }), null);
assert.equal(pca.t({ ...captureScope, getMapping: () => ({}) }, { connectorId: "drive", conversationId: "local" }), null);
const logs = []; const submissions = [];
const resumeScope = { activeLinks: async () => true, conversation: async () => ({ currentLeafId: "root", mapping }), submitTurn: async input => { submissions.push(input); }, log(event, payload) { logs.push([event, payload]); } };
assert.equal(await pca.r(resumeScope, target), true);
assert.equal(submissions.length, 1);
assert.deepEqual(submissions[0].systemHints, ["connector:drive"]);
await Promise.resolve();
assert.equal(logs.at(-1)[1].outcome, "followup_request_completed");
assert.equal(await pca.r(resumeScope, { ...target, triggerTurnAfterLink: false }), false);
assert.equal(await pca.r({ ...resumeScope, activeLinks: async () => false }, target), false);
assert.equal(logs.at(-1)[1].outcome, "no_active_link_after_poll");
assert.equal(await pca.r({ ...resumeScope, conversation: async () => ({ currentLeafId: "changed", mapping }) }, target), false);
assert.equal(logs.at(-1)[1].outcome, "leaf_changed_other");
assert.equal(typeof pca.n, "function");

console.log("59 account query and managed state cluster assertions passed");
