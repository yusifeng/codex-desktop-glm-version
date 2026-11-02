import assert from "node:assert/strict";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const usageState = {
  accountId: "account-1", userId: "user-1", currentAccountId: "account-1", imageRateLimit: undefined,
  family: new Map(), signal: new Map(), scopeSets: [], warningDismissals: [], shown: [], effects: [],
};
const React = { useEffect(effect) { usageState.effects.push(effect); return effect(); }, useRef(value) { return { current: value }; } };
globalThis.__usageCheckoutTest = {
  React, state: usageState,
  jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } },
};
const usageMocks = {
  "app-shared": `const s=globalThis.__usageCheckoutTest.state;export const I3=()=>globalThis.__usageCheckoutTest.jsx;export const e6=()=>globalThis.__usageCheckoutTest.React;export const ZI='app-scope';export const LX=()=>({set:(signal,key,value)=>{s.scopeSets.push({signal,key,value});s.family.set(signal+':'+JSON.stringify(key),value)}});export const HX=signal=>s.signal.get(signal);export const BX=(family,key)=>s.family.get(family+':'+JSON.stringify(key));export const FX=()=>{};export const QI=()=>{};`,
  "app-initial": `const s=globalThis.__usageCheckoutTest.state;export const kht='composer-scope',LN='UsageBannerPresentation',vZt='conversation-service',R8='conversation-usage',g0t='dismissed-banner',X8='image-context',P8='model-selection',Z8='luna-available',ugn='local';export const N6t=()=>({accountId:s.accountId,userId:s.userId});export const uht=()=>({data:{id:s.currentAccountId},isError:false,isLoading:false});export const u0t=()=>({data:s.imageRateLimit});export const w8=()=>({data:{models:[{model:'fallback',hidden:false}]}});export const _0t=(_scope,status,context)=>status.dismissalKey??(context?'dismiss:'+context:null);export const Fht=()=> 'thread-1';export const F8=(_scope,id,state)=>s.dismissedConversation={id,state};export const Min=c=>c.turn;export const k5=input=>input.authAccountId===input.currentAccountId;export const y0t=(_scope,key)=>s.shown.push(key);export const fgn=()=>{};export const M6t=()=>{},rht=()=>{},O5=()=>{},HZt=()=>{},Iin=()=>{},L8=()=>{},RN=()=>{},S8=()=>{},d0t=()=>{},v0t=()=>{},Zrn=()=>{};`,
  "app-primary": `const s=globalThis.__usageCheckoutTest.state;export const Dm='RateLimitBanner',Em='ModelLimitBanner',wm='presentation-context';export const Im=(_scope,warningKey,threshold)=>s.warningDismissals.push({warningKey,threshold});export const Fm=()=>{},Om=()=>{},Tm=()=>{};`,
};
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "usage-checkout-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: usageMocks[importPath] ?? (importPath === "app-shared" ? "export const I3=()=>globalThis.__usageCheckoutTest.jsx;" : "export {};"), loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function all(node, predicate) { const result = []; walk(node, value => { if (predicate(value)) result.push(value); }); return result; }
function text(node) { const values = []; const collect = value => { if (typeof value === "string") values.push(value); else if (value != null && typeof value === "object") { const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); } }; collect(node); return values.join(" "); }

assertReleaseOwner("usage");

// pricing plan: release-faithful owner
assertReleaseOwner("pricing-plan-comparison", [/^\/\/ @ts-nocheck/m, /export \{/]);

assertReleaseOwner("billing-form-options");

// checkout page: release-faithful owner
assertReleaseOwner("checkout-page-core", [/^\/\/ @ts-nocheck/m, /export \{/]);
console.log("usage, billing-form, and release-faithful checkout assertions passed");
