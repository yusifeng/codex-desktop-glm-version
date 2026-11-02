import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directories = ["shopping-bag-fill-icon", "checkout-telemetry", "epic-chart-indicator-entry", "voice-dsp-entry", "code-block-execution-entry", "experimental-feature-visibility", "product-favorite-action-entry", "note-icon", "open-automation-side-panel-tab-entry"];
const expectedImports = {
  "shopping-bag-fill-icon": ["app-shared", "rolldown-runtime"],
  "checkout-telemetry": ["checkout-policy", "stripe-payment-element-options", "rolldown-runtime"],
  "epic-chart-indicator-entry": ["app-initial"],
  "voice-dsp-entry": ["app-shared", "rolldown-runtime"],
  "code-block-execution-entry": ["app-shared", "rolldown-runtime"],
  "experimental-feature-visibility": ["app-initial", "app-shared", "chronicle-settings", "rolldown-runtime"],
  "product-favorite-action-entry": ["app-shared", "product-favorite-action-core"],
  "note-icon": ["app-shared", "rolldown-runtime"],
  "open-automation-side-panel-tab-entry": ["app-shared", "open-automation-side-panel-tab"],
};
let sourceAssertions = 0;
for (const directory of directories) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  assert.deepEqual([...source.matchAll(/(?:from|import)\s*(?:\([^)]*?from\s*)?["']@rchunk\/([^"']+)/g)].map(match => match[1]), expectedImports[directory]);
  assert.equal(/\bany\b/.test(source), false);
  sourceAssertions += 2;
}
assert.equal((fs.readFileSync(path.join(ROOT, "src/renderer/voice-dsp-entry/index.ts"), "utf8").match(/import\(/g) ?? []).length, 2);
assert.equal((fs.readFileSync(path.join(ROOT, "src/renderer/code-block-execution-entry/index.ts"), "utf8").match(/import\(/g) ?? []).length, 1);
assert.deepEqual([...fs.readFileSync(path.join(ROOT, "src/renderer/voice-dsp-entry/index.ts"), "utf8").matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map(match => match[1]), ["voice-dsp", "silero-vad"]);
assert.deepEqual([...fs.readFileSync(path.join(ROOT, "src/renderer/code-block-execution-entry/index.ts"), "utf8").matchAll(/import\("@rchunk\/([^"]+)"\)/g)].map(match => match[1]), ["code-block-execution"]);
sourceAssertions += 4;

globalThis.__valdiSmall = { calls: [], jsx: { Fragment: Symbol("Fragment"), jsx: (type, props) => ({ type, props: props ?? {} }), jsxs: (type, props) => ({ type, props: props ?? {} }) }, signals: new Map(), query: { isPending: true, isFetching: false, refetch() {} }, opened: [] };
const state = globalThis.__valdiSmall;
const mockModules = {
  "rolldown-runtime": "export {};",
  "app-shared": `const s=globalThis.__valdiSmall; export const $3=()=>s.calls.push('compiler'); export const BX=(signal,key)=>s.signals.get(signal+'|'+key)??s.signals.get(signal); export const FX=()=>s.calls.push('signals'); export const FZ=()=>Promise.reject(new Error('disabled')); export const H3=()=>s.calls.push('async'); export const HX=signal=>s.signals.get(signal); export const I3=()=>s.jsx; export const K2=()=>s.calls.push('intl'); export const LX=()=>({get(){}}); export const UX='ScopedProvider'; export const V3=loader=>loader(); export const Y2='FormattedMessage'; export const Yh='Button'; export const Zh=()=>s.calls.push('buttons'); export const _L=()=>s.query; export const e6=()=>s.calls.push('react'); export const gL=()=>s.calls.push('query'); export const hU=value=>value.startsWith('file_'); export const jZ=()=>s.calls.push('motion'); export const wL=()=>s.calls.push('shared'); export const II=value=>value.split('/').at(-1); export const RI=()=>s.calls.push('paths');`,
  "app-initial": `const s=globalThis.__valdiSmall; export const aE=()=>s.calls.push('epic-init'); export const oE=()=>Promise.resolve('epic'); export const dnt=()=>s.calls.push('experiments'); export const HK='saved-state'; export const MG='SavedEntityAction'; export const NG=()=>s.calls.push('saved'); export const Qgn=()=>s.calls.push('account'); export const Sun=()=>s.calls.push('session'); export const Wz=()=>s.calls.push('saved-ui'); export const _it=()=>({contentReferences:[],messageId:'message',shouldBlockExternalEgress:false}); export const _un='user'; export const afn=()=>({get:()=>['product_rationale_and_reviews']}); export const git=()=>s.calls.push('turn'); export const ifn=()=>s.calls.push('products'); export const lK=()=>s.calls.push('entity'); export const mun='account'; export const o_n=()=>destination=>s.calls.push(['navigate',destination]); export const rK='favorite-scope'; export const $en='route-scope'; export const Aet=()=>s.calls.push('empty'); export class Sdn extends Error { constructor(message='x',status=500){super(message);this.status=status;} } export const _fn='feature-disabled'; export const bun='access'; export const bz=id=>'provider:'+id; export const f7={MainContentLayout:'MainContentLayout'}; export const gun='automation-blocked'; export const itn=()=>s.calls.push('route'); export const ket='EmptyState'; export const l_n=()=>({libraryFileId:'file_1'}); export const mfn='feature-enabled'; export const p7=()=>s.calls.push('page'); export const pfn=()=>s.calls.push('flags'); export const vfn='availability'; export const wdn=()=>s.calls.push('api-errors'); export const Dyt='host'; export const Fut=()=>s.calls.push('attachments'); export const GZt='history-loaded'; export const HZt=()=>s.calls.push('conversation'); export const LCt=()=>s.calls.push('preview'); export const M_='entries'; export const Put='paths-query'; export const RCt='title'; export const U3t=()=>s.calls.push('generated'); export const Ugn=()=>({ensureConversationHistoryLoaded:async()=>{}}); export const V3t=value=>value; export const bQt='projectless'; export const byt=()=>s.calls.push('image-utils'); export const k_=()=>s.calls.push('attachment-runtime'); export const mpn='intl-shape'; export const ppn=()=>s.calls.push('tabs'); export const qB=()=>[]; export const ttn=()=> 'conversation'; export const wQt='conversation-host';`,
  "checkout-policy": `export const S=()=>globalThis.__valdiSmall.calls.push('checkout'); export const n={Standard:'standard',CodexTeam:'codex_team'};`,
  "stripe-payment-element-options": `export const n=()=>globalThis.__valdiSmall.calls.push('stripe'); export const r=id=>id.startsWith('cs_openai_');`,
  "chronicle-settings": `export const n=()=>globalThis.__valdiSmall.calls.push('chronicle');`,
  "voice-dsp": `export const initializeVoiceDsp=()=> 'voice-dsp';`,
  "silero-vad": `export const preloadSileroVoiceActivityDetector=value=>({silero:value});`,
  "code-block-execution": `export const CodeBlockExecution='CodeBlockExecution';`,
  "request-context": `export const n=()=>globalThis.__valdiSmall.calls.push('request-context'); export const r='request-query';`,
  "product-favorite-action-core": `export const n=()=>globalThis.__valdiSmall.calls.push('favorite-entry'); export const t='ProductFavoriteAction';`,
  "open-automation-side-panel-tab": `export const a='restore'; export const i='site'; export const n='open'; export const r='suggestion'; export const t=()=>globalThis.__valdiSmall.calls.push('automation-tab');`,
  "cloud-file-preview": `export const t=()=>globalThis.__valdiSmall.calls.push('cloud-preview');`,
  "library-cloud-file-preview": `export const n='LibraryCloudFilePreview';`,
  "library-file-metadata": `export const n=()=>globalThis.__valdiSmall.calls.push('metadata'); export const t=async()=>({id:'file_1'});`,
  "library-file-preview-loading": `export const n=()=>globalThis.__valdiSmall.calls.push('loading'); export const t='LibraryFilePreviewLoading';`,
  "local-conversation-thread-turn-entries": `export const n=()=>[]; export const r=()=>globalThis.__valdiSmall.calls.push('turn-entries');`,
};
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "valdi-small-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({ path: value.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => ({ contents: mockModules[value] ?? "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }

let runtimeAssertions = 0;
const shopping = await bundle("shopping-bag-fill-icon"); assert.equal(shopping.default({ className: "bag" }).type, "svg"); runtimeAssertions++;
const note = await bundle("note-icon"); const noteSvg = note.default({}); assert.equal(noteSvg.props.children.length, 4); runtimeAssertions++;
const checkout = await bundle("checkout-telemetry"); checkout.r(); const tags = checkout.n({ checkoutSessionId: "cs_openai_1", checkoutPlanType: "plus", processorEntity: "openai_llc", isCheckoutModalEnabled: true, checkoutKind: "standard", entryPoint: "sidebar_upsell", sourceSearchParams: new URLSearchParams("source=codex") }, "web"); assert.deepEqual(tags, { checkout_provider: "open_ai", reported_web_track: "web", plan_type: "plus", processor_entity: "openai_llc", is_checkout_modal_enabled: "true", checkout_kind: "standard", entry_point: "sidebar_upsell", source: "codex" }); runtimeAssertions++;
const epic = await bundle("epic-chart-indicator-entry"); assert.equal(await epic.loadEpicChartIndicator(), "epic"); runtimeAssertions++;
const voice = await bundle("voice-dsp-entry"); assert.equal(await voice.loadVoiceDsp(), "voice-dsp"); assert.deepEqual(await voice.preloadSileroVoiceActivityDetector({ threshold: 0.5 }), { silero: { threshold: 0.5 } }); runtimeAssertions += 2;
const execution = await bundle("code-block-execution-entry"); assert.equal(await execution.loadCodeBlockExecution(), "CodeBlockExecution"); runtimeAssertions++;
const visibility = await bundle("experimental-feature-visibility"); visibility.t(); assert.equal(visibility.n({ stage: "beta", name: "new_feature" }), true); assert.equal(visibility.n({ stage: "beta", name: "realtime_voice" }), false); assert.equal(visibility.n({ stage: "alpha", name: "new_feature" }), false); runtimeAssertions += 3;
const favoriteEntry = await bundle("product-favorite-action-entry"); assert.equal(favoriteEntry.ProductFavoriteAction, "ProductFavoriteAction"); runtimeAssertions++;
sourceAssertions += assertReleaseOwner("product-favorite-action-core");
const automation = await bundle("open-automation-side-panel-tab-entry"); assert.deepEqual(Object.keys(automation), ["openAutomationSidePanelTab", "openAutomationSuggestionSidePanelTab", "openSiteAutomationSidePanelTab", "restoreAutomationSidePanelTab"]); runtimeAssertions++;
sourceAssertions += assertReleaseOwner("library-file-route");
sourceAssertions += assertReleaseOwner("restore-image-preview-tab");

console.log(`${sourceAssertions} source assertions and ${runtimeAssertions} runtime assertions passed`);
