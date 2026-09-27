import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__writingBlockAppTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "writing-block-app-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => importPath === "@rchunk/editable-writing-block" && directory === "writing-block-app-capabilities" ? { path: path.join(ROOT, "src/renderer/editable-writing-block/index.ts") } : { path: importPath.slice(8), namespace: "mock" }); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__writingBlockAppTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function findAll(node, predicate) { const values = []; walk(node, value => { if (predicate(value)) values.push(value); }); return values; }
function find(node, predicate) { return findAll(node, predicate)[0]; }
function byText(node, value) { return find(node, candidate => candidate.props?.children === value); }
function text(node) { const values = []; const collect = value => { if (typeof value === "string") values.push(value); else if (value != null && typeof value === "object") { const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); } }; collect(node); return values.join(" "); }

// editable-writing-block: 22
const editable = await bundle("editable-writing-block");
assert.deepEqual(Object.keys(editable), ["a", "i", "n", "r", "t"]);
assert.equal(editable.i(), undefined);
assert.equal(editable.n(), undefined);
const controller = editable.a.get("block-1");
assert.equal(controller.getState(), null);
controller.setState({ changes: { text: "new" }, isStreaming: false, persistsUntilEdit: false });
assert.equal(controller.getState().changes.text, "new");
editable.r(null, "block-1");
assert.equal(controller.getState().dismissed, "copy");
const persistent = editable.a.get("block-2");
persistent.setState({ changes: { text: "keep" }, isStreaming: false, persistsUntilEdit: true });
editable.r(null, "block-2");
assert.equal(persistent.getState().dismissed, undefined);
let changed, selected, metadata;
const ui = editable.t({ activeToneSectionId: "warm", content: "Base", emailMetadata: { recipient: "a@example.com", subject: "Hi" }, isEditable: true, onContentChange(value) { changed = value; }, onEmailMetadataChange(value) { metadata = value; }, onToneSectionSelect(id) { selected = id; }, testId: "email-block", title: "Draft", toneSections: [{ id: "plain", tone: "Plain", content: "Plain text" }, { id: "warm", tone: "Warm", content: "Warm text" }], variant: "email" });
assert.equal(ui.props["data-testid"], "email-block");
assert.equal(ui.props["data-writing-block-variant"], "email");
assert.match(text(ui), /Draft/);
assert.equal(find(ui, node => node.type === "textarea").props.value, "Warm text");
assert.equal(findAll(ui, node => node.type === "button").length, 2);
assert.equal(byText(ui, "Warm").props["aria-pressed"], true);
byText(ui, "Plain").props.onClick();
assert.equal(selected, "plain");
find(ui, node => node.type === "textarea").props.onChange({ currentTarget: { value: "Edited" } });
assert.equal(changed, "Edited");
const recipient = find(ui, node => node.props?.["aria-label"] === "To recipients");
assert.equal(recipient.props.value, "a@example.com");
recipient.props.onChange({ currentTarget: { value: "b@example.com" } });
assert.equal(metadata.recipient, "b@example.com");
assert.equal(metadata.subject, "Hi");
const readonly = editable.t({ content: "Read only", isEditable: false });
assert.equal(find(readonly, node => node.props?.["data-writing-block-content"]).props.children, "Read only");
assert.equal(find(readonly, node => node.type === "textarea"), undefined);
const external = editable.t({ content: "Old", externalContentUpdate: { content: "New" } });
assert.match(text(external), /New/);
assert.equal(editable.t({ content: "Body", render: ({ state }) => state.content }), "Body");

// writing-block-app-capabilities: 17
const capabilities = await bundle("writing-block-app-capabilities");
assert.deepEqual(Object.keys(capabilities), ["n", "t"]);
assert.equal(capabilities.n(), undefined);
let asked, history = 0, exported = 0, followed;
const appUi = capabilities.t({ content: "Draft body", conversationId: "conv-1", enableAiTools: true, isEditable: true, librarySaveControls: "Save controls", onAskForChanges(content) { asked = content; }, onBeforeDocumentExport() { exported++; }, onOpenVersionHistory() { history++; }, onSuggestedFollowup(prompt) { followed = prompt; }, writingBlockId: "wb-1", writingBlockIndex: 2 });
assert.equal(appUi.props["data-writing-block-id"], "wb-1");
assert.equal(appUi.props["data-writing-block-index"], 2);
assert.equal(appUi.props["data-conversation-id"], "conv-1");
assert.match(text(appUi), /Save controls/);
assert.equal(find(appUi, node => node.props?.["data-writing-block-actions"]).type, "div");
byText(appUi, "Ask for changes").props.onClick();
assert.equal(asked, "Draft body");
byText(appUi, "Version history").props.onClick();
assert.equal(history, 1);
byText(appUi, "Export").props.onClick();
assert.equal(exported, 1);
byText(appUi, "Improve this writing").props.onClick();
assert.equal(followed, "Improve this writing");
const readOnlyApp = capabilities.t({ content: "Locked", isReadOnly: true });
assert.equal(readOnlyApp.props["data-read-only"], true);
assert.equal(find(readOnlyApp, node => node.type === "textarea"), undefined);
const ineligible = capabilities.t({ onSuggestedFollowup() {}, suggestedFollowupIneligibilityReason: "not_primary_writing_block" });
assert.equal(byText(ineligible, "Improve this writing"), undefined);
const framed = capabilities.t({ title: "Frame me", renderFrame: content => ({ type: "frame", props: { children: content } }) });
assert.equal(framed.type, "frame");
assert.match(text(framed), /Frame me/);
assert.equal(byText(capabilities.t({ content: "No AI", enableAiTools: false, onAskForChanges() {} }), "Ask for changes"), undefined);

console.log("39 editable writing block app cluster assertions passed");
