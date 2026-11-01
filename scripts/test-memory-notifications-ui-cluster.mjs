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
  accountId: "account-1",
  userId: "user-1",
  access: { status: "allowed" },
  contacts: { email: "owner@example.test", phone_number: null },
  showChatGpt: false,
  importedSounds: [],
  previewedSounds: [],
  settingUpdates: [],
  streams: [],
  notificationPreferences: { turn: "unfocused", permissions: true, questions: true, sound: "default" },
};

const jsxRuntime = {
  Fragment: Symbol("Fragment"),
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
const reactRuntime = {
  useEffect: () => {},
  useId: () => "notification-control",
  useRef: value => ({ current: value }),
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
    if (pathname === "/notifications/settings") return {
      settings: [
        { category: "product", name: "Product updates", options: [{ channel: "email", enabled: true, name: "Email" }] },
        { category: "teen_safety", name: "Teen safety", options: [{ channel: "email", enabled: true, name: "Email" }, { channel: "sms", enabled: true, name: "SMS" }] },
      ],
    };
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
  "app-shared": {
    I3: "() => globalThis.__memoryNotificationsTest.jsxRuntime", e6: "() => globalThis.__memoryNotificationsTest.reactRuntime",
    ZI: "'app-scope'", LX: "() => ({get: signal => signal === 'account-id' ? globalThis.__memoryNotificationsTest.accountId : signal === 'user-id' ? globalThis.__memoryNotificationsTest.userId : signal === 'toast' ? {danger:(message)=>globalThis.__memoryNotificationsTest.toast=message} : signal, set: (signal, value) => globalThis.__memoryNotificationsTest.settingUpdates.push([signal, value])})",
    HX: "signal => signal === 'show-chatgpt' ? globalThis.__memoryNotificationsTest.showChatGpt : signal === 'platform' ? {platform:'darwin'} : signal === 'account-id' ? globalThis.__memoryNotificationsTest.accountId : signal === 'user-id' ? globalThis.__memoryNotificationsTest.userId : signal === 'account-access' ? globalThis.__memoryNotificationsTest.access : signal",
    BX: "query => query === 'contacts' ? {data:globalThis.__memoryNotificationsTest.contacts,isPending:false,isError:false,isFetching:false,refetch:()=>{}} : {data:undefined,isPending:false,isError:false,isFetching:false,refetch:()=>{}}",
    CL: "() => globalThis.__memoryNotificationsTest.queryClient",
    _L: "options => { const controller=new AbortController(); globalThis.__memoryNotificationsTest.remoteQueryPromise=options.queryFn({signal:controller.signal}); return {data:globalThis.__memoryNotificationsTest.notificationResponse,isPending:false,isError:false,isFetching:false,refetch:()=>{}}; }",
    iL: "options => ({mutate: input => { Promise.resolve(options.onMutate(input)).then(context => options.mutationFn(input).then(data => options.onSettled?.(data,null,input), error => options.onError?.(error,input,context))); }})",
    Y2: "'FormattedMessage'", rL: "'SettingsRow'", kf: "'Menu'", ek: "{Item:'MenuItem',CheckboxItem:'CheckboxItem'}", bD: "'check'", Lf: "'Switch'", Zc: "'SettingsContent'",
    n4: "() => ({formatMessage: message => message.defaultMessage ?? message.id})", pk: "'toast'", $O: "{ONE_MINUTE:60000}",
    FX: "()=>{}", K2: "()=>{}", QI: "()=>{}", Qc: "()=>{}", Zh: "()=>{}", lk: "()=>{}", wL: "()=>{}", xD: "()=>{}",
  },
  "app-initial": {
    cJt: "() => globalThis.__memoryNotificationsTest.initialized.push('api')", rJt: "globalThis.__memoryNotificationsTest.apiClient",
    tz: "{turnMode:'turn',permissionsEnabled:'permissions',questionsEnabled:'questions',sound:'sound'}",
    Kcn: "signal => globalThis.__memoryNotificationsTest.notificationPreferences[signal]", Ucn: "async (_scope, signal, value) => globalThis.__memoryNotificationsTest.settingUpdates.push([signal,value])",
    pnt: "{notifications:{importSound:async()=>{const sound={name:'Custom',path:'/tmp/custom.aiff'};globalThis.__memoryNotificationsTest.importedSounds.push(sound);return {status:'selected',sound}},previewSound:async sound=>{globalThis.__memoryNotificationsTest.previewedSounds.push(sound);return true}}}", Irn: "'platform'", xun: "'show-chatgpt'", Yl: "'SettingsTitle'", au: "'SettingsPage'", aa: "Object.assign('SettingsGroup',{Header:'SettingsGroupHeader',Content:'SettingsGroupContent'})",
    ql: "'MenuTrigger'", mun: "'account-id'", _un: "'user-id'", bL: "'account-access'", mC: "'contacts'", ru: "'Skeleton'",
    Sun: "()=>{}", Vcn: "()=>{}", Frn: "()=>{}", mnt: "()=>{}", iu: "()=>{}", su: "()=>{}", ca: "()=>{}", oa: "()=>{}", gC: "()=>{}",
  },
  "app-primary": {
    Gp: "async (...args) => globalThis.__memoryNotificationsTest.settingUpdates.push(args)",
    Wp: "() => globalThis.__memoryNotificationsTest.initialized.push('account-settings')",
  },
  "animated-icon": { n: "() => globalThis.__memoryNotificationsTest.initialized.push('animated-icon')", t: "props => ({ type: 'animated-icon', props })" },
  "chatgpt-saved-memory-state": { i: "() => globalThis.__memoryNotificationsTest.initialized.push('saved-memory-state')", t: "{ id: 'saved-memory-query' }" },
  "settings-loading-row": { n: "() => globalThis.__memoryNotificationsTest.initialized.push('loading-row')", t: "props => ({ type: 'loading-row', props })" },
};
Object.assign(state, { apiClient, jsxRuntime, reactRuntime });
state.notificationResponse = {
  settings: [
    { category: "product", name: "Product updates", options: [{ channel: "email", enabled: true, name: "Email" }] },
    { category: "teen_safety", name: "Teen safety", options: [{ channel: "email", enabled: true, name: "Email" }, { channel: "sms", enabled: true, name: "SMS" }] },
  ],
};
state.queryClient = {
  cancelQueries: async input => state.cancelled.push(input),
  getQueryData: () => state.notificationResponse,
  invalidateQueries: input => state.invalidated = input,
  setQueryData: (_key, update) => { state.notificationResponse = update(state.notificationResponse); },
};

function generic(moduleName, exportName) {
  return `(...args) => { globalThis.__memoryNotificationsTest.initialized.push(${JSON.stringify(`${moduleName}:${exportName}`)}); return args[0]; }`;
}
function mockModule(name) {
  if (name === "rolldown-runtime" || name === "saved-memory-history") return "export {};";
  const namespaceNames = name === "app-shared" ? Object.keys(overrides["app-shared"]) : name === "app-initial" ? Object.keys(overrides["app-initial"]) : [];
  return [...new Set([...(importedNamesByModule.get(name) ?? []), ...namespaceNames])].map(exportName =>
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
function renderedNodes(root) {
  const output = [];
  const visit = value => {
    if (value == null || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    if ("type" in value && "props" in value) {
      if (typeof value.type === "function") return visit(value.type(value.props ?? {}));
      output.push(value);
    }
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

// notifications-settings: local preferences, native sound, remote GET/PATCH and contact filtering
const notifications = await bundle("notifications-settings");
notifications.r();
assert.equal(state.initialized.includes("loading-row"), true);
const notificationTree = notifications.t();
assert.equal(notificationTree.type, jsxRuntime.Fragment);
const rows = notificationTree.props.children.slice(0, 3);
assert.deepEqual(rows.map(row => row.type), ["SettingsRow", "SettingsRow", "SettingsRow"]);
assert.equal(rows[0].props.label, "Turn completion notifications");
assert.equal(rows[0].props.control.type, "Menu");
assert.deepEqual(rows[0].props.control.props.children.map(option => option.props.children), ["Never", "Only when unfocused", "Always"]);
rows[0].props.control.props.children[2].props.onSelect();
assert.deepEqual(state.settingUpdates.at(-1), ["turn", "always"]);
assert.equal(rows[1].props.control.type, "Switch");
assert.equal(rows[1].props.control.props.checked, true);
rows[1].props.control.props.onChange(false);
assert.deepEqual(state.settingUpdates.at(-1), ["permissions", false]);
assert.equal(rows[2].props.control.props.checked, true);
const soundRow = notificationTree.props.children[3];
const soundRowView = soundRow.type(soundRow.props);
assert.equal(soundRowView.type, "SettingsRow");
assert.equal(soundRowView.props.control({}).type, "Menu");
const soundOptions = soundRowView.props.control({}).props.children;
assert.equal(soundOptions.some(option => option?.props?.children === "Choose custom sound…"), true);
await soundOptions.find(option => option?.props?.children === "Choose custom sound…").props.onSelect();
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(state.importedSounds.length, 1);
assert.equal(state.previewedSounds[0].name, "Custom");
const page = notifications.n();
assert.equal(page.type, "SettingsPage");
assert.equal(page.props.title.type, "SettingsTitle");
assert.equal(page.props.children, null);

state.showChatGpt = true;
const remotePage = notifications.n();
const categoryRows = renderedNodes(remotePage).filter(node => node.type === "SettingsRow" && ["Product updates", "Teen safety"].includes(node.props.label));
await state.remoteQueryPromise;
const getCall = state.apiCalls.findLast(call => call.method === "GET" && call.pathname === "/notifications/settings");
assert.equal(getCall.method, "GET");
assert.equal(getCall.pathname, "/notifications/settings");
assert.equal(getCall.options.additionalHeaders["ChatGPT-Account-ID"], "account-1");
assert.equal(categoryRows.length, 2);
const teenMenu = categoryRows.find(row => row.props.label === "Teen safety").props.control({});
assert.deepEqual(teenMenu.props.children.map(option => option.props.children), ["Email"]);
categoryRows[0].props.control({}).props.children[0].props.onCheckedChange(false);
await new Promise(resolve => setTimeout(resolve, 0));
const patchCall = state.apiCalls.findLast(call => call.method === "PATCH");
assert.equal(patchCall.pathname, "/notifications/settings");
assert.equal(patchCall.options.additionalHeaders["ChatGPT-Account-ID"], "account-1");
assert.deepEqual(patchCall.options.requestBody, { updates: { product: { email: false } } });

const assertionCount = [...fs.readFileSync(fileURLToPath(import.meta.url), "utf8").matchAll(/\bassert\.(?:equal|deepEqual|match|ok|rejects)\s*\(/g)].length;
console.log(`${assertionCount} memory and notifications UI cluster assertions passed`);
