import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const state = globalThis.__homeComposerRestored = {
  cleared: [],
  events: [],
  focused: 0,
  hints: [],
  mentions: [],
  observedComposer: null,
  prompt: [],
  removed: [],
};
const jsx = {
  Fragment: "Fragment",
  jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
  jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
globalThis.__homeComposerRestored.jsx = jsx;

async function bundle(directory, modules) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "home-composer-restored-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice(8),
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({
          contents: importPath === "rolldown-runtime"
            ? "export {};"
            : modules[importPath] ?? "export {};",
          loader: "js",
        }));
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}

const followup = await bundle("followup-suggestions", {
  "app-shared": `
    export const I3=()=>globalThis.__homeComposerRestored.jsx;
    export const HX=signal=>signal?.kind==="upload"?"upload-1":"thread-1";
    export const LX=()=>globalThis.__homeComposerRestored.scope;
    export const _L=()=>({data:[{id:"make_art",title:"Make art",prompt_text:"paint",system_hints:["art"]},{id:"animate_drawing",title:"Animate",prompt_text:"move"}]});
    export const sZ=(scope,derive)=>({kind:"upload",derive});
  `,
  "app-initial": `
    export const $9t=value=>value+1;
    export const HZ=()=>globalThis.__homeComposerRestored.editor;
    export const PIt={id:"pending"}; export const RIt=()=>{};
    export const UZ=(controller,selector,channel)=>{globalThis.__homeComposerRestored.observedComposer={controller,channel};return selector(controller)};
    export const VZ=()=>{};
    export const b2=(scope,id,hints)=>globalThis.__homeComposerRestored.hints.push([id,hints]);
    export const cJt=()=>{}; export const kht={id:"composer"};
    export const rJt={safeGet:async()=>({items:[]})}; export const v2={id:"active"};
    export const xIt={id:"generation"};
    export const xpn=(scope,event,fields)=>globalThis.__homeComposerRestored.events.push(fields);
    export const yIt={id:"attachments"}; export const ypn=()=>{};
  `,
  "app-primary": `
    export const Ia={id:"selected"}; export const La=()=>{}; export const au=()=>{};
    export const ru=(scope,id)=>globalThis.__homeComposerRestored.cleared.push(id);
  `,
  "home-suggestion-surface": `export const n=()=>{}; export const t="HomeSuggestionSurface";`,
});
globalThis.__homeComposerRestored.editor = {
  hasText: () => false,
  setPromptText: text => state.prompt.push(text),
  focus: () => state.focused++,
};
globalThis.__homeComposerRestored.scope = {
  get(signal) {
    if (signal?.kind === "upload") return "upload-1";
    if (signal?.id === "attachments") return [{ isBigPaste: false, uploadId: "upload-1" }];
    return null;
  },
};
const followupOuter = followup.SketchHomeSuggestions({ mode: "chat" });
assert.equal(state.observedComposer.controller, globalThis.__homeComposerRestored.editor);
assert.equal(state.observedComposer.channel, "document");
const followupSurface = followupOuter.type(followupOuter.props);
assert.equal(followupSurface.type, "HomeSuggestionSurface");
assert.equal(followupSurface.props.items.length, 2);
followupSurface.props.items[0].onClick();
assert.deepEqual(state.cleared, ["thread-1"]);
assert.deepEqual(state.prompt, ["paint"]);
assert.deepEqual(state.hints, [["thread-1", ["art"]]]);
assert.equal(state.focused, 1);
assert.deepEqual(state.events, [{ position: 1, suggestionId: "make_art" }]);

const picker = await bundle("composer-project-picker-content", {
  "app-shared": `
    export const I3=()=>globalThis.__homeComposerRestored.jsx;
    export const HX=()=>({isError:false,isLoading:false,projects:[{gizmo:{id:"cloud-1",display:{name:"Cloud One"}}}]});
    export const n4=()=>({formatMessage:m=>m.defaultMessage}); export const Y2="FormattedMessage";
    export const jf={Message:"MenuMessage"}; export const Qh="Spinner"; export const ig="ClearIcon";
    export const em="CheckIcon"; export const S_="IconAsset"; export const OE={};
  `,
  "app-initial": `export const _m="ProjectIcon"; export const Jp={}; export const jrt="PlusIcon"; export const Yg="LocalIcon";`,
  "app-primary": `
    export const $=(items,query,getSearchValues)=>{const needle=query.trim().toLowerCase();return needle===""?items:[...items].filter(item=>getSearchValues(item).some(value=>value?.toLowerCase().includes(needle)))};
    export const ic={Item:"MenuItem",Action:"MenuAction"}; export const z="ProjectPickerFrame"; export const L="LocalProjectGroups";
  `,
});
let cloudSelection = null;
const pickerTree = picker.ComposerProjectPickerContent({
  cloudProjectsEnabled: true,
  localProjectOptions: { projects: [{ id: "local-1", label: "Local One", gitRepos: [] }], onSelectProject() {} },
  projectId: "cloud-1",
  searchQuery: "",
  onSearchQueryChange() {}, onClose() {}, onProjectChange() {}, onSelectLocalProject() {},
  onSelectProject(id, name) { cloudSelection = [id, name]; },
});
assert.equal(pickerTree.type, "ProjectPickerFrame");
const pickerChildren = pickerTree.props.projectItems.props.children;
assert.equal(pickerChildren[0][0].type, "MenuItem");
pickerChildren[0][0].props.onSelect();
assert.deepEqual(cloudSelection, ["cloud-1", "Cloud One"]);
assert.equal(pickerChildren[1].type, "LocalProjectGroups");

const plugins = await bundle("composer-work-home-plugins-control", {
  "app-shared": `
    export const I3=()=>globalThis.__homeComposerRestored.jsx;
    export const e6=()=>({useRef:value=>({current:value})});
    export const LX=()=>({}); export const n4=()=>({formatMessage:(m,v)=>m.defaultMessage.replace("{pluginName}",v?.pluginName??"")});
    export const pS="icon16"; export const mS="icon20"; export const iN={CODEX_PLUGIN_DIRECTORY_ENTRYPOINT_OTHER:"other"};
  `,
  "app-initial": `
    export const UZ=()=>"plugin-1"; export const kht={}; export const o_n=()=>({});
    export const PWt=plugin=>({kind:"mention",id:plugin.plugin.id}); export const zWt=()=>"en";
    export const $_=()=>{};
  `,
  "app-primary": `export const pa="ComposerPluginControl"; export const un="ComposerPluginSkeleton"; export const Nl=()=>plugin=>globalThis.__homeComposerRestored.events.push({tracked:plugin.plugin.id});`,
  "plugin-picker-menu-content": `
    export const i=()=>({connectedPlugins:[{plugin:{id:"plugin-1"}}],featuredPlugins:[],hasLoadError:false,isLoading:false,openPluginInstall(){},pluginsFeatureEnabled:true});
    export const o=(scope,plugin)=>globalThis.__homeComposerRestored.events.push({selected:plugin.plugin.id});
    export const t="PluginPickerMenuContent";
  `,
});
const controller = {
  getMentionedPluginIdsKey: () => "plugin-1",
  insertMentionAtSelection: value => state.mentions.push(value),
  removePluginMentions: id => state.removed.push(id),
};
const pluginOuter = plugins.ComposerWorkHomePluginsControl({ composerController: controller, hostId: "local", menuOpen: true, onOpenChange() {}, onRequestComposerFocus() {} });
const pluginControl = pluginOuter.type(pluginOuter.props);
assert.equal(pluginControl.type, "ComposerPluginControl");
pluginControl.props.children.props.onPluginSelectionChange({ plugin: { id: "plugin-2" } }, true);
assert.deepEqual(state.mentions.at(-1), { kind: "mention", id: "plugin-2" });

const list = await bundle("home-suggestion-list", {
  "app-shared": `
    export const I3=()=>globalThis.__homeComposerRestored.jsx;
    export const e6=()=>({useState:value=>[value,()=>{}]}); export const HX=()=>false;
    export const n4=()=>({formatMessage:m=>m.defaultMessage});
    export const m4=(...values)=>values.flat().filter(v=>typeof v==="string").join(" ");
    export const o_="Tooltip"; export const Yh="IconButton"; export const cw="CloseIcon"; export const d$="Presence";
  `,
  "app-initial": `export const A2={};`,
  "home-suggestion-staggered-item": `export const n=()=>{}; export const t="StaggeredItem";`,
});
let activated = 0;
const listTree = list.t({ items: [{ id: "one", label: "One", onClick: () => activated++ }], variant: "feed" });
assert.equal(listTree.type, "div");
const staggered = listTree.props.children[1].props.children[0];
assert.equal(staggered.type, "StaggeredItem");
const tooltip = staggered.props.children[0];
tooltip.props.children.props.onClick();
assert.equal(activated, 1);

const surface = await bundle("home-suggestion-surface", {
  "app-shared": `
    export const I3=()=>globalThis.__homeComposerRestored.jsx;
    export const e6=()=>({useContext:()=>null,useState:value=>[value,()=>{}]}); export const HX=()=>false;
    export const n4=()=>({formatMessage:m=>m.defaultMessage});
    export const m4=(...values)=>values.flat().filter(v=>typeof v==="string").join(" ");
    export const o_="Tooltip"; export const Yh="IconButton"; export const S_="IconAsset"; export const dw={};
    export const o$={div:"MotionDiv"}; export const d$="Presence"; export const P3=()=>({createPortal:(node,target)=>({type:"Portal",props:{node,target}})});
  `,
  "app-initial": `
    export const O2="RefreshIcon"; export const A2={}; export const Slt=()=>false;
    export const jat=()=>({width:320}); export const wat=callback=>element=>{};
  `,
  "app-primary": `export const Jh={};`,
  "suggestion-card": `export const n=()=>{}; export const t="SuggestionCard";`,
  "home-suggestion-list": `export const n=()=>{}; export const t="HomeSuggestionList";`,
  "home-suggestion-staggered-item": `export const n=()=>{}; export const t="StaggeredItem";`,
});
const surfaceTree = surface.t({ layout: "list", items: [{ id: "one", label: "One" }], showCloseAction: false });
assert.equal(surfaceTree.type, "section");
const surfaceBody = surfaceTree.props.children[1];
const surfacePresence = surfaceBody.props.children[1];
const surfaceMotion = surfacePresence.props.children;
assert.equal(surfaceMotion.type, "MotionDiv");
assert.equal(surfaceMotion.props.children.type, "HomeSuggestionList");

const toggle = await bundle("home-composer-mode-toggle-core", {
  "app-shared": `
    export const I3=()=>globalThis.__homeComposerRestored.jsx;
    export const e6=()=>({useState:value=>[typeof value==="function"?value():value,()=>{}]});
    export const f_=()=>{globalThis.__homeComposerRestored.events.push({interaction:true})};
    export const m4=(...values)=>values.flat().filter(v=>typeof v==="string").join(" ");
    export const n4=()=>({formatMessage:m=>m.defaultMessage}); export const Y2="FormattedMessage";
    export const o_="Tooltip"; export const eC="LockIcon"; export const o$={span:"MotionSpan"}; export const $f="ease";
  `,
  "app-initial": `export const Slt=()=>false; export const xlt=()=>{};`,
  "app-primary": `export const Zs="UpgradePopover";`,
});
let nextMode = null;
const toggleTree = toggle.t({ value: "chat", workRequiresUpgrade: true, onValueChange: value => { nextMode = value; } });
assert.equal(toggleTree.type, "div");
const upgrade = toggleTree.props.children[3];
assert.equal(upgrade.type, "UpgradePopover");
const workTooltip = upgrade.props.children({ onActivate() {} });
workTooltip.props.children.props.onClick();
assert.equal(nextMode, "work");

const runLocation = await bundle("composer-action-bar-run-location-dropdown", {
  "app-shared": `
    export const I3=()=>globalThis.__homeComposerRestored.jsx;
    export const m4=(...values)=>values.flat().filter(v=>typeof v==="string").join(" ");
    export const n4=()=>({formatMessage:m=>m.defaultMessage}); export const Y2="FormattedMessage";
    export const o_="Tooltip"; export const Yh="IconButton"; export const S_="IconAsset";
    export const GT={}; export const bD={}; export const kf="Dropdown"; export const jf={Item:"MenuItem",Title:"MenuTitle"};
  `,
  "app-initial": `export const vb="CloudIcon"; export const iW="LocalIcon"; export const jp=()=>null;`,
  "app-primary": `export const Ps=(id,callback,options)=>{globalThis.__homeComposerRestored.shortcut={id,callback,options}};`,
});
let selectedLocation = null;
const locationTree = runLocation.ComposerActionBarRunLocationDropdown({
  runLocationState: { effectiveLocation: "local", unavailableReasons: {} },
  onRunLocationChange: value => { selectedLocation = value; },
});
assert.equal(locationTree.type, "Dropdown");
assert.equal(state.shortcut.id, "composer.toggleWorkRunLocation");
assert.equal(state.shortcut.options.enabled, true);
state.shortcut.callback();
assert.equal(selectedLocation, "cloud");
locationTree.props.children[1].props.onClick();
assert.equal(selectedLocation, "local");

const announcements = await bundle("home-composer-announcement-candidates", {
  "app-shared": `
    export const I3=()=>globalThis.__homeComposerRestored.jsx;
    export const Jm=()=>"LazyAnnouncement"; export const P3=()=>({flushSync:callback=>callback()});
    export const ZI="app-scope"; export const LX=()=>({set:(signal,value)=>globalThis.__homeComposerRestored.events.push({signal,value})});
    export const HX=signal=>signal==="history-state"?"eligible":null;
  `,
  "app-initial": `
    export const F$=()=>"navigate"; export const Fk=()=>()=>globalThis.__homeComposerRestored.events.push({voice:true});
    export const Gk=scope=>globalThis.__homeComposerRestored.events.push({dismissVoice:scope});
    export const HZ=()=>globalThis.__homeComposerRestored.announcementEditor;
    export const U2=()=>({showPluginInstallDetails:true}); export const qk=()=>true;
  `,
  "app-primary": `export const om="FallbackAnnouncement";`,
  "codex-home-announcements": `export const i="ProductAnnouncements"; export const t="CodexAnnouncements";`,
  "worktree-onboarding-state": `export const n=()=>({isEligible:false});`,
  "announcement-entry-points": `
    const state={isEligible:false,isLoading:false,dismiss(){},markShown(){},openGiftCredits(){},openImport(){},replay(){}};
    export const f=()=>state; export const g="history-state"; export const h="history-dismissed"; export const i=()=>state; export const o=()=>state;
    export const p="ReplayAnnouncement"; export const s="ImportAnnouncement"; export const t="GiftAnnouncement"; export const v="HistoryAnnouncement";
    export const u=options=>globalThis.__homeComposerRestored.events.push({replay:options});
  `,
  "realtime-voice-home-announcement": `export const RealtimeVoiceHomeAnnouncementContent="VoiceAnnouncement";`,
  "worktree-onboarding-banner-controller": `export const WorktreeOnboardingBannerController="WorktreeAnnouncement";`,
});
state.announcementPrompt = [];
globalThis.__homeComposerRestored.announcementEditor = {
  eventEmitter: { emit: event => state.events.push({ submitted: event }) },
  setPromptText: prompt => state.announcementPrompt.push(prompt),
};
const announcementTree = announcements.HomeComposerAnnouncementCandidates({
  entryPoint: "codex",
  renderCandidates: candidates => candidates,
});
assert.equal(announcementTree.type, "CodexAnnouncements");
assert.deepEqual(announcementTree.props.composerEntries.map(candidate => candidate.id), [
  "gift-credits", "realtime-voice", "external-agent-import", "worktree-onboarding", "computer-history", "codex-replay",
]);
const historyCandidate = announcementTree.props.composerEntries[4];
assert.equal(historyCandidate.isEligible, true);
historyCandidate.content.props.onViewRecap("recap prompt");
assert.deepEqual(state.announcementPrompt, ["recap prompt"]);
assert.equal(state.events.some(event => event.submitted === "submit"), true);
const productAnnouncementTree = announcements.HomeComposerAnnouncementCandidates({
  beaconProduct: "work_tab",
  entryPoint: "codex",
  renderCandidates: candidates => candidates,
});
assert.equal(productAnnouncementTree.type, "ProductAnnouncements");
assert.equal(productAnnouncementTree.key, "work_tab");

const banners = await bundle("composer-banners", {
  "app-shared": `
    export const I3=()=>globalThis.__homeComposerRestored.jsx;
    export const e6=()=>({Suspense:"Suspense"}); export const Jm=()=>"TaskAnnouncementCandidates";
    export const ZI="scope"; export const LX=()=>({set(){}}); export const HX=()=>false;
    export const BX=()=>({data:{maxAgents:8}}); export const Y2="FormattedMessage";
  `,
  "app-initial": `
    export const dun=(key,fallback)=>({key,fallback}); export const jyt=()=>({cwd:"/repo",hostId:"local"});
    export const P6t=()=>({authMethod:"chatgpt"}); export const w8=()=>({data:{models:[{reasoningEffort:"ultra"}]}});
    export const wst="config"; export const n7="Banner";
  `,
  "app-primary": `
    export const Op="FullAccess"; export const Vf="CyberSafety"; export const om="DictationFirstUse"; export const Jp="WarningIcon";
    export const Tp=models=>models; export const Cp=input=>{globalThis.__homeComposerRestored.ultraConfig=input.config;return 8};
  `,
  "usage": `export const n=props=>({type:"UsageBanner",props}); export const t=()=>{};`,
  "composer-announcement-slot": `
    export const r=(id,content)=>({id,isEligible:content!=null,isLoading:false,content});
    export const t="ComposerAnnouncementSlot";
  `,
  "task-announcement-candidates": `export const TaskAnnouncementCandidates="TaskAnnouncementCandidates";`,
});
const homeBanners = banners.ComposerBanners({
  hostId: "local",
  environmentBanners: { showFullAccessWarning: true, windowsSandboxWarnings: "SandboxWarning" },
  safetyEvent: { id: "safety" },
  usageBannerProps: { model: "gpt" },
});
assert.equal(homeBanners.type, "ComposerAnnouncementSlot");
assert.equal(homeBanners.props.area, "home");
assert.deepEqual(homeBanners.props.candidates.map(candidate => candidate.id), [
  "windows-sandbox", "wsl-migration", "full-access", "cyber-safety", "codex-usage", "ultra-usage", "misalignment-policy", "safety-buffering", "dictation-first-use",
]);
assert.equal(homeBanners.props.candidates[2].isEligible, true);
const taskBanners = banners.ComposerBanners({ conversationId: "conversation-1", hostId: "local" });
assert.equal(taskBanners.type, "Suspense");
assert.equal(taskBanners.props.children.type, "TaskAnnouncementCandidates");
assert.equal(taskBanners.props.fallback.props.candidates.at(-1).id, "workspace-renewal-payment");
const ultraBanners = banners.ComposerBanners({
  conversationId: "conversation-1", hostId: "local", showUltraWarning: true, ultraWarningModel: "gpt-ultra",
});
const ultraCandidate = ultraBanners.props.children.props.candidates[5];
const ultraWarning = ultraCandidate.content.type(ultraCandidate.content.props);
assert.equal(ultraWarning.type, "Banner");
assert.deepEqual(globalThis.__homeComposerRestored.ultraConfig, { maxAgents: 8 });

const provider = await bundle("composer-provider", {
  "app-shared": `
    export const I3=()=>globalThis.__homeComposerRestored.jsx; export const ZI="app-scope";
    export const e6=()=>({
      useContext:()=>null, useRef:value=>({current:value}), useState:value=>[typeof value==="function"?value():value,()=>{}],
      useEffect:effect=>{globalThis.__homeComposerRestored.providerCleanup=effect()}, useLayoutEffect:()=>{},
    });
    export const LX=()=>globalThis.__homeComposerRestored.providerScope;
  `,
  "app-initial": `
    export const vW="ResponseSpacerContext"; export const yW=()=>{}; export const pht=()=>({mutate:id=>globalThis.__homeComposerRestored.events.push({mutated:id})});
    export const SHt=(scope,id,watching)=>globalThis.__homeComposerRestored.events.push({watching,id});
    export const wVt="response"; export const NSt="complete"; export const Z1t=id=>"key:"+id; export const LSt="source";
    export const K1t=(scope,key,value)=>globalThis.__homeComposerRestored.events.push({copied:[key,value]});
  `,
  "thread-scroll-controller-context-value": `export const n=()=>{}; export const r=()=>({});`,
});
let providerWatcher;
globalThis.__homeComposerRestored.providerScope = {
  get: (signal,key) => signal === "source" ? "source-value" : null,
  watch: callback => { providerWatcher = callback; return () => state.events.push({unwatched:true}); },
};
const providerTree = provider.t({ children: "ComposerChildren" });
assert.equal(providerTree.type, "ResponseSpacerContext");
assert.equal(providerTree.props.children, "ComposerChildren");
let storeUpdates = 0;
providerTree.props.value.subscribe(() => storeUpdates++);
const unregisterSpacer = providerTree.props.value.register({ id: "spacer" });
assert.equal(providerTree.props.value.getSnapshot().id, "spacer");
unregisterSpacer();
assert.equal(providerTree.props.value.getSnapshot(), null);
assert.equal(storeUpdates, 2);
assert.equal(provider.r({ conversationId: "conversation-2" }), null);
providerWatcher({ get: (signal,key) => signal === "response" ? "response-1" : signal === "complete" ? true : null });
assert.equal(state.events.some(event => event.mutated === "response-1"), true);
assert.deepEqual(state.events.find(event => event.copied)?.copied, ["key:response-1", "source-value"]);
globalThis.__homeComposerRestored.providerCleanup();
assert.equal(state.events.some(event => event.watching === false && event.id === "conversation-2"), true);

globalThis.__homeComposerRestored.scrollController = null;
const scrollContext = await bundle("thread-scroll-controller-context-value", {
  "app-shared": `export const e6=()=>({createContext:value=>({defaultValue:value}),use:()=>globalThis.__homeComposerRestored.scrollController});`,
});
scrollContext.n();
assert.deepEqual(scrollContext.t, { defaultValue: null });
assert.throws(() => scrollContext.r(), /must be used within ThreadScrollLayout/);
globalThis.__homeComposerRestored.scrollController = { scrollToBottom() {} };
assert.equal(scrollContext.r(), globalThis.__homeComposerRestored.scrollController);

assertReleaseOwner("thread-scroll-layout");

assertReleaseOwner("task-announcement-candidates");
console.log("home composer restored component tests passed");
