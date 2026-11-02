import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const expectations = {
  "selected-text-annotation-editor": { dependencies: ["rolldown-runtime","app-shared","annotation-comment-editor-card","comment-light-dismiss"], exported: "SelectedTextAnnotationEditor" },
};
let sourceAssertions = 0;
const sourceAssert = (condition, message) => { sourceAssertions += 1; assert.ok(condition, message); };
for (const [name, expected] of Object.entries(expectations)) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", name, "index.ts"), "utf8");
  const dependencies = [...source.matchAll(/@rchunk\/([^";]+)/g)].map(match => match[1]);
  sourceAssert(JSON.stringify(dependencies) === JSON.stringify(expected.dependencies), name + " exact dependencies");
  sourceAssert(!source.includes("import("), name + " no dynamic imports");
  sourceAssert(!/\bany\b/.test(source), name + " no any");
  sourceAssert(!/\w+Chunk\.[A-Za-z_$]/.test(source), name + " no direct namespace use");
  sourceAssert(source.includes("export { " + expected.exported + " }"), name + " exact export");
}
sourceAssertions += assertReleaseOwner("detached-browser-annotation-host");

const state = globalThis.__editorDocsAnnotationsTest = { initializers: [], setters: [], shake: 0, dismissDecision: "arm", focus: 0, directBodies: [], effects: [], events: new Map(), updates: [], ui: [], registry: [], bridge: [], comments: [], tabs: [], flags: { "2327881676": true, "2849306825": false } };
const marker = name => "() => globalThis.__editorDocsAnnotationsTest.initializers.push(" + JSON.stringify(name) + ")";
const jsx = { Fragment: "Fragment", jsx(type, props, key) { if (typeof type === "function") return { ...type(props), key }; return { type, props, key }; }, jsxs(type, props, key) { return { type, props, key }; } };
state.jsx = jsx;
const React = {
  useCallback(callback) { return callback; },
  useRef(initial) { return { current: initial }; },
  useState(initial) { let value = initial; return [value, next => { value = typeof next === "function" ? next(value) : next; state.setters.push(value); }]; },
  useEffect(effect) { state.effects.push(effect); },
};
state.React = React;

async function load(name, mocks) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", name, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: specifier }) => ({ path: specifier.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: dependency }) => ({ contents: mocks[dependency] ?? "export {};", loader: "js" })); } }] });
  const output = path.join("/tmp", name + "-" + process.pid + "-" + Math.random().toString(36).slice(2) + ".mjs");
  fs.writeFileSync(output, result.outputFiles[0].text);
  const module = await import(pathToFileURL(output).href);
  fs.unlinkSync(output);
  return module;
}
let runtimeAssertions = 0;
const runtimeAssert = (actual, expected, message) => { runtimeAssertions += 1; assert.deepEqual(actual, expected, message); };

const selectedMocks = {
  "rolldown-runtime": "export {};",
  "app-shared": ["export const $3="+marker("shared")+";export const wL="+marker("links")+";export const K2="+marker("compiler")+";export const y_="+marker("theme")+";","export const I3=()=>globalThis.__editorDocsAnnotationsTest.jsx;export const e6=()=>globalThis.__editorDocsAnnotationsTest.React;export const n4=()=>({formatMessage:d=>d.defaultMessage});export const x_=()=>200;export const b_=(value,max)=>Math.min(value,max);"].join("\n"),
  "annotation-comment-editor-card": "export const n="+marker("card")+";export const t='AnnotationCard';",
  "comment-light-dismiss": "export const r="+marker("dismiss")+";export const i=()=>({shake:()=>{globalThis.__editorDocsAnnotationsTest.shake+=1}});export const t=()=>globalThis.__editorDocsAnnotationsTest.dismissDecision;",
};
const selected = await load("selected-text-annotation-editor", selectedMocks);
runtimeAssert(Object.keys(selected), ["SelectedTextAnnotationEditor"], "selected unique export");
runtimeAssert(state.initializers, ["shared","links","compiler","theme","card","dismiss"], "selected initializer order");
let cancels = 0; let deletes = 0; let resolveDirect;
const directPromise = new Promise(resolve => { resolveDirect = resolve; });
const editView = selected.SelectedTextAnnotationEditor({ draftBody: "draft", editAnnotation: { id: "note-1", body: "existing", onDelete: () => { deletes += 1; } }, onCancel: () => { cancels += 1; }, onDirectSubmit: body => { state.directBodies.push(body); return directPromise; }, onSubmit: body => state.directBodies.push("saved:" + body) });
runtimeAssert(editView.type, "div", "selected root");
runtimeAssert(editView.props["data-selected-text-annotation-editor"], true, "selected data marker");
runtimeAssert(editView.props.style, { width: 294 }, "selected fixed width");
runtimeAssert(editView.props.children[0].props.style.height, 88, "edit reserves tray");
const editCard = editView.props.children[1].props.children;
runtimeAssert(editCard.type, "AnnotationCard", "selected card");
runtimeAssert(editCard.props.session, { sessionId: "response-text-annotation-note-1", target: { mode: "edit", commentId: "note-1" }, body: "existing", draftBody: "draft", cwd: null, previewAlignment: "end", surfaceMode: "editor" }, "edit session exact");
runtimeAssert(editCard.props.windowHeight, 208, "edit window includes tray");
runtimeAssert(editCard.props.inputAriaLabel, "Note", "note aria label");
runtimeAssert(editCard.props.placeholder, "Add an optional comment…", "placeholder localized");
editCard.props.onMounted(null, { height: 500 });
runtimeAssert(state.setters.at(-1), 200, "height clamped");
editCard.props.onDelete(); runtimeAssert(deletes, 1, "delete forwarded");
editCard.props.onSubmit({ body: "regular" }); runtimeAssert(state.directBodies, ["saved:regular"], "regular submit body");
editCard.props.onDirectSubmit({ body: "direct" }); editCard.props.onDirectSubmit({ body: "duplicate" });
runtimeAssert(state.directBodies, ["saved:regular","direct"], "direct submit guarded");
const focusable = { focus() { state.focus += 1; } };
const blurTarget = { contains: () => false, querySelector: selector => { state.selector = selector; return focusable; }, ownerDocument: { defaultView: { requestAnimationFrame: callback => callback() } } };
editView.props.onBlur({ currentTarget: blurTarget, relatedTarget: null }); runtimeAssert(state.shake, 0, "direct submit suppresses blur dismiss");
resolveDirect(); await directPromise; await Promise.resolve();
state.dismissDecision = "arm"; editView.props.onBlur({ currentTarget: blurTarget, relatedTarget: null });
runtimeAssert(state.shake, 1, "first dismiss shakes"); runtimeAssert(state.focus, 1, "failed dismiss restores focus"); runtimeAssert(cancels, 0, "failed dismiss stays open");
state.dismissDecision = "dismiss"; editView.props.onBlur({ currentTarget: blurTarget, relatedTarget: null }); runtimeAssert(cancels, 1, "armed dismiss cancels");
editCard.props.onDictationBusyChange(true); state.dismissDecision = "dismiss"; editView.props.onBlur({ currentTarget: blurTarget, relatedTarget: null }); runtimeAssert(state.shake, 2, "dictation busy always shakes");
const createView = selected.SelectedTextAnnotationEditor({ onCancel() {}, onDirectSubmit() {}, onSubmit() {} });
const createCard = createView.props.children[1].props.children;
runtimeAssert(createView.props.children[0].props.style.height, 0, "create has no tray"); runtimeAssert(createView.props.children[1].props.style, { height: 44, top: -0 }, "create compact layout"); runtimeAssert(createCard.props.session.target, { mode: "create" }, "create target"); runtimeAssert(createCard.props.windowHeight, 120, "create window height");

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
