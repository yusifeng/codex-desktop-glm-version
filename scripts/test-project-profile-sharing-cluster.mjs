import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hookState = { effects: [], hooks: [], index: 0 };
const ReactRuntime = {
  useState(initialValue) { const index = hookState.index++; if (!(index in hookState.hooks)) hookState.hooks[index] = typeof initialValue === "function" ? initialValue() : initialValue; return [hookState.hooks[index], value => { hookState.hooks[index] = typeof value === "function" ? value(hookState.hooks[index]) : value; }]; },
  useEffect(callback, dependencies) { const index = hookState.index++; const previous = hookState.effects[index]; if (previous == null || dependencies.some((value, dependencyIndex) => value !== previous[dependencyIndex])) { hookState.effects[index] = dependencies; callback(); } },
};
globalThis.__projectProfileSharingTest = { ReactRuntime, jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "project-profile-sharing-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__projectProfileSharingTest.jsx;export const e6=globalThis.__projectProfileSharingTest.ReactRuntime;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function resetHooks() { hookState.effects = []; hookState.hooks = []; hookState.index = 0; }
function render(component, props) { hookState.index = 0; return component(props); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function all(node, predicate) { const result = []; walk(node, value => { if (predicate(value)) result.push(value); }); return result; }
function text(node) { const parts = []; const collect = value => { if (typeof value === "string" || typeof value === "number") { parts.push(String(value)); return; } if (value == null || typeof value !== "object") return; const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); }; collect(node); return parts.join(" "); }

const profileShareReleaseAssertions = assertReleaseOwner("profile-share-dialog-content");

const scheduledShareReleaseAssertions = assertReleaseOwner("scheduled-task-share-dialog");

const imageShareReleaseAssertions = assertReleaseOwner("image-prompt-share-dialog");

const projectSettingsReleaseAssertions = assertReleaseOwner("chatgpt-project-settings-modal");

const showcaseReleaseAssertions = assertReleaseOwner("profile-showcase-editor");

console.log(`project profile sharing cluster tests passed with ${profileShareReleaseAssertions + scheduledShareReleaseAssertions + imageShareReleaseAssertions + projectSettingsReleaseAssertions + showcaseReleaseAssertions} release assertions`);
