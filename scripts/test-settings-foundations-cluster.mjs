import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = [
  "settings-host-dropdown",
  "personalization-state",
  "plugins-settings-row",
  "settings-loading-row",
  "dock-icon-setting-visibility",
  "import-settings-gate",
  "chronicle-settings",
  "memory-manager-gate",
  "hooks-settings-copy",
  "hooks-settings-model",
];
const state = (globalThis.__settingsFoundationsTest = {
  apiGets: [],
  apiPatches: [],
  apiPosts: [],
  families: [],
  features: [],
  initialized: [],
  mutations: [],
  queryUpdates: [],
  stateCursor: 0,
  stateValues: [],
  jsx: {
    jsx: (type, props, key) => ({ type, props, key }),
    jsxs: (type, props, key) => ({ type, props, key }),
  },
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
  `() => globalThis.__settingsFoundationsTest.initialized.push(${JSON.stringify(name)})`;
const overrides = {
  "app-shared": {
    $O: `{ ONE_MINUTE: 60000 }`,
    BX: `() => ({ data: globalThis.__settingsFoundationsTest.features })`,
    Cq: `{ Agent: "agent" }`,
    FX: marker("signals"),
    G2: `messages => messages`,
    I3: `() => globalThis.__settingsFoundationsTest.jsx`,
    K2: marker("internationalization"),
    Lf: `"Switch"`,
    QI: marker("queries"),
    QX: `(scope, factory) => { const family = { scope, factory, kind: "query" }; globalThis.__settingsFoundationsTest.families.push(family); return family; }`,
    Qh: `"LoadingSpinner"`,
    Y2: `"FormattedMessage"`,
    Yh: `"Button"`,
    ZI: `{ id: "app-scope" }`,
    bD: `{ name: "selected" }`,
    db: `"FilterIcon"`,
    e6: `() => globalThis.__settingsFoundationsTest.react`,
    ek: marker("http"),
    jf: `{ Title: "MenuTitle", Section: "MenuSection", Item: "MenuItem" }`,
    kf: `"Dropdown"`,
    lw: marker("icons"),
    n4: `() => ({ formatMessage: (message, values) => message.defaultMessage.replace("{index}", String(values?.index ?? "")) })`,
    pL: `options => options`,
    rZ: `(scope, factory) => { const family = { scope, factory, kind: "signal" }; globalThis.__settingsFoundationsTest.families.push(family); return family; }`,
    rl: `"SettingsRow"`,
    wL: marker("utilities"),
  },
  "app-initial": {
    Bfn: marker("host-runtime"),
    Mdn: `"Codex"`,
    U6t: `{ id: "account" }`,
    Yg: `"LocalIcon"`,
    bRt: `async () => Object.assign(new Blob(["image"]), { name: "photo.png" })`,
    cJt: marker("api-client"),
    cnt: `() => ({ isPending: false, mutate(input, options) { globalThis.__settingsFoundationsTest.mutations.push(input); options.onSuccess(); } })`,
    gb: `"HostIcon"`,
    ont: `{ id: "features" }`,
    ql: `"SelectedHostTrigger"`,
    rJt: `{
      async safeGet(path, options) { globalThis.__settingsFoundationsTest.apiGets.push({ path, options }); return { items: globalThis.__settingsFoundationsTest.photos ?? [] }; },
      async safePost(path, options) { globalThis.__settingsFoundationsTest.apiPosts.push({ path, options }); return path.includes("profile_files") ? { id: "upload", kind: "self", created_at: "", asset_pointer: "sediment://bucket#file_123#thumbnail" } : { id: "saved", kind: options.requestBody.kind, created_at: "2026-01-01", asset_pointer: options.requestBody.asset_pointer }; },
      async safePatch(path, options) { globalThis.__settingsFoundationsTest.apiPatches.push({ path, options }); return { id: options.parameters.path.image_tag_id, kind: "self", created_at: "2026-01-02", asset_pointer: options.requestBody.asset_pointer }; }
    }`,
    ugn: `"local"`,
    yRt: marker("personalization-runtime"),
  },
};

function generic(moduleName, exportName) {
  return `(...args) => { globalThis.__settingsFoundationsTest.initialized.push(${JSON.stringify(`${moduleName}:${exportName}`)}); return undefined; }`;
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
  state.stateCursor = 0;
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "settings-foundations-mocks",
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

state.react = {
  useState(initial) {
    const index = state.stateCursor++;
    const value = state.stateValues[index] ?? initial;
    return [value, next => {
      state.stateValues[index] = typeof next === "function" ? next(value) : next;
    }];
  },
};

// settings-host-dropdown: 8
const hosts = await bundle("settings-host-dropdown");
let selectedHost;
let hostNode = hosts.t({ connectedRemoteConnections: [{ hostId: "remote-1", displayName: "Build Mac" }], onSelectHost: value => { selectedHost = value; }, selectedHostId: "remote-1", showConnectedIndicator: true });
assert.equal(hostNode.type, "Dropdown");
assert.equal(hostNode.props.align, "end");
assert.equal(hostNode.props.triggerButton.type, "SelectedHostTrigger");
assert.equal(hostNode.props.triggerButton.props.children[1].props.children, "Build Mac");
const hostItems = hostNode.props.children[1].props.children;
assert.equal(hostItems.length, 2);
hostItems[0].props.onSelect();
assert.equal(selectedHost, "local");
hostNode = hosts.t({ connectedRemoteConnections: [], disabled: true, onSelectHost() {}, selectedHostId: "local", triggerVariant: "filter" });
assert.equal(hostNode.type, "Button");
hosts.n();
assert.equal(state.initialized.includes("host-runtime"), true);

// personalization-state: 12
const personalization = await bundle("personalization-state");
state.photos = [{ id: "old", kind: "self", created_at: "2025-01-01" }];
const photoQuery = personalization.a("account-1");
assert.deepEqual(photoQuery.queryKey, ["chatgpt-reference-photos", "account-1"]);
assert.equal(photoQuery.staleTime, 60000);
assert.equal((await photoQuery.queryFn({}))[0].id, "old");
assert.equal(state.apiGets.at(-1).options.additionalHeaders["ChatGPT-Account-ID"], "account-1");
const photos = [
  { id: "self", kind: "self", created_at: "2026-01-01" },
  { id: "body-old", kind: "full_body_likeness", created_at: "2025-01-01" },
  { id: "body-new", kind: "full_body_likeness", created_at: "2026-01-01" },
];
assert.equal(personalization.o(photos).id, "body-new");
assert.equal(personalization.o(photos, "self").id, "self");
assert.equal(personalization.o([], "self"), null);
const queryClient = {
  async cancelQueries(query) { state.queryUpdates.push(["cancel", query]); },
  async invalidateQueries(query) { state.queryUpdates.push(["invalidate", query]); },
  setQueryData(query, updater) { state.queryUpdates.push(["set", query, updater([{ id: "old", kind: "self", created_at: "" }])]); },
};
const savedPhoto = await personalization.s({ get: () => "account-1", queryClient }, { accountId: "account-1", imageFile: {}, kind: "self" });
assert.equal(savedPhoto.id, "saved");
assert.equal(state.apiPosts[0].path, "/calpico/chatgpt/profile_files");
assert.equal(state.apiPosts[1].options.requestBody.asset_pointer, "sediment://file_123");
assert.equal(state.queryUpdates.map(([kind]) => kind).join(","), "cancel,set,invalidate");
personalization.n();
assert.equal(state.families.slice(-2).map(family => family.kind).join(","), "query,signal");

// plugins-settings-row: 7
const plugins = await bundle("plugins-settings-row");
state.features = [];
state.stateValues = [];
state.stateCursor = 0;
assert.equal(plugins.t({ hostId: "local" }), null);
state.features = [{ name: "apps", enabled: true }, { name: "plugins", enabled: false }];
state.stateValues = [];
state.stateCursor = 0;
const pluginRow = plugins.t({ hostId: "local" });
assert.equal(pluginRow.type, "SettingsRow");
assert.equal(pluginRow.props.control.type, "Switch");
assert.equal(pluginRow.props.control.props.checked, false);
pluginRow.props.control.props.onChange(true);
assert.deepEqual(state.mutations.at(-1), { featureName: "plugins", enabled: true });
assert.equal(state.stateValues[0], true);
plugins.n();
assert.equal(state.initialized.includes("internationalization"), true);

// settings-loading-row: 3
const loading = await bundle("settings-loading-row");
const loadingNode = loading.t({ children: "Loading hosts" });
assert.equal(loadingNode.props.role, "status");
assert.equal(loadingNode.props.children.type, "SettingsRow");
assert.equal(loadingNode.props.children.props.label.props.children[1].props.children, "Loading hosts");

// dock-icon-setting-visibility: 4
const dock = await bundle("dock-icon-setting-visibility");
assert.equal(dock.t({ platform: "Windows", dockIconPreviews: "preview" }), null);
assert.equal(dock.t({ platform: "macOS", buildFlavor: "agent", dockIconPreviews: "preview" }), null);
assert.equal(dock.t({ platform: "macOS", dockIconPreviews: "preview" }), "preview");
dock.n();
assert.equal(state.initialized.includes("utilities"), true);

// three settings gates: 6
const importGate = await bundle("import-settings-gate");
importGate.n();
assert.equal(importGate.t, "3278809559");
assert.equal(typeof importGate.n, "function");
const chronicle = await bundle("chronicle-settings");
chronicle.n();
assert.equal(chronicle.t, "chronicle");
assert.equal(typeof chronicle.n, "function");
const memoryGate = await bundle("memory-manager-gate");
assert.equal(memoryGate.t(), "3466753652");
assert.equal(memoryGate.n(), undefined);

// hooks-settings-copy: 7
const copy = await bundle("hooks-settings-copy");
const intl = { formatMessage: (message, values) => message.defaultMessage.replace("{index}", String(values?.index ?? "")) };
assert.equal(copy.n("preToolUse", intl), "PreToolUse");
assert.equal(copy.n("interrupt", intl), "Interrupt");
assert.equal(copy.t("subagentStop", intl), "When a subagent stops");
assert.equal(copy.r(2, intl), "Hook 3");
assert.equal(copy.i("plugin-name@1.2.3"), "plugin-name");
assert.equal(copy.i(""), null);
copy.a();
assert.equal(state.initialized.includes("internationalization"), true);

// hooks-settings-model: 15
const model = await bundle("hooks-settings-model");
const hookList = [
  { key: "a", eventName: "preToolUse", displayOrder: 2, enabled: true, trustStatus: "trusted", source: "user" },
  { key: "b", eventName: "preToolUse", displayOrder: 1, enabled: false, trustStatus: "modified", source: "plugin", pluginId: "p1" },
  { key: "c", eventName: "stop", displayOrder: 3, enabled: true, trustStatus: "managed", source: "system" },
];
assert.equal(model.m(hookList[1]), true);
assert.equal(model.m(hookList[0]), false);
assert.equal(model.o(hookList), 1);
assert.deepEqual(model.a(hookList, "preToolUse").map(hook => hook.key), ["b", "a"]);
const eventSummary = model.r(hookList);
assert.equal(eventSummary.length, 2);
assert.equal(eventSummary[0].active, 1);
assert.equal(eventSummary[0].needsReview, 1);
assert.deepEqual(model.s(["z", "a"], ["a", "b"], "selected"), ["a", "b", "z", "selected"]);
assert.equal(model.f([hookList[2]]), "admin");
assert.equal(model.f([hookList[0], hookList[2]]), null);
assert.deepEqual(model.n({ hooks: hookList, warnings: ["warning"], errors: [{ path: "x", message: "bad" }] }), { issueCount: 2, needsReview: 1 });
assert.deepEqual(model.u({ source: "project", projectRoot: "/repo", projectRoots: ["/repo"] }), { source: "project", projectRoot: "/repo" });
assert.deepEqual(model.u({ source: "plugin", pluginId: "__unknown__" }), { source: "plugin", pluginId: null });
assert.equal(model.t, "__unknown__");
assert.equal(model.p(), undefined);
const grouped = model.i([
  { cwd: "/repo", hooks: [hookList[0]], warnings: ["user-warning"], errors: [] },
  { cwd: "/repo", hooks: [hookList[1]], warnings: ["plugin-warning"], errors: [{ path: "hooks.json", message: "bad" }] },
  { cwd: "/repo", hooks: [hookList[2]], warnings: [], errors: [] },
  { cwd: "/project", hooks: [{ ...hookList[0], key: "project", source: "project" }], warnings: ["project-warning"], errors: [] },
]);
assert.deepEqual(grouped.map(group => group.id), ["plugin", "user", "admin", "project"]);
assert.equal(grouped[0].pluginEntries[0].pluginId, "p1");
assert.equal(grouped[0].entry.warnings[0], "plugin-warning");
assert.equal(model.d(grouped, { source: "plugin", pluginId: "p1" }).hooks[0].key, "b");
assert.equal(model.d(grouped, { source: "project", projectRoot: "/project" }).hooks[0].key, "project");

console.log("62 settings foundations cluster assertions passed");
