import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["use-target-apps", "browser-skill-files"];
const state = (globalThis.__composerTargetsSkillsTest = {
  analytics: [],
  browserQueryFactory: null,
  desktopFetches: [],
  effects: [],
  fetchTargetCalls: [],
  hostDetect: new Map(),
  hostIcons: new Map(),
  initialized: [],
  mutationCalls: [],
  queryCache: new Map(),
  queryOptions: null,
  queryResult: {
    data: undefined,
    isFetching: false,
    refetch: async () => ({}),
  },
  querySetData: [],
  safePosts: [],
  toasts: [],
});

const importedNamesByModule = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(
    path.join(ROOT, "src/renderer", directory, "index.ts"),
    "utf8",
  );
  for (const match of source.matchAll(
    /import\s*(?:type\s*)?{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g,
  )) {
    const names = importedNamesByModule.get(match[2]) ?? new Set();
    for (const raw of match[1].split(",")) {
      const specifier = raw.trim().replace(/^type\s+/, "");
      if (specifier) names.add(specifier.split(/\s+as\s+/)[0]);
    }
    importedNamesByModule.set(match[2], names);
  }
}

const marker = (name) =>
  `() => globalThis.__composerTargetsSkillsTest.initialized.push(${JSON.stringify(name)})`;
const appScope = `{ id: "app-scope" }`;
const routeScope = `{ id: "route-scope" }`;
const identitySignal = `{ id: "identity" }`;
const enabledSignal = `{ id: "skills-enabled" }`;
const toastSignal = `{ id: "toast" }`;
const mutationSignal = `{ id: "open-mutation" }`;
const analyticsSignal = `{ id: "analytics" }`;
const attributionSignal = `{ id: "attribution" }`;

const overrides = {
  "app-shared": {
    $3: marker("compiler"),
    $O: `{ ONE_MINUTE: 60_000 }`,
    FX: marker("signals"),
    K2: marker("intl-runtime"),
    LX: `() => ({
      queryClient: {
        getQueryData(key) { return globalThis.__composerTargetsSkillsTest.queryCache.get(JSON.stringify(key)); },
        setQueryData(key, value) {
          const state = globalThis.__composerTargetsSkillsTest;
          const cacheKey = JSON.stringify(key);
          const current = state.queryCache.get(cacheKey);
          state.queryCache.set(cacheKey, typeof value === "function" ? value(current) : value);
        },
      },
      query: { setData(query, parameters, updater) { globalThis.__composerTargetsSkillsTest.querySetData.push({ query, parameters, updater }); } },
      get(signal) {
        const state = globalThis.__composerTargetsSkillsTest;
        if (signal?.id === "toast") return { danger(message, options) { state.toasts.push({ message, options }); } };
        if (signal?.id === "open-mutation") return { mutate(variables, callbacks) { state.mutationCalls.push({ variables, callbacks }); } };
        if (signal?.id === "attribution") return { threadId: "thread-1", turnId: "ignored" };
        if (signal?.id === "analytics") return { submitCodexAnalyticsEvent(event) { state.analytics.push(event); } };
        return undefined;
      },
    })`,
    NK: `value => value.startsWith("/workspace/")`,
    PK: `value => value.startsWith("file://")`,
    UI: `(request, signal) => signal?.aborted ? Promise.reject(new Error("aborted")) : request`,
    _L: `options => { globalThis.__composerTargetsSkillsTest.queryOptions = options; return globalThis.__composerTargetsSkillsTest.queryResult; }`,
    e6: `() => ({ useEffect: effect => globalThis.__composerTargetsSkillsTest.effects.push(effect), useEffectEvent: callback => callback })`,
    ek: marker("mutations"),
    gL: marker("use-query"),
    lk: marker("hooks"),
    n4: `() => ({ formatMessage: descriptor => descriptor.defaultMessage })`,
    pk: toastSignal,
    wL: marker("query-options"),
    QI: marker("query-runtime"),
    QX: `(scope, factory) => { globalThis.__composerTargetsSkillsTest.browserQueryFactory = factory; return { kind: "readable-family", scope, getOptions: (parameter, context) => factory(parameter, context) }; }`,
    ZI: appScope,
  },
  "app-initial": {
    $en: routeScope,
    Cpn: analyticsSignal,
    _ft: marker("open-target-mutation"),
    fgn: marker("account-state"),
    hft: mutationSignal,
    itn: marker("route-state"),
    mft: marker("target-query"),
    mnt: marker("app-services"),
    pnt: `{
      openIn: {
        detectTarget: async ({ target }) => { const value = globalThis.__composerTargetsSkillsTest.hostDetect.get(target); if (value instanceof Error) throw value; return { available: value }; },
        loadTargetIcon: async ({ target }) => { const value = globalThis.__composerTargetsSkillsTest.hostIcons.get(target); if (value instanceof Error) throw value; return { icon: value }; },
      },
    }`,
    vft: `{ getOptions: parameters => ({ queryKey: ["target-apps", parameters.cwd, parameters.hostId, parameters.path, parameters.deferEnrichment] }) }`,
    yft: `async (parameters, signal) => { const state = globalThis.__composerTargetsSkillsTest; state.fetchTargetCalls.push({ parameters, signal }); return state.nextTargetResult; }`,
    ypn: marker("analytics-runtime"),
    _dn: `{ getInstance: () => ({ fetch: async (url, options) => { const state = globalThis.__composerTargetsSkillsTest; state.desktopFetches.push({ url, options }); return { arrayBuffer: async () => Uint8Array.from([108, 101, 103, 97, 99, 121]).buffer }; } }) }`,
    cJt: marker("authentication"),
    oJt: `() => ({ Authorization: "Bearer test" })`,
    rJt: `{ safePost: async (url, options) => { const state = globalThis.__composerTargetsSkillsTest; state.safePosts.push({ url, options }); return state.safePostResult; } }`,
    ydn: marker("api-runtime"),
  },
  "codex-analytics-attribution": {
    n: attributionSignal,
    t: marker("analytics-attribution"),
  },
  "browser-skills-state": {
    d: identitySignal,
    n: marker("browser-skills-state"),
    s: enabledSignal,
  },
};

function mockModule(name) {
  if (name === "rolldown-runtime")
    return "export const n=initializer=>{let done=false;return()=>{if(!done){done=true;initializer();}}};";
  const names = importedNamesByModule.get(name) ?? new Set();
  return [...names]
    .map(
      (exportName) =>
        `export const ${exportName} = ${overrides[name]?.[exportName] ?? "undefined"};`,
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
    plugins: [
      {
        name: "composer-targets-skills-mocks",
        setup(build) {
          build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
            path: importPath.slice(8),
            namespace: "mock",
          }));
          build.onLoad(
            { filter: /.*/, namespace: "mock" },
            ({ path: importPath }) => ({
              contents: mockModule(importPath),
              loader: "js",
            }),
          );
        },
      },
    ],
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`
  );
}

// use-target-apps: 32 assertions
const targets = await bundle("use-target-apps");
targets.n();
targets.n();
assert.equal(
  state.initialized.filter((name) => name === "app-services").length,
  1,
);
assert.equal(state.initialized.includes("target-query"), true);
assert.deepEqual(Object.keys(targets).sort(), ["n", "r", "t"]);

state.queryResult = {
  data: undefined,
  isFetching: false,
  refetch: async () => ({}),
};
let targetHook = targets.r({});
assert.equal(targetHook.canLoadTargets, false);
assert.equal(targetHook.hasLoadedTargets, false);
assert.equal(state.queryOptions.enabled, false);

state.nextTargetResult = {
  targets: [
    {
      id: "native",
      target: "chrome",
      kind: "native",
      appPath: "/Applications/Chrome.app",
    },
  ],
};
targetHook = targets.r({
  cwd: "/workspace/project",
  openPath: "/workspace/project/file.ts",
  deferEnrichment: false,
});
assert.equal(targetHook.canLoadTargets, true);
assert.equal(state.queryOptions.enabled, false);
const normalResult = await state.queryOptions.queryFn({
  signal: new AbortController().signal,
});
assert.equal(normalResult.targets[0].target, "chrome");
assert.equal(
  state.fetchTargetCalls.at(-2).parameters.nativeBrowserDiscovery,
  "known",
);
assert.equal(
  state.fetchTargetCalls.at(-1).parameters.nativeBrowserDiscovery,
  undefined,
);
assert.equal(
  state.queryCache.get(JSON.stringify(state.queryOptions.queryKey)).targets[0]
    .appPath,
  "/Applications/Chrome.app",
);

state.hostDetect.set("editor", true);
state.hostDetect.set("missing", false);
state.hostDetect.set("broken", new Error("detect failed"));
state.hostIcons.set("editor", "editor-icon");
state.nextTargetResult = {
  targets: [
    { id: "editor-id", target: "editor", kind: "editor" },
    { id: "missing-id", target: "missing", kind: "native" },
    { id: "broken-id", target: "broken", kind: "native" },
  ],
};
targets.r({
  cwd: "/workspace/project",
  deferEnrichment: true,
  turnId: "turn-9",
});
assert.equal(state.queryOptions.enabled, true);
const enriched = await state.queryOptions.queryFn({
  signal: new AbortController().signal,
});
assert.deepEqual(enriched.availableTargets, ["editor"]);
assert.equal(enriched.targets[0].resolvedIcon, "editor-icon");
assert.equal(enriched.targets[1].resolvedIcon, null);
assert.equal(enriched.targets[2].available, false);

state.queryResult = {
  data: enriched,
  isFetching: true,
  refetch: async () => ({}),
};
targetHook = targets.r({
  cwd: "/workspace/project",
  deferEnrichment: true,
  turnId: "turn-9",
});
assert.equal(targetHook.isLoadingTargets, true);
assert.equal(targetHook.targets.length, 3);
assert.deepEqual(targetHook.availableTargets, ["editor"]);
targetHook.open("editor", {
  appPath: undefined,
  line: 7,
  persistPreferred: true,
});
assert.equal(state.analytics.length, 1);
assert.equal(state.analytics[0].action, "open_in_ide");
assert.equal(state.mutationCalls.at(-1).variables.path, "/workspace/project");
assert.equal(
  state.mutationCalls.at(-1).variables.persistPreferredTargetPath,
  "/workspace/project",
);
assert.equal(state.querySetData.length, 1);
const preferred = state.querySetData[0].updater(enriched);
assert.equal(preferred.preferredTarget, "editor");
assert.equal(preferred.targets[0].default, true);
state.mutationCalls.at(-1).callbacks.onSuccess({ success: false });
assert.equal(state.toasts.at(-1).message, "Unable to open item");
targetHook.open("editor", {
  path: "https://example.com",
  persistPreferred: false,
});
assert.equal(state.mutationCalls.at(-1).variables.path, "https://example.com");

state.effects.length = 0;
state.queryResult = {
  data: undefined,
  isFetching: false,
  refetch: async () => ({}),
};
assert.equal(targets.t({ cwd: "/workspace/project", delayMs: 25 }), null);
assert.equal(state.queryOptions.enabled, false);
assert.equal(state.effects.length, 1);

// browser-skill-files: 24 assertions
const files = await bundle("browser-skill-files");
files.n();
files.n();
assert.equal(
  state.initialized.filter((name) => name === "browser-skills-state").length,
  1,
);
assert.equal(state.initialized.includes("authentication"), true);
assert.deepEqual(Object.keys(files).sort(), ["n", "r", "t"]);

let bytes = await files.t("acct", { id: "legacy/id", files: {} }, "SKILL.md");
assert.equal(new TextDecoder().decode(bytes), "legacy");
assert.equal(
  state.desktopFetches.at(-1).url,
  "/hazelnuts/legacy%2Fid/files/download",
);
assert.equal(
  state.desktopFetches.at(-1).options.headers["ChatGPT-Account-ID"],
  "acct",
);
assert.equal(
  state.desktopFetches.at(-1).options.body,
  JSON.stringify({ path: "SKILL.md" }),
);

await assert.rejects(
  () => files.t("acct", { id: "s", sediment_id: "sed", files: {} }, "missing"),
  /Skill file is missing/,
);
bytes = await files.t(
  "acct",
  { id: "s", sediment_id: "sed", files: { empty: { start: 4, length: 0 } } },
  "empty",
);
assert.equal(bytes.byteLength, 0);
state.safePostResult = {};
await assert.rejects(
  () =>
    files.t(
      "acct",
      { id: "s", sediment_id: "sed", files: { a: { start: 2, length: 3 } } },
      "a",
    ),
  /download URL is missing/,
);

const originalFetch = globalThis.fetch;
state.safePostResult = { download_url: "https://download.test/file" };
globalThis.fetch = async (_url, options) =>
  new Response(Uint8Array.from([2, 3, 4]), {
    status: 206,
    headers: {
      "Content-Range": "bytes 2-4/10",
      "X-Range": options.headers.Range,
    },
  });
bytes = await files.t(
  "acct",
  { id: "s", sediment_id: "sed", files: { a: { start: 2, length: 3 } } },
  "a",
);
assert.deepEqual([...new Uint8Array(bytes)], [2, 3, 4]);
assert.equal(state.safePosts.at(-1).options.requestBody.file_id, "sed");
assert.equal(state.safePosts.at(-1).options.parameters.path.hazelnut_id, "s");

globalThis.fetch = async () =>
  new Response(Uint8Array.from([0, 1, 2, 3, 4, 5]), { status: 200 });
bytes = await files.t(
  "acct",
  { id: "s", sediment_id: "sed", files: { a: { start: 2, length: 3 } } },
  "a",
);
assert.deepEqual([...new Uint8Array(bytes)], [2, 3, 4]);
globalThis.fetch = async () =>
  new Response(Uint8Array.from([2, 3, 4]), {
    status: 206,
    headers: { "Content-Range": "bytes 1-3/10" },
  });
await assert.rejects(
  () =>
    files.t(
      "acct",
      { id: "s", sediment_id: "sed", files: { a: { start: 2, length: 3 } } },
      "a",
    ),
  /Mismatched skill file range/,
);
globalThis.fetch = async () =>
  new Response(Uint8Array.from([2, 3]), { status: 206 });
await assert.rejects(
  () =>
    files.t(
      "acct",
      { id: "s", sediment_id: "sed", files: { a: { start: 2, length: 3 } } },
      "a",
    ),
  /Incomplete skill file/,
);
globalThis.fetch = async () => new Response("denied", { status: 403 });
await assert.rejects(
  () =>
    files.t(
      "acct",
      { id: "s", sediment_id: "sed", files: { a: { start: 2, length: 3 } } },
      "a",
    ),
  /download failed/,
);
globalThis.fetch = originalFetch;

const skill = {
  id: "skill-1",
  sediment_id: "sed",
  check_sum_hash: "sum",
  files: { "SKILL.md": { start: 0, length: 0 } },
  permissions: { can_read: true },
};
const queryOptions = files.r.getOptions(
  { skill, path: "SKILL.md" },
  {
    get: (signal) =>
      signal.id === "identity" ? { accountId: "acct", userId: "user" } : true,
  },
);
assert.deepEqual(queryOptions.queryKey, [
  "browser-skills",
  "acct",
  "user",
  "file",
  "skill-1",
  "sed",
  "sum",
  "SKILL.md",
]);
assert.equal(queryOptions.enabled, true);
assert.equal(queryOptions.staleTime, 300_000);
assert.equal(
  await queryOptions.queryFn({ signal: new AbortController().signal }),
  "",
);
const disabledOptions = files.r.getOptions(
  { skill: { ...skill, permissions: { can_read: false } }, path: "SKILL.md" },
  {
    get: (signal) =>
      signal.id === "identity" ? { accountId: "acct", userId: "user" } : true,
  },
);
assert.equal(disabledOptions.enabled, false);
const noAccountOptions = files.r.getOptions(
  { skill, path: "SKILL.md" },
  { get: () => null },
);
assert.equal(noAccountOptions.enabled, false);
await assert.rejects(
  () => noAccountOptions.queryFn({ signal: new AbortController().signal }),
  /Skills account unavailable/,
);

console.log("composer targets/skills cluster tests passed (56 assertions)");
