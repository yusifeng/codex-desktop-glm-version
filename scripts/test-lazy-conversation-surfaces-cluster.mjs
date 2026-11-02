import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
globalThis.__lazySurfaceTest = { jsx, writingBlock: props => ({ type: "writing-block", props }) };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "lazy-surface-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__lazySurfaceTest.jsx;" : importPath === "library-writing-block-core" ? "export const n=()=>{};export const t=globalThis.__lazySurfaceTest.writingBlock;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
const children = node => Array.isArray(node?.props?.children) ? node.props.children : [node?.props?.children];

// library-writing-block: 3
const writing = await bundle("library-writing-block");
assert.deepEqual(Object.keys(writing), ["LibraryWritingBlock"]);
assert.equal(writing.LibraryWritingBlock({ id: "w1" }).type, "writing-block");
assert.equal(writing.LibraryWritingBlock({ id: "w1" }).props.id, "w1");

const subagents = [{ threadId: "active", status: "working", displayName: "Researcher", prompt: "Search" }, { threadId: "done", status: "done", displayName: "Writer", statusMessage: "Finished" }];
const subagentsReleaseAssertions = assertReleaseOwner("chatgpt-subagents-panel");

assertReleaseOwner("registered-chatgpt-subagents-thumbnail");

const imageGameAssertions = assertReleaseOwner("image-gen-loading-games");

const beaconAssertions = assertReleaseOwner("chatgpt-conversation-inline-beacon", [
  /@rchunk\/pca-connector-eligibility/,
  /eventType: `view`/,
  /action: `dismiss`/,
  /export \{ Be as ChatGptConversationInlineBeacon \}/,
]);

assertReleaseOwner("work-mode-pet-content");

console.log(`lazy conversation surface cluster assertions passed with ${subagentsReleaseAssertions + beaconAssertions + imageGameAssertions} release assertions`);
