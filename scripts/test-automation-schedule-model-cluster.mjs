import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__automationScheduleTest = {};
state.jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
async function bundle(directory) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "schedule-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\/schedule-draft$/ }, () => ({ path: path.join(ROOT, "src/renderer/schedule-draft/index.ts") }));
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? `export const I3=()=>globalThis.__automationScheduleTest.jsx;` : importPath === "automation-frequency-section" ? `const j=globalThis.__automationScheduleTest.jsx;export const c=p=>j.jsx("select",{"aria-label":p.ariaLabel,value:p.selectedId,onChange:e=>p.onSelect(e.currentTarget.value),children:p.options?.map(o=>j.jsx("option",{value:o.id,children:o.label},o.id))}),i=p=>j.jsxs("section",{children:[p.title,p.children]}),n=p=>j.jsx("input",{"aria-label":p.ariaLabel,value:p.value,onChange:e=>p.onChange(e.currentTarget.value)}),o=p=>j.jsx("div",{"aria-label":"Days of the week",children:["MO","TU","WE","TH","FR","SA","SU"].map(d=>j.jsx("input",{type:"checkbox",checked:p.value?.includes(d),onChange:()=>p.onChange(p.value?.includes(d)?p.value.filter(x=>x!==d):[...(p.value??[]),d])},d))}),u=p=>j.jsx("input",{"aria-label":"Time",value:p.value,onChange:e=>p.onChange(e.currentTarget.value)});` : "export {};", loader: "js" }));
  } }] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach((child) => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, (candidate) => { if (result == null && predicate(candidate)) result = candidate; }); return result; }
function findAll(node, predicate) { const result = []; walk(node, (candidate) => { if (predicate(candidate)) result.push(candidate); }); return result; }

const draftModule = await bundle("schedule-draft");
assert.deepEqual(Object.keys(draftModule).sort(), ["a", "c", "i", "l", "n", "o", "r", "s", "t"]);
assert.equal(draftModule.a("05:00"), "night");
assert.equal(draftModule.a("09:00"), "morning");
assert.equal(draftModule.a("14:00"), "afternoon");
assert.equal(draftModule.a("18:00"), "evening");
assert.deepEqual(draftModule.t, { morning: "09:00", afternoon: "14:00", evening: "18:00", night: "22:00" });
const base = { id: "a1", is_enabled: true, next_run_times: [], prompt: "Summarize", schedule: "BEGIN:VEVENT\nRRULE:FREQ=DAILY;BYHOUR=8;BYMINUTE=30\nEND:VEVENT", schedule_components: { frequency: "daily", by_hour: 8, by_minute: 30 }, schedule_time_of_day: "morning", thread_mode: "new", timing_mode: "flexible_schedule", title: "Daily brief" };
const daily = draftModule.n(base);
assert.equal(daily.scheduleConfig.mode, "daily");
assert.equal(daily.scheduleConfig.time, "09:00");
assert.equal(daily.status, "ACTIVE");
assert.equal(daily.scheduleDirty, false);
const weekly = draftModule.n({ ...base, schedule: "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;BYHOUR=10;BYMINUTE=15", schedule_components: { frequency: "weekly", by_day: "MO,WE" }, schedule_time_of_day: null });
assert.equal(weekly.scheduleConfig.mode, "weekly");
assert.deepEqual(weekly.scheduleConfig.weekdays, ["MO", "WE"]);
const weekdays = draftModule.n({ ...base, schedule: "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=9;BYMINUTE=0", schedule_components: { frequency: "weekly", by_day: "MO,TU,WE,TH,FR" } });
assert.equal(weekdays.scheduleConfig.mode, "weekdays");
const monthly = draftModule.n({ ...base, schedule: "RRULE:FREQ=MONTHLY;BYMONTHDAY=14;BYHOUR=9;BYMINUTE=0", schedule_components: { frequency: "monthly", by_month_day: 14 } });
assert.equal(monthly.scheduleConfig.monthDay, 14);
const hourly = draftModule.n({ ...base, schedule: "RRULE:FREQ=HOURLY;INTERVAL=3;BYMINUTE=0", schedule_components: { frequency: "custom" } });
assert.equal(hourly.scheduleConfig.mode, "hourly");
assert.equal(hourly.scheduleConfig.intervalHours, 3);
const custom = draftModule.n({ ...base, schedule: "RRULE:FREQ=YEARLY;BYMONTH=9;BYMONTHDAY=27", schedule_components: { frequency: "custom" } });
assert.equal(custom.scheduleConfig.mode, "custom");
assert.equal(draftModule.n({ ...base, timing_mode: "exact_schedule" }).scheduleConfig.mode, "custom");
const untilAutomation = { ...base, schedule: "RRULE:FREQ=DAILY;UNTIL=20270102T030405Z", schedule_components: { frequency: "daily" } };
assert.equal(draftModule.o(untilAutomation).toISOString(), "2027-01-02T03:04:05.000Z");
assert.equal(draftModule.o({ ...untilAutomation, default_timezone: "Asia/Shanghai", schedule: "RRULE:FREQ=DAILY;UNTIL=20270102T000000" }).toISOString(), "2027-01-01T16:00:00.000Z");
const once = draftModule.n({ ...base, schedule: "BEGIN:VEVENT\nDTSTART:20280102T030405Z\nEND:VEVENT", schedule_components: { frequency: "once", start_time: "2028-01-02T03:04:05Z" } });
assert.equal(once.scheduleConfig.oneTimeDate != null, true);
assert.equal(draftModule.l(base, daily.scheduleConfig, "weekdays").mode, "weekdays");
const switchedCustom = draftModule.l(base, daily.scheduleConfig, "custom");
assert.equal(switchedCustom.mode, "custom");
assert.match(switchedCustom.customRrule, /FREQ=DAILY/);
assert.equal(draftModule.s(base, daily), false);
assert.equal(draftModule.s(base, { ...daily, name: "Changed" }), true);
assert.equal(draftModule.s(base, { ...daily, prompt: "Changed" }), true);
const dirtyDaily = { ...daily, scheduleDirty: true, scheduleConfig: { ...daily.scheduleConfig, time: "11:45" } };
assert.equal(draftModule.s(base, dirtyDaily), true);
assert.match(draftModule.r(base, dirtyDaily).schedule, /FREQ=DAILY;BYHOUR=11;BYMINUTE=45/);
assert.match(draftModule.r(base, { ...hourly, scheduleDirty: true }).schedule, /FREQ=HOURLY;INTERVAL=3/);
assert.match(draftModule.r(base, { ...weekly, scheduleDirty: true }).schedule, /BYDAY=MO,WE/);
assert.match(draftModule.r(base, { ...monthly, scheduleDirty: true }).schedule, /BYMONTHDAY=14/);
const withStart = { ...base, schedule: "BEGIN:VEVENT\nDTSTART:20260101T000000Z\nRRULE:FREQ=DAILY;BYHOUR=8;BYMINUTE=30\nEND:VEVENT" };
assert.match(draftModule.r(withStart, { ...weekly, scheduleDirty: true }).schedule, /DTSTART:20260101T000000Z/);
const unusual = { ...base, schedule: "BEGIN:VEVENT\nRRULE:FREQ=DAILY;BYHOUR=8;BYMINUTE=30;X-FOO=1\nEND:VEVENT" };
const unusualDraft = draftModule.n(unusual);
const endOnly = { ...unusualDraft, scheduleDirty: true, scheduleConfig: { ...unusualDraft.scheduleConfig, untilDate: "2028-01-02", untilTime: "23:59:59" } };
assert.match(draftModule.r(unusual, endOnly).schedule, /X-FOO=1;UNTIL=/);
const hourlyOriginal = { ...base, schedule: "BEGIN:VEVENT\nRRULE:FREQ=HOURLY;INTERVAL=2;BYMINUTE=0;X-FOO=1\nEND:VEVENT", schedule_components: { frequency: "custom" } };
const hourlyDraft = draftModule.n(hourlyOriginal);
assert.match(draftModule.r(hourlyOriginal, { ...hourlyDraft, scheduleDirty: true, scheduleConfig: { ...hourlyDraft.scheduleConfig, intervalHours: 4 } }).schedule, /INTERVAL=4/);
assert.match(draftModule.r(hourlyOriginal, { ...hourlyDraft, scheduleDirty: true, scheduleConfig: { ...hourlyDraft.scheduleConfig, intervalHours: 4 } }).schedule, /X-FOO=1/);
const pastOnce = { ...once, scheduleDirty: true, scheduleConfig: { ...once.scheduleConfig, oneTimeDate: "2020-01-01" } };
assert.equal(draftModule.i(base, pastOnce, new Date("2026-09-27T00:00:00")), "past");
const farOnce = { ...once, scheduleDirty: true, scheduleConfig: { ...once.scheduleConfig, oneTimeDate: "2030-01-01" } };
assert.equal(draftModule.i(base, farOnce, new Date("2026-09-27T00:00:00")), "too-far");
const ended = { ...daily, scheduleDirty: true, scheduleConfig: { ...daily.scheduleConfig, untilDate: "2020-01-01" } };
assert.equal(draftModule.i(base, ended, new Date("2026-09-27T00:00:00")), "end-past");
assert.equal(draftModule.i(base, daily, new Date("2026-09-27T00:00:00")), null);
draftModule.c(); assert.equal(typeof draftModule.n, "function");

const fieldsReleaseAssertions = assertReleaseOwner("schedule-fields");

const frequencyAssertions = assertReleaseOwner("automation-frequency-section");

console.log(`automation schedule model cluster tests passed with ${frequencyAssertions} frequency release assertions`);
