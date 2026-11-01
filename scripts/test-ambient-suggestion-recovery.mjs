import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = [
  "new-chat-page-suggestions-eligibility",
  "first-app-connect-ambient-suggestions",
];
const imports = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  for (const match of source.matchAll(/import\s*{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) {
    const names = imports.get(match[2]) ?? new Set();
    for (const specifier of match[1].split(",")) {
      const name = specifier.trim().split(/\s+as\s+/)[0];
      if (name && name !== "type MaitaiScopeApi") names.add(name);
    }
    imports.set(match[2], names);
  }
}

const state = globalThis.__ambientSuggestionRecoveryTest = {
  ambientChecks: [],
  invalidations: [],
  queries: [],
  refreshes: [],
  requests: [],
};
const cache = [];
const overrides = {
  "app-shared": {
    "$3": `() => ({ c(size) { while (${"globalThis.__ambientSuggestionRecoveryCache"}.length < size) ${"globalThis.__ambientSuggestionRecoveryCache"}.push(Symbol.for("react.memo_cache_sentinel")); return ${"globalThis.__ambientSuggestionRecoveryCache"}; } })`,
    "$O": `({ FIVE_MINUTES: 300000 })`,
    _L: `options => { globalThis.__ambientSuggestionRecoveryTest.queries.push(options); return options; }`,
    ek: `() => undefined`,
    gL: `() => undefined`,
    iW: `value => value`,
    wL: `() => undefined`,
  },
  "app-initial": {
    "$ln": `kind => ["ambient", kind]`,
    Qln: `async (kind, request) => { globalThis.__ambientSuggestionRecoveryTest.requests.push({ kind, request }); }`,
    aun: `() => undefined`,
    mnt: `() => undefined`,
    nun: `() => undefined`,
    oun: `async (_client, queryKey) => { globalThis.__ambientSuggestionRecoveryTest.refreshes.push(queryKey); }`,
    pnt: `({ ambientSuggestions: { async hasAccessibleAndEnabledApp(input) { globalThis.__ambientSuggestionRecoveryTest.ambientChecks.push(input); return true; } } })`,
    q3t: `({ name: "apps-list-query" })`,
    s6t: `() => undefined`,
  },
};
globalThis.__ambientSuggestionRecoveryCache = cache;

function mock(name) {
  if (name === "rolldown-runtime") return "export {};";
  return [...(imports.get(name) ?? [])]
    .map(exportName => `export const ${exportName} = ${overrides[name]?.[exportName] ?? "() => undefined"};`)
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
      name: "ambient-suggestion-recovery-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\/new-chat-page-suggestions-eligibility$/ }, () => ({
          path: path.join(ROOT, "src/renderer/new-chat-page-suggestions-eligibility/index.ts"),
        }));
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice(8),
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({
          contents: mock(importPath),
          loader: "js",
        }));
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}-${Math.random()}`);
}

const eligibility = await bundle("new-chat-page-suggestions-eligibility");
eligibility.a();
const query = eligibility.o({ accountId: "account", enabled: true, hostId: "local" });
assert.deepEqual(query.queryKey, ["new-chat-suggestion-source", "has-accessible-enabled-ambient-suggestion-app", "local", "account"]);
assert.equal(query.staleTime, 300000);
assert.equal(query.retry, false);
assert.equal(await query.queryFn(), true);
assert.deepEqual(state.ambientChecks, [{ hostId: "local" }]);
assert.equal(eligibility.r({ experimentEligible: true, personalized: true }), "generated");
assert.equal(eligibility.i({ canUsePersonalizedSuggestions: true, generatedSuggestionsEnabled: true, hasGeneratedSuggestionsReadSettled: false, shouldUseCuratedNewChatPageSuggestions: false }), false);
assert.equal(eligibility.t({ areNewChatPageSuggestionsLoading: false, hasProjectRoot: true, shouldShowHomeSuggestions: true, shouldUseCuratedNewChatPageSuggestions: false }), true);

const refresh = await bundle("first-app-connect-ambient-suggestions");
refresh.t();
const queryClient = {
  getQueriesData: () => [["apps", [{ isAccessible: false, isEnabled: false }]]],
  invalidateQueries: async options => { state.invalidations.push(options.queryKey); },
};
const nextApps = [{ isAccessible: true, isEnabled: true }];
assert.equal(await refresh.n({ hostId: "local", queryClient, refreshAppsList: async () => nextApps }), nextApps);
assert.equal(state.requests.length, 2);
assert.deepEqual(state.requests.map(value => value.request.params.domain), [null, "science"]);
assert.deepEqual(state.invalidations, [["ambient", "ambient-suggestions"], ["ambient", "ambient-suggestions-refresh"]]);
assert.deepEqual(state.refreshes[1], ["new-chat-suggestion-source", "has-accessible-enabled-ambient-suggestion-app", "local"]);

console.log("15 ambient suggestion recovery assertions passed");
