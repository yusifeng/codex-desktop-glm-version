import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/images-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const dependencies = new Set(
  [...source.matchAll(/(?:from|import)\s+"@rchunk\/([^"/]+)"/g)].map(
    (match) => match[1],
  ),
);

assert.deepEqual([...dependencies].sort(), [
  "app-initial",
  "app-primary",
  "app-shared",
  "image-suggestions-core",
  "rolldown-runtime",
  "use-chatgpt-composer-controller",
]);
assert.doesNotMatch(source, /\bany\b/);
assert.doesNotMatch(
  source,
  /\b(?:appInitialChunk|appPrimaryChunk|appSharedChunk|suggestionsChunk|composerControllerChunk)\s*\./,
);

const selection = {
  item: {
    id: "prompt-1",
    action: { input_requirements: { source: "styles" }, strategy: "auto_send" },
  },
  group: { id: "group-1", presentation: "image_card" },
};

const state = {
  accountConversation: { conversationId: "conversation-1" },
  accountId: "account-1",
  conversationId: "conversation-1",
  controller: { id: "controller-1" },
  fileUploads: [],
  initializers: [],
  inputModes: ["picture_v2"],
  marked: [],
  navigations: [],
  newAccountConversation: { conversationId: "conversation-2" },
  resets: [],
  selection,
  setCalls: [],
  stateIndex: 0,
  stateSetCalls: [],
  stateValues: [],
  userId: "user-1",
};

state.scope = {
  get(signal, parameter) {
    if (signal === "selection") return state.selection;
    if (signal === "accountConversation") return state.accountConversation;
    if (signal === "imageInputModes") return state.inputModes;
    throw new Error("Unexpected signal read: " + String(signal) + ":" + String(parameter));
  },
  set(signal, first, second) {
    state.setCalls.push({ signal, first, second });
    if (signal === "accountConversation") state.accountConversation = second;
  },
};

globalThis.__imagesPageTest = state;

const mocks = {
  "app-shared": [
    "const state = globalThis.__imagesPageTest;",
    "const mark = name => () => state.initializers.push(name);",
    "export const $3 = mark('compiler'); export const FX = mark('maitai');",
    "export const K2 = mark('intl'); export const QI = mark('scope-runtime');",
    "export const ZI = 'globalScope'; export const UX = 'ScopeProvider'; export const Y2 = 'FormattedMessage';",
    "export const HX = signal => signal === 'accountId' ? state.accountId : state.userId;",
    "export const BX = family => family === 'imageConversationId' ? state.conversationId : state.selection;",
    "export const LX = () => state.scope;",
    "export const I3 = () => ({ jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) });",
    "export const e6 = () => ({ useRef: value => ({ current: value }), useState(value) { const index = state.stateIndex++; const selected = index < state.stateValues.length ? state.stateValues[index] : value; return [selected, next => state.stateSetCalls.push({ index, next })]; } });",
    "export const n4 = () => ({ formatMessage: descriptor => descriptor.defaultMessage });",
  ].join("\n"),
  "app-initial": [
    "const state = globalThis.__imagesPageTest;",
    "const mark = name => () => state.initializers.push(name);",
    "export const NIt = 'imageInputModes'; export const _un = 'userId'; export const mun = 'accountId';",
    "export const kht = 'imagesScope'; export const lT = 'PageLayout';",
    "export const Qgn = mark('auth-url'); export const RIt = mark('image-conversation');",
    "export const Rht = mark('images-runtime'); export const Sun = mark('thread-routing');",
    "export const uT = mark('composer-runtime'); export const vln = mark('conversation-runtime');",
    "export const gln = conversation => '/conversation/' + conversation.id;",
    "export const o_n = () => destination => state.navigations.push(destination);",
  ].join("\n"),
  "app-primary": [
    "const state = globalThis.__imagesPageTest;",
    "const mark = name => () => state.initializers.push(name);",
    "export const H = 'FileDropZone'; export const Oo = 'ComposerPlacement'; export const Ui = 'Composer';",
    "export const U = mark('file-drop-zone'); export const Wi = mark('composer');",
    "export const au = mark('composer-placement'); export const ko = mark('page-layout');",
    "export const tu = 'selection';",
    "export const ru = (_scope, conversationId) => state.resets.push(conversationId);",
    "export const su = (_scope, conversationId, controller, selected) => state.fileUploads.push({ conversationId, controller, selected });",
  ].join("\n"),
  "use-chatgpt-composer-controller": [
    "const state = globalThis.__imagesPageTest;",
    "export const t = () => state.initializers.push('composer-controller');",
    "export const n = input => ({ ...state.controller, input });",
  ].join("\n"),
  "image-suggestions-core": [
    "const state = globalThis.__imagesPageTest;",
    "export const c = () => state.initializers.push('image-conversation-family');",
    "export const r = () => state.initializers.push('suggestion-queries');",
    "export const n = () => state.initializers.push('suggestions');",
    "export const s = 'imageConversationId'; export const o = 'accountConversation'; export const t = 'ImageSuggestions';",
    "export const a = () => state.newAccountConversation;",
    "export const i = (_scope, item, group, imageSendUuid) => state.marked.push({ item, group, imageSendUuid });",
  ].join("\n"),
  "rolldown-runtime": "export {};",
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
      name: "images-page-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({
          path: importPath.slice("@rchunk/".length),
          namespace: "mock",
        }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({
          loader: "js",
          contents: mocks[importPath] ?? "export {};",
        }));
      },
    },
  ],
});

const imagesPage = await import(
  "data:text/javascript;base64," +
    Buffer.from(result.outputFiles[0].text).toString("base64")
);

let assertions = 3;
function check(value, message) {
  assert.ok(value, message);
  assertions += 1;
}

function reset() {
  state.accountConversation = { conversationId: "conversation-1" };
  state.accountId = "account-1";
  state.conversationId = "conversation-1";
  state.fileUploads = [];
  state.inputModes = ["picture_v2"];
  state.marked = [];
  state.navigations = [];
  state.newAccountConversation = { conversationId: "conversation-2" };
  state.resets = [];
  state.selection = selection;
  state.setCalls = [];
  state.stateIndex = 0;
  state.stateSetCalls = [];
  state.stateValues = [];
  state.userId = "user-1";
}

function renderPage() {
  state.stateIndex = 0;
  const root = imagesPage.ImagesPage();
  const accountPage = root.type(root.props);
  const contentNode = accountPage.props.children;
  const layout = contentNode.type(contentNode.props);
  return { root, accountPage, contentNode, layout };
}

function composerProps(layout) {
  return layout.props.children.props.children[0].props.children.props.children.props.children.props;
}

function suggestionProps(layout) {
  return layout.props.children.props.children[1].props;
}

function dropZoneProps(layout) {
  return layout.props.children.props.children[0].props.children.props;
}

check(
  Object.keys(imagesPage).length === 1 && typeof imagesPage.ImagesPage === "function",
  "keeps ImagesPage as the only public export",
);
check(
  state.initializers.length === 18 && new Set(state.initializers).size === 18,
  "runs every published dependency initializer once",
);

reset();
const first = renderPage();
check(first.root.key === '["account-1","user-1"]', "keys the page by account and user identity");
check(first.root.props.accountKey === '["account-1","user-1"]', "passes the serialized account key");
check(first.accountPage.type === "ScopeProvider", "provides the Images conversation scope");
check(first.accountPage.props.scope === "imagesScope", "uses the published Images scope");
check(first.accountPage.props.value.kind === "chatgpt", "marks the scoped route as ChatGPT");
check(first.accountPage.props.value.conversationId === "conversation-1", "scopes the generated conversation");
check(first.contentNode.key === "conversation-1", "keys content by conversation ID");
check(first.layout.type === "PageLayout", "renders the shared page layout");
check(first.layout.props.headerVariant === "compact", "uses the compact page header");
check(first.layout.props.animateContentLayout === false, "disables page content animation");
check(first.layout.props.title.props.defaultMessage === "Images", "renders the Images title");

const firstComposer = composerProps(first.layout);
check(firstComposer.conversationId === "conversation-1", "connects composer to the generated conversation");
check(firstComposer.composerController.input.conversationId === "conversation-1", "creates a conversation composer controller");
check(firstComposer.composerLayoutMode === "multiline", "uses multiline composer layout");
check(firstComposer.placeholder === "Describe an image", "localizes the image prompt placeholder");
check(firstComposer.showError === true, "enables composer error presentation");
check(dropZoneProps(first.layout).disabled === true, "keeps file dropping disabled until composer readiness");
check(suggestionProps(first.layout).disabled === true, "keeps suggestions disabled until composer readiness");

reset();
const droppedFiles = { files: ["reference.png"] };
let forwardedFiles = null;
const composerHandle = { canOpenImagePicker: true };
state.stateValues = [
  composerHandle,
  { disabled: false, onFilesDropped: (files) => { forwardedFiles = files; } },
];
const ready = renderPage();
check(dropZoneProps(ready.layout).disabled === false, "enables the drop zone from composer state");
dropZoneProps(ready.layout).onFilesDropped(droppedFiles);
check(forwardedFiles === droppedFiles, "forwards dropped files to the composer target");
check(suggestionProps(ready.layout).composer === composerHandle, "passes the live composer to suggestions");
check(suggestionProps(ready.layout).disabled === false, "enables suggestions with the composer target");

reset();
state.selection = null;
const noSelection = renderPage();
check(composerProps(noSelection.layout).getMessageMetadata === undefined, "omits suggestion metadata without a selection");

reset();
const tracked = renderPage();
const trackedComposer = composerProps(tracked.layout);
const metadata = trackedComposer.getMessageMetadata();
check(metadata.image_feature === "prompt", "labels image suggestion submissions as prompts");
check(metadata.image_prompt_id === "prompt-1", "includes the suggestion prompt ID");
check(metadata.image_prompt_group_id === "group-1", "includes the suggestion group ID");
check(metadata.image_prompt_group_presentation === "image_card", "includes group presentation");
check(typeof metadata.image_send_uuid === "string", "creates an image send UUID");
trackedComposer.onSubmitAccepted({ id: "submitted-1" });
check(state.marked.length === 1, "marks a tracked suggestion after accepted submission");
check(state.marked[0].item === selection.item && state.marked[0].group === selection.group, "marks the original suggestion selection");
check(state.marked[0].imageSendUuid === metadata.image_send_uuid, "reuses the metadata image UUID for analytics");
check(state.resets[0] === "conversation-1", "resets the completed image conversation");
check(state.setCalls.length === 1, "stores one replacement account conversation");
check(state.setCalls[0].signal === "accountConversation", "updates the account conversation signal");
check(state.setCalls[0].first === '["account-1","user-1"]', "updates the current account identity");
check(state.setCalls[0].second.conversationId === "conversation-2", "stores a new generated conversation");
check(state.navigations[0] === "/conversation/submitted-1", "navigates to the accepted conversation");

reset();
const stale = renderPage();
state.selection = { item: { id: "other" }, group: { id: "other-group" } };
check(composerProps(stale.layout).getMessageMetadata() === undefined, "rejects metadata for a stale selection");

reset();
state.selection = {
  item: {
    id: "prompt-2",
    action: { input_requirements: { source: "prompt_only" } },
    system_hints: ["text"],
  },
  group: { id: "group-2", presentation: "text_pill" },
};
state.accountConversation = { conversationId: "conversation-1" };
const untracked = renderPage();
const untrackedComposer = composerProps(untracked.layout);
check(untrackedComposer.getMessageMetadata().image_prompt_id === "prompt-2", "still emits metadata for non-auto-send suggestions");
untrackedComposer.onSubmitAccepted({ id: "submitted-2" });
check(state.marked.length === 0, "does not mark non-auto-send suggestions as submitted");
check(state.resets.length === 1 && state.navigations[0] === "/conversation/submitted-2", "still resets and navigates after submission");

reset();
const uploaded = renderPage();
composerProps(uploaded.layout).onFilesUploaded();
check(state.fileUploads.length === 1, "handles uploaded files for the current suggestion");
check(state.fileUploads[0].selected === selection, "passes the current selection to upload handling");
check(state.fileUploads[0].conversationId === "conversation-1", "passes the current conversation to upload handling");

reset();
const changedUpload = renderPage();
suggestionProps(changedUpload.layout).onUploadSelectionChange({
  item: { id: "changed" },
  group: { id: "changed-group" },
});
composerProps(changedUpload.layout).onFilesUploaded();
check(state.fileUploads.length === 0, "ignores uploads after the suggestion selection changes");

reset();
const movedAccount = renderPage();
state.accountConversation = { conversationId: "different-conversation" };
composerProps(movedAccount.layout).onFilesUploaded();
check(state.fileUploads.length === 0, "ignores uploads after the account conversation changes");

check(
  composerProps(first.layout).getSystemHintsForSubmission === undefined,
  "does not inject system hints into image submissions",
);
check(
  first.layout.props.children.props.className === "flex min-w-0 flex-col gap-8",
  "keeps the published composer and suggestions layout",
);

// image-suggestions-core owner: scoped draft family, account-isolated catalog,
// prompt replacement, analytics and real React card selection.
const coreState = {
  accountId: "account-1",
  analytics: [],
  focused: false,
  queryOptions: [],
  queryStates: [{ data: { groups: [] }, isSuccess: true }, { data: { image_suggestions: [], styles: [] }, isSuccess: true }],
  registered: [],
  selection: { item: { id: "old", title: "Old", prompt_text: "old", action: { input_requirements: { source: "prompt_only" } } }, group: { id: "old-group", presentation: "text_pill" } },
  userId: "user-1",
};
coreState.jsx = { Fragment: Symbol("Fragment"), jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
coreState.scope = {
  get(signal) {
    if (signal === "account") return coreState.accountId;
    if (signal === "user") return coreState.userId;
    if (signal === "toast") return { danger(message) { coreState.toast = message; } };
    return undefined;
  },
  set() {},
};
globalThis.__imageSuggestionsCoreTest = coreState;
const coreMocks = {
  "rolldown-runtime": "export {};",
  "app-shared": `
    const s=globalThis.__imageSuggestionsCoreTest;
    export const ZI='app'; export const pk='toast'; export const FX=()=>{}; export const QI=()=>{};
    export const I3=()=>s.jsx; export const e6=()=>({useEffect:fn=>{fn();},useRef:value=>({current:value}),useState:value=>{let current=typeof value==='function'?value():value;return[current,next=>{current=typeof next==='function'?next(current):next;}];}});
    export const LX=()=>s.scope;
    export const oZ=(_scope,factory)=>({kind:'family',factory});
    export const rZ=(_scope,derive)=>({kind:'derived-family',derive});
    export const eZ=(_scope,factory)=>{const options=factory({get:signal=>signal==='account'?s.accountId:s.userId});s.queryOptions.push(options);return{kind:'query',index:s.queryOptions.length-1};};
    export const sZ=(_scope,derive)=>({kind:'derived',derive});
    const read=signal=>signal?.kind==='query'?s.queryStates[signal.index]:signal?.kind==='derived'?signal.derive({get:read}):undefined;
    export const HX=read;
    export const BX=(family,key)=>family==='primary-selection'?s.selection:family==='recent'?{data:[]}:family?.kind==='derived-family'?family.derive(key,{get:(signal,param)=>signal.factory(param,{scope:s.scope})}):undefined;
  `,
  "app-initial": `
    const s=globalThis.__imageSuggestionsCoreTest;
    export const mun='account'; export const _un='user'; export const kht='images';
    export const rqt=()=> 'image-draft-1'; export const GIt=(_scope,id,types)=>s.registered.push({id,types});
    export const RIt=()=>{}; export const Sun=()=>{};
    export const rJt={safeGet:async(path,options)=>{s.lastRequest={path,options};return{};}};
    export const xpn=(_scope,event,payload)=>s.analytics.push({event,payload});
  `,
  "app-primary": `
    const s=globalThis.__imageSuggestionsCoreTest; export const tu='primary-selection'; export const au=()=>{};
    export const ou=(_scope,_id,item,group,surface)=>{s.selection={item,group,surface};return s.selection;};
    export const su=()=>{s.uploadSelected=true;};
  `,
  "chatgpt-image-home": `
    export const a={CHATGPT_IMAGE_PROMPT_SENT_SURFACE_TYPE_IMAGES:'images',CHATGPT_IMAGE_PROMPT_SENT_SURFACE_TYPE_CHATGPT_HOME:'home'};
    export const i='sent';export const n='impression';export const r='selected';export const o=()=>{};
    export const t={CHATGPT_IMAGE_PROMPT_GROUP_PRESENTATION_TYPE_TEXT_PILL:'text-pill',CHATGPT_IMAGE_PROMPT_GROUP_PRESENTATION_TYPE_IMAGE_CARD:'image-card',CHATGPT_IMAGE_PROMPT_GROUP_PRESENTATION_TYPE_PORTRAIT:'portrait',CHATGPT_IMAGE_PROMPT_GROUP_PRESENTATION_TYPE_ICON_PILL:'icon-pill'};
  `,
  "recent-uploads": "export const n=()=>{};export const r='recent';",
};
const coreResult = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/image-suggestions-core/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "image-suggestions-core-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "core-mock" }));
    build.onLoad({ filter: /.*/, namespace: "core-mock" }, ({ path: importPath }) => ({ loader: "js", contents: coreMocks[importPath] ?? "export {};" }));
  } }],
});
const core = await import("data:text/javascript;base64," + Buffer.from(coreResult.outputFiles[0].text).toString("base64") + "#core");
const coreNodes = (root) => {
  const output = [];
  const visit = (value) => {
    if (value == null || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    if ("type" in value && "props" in value) output.push(value);
    visit(value.props?.children);
  };
  visit(root);
  return output;
};
core.n();
check(core.o?.kind === "family" && core.s?.kind === "derived-family", "uses scoped signal families instead of module Maps");
const created = core.a(coreState.scope);
check(created.conversationId === "image-draft-1", "creates a stable image draft conversation identity");
check(coreState.registered.at(-1).types[0] === "picture_v2", "registers the picture_v2 content type");
check(coreState.queryOptions.length === 2, "creates catalog and style query owners");
await coreState.queryOptions[0].queryFn({ signal: new AbortController().signal });
check(coreState.lastRequest.path === "/images/init", "loads the published image catalog endpoint");
check(coreState.lastRequest.options.additionalHeaders["ChatGPT-Account-ID"] === "account-1", "isolates catalog requests by account");
await coreState.queryOptions[1].queryFn({ signal: new AbortController().signal });
check(coreState.lastRequest.path === "/images/styles", "loads style suggestions separately");
check(coreState.lastRequest.options.parameters.query.include_image_suggestions === true, "requests image suggestions with styles");
const controller = { text: "prefix OLD suffix", view: { isDestroyed: false, state: { doc: {} }, dom: { scrollIntoView() { coreState.scrolled = true; } } }, focus() { coreState.focused = true; }, getPersistedText() { return this.text; }, setPromptText(value) { this.text = value; } };
const nextPrompt = { id: "new", title: "New idea", prompt_text: "NEW", action: { input_requirements: { source: "prompt_only" } } };
const group = { id: "group", presentation: "text_pill", items: [nextPrompt] };
const coreRoot = core.t({ conversationId: "conversation-1", composerController: controller, groups: [group], surface: "home" });
const catalogNode = coreRoot.props.children[1];
const catalogTree = catalogNode.type(catalogNode.props);
const cardNode = coreNodes(catalogTree).find((node) => typeof node.type === "function" && node.props.item?.id === "new");
const cardTree = cardNode.type(cardNode.props);
cardTree.props.onClick();
check(controller.text === "prefix NEW suffix", "replaces the prior prompt case-insensitively in place");
check(coreState.focused === true && coreState.scrolled === true, "focuses and reveals the composer after selection");
check(coreState.analytics.some((entry) => entry.event === "impression"), "records a Home-card impression once visible");
check(coreState.analytics.some((entry) => entry.event === "selected"), "records card selection analytics");
core.i(coreState.scope, nextPrompt, group, "send-1");
check(coreState.analytics.at(-1).payload.imageSendUuid === "send-1", "records image-send UUID with the selected prompt");

console.log(assertions + " Images page assertions passed");
