import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/detached-browser-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const dependencies = new Set([...source.matchAll(/(?:from|import)\s*(?:\(|)"@rchunk\/([^"/]+)"/g)].map((match) => match[1]));
assert.deepEqual([...dependencies].sort(), ["annotation-controls", "app-shared", "browser-browsing-data-dialog", "options-menu-view", "profile", "rolldown-runtime", "tab-address-input"]);
assert.doesNotMatch(source, /\bany\b/);
assert.doesNotMatch(source, /\b(?:appSharedChunk|browsingDataChunk|optionsMenuChunk|profileChunk|addressInputChunk)\s*\./);

class FakeElement {
  constructor(tag="div") { this.tagName=tag.toUpperCase();this.children=[];this.parentElement=null;this.isConnected=false;this.className="";this.dataset={};this.style={backgroundColor:""};this.rect={x:10,y:20,width:800,height:600};this.focusCalls=0;this.selectCalls=0; }
  replaceChildren(...children) { this.children=children; for (const child of children) { child.parentElement=this;child.isConnected=this.isConnected; } }
  getBoundingClientRect() { return this.rect; }
  focus() { this.focusCalls+=1; } select() { this.selectCalls+=1; }
}
globalThis.HTMLElement=FakeElement;globalThis.HTMLInputElement=FakeElement;
const documentElements=new Map();
globalThis.document={createElement:tag=>new FakeElement(tag),getElementById:id=>documentElements.get(id)??null,documentElement:new FakeElement("html")};document.documentElement.isConnected=true;
const listeners=new Map();const posted=[];
globalThis.window={addEventListener(type,listener){const set=listeners.get(type)??new Set();set.add(listener);listeners.set(type,set);},removeEventListener(type,listener){listeners.get(type)?.delete(listener);},postMessage(message){posted.push(message);}};
globalThis.requestAnimationFrame=callback=>{callback();return 1;};
const resizeObservers=[];globalThis.ResizeObserver=class{constructor(callback){this.callback=callback;this.disconnected=false;resizeObservers.push(this);}observe(element){this.element=element;}disconnect(){this.disconnected=true;}};

const state={initializers:[],renders:[],layouts:[],stateIndex:0,stateValues:[],setters:[],effects:[],unmounts:0,annotationLoads:0};
globalThis.__detachedBrowserTest=state;
const marker="const state=globalThis.__detachedBrowserTest; const marker=name=>()=>state.initializers.push(name);";
const mocks={
  "rolldown-runtime":"export {};",
  "app-shared":[marker,
    "export const $3=marker('runtime');export const K2=marker('ui');export const W3=marker('shared');",
    "export const I3=()=>({Fragment:'Fragment',jsx:(type,props,key)=>({type,props,key}),jsxs:(type,props,key)=>({type,props,key})});",
    "export const e6=()=>({useState(value){const index=state.stateIndex++;const initial=typeof value==='function'?value():value;const selected=index<state.stateValues.length?state.stateValues[index]:initial;return[selected,next=>state.setters.push({index,next})];},useEffect(effect){state.effects.push(effect);effect();}});",
    "export const N3=()=>({createRoot(){return{render(node){state.renders.push(node);if(node?.props?.ref){const host=new HTMLElement('div');host.isConnected=true;node.props.ref(host);state.viewportHost=host;}},unmount(){state.unmounts+=1;}}}});export const P3=()=>({flushSync:callback=>callback()});",
  ].join('\n'),
  "app-initial":"export {};","app-primary":"export {};","profile":"export {};","tweaks-toolbar-view":"export {};",
  "options-menu-view":[marker,"export const n=marker('options');export const t='BrowserOptionsMenu';export const k=({command})=>({command:{...command,translated:true}});"].join('\n'),
  "tab-address-input":[marker,"export const n=marker('address');export const t='TabAddressInput';"].join('\n'),
  "browser-browsing-data-dialog":[marker,"export const n=marker('browsing');"].join('\n'),
  "annotation-controls":"globalThis.__detachedBrowserTest.annotationLoads+=1;export const DetachedBrowserAnnotationButton='AnnotationButton';export const DetachedBrowserTweaksToolbar='TweaksToolbar';",
};
const result=await esbuild.build({entryPoints:[sourcePath],bundle:true,format:"esm",platform:"node",target:"node22",write:false,logLevel:"silent",plugins:[{name:"detached-browser-mocks",setup(build){build.onResolve({filter:/^@rchunk\//},({path:importPath})=>({path:importPath.slice(8),namespace:"mock"}));build.onLoad({filter:/.*/,namespace:"mock"},({path:importPath})=>({loader:"js",contents:mocks[importPath]??"export {};"}));}}]});
const module=await import("data:text/javascript;base64,"+Buffer.from(result.outputFiles[0].text).toString("base64"));
let assertions=3;function check(value,message){assert.ok(value,message);assertions+=1;}
function emit(type,data){for(const listener of listeners.get(type)??[])listener(data);}
function request(overrides={}){return{title:"Example",toolbarState:{kind:"browser",data:{browserToolbarCapabilities:{annotationModeEnabled:true,tweaksEnabled:true},showFullUrl:false}},content:{kind:"browser",data:{browserTabId:"tab-1",conversationId:"conversation-1",panelTarget:"panel",cursorColor:"#fff",snapshot:{title:"Example",url:"https://example.com",zoomPercent:100},deviceToolbarTabState:{responsiveViewportSize:null,toolbarState:{width:390,height:844,isEnabled:false,presetId:"responsive"}},...overrides.data}},durableRoute:{params:{browserTabId:"tab-1"}},...overrides};}
function services(overrides={}){
  const events={commands:[],syncs:[],registrations:[],annotations:[],navigation:[],closes:0,updates:[],statuses:[],chrome:[],unmounts:0,receiver:null,receiverUpdate:null,disposed:[],browserActive:[],viewportSizes:[],captureSizes:[],tabCapture:[],focus:0,adopts:[],permissionListener:null};
  const browserHost={async registerWebviewHostSession(input){events.registrations.push(["session",input]);return overrides.session!==false;},async registerWebviewHost(input){events.registrations.push(["host",input]);return overrides.host!==false;},subscribePermissionPrompts(_target,listener){events.permissionListener=listener;return{[Symbol.dispose](){events.disposed.push("permission");}};},markRegistered(){events.registrations.push(["marked"]);},async runPageCommand(input){events.commands.push(input);return true;},async syncView(input){events.syncs.push(input);},focus(){events.focus+=1;},setBrowserUseActive(value){events.browserActive.push(value);},releaseBrowserUse(){events.browserActive.push("released");},setBrowserUseViewportSize(value){events.viewportSizes.push(value);},setBrowserUseCaptureSurfaceSize(value){events.captureSizes.push(value);},setTabCaptureActive(value){events.tabCapture.push(value);},shouldDestroyForHostRequest(){return overrides.shouldDestroy!==false;},adoptForWindowTransfer(token){events.adopts.push(token);return "adopted";},async whenWindowTransferPrepared(){return true;},async whenWindowTransferPresented(){return true;},[Symbol.dispose](){events.disposed.push("host");}};
  const toolbarService={async forwardBrowserAnnotationMessage(message){events.annotations.push(message);},async recordBrowserNavigation(input){events.navigation.push(input);},[Symbol.dispose](){events.disposed.push("toolbar");}};
  const detachedWindows={async getToolbarService(){return overrides.toolbarMissing?null:{kind:overrides.toolbarKind??"browser",service:toolbarService};},async setReceiver(receiver,update){events.receiver=receiver;events.receiverUpdate=update;return overrides.receiver!==false;},async close(){events.closes+=1;},async updateTab(title,route){events.updates.push({title,route});},[Symbol.dispose](){events.disposed.push("windows");}};
  const downloads={subscribe(){return{[Symbol.dispose](){events.disposed.push("downloads-subscription");}};},[Symbol.dispose](){events.disposed.push("downloads");}};
  return{events,appHost:{services:{browserHost:overrides.missingBrowser?null:browserHost,detachedWindows:overrides.missingWindows?null:detachedWindows,browserAutocomplete:{},downloads,browsingHistory:{}}}};
}
async function mount(serviceOverrides={},requestOverrides={}){state.layouts=[];state.renders=[];state.stateIndex=0;state.stateValues=[];state.setters=[];state.effects=[];const fixture=services(serviceOverrides);const container=new FakeElement();container.isConnected=true;const disposable=await module.mountDetachedBrowserPage(request(requestOverrides),fixture.appHost,container,payload=>{state.layouts.push(payload);return payload.content;},update=>fixture.events.chrome.push(update),content=>fixture.events.statuses.push(content));return{...fixture,disposable,container};}

check(Object.keys(module).join(",")==="mountDetachedBrowserPage","preserves the sole public export");
check(state.initializers.includes("options")&&state.initializers.includes("address")&&state.initializers.includes("browsing"),"initializes adjacent browser toolbar chunks");

let mounted=await mount();check(mounted.events.registrations.map(entry=>entry[0]).join(",")==="session,host,marked","registers session and host before presenting");check(mounted.events.receiver!=null&&mounted.events.syncs.length>=1,"registers the detached receiver and performs initial sync");check(state.layouts[0].headerRows[0].id==="browser-navigation","mounts the browser navigation header");check(state.viewportHost.children[0].className.includes("overflow-hidden"),"mounts the detached viewport");
const toolbarNode=state.layouts.at(-1).headerRows[0].content;state.stateIndex=0;const toolbar=toolbarNode.type(toolbarNode.props);await Promise.resolve();check(state.annotationLoads===1,"loads annotation controls only when toolbar capabilities require them");const toolbarRow=toolbar.props.children[0];toolbarRow.props.children[0].props.onClick();check(mounted.events.commands.at(-1).command.type==="go-back","runs back navigation from the toolbar");toolbarRow.props.children[3].props.onCommitAddress("https://openai.com");check(mounted.events.commands.at(-1).command.type==="navigate"&&mounted.events.commands.at(-1).command.url==="https://openai.com","commits address navigation");toolbarRow.props.children.at(-1).props.onZoomIn();check(mounted.events.commands.at(-1).command.translated===true,"translates zoom commands for the viewport scale");
const keyListener=[...(listeners.get("keydown")??[])][0];let prevented=0;keyListener({key:"f",ctrlKey:true,metaKey:false,preventDefault(){prevented+=1;}});check(prevented===1&&state.setters.some(call=>call.index===1&&call.next===true),"opens find-in-page from the keyboard shortcut");
const addressElement=new FakeElement("input");documentElements.set("detached-browser-address",addressElement);emit("message",{data:{type:"run-command",id:"focusBrowserAddressBar"}});check(addressElement.focusCalls===1&&addressElement.selectCalls===1,"focuses and selects the address bar on host command");emit("message",{data:{type:"run-command",id:"closeTab"}});check(mounted.events.closes===1,"closes the detached tab on host command");

const nextSnapshot={title:"Next",url:"https://next.example",zoomPercent:125};emit("message",{data:{type:"browser-sidebar-state",browserTabId:"tab-1",conversationId:"conversation-1",snapshot:nextSnapshot}});check((await mounted.events.receiver.getContent()).data.snapshot.url===nextSnapshot.url,"updates receiver content from live snapshots");check(mounted.events.updates[0].title==="Next"&&mounted.events.updates[0].route.params.restoreUrl===nextSnapshot.url,"updates detached window title and restore URL");check(mounted.events.annotations.at(-1).type==="browser-sidebar-state","forwards state updates to annotation tooling");
emit("message",{data:{type:"browser-sidebar-browser-use-state",browserTabId:"tab-1",conversationId:"conversation-1",isActive:true}});check(mounted.events.browserActive.at(-1)===true&&mounted.events.statuses.at(-1)!=null,"shows browser-use status while the agent controls the page");emit("message",{data:{type:"browser-sidebar-browser-use-page-released",browserTabId:"tab-1",conversationId:"conversation-1"}});check(mounted.events.browserActive.at(-1)==="released","releases browser-use control");emit("message",{data:{type:"browser-sidebar-browser-use-viewport",browserTabId:"tab-1",conversationId:"conversation-1",viewportSize:{width:1024,height:768}}});check(mounted.events.viewportSizes.at(-1).width===1024&&(await mounted.events.receiver.getContent()).data.deviceToolbarTabState.toolbarState.isEnabled===true,"enables responsive device emulation from browser-use viewport messages");
emit("message",{data:{type:"browser-sidebar-browser-use-capture-surface",browserTabId:"tab-1",conversationId:"conversation-1",surfaceSize:{width:400,height:300}}});emit("message",{data:{type:"browser-sidebar-tab-capture-state",browserTabId:"tab-1",conversationId:"conversation-1",isActive:true}});check(mounted.events.captureSizes[0].width===400&&mounted.events.tabCapture[0]===true,"forwards capture surface and tab capture state");emit("message",{data:{type:"browser-sidebar-usage",browserTabId:"tab-1",conversationId:"conversation-1",initiator:"user",source:"toolbar",urlKind:"web"}});check(mounted.events.navigation[0].panelTarget==="panel","records detached browser navigation usage");emit("message",{data:{type:"browser-sidebar-direct-comment",browserTabId:"tab-1",conversationId:"conversation-1"}});check(mounted.events.annotations.at(-1).type==="browser-sidebar-direct-comment","forwards annotation interaction messages");
emit("message",{data:{type:"browser-sidebar-screenshot-copied",browserTabId:"tab-1",conversationId:"conversation-1"}});check(mounted.events.statuses.at(-1).props.children.includes("Screenshot saved"),"reports screenshot success");emit("message",{data:{type:"browser-sidebar-screenshot-copy-failed",browserTabId:"tab-1",conversationId:"conversation-1"}});check(mounted.events.statuses.at(-1).props.role==="alert","reports screenshot failures");
check(await mounted.events.receiver.whenPrepared()===true&&await mounted.events.receiver.whenReady()===true,"bridges window-transfer readiness");check(mounted.events.receiver.attach({kind:"browser",data:{token:"token-1"}})==="adopted"&&mounted.events.adopts[0]==="token-1","adopts matching browser transfers");mounted.events.receiverUpdate({toolbarState:{kind:"browser",data:{browserToolbarCapabilities:{},showFullUrl:true}}});check(mounted.events.chrome.length===1&&state.layouts.length>1,"applies chrome updates and rerenders the toolbar");
mounted.events.permissionListener([{id:"prompt-1"}]);check(mounted.events.statuses.at(-1).props.children==="Browser permission requested","renders permission prompt status");
mounted.disposable[Symbol.dispose]();mounted.disposable[Symbol.dispose]();check(state.unmounts===1&&resizeObservers[0].disconnected===true,"unmounts React and disconnects observers exactly once");check(mounted.events.disposed.includes("permission")&&mounted.events.disposed.includes("downloads-subscription")&&mounted.events.disposed.includes("toolbar"),"disposes subscriptions and owned toolbar resources");

await assert.rejects(()=>mount({missingBrowser:true}),/services are unavailable/);assertions+=1;await assert.rejects(()=>mount({toolbarKind:"other"}),/toolbar service is unavailable/);assertions+=1;await assert.rejects(()=>mount({session:false}),/session registration was rejected/);assertions+=1;await assert.rejects(()=>mount({host:false}),/host registration was rejected/);assertions+=1;await assert.rejects(()=>mount({receiver:false}),/receiver registration was rejected/);assertions+=1;
mounted=await mount({shouldDestroy:true});emit("message",{data:{type:"browser-sidebar-destroy-webview",browserTabId:"tab-1",conversationId:"conversation-1",reason:"transfer",teardownId:"tear-1"}});check(mounted.events.closes===1&&posted.at(-1).type==="browser-sidebar-webview-destroyed","acknowledges host-requested destruction and closes the window");

console.log(`${assertions} Detached Browser page assertions passed`);
