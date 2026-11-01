import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__openConversationFilesOwnerTest = { definitions: [], opens: [], pages: [], queryFactories: [], derivedFactories: [] };
state.jsx = { jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/open-conversation-files/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "conversation-files-owner-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({ path: value.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => ({ loader: "js", contents:
      value === "app-shared" ? `
        export const I3=()=>globalThis.__openConversationFilesOwnerTest.jsx;export const QI=()=>{};export const ZI={};export const Rv='FilesIcon';
        export const QX=(scope,factory)=>{const signal={kind:'query',factory};globalThis.__openConversationFilesOwnerTest.queryFactories.push(signal);return signal};
        export const rZ=(scope,factory)=>{const signal={kind:'derived',factory};globalThis.__openConversationFilesOwnerTest.derivedFactories.push(signal);return signal};
        export const HX=()=>null;export const BX=()=>({data:[],refetch:async()=>{}});export const LX=()=>({});
      ` : value === "app-initial" ? `
        export const Sun=()=>{};export const cJt=()=>{};export const Wvt=()=>{};export const FDt=()=>{};export const mun='account';export const _un='user';export const mpn='intl';export const $en={};export const RVt='mapping';export const jVt='current-node';
        export const IDt=(kind,component,options)=>{const definition={kind,component,...options};globalThis.__openConversationFilesOwnerTest.definitions.push(definition);return definition};
        export const Gvt=(scope,definition,tab)=>globalThis.__openConversationFilesOwnerTest.opens.push({scope,definition,tab});export const gvt=()=> 'bottom';
        export const rJt={safeGet:async(path,options)=>{globalThis.__openConversationFilesOwnerTest.pages.push({path,options});return options.parameters.query.cursor==null?{items:[{file_id:'file-1',file_name:'one.pdf',mime_type:'application/pdf'}],cursor:'next'}:{items:[{file_id:'file-1',file_name:'duplicate.pdf'},{file_id:'file-2',file_name:'two.txt',origination_thread_id:'server-1'}],cursor:null}}};
      ` : "export {};" }));
  } }],
});
const files = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
assert.equal(state.definitions.length, 1);
assert.equal(state.definitions[0].kind, "chatgpt-conversation-files");
assert.equal(state.definitions[0].getId(), "chatgpt-conversation-files");
assert.equal(state.definitions[0].isAvailable({ value: { routeKind: "chatgpt-thread" } }), true);
assert.equal(state.definitions[0].isAvailable({ value: { routeKind: "local-thread" } }), false);

const scope = { get(signal) { if (signal === "account") return "account-1"; if (signal === "user") return "user-1"; if (signal === "intl") return { formatMessage: descriptor => descriptor.defaultMessage }; } };
files.openConversationFiles(scope, { conversationId: "client-1", serverConversationId: "server-1" });
assert.equal(state.opens.length, 1);
assert.equal(state.opens[0].tab.id, "chatgpt-conversation-files");
assert.equal(state.opens[0].tab.target, "bottom");
assert.equal(state.opens[0].tab.title, "Files in chat");
assert.equal(state.opens[0].tab.props.accountId, "account-1");
assert.equal(state.opens[0].tab.props.userId, "user-1");

const query = state.queryFactories[0].factory({ accountId: "account-1", userId: "user-1", serverConversationId: "server-1" }, { get: signal => signal === "account" ? "account-1" : "user-1" });
assert.equal(query.enabled, true);
assert.deepEqual(query.queryKey, ["conversation-files", "account-1", "user-1", "server-1"]);
const remote = await query.queryFn({ signal: new AbortController().signal });
assert.equal(state.pages.length, 2);
assert.deepEqual(remote.map(file => file.file_id), ["file-1", "file-2"]);
assert.equal(remote[0].file_name, "one.pdf");

const querySignal = state.queryFactories[0];
const items = state.derivedFactories[0].factory({ conversationId: "client-1", serverConversationId: "server-1" }, { get(signal) {
  if (signal === querySignal) return { data: remote };
  if (signal === "mapping") return { m1: { id: "message-1", author: { role: "user" }, recipient: "all", content: { content_type: "text" }, metadata: { attachments: [{ file_id: "file-3", name: "three.docx", mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }] } } };
  return null;
} });
assert.deepEqual(items.map(item => item.file.name), ["one.pdf", "two.txt", "three.docx"]);
assert.equal(items[2].file.messageId, "message-1");

let legacyPanel;
files.openConversationFiles({ accountId: "legacy-account", userId: "legacy-user", openPanel(panel) { legacyPanel = panel; } }, { conversationId: "legacy-conversation" });
assert.equal(legacyPanel.id, "chatgpt-conversation-files");
assert.equal(legacyPanel.props.accountId, "legacy-account");
assert.equal(legacyPanel.props.userId, "legacy-user");
console.log("25 open conversation files owner assertions passed");
