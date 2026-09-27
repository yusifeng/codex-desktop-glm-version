import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = [
  "permission-request-model",
  "voice-preferences",
  "chatgpt-subagent-final-response-query",
  "library-file-metadata",
  "offer-queries",
];
const state = globalThis.__logicQueryModelsTest = {
  apiGets: [],
  apiPosts: [],
  initialized: [],
  preferences: [],
  preferenceValues: new Map(),
};

const importedNamesByModule = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  for (const match of source.matchAll(/import\s*(?:type\s*)?{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) {
    const names = importedNamesByModule.get(match[2]) ?? new Set();
    for (const rawSpecifier of match[1].split(",")) {
      const specifier = rawSpecifier.trim().replace(/^type\s+/, "");
      if (specifier) names.add(specifier.split(/\s+as\s+/)[0]);
    }
    importedNamesByModule.set(match[2], names);
  }
}

const marker = name => `() => globalThis.__logicQueryModelsTest.initialized.push(${JSON.stringify(name)})`;
const overrides = {
  "app-shared": {
    $O: `{ INFINITE: Infinity }`,
    FX: marker("signals"),
    QI: marker("queries"),
    QX: `(scope, factory) => ({ kind: "query-family", scope, factory })`,
    ZI: `{ id: "app-scope" }`,
    ek: marker("mutations"),
    pL: `options => options`,
    vW: `"X-OpenAI-Expected-Account-Id"`,
    wL: marker("query-options"),
  },
  "app-initial": {
    Sdn: `(globalThis.__logicQueryModelsTest.ApiError = class ApiError extends Error { constructor(status) { super(String(status)); this.status = status; } })`,
    aI: marker("offers"),
    cJt: marker("api"),
    dun: `(key, initialValue, options) => { const signal = { key, initialValue, options }; globalThis.__logicQueryModelsTest.preferences.push(signal); return signal; }`,
    eI: `metadata => metadata?.planName ?? null`,
    ngn: `key => globalThis.__logicQueryModelsTest.preferenceValues.get(key)`,
    rJt: `{
      safeGet(path, options) { globalThis.__logicQueryModelsTest.apiGets.push({ path, options }); return globalThis.__logicQueryModelsTest.safeGet(path, options); },
      safePost(path, options) { globalThis.__logicQueryModelsTest.apiPosts.push({ path, options }); return globalThis.__logicQueryModelsTest.safePost(path, options); }
    }`,
    rgn: marker("preference-runtime"),
    uun: marker("preference-storage"),
    wdn: marker("api-errors"),
  },
};

function mockModule(name) {
  if (name === "rolldown-runtime") return "export {};";
  const names = importedNamesByModule.get(name) ?? new Set();
  return [...names].map(exportName => {
    const expression = overrides[name]?.[exportName] ?? "undefined";
    return `export const ${exportName} = ${expression};`;
  }).join("\n");
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
      name: "logic-query-model-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mockModule(importPath), loader: "js" }));
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}

// permission-request-model: 13
const permission = await bundle("permission-request-model");
assert.deepEqual(permission.t({}), []);
assert.deepEqual(permission.t({ network: {} }), [{ kind: "network" }]);
const permissionGroups = permission.t({ network: true, fileSystem: { entries: [
  { access: "read", path: { type: "path", path: "/workspace" } },
  { access: "write", path: { type: "path", path: "/workspace" } },
  { access: "read", path: { type: "glob_pattern", pattern: "**/*.ts" } },
  { access: "write", path: { type: "special", value: { kind: "root" } } },
  { access: "write", path: { type: "special", value: { kind: "minimal" } } },
] } });
assert.equal(permissionGroups[0].kind, "network");
assert.deepEqual(permissionGroups[1], { kind: "fileSystem", access: "readWrite", paths: ["/workspace"] });
assert.deepEqual(permissionGroups[2], { kind: "fileSystem", access: "read", paths: ["**/*.ts"] });
assert.deepEqual(permissionGroups[3], { kind: "fileSystem", access: "write", paths: ["/", ":minimal"] });
const specialGroups = permission.t({ fileSystem: { entries: [
  { access: "read", path: { type: "special", value: { kind: "project_roots" } } },
  { access: "read", path: { type: "special", value: { kind: "project_roots", subpath: "src" } } },
  { access: "read", path: { type: "special", value: { kind: "tmpdir" } } },
  { access: "read", path: { type: "special", value: { kind: "slash_tmp" } } },
  { access: "read", path: { type: "special", value: { kind: "unknown", path: "/mnt" } } },
  { access: "read", path: { type: "special", value: { kind: "unknown", path: "/mnt", subpath: "data" } } },
] } });
assert.equal(specialGroups.length, 1);
assert.equal(specialGroups[0].access, "read");
assert.deepEqual(specialGroups[0].paths, [":project_roots", ":project_roots/src", ":tmpdir", "/tmp", "/mnt", "/mnt/data"]);
assert.deepEqual(permission.t({ fileSystem: null }), []);
assert.deepEqual(permission.t({ fileSystem: { entries: [] } }), []);
permission.n();
assert.equal(typeof permission.n, "function");
assert.deepEqual(permission.t({ fileSystem: { entries: [{ access: "read", path: { type: "path", path: "/same" } }, { access: "read", path: { type: "path", path: "/same" } }] } }), [{ kind: "fileSystem", access: "read", paths: ["/same"] }]);

// voice-preferences: 17
const voice = await bundle("voice-preferences");
assert.equal(voice.c, undefined);
assert.equal(voice.i(-70), -60);
assert.equal(voice.i(-9.6), -10);
assert.equal(voice.i(12), 0);
assert.equal(voice.i(Number.NaN), -10);
state.preferenceValues.set("voiceDuckingControl", "server_transcription");
assert.equal(voice.r(), "asr");
state.preferenceValues.set("voiceDuckingControl", "microphone");
assert.equal(voice.r(), "volume");
state.preferenceValues.set("voiceDuckingControl", "none");
assert.equal(voice.r(), "none");
state.preferenceValues.set("voiceDuckingControl", "invalid");
assert.equal(voice.r(), undefined);
state.preferenceValues.set("voiceDuckingDecibels", -80);
assert.equal(voice.a(), -60);
state.preferenceValues.delete("voiceDuckingDecibels");
assert.equal(voice.a(), undefined);
voice.o();
assert.equal(state.initialized.filter(name => name === "preference-storage").length, 2);
assert.equal(state.preferences.length, 7);
assert.equal(voice.c.key, "oai/apps/voiceModelSlug");
assert.equal(voice.n.key, "voiceErleInformedDuckingEnabled");
assert.equal(voice.s.key, "oai/apps/voiceLastUsed");
assert.equal(voice.t.options.coerceStoredValue("61.9"), 60);

// chatgpt-subagent-final-response-query: 16
const subagent = await bundle("chatgpt-subagent-final-response-query");
subagent.n();
assert.equal(subagent.t.kind, "query-family");
assert.equal(subagent.t.scope.id, "app-scope");
const liveOptions = subagent.t.factory({ activationId: "activation", conversationId: "conversation", isTurnLive: true, threadId: "thread" });
assert.equal(liveOptions.enabled, true);
assert.deepEqual(liveOptions.queryKey, ["chatgpt-subagent-final-response", "conversation", "thread", "activation"]);
assert.equal(liveOptions.refetchOnWindowFocus, false);
assert.equal(liveOptions.retryOnMount, false);
assert.equal(liveOptions.staleTime, Infinity);
state.safeGet = async () => ({ data: [{ items: [{ type: "agentMessage", phase: "commentary", text: "working" }, { type: "agentMessage", phase: "final_answer", text: "done" }] }] });
assert.equal(await liveOptions.queryFn(), "done");
state.safeGet = async () => ({ data: [{ items: [{ type: "agentMessage", text: "fallback" }, { type: "agentMessage", text: "  " }] }] });
assert.equal(await liveOptions.queryFn(), "fallback");
state.safeGet = async () => ({ data: [] });
let unavailable;
await assert.rejects(liveOptions.queryFn(), error => { unavailable = error; return error.message.includes("not available"); });
assert.equal(liveOptions.retry(0, unavailable), true);
assert.equal(liveOptions.retry(2, unavailable), false);
assert.equal(liveOptions.retry(0, new Error("other")), false);
const delay = liveOptions.retryDelay(1);
assert.equal(delay >= 500 && delay < 600, true);
const disabledOptions = subagent.t.factory({ activationId: null, conversationId: null, isTurnLive: false, threadId: null });
assert.equal(disabledOptions.enabled, false);
assert.equal(disabledOptions.retryOnMount, true);

// library-file-metadata: 15
const library = await bundle("library-file-metadata");
library.n();
assert.equal(state.initialized.includes("api-errors"), true);
let abortChecks = 0;
const signal = { throwIfAborted() { abortChecks++; } };
state.safeGet = async pathName => ({ id: "direct", pathName });
assert.equal((await library.t("direct", "acct", signal)).id, "direct");
assert.equal(state.apiGets.at(-1).options.additionalHeaders["ChatGPT-Account-ID"], "acct");
state.safeGet = async pathName => {
  if (pathName.endsWith("/node")) return { id: "node" };
  throw new state.ApiError(404);
};
assert.equal((await library.t("node", "acct", signal)).id, "node");
assert.equal(state.apiGets.at(-2).path, "/files/library/files/{library_file_id}");
assert.equal(state.apiGets.at(-1).path, "/files/library/files/{library_file_id}/node");
state.safeGet = async () => { throw new state.ApiError(403); };
let pageIndex = 0;
state.safePost = async () => pageIndex++ === 0
  ? { items: [{ id: "other" }], cursor: "next" }
  : { items: [{ id: "paged", title: "Found" }], cursor: null };
const postStart = state.apiPosts.length;
assert.equal((await library.t("paged", "acct", signal)).title, "Found");
assert.equal(state.apiPosts.length - postStart, 2);
assert.equal(state.apiPosts.at(-2).options.requestBody.cursor, null);
assert.equal(state.apiPosts.at(-1).options.requestBody.cursor, "next");
assert.deepEqual(state.apiPosts.at(-1).options.expectedErrorStatuses, [403, 404]);
const fatal = new state.ApiError(500);
state.safeGet = async () => { throw fatal; };
const postsBeforeFatal = state.apiPosts.length;
await assert.rejects(library.t("fatal", "acct", signal), error => error === fatal);
assert.equal(state.apiPosts.length, postsBeforeFatal);
const missing = new state.ApiError(404);
state.safeGet = async () => { throw missing; };
state.safePost = async () => ({ items: [], cursor: "repeat" });
await assert.rejects(library.t("absent", "acct", signal), error => error === missing);
assert.equal(state.apiPosts.at(-1).options.requestBody.include_hidden_files, true);
assert.equal(abortChecks >= 10, true);

// offer-queries: 17
const offers = await bundle("offer-queries");
assert.deepEqual(offers.t({ planName: "free", isLoading: false }), { lockedProPlanName: null, proPromotionPending: false, proSelectionBlocked: false });
assert.deepEqual(offers.t({ accountId: "acct", promoCode: "promo", planName: "chatgptpro", promotion: { is_eligible: true, metadata: { planName: "chatgptpro" } }, isLoading: false }), { lockedProPlanName: "chatgptpro", proPromotionPending: false, proSelectionBlocked: false });
assert.equal(offers.t({ accountId: "acct", promoCode: "promo", planName: "chatgptpro", promotion: { is_eligible: true, metadata: { planName: "chatgptprolite" } }, isLoading: false }).proSelectionBlocked, true);
assert.equal(offers.t({ promoCode: "promo", planName: "chatgptpro", isLoading: false }).proPromotionPending, true);
assert.equal(offers.t({ accountId: "acct", promoCode: "promo", planName: "chatgptpro", isLoading: false, error: new Error("failed") }).proSelectionBlocked, true);
const query = offers.i({ accountId: "acct", promoCode: "promo", planName: "chatgptpro" });
assert.equal(query.enabled, true);
assert.deepEqual(query.queryKey, ["pro-checkout-promotion", "acct", "promo"]);
assert.equal(query.retry, false);
const offerSignal = { throwIfAborted() {} };
state.safeGet = async pathName => pathName.includes("eligibility") ? { is_eligible: false, source: "eligibility" } : { metadata: "unexpected" };
assert.deepEqual(await offers.n({ accountId: "acct", code: "promo", kind: "promo", signal: offerSignal }), { is_eligible: false, source: "eligibility", metadata: null });
assert.equal(state.apiGets.at(-1).options.additionalHeaders["X-OpenAI-Expected-Account-Id"], "acct");
state.safeGet = async pathName => pathName.includes("eligibility") ? { is_eligible: true } : { is_eligible: true, metadata: { planName: "chatgptpro" } };
assert.deepEqual(await query.queryFn({ signal: offerSignal }), { is_eligible: true, metadata: { planName: "chatgptpro" } });
assert.equal(state.apiGets.at(-1).path, "/promotions/metadata/{code}");
assert.equal(offers.i({ accountId: null, promoCode: "promo", planName: "chatgptpro" }).enabled, false);
assert.throws(() => offers.i({ accountId: null, promoCode: "promo", planName: "chatgptpro" }).queryFn({ signal: offerSignal }), /requires an account/);
offers.r();
assert.equal(state.initialized.includes("query-options"), true);
assert.equal(state.initialized.includes("offers"), true);

console.log("logic/query models cluster tests passed (78 assertions)");
