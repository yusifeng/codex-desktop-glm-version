import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/meetings-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const state = [];
let stateIndex = 0;
let effects = [];
const calls = { navigate: [], started: [] };
const React = {
  Fragment: "Fragment",
  useEffect(effect) { effects.push(effect); },
  useState(initial) { const index = stateIndex++; if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial; return [state[index], (next) => { state[index] = typeof next === "function" ? next(state[index]) : next; }]; },
};
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
globalThis.__meetingsPage = { React, jsx, calls };
const mocks = {
  "app-shared": "const r=globalThis.__meetingsPage;export const I3=()=>r.jsx;export const e6=Object.assign(()=>r.React,r.React);",
  "app-initial": "const r=globalThis.__meetingsPage;export const l_n=()=>({});export const o_n=()=>path=>r.calls.navigate.push(path);",
  "app-connect-modal-by-id": "export const r=()=>{};export const n=props=>({type:'connect-modal',props});",
  "use-start-new-conversation": "const r=globalThis.__meetingsPage;export const startNewConversation=(scope,options)=>r.calls.started.push([scope,options]);",
};
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "meetings-page-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
let assertions = 0;
function equal(actual, expected) { assertions++; assert.equal(actual, expected); }
function deepEqual(actual, expected) { assertions++; assert.deepEqual(actual, expected); }
function ok(value) { assertions++; assert.ok(value); }
function reset() { state.length = 0; stateIndex = 0; effects = []; calls.navigate.length = 0; calls.started.length = 0; }
function render(props = {}) { stateIndex = 0; effects = []; return module.MeetingsPage(props); }
function walk(value, output = []) { if (value == null || typeof value !== "object") return output; if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; } output.push(value); walk(value.props?.children, output); return output; }
function text(value) { if (value == null || typeof value === "boolean") return ""; if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(text).join(" " ); return text(value.props?.children); }
function find(view, type, label) { return walk(view).find((node) => node.type === type && (label == null || text(node) === label)); }
function findContaining(view, type, label) { return walk(view).find((node) => node.type === type && text(node).includes(label)); }
function checkboxes(view) { return walk(view).filter((node) => node.type === "input" && node.props.type === "checkbox"); }
async function flush() { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); }
async function runEffects() { const pending = effects; effects = []; for (const effect of pending) effect(); await flush(); }

deepEqual(Object.keys(module), ["MeetingsPage"]);
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);
deepEqual([...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["rolldown-runtime", "app-shared", "app-initial", "app-primary", "app-connect-modal-by-id"]);
deepEqual([...source.matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map((match) => match[1]), ["use-start-new-conversation"]);
equal(source.includes("CONNECTOR_SETTING"), true);
equal(source.includes("/meetings?connected=1"), true);

reset();
let view = render({ access: "loading" });
equal(text(view), "Loading meetings access…");
reset();
view = render({ access: "denied" });
equal(text(view).includes("Meetings aren't available"), true);

const completed = { id: "m1", title: "Product review", date: "2026-09-29", status: "completed", summary: "Launch notes", transcript: "Alex: ship it", attendees: [{ name: "Alex", email: "alex@example.com" }] };
const processing = { id: "m2", title: "Design sync", status: "inProgress", attendees: [{ name: "Sam" }] };
const failed = { id: "m3", title: "Sales update", status: "unsuccessful" };
const empty = { id: "m4", title: "Empty note", status: "completed", isEmpty: true };
const eventJoin = { id: "e1", title: "Standup", start: "09:00", meetingUrl: "https://meet.test/1", attendeeCount: 4 };
const eventOpen = { id: "e2", title: "Review", start: "10:00", meetingId: "m1" };
const eventDeclined = { id: "e3", title: "Declined", start: "11:00", meetingUrl: "https://meet.test/3", declined: true };
const eventNoLink = { id: "e4", title: "Focus", start: "12:00" };
const navigated = [];
const joined = [];
let loads = [];
let calendarLoads = [];
let refreshes = 0;
const service = {
  loadMeetings: async (filters, cursor) => { loads.push([filters, cursor]); return { items: cursor ? [failed] : [completed, processing], nextCursor: cursor ? null : "next" }; },
  loadMeeting: async () => completed,
  loadCalendar: async (day, cursor) => { calendarLoads.push([day, cursor]); return { items: cursor ? [eventNoLink] : [eventJoin, eventOpen], nextCursor: cursor ? null : "calendar-next", stale: true }; },
  refreshCalendar: async () => { refreshes++; },
};

reset();
view = render({ initialMeetings: [completed, processing, failed, empty], initialNextCursor: "next", calendarConnected: false, onNavigate: (value) => navigated.push(value), service });
equal(text(view).includes("Past notes"), true);
equal(text(view).includes("Product review"), true);
equal(text(view).includes("Design sync"), true);
equal(text(view).includes("Processing"), true);
equal(text(view).includes("Sales update"), false);
equal(text(view).includes("Empty note"), false);
ok(find(view, "button", "Connect Google Calendar"));
ok(find(view, "button", "Load more"));
findContaining(view, "button", "Product review").props.onClick();
equal(navigated.at(-1), "/meetings/m1");
find(view, "button", "Record a meeting").props.onClick();
equal(navigated.at(-1), "/c/new");
find(view, "button", "Connect Google Calendar").props.onClick();
view = render({ initialMeetings: [completed], calendarConnected: false, service });
const modal = walk(view).find((node) => node.type === "connect-modal");
ok(modal);
equal(modal.props.connectorId, "google-calendar");
equal(modal.props.productSku, "CONNECTOR_SETTING");
equal(modal.props.redirectAfter, "/meetings?connected=1");

reset();
view = render({ initialMeetings: [completed, processing, failed, empty], calendarConnected: false, service, onNavigate: (value) => navigated.push(value) });
const search = walk(view).find((node) => node.props?.["aria-label"] === "Search meeting notes");
ok(search);
search.props.onChange({ currentTarget: { value: "launch" } });
view = render({ initialMeetings: [completed, processing, failed, empty], calendarConnected: false, service, onNavigate: (value) => navigated.push(value) });
equal(text(view).includes("Product review"), true);
equal(text(view).includes("Design sync"), false);
findContaining(view, "button", "Product review").props.onClick();
equal(navigated.at(-1), "/meetings/m1?q=launch");
search.props.onKeyDown({ key: "Escape" });
view = render({ initialMeetings: [completed, processing, failed, empty], calendarConnected: false, service });
equal(text(view).includes("Design sync"), true);

reset();
view = render({ initialMeetings: [completed, processing, failed, empty], initialSearch: "@alex", calendarConnected: false, service });
equal(text(view).includes("Product review"), true);
equal(text(view).includes("Design sync"), false);
equal(checkboxes(view).length, 4);
walk(view).find((node) => node.props?.["aria-label"] === "Search meeting notes").props.onKeyDown({ key: "Escape" });
checkboxes(view)[2].props.onChange();
checkboxes(view)[3].props.onChange();
view = render({ initialMeetings: [completed, processing, failed, empty], calendarConnected: false, service });
equal(text(view).includes("Sales update"), true);
equal(text(view).includes("Empty note"), true);

reset();
view = render({ service, calendarConnected: false });
equal(text(view).includes("Loading meetings"), true);
await runEffects();
view = render({ service, calendarConnected: false });
equal(text(view).includes("Product review"), true);
find(view, "button", "Load more").props.onClick();
await flush();
equal(loads.at(-1)[1], "next");

reset();
const failingService = { ...service, loadMeetings: async () => { throw Error("offline"); } };
view = render({ service: failingService, calendarConnected: false });
await runEffects();
view = render({ service: failingService, calendarConnected: false });
equal(text(view).includes("Couldn't load meetings. Try again."), true);
ok(find(view, "button", "Try again"));
reset();
view = render({ initialMeetings: [], calendarConnected: false, service });
equal(text(view).includes("No meeting notes found"), true);

reset();
view = render({ meetingId: "m1", initialMeeting: null, service });
equal(text(view), "Meeting not found");
reset();
view = render({ meetingId: "m1", service });
equal(text(view).includes("Loading meeting"), true);
await runEffects();
view = render({ meetingId: "m1", service });
equal(text(view).includes("Product review"), true);
equal(text(view).includes("Launch notes"), true);
equal(text(view).includes("Alex: ship it"), true);
find(view, "button", "New conversation").props.onClick();
await flush();
equal(calls.started.length, 1);
equal(calls.started[0][1].prefillPrompt.includes("Product review"), true);

const shared = [];
const feedback = [];
const deleted = [];
const actionService = { ...service, shareMeeting: async (id, email) => shared.push([id, email]), sendFeedback: async (id, input) => feedback.push([id, input]), deleteNote: async (id) => deleted.push(id) };
reset();
view = render({ meetingId: "m1", initialMeeting: { ...completed, privateNote: true }, service: actionService, onNavigate: (value) => navigated.push(value) });
find(view, "button", "Share").props.onClick();
view = render({ meetingId: "m1", initialMeeting: { ...completed, privateNote: true }, service: actionService });
ok(walk(view).find((node) => node.props?.["aria-label"] === "Share meeting"));
walk(view).find((node) => node.props?.["aria-label"] === "Email address").props.onChange({ currentTarget: { value: "team@example.com" } });
view = render({ meetingId: "m1", initialMeeting: { ...completed, privateNote: true }, service: actionService });
find(view, "button", "Share meeting").props.onClick();
await flush();
deepEqual(shared, [["m1", "team@example.com"]]);
reset();
view = render({ meetingId: "m1", initialMeeting: { ...completed, privateNote: true }, service: actionService, onNavigate: (value) => navigated.push(value) });
find(view, "button", "Codex feedback").props.onClick();
view = render({ meetingId: "m1", initialMeeting: { ...completed, privateNote: true }, service: actionService });
ok(walk(view).find((node) => node.props?.["aria-label"] === "Meeting feedback"));
find(view, "button", "Submit feedback").props.onClick();
await flush();
equal(feedback.length, 1);
equal(feedback[0][1].category, "incorrect_notes");
find(view, "button", "Delete note").props.onClick();
await flush();
deepEqual(deleted, ["m1"]);

reset();
view = render({ initialMeetings: [completed], calendarConnected: true, initialCalendarEvents: [eventJoin, eventOpen, eventDeclined, eventNoLink], initialCalendarNextCursor: "calendar-next", initialCalendarStale: true, onJoinMeeting: (url) => joined.push(url), onNavigate: (value) => navigated.push(value), service });
equal(text(view).includes("Upcoming"), true);
equal(text(view).includes("Standup"), true);
equal(text(view).includes("Review"), true);
equal(text(view).includes("Declined"), false);
equal(text(view).includes("Focus"), false);
equal(text(view).includes("Calendar may be out of date"), true);
find(view, "button", "Join meeting").props.onClick();
deepEqual(joined, ["https://meet.test/1"]);
find(view, "button", "Open meeting").props.onClick();
equal(navigated.at(-1), "/meetings/m1");
ok(find(view, "button", "Previous day"));
ok(find(view, "button", "Next day"));
ok(find(view, "button", "Refresh calendar"));
ok(find(view, "button", "Load more upcoming meetings"));
checkboxes(view)[0].props.onChange();
checkboxes(view)[1].props.onChange();
view = render({ initialMeetings: [completed], calendarConnected: true, initialCalendarEvents: [eventJoin, eventOpen, eventDeclined, eventNoLink], service });
equal(text(view).includes("Declined"), true);
equal(text(view).includes("Focus"), true);
equal(text(view).includes("No meeting link available"), true);
reset();
view = render({ initialMeetings: [completed], calendarConnected: true, calendarLoading: true, initialCalendarEvents: [], service });
equal(text(view).includes("Loading calendar"), true);
reset();
view = render({ initialMeetings: [completed], calendarConnected: true, calendarError: true, initialCalendarEvents: [], service });
equal(text(view).includes("Couldn't load calendar"), true);
reset();
view = render({ initialMeetings: [completed], calendarConnected: true, initialCalendarEvents: [], service });
equal(text(view).includes("No upcoming meetings match your settings"), true);
reset();
view = render({ initialMeetings: [completed], calendarConnected: true, service });
await runEffects();
view = render({ initialMeetings: [completed], calendarConnected: true, service });
equal(text(view).includes("Standup"), true);
equal(calendarLoads.length > 0, true);
find(view, "button", "Refresh calendar").props.onClick();
await flush();
equal(refreshes > 0, true);

console.log(`meetings-page tests passed (${assertions} assertions)`);
