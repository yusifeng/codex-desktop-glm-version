import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let activeHooks = [], hookCursor = 0;
const React = { useState(initial) { const hooks = activeHooks, index = hookCursor++; if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial; return [hooks[index], value => { hooks[index] = typeof value === "function" ? value(hooks[index]) : value; }]; } };
globalThis.__privacyControlTest = { React, jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "privacy-control-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__privacyControlTest.jsx;export const e6=globalThis.__privacyControlTest.React;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function mount(Component, props) { const hooks = []; return { render() { activeHooks = hooks; hookCursor = 0; return Component(props); } }; }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function all(node, predicate) { const result = []; walk(node, value => { if (predicate(value)) result.push(value); }); return result; }
function text(node) { const parts = []; const collect = value => { if (typeof value === "string" || typeof value === "number") { parts.push(String(value)); return; } if (value == null || typeof value !== "object") return; const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); }; collect(node); return parts.join(" "); }

const browsingReleaseAssertions = assertReleaseOwner("browser-browsing-data-dialog");

const chronicle = await bundle("chronicle-permissions-dialog");
assert.deepEqual(Object.keys(chronicle).sort(), ["S", "_", "a", "b", "c", "d", "f", "g", "h", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u", "v", "x", "y"].sort());
assert.equal(chronicle.i(), "Computer history");
assert.equal(chronicle.u(), "Permissions");
assert.match(chronicle.o(), /without ever recording your screen or audio/);
assert.equal(chronicle.x(new Error("bad config")), "bad config");
let memoriesEnabled = 0, memoryWritten = 0;
await chronicle.g({ id: "identity" }, { setMemoryFeatureEnabled() { memoriesEnabled++; }, writeMemoryConfig() { memoryWritten++; } });
assert.equal(memoriesEnabled, 1);
assert.equal(memoryWritten, 1);
let savedConfig, chronicleClosed = 0;
const permissionsMount = mount(chronicle.t, { config: { appMode: "exclude", apps: [{ id: "mail", name: "Mail" }], websiteMode: "exclude", websites: [] }, onClose() { chronicleClosed++; }, onSave(config) { savedConfig = config; } });
let permissionsUi = permissionsMount.render();
assert.match(text(permissionsUi), /Computer history permissions/);
assert.match(text(permissionsUi), /Mail/);
find(permissionsUi, node => node.props?.["aria-label"] === "Website domain").props.onChange({ currentTarget: { value: "Example.COM" } });
permissionsUi = permissionsMount.render();
find(permissionsUi, node => node.props?.children === "Add website").props.onClick();
permissionsUi = permissionsMount.render();
assert.match(text(permissionsUi), /example.com/);
find(permissionsUi, node => node.props?.children === "Continue").props.onClick();
await Promise.resolve();
assert.deepEqual(savedConfig.websites, ["example.com"]);
assert.equal(chronicleClosed, 1);
const loadingPermissions = mount(chronicle.t, { isLoading: true, onClose() {} }).render();
assert.equal(find(loadingPermissions, node => node.props?.role === "status").props.children, "Loading permissions…");
const failedPermissions = mount(chronicle.t, { error: { code: "E42", message: "bad" }, onClose() {} }).render();
assert.match(text(find(failedPermissions, node => node.props?.role === "alert")), /error E42/);
let enabledFromDialog = 0;
const memoriesUi = mount(chronicle.y, { onCancel() {}, onEnable() { enabledFromDialog++; } }).render();
assert.match(text(memoriesUi), /Turn on Memories to use Computer history/);
find(memoriesUi, node => node.props?.children === "Turn on Memories").props.onClick();
await Promise.resolve();
assert.equal(enabledFromDialog, 1);
assert.equal(await chronicle.v({ enableMemories() {}, getChronicleState() { return { memoriesEnabled: true }; } }), true);
chronicle.S(); chronicle._(); chronicle.b(); chronicle.f(); chronicle.n();

console.log(`privacy control dialog cluster tests passed with ${browsingReleaseAssertions} release assertions`);
