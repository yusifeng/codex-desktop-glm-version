import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["saved-memories", "about-you-summary", "notifications-settings"];
const state = globalThis.__memoryNotificationsTest = {
  apiCalls: [],
  cancelled: [],
  initialized: [],
  settingUpdates: [],
  streams: [],
};

const jsxRuntime = {
  Fragment: Symbol("Fragment"),
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
const reactRuntime = {
  useEffect: () => {},
  useState(initial) {
    let value = typeof initial === "function" ? initial() : initial;
    return [value, next => { value = typeof next === "function" ? next(value) : next; }];
  },
};

const importedNamesByModule = new Map();
for (const directory of MODULES) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  for (const match of source.matchAll(/import\s*{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) {
    const names = importedNamesByModule.get(match[2]) ?? new Set();
    for (const raw of match[1].split(",")) {
      const specifier = raw.trim();
      if (specifier) names.add(specifier.split(/\s+as\s+/)[0]);
    }
    importedNamesByModule.set(match[2], names);
  }
}

const apiClient = {
  cancelStream(id) { state.cancelled.push(id); },
  async safeDelete(pathname, options) {
    state.apiCalls.push({ method: "DELETE", pathname, options });
    return { success: true };
  },
  async safeGet(pathname, options) {
    state.apiCalls.push({ method: "GET", pathname, options });
    return { memories: [] };
  },
  async safePatch(pathname, options) {
    state.apiCalls.push({ method: "PATCH", pathname, options });
    return { success: true };
  },
  async safePost(pathname, options) {
    state.apiCalls.push({ method: "POST", pathname, options });
    if (pathname === "/memories/about_you/summary") {
      return { generatedAtIso: "2026-09-27T00:00:00Z", sections: [{ id: "rest", title: "REST", description: "Fallback" }] };
    }
    return { success: true };
  },
  streamPost(pathname, options) {
    const stream = { id: `stream-${state.streams.length + 1}`, pathname, options };
    state.streams.push(stream);
    if (state.failNextStream) {
      state.failNextStream = false;
      queueMicrotask(() => options.onError({ error: "stream unavailable" }));
    }
    return stream.id;
  },
};

const overrides = {
  "app-shared": { I3: "() => globalThis.__memoryNotificationsTest.jsxRuntime", e6: "() => globalThis.__memoryNotificationsTest.reactRuntime" },
  "app-initial": { cJt: "() => globalThis.__memoryNotificationsTest.initialized.push('api')", rJt: "globalThis.__memoryNotificationsTest.apiClient" },
  "app-primary": {
    Gp: "async (...args) => globalThis.__memoryNotificationsTest.settingUpdates.push(args)",
    Wp: "() => globalThis.__memoryNotificationsTest.initialized.push('account-settings')",
  },
  "animated-icon": { n: "() => globalThis.__memoryNotificationsTest.initialized.push('animated-icon')", t: "props => ({ type: 'animated-icon', props })" },
  "chatgpt-saved-memory-state": { i: "() => globalThis.__memoryNotificationsTest.initialized.push('saved-memory-state')", t: "{ id: 'saved-memory-query' }" },
  "settings-loading-row": { n: "() => globalThis.__memoryNotificationsTest.initialized.push('loading-row')", t: "props => ({ type: 'loading-row', props })" },
};
Object.assign(state, { apiClient, jsxRuntime, reactRuntime });

function generic(moduleName, exportName) {
  return `(...args) => { globalThis.__memoryNotificationsTest.initialized.push(${JSON.stringify(`${moduleName}:${exportName}`)}); return args[0]; }`;
}
function mockModule(name) {
  if (name === "rolldown-runtime" || name === "saved-memory-history") return "export {};";
  return [...(importedNamesByModule.get(name) ?? [])].map(exportName =>
    `export const ${exportName} = ${overrides[name]?.[exportName] ?? generic(name, exportName)};`,
  ).join("\n");
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
      name: "memory-notification-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice("@rchunk/".length), namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mockModule(importPath), loader: "js" }));
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}

function nodes(root) {
  const output = [];
  const visit = value => {
    if (value == null || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    if ("type" in value && "props" in value) output.push(value);
    visit(value.props?.children);
  };
  visit(root);
  return output;
}
function byText(tree, text) {
  return nodes(tree).find(node => node.props?.children === text);
}

// saved-memories: 13 assertions
const saved = await bundle("saved-memories");
saved.n();
assert.equal(state.initialized.includes("api"), true);
assert.equal(state.initialized.includes("account-settings"), true);
assert.equal(state.initialized.includes("saved-memory-state"), true);
const savedTree = saved.t({
  accountId: "account-1",
  onClose: () => { state.closed = true; },
  onOptBackIn: () => { state.optedBackIn = true; },
  initialMemories: [
    { id: "warm-1", content: "Likes TypeScript", status: "warm" },
    { id: "cold-1", content: "Visited Kyoto", status: "cold" },
  ],
});
assert.equal(savedTree.props["aria-label"], "Saved memories");
assert.deepEqual(nodes(savedTree).filter(node => node.type === "li").map(node => node.props["data-memory-id"]), ["warm-1", "cold-1"]);
assert.equal(nodes(savedTree).find(node => node.props?.role === "searchbox").props.placeholder, "Search memories");
assert.match(nodes(savedTree).find(node => node.type === "a").props.href, /memory-faq/);
byText(savedTree, "Close").props.onClick();
assert.equal(state.closed, true);
await byText(savedTree, "Prioritize").props.onClick();
assert.equal(state.apiCalls.at(-1).pathname, "/memories/{memory_id}/status");
assert.equal(state.apiCalls.at(-1).options.requestBody.status, "warm");
await nodes(savedTree).find(node => node.type === "button" && node.props.children === "Delete").props.onClick();
assert.equal(state.apiCalls.at(-1).pathname, "/memories/{memory_id}");
assert.equal(state.apiCalls.at(-1).options.parameters.path.memory_id, "warm-1");
await byText(savedTree, "Delete all").props.onClick();
assert.equal(state.apiCalls.at(-1).pathname, "/settings/clear_account_user_memory");

// about-you-summary: 20 assertions
const about = await bundle("about-you-summary");
about.i();
assert.equal(state.initialized.includes("animated-icon"), true);
const callbacks = [];
const summaryPromise = about.a({
  accountId: "account-2",
  source: "personalization-setting",
  onStarted: value => callbacks.push(["started", value.sections.length]),
  onSectionTypes: value => callbacks.push(["types", value.length]),
  onUpdatedSection: value => callbacks.push(["section", value.id]),
});
const summaryStream = state.streams.at(-1);
assert.equal(summaryStream.pathname, "/memories/about_you/summary/regenerate");
assert.equal(summaryStream.options.additionalHeaders["ChatGPT-Account-ID"], "account-2");
assert.equal(summaryStream.options.parameters.query.source, "personalization-setting");
summaryStream.options.onEvent({ event: "started", data: { generatedAtIso: "start" } });
summaryStream.options.onEvent({ event: "section_types", data: { sections: ["profile"] } });
summaryStream.options.onEvent({ event: "section", data: { section: { id: "profile", title: "Profile", description: "Builder" } } });
summaryStream.options.onEvent({ event: "done", data: { generatedAtIso: "done", sections: [{ id: "profile", title: "Profile", description: "Builder" }] } });
const streamedSummary = await summaryPromise;
assert.equal(streamedSummary.sections[0].id, "profile");
assert.deepEqual(callbacks, [["started", 0], ["types", 1], ["section", "profile"]]);
assert.deepEqual(streamedSummary.sectionChanges, []);

const controller = new AbortController();
const cancelledPromise = about.a({ accountId: "account-2", signal: controller.signal });
const cancelledId = state.streams.at(-1).id;
controller.abort();
await assert.rejects(cancelledPromise, error => error.name === "AbortError");
assert.equal(state.cancelled.at(-1), cancelledId);

const correctionEvents = [];
const correctionPromise = about.o({ text: "I prefer Rust" }, {
  accountId: "account-2",
  onCorrectionTargets: value => correctionEvents.push(["targets", value.ids.length]),
  onAssistantResponse: value => correctionEvents.push(["assistant", value.text]),
  onUpdatedSection: value => correctionEvents.push(["updated", value.id]),
  onDeletedSection: value => correctionEvents.push(["deleted", value]),
});
const correctionStream = state.streams.at(-1);
assert.equal(correctionStream.pathname, "/memories/about_you/correction");
assert.deepEqual(JSON.parse(correctionStream.options.body), { text: "I prefer Rust" });
correctionStream.options.onEvent({ event: "correction_targets", data: { ids: ["profile"] } });
correctionStream.options.onEvent({ event: "assistant_response", data: { response: " Updated ", didUpdateSummary: true } });
correctionStream.options.onEvent({ event: "section", data: { section: { id: "profile", title: "Profile", description: "Rust" } } });
correctionStream.options.onEvent({ event: "section_deleted", data: { sectionId: "old" } });
correctionStream.options.onEvent({ event: "done", data: { ok: true } });
const correction = await correctionPromise;
assert.equal(correction.assistantResponse, "Updated");
assert.deepEqual(correctionEvents, [["targets", 1], ["assistant", "Updated"], ["updated", "profile"], ["deleted", "old"]]);

state.failNextStream = true;
const fallback = await about.r("account-3", { accountId: "account-3", contextualHint: "new job", source: "settings" });
assert.equal(fallback.sections[0].id, "rest");
assert.equal(state.apiCalls.at(-1).pathname, "/memories/about_you/summary");
assert.equal(state.apiCalls.at(-1).options.requestBody.force_regenerate, true);
assert.equal(state.apiCalls.at(-1).options.additionalHeaders["ChatGPT-Account-ID"], "account-3");
const aboutTree = about.t({ accountId: "account-4", onClose: () => {}, initialSummary: { sections: [{ id: "work", title: "Work", description: "Engineer" }] } });
assert.equal(nodes(aboutTree).find(node => node.type === "article").props["data-memory-section-id"], "work");
assert.equal(byText(aboutTree, "Regenerate").type, "button");
const aboutWrapper = about.n({ accountId: "account-4", onClose: () => {}, initialSummary: { sections: [] } });
assert.equal(typeof aboutWrapper.type, "function");

// notifications-settings: 12 assertions
const notifications = await bundle("notifications-settings");
notifications.r();
assert.equal(state.initialized.includes("loading-row"), true);
const changes = [];
const notificationTree = notifications.t({ onChange: value => changes.push(value), soundOptions: ["default", "Ping"] });
assert.equal(notificationTree.props.id, "chatgpt-notification-settings");
const selects = nodes(notificationTree).filter(node => node.type === "select");
assert.equal(selects[0].props.value, "unfocused");
assert.deepEqual(selects[0].props.children.map(option => option.props.value), ["off", "unfocused", "always"]);
selects[0].props.onChange({ currentTarget: { value: "always" } });
assert.equal(changes.at(-1).turnMode, "always");
const checkboxes = nodes(notificationTree).filter(node => node.type === "input");
assert.equal(checkboxes[0].props.checked, true);
assert.equal(checkboxes[1].props.checked, true);
checkboxes[0].props.onChange({ currentTarget: { checked: false } });
assert.equal(changes.at(-1).permissionsEnabled, false);
selects[1].props.onChange({ currentTarget: { value: "Ping" } });
assert.equal(changes.at(-1).sound, "Ping");
const loadingTree = notifications.t({ loading: true });
assert.equal(typeof loadingTree.type, "function");
const page = notifications.n({ available: false });
assert.equal(page.props["aria-label"], "Notifications settings");
assert.equal(nodes(page).some(node => node.type === "section"), false);

console.log("45 memory and notifications UI cluster assertions passed");
