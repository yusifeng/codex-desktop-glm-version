import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import esbuild from "esbuild";

const ROOT = path.resolve(import.meta.dirname, "..");
const source = fs.readFileSync(path.join(ROOT, "src/renderer/quick-chat-writing-block-adapter/index.ts"), "utf8");
let sourceAssertions = 0;
const sourceAssert = (condition, message) => { sourceAssertions += 1; assert.ok(condition, message); };
const dependencies = [...source.matchAll(/@rchunk\/([^";]+)/g)].map(match => match[1]);
sourceAssert(JSON.stringify(dependencies) === JSON.stringify(["rolldown-runtime","app-shared","app-initial","app-primary","writing-block-floating-slash-menu","writing-block-surface","editable-writing-block","writing-block-app-capabilities","writing-block","writing-block-content-update","writing-block-directive-renderer"]), "exact eleven dependencies");
sourceAssert(!source.includes("import("), "no dynamic dependencies");
sourceAssert(!/\bany\b/.test(source), "no any");
sourceAssert(!/\w+Chunk\.[A-Za-z_$]/.test(source), "no direct namespace access");
sourceAssert(source.includes("export { QuickChatWritingBlockDirectiveRenderer as n, initializeQuickChatWritingBlockAdapter as r, QuickChatWritingBlock as t }"), "exact n/r/t exports");

const state = globalThis.__quickChatAdapterTest = { initializers: [], persists: [], flushes: [], followups: [], dismissals: [], signals: { server: "server-1", current: "message-current" } };
const marker = name => "() => globalThis.__quickChatAdapterTest.initializers.push(" + JSON.stringify(name) + ")";
const jsx = { jsx: (type, props, key) => ({ type, props, key }) }; state.jsx = jsx;
const React = { useCallback: callback => callback, useEffect() {}, useState(initial) { let value = typeof initial === "function" ? initial() : initial; return [value, next => { value = typeof next === "function" ? next(value) : next; }]; } }; state.React = React;
state.turnContext = { conversationId: "conv-1", conversationOrigin: "chat", contentReferences: [{ id: "ref" }], isStreaming: false, messageId: "message-current", turnId: "turn-1", writingBlockIndexes: { "block-1": 2 }, writingBlockMessageIds: { "block-1": "message-1" } };
state.messages = { "message-1": { message: { metadata: { blocks: { "block-1": { content: "stored content", edited: true, id: "stored-id", library_file_id: "library-1", metadata: { active_option_id: "tone-2", options: [{ id: "tone-1", tone: "Base", content: "base" }, { id: "tone-2", tone: "Formal", content: "formal" }], recipient: "stored@example.com" }, title: "Stored title", variant: "document" } } } } } };

const shared = [
  "export const $3="+marker("shared")+";export const FX="+marker("features")+";export const K2="+marker("compiler")+";export const lk="+marker("persistence")+";export const QI="+marker("state")+";export const g_="+marker("toast")+";",
  "export const I3=()=>globalThis.__quickChatAdapterTest.jsx;export const e6=()=>globalThis.__quickChatAdapterTest.React;export const n4=()=>({formatMessage:d=>d.defaultMessage});export const ZI='scope';",
  "export const LX=()=>({get:(signal)=>signal==='selected-model'?'model-1':null});export const HX=()=>true;export const BX=(signal)=>signal==='server'?globalThis.__quickChatAdapterTest.signals.server:signal==='messages'?globalThis.__quickChatAdapterTest.messages:signal==='current'?globalThis.__quickChatAdapterTest.signals.current:null;",
].join("\n");
const initial = [
  "export const MJt="+marker("runtime")+";export const OJt="+marker("queries")+";export const WJt="+marker("schema")+";export const RIt="+marker("store")+";export const uHt="+marker("api")+";export const git="+marker("messages-init")+";export const Rat="+marker("persist-init")+";export const wdn="+marker("conversation-init")+";export const cJt="+marker("directives")+";export const ypn="+marker("tracking")+";export const pIt="+marker("earlier")+";export const jPt="+marker("followups")+";",
  "export const _it=()=>globalThis.__quickChatAdapterTest.turnContext;export const OPt='revision';export const kPt='changes';export const wVt='server';export const RVt='messages';export const jVt='current';export const jIt='selected-model';export const eIt='editor-key';export const PJt='active_option_id';",
  "export const kJt=metadata=>metadata?.blocks??{};export const FYt=block=>block;export const AJt=sections=>sections?{options:sections}:{};export const qJt=(metadata,selection)=>({...metadata,active_option_id:selection.id});",
  "export const APt=input=>{globalThis.__quickChatAdapterTest.persists.push(input);return {...input.fallbackWritingBlock,...input.update};};",
].join("\n");
const primary = [
  "export const Bd="+marker("library")+";export const $l="+marker("primary-writing")+";export const Kd="+marker("primary-state")+";export const Ss="+marker("suggestions")+";export const xu="+marker("copy")+";export const xs="+marker("revisions")+";export const vu="+marker("editor")+";",
  "export const Gd=async(scope,conversation)=>globalThis.__quickChatAdapterTest.flushes.push(conversation);export const Ld=(metadata,key)=>metadata?.[key];export const Rd=(input,active)=>input.metadata?.subject??active?.content??'';export const Ou=()=>null;export const bu=content=>content.slice(0,20);export const zd=(value,active,subject)=>({...value.metadata,subject});",
  "export const eu=(scope,input)=>globalThis.__quickChatAdapterTest.followups.push(input);",
].join("\n");
const mocks = {
  "rolldown-runtime": "export {};", "app-shared": shared, "app-initial": initial, "app-primary": primary,
  "writing-block-floating-slash-menu": "export const E="+marker("floating")+";export const C="+marker("floating-styles")+";export const T=()=>({store:true});export const w={root:'root'};",
  "writing-block-surface": "export const i="+marker("surface")+";export const n='Surface';",
  "editable-writing-block": "export const n="+marker("editable")+";export const i="+marker("change-state")+";export const a={get:key=>({dismiss:reason=>globalThis.__quickChatAdapterTest.dismissals.push([key,reason])})};export const r=(scope,key)=>globalThis.__quickChatAdapterTest.dismissals.push([key,'copy']);export const t='Editable';",
  "writing-block-app-capabilities": "export const n="+marker("capabilities")+";export const t='Capabilities';",
  "writing-block": "export const i="+marker("writing-block")+";export const n="+marker("inline")+";export const r='WritingBlockFrame';export const t='InlineWritingBlock';",
  "writing-block-content-update": "export const a="+marker("content-update")+";export const i="+marker("content-metadata")+";export const n=(metadata,sections)=>({...metadata,options:sections});export const r=(sections,id)=>sections.find(section=>section.id===id);export const o=input=>({activeToneSectionId:input.metadata?.active_option_id??input.toneSections?.[0]?.id,displayedToneSections:input.toneSections??[],selectToneSection:id=>input.onPersistSelection?.(id)});export const t=({nextContent,toneSectionId,toneSections})=>{const updated=toneSections?.map(section=>section.id===toneSectionId?{...section,content:nextContent}:section);return{activeToneSectionId:toneSectionId,content:updated?.[0]?.content??nextContent,toneSections:updated}};",
  "writing-block-directive-renderer": "export const l="+marker("parser")+";export const n="+marker("directive-renderer")+";export const o="+marker("directive-schema")+";export const t='DirectiveRenderer';export const r=content=>content+'|refs';export const i=metadata=>metadata;export const a=block=>block;export const c=({content,metadata})=>(metadata?.options??[{id:'tone-1',tone:'Base',content}]);",
};
const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer/quick-chat-writing-block-adapter/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: specifier }) => ({ path: specifier.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: dependency }) => ({ contents: mocks[dependency] ?? "export {};", loader: "js" })); } }] });
const output = path.join("/tmp", "quick-chat-writing-block-adapter-" + process.pid + ".mjs"); fs.writeFileSync(output, result.outputFiles[0].text); const module = await import(pathToFileURL(output).href); fs.unlinkSync(output);
let runtimeAssertions = 0; const runtimeAssert = (actual, expected, message) => { runtimeAssertions += 1; assert.deepEqual(actual, expected, message); };
runtimeAssert(Object.keys(module), ["n","r","t"], "exact runtime exports");
runtimeAssert(state.initializers.slice(0,7), ["shared","runtime","library","schema","queries","floating","features"], "initializer prefix");
runtimeAssert(state.initializers.includes("capabilities"), true, "capabilities initialized"); runtimeAssert(state.initializers.at(-1), "capabilities", "capabilities initialize last");
const directive = { bodyContent: "directive body", content: "directive content", emailMetadata: { recipient: "draft@example.com", subject: "Draft" }, id: "block-1", metadata: { source: "directive" }, title: "Directive title", toneSections: [{ id: "tone-1", tone: "Base", content: "directive tone" }], variant: "document" };
const wrapper = module.n({ isLastBlock: false, rawText: "raw" }); runtimeAssert(wrapper.type, "DirectiveRenderer", "directive renderer root"); runtimeAssert(wrapper.props.testId, "chatgpt-writing-block", "directive test id"); runtimeAssert(wrapper.props.contentReferences, state.turnContext.contentReferences, "content references forwarded"); runtimeAssert(wrapper.props.isStreaming, false, "streaming forwarded");
const persistedView = wrapper.props.renderPersisted(directive); runtimeAssert(persistedView.type, module.t, "persisted directive renders quick chat block"); runtimeAssert(persistedView.props.index, 2, "persisted index resolved"); runtimeAssert(persistedView.props.isLastNodeInMessage, false, "last block forwarded");
const extensionFactory = wrapper.props.renderExtension(directive); const extension = extensionFactory({ display: true }); runtimeAssert(extension.type, "WritingBlockFrame", "extension frame"); runtimeAssert(extension.props.emailMetadata.writingBlockMetadata, directive.metadata, "extension metadata combined");
const view = module.t({ directive, id: "block-1", index: 2, turnContext: state.turnContext }); runtimeAssert(view.type, "InlineWritingBlock", "document uses inline library wrapper"); runtimeAssert(view.props.initialContent, "stored content", "stored content preferred"); runtimeAssert(view.props.instanceId, "stored-id", "stored instance id preferred"); runtimeAssert(view.props.messageId, "message-1", "message id resolved");
const editable = view.props.fallback; runtimeAssert(editable.type, "Editable", "editable fallback rendered"); runtimeAssert(editable.props.activeToneSectionId, "tone-2", "stored tone selection"); runtimeAssert(editable.props.isEditable, true, "editing enabled with persistence context"); runtimeAssert(editable.props.emailMetadata.recipient, "stored@example.com", "stored email metadata preferred"); runtimeAssert(editable.props.toneSections.length, 2, "stored tone sections parsed");
const capabilitiesView = editable.props.render({ renderView: true }); runtimeAssert(capabilitiesView.type, "Capabilities", "capabilities frame rendered"); runtimeAssert(capabilitiesView.props.document.serverConversationId, "server-1", "document context includes server conversation"); runtimeAssert(capabilitiesView.props.showMagicEditAction, true, "magic edit available");
editable.props.onContentChange("updated formal"); runtimeAssert(state.persists.length, 1, "content update persisted"); runtimeAssert(state.persists[0].update.content, "base", "base tone content remains canonical"); runtimeAssert(state.persists[0].update.locallyEdited, true, "local edit marked"); runtimeAssert(state.dismissals.at(-1)[1], "edit", "assistant revision dismissed on edit");
editable.props.onCopySuccess(); runtimeAssert(state.dismissals.at(-1)[1], "copy", "copy dismisses transient revision");
capabilitiesView.props.onSuggestedFollowup("Improve it"); runtimeAssert(state.followups[0].prompt, "Improve it", "followup submitted"); runtimeAssert(state.followups[0].selectedModel, "model-1", "selected model forwarded");
const readOnly = module.t({ directive: { ...directive, variant: "email" }, id: "block-1", index: 2, readOnly: true, turnContext: state.turnContext }); runtimeAssert(readOnly.type, "Editable", "read only bypasses inline wrapper"); runtimeAssert(readOnly.props.isEditable, false, "read only disables editor"); runtimeAssert(readOnly.props.onContentChange, undefined, "read only omits content callback"); runtimeAssert(readOnly.props.editorKey, undefined, "read only omits editor key");
console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
