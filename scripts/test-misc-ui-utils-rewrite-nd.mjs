import assert from 'node:assert/strict';
import {Buffer} from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as esbuild from 'esbuild';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SOURCE='/Users/david/Workspace/ppio_github/chatgpt-desktop-src/app/webview/assets';
const modules=[
['geometry-shapes-22f10631ebb5.js','geometry-shapes',['a','c','d','f','i','l','n','o','p','r','s','t','u']],
['get-plus-header-button-4fc6736dd0bd.js','get-plus-header-button',['GetPlusHeaderButton']],
['gpt-management-access-2072635b520e.js','gpt-management-access',['i','n','r','t']],
['hidden-background-webview-host-31e6685d725d.js','hidden-background-webview-host',['HiddenBackgroundBrowserWebviewHost']],
['hidden-browser-use-webview-host-7226ca67ad08.js','hidden-browser-use-webview-host',['HiddenBrowserUseWebviewHost']],
['host-f06bd3ee2bff.js','host',['PepperOnboardingAnnouncementHost']],
['hotkey-window-detail-layout-28496c4c6613.js','hotkey-window-detail-layout',['HotkeyWindowDetailLayout']],
['type-1dfb8358847e.js','learning-model-gcf-lcm-shape-renderer',['i','n','r','t']],
['voice-commentary-message-660e8302f224.js','voice-commentary-message',['VoiceCommentaryMessage']],
['webview-b1b7b13a4120.js','browser-webview-host',['n','t']],
['workspace-access.browser-2151c8cf5d1a.js','workspace-access-browser',['prepareWorkspaceAccess']],
['workspace-layout-step-handler-57d8db9fac40.js','workspace-layout-step-handler',['WorkspaceLayoutStepHandler']]];
const aliases=new Map([['upgrade-plan-dialog','upgrade-dialog'],['chatgpt-voice-analytics-protobuf','chatgpt_voice'],['pepper-onboarding-modal','modal']]);
const deps=(source,re)=>[...source.matchAll(re)].map(match=>aliases.get(match[1])??match[1]);let sourceAssertions=0;
for(const[asset,semantic]of modules){const original=fs.readFileSync(path.join(SOURCE,asset),'utf8'),restored=fs.readFileSync(path.join(ROOT,'src/renderer',semantic,'index.ts'),'utf8');assert.deepEqual(deps(restored,/(?:from\s+|import\s*)['"]@rchunk\/([^'"]+)/g),deps(original,/from "\.\/([^"/]+)-[a-f0-9]{12}\.js"/g));assert.equal((restored.match(/import\(/g)||[]).length,(original.match(/import\(/g)||[]).length);assert.equal(/\bany\b|@ts-expect-error|@ts-nocheck/.test(restored),false);sourceAssertions+=3}
globalThis.__nd={};
const jsx="export const I3=()=>({jsx:(kind,props,key)=>({kind,props,key}),jsxs:(kind,props,key)=>({kind,props,key})});";
function mock(name){if(name==='@rchunk/app-shared')return jsx+"export const createPortal=(child,host)=>({kind:'portal',child,host});";if(name==='@rchunk/app-initial')return "export const ggt={pages:{getCursorOverlayHost:()=>globalThis.__nd.portalHost}};export const Iun=()=>globalThis.__nd.session;export const Vun=async()=>globalThis.__nd.refreshed;export const qun=async()=>globalThis.__nd.payment;export const rJt={safeGet:async()=>globalThis.__nd.accounts};export const cdn=id=>['accounts',id];export const Mx=async()=>globalThis.__nd.switchResult;export const kx=x=>x;export const Gun=()=>({accountId:globalThis.__nd.tokenAccount});";if(name==='@rchunk/webview')return "export const n=()=>{};export const t=props=>({kind:'webview',props});";return "export const n=()=>{};export const t=()=>{};export const r=()=>{};export const i=()=>{};export const a=()=>{};"}
async function bundle(semantic){const result=await esbuild.build({entryPoints:[path.join(ROOT,'src/renderer',semantic,'index.ts')],bundle:true,format:'esm',platform:'node',target:'node22',write:false,logLevel:'silent',plugins:[{name:'m',setup(build){build.onResolve({filter:/^@rchunk\//},args=>({path:args.path,namespace:'m'}));build.onLoad({filter:/.*/,namespace:'m'},args=>({contents:mock(args.path),loader:'js'}))}}]});return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64')+'#'+semantic)}
const loaded=new Map();let runtimeAssertions=0;for(const[,semantic,exports]of modules){const value=await bundle(semantic);loaded.set(semantic,value);assert.deepEqual(Object.keys(value).sort(),exports.slice().sort());runtimeAssertions++}
const geometry=loaded.get('geometry-shapes');geometry.a();assert.deepEqual(geometry.l(100),{baseCenterY:100,viewBoxHeight:120});assert.deepEqual(geometry.d(100),{bottomCenterY:120,topFaceBottomY:40,viewBoxHeight:141});assert.equal(geometry.u(100),59);assert.match(geometry.f(50),/^M 0.5 20V70/);assert.equal(geometry.n({title:'Cube'}).props.role,'img');runtimeAssertions+=5;
const model=loaded.get('learning-model-gcf-lcm-shape-renderer');model.i();assert.equal(model.n.type,'GCF_LCM');assert.equal(model.n.parameters.first_number.defaultValue,60);const shape=model.r({variant:'hexagon',size:96,label:'12'});assert.equal(shape.props.style.minWidth,124.06);assert.equal(shape.props.children[0].props.children.kind,'svg');runtimeAssertions+=4;
const plus=loaded.get('get-plus-header-button').GetPlusHeaderButton({rejoinPlus:true});assert.equal(plus.props.children[1],'Rejoin Plus');runtimeAssertions++;
const access=loaded.get('gpt-management-access');access.n();assert.equal(access.t({children:'ok',account:{plan_type:'enterprise',structure:'personal'}}),'ok');assert.equal(access.t({children:'ok',account:{plan_type:'free',structure:'personal'},unavailableFallback:'no'}),'no');assert.equal(access.t({children:'ok',loading:true,loadingFallback:'wait'}),'wait');runtimeAssertions+=3;
globalThis.__nd.portalHost={id:'host'};const webview=loaded.get('browser-webview-host');webview.n();assert.equal(webview.t({conversationId:'c',browserTabId:'b',children:'child'}).kind,'portal');runtimeAssertions++;
const hiddenUse=loaded.get('hidden-browser-use-webview-host').HiddenBrowserUseWebviewHost({conversationId:'c',browserUseTabIdsKey:'a\0b',mountedBrowserTabIds:['a']});assert.equal(hiddenUse.props.children.length,1);assert.equal(hiddenUse.props.children[0].props.browserTabId,'b');runtimeAssertions+=2;
const hiddenBackground=loaded.get('hidden-background-webview-host').HiddenBackgroundBrowserWebviewHost({conversationId:'c',panelTabs:[{browserTabId:'a'},{browserTabId:'a'},{browserTabId:'b'}],mountedBrowserTabIds:['b']});assert.equal(hiddenBackground.props.children.length,1);runtimeAssertions++;
let candidate;loaded.get('host').PepperOnboardingAnnouncementHost({accountId:'a',eligibleAnnouncements:['oai/apps/pepperOnboarding'],dismissedAccountIds:new Set(),children:value=>(candidate=value,value)});assert.equal(candidate.id,'oai/apps/pepperOnboarding');runtimeAssertions++;
const hotkey=loaded.get('hotkey-window-detail-layout').HotkeyWindowDetailLayout({detail:{title:'Thread',mainWindowPath:'/c/1'}});assert.equal(hotkey.props['data-hotkey-window-detail-layout'],true);runtimeAssertions++;
const voice=loaded.get('voice-commentary-message').VoiceCommentaryMessage({message:{spawnId:'s',content:{type:'legacy-text',text:'Working'}}});assert.equal(voice.props.className,'h-10');assert.equal(voice.props.children[0].props.children.props.children,'Working');runtimeAssertions+=2;
globalThis.__nd.session={userId:'u',accountId:'w',accessToken:'token'};globalThis.__nd.refreshed={userId:'u',accountId:'a',accessToken:'token'};globalThis.__nd.payment={userId:'u',accountId:'a'};globalThis.__nd.accounts={accounts:{w:{account:{account_id:'w',name:'Work',is_deactivated:false},can_access_with_session:true}},account_ordering:['w']};globalThis.__nd.switchResult={willRedirect:false};globalThis.__nd.tokenAccount='w';const cache=[];const signal={throwIfAborted(){},addEventListener(){},removeEventListener(){}};const workspace=await loaded.get('workspace-access-browser').prepareWorkspaceAccess({scope:{queryClient:{async cancelQueries(){},setQueryData(...args){cache.push(args)}}},statsig:{},userId:'u',workspaceId:'w',signal});assert.equal(workspace.account.name,'Work');assert.equal(cache.length>=1,true);runtimeAssertions+=2;
assert.equal(loaded.get('workspace-layout-step-handler').WorkspaceLayoutStepHandler(),null);runtimeAssertions++;
delete globalThis.__nd;console.log(sourceAssertions+' source assertions and '+runtimeAssertions+' runtime assertions passed');
