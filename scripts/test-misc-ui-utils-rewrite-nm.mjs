import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = "/Users/david/Workspace/ppio_github/chatgpt-desktop-src/app/webview/assets";
const modules = [
  ["image-1b6037d6ba79.js", "mermaid-image-rendering", ["a", "c", "d", "i", "l", "n", "o", "r", "s", "t", "u"]],
  ["workspace-auto-generated-name-aed2cf823284.js", "workspace-auto-generated-name", ["n", "t"]],
];
const aliases = new Map([
  ["mermaid-support", "chunk-ZW26E7AF"], ["mermaid-elk-renderer", "render-X3XFXER2"], ["mermaid-core", "mermaid.core"],
  ["chatgpt-image-upload-reminder-dialog-entry", "chatgpt-image-upload-reminder-dialog"],
  ["phone-metadata-argument-wrapper", "withMetadataArgument"], ["security-client", "client"], ["browser-mfa-session", "session"],
  ["checkout-confirm-latency", "confirm-latency"],
]);
const dependencies = (source, dynamic) => [...source.matchAll(dynamic ? /import\("(?:\.\/|@rchunk\/)([^"/]+?)(?:-[a-f0-9]{12}\.js)?"\)/g : /(?:from\s+|import\s*)"(?:\.\/|@rchunk\/)([^"/]+?)(?:-[a-f0-9]{12}\.js)?"/g)].map(match => aliases.get(match[1]) ?? match[1]);
let sourceAssertions = 0;
sourceAssertions += assertReleaseOwner("browser-mfa-sms-enrollment");
sourceAssertions += assertReleaseOwner("imagegen-request-form", [
  /chatgpt-image-upload-reminder-dialog-entry/,
  /library-file-picker-dialog/,
  /export \{ gn as ImagegenRequestForm \}/,
]);
for (const [asset, semantic] of modules) {
  const original = fs.readFileSync(path.join(SOURCE, asset), "utf8");
  const restored = fs.readFileSync(path.join(ROOT, "src/renderer", semantic, "index.ts"), "utf8");
  assert.deepEqual(dependencies(restored, false), dependencies(original, false));
  assert.deepEqual(dependencies(restored, true), dependencies(original, true));
  assert.equal(/\bany\b|@ts-expect-error|@ts-nocheck/.test(restored), false);
  sourceAssertions += 3;
}

globalThis.__nm = { mermaidInitializations: [], renderSources: [] };
const jsx = "export const I3=()=>({jsx:(kind,props,key)=>({kind,props,key}),jsxs:(kind,props,key)=>({kind,props,key})});";
function mock(name) {
  if (name === "@rchunk/app-shared") return jsx;
  if (name === "@rchunk/mermaid-core") return "const api={initialize(options){globalThis.__nm.mermaidInitializations.push(options)},async render(id,source){globalThis.__nm.renderSources.push(source);return {svg:'<svg id=\\\"'+id+'\\\"></svg>'}}};export default api;";
  if (name === "@rchunk/app-initial") return "export const M6t=()=>({accountId:'account',userId:'user'});export const i_n=()=>({pathname:'/settings',search:'?mfa_sms_enrollment=1&entry=security-recommendations&keep=1',hash:'#security'});";
  return "export const n=()=>{};export const t=()=>{};export const a=()=>{};export const r=()=>{};";
}
async function bundle(semantic) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", semantic, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mock", setup(build) { build.onResolve({ filter: /^@rchunk\// }, args => ({ path: args.path, namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, args => ({ contents: mock(args.path), loader: "js" })); } }] });
  return import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64") + "#" + semantic);
}
const loaded = new Map(); let runtimeAssertions = 0;
for (const [, semantic, expected] of modules) { const value = await bundle(semantic); loaded.set(semantic, value); assert.deepEqual(Object.keys(value).sort(), expected.slice().sort()); runtimeAssertions++; }

const mermaid = loaded.get("mermaid-image-rendering");
const light = mermaid.c({ chatTheme: "green", isDarkMode: false }); const dark = mermaid.c({ chatTheme: "green", isDarkMode: true });
assert.equal(light.primaryColor, "#d9f4e4"); assert.equal(dark.primaryColor, "#003716"); assert.equal(mermaid.s.background, "transparent");
globalThis.document = { getElementById: () => null, createElement: () => ({ inert: false, hidden: false, remove() {} }), body: { append() {} } };
assert.equal(await mermaid.u({ source: "%%{init: {securityLevel: 'loose'}}%%\ngraph TD; A-->B", themeVariables: light, isDarkMode: false, diagramId: "d" }), null);
assert.match(await mermaid.u({ source: "graph TD; A-->B\nclick A href", themeVariables: light, isDarkMode: false, diagramId: "d2" }), /<svg/); assert.deepEqual(globalThis.__nm.renderSources, ["graph TD; A-->B"]);
runtimeAssertions += 6;


const workspace = loaded.get("workspace-auto-generated-name"); const intl = { formatMessage: (descriptor, values) => values?.name ? descriptor.defaultMessage.replace("{name}", values.name) : descriptor.defaultMessage };
const personal = { data: {}, isPersonalAccount: () => true }; const team = { data: {}, isPersonalAccount: () => false };
assert.equal(workspace.t(intl, team, { email: "person@open-ai.example", email_domain_type: "enterprise" }), "Open Ai"); assert.equal(workspace.t(intl, personal, { name: "Avery" }), "Avery's Workspace"); assert.equal(workspace.t(intl, { data: { name: "Research" }, isPersonalAccount: () => false }, null), "Research"); assert.equal(workspace.t(intl, team, null), "Untitled Workspace");
runtimeAssertions += 4;

delete globalThis.__nm;
console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
