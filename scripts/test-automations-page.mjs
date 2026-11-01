import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_PATH = path.join(ROOT, "src/renderer/automations-page/index.ts");
const source = fs.readFileSync(SOURCE_PATH, "utf8");
const expectedDependencies = [
  "app-initial", "app-primary", "app-shared", "automation-delete-confirmation-dialog",
  "automation-frequency-section", "cloud-automation-detail-panel", "document-search",
  "editor-dialog", "elicitation-events", "habitat-automation-migration-state",
  "rolldown-runtime", "schedule-fields", "use-plugin-scheduled-tasks",
];
const actualDependencies = [...source.matchAll(/@rchunk\/([a-z0-9.-]+)/g)].map((match) => match[1]);
assert.deepEqual([...new Set(actualDependencies)].sort(), expectedDependencies);
assert.equal(source.includes("import("), false, "keeps zero dynamic dependencies");
assert.equal(/\bany\b/.test(source), false, "does not introduce any");
assert.match(source, /export \{ AutomationsLayoutPage \};/, "keeps the public export");

const state = {
  initialized: [],
  runtime: {
    account: { accountId: "account-1" },
    cloud: { accountId: "account-1", items: [{ automation: { id: "runtime-cloud", name: "Cloud monitor", prompt: "Watch changes", status: "PAUSED" } }] },
    local: { items: [{ id: "runtime-local", name: "Runtime brief", prompt: "Summarize", status: "ACTIVE" }] },
    history: {
      items: [{ id: "runtime-run", automationId: "runtime-local", createdAt: 4, status: "COMPLETED", threadId: "runtime-thread", title: "Runtime result" }],
      markAllRead: () => { state.runtime.markedAllRead = true; },
      unreadRunCounts: { automationIds: ["runtime-local"] },
    },
    mutations: [],
    cloudMutations: [],
    refetches: 0,
  },
  jsx: {
    Fragment: "Fragment",
    jsx: (type, props, key) => typeof type === "function" ? type(props ?? {}) : ({ type, props: props ?? {}, key }),
    jsxs: (type, props, key) => typeof type === "function" ? type(props ?? {}) : ({ type, props: props ?? {}, key }),
  },
};
globalThis.__automationsPageTest = state;

const mocks = {
  "app-shared": `
    const state = globalThis.__automationsPageTest;
    export const I3 = () => state.jsx;
    export const $3 = () => state.initialized.push("app-shared:$3");
    export const K2 = () => state.initialized.push("app-shared:K2");
    export const BX = (signal, input) => signal === "capability" ? ({ isCapable: input.name === "automations.local" || input.name === "automations.cloud" }) : false;
    export const HX = signal => signal === "account" ? state.runtime.account : signal === "local" ? ({ data: state.runtime.local, isLoading: false }) : signal.startsWith?.("cloud-") ? ({ mutate: variables => state.runtime.cloudMutations.push([signal, variables]) }) : ({ data: state.runtime.cloud, isFetching: false, refetch: () => { state.runtime.refetches += 1; } });
    const react = { useState: initial => [initial, () => {}] };
    export const e6 = Object.assign(() => react, react);
  `,
  "app-initial": `
    export const Xet = "capability";
    export const yun = "account";
    export const QCt = "local";
    export const itt = "cloud";
    export const MC = () => globalThis.__automationsPageTest.runtime.history;
    export const iun = (operation, options) => ({ mutate: variables => { globalThis.__automationsPageTest.runtime.mutations.push([operation, variables]); options?.onSuccess?.({ success: true }, variables); } });
    export const Ftt = input => ({ contract: "create", ...input });
    export const Vtt = input => ({ contract: "update", ...input });
    export const Btt = (automation, status) => ({ contract: "status", id: automation.id, status });
    export const dtt = "cloud-create";
    export const ptt = "cloud-update";
    export const att = "cloud-delete";
    export const htt = (draft, timeZone) => ({ contract: "cloud", name: draft.name, prompt: draft.prompt, timeZone });
  `,
  "app-primary": `export const n = () => globalThis.__automationsPageTest.initialized.push("app-primary");`,
  "elicitation-events": `export const n = () => globalThis.__automationsPageTest.initialized.push("elicitation:n"); export const t = () => globalThis.__automationsPageTest.initialized.push("elicitation:t");`,
  "cloud-automation-detail-panel": `export const t = () => globalThis.__automationsPageTest.initialized.push("cloud-detail"); export const n = props => ({ type: "CloudDetail", props });`,
  "automation-frequency-section": `export const i = () => globalThis.__automationsPageTest.initialized.push("frequency"); export const l = props => ({ type: "Frequency", props });`,
  "editor-dialog": `export const a = () => globalThis.__automationsPageTest.initialized.push("editor:a"); export const h = () => globalThis.__automationsPageTest.initialized.push("editor:h"); export const i = () => globalThis.__automationsPageTest.initialized.push("editor:i"); export const m = () => globalThis.__automationsPageTest.initialized.push("editor:m");`,
  "automation-delete-confirmation-dialog": `export const n = () => globalThis.__automationsPageTest.initialized.push("delete"); export const t = props => ({ type: "DeleteDialog", props });`,
  "schedule-fields": `export const i = () => globalThis.__automationsPageTest.initialized.push("schedule"); export const a = () => {};`,
  "habitat-automation-migration-state": `export const n = () => globalThis.__automationsPageTest.initialized.push("migration"); export const r = () => ({}); export const t = state => state?.status === "complete";`,
  "use-plugin-scheduled-tasks": `export const t = () => globalThis.__automationsPageTest.initialized.push("plugins"); export const n = input => input.tasks;`,
  "document-search": `export const n = () => globalThis.__automationsPageTest.initialized.push("document-search"); export const t = props => ({ type: "DocumentSearch", props });`,
  "rolldown-runtime": "export {};",
};

const result = await esbuild.build({
  entryPoints: [SOURCE_PATH],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "mock-renderer-chunks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mocks[importPath] ?? "export {};", loader: "js" }));
    },
  }],
});
const page = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);

let assertions = 4;
const check = (condition, message) => { assert.ok(condition, message); assertions += 1; };
const children = (node) => Array.isArray(node?.props?.children) ? node.props.children : [node?.props?.children];
const findAll = (node, predicate, found = []) => {
  if (node == null || typeof node !== "object") return found;
  if (predicate(node)) found.push(node);
  for (const child of children(node)) {
    if (Array.isArray(child)) child.forEach((entry) => findAll(entry, predicate, found));
    else findAll(child, predicate, found);
  }
  return found;
};
const findButton = (node, label) => findAll(node, (entry) => entry.type === "button" && entry.props.children === label)[0];

const calls = [];
const local = {
  id: "local-1", name: "Daily brief", prompt: "Summarize today", source: "local", status: "ACTIVE",
  scheduleLabel: "Weekdays at 09:00", pluginName: "Calendar", pluginState: "disabled",
  runs: [
    { id: "run-1", createdAt: 1, status: "COMPLETED", threadId: "thread-1", title: "Monday brief", unread: true },
    { id: "run-2", createdAt: 2, status: "ARCHIVED", threadId: "thread-2", archived: true },
    { id: "run-3", createdAt: 3, status: "IN_PROGRESS", threadId: "thread-3" },
  ],
};
const cloud = { id: "cloud-1", name: "Weekly review", prompt: "Review work", source: "cloud", status: "PAUSED" };
const base = {
  automations: [local, cloud], canCreateCloud: true, canCreateLocal: true, mode: "detail", selectedAutomationId: "local-1", selectedSource: "local",
  migration: { status: "failed" },
  onArchiveAll: (runs) => calls.push(["archive-all", runs.map((run) => run.id)]),
  onArchiveRun: (run) => calls.push(["archive", run.id]),
  onCreate: (source) => calls.push(["create", source]),
  onDelete: (item) => calls.push(["delete", item.id]),
  onEdit: (item) => calls.push(["edit", item.id]),
  onMarkAllRead: (runs) => calls.push(["read-all", runs.length]),
  onMarkRunRead: (run, read) => calls.push(["read", run.id, read]),
  onMigrate: () => calls.push(["migrate"]),
  onOpenChat: (run) => calls.push(["chat", run.id]),
  onOpenPlugin: (item) => calls.push(["plugin", item.id]),
  onPause: (item) => calls.push(["pause", item.id]),
  onQueryChange: (query) => calls.push(["query", query]),
  onRun: (item) => calls.push(["run", item.id]),
  onSelect: (item) => calls.push(["select", item.id]),
  onStatusFilterChange: (filter) => calls.push(["filter", filter]),
  onUnarchiveRun: (run) => calls.push(["unarchive", run.id]),
};

let node = page.AutomationsLayoutPage({ presentation: base });
check(node.type === "main", "renders the scheduled tasks layout");
check(state.initialized.length === 16, "initializes every imported runtime once");
findButton(node, "Create").props.onClick();
findButton(node, "Retry sync").props.onClick();
findButton(node, "Edit").props.onClick();
findButton(node, "Run now").props.onClick();
findButton(node, "Pause").props.onClick();
findButton(node, "Delete").props.onClick();
findButton(node, "Open plugin").props.onClick();
findButton(node, "Monday brief").props.onClick();
findButton(node, "Mark all as read").props.onClick();
findButton(node, "Archive all").props.onClick();
findButton(node, "Unarchive").props.onClick();
check(calls.some((call) => call[0] === "create" && call[1] === "local"), "creates local tasks by default");
check(calls.some((call) => call[0] === "migrate"), "retries local automation migration");
check(calls.some((call) => call[0] === "edit" && call[1] === "local-1"), "opens local editing");
check(calls.some((call) => call[0] === "run" && call[1] === "local-1"), "runs a local task");
check(calls.some((call) => call[0] === "pause"), "pauses a local task");
check(calls.some((call) => call[0] === "delete"), "starts deletion");
check(calls.some((call) => call[0] === "plugin"), "opens the source plugin");
check(calls.some((call) => call[0] === "chat"), "opens a previous run chat");
check(calls.some((call) => call[0] === "archive-all" && call[1].length === 1), "archives only eligible runs");
check(calls.some((call) => call[0] === "unarchive" && call[1] === "run-2"), "unarchives saved runs");

const search = findAll(node, (entry) => entry.type === "input" && entry.props.type === "search")[0];
search.props.onChange({ currentTarget: { value: "weekly" } });
const status = findAll(node, (entry) => entry.type === "select")[0];
status.props.onChange({ currentTarget: { value: "paused" } });
check(calls.some((call) => call[0] === "query" && call[1] === "weekly"), "updates task search");
check(calls.some((call) => call[0] === "filter" && call[1] === "paused"), "updates status filtering");

node = page.AutomationsLayoutPage({ presentation: { ...base, migration: { status: "complete" }, selectedAutomationId: "cloud-1", selectedSource: "cloud" } });
check(findAll(node, (entry) => entry.type === "CloudDetail").length === 1, "renders cloud task details");
check(findButton(node, "Retry sync") == null, "hides completed migration controls");

let saved;
node = page.AutomationsLayoutPage({ presentation: { ...base, mode: "create", draft: { name: "New task", prompt: "Do work", scheduleConfig: { mode: "daily" }, source: "cloud", status: "ACTIVE" }, onSave: (draft) => { saved = draft; } } });
const nameInput = findAll(node, (entry) => entry.type === "input" && entry.props["aria-label"] === "Task name")[0];
const promptInput = findAll(node, (entry) => entry.type === "textarea")[0];
nameInput.props.onChange({ currentTarget: { value: "Renamed task" } });
promptInput.props.onChange({ currentTarget: { value: "Updated instructions" } });
const editorForm = findAll(node, (entry) => entry.type === "form")[0];
editorForm.props.onSubmit({ preventDefault() {} });
check(saved.name === "Renamed task" && saved.prompt === "Updated instructions", "saves editor changes");
check(findAll(node, (entry) => entry.type === "Frequency").length === 1, "renders schedule editing");

node = page.AutomationsLayoutPage({ presentation: { ...base, deletePending: true } });
const dialog = findAll(node, (entry) => entry.type === "DeleteDialog")[0];
check(dialog.props.name === "Daily brief" && dialog.props.open, "renders delete confirmation");

node = page.AutomationsLayoutPage({ presentation: { ...base, automations: [], migration: null, query: "missing" } });
const empty = findAll(node, (entry) => entry.type === "DocumentSearch")[0];
check(empty.props.emptyMessage === "No scheduled tasks found", "uses document search for empty results");

node = page.AutomationsLayoutPage();
check(findAll(node, (entry) => entry.type === "span" && entry.props.children === "Runtime brief").length > 0, "loads local scheduled tasks from the production runtime signals");
check(findAll(node, (entry) => entry.type === "span" && entry.props.children === "Cloud monitor").length > 0, "loads account-scoped cloud scheduled tasks from the production runtime signals");
check(findButton(node, "Runtime result") != null, "attaches runtime history items to their local automation");
findButton(node, "Mark all as read").props.onClick();
check(state.runtime.markedAllRead === true, "connects the production history mark-all-read action");
findButton(node, "Run now").props.onClick();
findButton(node, "Pause").props.onClick();
findButton(node, "Delete").props.onClick();
check(state.runtime.mutations.some(([operation, input]) => operation === "automation-run-now" && input.id === "runtime-local"), "uses the published run-now mutation contract");
check(state.runtime.mutations.some(([operation, input]) => operation === "automation-update" && input.contract === "status" && input.status === "PAUSED"), "uses the published status-update request builder");
check(state.runtime.mutations.some(([operation, input]) => operation === "automation-delete" && input.id === "runtime-local"), "uses the published delete mutation contract");
check(source.includes('useAutomationMutation?.("automation-create"') && source.includes("buildCreateAutomationRequest?.(input)"), "wires create and update request builders into the live page");

state.runtime.local.items = [];
node = page.AutomationsLayoutPage();
const runtimeCloudDetail = findAll(node, (entry) => entry.type === "CloudDetail")[0];
runtimeCloudDetail.props.onPause();
runtimeCloudDetail.props.onDelete();
check(state.runtime.cloudMutations.some(([operation, input]) => operation === "cloud-update" && input.automationId === "runtime-cloud" && input.isEnabled === true), "uses the published cloud enable mutation contract");
check(state.runtime.cloudMutations.some(([operation, input]) => operation === "cloud-delete" && input.automationId === "runtime-cloud"), "uses the published cloud delete mutation contract");

console.log(`automations page: ${assertions} assertions passed`);
