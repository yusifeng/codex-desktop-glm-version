import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__googleDriveOwnerTest = { attachments: [], events: [], opened: [], opening: [], requests: [], toasts: [] };
state.jsx = { Fragment: "Fragment", jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
state.toast = { danger: message => state.toasts.push(["danger", message]), success: message => state.toasts.push(["success", message]), warning: (message, options) => { state.toasts.push(["warning", message, options]); return { close() {} }; } };
state.scope = { get(signal) { return signal === "toast" ? state.toast : null; } };
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/open-in-google-drive-menu-item/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "drive-owner-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({ path: value.slice(8), namespace: "mock" }));
    build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => ({ loader: "js", contents:
      value === "app-shared" ? `
        export const I3=()=>globalThis.__googleDriveOwnerTest.jsx;export const II=path=>path.replace(/\\\\/g,'/').split('/').pop();export const HI=(...parts)=>parts.join('/');
        export const LX=()=>globalThis.__googleDriveOwnerTest.scope;export const HX=()=>({logProductEvent:(name,payload)=>globalThis.__googleDriveOwnerTest.events.push({name,payload})});export const n4=()=>({formatMessage:(descriptor,values)=>descriptor.defaultMessage.replace('{app}',values?.app??'{app}')});
        export const CL=()=>({});export const jf={Item:'MenuItem'};export const pk='toast';export const Qh='Spinner';export const Fj={CODEX_GOOGLE_WORKSPACE_RESOURCE_KIND_DOCUMENT:'document',CODEX_GOOGLE_WORKSPACE_RESOURCE_KIND_SPREADSHEET:'spreadsheet',CODEX_GOOGLE_WORKSPACE_RESOURCE_KIND_PRESENTATION:'presentation'};export const Pj='google_workspace_open';export const Mj={CODEX_GOOGLE_WORKSPACE_RESOURCE_CLICK_ACTION_UPLOAD_LOCAL_FILE:'upload_local_file'};
        export const FX=()=>{};export const K2=()=>{};export const wL=()=>{};export const QI=()=>{};export const RI=()=>{};export const fI=()=>{};export const ZI={};
      ` : value === "app-initial" ? `
        export const kht={};export const Cpn={};export const GEt=()=>({data:[{id:'connector_5f3c8c41a1e54ad7a76272c89e2554fa',isAccessible:true,isEnabled:true}],hardRefetchAppsList:async()=>[]});export const ofn=()=>true;
        export const N4t=()=>({availablePlugins:[],refetch:async()=>({availablePlugins:[]})});export const b6t=()=>true;export const c4t=()=>({data:[{displayName:'Google Drive',plugin:{id:'google-drive',installed:true,enabled:true}}],refetch:async()=>({data:[]})});
        export const U2=()=>({installPlugin(){}});export const Vwt=()=>({setPluginEnabled:async()=>{}});export const o_n=()=>{};export const Qln=async(type,input)=>{globalThis.__googleDriveOwnerTest.requests.push({type,input});return {contentsBase64:'AQID'}};export const Non=value=>Uint8Array.from(Buffer.from(value,'base64'));
        export const _dn={getInstance:()=>({fetch:async(path,init)=>{globalThis.__googleDriveOwnerTest.requests.push({path,init});return {json:async()=>({connector_result:{structuredContent:{url:'https://docs.google.com/document/d/abc.'},content:[]}})}}})};
        export const U3=(scope,update)=>update({mcpAppModelContextAttachments:globalThis.__googleDriveOwnerTest.attachments});export const kft=input=>globalThis.__googleDriveOwnerTest.opened.push(input);export const wft=()=>null;
      ` : value === "app-primary" ? "export const Zh={composer:'composer'};" : value === "app-connect-modal" ? "export const n=()=>{};export const t='ConnectModal';" : "export {};" }));
  } }],
});
const drive = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
drive.i();
assert.equal(drive.a("report.docx"), "document"); assert.equal(drive.a("SHEET.XLSX"), "spreadsheet"); assert.equal(drive.a("deck.pptx"), "presentation"); assert.equal(drive.a("notes.txt"), null);
const unsupported = drive.r({ path: "notes.txt" }); assert.equal(unsupported, null);
const fallback = drive.r({ path: "report.docx" }); assert.equal(fallback.props.children, "Export to Google Docs");
const item = drive.r({ analyticsClickSource: "menu", analyticsContext: { threadId: "t1" }, hostId: "local", isOpening: false, onOpeningChange: value => state.opening.push(value), path: "report.docx", targetType: "document", title: "Quarterly report" });
assert.equal(item.type, "MenuItem"); assert.equal(item.props.children, "Export to Google Docs"); assert.equal(item.props.disabled, false);
item.props.onSelect();
await new Promise(resolve => setTimeout(resolve, 0));
assert.deepEqual(state.opening, [true, false]);
assert.equal(state.requests[0].type, "read-file-binary"); assert.equal(state.requests[1].path, "/wham/apps/google_drive/upload");
assert.match(state.requests[1].init.headers["Content-Type"], /^multipart\/form-data; boundary=/); assert.equal(state.requests[1].init.body instanceof Uint8Array, true);
assert.equal(state.events[0].name, "google_workspace_open"); assert.equal(state.events[0].payload.threadId, "t1"); assert.equal(state.events[0].payload.resourceKind, "document");
assert.equal(state.attachments.length, 1); assert.match(state.attachments[0].text, /Quarterly report from report\.docx/); assert.match(state.attachments[0].text, /https:\/\/docs\.google\.com\/document\/d\/abc/);
assert.equal(state.opened[0].href, "https://docs.google.com/document/d/abc"); assert.equal(state.opened[0].initiator, "mcp_app_resource");
assert.equal(drive.n().props.role, "status"); assert.equal(drive.t({ app: { id: "drive" }, hostId: "local", onClose() {} }).type, "ConnectModal");
console.log("25 open in Google Drive owner assertions passed");
