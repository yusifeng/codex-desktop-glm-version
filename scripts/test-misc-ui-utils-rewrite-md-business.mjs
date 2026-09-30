import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modules = [
  ['open-ba3f56946b08.ts', 'shopping-browse-tab-open', ['openShoppingBrowseTab']],
  ['open-handler-391752d0848c.ts', 'browser-open-handler', ['BrowserOpenHandler']],
  ['shelf-364dc403e149.ts', 'conversation-followup-shelf', ['ConversationFollowupShelf']],
  ['surface-7956345c70dd.ts', 'family-notification-surface', ['FamilyNotification']],
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

globalThis.__md = { capability: { isCapable: true, isLoading: false }, handlers: {}, queued: [], host: [], unavailable: 0, warning: 0, registered: null, opened: null };
const jsx = "export const I3=()=>({jsx:(kind,props,key)=>({kind,props,key}),jsxs:(kind,props,key)=>({kind,props,key})});";
function mock(moduleName) {
  if (moduleName === '@rchunk/app-shared') return jsx + "export const useCapability=()=>globalThis.__md.capability;export const useScope=()=>({get:()=>globalThis.__md.unsaved||new Set()});export const useHostMessage=(type,handler)=>{globalThis.__md.handlers[type]=handler};export const showUnavailable=()=>globalThis.__md.unavailable++;export const showUnsavedWarning=()=>globalThis.__md.warning++;export const dispatchHostMessage=(m)=>globalThis.__md.host.push(m);";
  if (moduleName === '@rchunk/app-initial') return "export const unsavedSettings={};export const queueOpen=(m)=>globalThis.__md.queued.push(m);export const Tz='context';export const ypn='resolved';export const mpn='intl';export const Mbt=(_s,v)=>globalThis.__md.visible=v;export const Wvt=(_s,f)=>f();export const IDt=(id,_c,o)=>(globalThis.__md.registered={id,options:o});export const Gvt=(_s,_r,o)=>(globalThis.__md.opened=o);export const qvt={tabById$:'tabs',activateTab:(_s,id)=>globalThis.__md.activated=id,closeTab:(_s,id)=>globalThis.__md.closed=id,updateTabState:()=>{},updateTab:()=>{}};";
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

const shopping = loaded.get('shopping-browse-tab-open');
const values = new Map([['tabs|shopping-browse:%5B%22a%22%2C%22c%22%2C%22m%22%5D', { tabId: 'existing' }], ['context|existing', null]]);
const writes = [];
const scope = { value: { routeKind: 'chatgpt-thread', conversationId: 'c' }, get(key, parameter) { if (key === 'intl') return { formatMessage: () => 'Browse more' }; return values.get(String(key) + '|' + String(parameter)) ?? null; }, set(...args) { writes.push(args); } };
shopping.openShoppingBrowseTab(scope, { accountId: 'a', rootMessageId: 'm', turn: { conversationId: 'c' } });
assert.equal(globalThis.__md.activated, 'existing');
assert.equal(globalThis.__md.visible, true);
assert.equal(writes[0][1], 'existing');
runtimeAssertions += 3;

values.clear(); values.set('resolved|shopping-browse:%5B%22a%22%2C%22c%22%2C%22m%22%5D', { accountId: 'a', rootMessageId: 'm', turn: { conversationId: 'c' } });
shopping.openShoppingBrowseTab(scope, { accountId: 'a', rootMessageId: 'm', turn: { conversationId: 'c' } });
assert.equal(globalThis.__md.opened.id.startsWith('shopping-browse:'), true);
assert.deepEqual(globalThis.__md.opened.defaultState(), { contextKey: '["a","c","m",null]', selectedFilters: null, scrollTop: 0 });
runtimeAssertions += 2;

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
assert.equal(shelf.ConversationFollowupShelf({ conversationId: 'c', suggestions: [] }), null);
const loading = shelf.ConversationFollowupShelf({ conversationId: 'c', loading: true });
assert.equal(loading.props['aria-busy'], true);
assert.equal(loading.props.children[1].props.children.length, 3);
let chosen = -1;
const suggestions = shelf.ConversationFollowupShelf({ conversationId: 'c', visible: true, suggestions: [{ id: 's', title: 'Next?', body: 'Next?', tier: 't1' }], onSelect: (index) => { chosen = index; } });
suggestions.props.children[1].props.children[0].props.onClick();
assert.equal(chosen, 0);
runtimeAssertions += 4;

const family = loaded.get('family-notification-surface');
let pathValue = '';
const notice = family.FamilyNotification({ notification: { type: 'setting-updated', item: { id: 'n', payload: { familyEnabled: true } } }, account: { userId: 'u', accountId: 'a' }, initialSurface: 'banner', onClose() {}, onViewSettings(path) { pathValue = path; } });
assert.equal(notice.props['data-family-notification'], 'setting-updated');
notice.props.children[2].props.onClick();
assert.equal(pathValue, '/family?view=manage&member=u');
const defaulted = family.FamilyNotification({ notification: { type: 'setting-defaulted', item: { id: 'd' } }, account: { userId: 'u', accountId: 'a' }, initialSurface: 'banner', onClose() {} });
assert.equal(defaulted.props.children, 'ChatGPT includes safeguards for teens');
runtimeAssertions += 3;

delete globalThis.__md;
console.log(sourceAssertions + ' source assertions and ' + runtimeAssertions + ' runtime assertions passed');
