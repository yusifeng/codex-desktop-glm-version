import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/hotkey-window-home-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const dependencies = new Set([...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"/]+)"/g)].map((match) => match[1]));
assert.deepEqual([...dependencies].sort(), [
  "app-initial", "app-primary", "app-shared", "rolldown-runtime",
  "use-floating-window-pointer-interactivity", "use-hotkey-window-dismiss-on-escape", "worktree-environment-dropdown",
]);
assert.doesNotMatch(source, /\bany\b/);
assert.doesNotMatch(source, /\b(?:appInitialChunk|appPrimaryChunk|appSharedChunk|floatingPointerChunk|hotkeyDismissChunk|environmentDropdownChunk)\s*\./);

const state = {
  activeRoots: ["/repo"], localProjects: {}, selectedRemote: null, remoteProjects: {}, hostConfigs: { local: { id: "local" } },
  gitRoot: "/repo", gitLoading: false, codexHome: "/Users/test/.codex", worktreesEnabled: true, availabilityLoading: false, cloudReason: null, mode: "local", defaultProjectless: false,
  selectedProject: { type: "local", projectId: "project-1" }, identity: { authMethod: "chatgpt" },
  location: { pathname: "/", search: "", hash: "", state: null },
  environments: { environments: [], isLoading: false, isFetching: false, error: null, resolvedConfigPath: null, repairConfigPath: null, updateSelection(value) { state.environmentSelections.push(value); } },
  pointerInteractive: false, reducedMotion: false, refValues: [], refIndex: 0, stateValues: [], stateIndex: 0, executeLayout: false, layoutEffects: [],
  initializers: [], derivedResolver: null, pointerOptions: null, dismissCalls: 0, messageHandler: null, setStateCalls: [],
  navigations: [], modeChanges: [], startingChanges: [], commands: [], hotkeys: [], bridgeMessages: [], environmentSelections: [],
  dragStarts: [], dragMoves: 0, dragEnds: 0, layouts: [], pointerChanges: [], opens: [], taskCalls: [], gitCalls: [],
};
state.scope = { get(signal, parameter) {
  if (signal === "activeRoots") return state.activeRoots;
  if (signal === "localProjects") return state.localProjects;
  if (signal === "selectedRemote") return state.selectedRemote;
  if (signal === "remoteFamily") return parameter == null ? null : state.remoteProjects[parameter] ?? null;
  if (signal === "hostConfigFamily") return state.hostConfigs[parameter] ?? { id: parameter };
  if (signal === "gitRootFamily") return { data: state.gitRoot == null ? null : { root: state.gitRoot }, isLoading: state.gitLoading };
  if (signal === "codexHomeFamily") return { data: { codexHome: state.codexHome } };
  if (signal === "gateFamily") return state.worktreesEnabled;
  if (signal === "availabilityLoading") return state.availabilityLoading;
  if (signal === "cloudAccess") return true;
  if (signal === "reviewComposer") return false;
  if (signal === "modeFamily") return state.mode;
  return undefined;
} };
globalThis.__hotkeyHomeTest = state;

const marker = "const state=globalThis.__hotkeyHomeTest; const marker=name=>()=>state.initializers.push(name);";
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [marker,
    "export const $3=marker('runtime'); export const Ef=marker('popover'); export const FX=marker('signals'); export const If=marker('icons'); export const K2=marker('ui'); export const QT=marker('commands'); export const W3=marker('paths'); export const Zh=marker('button'); export const _u=marker('menu'); export const c_=marker('tooltip'); export const jO=marker('scope-tools'); export const lD=marker('mode-icons'); export const wL=marker('window'); export const xD=marker('host');",
    "export const $T='localIcon'; export const AO='worktreeIcon'; export const cD='cloudIcon'; export const bD='checkIcon'; export const Y2='FormattedMessage'; export const Yh='Button'; export const Cf='PopoverContent'; export const Tf='PopoverTrigger'; export const gu='IconButton'; export const kf='Dropdown'; export const xf='Popover'; export const o_='Tooltip'; export const jf={Item:'MenuItem'};",
    "export const I3=()=>({Fragment:'Fragment',jsx:(type,props,key)=>({type,props,key}),jsxs:(type,props,key)=>({type,props,key})});",
    "export const e6=()=>({useRef(value){const i=state.refIndex++; return {current:i<state.refValues.length?state.refValues[i]:value};},useState(value){const i=state.stateIndex++; const selected=i<state.stateValues.length?state.stateValues[i]:value; return [selected,next=>state.setStateCalls.push({i,next})];},useEffect(effect){effect();},useLayoutEffect(effect){state.layoutEffects.push(effect); if(state.executeLayout) effect();}});",
    "export const n4=()=>({formatMessage:(descriptor,values)=>values?.project?descriptor.defaultMessage.replace('{project}',String(values.project)):descriptor.defaultMessage}); export const LX=()=>state.scope; export const HX=signal=>signal==='selectedProject'?state.selectedProject:signal;",
    "export const rZ=(_scope,resolver)=>{state.derivedResolver=resolver; return {resolver};}; export const BX=(family,parameter)=>family.resolver(parameter,{get:state.scope.get,scope:state.scope}); export const l3=(left,right)=>JSON.stringify(left)===JSON.stringify(right);",
    "export const K3=(_name,handler)=>{state.messageHandler=handler;}; export const G3={dispatchMessage:(name,payload)=>state.bridgeMessages.push({name,payload})}; export const CH=value=>'encoded-'+value; export const UB=value=>'/thread/'+value;",
  ].join('\n'),
  "app-initial": [marker,
    "export const Bfn=marker('settings'); export const Dht=marker('home-state'); export const E=marker('permissions'); export const Evt=marker('routing'); export const Fht=marker('scope-key'); export const M6t=marker('models'); export const Qgn=marker('identity'); export const Rht=marker('git'); export const Vcn=marker('environment'); export const Yln=marker('task-options'); export const _cn=marker('remote'); export const aW=marker('project'); export const jst=marker('commands'); export const mnt=marker('services'); export const pfn=marker('gate'); export const rW=marker('mode'); export const x3=marker('starting-state'); export const xlt=marker('host-config'); export const xvt=marker('reset'); export const yb=marker('open');",
    "export const pcn='activeRoots'; export const vcn='localProjects'; export const Ecn='selectedRemote'; export const Scn='remoteFamily'; export const jcn='hostConfigFamily'; export const mcn='codexHomeFamily'; export const mfn='gateFamily'; export const vfn='availabilityLoading'; export const Q4='modeFamily'; export const Oht='selectedProject'; export const I4={type:'branch',branchName:'main'}; export const R4=null; export const l3=null; export const kht='workspaceScope';",
    "export const N6t=()=>state.identity; export const i_n=()=>state.location; export const o_n=()=>((destination,options)=>state.navigations.push({destination,options})); export const Bcn=()=>state.defaultProjectless;",
    "export const kst=input=>({key:input.cwd??'projectless',...input}); export const j3=(_scope,_key,mode)=>state.modeChanges.push(mode); export const A3=(_scope,value,key)=>state.startingChanges.push({value,key}); export const y3=(...values)=>({values});",
    "export const rpt=()=>state.environments; export const Slt=()=>state.reducedMotion; export const Fb=(project,label)=>label??project?.split('/').at(-1)??null; export const Ww=input=>'/settings/local-environments/'+(input.configPath||'default'); export const Ki=command=>state.commands.push(command);",
    "export const C='PermissionsDropdown'; export const iW='LocalIcon'; export const nW='WorktreeIcon'; export const vb='CloudIcon'; export const ugn='local'; export const pnt={hotkeyWindowHotkeys:{homeDragStart:input=>state.dragStarts.push(input),homeDragMove:()=>state.dragMoves++,homeDragEnd:()=>state.dragEnds++,homeLayoutChanged:input=>state.layouts.push(input),homePointerInteractionChanged:input=>state.pointerChanges.push(input),open:input=>state.opens.push(input)}};",
  ].join('\n'),
  "app-primary": [marker,
    "export const Cf=marker('primary-popover'); export const Dn=marker('project-select'); export const Ns=marker('slash'); export const dt=marker('analytics'); export const ko=marker('layout'); export const l=marker('project-name'); export const rg=marker('mode-state'); export const sg=marker('permissions'); export const zo=marker('composer'); export const eg=marker('worktree'); export const fg=marker('cloud');",
    "export const Qh='gitRootFamily'; export const dg='cloudAccess'; export const lg='reviewComposer'; export const Oo='ComposerSurface'; export const ut='Composer'; export const ug='Chrome'; export const c='ProjectPicker';",
    "export const ig=input=>input.supportsCloud?state.cloudReason:(state.cloudReason??'unsupported'); export const ng=input=>input.composerMode==='cloud'&&input.cloudUnavailableReason?'local':input.composerMode==='worktree'&&!input.isWorktreeAvailable?'local':input.composerMode;",
    "export const kn=(root,options)=>{state.gitCalls.push({root,options}); return {gitRoot:root?root+'/.worktree':null};}; export const wf=(root,config,source,options)=>{state.taskCalls.push({root,config,source,options}); return {data:{task:true}};}; export const Nt=input=>state.modeChanges.push(input.composerMode==='local'?'worktree':'local'); export const Ps=(command,callback,options)=>state.hotkeys.push({command,callback,options});",
  ].join('\n'),
  "use-floating-window-pointer-interactivity": [marker,"export const t=marker('pointer-init'); export const n=options=>{state.pointerOptions=options; return state.pointerInteractive;};"].join('\n'),
  "use-hotkey-window-dismiss-on-escape": [marker,"export const n=marker('dismiss-init'); export const t=()=>{state.dismissCalls++;};"].join('\n'),
  "worktree-environment-dropdown": [marker,"export const n=marker('environment-all'); export const c=marker('starting-init'); export const i=marker('branch-init'); export const o=marker('label-init'); export const r='BranchSwitcher'; export const s='StartingStateDropdown'; export const t='EnvironmentDropdown';"].join('\n'),
};

const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "hotkey-home-mocks", setup(build) {
  build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
  build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ loader: "js", contents: mocks[importPath] ?? "export {};" }));
} }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));

let assertions = 3;
function check(value, message) { assert.ok(value, message); assertions += 1; }
function reset() {
  state.activeRoots=["/repo"]; state.localProjects={}; state.selectedRemote=null; state.remoteProjects={}; state.hostConfigs={local:{id:"local"}}; state.gitRoot="/repo"; state.gitLoading=false; state.codexHome="/Users/test/.codex"; state.worktreesEnabled=true; state.availabilityLoading=false; state.cloudReason=null; state.mode="local"; state.defaultProjectless=false; state.selectedProject={type:"local",projectId:"project-1"}; state.identity={authMethod:"chatgpt"}; state.location={pathname:"/",search:"",hash:"",state:null};
  state.environments={environments:[],isLoading:false,isFetching:false,error:null,resolvedConfigPath:null,repairConfigPath:null,updateSelection(value){state.environmentSelections.push(value);}}; state.pointerInteractive=false; state.reducedMotion=false; state.refValues=[]; state.refIndex=0; state.stateValues=[]; state.stateIndex=0; state.executeLayout=false; state.layoutEffects=[]; state.pointerOptions=null; state.dismissCalls=0; state.messageHandler=null; state.setStateCalls=[]; state.navigations=[]; state.modeChanges=[]; state.startingChanges=[]; state.commands=[]; state.hotkeys=[]; state.bridgeMessages=[]; state.environmentSelections=[]; state.dragStarts=[]; state.dragMoves=0; state.dragEnds=0; state.layouts=[]; state.pointerChanges=[]; state.opens=[]; state.taskCalls=[]; state.gitCalls=[];
}
function render() { state.refIndex=0; state.stateIndex=0; return module.HotkeyWindowHomePage(); }
function shell(root) { return root.props.children[1]; }
function composer(root) { return shell(root).props.children[2].props.children.props.children; }
function menuRows(root) { return composer(root).props.hotkeyWindowHomeFooterControls.props.children[1].props.children.props.children; }
function renderRow(row) { return row.type(row.props); }

check(Object.keys(module).join(",") === "HotkeyWindowHomePage", "preserves the sole public export");
check(state.initializers.length >= 35, "runs the published dependency initializers");
check(state.initializers.includes("pointer-init") && state.initializers.includes("dismiss-init") && state.initializers.includes("environment-all"), "initializes all three semantic helper chunks");

reset();
let root = render();
check(composer(root).props.defaultCwd === "/repo", "uses active workspace as composer cwd");
check(composer(root).props.placeholderText.includes("repo"), "local placeholder includes the project label");
check(composer(root).props.composerModeAvailability.isWorktreeAvailable === true, "enables worktrees for git projects outside Codex home");
check(state.taskCalls[0].source === "hotkey_window_home_page", "loads worktree task options with the published source");
check(state.dismissCalls === 1 && state.pointerOptions.includeInteractiveRegion === true, "activates escape dismissal and pointer interactivity");
state.pointerOptions.onInteractiveChange(true);
check(state.pointerChanges[0].isInteractive === true, "forwards pointer interaction state to the host");
composer(root).props.onLocalConversationCreated("conversation-1");
check(state.opens[0].path === "/thread/conversation-1", "opens created conversations inside Quick Chat");

reset(); state.defaultProjectless=true; state.activeRoots=null; state.selectedProject=null;
root=render();
check(composer(root).props.defaultCwd === "~" && composer(root).props.selectedProject === null, "supports projectless local composer mode");
check(composer(root).props.placeholderText === "Ask ChatGPT anything locally", "uses projectless placeholder");
const projectlessModeRow=renderRow(menuRows(root)[1]);
check(projectlessModeRow.props.children[1].props.children.props.disabledTooltipText.includes("Standalone chats"), "explains why projectless mode cannot switch execution target");

reset(); state.location.state={project:{type:"remote",projectId:"remote-1"}}; state.remoteProjects["remote-1"]={projectId:"remote-1",hostId:"host-1",remotePath:"/remote/repo",label:"Remote Repo"}; state.hostConfigs["host-1"]={id:"host-1"}; state.gitRoot="/remote/repo"; state.mode="cloud";
root=render();
check(composer(root).props.defaultCwd === "~" && composer(root).props.selectedProject.projectId === "remote-1", "routes remote projects through selectedProject instead of a local cwd");
check(composer(root).props.placeholderText === "Ask ChatGPT anything locally in Remote Repo", "falls remote projects back to local execution when cloud is unavailable");
check(menuRows(root)[4] !== null, "keeps permissions mode visible after the local fallback");
const projectRow=renderRow(menuRows(root)[0]);
projectRow.props.children[1].props.children.props.onProjectSelected({type:"local",projectId:"next"});
check(state.navigations[0].options.replace === true && state.navigations[0].options.state.project.projectId === "next", "persists project selection in route state");

reset(); state.mode="worktree"; state.environments={environments:[{configPath:"env.toml",name:"Dev"}],isLoading:false,isFetching:false,error:null,resolvedConfigPath:"env.toml",repairConfigPath:null,updateSelection(value){state.environmentSelections.push(value);}};
root=render();
check(menuRows(root)[2] != null && menuRows(root)[3] != null, "shows environment and branch rows in worktree mode");
const environmentRow=renderRow(menuRows(root)[2]);
check(environmentRow.props.children[1].props.children.type === "EnvironmentDropdown" && environmentRow.props.children[1].props.children.props.selectedConfigPath === "env.toml", "wires selected worktree environment");
environmentRow.props.children[1].props.children.props.onSelectConfigPath(null);
check(state.environmentSelections[0] === null, "updates the worktree environment selection");
const branchRow=renderRow(menuRows(root)[3]);
branchRow.props.children[1].props.children.props.setStartingState({type:"branch",branchName:"feature"});
check(state.startingChanges[0].value.branchName === "feature", "updates worktree starting state");
const commandsNode=shell(root).props.children[1]; commandsNode.type(commandsNode.props);
check(state.hotkeys[0].command === "composer.toggleWorktreeMode" && state.commands.length === 2, "registers mode hotkey and slash commands");
await state.commands.find((command)=>command.id==="local").onSelect();
check(state.modeChanges.at(-1) === "local", "slash command switches composer mode");

reset(); state.gitRoot=null;
root=render();
check(composer(root).props.composerModeAvailability.isWorktreeAvailable === false, "disables worktrees for gitless local projects");
const gitlessModeRow=renderRow(menuRows(root)[1]);
check(gitlessModeRow.props.children[1].props.children.props.disabledTooltipText.includes("Initialize a git repo"), "explains gitless mode restriction");

reset();
root=render(); const dragShell=shell(root);
const pointerTarget={closest:()=>null}; let prevented=0; let captured=0; let released=0; const currentTarget={contains:()=>true,getBoundingClientRect:()=>({top:20,left:10,width:500,height:120}),setPointerCapture:()=>captured++,hasPointerCapture:()=>true,releasePointerCapture:()=>released++};
globalThis.getComputedStyle=()=>({getPropertyValue:()=>" #123456 "});
const event={button:0,clientX:15,clientY:25,currentTarget,pointerId:7,preventDefault:()=>prevented++,target:pointerTarget};
dragShell.props.onPointerDown(event); dragShell.props.onPointerMove(event); dragShell.props.onPointerUp(event);
check(prevented===1 && captured===1 && released===1, "captures and releases the primary drag pointer");
check(state.dragStarts[0].guideColor==="#123456" && state.dragMoves===1 && state.dragEnds===1, "forwards drag start, move, and end to the host");
dragShell.props.onPointerDown({...event,pointerId:8,target:{closest:()=>({})}});
check(state.dragStarts.length===1, "does not drag from interactive controls");

reset(); state.pointerInteractive=true; state.executeLayout=true;
const outer={contains:()=>true,getBoundingClientRect:()=>({top:0,left:0,width:600,height:400})}; const layoutShell={contains:()=>true,getBoundingClientRect:()=>({top:200,left:40,width:520,height:100})}; state.refValues=[outer,layoutShell,null,null];
globalThis.window={getComputedStyle:()=>({paddingBottom:"20px"}),requestAnimationFrame(callback){callback();return 1;},cancelAnimationFrame(){}}; globalThis.document={body:{},querySelectorAll:()=>[{getBoundingClientRect:()=>({top:150,left:0,width:10,height:10})}]}; globalThis.ResizeObserver=class{constructor(callback){this.callback=callback;}observe(){}disconnect(){}}; globalThis.MutationObserver=class{constructor(callback){this.callback=callback;}observe(){}disconnect(){}};
root=render();
check(state.layouts[0].minimumComposerTopInsetPx===50 && state.layouts[0].restingComposerTopInsetPx===280, "reports floating-aware composer layout metrics");
check(state.layouts[0].composerLeftInsetPx===40 && state.layouts[0].composerWidthPx===520, "reports composer horizontal layout metrics");
state.messageHandler({topInsetPx:72});
check(state.setStateCalls.at(-1).next===72, "applies host-provided composer top inset");
assertReleaseOwner("worktree-environment-dropdown");

console.log(`${assertions} Hotkey window home assertions passed`);
