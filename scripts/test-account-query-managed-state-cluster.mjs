import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
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

assertReleaseOwner("departments");
assertReleaseOwner("cme-state");

assertReleaseOwner("pca-connector-action");

console.log("59 account query and managed state cluster assertions passed");
