import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__userMessageTest = { analytics: [], copied: [], effects: [], initialized: [], reads: [], submitted: [], writes: [] };
state.jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
state.react = {
  useEffect(effect) { state.effects.push(effect()); },
  useEffectEvent(callback) { return callback; },
  useLayoutEffect(effect) { state.effects.push(effect()); },
  useRef(value) { return { current: value }; },
  useState(value) { let current = typeof value === "function" ? value() : value; return [current, (next) => { current = typeof next === "function" ? next(current) : next; }]; },
};
state.scope = { value: { conversationId: "conversation-1" }, set(...args) { state.writes.push(args); } };
state.intl = {
  formatDate(value, options) { return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(value); },
  formatMessage(descriptor, values) { return descriptor.defaultMessage.replace("{count}", String(values?.count ?? "")); },
};
const marker = (name) => `()=>globalThis.__userMessageTest.initialized.push(${JSON.stringify(name)})`;
const modules = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    `export const $3=${marker("runtime")}; export const FX=${marker("signals")}; export const K2=${marker("spring")}; export const c_=${marker("hook-ui")}; export const h4=${marker("intl")}; export const Xm=${marker("telemetry")}; export const Zh=${marker("shared-ui")}; export const tm=${marker("message-state")}; export const of=${marker("button-icons")}; export const Ru=${marker("reaction")}; export const wL=${marker("composer")}; export const ys=${marker("composer-hooks")};`,
    `export const I3=()=>globalThis.__userMessageTest.jsx; export const e6=()=>globalThis.__userMessageTest.react;`,
    `export const Y2="FormattedMessage"; export const Yh="Button"; export const o_="Tooltip";`,
    `export const m4=(...values)=>values.flat().filter(Boolean).join(" "); export const n4=()=>globalThis.__userMessageTest.intl;`,
    `export const LX=()=>globalThis.__userMessageTest.scope; export const HX=value=>value==null?globalThis.__userMessageTest.account:{submitCodexAnalyticsEvent:event=>globalThis.__userMessageTest.analytics.push(event)};`,
    `export const BX=(signal,key)=>{globalThis.__userMessageTest.reads.push([signal,key]);return signal?.id==="capability"?{isCapable:true}:signal?.id==="edit-state"?globalThis.__userMessageTest.editDraft:signal?.id==="aeon"?globalThis.__userMessageTest.aeon:null}; export const oZ=()=>({id:"edit-state"});`,
    `export const iz={composerEnterBehavior:"enter",composerPlainTextMode:"plain"}; export const vs="MentionPopover";`,
    `export const Ym=async text=>{globalThis.__userMessageTest.copied.push(text);return true};`,
  ].join("\n"),
  "app-initial": [
    `export const C=${marker("initial")}; export const $en={id:"scope"}; export const Xet={id:"capability"};`,
    `export const FY="MessageRenderer"; export const gat="CollapsedMessage"; export const rtn=value=>value?.conversationId;`,
    `export const Zet=${marker("body-state")}; export const itn=${marker("body-query")}; export const IY=${marker("body-capability")}; export const _at=${marker("directives")};`,
    `export const Fcn=${marker("hook-context")}; export const OZ=${marker("user-message")}; export const Vhn=${marker("react-cache")}; export const ypn=${marker("analytics-init")}; export const urn=${marker("account-init")};`,
    `export const Cpn={id:"analytics"}; export const Bhn=value=>value; export const lrn=value=>value;`,
    `export const ttn=value=>value?.conversationId; export const Kcn=value=>value; export const m6=()=>false; export const p6=()=>false; export const B5t=value=>value;`,
    `export const EZ=(message,options)=>{const controller={options,view:{dom:{role:"editor"},isDestroyed:false},setEnterBehavior:value=>controller.enterBehavior=value,setPlainTextMode:value=>controller.plainTextMode=value,destroy:()=>controller.destroyed=true,getPersistedText:()=>message,getPlainText:()=>message,getText:()=>"**"+message+"**",hasMarkdownFormatting:()=>globalThis.__userMessageTest.markdown};globalThis.__userMessageTest.controller=controller;return controller};`,
    `export const R=()=>({ui:{active:false},addMention(){},closeAutocomplete(){},setSelectedMention(){},handleMentionEvent(){}}); export const NX=()=>({ui:{active:false},handleMentionEvent(){}}); export const i8=(view,listener)=>{globalThis.__userMessageTest.draftListener=listener;return ()=>{}}; export const kZ=(view,keys)=>{globalThis.__userMessageTest.keys=keys;return ()=>{}};`,
    `export const IX="FileAutocomplete"; export const a="PluginAutocomplete"; export const z=()=>{}; export const mZ="ComposerEditor"; export const o=${marker("current-account")}; export const R5t=${marker("composer-config")}; export const g6=${marker("autocomplete")}; export const L=${marker("composer-editor")}; export const jX=${marker("mentions")}; export const Vcn=${marker("plugins")};`,
  ].join("\n"),
  "app-primary": `export const d=${marker("primary")}; export const Rn=${marker("primary-state")}; export const zn={id:"aeon"}; export const _l=()=>"bottom"; export const vl="MentionResults"; export const bl=${marker("composer-primary")}; export const gl=${marker("composer-files")};`,
  "hooks": `export const n=${marker("hooks")}; export const t="HooksIcon";`,
  "hooks-settings-copy": `export const a=${marker("hook-copy")}; export const n=value=>value;`,
  "hooks-settings-model": `export const f=()=>"user"; export const p=${marker("hook-model")};`,
  "plan-implementation-request": `export const n=${marker("plan-init")}; export const r=()=>false;`,
  "timestamps": `export const a=${marker("timestamps")}; export const t=(date,now)=>{const d=new Date(date);const n=now??new Date();return Math.round((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(n.getFullYear(),n.getMonth(),n.getDate()))/86400000)};`,
};
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/user-message/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "user-message-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: specifier }) => ({ path: specifier.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: name }) => ({ contents: modules[name] ?? "export default ()=>{};", loader: "js" }));
  } }],
});
const mod = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
assert.deepEqual(Object.keys(mod).sort(), ["a", "c", "d", "f", "i", "l", "n", "o", "r", "s", "t", "u"]);

const role = mod.d({ speaker: "user" });
assert.equal(role.type, "h4");
assert.equal(role.props.className, "sr-only m-0 select-none");
assert.equal(role.props.children.props.defaultMessage, "You said:");
const timestamp = mod.r({ nowMs: Date.UTC(2026, 10, 1, 12), sentAtMs: Date.UTC(2026, 10, 1, 10) });
assert.equal(timestamp.type, "span");
assert.match(timestamp.props.className, /text-tertiary/);
const body = mod.s({ collapsedLineCount: 3, cwd: "/repo", hostId: "local", text: "hello" });
assert.equal(body.type, "CollapsedMessage");
assert.equal(body.props.children.type, "MessageRenderer");
assert.equal(body.props.children.props.externalLinkContextMenuConversationId, "conversation-1");
const hookBadge = mod.l({ stats: { count: 2, entries: [{ kind: "feedback", text: "ok" }] } });
assert.equal(hookBadge.type, "Tooltip");

const tree = mod.t({
  commentCount: 2, hookStats: { count: 1 }, message: "Hello world", onEditMessage: async () => {},
  referencesPriorConversation: true, sentAtMs: Date.UTC(2026, 10, 1, 10), threadId: "thread-1", turnId: "turn-1",
});
assert.equal(tree.type, "div");
const all = [];
const walk = (node) => { if (node == null || typeof node !== "object") return; all.push(node); const children=node.props?.children; (Array.isArray(children)?children.flat(Infinity):[children]).forEach(walk); };
walk(tree);
assert.equal(all.some(node => node.props?.["data-user-message-bubble"] === true), true);
assert.equal(all.some(node => node.props?.defaultMessage === "References prior conversation"), true);
assert.equal(all.some(node => node.props?.id === "codex.userMessage.commentCount" && node.props?.values?.count === 2), true);
const copyButton = all.find(node => node.type === "Button" && node.props?.["aria-label"] === "Copy message");
assert.match(copyButton.props.className, /focus-visible:ring-2/);
assert.equal(all.some(node => String(node.props?.className).includes("group-hover:opacity-100") && node.type === "span"), true);
copyButton.props.onClick();
await Promise.resolve();
assert.deepEqual(state.copied, ["Hello world"]);
assert.equal(state.analytics[0].action, "copy");
const editButton = all.find(node => node.type === "Button" && node.props?.["aria-label"] === "Edit message");
editButton.props.onClick();
assert.equal(state.analytics[1].action, "edit");
assert.deepEqual(state.writes.at(-1), [{ id: "edit-state" }, "turn-1", "Hello world"]);

state.editDraft = "rich draft";
state.markdown = true;
const editorTree = mod.t({
  cwd: "/repo", editMessageFormat: "markdown", hostId: "local", message: "old",
  onEditMessage: async (message, format) => state.submitted.push([message, format]), threadId: "thread-1", turnId: "turn-1",
});
const editorNodes = [];
const walkEditor = (node) => { if (node == null || typeof node !== "object") return; editorNodes.push(node); const children=node.props?.children; (Array.isArray(children)?children.flat(Infinity):[children]).forEach(walkEditor); };
walkEditor(editorTree);
assert.equal(editorNodes.some(node => node.type === "ComposerEditor"), true);
assert.equal(state.controller.options.enableRichText, true);
assert.equal(state.controller.options.defaultTextKind, "prompt");
assert.deepEqual(state.controller.view.dom, { role: "editor" });
const editorForm = editorNodes.find(node => node.type === "form");
editorForm.props.onSubmit({ preventDefault() {} });
await new Promise(resolve => setTimeout(resolve, 0));
assert.deepEqual(state.submitted, [["**rich draft**", "markdown"]]);
let cancelled = false;
state.keys.Escape({ defaultPrevented: false, preventDefault() { cancelled = true; } });
assert.equal(cancelled, true);

state.editDraft = null;
state.aeon = true;
state.account = { accountUserId: "me", email: "me@example.com" };
const aeonTree = mod.t({ additionalActions: "extra", message: "Aeon", messageHeader: "header", messageReaction: "👍", senderAccountUserId: "other", turnId: "turn-a" });
const aeonNodes = [];
const walkAeon = (node) => { if (node == null || typeof node !== "object") return; aeonNodes.push(node); const children=node.props?.children; (Array.isArray(children)?children.flat(Infinity):[children]).forEach(walkAeon); };
walkAeon(aeonTree);
assert.equal(aeonNodes.some(node => String(node.props?.className).includes("grid-cols-[auto_minmax(0,max-content)]")), true);
assert.equal(aeonNodes.some(node => String(node.props?.className).includes("_otherUserMessage_149ln_35")), true);
assert.equal(aeonNodes.some(node => String(node.props?.className).includes("_compactMessageReaction_149ln_7")), true);
assert.equal(aeonNodes.some(node => String(node.props?.className).includes("[&_button]:cursor-default")), true);

state.aeon = false;
const compactTree = mod.t({ compactActions: true, message: "Compact", turnId: "turn-c" });
const compactNodes = [];
const walkCompact = (node) => { if (node == null || typeof node !== "object") return; compactNodes.push(node); const children=node.props?.children; (Array.isArray(children)?children.flat(Infinity):[children]).forEach(walkCompact); };
walkCompact(compactTree);
assert.equal(compactNodes.some(node => String(node.props?.className).includes("turn-action-controls")), true);

const attachmentOnlyTree = mod.t({ hasExternalAttachments: true, message: "", turnId: "turn-empty" });
const attachmentNodes = [];
const walkAttachment = (node) => { if (node == null || typeof node !== "object") return; attachmentNodes.push(node); const children=node.props?.children; (Array.isArray(children)?children.flat(Infinity):[children]).forEach(walkAttachment); };
walkAttachment(attachmentOnlyTree);
assert.equal(attachmentNodes.some(node => node.props?.["data-user-message-bubble"] === true), false);

const hiddenMetadataTree = mod.t({ compactActions: true, hideActions: true, message: "No metadata", turnId: "turn-hidden" });
const hiddenMetadataNodes = [];
const walkHiddenMetadata = (node) => { if (node == null || typeof node !== "object") return; hiddenMetadataNodes.push(node); const children=node.props?.children; (Array.isArray(children)?children.flat(Infinity):[children]).forEach(walkHiddenMetadata); };
walkHiddenMetadata(hiddenMetadataTree);
assert.equal(hiddenMetadataNodes.some(node => String(node.props?.className).includes("flex-row-reverse") && String(node.props?.className).includes("hidden")), true);

state.reads.length = 0;
mod.t({ message: "Optimistic message" });
assert.equal(state.reads.some(([signal, key]) => signal?.id === "edit-state" && key === undefined), true);

mod.f(); mod.c(); mod.i(); mod.u(); mod.n();
for (const dependency of ["analytics-init", "body-state", "composer", "hook-context", "plan-init", "primary-state", "react-cache", "timestamps"]) assert.equal(state.initialized.includes(dependency), true);
console.log("user message restored component tests passed");
