import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__writingActionTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "writing-action-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__writingActionTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }

// writing-block-copy-button: 8
const copyButton = await bundle("writing-block-copy-button");
assert.deepEqual(Object.keys(copyButton), ["n", "t"]);
assert.equal(copyButton.n(), undefined);
let copies = 0;
const copyUi = copyButton.t({ className: "copy", onCopy() { copies++; } });
assert.equal(copyUi.type, "button");
assert.equal(copyUi.props["aria-label"], "Copy");
assert.equal(copyUi.props.className, "copy");
await copyUi.props.onClick();
assert.equal(copies, 1);
const disabledCopy = copyButton.t({ isDisabled: true, onCopy() { copies++; } });
assert.equal(disabledCopy.props.disabled, true);
await disabledCopy.props.onClick();
assert.equal(copies, 1);

// chatgpt-writing-block-ai-tools: 19
const aiTools = await bundle("chatgpt-writing-block-ai-tools");
assert.deepEqual(Object.keys(aiTools), ["i", "n", "r", "t"]);
assert.deepEqual(aiTools.r, { TOOLBAR: "toolbar", FULLSCREEN_COMPOSER: "fullscreen-composer", HEADER_COMPOSER: "header-composer" });
assert.equal(aiTools.i(), undefined);
assert.equal(aiTools.t(), undefined);
const unavailable = aiTools.n({ enableAiTools: false, isEditable: true, showMagicEditAction: true });
assert.equal(unavailable.isHeaderInteractionDisabled, true);
assert.equal(unavailable.headerMagicEditAction.props.disabled, true);
assert.equal(await unavailable.submitHeaderMagicEdit("Change"), false);
const requests = []; let writeLikeMe;
const available = aiTools.n({ editorView: { isDestroyed: false }, enableAiTools: true, isEditable: true, showMagicEditAction: true, async onExecuteRequest(request) { requests.push(request); return { magicEditId: "edit-1", replacements: ["Replacement"] }; }, onWriteLikeMeResult(instruction, replacement) { writeLikeMe = { instruction, replacement }; } });
assert.equal(available.isHeaderInteractionDisabled, false);
assert.equal(available.isHeaderComposerOpen, false);
available.headerMagicEditAction.props.onClick();
assert.equal(available.isHeaderComposerOpen, true);
assert.equal(await available.submitHeaderMagicEdit("  Make concise  "), true);
assert.deepEqual(requests[0], { instruction: "Make concise", mode: "full-edit", submissionSource: "header-composer" });
assert.equal(await available.onWriteLikeMeAction("Use my voice"), true);
assert.deepEqual(writeLikeMe, { instruction: "Use my voice", replacement: "Replacement" });
assert.equal(requests.length, 2);
available.resetAiTools();
assert.equal(available.isHeaderComposerOpen, false);
assert.equal(available.resetGeneratePrompt(), undefined);
const destroyed = aiTools.n({ editorView: { isDestroyed: true }, enableAiTools: true, isEditable: true });
assert.equal(destroyed.isHeaderInteractionDisabled, true);
assert.equal(await aiTools.n({ enableAiTools: true, isEditable: true }).submitHeaderMagicEdit(""), false);

console.log("27 writing block action control cluster assertions passed");
