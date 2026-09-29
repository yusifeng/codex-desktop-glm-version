import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/browser-skill-editor/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const dependencies = new Set([...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"/]+)"/g)].map((match) => match[1]));
assert.deepEqual([...dependencies].sort(), ["app-initial", "app-primary", "app-shared", "browser-skill-files", "browser-skills-state", "chatgpt-code-block-editor", "file-rows", "pending-edits-dialog", "rolldown-runtime", "skill-share-dialog-runtime"]);
assert.doesNotMatch(source, /\bany\b/);
assert.doesNotMatch(source, /\b(?:appInitialChunk|appPrimaryChunk|appSharedChunk|codeEditorChunk|fileRowsChunk|browserSkillFilesChunk|browserSkillsStateChunk|pendingEditsChunk|shareDialogChunk)\s*\./);

const emptyDraft = { name: "", description: "", instructions: "", files: [] };
const validDraft = { name: "test-skill", description: "A useful skill", instructions: "Follow these steps", files: [] };
const skill = { id: "skill-1", name: "test-skill", description: "A useful skill", creator_id: "user-1", sediment_id: "sediment-1", files: { "SKILL.md": { start: 0, length: 10 } }, permissions: { can_read: true, can_write: true, can_export: true } };
const state = {
  skillId: undefined, identity: { accountId: "account-1", userId: "user-1", isWorkspace: false }, access: true, canCreate: true, canUpload: true,
  stateValues: [], stateIndex: 0, effects: false, setters: [], initializers: [], posts: [], gets: [], deletes: [], uploads: [], navigations: [], toasts: [], queryCalls: [], analytics: [], deleteRuntime: [], downloadShouldFail: false, duplicateError: null, blocker: { state: "unblocked", proceedCalls: 0, resetCalls: 0, proceed() { this.proceedCalls += 1; }, reset() { this.resetCalls += 1; } },
};
state.scope = { get(signal) { if (signal === "identity") return state.identity; if (signal === "access") return state.access; if (signal === "canCreate") return state.canCreate; if (signal === "canUpload") return state.canUpload; if (signal === "toast") return { success: (message) => state.toasts.push({ type: "success", message }), error: (message) => state.toasts.push({ type: "error", message }) }; return undefined; }, queryClient: { async cancelQueries(input) { state.queryCalls.push(["cancel", input]); }, setQueriesData(input, update) { state.queryCalls.push(["collections", input, update]); }, setQueryData(key, value) { state.queryCalls.push(["set", key, value]); }, async invalidateQueries(input) { state.queryCalls.push(["invalidate", input]); } } };
globalThis.__browserSkillEditorTest = state;
globalThis.window = { addEventListener() {}, removeEventListener() {} };
const marker = "const state=globalThis.__browserSkillEditorTest; const marker=name=>()=>state.initializers.push(name);";
const mocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [marker,
    "export const $3=marker('runtime'); export const FX=marker('signals'); export const K2=marker('ui'); export const Zh=marker('button');",
    "export const I3=()=>({Fragment:'Fragment',jsx:(type,props,key)=>({type,props,key}),jsxs:(type,props,key)=>({type,props,key})});",
    "export const e6=()=>({useId:()=> 'editor',useRef:value=>({current:value}),useEffect(effect){if(state.effects)effect();},useState(value){const index=state.stateIndex++;const fallback=typeof value==='function'?value():value;const selected=index<state.stateValues.length?state.stateValues[index]:fallback;return[selected,next=>state.setters.push({index,next})];}});",
    "export const LX=()=>state.scope; export const HX=signal=>signal==='identity'?state.identity:signal==='access'?state.access:undefined; export const n4=()=>({formatMessage:descriptor=>descriptor.defaultMessage}); export const Y2='FormattedMessage'; export const Yh='Button'; export const pk='toast';",
  ].join('\n'),
  "app-initial": [marker,
    "export const cJt=marker('api'); export const ypn=marker('analytics'); export const l_n=()=>({skillId:state.skillId}); export const o_n=()=>((destination,options)=>state.navigations.push({destination,options})); export const n_n=()=>state.blocker; export const xpn=(_scope,event,fields)=>state.analytics.push({event,fields});",
    "export const YRt=async(_scope,input)=>state.uploads.push(input); export const rJt={safeGet:async(path,options)=>{state.gets.push({path,options});return state.getResponse;},safePost:async(path,options)=>{state.posts.push({path,options});if(path==='/hazelnuts/draft'&&state.duplicateError)throw state.duplicateError;if(path==='/hazelnuts/draft')return{hazelnuts:[state.savedSkill??{...state.defaultSkill,id:'created-1'}]};if(path==='/hazelnuts/draft/uploads')return{uploads:[{file_id:'file-1',upload_url:'https://upload'}]};return{};},safeDelete:async(path,options)=>{state.deletes.push({path,options});return{};}};",
  ].join('\n'),
  "app-primary": "export {};",
  "chatgpt-code-block-editor": [marker, "export const n=marker('editor'); export const t='CodeEditor';"].join('\n'),
  "file-rows": "export const t=files=>files;",
  "browser-skill-files": [marker, "export const n=marker('files'); export const t=async()=>new TextEncoder().encode('instructions').buffer;"].join('\n'),
  "browser-skills-state": [marker, "export const n=marker('state'); export const c='canCreate'; export const d='identity'; export const l='canUpload'; export const s='access'; export const h=(skill,userId)=>skill.permissions?.can_write??skill.creator_id===userId;"].join('\n'),
  "pending-edits-dialog": [marker, "export const n=marker('pending'); export const t='PendingEditsDialog';"].join('\n'),
  "skill-share-dialog-runtime": [marker, "export const n=marker('share'); export const t='SkillShareDialog'; export const s='DuplicateSkillDialog'; export const l=error=>{try{return JSON.parse(error.message).detail.resolution??null}catch{return null}}; export const i=async()=>{if(state.downloadShouldFail)throw Error('download');}; export const r=async(_scope,skill)=>state.deleteRuntime.push(skill);"].join('\n'),
};
state.defaultSkill = skill;
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "browser-skill-editor-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ loader: "js", contents: mocks[importPath] ?? "export {};" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
let assertions = 3;
function check(value, message) { assert.ok(value, message); assertions += 1; }
function reset() { state.skillId=undefined;state.identity={accountId:"account-1",userId:"user-1",isWorkspace:false};state.access=true;state.canCreate=true;state.canUpload=true;state.stateValues=[];state.stateIndex=0;state.effects=false;state.setters=[];state.posts=[];state.gets=[];state.deletes=[];state.uploads=[];state.navigations=[];state.toasts=[];state.queryCalls=[];state.analytics=[];state.deleteRuntime=[];state.downloadShouldFail=false;state.duplicateError=null;state.savedSkill={...skill,id:"created-1"};state.blocker.state="unblocked";state.blocker.proceedCalls=0;state.blocker.resetCalls=0; }
function render(values=[]) { state.stateValues=values;state.stateIndex=0;return module.BrowserSkillEditor(); }
function flush() { return new Promise((resolve)=>setTimeout(resolve,0)); }
function fullState(overrides={}) { return [0,"ready",overrides.skill??null,overrides.baseline??emptyDraft,overrides.draft??emptyDraft,overrides.selectedId??null,overrides.selectedContent??null,overrides.selectedStatus??"ready",overrides.saving??false,overrides.deleting??false,overrides.downloading??false,overrides.downloadError??false,overrides.failure??null,overrides.duplicateResolution??null,overrides.shareOpen??false,overrides.leaveOpen??false,overrides.deleteOpen??false]; }
function header(root) { return root.props.children[0].props.children[0]; }
function layout(root) { return root.props.children[0].props.children[2]; }

check(Object.keys(module).join(",") === "BrowserSkillEditor", "preserves the sole public export");
check(state.initializers.includes("state") && state.initializers.includes("files") && state.initializers.includes("editor"), "initializes state, files, and code editor dependencies");
check(state.initializers.includes("pending") && state.initializers.includes("share"), "initializes pending-edits and sharing runtimes");

reset();state.identity=null;let root=render();check(root.props.children[0].props.children==="Loading skill…","hides the editor while identity loads");
reset();state.access=false;root=render();check(root.props.children[0].props.role==="alert"&&root.props.children[0].props.children.includes("aren't available"),"shows account access failure");
reset();state.skillId="skill-1";root=render(fullState({skill:null}).map((value,index)=>index===1?"error":value));check(root.props.children[0].props.children.includes("Couldn't load"),"shows load errors");root.props.children[1].props.onClick();check(state.setters.some((call)=>call.index===0&&typeof call.next==="function"),"retry advances the load version");

reset();root=render(fullState({draft:validDraft}));check(header(root).props.children[1].props.children==="Create skill","renders create mode");header(root).props.children.at(-1).props.onClick();await flush();check(state.posts.some((call)=>call.path==="/hazelnuts/draft"&&call.options.requestBody.name==="test-skill"),"posts a validated draft");check(state.toasts[0].type==="success"&&state.navigations[0].destination==="/skills/editor/created-1","toasts and replaces the route after creation");check(state.queryCalls.some((call)=>call[0]==="invalidate")&&state.analytics[0].event==="browser_skill_created","updates caches and records creation analytics");

reset();root=render(fullState({draft:{...validDraft,name:"Bad Name"}}));header(root).props.children.at(-1).props.onClick();check(state.setters.some((call)=>call.index===12&&call.next==="name"),"rejects invalid skill names before saving");check(state.posts.length===0,"does not call the API for invalid drafts");
reset();root=render(fullState({draft:{...validDraft,instructions:"   "}}));header(root).props.children.at(-1).props.onClick();check(state.setters.some((call)=>call.index===12&&call.next==="instructions"),"requires instructions");
reset();root=render(fullState({draft:{...validDraft,description:"x".repeat(501)}}));header(root).props.children.at(-1).props.onClick();check(state.setters.some((call)=>call.index===12&&call.next==="description"),"limits descriptions to 500 characters");
reset();const badPaths={...validDraft,files:[{id:"1",path:"../secret.txt",source:{kind:"text",content:"x"}}]};root=render(fullState({draft:badPaths}));header(root).props.children.at(-1).props.onClick();check(state.setters.some((call)=>call.index===12&&call.next==="paths"),"rejects unsafe relative paths");

reset();state.duplicateError=Error(JSON.stringify({detail:{resolution:"UPDATE_EXISTING"}}));root=render(fullState({draft:validDraft}));header(root).props.children.at(-1).props.onClick();await flush();check(state.setters.some((call)=>call.index===13&&call.next==="UPDATE_EXISTING"),"opens duplicate resolution after a conflict");root=render(fullState({draft:validDraft,duplicateResolution:"UPDATE_EXISTING"}));check(root.props.children[2].type==="DuplicateSkillDialog","renders the duplicate resolution dialog");
reset();state.duplicateError=Error("network");root=render(fullState({draft:validDraft}));header(root).props.children.at(-1).props.onClick();await flush();check(state.toasts[0].type==="error"&&state.setters.some((call)=>call.index===12&&call.next==="save"),"preserves edits and reports save failures");

reset();const localFile=new File(["hello"],"notes.txt",{type:"text/plain"});const draftWithLocal={...validDraft,files:[{id:"local",path:"notes.txt",source:{kind:"local",file:localFile}}]};root=render(fullState({draft:draftWithLocal}));header(root).props.children.at(-1).props.onClick();await flush();check(state.posts.some((call)=>call.path==="/hazelnuts/draft/uploads")&&state.uploads.length===1,"uploads local supporting files before saving");check(state.posts.find((call)=>call.path==="/hazelnuts/draft").options.requestBody.files[0].path==="notes.txt","includes completed upload references in the draft");

reset();root=render(fullState({baseline:emptyDraft,draft:validDraft}));header(root).props.children[0].props.onClick();check(state.setters.some((call)=>call.index===15&&call.next===true),"prompts before leaving a dirty draft");root=render(fullState({baseline:emptyDraft,draft:validDraft,leaveOpen:true}));check(root.props.children[3].type==="PendingEditsDialog"&&root.props.children[3].props.open===true,"renders the unsaved changes dialog");root.props.children[3].props.onConfirm();check(state.navigations[0].destination==="/skills","discarding edits returns to Skills");

reset();state.identity.isWorkspace=true;root=render(fullState({skill,baseline:validDraft,draft:{...validDraft,description:"changed"},shareOpen:true}));check(header(root).props.children[2].props.children==="Share"&&root.props.children[1].type==="SkillShareDialog","shows workspace sharing controls");
reset();const readOnly={...skill,permissions:{...skill.permissions,can_write:false}};root=render(fullState({skill:readOnly,baseline:validDraft,draft:validDraft}));check(root.props.children[0].props.children[1].props.children.includes("permission"),"explains read-only skills");check(header(root).props.children.at(-1).props.disabled===true,"disables save without write permission");

reset();root=render(fullState({skill,baseline:validDraft,draft:validDraft,deleteOpen:true}));const deleteDialog=root.props.children[4];check(deleteDialog.type==="dialog"&&deleteDialog.props.open===true,"opens delete confirmation for editable skills");deleteDialog.props.children.props.onSubmit({preventDefault(){}});await flush();check(state.deletes[0].options.parameters.path.hazelnut_id==="skill-1"&&state.deleteRuntime[0].id==="skill-1","deletes through the API and shared cache runtime");check(state.navigations[0].options.replace===true,"replaces navigation after deletion");

reset();state.downloadShouldFail=true;root=render(fullState({skill,baseline:validDraft,draft:validDraft}));header(root).props.children[3].props.onClick();await flush();check(state.setters.some((call)=>call.index===11&&call.next===true),"reports archive download failures");

reset();const textFile={id:"text",path:"notes.md",source:{kind:"text",content:"hello"}};root=render(fullState({draft:{...validDraft,files:[textFile],},selectedId:"text"}));const content=layout(root).props.children[1];check(content.props.children.some((child)=>child?.type==="CodeEditor"&&child.props.code==="hello"),"edits selected text files in the code editor");const aside=layout(root).props.children[0];aside.props.children[1].props.onClick();check(state.setters.some((call)=>call.index===4&&call.next.files.length===2),"adds a new text file");aside.props.children[4].props.children[1].props.onClick();check(state.setters.some((call)=>call.index===4&&call.next.files.length===0),"removes supporting files from the draft");
reset();const binary={id:"binary",path:"image.png",source:{kind:"local",file:new File(["x"],"image.png")}};root=render(fullState({draft:{...validDraft,files:[binary]},selectedId:"binary"}));check(layout(root).props.children[1].props.children.some((child)=>child?.props?.children==="Use the file menu to download and view this file"),"keeps binary supporting files read-only");

console.log(`${assertions} Browser Skill editor assertions passed`);
