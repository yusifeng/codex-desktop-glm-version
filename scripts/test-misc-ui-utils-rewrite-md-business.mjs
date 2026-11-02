import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { assertReleaseOwner } from './release-owner-test-helpers.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modules = [
  ['open-handler-391752d0848c.ts', 'browser-open-handler', ['BrowserOpenHandler']],
  ['shelf-364dc403e149.ts', 'conversation-followup-shelf', ['ConversationFollowupShelf']],
];
const dependencyAliases = new Map([['pepper-persona', 'persona'], ['settings-parental-presentation', 'presentation']]);
const dependencies = (source, expression) => [...source.matchAll(expression)].map((match) => dependencyAliases.get(match[1]) ?? match[1]);
let sourceAssertions = 0;
for (const [asset, semantic] of modules) {
  const original = fs.readFileSync(path.join(ROOT, 'src/webview/assets', asset), 'utf8');
  const restored = fs.readFileSync(path.join(ROOT, 'src/renderer', semantic, 'index.ts'), 'utf8');
  assert.deepEqual(dependencies(restored, /(?:from\s+|import\s*)['"]@rchunk\/([^'"]+)/g), dependencies(original, /from "\.\/([^"/]+)-[a-f0-9]{12}\.js"/g));
  assert.equal((restored.match(/import\(/g) || []).length, (original.match(/import\(/g) || []).length);
  assert.equal(/\bany\b|@ts-expect-error|@ts-nocheck/.test(restored), false);
  sourceAssertions += 3;
}

globalThis.__md = { capability: { isCapable: true, isLoading: false }, handlers: {}, queued: [], host: [], unavailable: 0, warning: 0, registered: null, opened: null, hooks: [], effects: [], hookIndex: 0, followupRequests: [] };
const jsx = "const render=(kind,props,key)=>typeof kind==='function'&&kind.name==='FollowupShelfView'?kind(props):({kind,props,key});export const I3=()=>({Fragment:Symbol.for('fragment'),jsx:render,jsxs:render});";
function mock(moduleName) {
  if (moduleName === '@rchunk/app-shared') return jsx + "const hook=(value)=>{const i=globalThis.__md.hookIndex++;if(!(i in globalThis.__md.hooks))globalThis.__md.hooks[i]=typeof value==='function'?value():value;return[globalThis.__md.hooks[i],next=>{globalThis.__md.hooks[i]=typeof next==='function'?next(globalThis.__md.hooks[i]):next}]};const effect=(callback,deps)=>{const i=globalThis.__md.hookIndex++;const old=globalThis.__md.effects[i];if(old==null||deps?.some((value,index)=>value!==old[index])){globalThis.__md.effects[i]=deps;callback()}};const ReactRuntime={Fragment:Symbol.for('fragment'),useRef:value=>({current:value}),useState:hook,useEffect:effect,useLayoutEffect:effect};export function e6(){return ReactRuntime}Object.assign(e6,ReactRuntime);export const $3=()=>({c:()=>[]});export const BX=(signal,value)=>signal==='conversation'?value:signal==='assistant'?'assistant-message':signal==='user'?'user-1':signal==='account'?'account-1':signal==='feature'?true:signal==='config'?{}:signal==='status'?'idle':signal==='hidden'?false:signal==='active'?{}:signal==='mapping'?{'assistant-message':{message:{author:{role:'assistant'},status:'finished_successfully',metadata:{conversation_followup_suggestions_eligible:true}}}}:signal==='branch'?{}:null;export const FX=()=>{};export const LX=()=>({});export const QI=()=>{};export const Yh='button';export const ZI={};export const d$='AnimatePresence';export const m4=(...values)=>values.filter(Boolean).join(' ');export const o$={div:'div',span:'span'};export const useCapability=()=>globalThis.__md.capability;export const useScope=()=>({get:()=>globalThis.__md.unsaved||new Set()});export const useHostMessage=(type,handler)=>{globalThis.__md.handlers[type]=handler};export const showUnavailable=()=>globalThis.__md.unavailable++;export const showUnsavedWarning=()=>globalThis.__md.warning++;export const dispatchHostMessage=(m)=>globalThis.__md.host.push(m);";
  if (moduleName === '@rchunk/app-initial') return "export const unsavedSettings={};export const queueOpen=(m)=>globalThis.__md.queued.push(m);export const Tz='context';export const ypn='resolved';export const mpn='intl';export const Mbt=(_s,v)=>globalThis.__md.visible=v;export const Wvt=(_s,f)=>f();export const IDt=(id,_c,o)=>(globalThis.__md.registered={id,options:o});export const Gvt=(_s,_r,o)=>(globalThis.__md.opened=o);export const qvt={tabById$:'tabs',activateTab:(_s,id)=>globalThis.__md.activated=id,closeTab:(_s,id)=>globalThis.__md.closed=id,updateTabState:()=>{},updateTab:()=>{}};export const $9t=value=>value;export const GVt='active';export const RVt='mapping';export const Vzt=()=>{};export const XVt='hidden';export const YVt='status';export const _un='user';export const jVt='assistant';export const mun='account';export const pD={};export const rJt={safePost:async(_path,input)=>{globalThis.__md.followupRequests.push(input);return globalThis.__md.followupPayload}};export const uHt=()=>{};export const wVt='conversation';export const xun='feature';export const zVt='branch';";
  if (moduleName === '@rchunk/app-primary') return "export const la='config';export const ua=()=>{};";
  if (moduleName === '@rchunk/thread-scroll-controller-context-value') return "export const n=()=>{};export const r=()=>({});";
  if (moduleName === '@rchunk/conversation-navigation-state') return "export const n={};export const t=()=>{};";
  return 'export const n=()=>{};export const t=()=>{};';
}
async function bundle(semantic) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, 'src/renderer', semantic, 'index.ts')], bundle: true, format: 'esm', platform: 'node', target: 'node22', write: false, logLevel: 'silent', plugins: [{ name: 'mocks', setup(build) { build.onResolve({ filter: /^@rchunk\// }, (args) => ({ path: args.path, namespace: 'mock' })); build.onLoad({ filter: /.*/, namespace: 'mock' }, (args) => ({ contents: mock(args.path), loader: 'js' })); } }] });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64') + '#' + semantic);
}

const loaded = new Map();
let runtimeAssertions = 0;
for (const [, semantic, exports] of modules) {
  const module = await bundle(semantic);
  loaded.set(semantic, module);
  assert.deepEqual(Object.keys(module).sort(), exports.slice().sort());
  runtimeAssertions++;
}

sourceAssertions += assertReleaseOwner('shopping-browse-tab-open');

const browser = loaded.get('browser-open-handler');
browser.BrowserOpenHandler();
globalThis.__md.handlers['toggle-browser-panel']({ open: true, url: 'https://example.com' });
assert.equal(globalThis.__md.queued.at(-1).source, 'manual');
assert.deepEqual(globalThis.__md.host.at(-1), { type: 'navigate-to-route', path: '/' });
globalThis.__md.capability = { isCapable: false, isLoading: false };
browser.BrowserOpenHandler(); globalThis.__md.handlers['toggle-browser-panel']({ url: 'https://example.com' });
assert.equal(globalThis.__md.unavailable, 1);
runtimeAssertions += 3;

const shelf = loaded.get('conversation-followup-shelf');
const resetShelfHooks = () => { globalThis.__md.hooks = []; globalThis.__md.effects = []; globalThis.__md.hookIndex = 0; };
const renderShelf = (props) => { globalThis.__md.hookIndex = 0; return shelf.ConversationFollowupShelf(props); };
resetShelfHooks();
assert.equal(shelf.ConversationFollowupShelf({ conversationId: 'c', suggestions: [] }), null);
resetShelfHooks();
const loading = renderShelf({ conversationId: 'c', loading: true });
assert.equal(loading.kind, 'AnimatePresence');
assert.equal(loading.props.children.props['aria-busy'], true);
assert.equal(loading.props.children.props.children[1].props.children.props.children.length, 3);
let chosen = -1;
resetShelfHooks();
const suggestions = renderShelf({ conversationId: 'c', visible: true, suggestions: [{ id: 's', title: 'Next?', body: 'Next?', tier: 't1' }], onSelect: (index) => { chosen = index; } });
suggestions.props.children.props.children[1].props.children.props.children[0].props.onClick();
assert.equal(chosen, 0);
resetShelfHooks();
globalThis.__md.followupPayload = { conversation_id: 'c', assistant_message_id: 'assistant-message', suggestions: [{ id: 'remote', title: 'Remote next?', body: 'Continue remotely', tier: 't2' }, { id: 'remote', title: 'Duplicate', body: 'Duplicate', tier: 't1' }, { id: '', title: 'Invalid', body: 'Invalid', tier: 't1' }] };
let submittedFollowup;
const remoteProps = { conversationId: 'c', ready: true, isSubmissionCurrent: () => true, async onSubmit(body, options) { submittedFollowup = { body, options }; return true; } };
assert.equal(renderShelf(remoteProps), null);
await new Promise(resolve => setTimeout(resolve, 0));
const remoteShelf = renderShelf(remoteProps);
assert.equal(globalThis.__md.followupRequests.length, 1);
assert.equal(remoteShelf.props.children.props.children[1].props.children.props.children.length, 1);
remoteShelf.props.children.props.children[1].props.children.props.children[0].props.onClick();
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(submittedFollowup.body, 'Continue remotely');
assert.equal(submittedFollowup.options.chosenSuggestion.originating_assistant_message_id, 'assistant-message');
runtimeAssertions += 9;

sourceAssertions += assertReleaseOwner('family-notification-surface');

delete globalThis.__md;
console.log(sourceAssertions + ' source assertions and ' + runtimeAssertions + ' runtime assertions passed');
