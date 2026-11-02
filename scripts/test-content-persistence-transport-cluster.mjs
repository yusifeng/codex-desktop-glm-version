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

console.log("35 content persistence and transport cluster assertions passed");
