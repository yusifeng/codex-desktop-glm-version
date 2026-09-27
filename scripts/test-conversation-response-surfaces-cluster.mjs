import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
globalThis.__responseSurfaceTest = { jsx };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "response-surface-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__responseSurfaceTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
const children = node => Array.isArray(node?.props?.children) ? node.props.children : [node?.props?.children];

// resume-chatgpt-completion: 12
const resume = await bundle("resume-chatgpt-completion");
assert.deepEqual(Object.keys(resume), ["n", "r", "t"]);
assert.equal(resume.n(), undefined);
let resumed; const conversation = { conversation_id: "c1", current_node: "n1", nodes: [{ author: { role: "user" }, id: "m1" }] };
const scope = { getConversation(id) { return id === "c1" ? conversation : null; }, async resume(value, signal, voice) { resumed = { value, signal, voice }; return value; } };
assert.equal(await resume.r(scope, "missing"), undefined);
assert.equal(await resume.r({ ...scope, getConversation() { return { ...conversation, is_read_only: true }; } }, "c1"), undefined);
assert.equal(await resume.r({ ...scope, getConversation() { return { ...conversation, nodes: [{ author: { role: "assistant" }, id: "m1" }] }; } }, "c1"), undefined);
const controller = new AbortController(); controller.abort();
assert.equal(await resume.r(scope, "c1", undefined, controller.signal), undefined);
assert.equal(await resume.r(scope, "c1", { voice: true }), conversation);
assert.equal(resumed.value, conversation);
assert.deepEqual(resumed.voice, { voice: true });
const options = resume.t.getOptions(scope, "c1");
assert.deepEqual(options.queryKey, ["chatgpt-completion-resume", "c1", "n1"]);
assert.equal(options.retry, false);
assert.equal(options.staleTime, 60000);

// content: 16
const content = await bundle("content");
assert.deepEqual(Object.keys(content), ["i", "n", "r", "t"]);
assert.equal(content.i(), undefined);
assert.equal(content.n(), undefined);
const icons = content.r({ resolvedApps: [{ installUrl: "https://example.com/apps/" }], toolIcons: ["code", "/logo.png", "https://cdn.example/icon.png"] });
assert.equal(icons.type, "span");
assert.equal(children(icons).length, 2);
assert.equal(children(icons)[0].props["data-icon-kind"], "built-in");
assert.equal(children(icons)[1].props.children, "https://example.com/logo.png");
const restricted = content.r({ resolvedApps: [], shouldBlockExternalEgress: true, toolIcons: ["https://cdn.example/icon.png"] });
assert.equal(children(restricted)[0].props["data-load-remote"], false);
assert.equal(content.r({ resolvedApps: [], toolIcons: ["javascript:alert(1)"] }), null);
const updating = content.t({ item: { isUpdating: true, writes: [] } });
assert.equal(updating.props.role, "status");
assert.equal(updating.props.children, "Updating memory");
let managed = 0; const memories = content.t({ item: { writes: ["The user's favorite color is green", "User lives in Paris"] }, onManage() { managed++; } });
assert.equal(children(memories)[0].props.children, "Memories updated");
assert.equal(children(memories)[1].props.children[0].props.children, "favorite color is green");
assert.equal(children(memories)[1].props.children[1].props.children, "lives in Paris");
children(memories)[0].props.onClick();
assert.equal(managed, 1);
assert.equal(children(content.t({ item: { writes: ["One"] } }))[0].props.disabled, true);

// chatgpt-generated-image-favorite: 14
const favorite = await bundle("chatgpt-generated-image-favorite");
assert.deepEqual(Object.keys(favorite), ["a", "i", "n", "r", "t"]);
assert.equal(favorite.a(), undefined);
assert.equal(favorite.r(), undefined);
assert.equal(favorite.i.staleTime, 30000);
assert.deepEqual(favorite.i.getKey("f1", "c1", "a1", "u1"), ["library-api", "a1", "u1", "generated-image-info", "f1", "c1"]);
const base = { conversationId: "c1", image: { status: "completed", src: "sediment://image" }, libraryFileId: "f1" };
assert.equal(favorite.t({ ...base, visible: false }), null);
assert.equal(favorite.t({ ...base, image: { status: "in_progress", src: "x" } }), null);
assert.equal(favorite.t({ ...base, image: { status: "completed", isPreview: true, src: "x" } }), null);
assert.equal(favorite.n({ ...base, libraryFileId: null }), null);
let toggled; let folder;
const button = favorite.n({ ...base, directoryId: "d1", onSelectFolder(value) { folder = value; }, async onToggleFavorite(saved, directoryId) { toggled = { saved, directoryId }; } });
assert.equal(button.props["data-generated-image-favorite"], true);
assert.equal(children(button)[0].props["aria-label"], "Save to library");
await children(button)[0].props.onClick();
assert.deepEqual(toggled, { saved: true, directoryId: "d1" });
children(button)[1].props.onClick();
assert.equal(folder, "d1");
assert.equal(favorite.t(base).type, "div");

// request-panel: 15
const request = await bundle("request-panel");
assert.deepEqual(Object.keys(request), ["i", "n", "r", "t"]);
assert.equal(request.i(), undefined);
assert.equal(request.n(), undefined);
const replies = [];
const unsupported = request.r({ conversationId: "c1", requestId: "r1", serverName: "Calendar", onReply(value) { replies.push(value); } });
assert.equal(unsupported.props["data-unsupported-request"], true);
assert.match(children(unsupported)[1].props.children, /Calendar/);
children(unsupported)[2].props.onClick();
children(unsupported)[3].props.onClick();
assert.deepEqual(replies, ["cancel", "decline"]);
let prevented = false; unsupported.props.onKeyDown({ key: "Escape", preventDefault() { prevented = true; } });
assert.equal(prevented, true);
assert.equal(replies.at(-1), "cancel");
let interacted = 0; let formReply;
const form = request.t({ conversationId: "c1", elicitation: { kind: "formElicitation", message: "Choose settings", schema: { fields: [{ id: "name", label: "Name", required: true }, { id: "enabled", type: "boolean" }] } }, onReply(reply, values) { formReply = { reply, values }; }, onUserInteraction() { interacted++; }, requestId: "r2" });
assert.equal(form.type, "form");
assert.equal(form.props["data-request-id"], "r2");
assert.equal(children(form)[0].props.children, "Choose settings");
children(form)[1].props.children[1].props.onChange({ currentTarget: { type: "text", value: "Ada" } });
children(form)[2].props.children[1].props.onChange({ currentTarget: { checked: true, type: "checkbox", value: "" } });
let submitPrevented = false; form.props.onSubmit({ preventDefault() { submitPrevented = true; } });
assert.equal(submitPrevented, true);
assert.equal(interacted, 1);
assert.deepEqual(formReply, { reply: "accept", values: { name: "Ada", enabled: true } });
assert.equal(request.t({ conversationId: "c", elicitation: { kind: "unsupported", message: "" }, requestId: "r" }).props["data-unsupported-request"], true);

console.log("57 conversation response surface cluster assertions passed");
