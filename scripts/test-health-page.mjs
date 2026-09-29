import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/health-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const state = [];
let stateIndex = 0;
const calls = { navigate: [] };
const React = { Fragment: "Fragment", useState(initial) { const index = stateIndex++; if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial; return [state[index], (next) => { state[index] = typeof next === "function" ? next(state[index]) : next; }]; } };
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
globalThis.__healthPage = { React, jsx, calls };
const mocks = {
  "app-shared": "const r=globalThis.__healthPage;export const I3=()=>r.jsx;export const e6=Object.assign(()=>r.React,r.React);",
  "app-initial": "const r=globalThis.__healthPage;export const o_n=()=>path=>r.calls.navigate.push(path);",
  "app-connect-modal": "export const n=()=>{};export const t=props=>({type:'connect-modal',props});",
};
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "health-page-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
let assertions = 0;
function equal(actual, expected) { assertions++; assert.equal(actual, expected); }
function deepEqual(actual, expected) { assertions++; assert.deepEqual(actual, expected); }
function ok(value) { assertions++; assert.ok(value); }
function reset() { state.length = 0; stateIndex = 0; calls.navigate.length = 0; }
function render(props = {}) { stateIndex = 0; return module.HealthPage(props); }
function walk(value, output = []) { if (value == null || typeof value !== "object") return output; if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; } output.push(value); walk(value.props?.children, output); return output; }
function text(value) { if (value == null || typeof value === "boolean") return ""; if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(text).join(" " ); return text(value.props?.children); }
function find(view, type, label) { return walk(view).find((node) => node.type === type && (label == null || text(node) === label)); }
function panel(view, label) { return walk(view).find((node) => node.props?.role === "tabpanel" && node.props?.["aria-label"] === label); }
async function flush() { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); }

deepEqual(Object.keys(module), ["HealthPage"]);
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);
deepEqual([...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["rolldown-runtime", "app-shared", "app-initial", "app-primary", "suggestion-card", "tabs", "app-connect-modal", "ecosystem-widget-queries", "use-chatgpt-composer-controller", "app-info", "plugin-skill-queries", "shuffle"]);
deepEqual([...source.matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map((match) => match[1]), []);
equal(source.includes("connector_openai_olympic"), true);
equal(source.includes("https://help.openai.com/articles/20001036-health-in-chatgpt"), true);

reset();
let view = render({ eligibilityState: "loading" });
equal(text(view).includes("Loading Health"), true);
reset();
let retries = 0;
view = render({ eligibilityState: "error", onRetryEligibility: () => retries++ });
equal(text(view).includes("Health couldn’t be loaded"), true);
find(view, "button", "Try again").props.onClick();
equal(retries, 1);
reset();
view = render({ eligibility: { health: false, healthEligibilityStatus: "age_restricted" } });
equal(text(view).includes("18 and older"), true);
equal(find(view, "a", "Verify age").props.href, "https://chatgpt.com/verify_age");
reset();
view = render({ eligibility: { health: false, healthEligibilityStatus: "ineligible" } });
equal(text(view).includes("Health isn’t available for this account"), true);
equal(text(view).includes("continue using ChatGPT as usual"), true);
reset();
view = render({ eligibility: { health: true }, connectionState: "loading" });
equal(text(view).includes("Loading Health connection"), true);
reset();
view = render({ eligibility: { health: true }, connectionState: "error", onRetryConnection: () => retries++ });
equal(text(view).includes("Unable to connect Health right now"), true);
find(view, "button", "Try again").props.onClick();
equal(retries, 2);

reset();
let connects = 0;
view = render({ eligibility: { health: true }, connected: false, onConnect: () => connects++ });
equal(text(view).includes("Connect your health data"), true);
equal(text(view).includes("medical records and Apple Health"), true);
equal(text(view).includes("Check important health information"), true);
find(view, "button", "Connect Health").props.onClick();
equal(connects, 1);
view = render({ eligibility: { health: true }, connected: false });
const modal = walk(view).find((node) => node.type === "connect-modal");
ok(modal);
equal(modal.props.app.id, "connector_openai_olympic");
equal(modal.props.app.name, "Health");
equal(modal.props.waitForConnectedHandler, true);

const prompts = [{ id: "p1", title: "Understand my labs", prompt: "Explain these lab results", description: "Review a recent result" }, { id: "p2", title: "Prepare for a visit", prompt: "Help me prepare questions" }];
const records = [{ id: "r1", title: "Blood panel", date: "2026-08-01", summary: "All values in range" }, { id: "r2", title: "Medication list" }];
const chats = [{ id: "c1", title: "Lab follow-up" }, { id: "c2" }];
const navigated = [];
const selected = [];
const submitted = [];
let pinned;
let refreshed = 0;
reset();
view = render({ eligibility: { health: true }, connected: true, starterPrompts: prompts, records, chats, chatsNextCursor: "next", isPinned: false, onNavigate: (path) => navigated.push(path), onSelectPrompt: (prompt) => selected.push(prompt.id), onSubmit: async (message, record) => submitted.push([message, record?.id]), onTogglePinned: (value) => { pinned = value; }, onRefresh: () => refreshed++ });
equal(text(view).includes("Health"), true);
equal(find(view, "nav").props["aria-label"], "Health tabs");
equal(panel(view, "Home").props.hidden, false);
equal(panel(view, "Records").props.hidden, true);
equal(panel(view, "Chats").props.hidden, true);
equal(panel(view, "Accounts").props.hidden, true);
equal(text(panel(view, "Home")).includes("Understand my labs"), true);
find(view, "button", "Understand my labs").props.onClick();
deepEqual(selected, ["p1"]);
view = render({ eligibility: { health: true }, connected: true, starterPrompts: prompts, records, chats, onSubmit: async (message, record) => submitted.push([message, record?.id]) });
const composer = walk(view).find((node) => node.props?.["aria-label"] === "Ask a health question");
equal(composer.props.value, "Explain these lab results");
find(view, "button", "Send").props.onClick();
await flush();
deepEqual(submitted, [["Explain these lab results", undefined]]);
view = render({ eligibility: { health: true }, connected: true, starterPrompts: prompts, records, chats, onTogglePinned: (value) => { pinned = value; }, onRefresh: () => refreshed++ });
equal(walk(view).find((node) => node.props?.["aria-label"] === "Ask a health question").props.value, "");
find(view, "button", "Next").props.onClick();
view = render({ eligibility: { health: true }, connected: true, starterPrompts: prompts, records, chats, onTogglePinned: (value) => { pinned = value; }, onRefresh: () => refreshed++ });
equal(text(panel(view, "Home")).includes("Prepare for a visit"), true);
find(view, "button", "Dismiss").props.onClick();
view = render({ eligibility: { health: true }, connected: true, starterPrompts: prompts, records, chats, onTogglePinned: (value) => { pinned = value; }, onRefresh: () => refreshed++ });
equal(text(panel(view, "Home")).includes("How can I help?"), false);

find(view, "button", "Pin Health").props.onClick();
equal(pinned, true);
find(view, "button", "Refresh").props.onClick();
equal(refreshed, 1);
equal(find(view, "a", "Health Help Center").props.href.includes("20001036"), true);

reset();
view = render({ eligibility: { health: true }, connected: true, activeTab: "records", records, onOpenRecord: (record) => selected.push(record.id) });
equal(panel(view, "Records").props.hidden, false);
equal(text(panel(view, "Records")).includes("Blood panel"), true);
find(view, "button", "Blood panel").props.onClick();
equal(selected.at(-1), "r1");
view = render({ eligibility: { health: true }, connected: true, activeTab: "records", records });
const detail = walk(view).find((node) => node.props?.["aria-label"] === "Health details");
ok(detail);
equal(text(detail).includes("All values in range"), true);
find(view, "button", "Close details").props.onClick();
view = render({ eligibility: { health: true }, connected: true, activeTab: "records", records });
equal(walk(view).some((node) => node.props?.["aria-label"] === "Health details"), false);
reset();
view = render({ eligibility: { health: true }, connected: true, activeTab: "records", recordsState: "loading" });
equal(text(panel(view, "Records")).includes("Loading health records"), true);
reset();
view = render({ eligibility: { health: true }, connected: true, activeTab: "records", recordsState: "error" });
equal(text(panel(view, "Records")).includes("Health records couldn’t be loaded"), true);
reset();
view = render({ eligibility: { health: true }, connected: true, activeTab: "records", records: [] });
equal(text(panel(view, "Records")).includes("Your health records will appear here"), true);

reset();
let more = 0;
view = render({ eligibility: { health: true }, connected: true, activeTab: "chats", chats, chatsNextCursor: "next", onNavigate: (path) => navigated.push(path), onLoadMoreChats: () => more++ });
equal(panel(view, "Chats").props.hidden, false);
equal(text(panel(view, "Chats")).includes("Lab follow-up"), true);
equal(text(panel(view, "Chats")).includes("Untitled"), true);
find(view, "button", "Lab follow-up").props.onClick();
equal(navigated.at(-1), "/c/c1");
find(view, "button", "Load more").props.onClick();
equal(more, 1);
reset();
view = render({ eligibility: { health: true }, connected: true, activeTab: "chats", chatsState: "error" });
equal(text(panel(view, "Chats")).includes("Health chats couldn’t be loaded"), true);
reset();
view = render({ eligibility: { health: true }, connected: true, activeTab: "chats", chats: [] });
equal(text(panel(view, "Chats")).includes("Health chats will appear here"), true);

reset();
view = render({ eligibility: { health: true }, connected: true, activeTab: "accounts" });
equal(panel(view, "Accounts").props.hidden, false);
equal(text(panel(view, "Accounts")).includes("Health connected"), true);
find(view, "button", "Manage connections").props.onClick();
view = render({ eligibility: { health: true }, connected: true, activeTab: "accounts" });
ok(walk(view).find((node) => node.type === "connect-modal"));
find(view, "button", "Home").props.onClick();
equal(calls.navigate.at(-1), "/health?tab=home");

reset();
let testRuns = 0;
view = render({ eligibility: { health: true }, connected: true, showAddTestData: true, onAddTestData: async () => { testRuns++; } });
ok(find(view, "button", "Add test health data"));
find(view, "button", "Add test health data").props.onClick();
await flush();
equal(testRuns, 1);

console.log(`health-page tests passed (${assertions} assertions)`);
