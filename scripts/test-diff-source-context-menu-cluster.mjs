import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__diffUiTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "diff-ui-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__diffUiTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function text(node) { const parts = []; walk(node, value => { if (typeof value.props?.children === "string") parts.push(value.props.children); }); return parts.join(" "); }

const diff = await bundle("diff-source");
assert.deepEqual(Object.keys(diff).sort(), ["i", "n", "r", "t"]);
const files = [{ path: "src/a.ts", hunks: [{ hunkId: "h1", lineStart: 10, lineEnd: 13, lineMapping: "contiguous", text: "alpha\nneedle one\nneedle two\nomega" }] }];
const calls = [];
const source = diff.t({ contextId: "review", getFiles: () => files, preserveScrollBeforeResultClear: true, scrollAdapter: { getFileContainer(path) { calls.push(["get", path]); return null; }, scrollToFile(path) { calls.push(["file", path]); }, scrollToLocation(location) { calls.push(["location", location.lineStart]); } } });
assert.equal(source.domain, "diff");
assert.equal(source.contextId, "review");
assert.equal(source.preserveScrollBeforeResultClear, true);
const result = await source.search({ domain: "diff", contextId: "review", query: " needle " });
assert.equal(result.query, "needle");
assert.equal(result.totalMatches, 2);
assert.equal(result.matches.length, 2);
assert.equal(result.matches[0].location.path, "src/a.ts");
assert.equal(result.matches[0].location.lineStart, 11);
assert.equal(result.matches[1].location.lineStart, 12);
assert.equal(result.matches[0].ordinal, 1);
assert.match(result.matches[0].id, /^diff:src\/a\.ts:h1:/);
assert.match(result.matches[0].snippet, /needle one/);
assert.equal(result.isCapped, false);
const empty = await source.search({ domain: "diff", contextId: "review", query: "  " });
assert.equal(empty.matches.length, 0);
assert.equal(empty.totalMatches, 0);
await source.ensureVisible(result.matches[0].location);
assert.deepEqual(calls, [["get", "src/a.ts"], ["file", "src/a.ts"], ["location", 11], ["get", "src/a.ts"]]);
const wrong = { ...result.matches[0].location, contextId: "other" };
await source.ensureVisible(wrong);
assert.equal(calls.length, 4);
const spanSource = diff.t({ contextId: "span", getFiles: () => [{ path: "b", hunks: [{ hunkId: "h", lineStart: 1, lineEnd: 9, text: "left target right", lineSpans: [{ start: 0, end: 16, lineStart: 7, lineEnd: 7, side: "right" }] }] }], scrollAdapter: { getFileContainer() { return {}; }, scrollToFile() {} } });
const spanResult = await spanSource.search({ domain: "diff", contextId: "span", query: "target" });
assert.equal(spanResult.matches[0].location.lineStart, 7);
assert.equal(spanResult.matches[0].location.side, "right");
const many = "x ".repeat(300);
const cappedSource = diff.t({ contextId: "cap", getFiles: () => [{ path: "c", hunks: [{ hunkId: "h", lineStart: 1, lineEnd: 1, lineMapping: "contiguous", text: many }] }], scrollAdapter: { getFileContainer() { return {}; }, scrollToFile() {} } });
const capped = await cappedSource.search({ domain: "diff", contextId: "cap", query: "x" });
assert.equal(capped.matches.length, 250);
assert.equal(capped.totalMatches, 300);
assert.equal(capped.isCapped, true);
const marker = { value: null, setAttribute(name, value) { this.value = [name, value]; } };
diff.i({ path: "src/a.ts" })(marker);
assert.deepEqual(marker.value, ["data-diff-path", "src/a.ts"]);
diff.i({ path: "src/a.ts", skipFindHighlight: true })(marker);
assert.deepEqual(marker.value, ["data-skip-find-highlight", "true"]);
diff.n(); diff.r(); assert.equal(typeof diff.t, "function");

const menuReleaseAssertions = assertReleaseOwner("code-diff-context-menu");
console.log(`diff source assertions and ${menuReleaseAssertions} context menu release assertions passed`);
