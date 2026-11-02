import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { assertReleaseOwner } from './release-owner-test-helpers.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = '/Users/david/Workspace/ppio_github/chatgpt-desktop-src/app/webview/assets';
const modules = [
  ['library-empty-trash-758597c77867.js', 'library-empty-trash-dialog', ['EmptyLibraryTrashDialog']],
  ['open-in-codex-c690ffed81f6.js', 'windows-tabs-open', ['runWindowsTabsOpen']],
];
const aliases = new Map([
  ['settings-parental-presentation', 'presentation'],
  ['thread-shell-runtime', 'runtime'],
  ['open-review-link', 'open'],
]);
const originalDependencies = (source, dynamic) => [...source.matchAll(dynamic ? /import\("\.\/([^"/]+)-[a-f0-9]{12}\.js"\)/g : /from "\.\/([^"/]+)-[a-f0-9]{12}\.js"/g)].map(match => match[1]);
const restoredDependencies = (source, dynamic) => [...source.matchAll(dynamic ? /import\("@rchunk\/([^"]+)"\)/g : /(?:from\s+|import\s*)"@rchunk\/([^"]+)"/g)].map(match => aliases.get(match[1]) ?? match[1]);
let sourceAssertions = 0;
for (const [asset, semantic] of modules) {
  const original = fs.readFileSync(path.join(SOURCE, asset), 'utf8');
  const restored = fs.readFileSync(path.join(ROOT, 'src/renderer', semantic, 'index.ts'), 'utf8');
  assert.deepEqual(restoredDependencies(restored, false), originalDependencies(original, false));
  assert.deepEqual(restoredDependencies(restored, true), originalDependencies(original, true));
  assert.equal(/\bany\b|@ts-expect-error|@ts-nocheck/.test(restored), false);
  sourceAssertions += 3;
}
sourceAssertions += assertReleaseOwner('parental-control-notifications-runtime');

globalThis.__nj = { hookIndex: 0, hookState: [], logs: [] };
const jsxRuntime = `
export const I3=()=>({Fragment:'fragment',jsx:(kind,props,key)=>({kind,props,key}),jsxs:(kind,props,key)=>({kind,props,key})});
export const e6=()=>({useState(initial){const i=globalThis.__nj.hookIndex++;if(!(i in globalThis.__nj.hookState))globalThis.__nj.hookState[i]=initial;return [globalThis.__nj.hookState[i],next=>{globalThis.__nj.hookState[i]=typeof next==='function'?next(globalThis.__nj.hookState[i]):next}]},useEffect(effect){effect()}});
export const LX=()=>globalThis.__nj.scope;export const Y2='FormattedMessage';export const Yh='Button';export const Ih='Dialog';export const Oh='DialogBody';export const Ph='DialogFooter';export const Rh='DialogHeader';export const UX='DialogText';export const pk=Symbol.for('toasts');
`;
function mock(name) {
  if (name === '@rchunk/rolldown-runtime') return 'export const n=()=>{};';
  if (name === '@rchunk/app-shared') return jsxRuntime;
  if (name === '@rchunk/app-initial') return `
export const rK=Symbol.for('scope');export const mpn=Symbol.for('intl');export const uK=Symbol.for('api');export const atn=Symbol.for('archived');export const Dyt=Symbol.for('host');export const pk=Symbol.for('review-state');
export const HLt={CHATGPT_FILE_LIBRARY_FILE_INTERACTION_TYPE_DELETE:'delete',CHATGPT_FILE_LIBRARY_FILE_INTERACTION_TYPE_DELETE_FAILED:'delete_failed',CHATGPT_FILE_LIBRARY_FILE_INTERACTION_TYPE_DELETE_PARTIAL:'delete_partial',CHATGPT_FILE_LIBRARY_FILE_INTERACTION_TYPE_DELETE_SUCCEEDED:'delete_succeeded'};
export const TKt=(name,getUrl,key)=>{globalThis.__nj.socketMeta={name,getUrl,key};return globalThis.__nj.socket};export const rJt={safeGet:async()=>({websocket_url:'wss://notifications'})};
export const DDt=(url)=>globalThis.__nj.reviewLinks?.[url]??null;export const jR=(scope,path,input)=>({tabId:'file:'+path,placement:input.target,status:'opened'});export const fgt=()=>globalThis.__nj.browserTabs??[];export const ilt=(scope,input)=>input.browserTabId??'browser-new';export const dgt=(scope,id)=>({target:'right'});export const gvt=(scope,id)=>globalThis.__nj.placements?.[id]??null;export const Pi=()=>true;export const fvt=()=>true;export const fk=()=>{};export const rtn=value=>value.conversationId??value.taskId??value.clientThreadId;export const IO=(scope,thread,branch)=>{globalThis.__nj.branch=[thread,branch]};export const PE=(scope,path)=>{globalThis.__nj.reviewPath=path};
export const detectExternalAgentConfig=async()=>[];export const importExternalAgentConfig=async()=>{};export const projectImportWorkspaceRoot=null;
`;
  if (name === '@rchunk/reset-image-library-state') return `export const n=async()=>{globalThis.__nj.reset=(globalThis.__nj.reset??0)+1};`;
  if (name === '@rchunk/library-trash-analytics') return `export const n=(scope,sessionId,type,error)=>globalThis.__nj.logs.push({sessionId,type,error});`;
  if (name === '@rchunk/settings-parental-presentation') return 'export const n=()=>{};';
  if (name === '@rchunk/u18-banner-logging') return `export const n=(scope,event)=>globalThis.__nj.logs.push(event);`;
  if (name === '@rchunk/thread-shell-runtime') return `export const t=()=>true;export const l=()=> 'bottom';export const r=(scope,id)=>id??'session-new';`;
  if (name === '@rchunk/open-review-link') return `export const openReviewLink=async(scope,input,placement)=>({placement:placement??'right',status:'opened',tabId:'pr-review'});`;
  return 'export const n=()=>{};export const t=()=>{};';
}
async function bundle(semantic) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, 'src/renderer', semantic, 'index.ts')], bundle: true, format: 'esm', platform: 'node', target: 'node22', write: false, logLevel: 'silent',
    plugins: [{ name: 'mock-rchunks', setup(build) { build.onResolve({ filter: /^@rchunk\// }, args => ({ path: args.path, namespace: 'mock' })); build.onLoad({ filter: /.*/, namespace: 'mock' }, args => ({ contents: mock(args.path), loader: 'js' })); } }],
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64') + '#' + semantic);
}
const loaded = new Map();
let runtimeAssertions = 0;
for (const [, semantic, expectedExports] of modules) { const value = await bundle(semantic); loaded.set(semantic, value); assert.deepEqual(Object.keys(value).sort(), expectedExports); runtimeAssertions++; }

const toastMessages = [];
const invalidations = [];
globalThis.__nj.scope = {
  queryClient: { invalidateQueries({ queryKey }) { invalidations.push(queryKey); }, getQueryData() { return undefined; }, cancelQueries() {}, removeQueries() {} },
  get(key) { if (key === Symbol.for('toasts')) return { danger(message) { toastMessages.push(['danger', message]); }, success(message) { toastMessages.push(['success', message]); } }; if (key === Symbol.for('intl')) return { formatMessage: descriptor => descriptor.defaultMessage }; if (key === Symbol.for('api')) return { safeDelete: async () => ({ deleted_count: 3, failed_count: 0 }) }; },
};
let closed = 0;
const dialog = loaded.get('library-empty-trash-dialog').EmptyLibraryTrashDialog({ accountId: 'a', userId: 'u', sessionId: 's', onClose: () => closed++ });
const form = dialog.props.children;
await form.props.onSubmit({ preventDefault() {} });
assert.equal(closed, 1); assert.equal(globalThis.__nj.reset, 1); assert.deepEqual(invalidations, [['library-api'], ['chatgpt-composer-library-files'], ['4231797315']]); assert.deepEqual(toastMessages, [['success', 'Trash emptied']]); assert.deepEqual(globalThis.__nj.logs.map(entry => entry.type), ['delete', 'delete_succeeded']);
runtimeAssertions += 5;

const scope = { value: { routeKind: 'local-thread', conversationId: 'thread-1' }, get(key) { if (key === Symbol.for('archived')) return false; if (key === Symbol.for('host')) return 'host-1'; if (key === Symbol.for('terminal-tab-ids')) return []; return undefined; } };
const open = loaded.get('windows-tabs-open').runWindowsTabsOpen;
assert.deepEqual(await open({ target: { type: 'file', path: '/tmp/a.ts' } }, { scope }), { threadId: 'thread-1', type: 'file', placement: 'right', status: 'opened', tabId: 'file:/tmp/a.ts' });
globalThis.__nj.browserTabs = [{ browserTabId: 'existing' }]; assert.equal((await open({ target: { type: 'browser', tabId: 'existing' } }, { scope })).status, 'existing');
assert.deepEqual(await open({ placement: 'bottom', target: { type: 'terminal', sessionId: 'term' } }, { scope }), { threadId: 'thread-1', type: 'terminal', placement: 'bottom', status: 'opened', tabId: 'terminal:term' });
globalThis.__nj.reviewLinks = { 'https://pr': { kind: 'pullRequestReview', target: { id: 42 } } }; assert.equal((await open({ target: { type: 'browser', url: 'https://pr' } }, { scope })).status, 'opened');
await assert.rejects(() => open({ threadId: 'other', target: { type: 'file', path: 'x' } }, { scope }), /not visible/);
runtimeAssertions += 5;

const projectImportAssertions = assertReleaseOwner('project-import-prompt-host');

delete globalThis.__nj;
console.log(`${sourceAssertions} source, ${runtimeAssertions} runtime, and ${projectImportAssertions} project import release assertions passed`);
