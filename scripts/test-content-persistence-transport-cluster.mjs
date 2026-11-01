import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uploadCalls = [];
globalThis.__contentBridgeTest = { uploadCalls, observerStopped: false, jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "content-bridge-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => { if (importPath === "app-shared") return { contents: `
export const I3=()=>globalThis.__contentBridgeTest.jsx;
export const FX=()=>{};
export const IK=(left,right)=>String(left).replaceAll("\\\\","/").replace(/\\/+$/,"").toLowerCase()===String(right).replaceAll("\\\\","/").replace(/\\/+$/,"").toLowerCase();
export const RI=()=>{};
export const oZ=(source,initialValue)=>({source,initialValue});
export const l1=()=>{};
export const m1=(element,options,callback)=>{callback();return()=>{globalThis.__contentBridgeTest.observerStopped=true}};
export const pZ=(scope,initialValue)=>({scope,initialValue});
`, loader: "js" }; if (importPath === "text-file-storage") return { contents: "export const n=()=>globalThis.__contentBridgeTest.storageInitialized=true; export const r=async input=>({content:`${input.hostId}:${input.filePath}`});", loader: "js" }; if (importPath === "editable-writing-block") return { contents: "export const t=props=>({type:'editable-writing-block',props});", loader: "js" }; if (importPath === "app-initial") return { contents: "export class HRt extends Error{}; export const $en={id:'conversation-scope'},Ftn=()=>{},itn=()=>{},wtn={id:'terminal-binding'},URt=1000,WRt=3,GRt=(...a)=>['create',...a],JRt=(...a)=>['conversation',...a],XRt=(...a)=>['project',...a],YRt=(...a)=>['bytes',...a],qRt=(...a)=>['stream',...a],KRt=()=>globalThis.__contentBridgeTest.uploadCalls.push('init');", loader: "js" }; return { contents: "export {};", loader: "js" }; }); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }

// read-saved-plan-content: 7
const savedPlan = await bundle("read-saved-plan-content");
assert.deepEqual(Object.keys(savedPlan), ["n", "t"]);
assert.equal(await savedPlan.n({ hostId: "local", path: "/plan.md" }), "local:/plan.md");
let saved = 0;
assert.equal(await savedPlan.n({ hostId: "remote", path: "/p.md", save: async () => { saved++; return true; } }), "remote:/p.md");
assert.equal(saved, 1);
await assert.rejects(() => savedPlan.n({ hostId: "local", path: "/bad", save: () => false }), /Could not save/);
savedPlan.t();
assert.equal(globalThis.__contentBridgeTest.storageInitialized, true);
assert.equal(typeof savedPlan.n, "function");

// chatgpt-file-upload: 10
const upload = await bundle("chatgpt-file-upload");
assert.equal(uploadCalls.length, 1);
assert.equal(upload.MAX_CHATGPT_UPLOAD_SIZE_BYTES, 1000);
assert.equal(upload.MAX_CONCURRENT_CHATGPT_FILE_UPLOADS, 3);
assert.equal(new upload.ChatGptFileUploadIncompleteError("incomplete").message, "incomplete");
assert.deepEqual(upload.createChatGptFile("file"), ["create", "file"]);
assert.deepEqual(upload.uploadChatGptConversationFile("conversation"), ["conversation", "conversation"]);
assert.deepEqual(upload.uploadChatGptProjectFiles("project"), ["project", "project"]);
assert.deepEqual(upload.uploadChatGptFileBytes("bytes"), ["bytes", "bytes"]);
assert.deepEqual(upload.processChatGptFileUploadStream("stream"), ["stream", "stream"]);
assert.equal(Object.keys(upload).length, 8);

// terminal-workspace-warning-state: 10
const terminal = await bundle("terminal-workspace-warning-state");
assert.deepEqual(Object.keys(terminal), ["n", "r", "t"]);
terminal.t();
const baseWarning = { binding: { hostId: "local", workspaceRoot: "/repo/a" }, currentTarget: { hostId: "local", workspaceRoot: "/repo/b" }, currentWorkspaceRoots: [] };
assert.equal(terminal.n(baseWarning), true);
assert.equal(terminal.n({ ...baseWarning, currentTarget: { hostId: "local", workspaceRoot: "/REPO/A/" } }), false);
assert.equal(terminal.n({ ...baseWarning, currentWorkspaceRoots: ["/repo/a"] }), false);
assert.equal(terminal.n({ ...baseWarning, dismissedTarget: { hostId: "local", workspaceRoot: "/repo/b" } }), false);
assert.equal(terminal.n({ ...baseWarning, binding: null }), false);
assert.equal(terminal.n({ ...baseWarning, binding: { hostId: "remote", workspaceRoot: "/repo/a" } }), true);
assert.equal(terminal.r.source.id, "terminal-binding");
assert.equal(terminal.r.initialValue("terminal-1"), null);
assert.equal(terminal.t(), undefined);

// right-panel-composer-overlay-alignment: 8
const alignment = await bundle("right-panel-composer-overlay-alignment");
alignment.t();
assert.equal(alignment.r.scope.id, "conversation-scope");
assert.equal(alignment.r.initialValue(), null);
const values = new Map();
const store = { get(signal) { return values.get(signal) ?? null; }, set(signal, value) { values.set(signal, value); } };
const element = { getBoundingClientRect: () => ({ left: 12, width: 480 }) };
const cleanupAlignment = alignment.n(store, element);
assert.deepEqual(store.get(alignment.r), { left: 12, width: 480 });
cleanupAlignment();
assert.equal(globalThis.__contentBridgeTest.observerStopped, true);
assert.equal(store.get(alignment.r), null);
assert.equal(typeof cleanupAlignment, "function");
assert.deepEqual(Object.keys(alignment), ["n", "r", "t"]);

// writing-block-content-update: 14
const contentUpdate = await bundle("writing-block-content-update");
assert.deepEqual(Object.keys(contentUpdate), ["a", "i", "n", "o", "r", "t"]);
const sections = [{ id: "original", tone: "Original", content: "A" }, { id: "short", tone: "Short", content: "B" }, { id: "warm", tone: "Warm", content: "C" }, { id: "extra", tone: "Extra", content: "D" }];
assert.deepEqual(contentUpdate.r(sections, "original"), { isOriginal: true });
assert.deepEqual(contentUpdate.r(sections, "short"), { id: "short", index: 1, isOriginal: false });
assert.deepEqual(contentUpdate.r(sections, "missing"), { isOriginal: true });
const metadata = contentUpdate.n({ source: "draft" }, sections.slice(0, 2));
assert.equal(metadata.source, "draft");
assert.deepEqual(metadata.tone_sections[1], { content: "B", id: "short", label: "Short" });
const updated = contentUpdate.t({ nextContent: "Edited", toneSectionId: "short", toneSections: sections });
assert.equal(updated.activeToneSectionId, "short");
assert.equal(updated.content, "A");
assert.equal(updated.toneSections[1].content, "Edited");
assert.equal(contentUpdate.t({ nextContent: "Plain", toneSectionId: "missing", toneSections: sections }).content, "Plain");
let persisted;
const controller = contentUpdate.o({ isPersistenceReady: true, isStreaming: false, metadata: { active_option_id: "short" }, onPersistSelection(id) { persisted = id; }, toneSections: sections });
assert.equal(controller.activeToneSectionId, "short");
assert.equal(controller.displayedToneSections.length, 3);
controller.selectToneSection("warm");
assert.equal(persisted, "warm");
assert.equal(controller.activeToneSectionId, "warm");

// writing-block-directive-renderer: 18
const directive = await bundle("writing-block-directive-renderer");
assert.deepEqual(Object.keys(directive), ["a", "c", "i", "l", "n", "o", "r", "s", "t"]);
assert.deepEqual(directive.s('{"options":[]}'), { options: [] });
assert.equal(directive.s("bad"), undefined);
assert.equal(directive.r("Hello {{name}} and 【place】", { contentReferences: [{ id: "name", text: "David" }, { id: "place", replacement: "Shanghai" }] }), "Hello David and Shanghai");
const tones = directive.c({ content: "Base", metadata: { options: [{ id: "a", tone: "plain" }, { id: "b", tone: "warm", content: "Warm" }] } });
assert.equal(tones.length, 2);
assert.equal(tones[0].content, "Base");
assert.equal(tones[1].tone, "warm");
assert.equal(directive.c({ content: "", metadata: { options: [{ id: "empty" }] } }), undefined);
const referencedMetadata = directive.i({ options: [{ content: "Hi {{who}}" }] }, { contentReferences: [{ id: "who", text: "team" }] });
assert.equal(referencedMetadata.options[0].content, "Hi team");
const unchanged = { content: "{{x}}", edited: true };
assert.equal(directive.a(unchanged, { contentReferences: [{ id: "x", text: "changed" }] }), unchanged);
assert.equal(directive.a({ content: "{{x}}", edited: false }, { contentReferences: [{ id: "x", text: "changed" }] }).content, "changed");
const rendered = directive.t({ attributes: { title: "Email", recipient: "a@example.com", variant: "email" }, contentReferences: [{ id: "name", text: "David" }], rawText: "\nHello {{name}}\n", testId: "wb" });
assert.equal(rendered.type, "editable-writing-block");
assert.equal(rendered.props.content, "Hello David");
assert.equal(rendered.props.emailMetadata.recipient, "a@example.com");
assert.equal(rendered.props.title, "Email");
assert.equal(rendered.props.variant, "email");
assert.equal(rendered.props.testId, "wb");
assert.equal(directive.t({ rawText: "body", renderPersisted: () => "saved" }).props.children, "saved");

console.log("67 content persistence and transport cluster assertions passed");
