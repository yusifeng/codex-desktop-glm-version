import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = [
  "computer-history-query",
  "chronicle-service-queries",
  "recent-uploads",
  "chatgpt-image-home",
  "virtual-try-on",
];
const state = (globalThis.__personalizationServicesTest = {
  apiGets: [],
  chronicleCalls: [],
  initialized: [],
  mutations: [],
  productEvents: [],
  queries: [],
});

Object.defineProperty(globalThis, "createImageBitmap", {
  configurable: true,
  value: async () => ({ height: 480, width: 640, close: () => { state.bitmapClosed = true; } }),
});

const importedNamesByModule = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(
    path.join(ROOT, "src/renderer", directory, "index.ts"),
    "utf8",
  );
  for (const match of source.matchAll(
    /import\s*{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g,
  )) {
    const names = importedNamesByModule.get(match[2]) ?? new Set();
    for (const rawSpecifier of match[1].split(",")) {
      const specifier = rawSpecifier.trim();
      if (!specifier || specifier.startsWith("type ")) continue;
      names.add(specifier.split(/\s+as\s+/)[0]);
    }
    importedNamesByModule.set(match[2], names);
  }
}

const marker = name =>
  `() => globalThis.__personalizationServicesTest.initialized.push(${JSON.stringify(name)})`;
const overrides = {
  "app-shared": {
    FX: marker("signals"),
    QI: marker("queries"),
    QX: `(scope, factory) => { const value = { scope, factory, kind: "family" }; globalThis.__personalizationServicesTest.queries.push(value); return value; }`,
    YX: `(scope, factory) => { const value = { scope, factory, kind: "mutation" }; globalThis.__personalizationServicesTest.mutations.push(value); return value; }`,
    ZI: `{ id: "app-scope" }`,
    eZ: `(scope, factory) => { const value = { scope, factory, kind: "query" }; globalThis.__personalizationServicesTest.queries.push(value); return value; }`,
  },
  "app-initial": {
    BGt: `blob => blob`,
    Dan: `async () => "blob:preview"`,
    KGt: `async () => new Blob(["image"], { type: "image/webp" })`,
    Sun: marker("account-runtime"),
    U6t: `{ id: "account" }`,
    _un: `{ id: "workspace" }`,
    cJt: marker("api-client"),
    mnt: marker("desktop-bridge"),
    mun: `{ id: "account" }`,
    pnt: `globalThis.__personalizationServicesTest.desktopBridge`,
    rJt: `{
      async safeGet(path, options) { globalThis.__personalizationServicesTest.apiGets.push({ path, options }); return path.includes("simple") ? { file_id: "file-1", file_name: "photo.webp", mime_type: "image/webp", library_file_id: "library-1" } : { items: ["recent"] }; }
    }`,
  },
  "computer-history-query": {
    a: marker("computer-history"),
    t: `["chronicle-history"]`,
  },
  "chronicle-settings": {
    n: marker("chronicle-settings"),
    t: `"chronicle"`,
  },
};

function generic(moduleName, exportName) {
  return `(...args) => { globalThis.__personalizationServicesTest.initialized.push(${JSON.stringify(`${moduleName}:${exportName}`)}); return undefined; }`;
}

function mockModule(name) {
  if (name === "rolldown-runtime") return "export {};";
  const names = importedNamesByModule.get(name) ?? new Set();
  return [...names]
    .map(
      exportName =>
        `export const ${exportName} = ${overrides[name]?.[exportName] ?? generic(name, exportName)};`,
    )
    .join("\n");
}

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "personalization-services-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({
          contents: mockModule(importPath),
          loader: "js",
        }));
      },
    }],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}

state.desktopBridge = {
  chronicle: {
    async listHistory() { state.chronicleCalls.push("listHistory"); return ["history"]; },
    async listHistorySuggestions() { state.chronicleCalls.push("listHistorySuggestions"); return ["suggestion"]; },
    async listHistorySummaryIntervals(options) { state.chronicleCalls.push(["listHistorySummaryIntervals", options]); return ["interval"]; },
    async getState() { state.chronicleCalls.push("getState"); return { enabled: true }; },
    async getSettings() { state.chronicleCalls.push("getSettings"); return state.chronicleSettings; },
    async listApplications() { state.chronicleCalls.push("listApplications"); return [{ bundleIdentifier: "com.example" }]; },
    async resolveApplications(ids) { state.chronicleCalls.push(["resolveApplications", ids]); return ids; },
    async setEnabled(enabled) { state.chronicleCalls.push(["setEnabled", enabled]); return { enabled }; },
    async retryActivation() { return { enabled: true }; },
    async pause() { return { status: "paused" }; },
    async resume() { return { status: "active" }; },
    async clearHistory(scope, interval) { state.chronicleCalls.push(["clearHistory", scope, interval]); },
    async updateSettings(settings) { state.chronicleSettings = settings; return settings; },
  },
};
state.chronicleSettings = {
  observation: {
    allowlist: [{ scope: "app", bundleID: "allowed.app", urlDomain: null }],
    blocklist: [{ scope: "app", bundleID: "blocked.app", urlDomain: null }],
    defaultApplicationBehavior: "observe",
    defaultURLBehavior: "ignore",
  },
};

// computer-history-query: 10
const history = await bundle("computer-history-query");
history.a();
assert.deepEqual(history.t, ["chronicle-history"]);
assert.equal(state.queries.slice(-3).length, 3);
const historyOptions = state.queries.at(-3).factory();
assert.deepEqual(historyOptions.queryKey, ["chronicle-history"]);
assert.equal(historyOptions.enabled, true);
assert.deepEqual(await historyOptions.queryFn(), ["history"]);
const suggestionOptions = state.queries.at(-2).factory();
assert.deepEqual(await suggestionOptions.queryFn(), ["suggestion"]);
const intervalOptions = state.queries.at(-1).factory();
const before = Date.now();
assert.deepEqual(await intervalOptions.queryFn(), ["interval"]);
const sinceMs = state.chronicleCalls.at(-1)[1].sinceMs;
assert.ok(sinceMs <= before - 604_799_000);
assert.equal(intervalOptions.retry, false);
assert.equal(state.initialized.includes("desktop-bridge"), true);

// chronicle-service-queries: 19
const chronicle = await bundle("chronicle-service-queries");
const memoryState = chronicle._({
  chronicleResearchPreviewEnabled: true,
  chronicleResearchPreviewVisible: true,
  isMemoryFeatureEnabled: true,
  memoryConfig: { generateMemories: true, useMemories: true, disableOnExternalContext: true },
}, { memoryConfigPatch: { useMemories: false } });
assert.equal(memoryState.memoriesEnabled, false);
assert.equal(memoryState.skipToolAssistedChatsEnabled, true);
const form = chronicle.m(state.chronicleSettings);
assert.equal(form.defaultApplicationBehavior, "observe");
assert.deepEqual(form.applicationBundleIdentifiers, ["blocked.app"]);
assert.equal(chronicle.p(state.chronicleSettings, "allowed.app"), true);
assert.equal(chronicle.p(state.chronicleSettings, "blocked.app"), false);
const logger = { logProductEvent: (event, fields) => state.productEvents.push({ event, fields }) };
chronicle.y({ productLogger: logger, previousEnabled: false, selectedEnabled: true, settingName: "memories", state: { ready: true } });
assert.equal(state.productEvents.at(-1).fields.settingName, "memories");
await chronicle.x({ productLogger: logger, previousEnabled: true, selectedEnabled: false, settingName: "history", state: {}, write: async () => {} });
assert.equal(state.productEvents.at(-1).fields.settingName, "history");
const eventCount = state.productEvents.length;
await chronicle.x({ productLogger: logger, previousEnabled: true, selectedEnabled: false, settingName: "failed", state: {}, write: async () => { throw new Error("no"); } });
assert.equal(state.productEvents.length, eventCount);
const previousQueryCount = state.queries.length;
const previousMutationCount = state.mutations.length;
chronicle.a();
assert.equal(state.queries.length - previousQueryCount, 4);
assert.equal(state.mutations.length - previousMutationCount, 6);
assert.equal(state.initialized.includes("computer-history"), true);
const stateOptions = state.queries.at(-4).factory();
assert.deepEqual(stateOptions.queryKey, ["chronicle-state"]);
assert.deepEqual(await stateOptions.queryFn(), { enabled: true });
const applicationsOptions = state.queries.at(-2).factory();
assert.equal(applicationsOptions.staleTime, Infinity);
assert.equal((await applicationsOptions.queryFn())[0].bundleIdentifier, "com.example");
const selectedOptions = state.queries.at(-1).factory(["com.example"]);
assert.equal(selectedOptions.enabled, true);
assert.deepEqual(await selectedOptions.queryFn(), ["com.example"]);
const setEnabledOptions = state.mutations.at(-6).factory();
assert.deepEqual(await setEnabledOptions.mutationFn({ enabled: false }), { enabled: false });

// recent-uploads: 10
const uploads = await bundle("recent-uploads");
const queryCountBeforeUploads = state.queries.length;
uploads.n();
assert.equal(state.queries.length - queryCountBeforeUploads, 1);
const uploadFamily = state.queries.at(-1);
const recentOptions = uploadFamily.factory(true, { get: signal => signal.id === "account" ? "account-1" : "workspace-1" });
assert.equal(recentOptions.enabled, true);
assert.deepEqual(recentOptions.queryKey, ["chatgpt-images", "recent-uploads", "account-1", "workspace-1", true]);
assert.equal(recentOptions.staleTime, 120000);
assert.deepEqual(await recentOptions.queryFn({}), { items: ["recent"] });
assert.equal(state.apiGets.at(-1).options.parameters.query.limit, 25);
const loaded = await uploads.t({ file_id: "file-1" });
assert.equal(loaded.name, "photo.webp");
assert.equal(loaded.width, 640);
assert.equal(loaded.height, 480);
assert.equal(state.bitmapClosed, true);

// chatgpt-image-home: 6
const imageHome = await bundle("chatgpt-image-home");
imageHome.o();
assert.equal(imageHome.t.CHATGPT_IMAGE_PROMPT_GROUP_PRESENTATION_TYPE_IMAGE_CARD, "CHATGPT_IMAGE_PROMPT_GROUP_PRESENTATION_TYPE_IMAGE_CARD");
assert.equal(imageHome.a.CHATGPT_IMAGE_PROMPT_SENT_SURFACE_TYPE_CHATGPT_HOME, "CHATGPT_IMAGE_PROMPT_SENT_SURFACE_TYPE_CHATGPT_HOME");
assert.match(imageHome.n.$type, /PromptImpression$/);
assert.match(imageHome.r.$type, /PromptSelected$/);
assert.match(imageHome.i.$type, /PromptSent$/);
assert.equal(imageHome.t.UNRECOGNIZED, "UNRECOGNIZED");

// virtual-try-on: 10
const virtualTryOn = await bundle("virtual-try-on");
virtualTryOn.C();
assert.equal(virtualTryOn.r.VIRTUAL_TRY_ON_ENTRY_SURFACE_PRODUCT_DETAIL, "VIRTUAL_TRY_ON_ENTRY_SURFACE_PRODUCT_DETAIL");
assert.equal(virtualTryOn.m.VIRTUAL_TRY_ON_LIKENESS_TYPE_BODY, "VIRTUAL_TRY_ON_LIKENESS_TYPE_BODY");
assert.equal(virtualTryOn.f.VIRTUAL_TRY_ON_LIKENESS_SOURCE_METHOD_CAMERA, "VIRTUAL_TRY_ON_LIKENESS_SOURCE_METHOD_CAMERA");
assert.equal(virtualTryOn.S.VIRTUAL_TRY_ON_UPLOAD_OUTCOME_SUCCESS, "VIRTUAL_TRY_ON_UPLOAD_OUTCOME_SUCCESS");
assert.equal(virtualTryOn.i.VIRTUAL_TRY_ON_FAILURE_CATEGORY_NETWORK, "VIRTUAL_TRY_ON_FAILURE_CATEGORY_NETWORK");
assert.equal(virtualTryOn.g.VIRTUAL_TRY_ON_ONBOARDING_CLOSE_REASON_ERROR, "VIRTUAL_TRY_ON_ONBOARDING_CLOSE_REASON_ERROR");
assert.equal(virtualTryOn.v.VIRTUAL_TRY_ON_ONBOARDING_LAST_STEP_READY, "VIRTUAL_TRY_ON_ONBOARDING_LAST_STEP_READY");
assert.match(virtualTryOn.t.$type, /EntryPointShown$/);
assert.match(virtualTryOn.a.$type, /GenerationCompleted$/);
assert.equal(virtualTryOn.o.UNRECOGNIZED, "UNRECOGNIZED");

console.log("55 personalization services cluster assertions passed");
