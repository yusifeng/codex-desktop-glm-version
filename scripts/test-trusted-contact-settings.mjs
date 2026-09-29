import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(ROOT, "src/renderer/trusted-contact-settings/index.ts"), "utf8");
const accessSignal = { name: "access" };
const toastSignal = { name: "toast" };
const state = {
  access: { status: "loading" },
  country: "US",
  deletes: [],
  enabledQuery: query({ isPending: true }),
  initialized: 0,
  invalidations: [],
  listQuery: query(),
  posts: [],
  postFailure: null,
  puts: [],
  refetches: [],
  toasts: [],
};
function query(overrides = {}) {
  return { data: undefined, isError: false, isPending: false, refetch: async () => undefined, ...overrides };
}

let hookCursor = 0;
let hookValues = [];
function clearHooks() { hookCursor = 0; hookValues = []; }
function beginRender() { hookCursor = 0; }
const React = {
  useState(initialValue) {
    const index = hookCursor++;
    if (!(index in hookValues)) hookValues[index] = typeof initialValue === "function" ? initialValue() : initialValue;
    return [hookValues[index], (next) => { hookValues[index] = typeof next === "function" ? next(hookValues[index]) : next; }];
  },
};
const jsx = {
  Fragment: "Fragment",
  jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
  jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; },
};
const queryClient = {
  invalidateQueries(options) { state.invalidations.push(options); return Promise.resolve(); },
  setQueryData(queryKey, value) {
    if (queryKey.at(-1) === "list") state.listQuery = query({ data: value });
  },
};
const toast = {
  danger(message, options) { state.toasts.push({ kind: "danger", message, options }); },
  success(message) { state.toasts.push({ kind: "success", message }); },
};
const scope = { get(signal) { return signal === toastSignal ? toast : undefined; } };
globalThis.window = { location: { assign(value) { state.mailto = value; } } };
globalThis.__trustedContactSettings = { React, accessSignal, jsx, queryClient, scope, state, toastSignal };

const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [
    "const runtime=globalThis.__trustedContactSettings;const state=runtime.state;",
    "export const $3=()=>{state.initialized+=1};export const FX=()=>{state.initialized+=1};export const gL=()=>{state.initialized+=1};export const rL=()=>{state.initialized+=1};",
    "export const e6=()=>runtime.React;export const I3=()=>runtime.jsx;export const ZI='scope';export const pk=runtime.toastSignal;",
    "export const HX=signal=>signal===runtime.accessSignal?state.access:undefined;export const LX=()=>runtime.scope;export const CL=()=>runtime.queryClient;",
    "export const _L=options=>options.queryKey.at(-1)==='enabled'?state.enabledQuery:state.listQuery;",
    "export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage});",
  ].join("\n"),
  "app-initial": [
    "const runtime=globalThis.__trustedContactSettings;const state=runtime.state;",
    "export const Xl=()=>{state.initialized+=1};export const cJt=()=>{state.initialized+=1};export const ifn=()=>{state.initialized+=1};export const su=()=>{state.initialized+=1};",
    "export const bL=runtime.accessSignal;export const cfn=()=>({client:{getContext:()=>({user:{country:state.country}})}});",
    "export const rJt={",
    "safePost:async(path,options)=>{state.posts.push({path,options});if(state.postFailure)throw state.postFailure;return {trusted_contact_id:'contact-new',status:'pending',...options.requestBody};},",
    "safePut:async(path,options)=>{state.puts.push({path,options});return {ok:true};},",
    "safeDelete:async(path,options)=>{state.deletes.push({path,options});return {ok:true};},",
    "};",
  ].join("\n"),
  client: [
    "const state=globalThis.__trustedContactSettings.state;",
    "export const r=()=>{state.initialized+=1};export const t=accountId=>({'ChatGPT-Account-ID':accountId});",
    "export const i=(userId,accountId)=>({enabled:{queryKey:['trusted-contact',userId,accountId,'enabled']},list:{queryKey:['trusted-contact',userId,accountId,'list']}});",
    "export const n=(contact,fallback)=>contact.email?{name:contact.name?.trim()||fallback,email:contact.email.trim(),phone_number:contact.phone_number??null,relationship:contact.relationship??null}:null;",
  ].join("\n"),
  "phone-number-input": "const state=globalThis.__trustedContactSettings.state;export const n=()=>{state.initialized+=1};export const t=props=>({type:'phone-input',props});",
  "trusted-contact-hero": "const state=globalThis.__trustedContactSettings.state;export const n=()=>{state.initialized+=1};export const t=props=>({type:'trusted-contact-hero',props});",
};

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/trusted-contact-settings/index.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [{
    name: "trusted-contact-settings-mocks",
    setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
      build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({ contents: mocks[moduleName] ?? "export {};", loader: "js" }));
    },
  }],
});
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));

function walk(value, result = []) {
  if (value == null || typeof value !== "object") return result;
  if (Array.isArray(value)) { for (const item of value) walk(item, result); return result; }
  result.push(value);
  walk(value.props?.children, result);
  return result;
}
function textContent(value) {
  if (value == null || typeof value === "boolean") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textContent).join(" ");
  return textContent(value.props?.children);
}
function settings() { beginRender(); return module.ChatGptTrustedContactSettings(); }
function enrollment(props) { beginRender(); return module.TrustedContactEnrollment(props); }
function byTestId(view, testId) { return walk(view).find((node) => node.props?.["data-testid"] === testId); }
function button(view, label) { return walk(view).find((node) => node.type === "button" && textContent(node) === label); }
async function flush() { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); }

assert.deepEqual(Object.keys(module).sort(), ["ChatGptTrustedContactSettings", "TrustedContactEnrollment"]);
assert.equal(state.initialized, 11);
assert.deepEqual(
  [...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^\"]+)"/g)].map((match) => match[1]),
  ["rolldown-runtime", "app-shared", "app-initial", "client", "phone-number-input", "trusted-contact-hero"],
);
assert.equal(/\b(?:appSharedChunk|appInitialChunk|clientChunk|phoneNumberInputChunk|trustedContactHeroChunk)\s*\./.test(source), false);
assert.equal(/\bany\b/.test(source), false);

assert.equal(settings(), null);
state.access = { status: "error" };
let view = settings();
assert.equal(walk(view).some((node) => node.props?.role === "alert"), true);
button(view, "Retry").props.onClick();
assert.deepEqual(state.invalidations.at(-1), { queryKey: ["accounts", "check"] });

state.access = { status: "allowed", accountId: "acct-1", userId: "user-1" };
state.enabledQuery = query({ isPending: true });
clearHooks();
view = settings();
assert.equal(textContent(view).includes("Loading trusted contact..."), true);

state.enabledQuery = query({ isError: true, refetch: async () => { state.refetches.push("enabled"); } });
clearHooks();
view = settings();
button(view, "Retry").props.onClick();
await flush();
assert.deepEqual(state.refetches, ["enabled"]);

state.enabledQuery = query({ data: false });
clearHooks();
view = settings();
assert.equal(textContent(view).includes("Trusted contacts aren't available for this account."), true);

state.country = "KR";
state.enabledQuery = query({ data: true });
state.listQuery = query({ data: { contacts: [] } });
clearHooks();
view = settings();
assert.equal(textContent(view).includes("must be 19+"), true);
byTestId(view, "add-trusted-contact-button").props.onClick();
view = settings();
assert.equal(walk(view).some((node) => node.type === "trusted-contact-hero"), true);
byTestId(view, "trusted-contact-intro-continue").props.onClick();
view = settings();
assert.equal(textContent(view).includes("Invite a trusted contact"), true);
assert.equal(walk(view).some((node) => node.type === "phone-input" && node.props.defaultCountry === "KR"), true);
byTestId(view, "trusted-contact-name-input").props.onChange({ target: { value: "Morgan" } });
byTestId(view, "trusted-contact-email-input").props.onChange({ target: { value: "not-an-email" } });
walk(view).find((node) => node.props?.id === "trusted-contact-consent-checkbox").props.onChange({ target: { checked: true } });
view = settings();
walk(view).find((node) => node.type === "form").props.onSubmit({ preventDefault() {} });
view = settings();
assert.equal(textContent(view).includes("Enter a valid email address"), true);

byTestId(view, "trusted-contact-email-input").props.onChange({ target: { value: "morgan@example.com" } });
walk(view).find((node) => node.type === "phone-input").props.onChange("+821012345678");
view = settings();
assert.equal(byTestId(view, "trusted-contact-save-button").props.disabled, false);
walk(view).find((node) => node.type === "form").props.onSubmit({ preventDefault() {} });
await flush();
view = settings();
assert.equal(state.posts.at(-1).path, "/trusted_contact");
assert.deepEqual(state.posts.at(-1).options.requestBody, { name: "Morgan", email: "morgan@example.com", phone_number: "+821012345678", relationship: null });
assert.equal(textContent(view).includes("Invitation sent"), true);
byTestId(view, "trusted-contact-invite-success-personal-note").props.onClick();
assert.equal(state.mailto.startsWith("mailto:morgan%40example.com"), true);

state.country = "US";
state.listQuery = query({ data: { contacts: [{ trusted_contact_id: "contact-1", status: "pending", name: "Taylor", email: "taylor@example.com", phone_number: null }] } });
clearHooks();
view = settings();
assert.equal(textContent(view).includes("Pending"), true);
byTestId(view, "resend-trusted-contact-button").props.onClick();
await flush();
assert.equal(state.puts.at(-1).path, "/trusted_contact/{trusted_contact_id}");
assert.deepEqual(state.toasts.at(-1), { kind: "success", message: "Invitation resent." });

view = settings();
byTestId(view, "cancel-trusted-contact-button").props.onClick();
view = settings();
assert.equal(textContent(view).includes("You’re about to remove Taylor"), true);
byTestId(view, "trusted-contact-remove-confirm-button").props.onClick();
await flush();
assert.equal(state.deletes.at(-1).options.parameters.path.trusted_contact_id, "contact-1");
assert.deepEqual(state.toasts.at(-1), { kind: "success", message: "Trusted contact removed" });

state.listQuery = query({ data: { contacts: [] } });
state.postFailure = { status: 400, errorCode: "trusted-contacts-blocked-email" };
clearHooks();
view = enrollment({ initialDialog: "invite", onClose() { state.closed = (state.closed ?? 0) + 1; } });
byTestId(view, "trusted-contact-name-input").props.onChange({ target: { value: "Casey" } });
byTestId(view, "trusted-contact-email-input").props.onChange({ target: { value: "casey@example.com" } });
walk(view).find((node) => node.props?.id === "trusted-contact-consent-checkbox").props.onChange({ target: { checked: true } });
view = enrollment({ initialDialog: "invite", onClose() { state.closed = (state.closed ?? 0) + 1; } });
walk(view).find((node) => node.type === "form").props.onSubmit({ preventDefault() {} });
await flush();
view = enrollment({ initialDialog: "invite", onClose() { state.closed = (state.closed ?? 0) + 1; } });
assert.equal(textContent(view).includes("Couldn’t add trusted contact"), true);
byTestId(view, "trusted-contact-unavailable-add-someone-else").props.onClick();
view = enrollment({ initialDialog: "invite" });
assert.equal(textContent(view).includes("Invite a trusted contact"), true);

console.log("31 trusted contact settings assertions passed");
