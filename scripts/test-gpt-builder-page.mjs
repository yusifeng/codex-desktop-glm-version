import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/gpt-builder-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const dependencies = new Set(
  [...source.matchAll(/(?:from|import(?:\s*\()?)\s*["']@rchunk\/([^"']+)/g)].map(
    (match) => match[1],
  ),
);
assert.deepEqual([...dependencies].sort(), [
  "app-initial",
  "app-primary",
  "app-shared",
  "chatgpt-conversation-transcript",
  "gpt-management-access",
  "rolldown-runtime",
  "security-tabs",
  "thread-scroll-layout",
]);
assert.doesNotMatch(source, /\bany\b/);
assert.doesNotMatch(
  source,
  /\b(?:appInitialChunk|appSharedChunk|transcriptChunk|managementAccessChunk|tabsChunk|threadScrollChunk)\s*\./,
);

function resource(overrides = {}) {
  const base = {
    files: [],
    gizmo: {
      default_model: "gpt-4o",
      display: {
        description: "A helpful draft",
        name: "Draft GPT",
        profile_picture_url: "https://example.test/avatar.png",
        prompt_starters: ["Help me"],
      },
      id: "gizmo-1",
      instructions: "Be useful",
      live_version: 0,
      short_url: "draft-gpt",
      training_disabled: false,
    },
    project_file_limits: { max_file_limit: 3 },
    tools: [{ type: "browser" }, { type: "image_gen" }],
  };
  return {
    ...base,
    ...overrides,
    gizmo: { ...base.gizmo, ...(overrides.gizmo ?? {}) },
  };
}

const state = {
  access: "allowed",
  account: { account: { structure: "personal" }, features: ["browsing_available"] },
  accountId: "account-1",
  effects: [],
  gets: [],
  getResult: resource(),
  getShouldFail: false,
  hookIndex: 0,
  hookValues: [],
  initializers: [],
  navigations: [],
  posts: [],
  postFailures: new Set(),
  search: "",
};
globalThis.__gptBuilderPageTest = state;

const mocks = {
  "rolldown-runtime": "export {};",
  "app-primary": "export {};",
  "app-shared": [
    "const s=globalThis.__gptBuilderPageTest;const mark=name=>()=>s.initializers.push(name);",
    "export const $3=mark('jsx');export const FX=mark('signals');export const K2=mark('intl');",
    "export const HX=()=>s.accountId;export const BX=()=>({data:s.account});",
    "export const Y2=({defaultMessage})=>defaultMessage;export const Yh='Button';",
    "export const I3=()=>({Fragment:'Fragment',jsx:(type,props,key)=>typeof type==='function'?type(props??{}):({type,props:props??{},key}),jsxs:(type,props,key)=>typeof type==='function'?type(props??{}):({type,props:props??{},key})});",
    "export const e6=()=>({useState(initial){const i=s.hookIndex++;if(!(i in s.hookValues))s.hookValues[i]=typeof initial==='function'?initial():initial;return[s.hookValues[i],next=>{s.hookValues[i]=typeof next==='function'?next(s.hookValues[i]):next}]},useRef(initial){const i=s.hookIndex++;if(!(i in s.hookValues))s.hookValues[i]={current:initial};return s.hookValues[i]},useEffect(effect,deps){const i=s.hookIndex++;const previous=s.effects[i];const changed=previous==null||deps.length!==previous.deps.length||deps.some((value,index)=>value!==previous.deps[index]);if(!changed)return;previous?.cleanup?.();const cleanup=effect();s.effects[i]={deps:[...deps],cleanup:typeof cleanup==='function'?cleanup:null}}});",
  ].join("\n"),
  "app-initial": [
    "const s=globalThis.__gptBuilderPageTest;",
    "const makeResource=(id,display={},instructions='')=>({files:[],gizmo:{default_model:'gpt-4o',display:{description:'',name:'',prompt_starters:[],...display},id,instructions,live_version:0,short_url:id,training_disabled:false},project_file_limits:{max_file_limit:3},tools:[{type:'browser'},{type:'image_gen'}]});",
    "export const Let='LoadingState';export const ket='ErrorState';export const mun='accountSignal';export const rE='/gpts/editor';export const ytn=id=>'/g/'+id;",
    "export const d_n=()=>[{get(name){return name==='gizmo'?new URLSearchParams(s.search).get('gizmo'):null}}];",
    "export const o_n=()=>((destination,options)=>s.navigations.push({destination,options}));",
    "export const rJt={safeGet:async(path,options)=>{s.gets.push({path,options});if(s.getShouldFail)throw new Error('load failed');return s.getResult},safePost:async(path,options)=>{s.posts.push({path,options});if(s.postFailures.has(path))throw new Error('request failed');if(path==='/gizmos'){const id=options.parameters?.query?.gizmo_id??'created-gpt';return makeResource(id,options.requestBody.display,options.requestBody.instructions)}if(path.includes('/promote')){const promoted=makeResource('created-gpt',{name:'Published GPT'});promoted.gizmo.short_url='published-gpt';return{resource:promoted,error:null}}if(path==='/files')return{file_id:'file-'+s.posts.length,name:options.requestBody.file.name};return{}}};",
  ].join("\n"),
  "gpt-management-access": [
    "const s=globalThis.__gptBuilderPageTest;const mark=name=>()=>s.initializers.push(name);",
    "export const i=mark('management-queries');export const n=mark('management-access');export const r='accountQuery';",
    "export const t=({loadingFallback,unavailableFallback,children})=>s.access==='loading'?loadingFallback:s.access==='unavailable'?unavailableFallback:children;",
  ].join("\n"),
  "security-tabs": "const s=globalThis.__gptBuilderPageTest;export const n=()=>s.initializers.push('tabs');export const t='Tabs';",
  "thread-scroll-layout": "const s=globalThis.__gptBuilderPageTest;export const n=()=>s.initializers.push('thread-scroll');export const t='ThreadScrollLayout';",
  "chatgpt-conversation-transcript": "const s=globalThis.__gptBuilderPageTest;export const n=()=>s.initializers.push('transcript');export const t='ConversationTranscript';",
};

const result = await esbuild.build({
  entryPoints: [sourcePath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
  plugins: [
    {
      name: "gpt-builder-page-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice(8),
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: moduleName }) => ({
          contents: mocks[moduleName] ?? "export {};",
          loader: "js",
        }));
      },
    },
  ],
});
const module = await import(
  "data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64")
);

let assertions = 3;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}
function reset() {
  for (const effect of state.effects) effect?.cleanup?.();
  state.access = "allowed";
  state.account = { account: { structure: "personal" }, features: ["browsing_available"] };
  state.accountId = "account-1";
  state.effects = [];
  state.gets = [];
  state.getResult = resource();
  state.getShouldFail = false;
  state.hookIndex = 0;
  state.hookValues = [];
  state.navigations = [];
  state.posts = [];
  state.postFailures = new Set();
  state.search = "";
}
function render() {
  state.hookIndex = 0;
  return module.GptBuilderPage();
}
function walk(value, output = []) {
  if (value == null || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    for (const item of value) walk(item, output);
    return output;
  }
  output.push(value);
  walk(value.props?.actions, output);
  walk(value.props?.content, output);
  walk(value.props?.children, output);
  walk(value.props?.title, output);
  return output;
}
function textContent(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textContent).join(" " );
  return [value.props?.title, value.props?.content, value.props?.children]
    .map(textContent)
    .join(" " );
}
function byType(view, type) {
  return walk(view).find((node) => node.type === type);
}
function control(view, label) {
  return walk(view).find((node) => node.props?.["aria-label"] === label);
}
function button(view, label) {
  return walk(view).find(
    (node) =>
      (node.type === "button" || node.type === "Button") &&
      textContent(node).trim() === label,
  );
}
async function tick() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
}

assert.deepEqual(Object.keys(module), ["GptBuilderPage"]);
assertions += 1;
check(state.initializers.length === 8 && new Set(state.initializers).size === 8, "initializes all static runtimes once");

reset();
state.accountId = null;
let view = render();
check(byType(view, "LoadingState")?.props.debugName === "GptBuilderAccount", "waits for account identity");

reset();
state.access = "loading";
view = render();
check(byType(view, "LoadingState")?.props.debugName === "GptBuilderAccess", "shows access loading state");

reset();
state.access = "unavailable";
view = render();
check(textContent(view).includes("GPT creation is unavailable for this account"), "shows unavailable access state");

reset();
view = render();
check(control(view, "Name").props.value === "", "starts a new draft with an empty name");
check(control(view, "Description").props.value === "" && control(view, "Instructions").props.value === "", "starts text fields empty");
check(control(view, "Web search").props.checked === true && control(view, "Image generation").props.checked === true, "enables default capabilities");
check(control(view, "Code Interpreter & Data Analysis").props.checked === false, "leaves data analysis disabled by default");
check(textContent(view).includes("Draft"), "labels a new unsaved draft");

control(view, "Name").props.onChange({ target: { value: "Research helper" } });
view = render();
check(control(view, "Name").props.value === "Research helper", "edits the GPT name");
check(byType(view, "main") != null && textContent(view).includes("Saving…"), "marks edited drafts as saving");

control(view, "Conversation starters").props.onChange({ target: { value: "First prompt\nSecond prompt" } });
view = render();
check(control(view, "Conversation starters").props.value === "First prompt\nSecond prompt", "edits conversation starters line by line");

control(view, "Name").props.onChange({ target: { value: "x".repeat(51) } });
view = render();
check(control(view, "Name").props["aria-invalid"] === true, "validates the 50 character name limit");
check(textContent(view).includes("Name must be 50 characters or fewer"), "renders the name validation message");
check(button(view, "Create").props.disabled === true, "blocks publishing invalid drafts");

reset();
state.account = { account: { structure: "workspace" }, features: [] };
view = render();
check(control(view, "Web search").props.disabled === true && control(view, "Web search").props.checked === false, "disables browsing when the workspace lacks access");

reset();
view = render();
byType(view, "Tabs").props.onSelect("preview");
view = render();
check(byType(view, "ThreadScrollLayout") != null && byType(view, "ConversationTranscript") != null, "renders the transcript preview");
byType(view, "Tabs").props.onSelect("create");
view = render();
check(textContent(view).includes("What would you like to make?"), "renders the conversational create panel");

reset();
view = render();
control(view, "Name").props.onChange({ target: { value: "Published helper" } });
view = render();
button(view, "Create").props.onClick();
await tick();
await tick();
check(state.posts[0].path === "/gizmos", "saves the draft before publishing");
check(state.posts[0].options.requestBody.display.name === "Published helper", "sends edited draft fields");
check(state.navigations[0].options.replace === true && String(state.navigations[0].destination.search).includes("gizmo=created-gpt"), "replaces the URL after first save");
check(state.posts[1].path === "/gizmos/{gizmo_id}/promote", "promotes the saved draft privately");
check(state.navigations.at(-1).destination === "/g/published-gpt", "opens the published GPT");

reset();
state.postFailures.add("/gizmos/{gizmo_id}/promote");
view = render();
control(view, "Name").props.onChange({ target: { value: "Failed publish" } });
view = render();
button(view, "Create").props.onClick();
await tick();
await tick();
view = render();
check(textContent(view).includes("Your GPT could not be published"), "shows publish failure without losing the saved draft");

reset();
view = render();
control(view, "Description").props.onChange({ target: { value: "Changed before leaving" } });
view = render();
control(view, "Back to GPTs").props.onClick();
await tick();
await tick();
check(state.posts[0].path === "/gizmos" && state.navigations.at(-1).destination === "/gpts", "flushes changes before navigating back");

reset();
state.search = "?gizmo=gizmo-1";
view = render();
check(byType(view, "LoadingState")?.props.debugName === "GptBuilderDraft", "shows loading while reopening a draft");
await tick();
view = render();
check(state.gets[0].path === "/gizmos/{gizmo_id_or_short_url}" && state.gets[0].options.parameters.query.draft === true, "loads the draft endpoint with draft mode");
check(control(view, "Name").props.value === "Draft GPT" && control(view, "Instructions").props.value === "Be useful", "hydrates existing draft fields");
check(button(view, "Update") != null && textContent(view).includes("Draft saved"), "labels an existing draft as saved");

reset();
state.search = "?gizmo=missing";
state.getShouldFail = true;
view = render();
await tick();
view = render();
check(textContent(view).includes("Couldn't load this GPT draft"), "shows draft load errors");
button(view, "Try again").props.onClick();
state.getShouldFail = false;
view = render();
await tick();
view = render();
check(state.gets.length === 2 && control(view, "Name").props.value === "Draft GPT", "retries failed draft loads");

reset();
state.search = "?gizmo=published";
state.getResult = resource({ gizmo: { live_version: 2 } });
render();
await tick();
view = render();
check(textContent(view).includes("This GPT is already published"), "rejects published GPTs from the creation route");

reset();
view = render();
control(view, "Upload files").props.onChange({
  target: { files: [{ name: "guide.pdf", size: 12, type: "application/pdf" }] },
});
await tick();
await tick();
view = render();
check(state.posts.some((request) => request.path === "/files"), "uploads knowledge files against the saved gizmo");
check(textContent(view).includes("guide.pdf"), "adds uploaded files to the draft");
control(view, "Remove guide.pdf").props.onClick();
view = render();
check(!textContent(view).includes("guide.pdf"), "removes knowledge files from the draft");

reset();
state.search = "?gizmo=gizmo-1";
state.getResult = resource({
  files: [{ file_id: "existing-file", file_response_type: "full_file_response", name: "existing.txt" }],
  project_file_limits: { max_file_limit: 1 },
});
render();
await tick();
view = render();
control(view, "Upload files").props.onChange({
  target: { files: [{ name: "too-many.txt", size: 3, type: "text/plain" }] },
});
view = render();
check(textContent(view).includes("knowledge file limit") && !state.posts.some((request) => request.path === "/files"), "enforces the account knowledge file limit");

console.log(assertions + " gpt builder page assertions passed");
