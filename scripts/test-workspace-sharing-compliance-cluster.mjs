import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let activeHooks = [], hookCursor = 0;
const React = { useState(initial) { const hooks = activeHooks, index = hookCursor++; if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial; return [hooks[index], value => { hooks[index] = typeof value === "function" ? value(hooks[index]) : value; }]; } };
globalThis.__workspaceSharingComplianceTest = { React, jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "workspace-sharing-compliance-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__workspaceSharingComplianceTest.jsx;export const e6=globalThis.__workspaceSharingComplianceTest.React;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function mount(Component, props) { const hooks = []; return { render() { activeHooks = hooks; hookCursor = 0; return Component(props); } }; }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function all(node, predicate) { const result = []; walk(node, value => { if (predicate(value)) result.push(value); }); return result; }
function text(node) { const parts = []; const collect = value => { if (typeof value === "string" || typeof value === "number") { parts.push(String(value)); return; } if (value == null || typeof value !== "object") return; const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); }; collect(node); return parts.join(" "); }

const report = await bundle("product-report-dialog");
assert.deepEqual(Object.keys(report), ["ProductReportDialog"]);
let reportSubmission, reportClosed = 0;
const reportMount = mount(report.ProductReportDialog, { initialTarget: "product-report", product: { id: "p", title: "A very useful product", url: "https://shop/item" }, onClose() { reportClosed++; }, onSubmit(value) { reportSubmission = value; } });
let reportUi = reportMount.render();
assert.match(text(reportUi), /Report A very useful product/);
assert.equal(all(reportUi, node => node.type === "option").length, 4);
find(reportUi, node => node.props?.["aria-label"] === "Report reason").props.onChange({ currentTarget: { value: "scam" } });
find(reportUi, node => node.props?.["aria-label"] === "Additional details").props.onChange({ currentTarget: { value: "Suspicious" } });
reportUi = reportMount.render();
find(reportUi, node => node.type === "form").props.onSubmit({ preventDefault() {} });
await Promise.resolve();
assert.equal(reportSubmission.reason.id, "scam");
assert.equal(reportSubmission.details, "Suspicious");
find(reportUi, node => node.props?.["aria-label"] === "Close").props.onClick();
assert.equal(reportClosed, 1);
assert.match(text(mount(report.ProductReportDialog, { product: { title: "Item" }, onClose() {} }).render()), /What would you like to report/);

const shareAssertions = assertReleaseOwner("chatgpt-project-share-dialog", [
  /@rchunk\/project-share-model/,
  /@rchunk\/permission-dropdown/,
  /export \{ en as ChatGptProjectShareDialog \}/,
]);

const restoredOwnerAssertions =
  assertReleaseOwner("workspace-agent-schedules-dialog") +
  assertReleaseOwner("cme-dialog");

console.log(`workspace sharing compliance cluster tests passed with ${shareAssertions + restoredOwnerAssertions} release assertions`);
