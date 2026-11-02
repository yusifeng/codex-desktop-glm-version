import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { CHUNKS, IMPORT_ALIASES } from "./renderer-chunk-manifest.mjs";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  ASSET = path.join(ROOT, "src/webview/assets");
assert.equal(IMPORT_ALIASES.proxy, CHUNKS["motion-proxy-runtime"]);
const modules = [
  ["system-of-equations-a765decfc54f.js", "system-of-equations", ["n", "t"]],
  [
    "template-224b997c2ad7.js",
    "learning-model-inverse-trigonometric-function-template",
    ["a", "i", "n", "r", "t"],
  ],
  [
    "template-9f62da8bf8e9.js",
    "learning-model-rectangular-prism-volume-template",
    ["a", "c", "d", "f", "i", "l", "m", "n", "o", "p", "r", "s", "t", "u"],
  ],
  [
    "template-bf8ec7576e3e.js",
    "learning-model-distance-between-points-template",
    ["n", "r", "t"],
  ],
];
const deps = (s, r) => [...s.matchAll(r)].map((m) => m[1]);
let sourceAssertions = 0;
for (const [a, d] of modules) {
  const o = fs.readFileSync(
      path.join(ASSET, a.replace(/\.js$/, ".ts")),
      "utf8",
    ),
    r = fs.readFileSync(path.join(ROOT, "src/renderer", d, "index.ts"), "utf8");
  assert.deepEqual(
    deps(r, /(?:from\s+|import\s*)["']@rchunk\/([^"']+)/g),
    deps(o, /from "\.\/([^"/]+)-[a-f0-9]{12}\.js"/g),
  );
  assert.equal(
    (r.match(/import\(/g) || []).length,
    (o.match(/import\(/g) || []).length,
  );
  assert.equal(/\bany\b|@ts-expect-error|@ts-nocheck/.test(r), false);
  sourceAssertions += 3;
}
sourceAssertions += assertReleaseOwner("sort-bar-visualization");
sourceAssertions += assertReleaseOwner("svg-arrow");
sourceAssertions += assertReleaseOwner("text-file-thumbnail");
sourceAssertions += assertReleaseOwner("registered-subagents-thumbnail");
sourceAssertions += assertReleaseOwner("file-image-thumbnail");
globalThis.__na = {
  cache: Array(100).fill(Symbol.for("react.memo_cache_sentinel")),
  agents: [],
  hooks: [],
  hookIndex: 0,
  effects: [],
  lifecycle: [],
  beaconState: {
    beacon: { beacon_id: "beacon", action_items: ["share"] },
    eventMetadata: { conversationId: "c", messageId: "m" },
    productExperience: "home",
  },
};
const jsx = `const render=(c,p,k)=>typeof c==='function'&&(c.name==='ConversationBeaconSurface'||c.name==='BeaconPresentationLifecycle')?c(p):({kind:typeof c==='string'?c:(c.displayName||c.name),props:p,key:k});export const I3=()=>({Fragment:Symbol.for('fragment'),jsx:render,jsxs:render});`;
function mock(p) {
  if (p === "@rchunk/app-shared")
    return (
      jsx +
      `export const $3=()=>({c:()=>globalThis.__na.cache});export const K2=()=>{};export const h4=()=>{};export const m4=(...v)=>v.filter(Boolean).join(' ');export function Y2(){}Y2.displayName='FormattedMessage';export const FX=()=>{};export const QI=()=>{};export const LX=()=>({queryClient:{}});export const ZI={};const ReactRuntime={Fragment:Symbol.for('fragment'),useRef:value=>({current:value}),useState(value){const i=globalThis.__na.hookIndex++;if(!(i in globalThis.__na.hooks))globalThis.__na.hooks[i]=typeof value==='function'?value():value;return[globalThis.__na.hooks[i],next=>{globalThis.__na.hooks[i]=typeof next==='function'?next(globalThis.__na.hooks[i]):next}]},useEffect(callback,deps){const i=globalThis.__na.hookIndex++;const old=globalThis.__na.effects[i];if(old==null||deps?.some((v,j)=>v!==old[j])){globalThis.__na.effects[i]=deps;callback()}}};export function e6(){return ReactRuntime}Object.assign(e6,ReactRuntime);export const BX=(signal,...parameters)=>signal==='primary'?parameters[0]:signal==='state'?globalThis.__na.beaconState:signal==='message'?'m':signal==='work'?null:signal==='share-eligible'?true:globalThis.__na.agents;export const HX=()=>false;export const oZ=()=>({});export const LS=()=>null;export const lw=()=>{};export const $h=()=>{};export const BO=()=>({});export const II=p=>p.split('.').pop();export const RI=()=>{};export const gg=()=>{};export const hg=p=>p;export const pg={};export const mg=()=>function Icon(){};export const n4=()=> 'en';export function iS(){}iS.displayName='ImageIcon';`
    );
  if (p === "@rchunk/app-initial")
    return `export function Xd(){}Xd.displayName='Thumbnail';export const Zd=()=>{};export const HZt=()=>{};export const cet={};const initLet=()=>{};export {initLet as let};export const vZt={};export const aqt=x=>'route:'+x;export const uHt=()=>{};export const ANt=()=>{};export const Gzt=()=>false;export const JNt=()=>{};export const QNt=()=>false;export const TNt=()=>false;export class UNt{shouldSuppressBeaconUI(){return false}}export const Vzt=()=>{};export const YNt='claims';export const YVt='work';export const ZNt='suppression';export const _Nt=()=>globalThis.__na.lifecycle.push('unsupported');export const dHt=()=>false;export const fNt='state';export const gNt=()=>globalThis.__na.lifecycle.push('complete');export const hNt=()=>{};export const jNt=()=>globalThis.__na.lifecycle.push('closed');export const jVt='message';export const mNt=()=>{globalThis.__na.lifecycle.push('dismiss');return true};export const oqt=()=>{};export const wNt=()=>true;export const wVt='primary';export const J9t=p=>p.endsWith('.ts')?'typescript':null;export const Jxn=()=>{};export const X9t=p=>p.endsWith('.md');export const Y9t=()=>{};export const qxn=[{id:'markdown',name:'Markdown'},{id:'typescript',name:'TypeScript'}];export const zGt=(_c,s)=>s.startsWith('resolved:')?s:null;export const H3t=(s,h)=>'host:'+h+':'+s;export const U3t=()=>{};export const HGt=()=>{};`;
  if (p === "@rchunk/adaptive-slider-field")
    return `export const n=()=>{};export const i=(v,a)=>typeof v==='number'?Math.min(Math.max(v,a.min),a.max):a.defaultValue;export const t=(v,c)=>({min:Math.min(c.baseMin,v),max:Math.max(c.baseMax,v),step:c.step});export const r=({bounds,control,value})=>bounds&&value>=bounds.min&&value<=bounds.max?bounds:t(value,control);`;
  if (p === "@rchunk/button")
    return `export function n(){}n.displayName='ButtonGroup';export function t(){}t.displayName='Button';export const r=()=>{};`;
  if (p === "@rchunk/input-selector-group")
    return `export const r=()=>{};export function t(){}t.displayName='InputSelector';`;
  if (p === "@rchunk/proxy")
    return `export const n=()=>{};export const t={div:'motion.div'};`;
  if (p === "@rchunk/use-reduced-motion")
    return `export const n=()=>false;export const t=()=>{};`;
  if (p === "@rchunk/subagent-row")
    return `export const n=()=>{};export function t(){}t.displayName='SubagentRow';`;
  if (p === "@rchunk/registered")
    return `export const n=()=>{};export function t(){}t.displayName='RegisteredConversation';`;
  if (p === "@rchunk/share-conversation-action")
    return `export const o=x=>({kind:'regenerate',...x});export const s=()=>{};export const a=()=>{};export const i=value=>Array.isArray(value)&&value.length>0;export const n=input=>({kind:'share',...input});export const r=input=>input;export const t='share-eligible';`;
  if (p === "@rchunk/announcement-modal-source-bridge")
    return `export const n=()=>{};export function t(){}t.displayName='Announcement';`;
  if (p === "@rchunk/codex-app-home-beacon-announcement")
    return `export const r=()=>{};export function t(){}t.displayName='HomeBeacon';`;
  if (p === "@rchunk/chatgpt-temporary-chat-ui")
    return `export const i=()=>{};export function n(){}n.displayName='TemporaryChat';`;
  if (p === "@rchunk/learning-block-katex")
    return `export const n=()=>{};export function t(){}t.displayName='Katex';`;
  if (p === "@rchunk/learning-block-stroke")
    return `export const i=()=>{};export const n='white';export const s=()=>({x:1,y:2,rotation:0});`;
  if (p === "@rchunk/format-bytes")
    return `export const t=(b,l)=>b+' bytes '+l;`;
  return `export const n=()=>{};export const r=()=>{};export const a=()=>{};export const o=()=>{};`;
}
async function bundle(d) {
  const r = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", d, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [
      {
        name: "m",
        setup(b) {
          b.onResolve({ filter: /^@rchunk\// }, (x) => ({
            path: x.path,
            namespace: "m",
          }));
          b.onLoad({ filter: /.*/, namespace: "m" }, (x) => ({
            contents: mock(x.path),
            loader: "js",
          }));
        },
      },
    ],
  });
  return import(
    "data:text/javascript;base64," +
      Buffer.from(r.outputFiles[0].text).toString("base64") +
      "#" +
      d
  );
}
const L = new Map();
let runtimeAssertions = 0;
for (const [, d, e] of modules) {
  const m = await bundle(d);
  L.set(d, m);
  assert.deepEqual(Object.keys(m).sort(), e.slice().sort());
  runtimeAssertions++;
}
const inv = L.get("learning-model-inverse-trigonometric-function-template");
inv.i();
assert.deepEqual(inv.a("arccos(0.5)"), { functionName: "arccos", value: 0.5 });
assert.equal(inv.n("arctan"), "y/x");
runtimeAssertions += 2;
const dist = L.get("learning-model-distance-between-points-template");
dist.n();
assert.deepEqual(dist.r("(1,2),(3,4)"), { x1: 1, y1: 2, x2: 3, y2: 4 });
runtimeAssertions++;
const prism = L.get("learning-model-rectangular-prism-volume-template");
prism.d();
assert.equal(prism.m.type, "RECTANGULAR_PRISM_VOLUME");
assert.equal(prism.f({ length: 12, width: 3, height: 2 }).length, 10);
runtimeAssertions += 2;
const sys = L.get("system-of-equations");
sys.n();
assert.deepEqual(sys.t("y=x+1\\\\y=2"), ["y=x+1", "y=2"]);
assert.equal(sys.t("y=1\\\\y=2"), null);
runtimeAssertions += 2;
sourceAssertions += assertReleaseOwner("conversation-beacon-surfaces");
delete globalThis.__na;
console.log(
  sourceAssertions +
    " source assertions and " +
    runtimeAssertions +
    " runtime assertions passed",
);
