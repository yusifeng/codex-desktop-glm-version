import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = [
  "conversation-source",
  "local-conversation-artifacts-signals",
  "local-conversation-thread-turn-entries",
];
const state = (globalThis.__conversationDerivedTest = {
  initialized: [],
  scopedFamilies: [],
  scrolls: [],
});

const importedNamesByModule = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  for (const match of source.matchAll(/import\s*{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) {
    const names = importedNamesByModule.get(match[2]) ?? new Set();
    for (const rawSpecifier of match[1].split(",")) {
      const specifier = rawSpecifier.trim();
      if (!specifier || specifier.startsWith("type ")) continue;
      names.add(specifier.split(/\s+as\s+/)[0]);
    }
    importedNamesByModule.set(match[2], names);
  }
}

const marker = name => `() => globalThis.__conversationDerivedTest.initialized.push(${JSON.stringify(name)})`;
const overrides = {
  "app-shared": {
    "$3": marker("compiler"),
    BI: `value => String(value).replaceAll("\\\\", "/").toLowerCase()`,
    FX: marker("signals"),
    H3: marker("preload"),
    HI: `(...parts) => parts.join("/").replaceAll("//", "/")`,
    HX: `signal => signal?.value ?? signal`,
    II: `value => String(value).split("/").at(-1) ?? ""`,
    OK: `value => new URL(value).href`,
    PK: `value => /^https?:/.test(value)`,
    QI: marker("query"),
    RI: marker("paths"),
    ZI: `{ id: "app-scope" }`,
    e6: `() => ({ useEffect: effect => effect() })`,
    hq: `server => server === "web"`,
    iW: `value => String(value).replaceAll("\\\\", "/")`,
    l3: `(left, right) => JSON.stringify(left) === JSON.stringify(right)`,
    rZ: `(scope, factory, options) => { const family = { scope, factory, options }; globalThis.__conversationDerivedTest.scopedFamilies.push(family); return family; }`,
    wL: marker("utilities"),
  },
  "app-initial": {
    AUt: marker("search-dom"),
    CUt: marker("match-finder"),
    DUt: `() => true`,
    EUt: `() => {}`,
    OUt: `(text, start, end) => text.slice(Math.max(0, start - 4), Math.min(text.length, end + 4))`,
    PUt: `async ({ query, texts }) => { try { const regex = new RegExp(query, "gi"); let totalMatches = 0; const offsets = texts.map(text => { const matches = [...text.matchAll(regex)].map(match => ({ start: match.index, end: match.index + match[0].length })); totalMatches += matches.length; return matches; }); return { offsets, totalMatches }; } catch (error) { return { error }; } }`,
    SUt: `(text, query, limit) => { const offsets = []; const lower = text.toLowerCase(); const needle = query.toLowerCase(); for (let index = lower.indexOf(needle); index >= 0; index = lower.indexOf(needle, index + Math.max(needle.length, 1))) offsets.push({ start: index, end: index + needle.length }); return { offsets: offsets.slice(0, limit), totalMatches: offsets.length }; }`,
    TUt: `() => {}`,
    _D: marker("highlighting"),
    _Ut: `(turnKey, unitId) => turnKey + ":" + unitId`,
    gUt: `location => [location.contextId, location.turnKey, location.unitId, location.equationIndex ?? "text", location.matchIndex].join(":")`,
    gmn: marker("uniq"),
    hUt: `() => {}`,
    iD: `{ value: null }`,
    jUt: `(text, range) => range`,
    kUt: `() => ({ offsets: [], totalMatches: 0 })`,
    tD: `{ value: null }`,
    wUt: `{}`,
    xUt: `() => null`,
    yUt: `() => ({})`,

    A_: `entry => entry.type === "estimated"`,
    A9t: `() => true`,
    D9t: `() => false`,
    E9t: marker("artifact-parser"),
    Fut: marker("turn-artifacts"),
    Grn: `text => ({ content: text, removed: false })`,
    H9t: `() => true`,
    HEt: `{ id: "providers-hook" }`,
    HZt: marker("conversation-scope"),
    Hnn: marker("artifact-extraction"),
    Knn: marker("artifact-keys"),
    Krn: marker("artifact-types"),
    MEt: `{ id: "provider-query" }`,
    Put: `() => []`,
    T9t: `input => input?.turn?.items?.filter(item => item.type === "artifact") ?? []`,
    V9t: marker("generated-images"),
    arn: marker("conversation-helpers"),
    bQt: `{ id: "output-directory" }`,
    ein: marker("artifact-urls"),
    fnn: marker("projection"),
    i$t: `{ id: "conversation-mode" }`,
    irn: `() => []`,
    k9t: marker("artifact-markdown"),
    k_: marker("turn-entry-model"),
    lQt: `{ id: "latest-turn" }`,
    mnn: `turn => ({ ...turn, items: turn.items, status: turn.status })`,
    nWt: marker("turn-entry-runtime"),
    tin: `() => false`,
    w$t: `items => items`,
    w9t: `value => value`,
    yhn: `({ content }) => ({ artifactScanContent: content })`,
  },
  "app-primary": {
    gf: marker("appgen"),
    hf: `text => text.includes("appgen://site-1") ? [{ projectId: "site-1", url: "appgen://site-1" }] : []`,
  },
  "highlight-selectors": {
    r: marker("highlight-selectors"),
    t: `matches => { const grouped = new Map(); for (const match of matches) { const key = match.location.turnKey + ":" + match.location.unitId; grouped.set(key, [...(grouped.get(key) ?? []), match]); } return grouped; }`,
  },
  "scroll-to-match": {
    n: `async input => globalThis.__conversationDerivedTest.scrolls.push(input)`,
    t: marker("scroll-to-match"),
  },
  "local-conversation-external-resources": {
    i: `resource => resource.activities?.some(activity => activity === "created" || activity === "updated")`,
    n: `() => []`,
    r: marker("external-resources"),
    t: `value => "url:" + value`,
  },
  "local-conversation-sources-signals": {
    n: marker("source-signals"),
    r: `{ id: "prior-turns" }`,
  },
  timestamps: {
    a: marker("timestamps"),
    i: `values => values.map((value, index) => value == null || index === 0 ? null : 1000 + index)`,
  },
  "split-items-into-render-groups": {
    n: `items => ({ assistantItem: null, toolOutputItems: items.filter(item => item.type === "imageGeneration") })`,
    t: marker("split-items"),
  },
  "generated-image-output-visibility": {
    n: `({ completedImages }) => completedImages.length === 0 ? null : ({ images: completedImages })`,
    r: marker("image-visibility"),
  },
};

function generic(moduleName, exportName) {
  return `(...args) => { globalThis.__conversationDerivedTest.initialized.push(${JSON.stringify(`${moduleName}:${exportName}`)}); return undefined; }`;
}

function mockModule(name) {
  if (name === "rolldown-runtime") return "export {};";
  if (name === "katex-renderer") return "export default { renderToString: value => value };";
  const names = importedNamesByModule.get(name) ?? new Set();
  return [...names]
    .map(exportName => `export const ${exportName} = ${overrides[name]?.[exportName] ?? generic(name, exportName)};`)
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
      name: "conversation-derived-mocks",
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
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}

const conversationSource = await bundle("conversation-source");
const turns = [{
  turnKey: "turn-1",
  units: [{ unitId: "unit-1", text: "Alpha beta alpha" }],
}];
const scrollAdapter = {
  getTurnContainer: () => ({ id: "container" }),
  scrollToTurn: async turnKey => state.scrolls.push({ turnKey }),
};
const source = conversationSource.t({ contextId: "thread-1", getTurns: () => turns, scrollAdapter });
const result = await source.search({ domain: "conversation", contextId: "thread-1", query: "alpha" });
assert.equal(result.matches.length, 2);
assert.equal(result.totalMatches, 2);
assert.equal(result.matches[0].ordinal, 1);
assert.equal(result.matches[1].location.matchIndex, 1);
assert.equal(result.matches[0].id, "thread-1:turn-1:unit-1:text:0");
assert.equal(result.isCapped, false);
const empty = await source.search({ domain: "conversation", contextId: "thread-1", query: "" });
assert.equal(empty.matches.length, 0);
const persistedSource = conversationSource.t({
  contextId: "thread-1",
  getTurns: () => turns,
  scrollAdapter,
  searchPersisted: async () => ({
    ...result,
    matches: [{ ...result.matches[0], id: "persisted", ordinal: 1 }],
    totalMatches: 4,
  }),
});
const merged = await persistedSource.search({ domain: "conversation", contextId: "thread-1", query: "alpha" });
assert.equal(merged.matches.length, 3);
assert.equal(merged.matches[0].id, "persisted");
assert.equal(merged.totalMatches, 4);
await source.ensureVisible(result.matches[0].location);
assert.equal(state.scrolls.at(-1).matchId, result.matches[0].id);
const mathSource = conversationSource.t({
  contextId: "math",
  getTurns: () => [{ turnKey: "turn-math", units: [{ unitId: "equation", text: "x", textChunks: ["x"], equations: ["\\alpha + β"] }] }],
  scrollAdapter,
  searchMath: true,
});
const mathResult = await mathSource.search({ domain: "conversation", contextId: "math", query: "α" });
assert.equal(mathResult.matches.length, 1);
assert.equal(mathResult.matches[0].location.equationIndex, 0);
conversationSource.n();
assert.equal(state.initialized.includes("scroll-to-match"), true);

const artifacts = await bundle("local-conversation-artifacts-signals");
assert.equal(artifacts.i("ig_abcdefabcdefabcdefabcdefabcdefab.png"), true);
assert.equal(artifacts.i("exec-12345678-1234-1234-1234-123456789abc.webp"), true);
assert.equal(artifacts.i("ordinary.png"), false);
artifacts.r();
assert.equal(typeof artifacts.n.factory, "function");
assert.equal(typeof artifacts.t.factory, "function");
const imageTurn = {
  status: "completed",
  params: { cwd: "/work", input: [{ type: "text", text: "appgen://site-1" }] },
  items: [{ type: "imageGeneration", id: "image-1", src: "output.png" }],
};
const values = new Map([
  ["prior-turns", [imageTurn]],
  ["latest-turn", null],
  ["conversation-mode", "projectless"],
  ["output-directory", "/out"],
]);
const get = signal => values.get(signal?.id);
const artifactList = artifacts.n.factory(
  { conversationId: "thread", hostId: "host" },
  { get },
);
assert.equal(artifactList.some(item => item.type === "generated-image"), true);
assert.equal(artifactList.some(item => item.type === "appgen-app"), true);
const localArtifactList = artifacts.t.factory({ conversationId: "thread" }, { get });
assert.equal(localArtifactList.some(item => item.type === "file"), true);
assert.equal(state.initialized.includes("external-resources"), true);

const turnEntries = await bundle("local-conversation-thread-turn-entries");
assert.equal(turnEntries.a({ type: "estimated", turnKey: "estimate" }), false);
assert.equal(turnEntries.a({ type: "voice-nux", turnKey: "voice" }), false);
assert.equal(turnEntries.a({ turnKey: "turn" }), true);
const generated = turnEntries.n({
  isAeonThread: false,
  isBackgroundSubagentsEnabled: false,
  requestUserInputAsyncUiEnabled: false,
  previousEntries: [],
  projectlessOutputDirectory: null,
  visibleTurnEntries: [{
    turnKey: "turn-1",
    turnSearchKey: "search-1",
    turn: { status: "completed", params: { input: [] }, items: [{ type: "imageGeneration", id: "image", src: "image.png" }] },
  }],
});
assert.equal(generated.length, 1);
const options = {
  conversationId: "thread-1",
  generatedImageTurnEntries: [],
  hostId: "host-1",
  isBackgroundSubagentsEnabled: false,
  previousEntries: [],
  renderEntries: [{
    turnKey: "source-key",
    turnSearchKey: "search-key",
    turnId: "turn-id",
    isLatestTurn: true,
    turn: { status: "completed", params: { input: [{ type: "text", text: "hello" }] }, items: [{ id: "agent", type: "agentMessage" }], turnStartedAtMs: 10, finalAssistantStartedAtMs: 20 },
  }],
  requestUserInputAsyncUiEnabled: false,
  showInProgressFixedContent: true,
  threadHandoffOperation: { id: "handoff" },
};
const built = turnEntries.t(options);
assert.equal(built.entries.length, 1);
assert.equal(built.entries[0].turnKey, "search-key");
assert.equal(built.entries[0].turnNumber, 1);
assert.equal(built.entries[0].totalTurnCount, 1);
assert.equal(built.entries[0].isMostRecentTurn, true);
assert.equal(built.entries[0].showInProgressFixedContent, true);
assert.equal(built.entries[0].threadHandoffOperation.id, "handoff");
assert.equal(built.latestRenderedTurnKey, "search-key");
const stable = turnEntries.t({ ...options, previousEntries: built.entries });
assert.equal(stable.entries, built.entries);
turnEntries.r();
assert.equal(state.initialized.includes("turn-entry-runtime"), true);

console.log("conversation derived state cluster assertions passed");
