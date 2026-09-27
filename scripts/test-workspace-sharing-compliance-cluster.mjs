import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__workspaceSharingComplianceTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "workspace-sharing-compliance-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__workspaceSharingComplianceTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function all(node, predicate) { const result = []; walk(node, value => { if (predicate(value)) result.push(value); }); return result; }
function text(node) { const parts = []; const collect = value => { if (typeof value === "string" || typeof value === "number") { parts.push(String(value)); return; } if (value == null || typeof value !== "object") return; const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); }; collect(node); return parts.join(" "); }

const report = await bundle("product-report-dialog");
assert.deepEqual(Object.keys(report), ["ProductReportDialog"]);
let reportSubmission, reportClosed = 0;
const reportUi = report.ProductReportDialog({ initialTarget: "product-report", product: { id: "p", title: "A very useful product", url: "https://shop/item" }, onClose() { reportClosed++; }, onSubmit(value) { reportSubmission = value; } });
assert.match(text(reportUi), /Report A very useful product/);
assert.equal(all(reportUi, node => node.type === "option").length, 4);
find(reportUi, node => node.props?.["aria-label"] === "Report reason").props.onChange({ currentTarget: { value: "scam" } });
find(reportUi, node => node.props?.["aria-label"] === "Additional details").props.onChange({ currentTarget: { value: "Suspicious" } });
find(reportUi, node => node.type === "form").props.onSubmit({ preventDefault() {} });
await Promise.resolve();
assert.equal(reportSubmission.reason.id, "scam");
assert.equal(reportSubmission.details, "Suspicious");
find(reportUi, node => node.props?.["aria-label"] === "Close").props.onClick();
assert.equal(reportClosed, 1);
assert.match(text(report.ProductReportDialog({ product: { title: "Item" }, onClose() {} })), /What would you like to report/);

const share = await bundle("chatgpt-project-share-dialog");
assert.deepEqual(Object.keys(share), ["ChatGptProjectShareDialog"]);
let copiedLink, inviteDetails, removedSubject;
const shareState = { audience: "private", canInvite: true, canOpen: true, link: "https://chatgpt.com/project/p", subjects: [{ id: "u", label: "Ada", type: "user", permission: "view" }] };
const shareUi = share.ChatGptProjectShareDialog({ accountId: "a", projectId: "p", state: shareState, onClose() {}, onCopy(link) { copiedLink = link; }, onInvite(subjects, permission) { inviteDetails = `${subjects[0].label}:${permission}`; }, onRemove(subject) { removedSubject = subject.id; } });
assert.match(text(shareUi), /Share project/);
assert.match(text(shareUi), /Ada\s+· view/);
find(shareUi, node => node.props?.["aria-label"] === "People or groups").props.onChange({ currentTarget: { value: "grace@example.com" } });
find(shareUi, node => node.props?.["aria-label"] === "Permission").props.onChange({ currentTarget: { value: "view" } });
find(shareUi, node => node.props?.children === "Invite").props.onClick();
await Promise.resolve();
assert.equal(inviteDetails, "grace@example.com:view");
find(shareUi, node => node.props?.children === "Copy link").props.onClick();
assert.equal(copiedLink, "https://chatgpt.com/project/p");
find(shareUi, node => node.props?.["aria-label"] === "Remove Ada").props.onClick();
assert.equal(removedSubject, "u");
assert.equal(find(share.ChatGptProjectShareDialog({ accountId: "a", projectId: "p", isLoading: true, onClose() {} }), node => node.props?.role === "status").props.children, "Loading sharing settings");

const schedules = await bundle("workspace-agent-schedules-dialog");
assert.deepEqual(Object.keys(schedules), ["WorkspaceAgentSchedulesDialog"]);
const schedule = { id: "s", destination: "ChatGPT", enabled: true, instructions: "Summarize", schedule: "Daily", timeZone: "UTC" };
let deletedSchedule, schedulesClosed = 0;
const scheduleUi = schedules.WorkspaceAgentSchedulesDialog({ accountId: "a", agentId: "agent", schedules: [schedule], onClose() { schedulesClosed++; }, onDelete(value) { deletedSchedule = value.id; } });
assert.match(text(scheduleUi), /Scheduled automations/);
assert.match(text(scheduleUi), /Daily\s+\(UTC\)/);
find(scheduleUi, node => node.props?.children === "Delete").props.onClick();
await Promise.resolve();
assert.equal(deletedSchedule, "s");
find(scheduleUi, node => node.props?.["aria-label"] === "Close").props.onClick();
assert.equal(schedulesClosed, 1);
assert.match(text(schedules.WorkspaceAgentSchedulesDialog({ accountId: "a", agentId: "agent", canEdit: false, schedules: [], onClose() {} })), /cannot change it/);
assert.equal(find(schedules.WorkspaceAgentSchedulesDialog({ accountId: "a", agentId: "agent", error: "Offline", onClose() {} }), node => node.props?.role === "alert").type, "div");

const cme = await bundle("cme-dialog");
assert.deepEqual(Object.keys(cme), ["CmeDialog"]);
assert.equal(cme.CmeDialog({ identity: null, onClose() {} }), null);
let claim;
const cmeUi = cme.CmeDialog({ conversations: [{ conversation_id: "c", title: "Clinical review", credits: 2 }], onClose() {}, onSubmit(value) { claim = value; return { approved: true, year: 2026 }; } });
assert.match(text(cmeUi), /Claim CME credits/);
assert.match(text(cmeUi), /Clinical review\s+· 2 credits/);
const cmeChecks = all(cmeUi, node => node.type === "input" && node.props?.type === "checkbox");
assert.equal(cmeChecks.length, 2);
cmeChecks[0].props.onChange({ currentTarget: { checked: true } });
find(cmeUi, node => node.props?.children === "Mark evaluation complete").props.onClick();
cmeChecks[1].props.onChange({ currentTarget: { checked: true } });
find(cmeUi, node => node.props?.children === "Submit claim").props.onClick();
await Promise.resolve();
assert.equal(claim.conversations[0].conversation_id, "c");
assert.equal(claim.conversations[0].evaluation.no_commercial_bias, true);
assert.match(text(cme.CmeDialog({ conversations: [], onClose() {} })), /No conversations are eligible/);

console.log("workspace sharing compliance cluster tests passed");
