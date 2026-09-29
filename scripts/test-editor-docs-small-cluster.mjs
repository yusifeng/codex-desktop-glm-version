import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import esbuild from "esbuild";

const ROOT = path.resolve(import.meta.dirname, "..");
const expectations = {
  "markdown-writing-block": { dependencies: ["rolldown-runtime","app-shared","app-initial","writing-block-surface","writing-block-copy-button"], exported: "MarkdownWritingBlock" },
  "dil-writing-block": { dependencies: ["rolldown-runtime","app-shared","app-initial","writing-block-directive-renderer","quick-chat-writing-block-adapter"], exported: "DilWritingBlock" },
  "composer-annotation-editor": { dependencies: ["rolldown-runtime","app-shared","app-initial","annotation-comment-editor-card"], exported: "ComposerAnnotationEditor" },
};
let sourceAssertions = 0;
const sourceAssert = (condition, message) => { sourceAssertions += 1; assert.ok(condition, message); };
for (const [name, expected] of Object.entries(expectations)) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", name, "index.ts"), "utf8");
  const dependencies = [...source.matchAll(/@rchunk\/([^";]+)/g)].map((match) => match[1]);
  sourceAssert(JSON.stringify(dependencies) === JSON.stringify(expected.dependencies), name + " exact dependencies");
  sourceAssert(!source.includes("import("), name + " no dynamic imports");
  sourceAssert(!/\bany\b/.test(source), name + " no any");
  sourceAssert(!/\w+Chunk\.[A-Za-z_$]/.test(source), name + " no direct namespace use");
  sourceAssert(source.includes("export { " + expected.exported + " }"), name + " exact export");
}

const state = globalThis.__editorDocsSmallTest = { initializers: [], copies: [], additions: [], selected: [], setters: [], saves: [], closes: 0, removals: 0, turnContext: null, schemaSuccess: true };
const jsx = { jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) };
const range = { selectNodeContents(element) { state.selected.push(element); } };
const contentElement = { ownerDocument: { createRange: () => range } };
const React = {
  useRef: () => ({ current: contentElement }),
  useContext: () => "portal",
  useState(initial) { let value = initial; return [value, (next) => { value = typeof next === "function" ? next(value) : next; state.setters.push(value); }]; },
};
const marker = (name) => "() => globalThis.__editorDocsSmallTest.initializers.push(" + JSON.stringify(name) + ")";
const sharedBase = "export const $3=" + marker("shared") + ";export const I3=()=>globalThis.__editorDocsSmallTest.jsx;";
Object.assign(state, { jsx, React });

async function load(name, mocks) {
  const entry = path.join(ROOT, "src/renderer", name, "index.ts");
  const result = await esbuild.build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: specifier }) => ({ path: specifier.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: dependency }) => ({ contents: mocks[dependency] ?? "export {};", loader: "js" })); } }] });
  const out = path.join("/tmp", name + "-" + process.pid + ".mjs");
  fs.writeFileSync(out, result.outputFiles[0].text);
  const loaded = await import(pathToFileURL(out).href);
  fs.unlinkSync(out);
  return loaded;
}

let runtimeAssertions = 0;
const runtimeAssert = (actual, expected, message) => { runtimeAssertions += 1; assert.deepEqual(actual, expected, message); };

const markdownMocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [sharedBase,"export const e6=()=>globalThis.__editorDocsSmallTest.React;export const K2=" + marker("compiler") + ";export const Zh=" + marker("icons") + ";export const Xm=" + marker("selection") + ";export const dg=" + marker("markdown") + ";","export const Y2='FormattedMessage';export const Yh='Button';export const fg=()=>true;export const Ym=(content,event)=>globalThis.__editorDocsSmallTest.copies.push([content,event]);"].join("\n"),
  "app-initial": "export const d6=" + marker("actions") + ";export const u6='AddIcon';",
  "writing-block-surface": "export const i=" + marker("surface") + ";export const r='WritingBlockSurface';",
  "writing-block-copy-button": "export const n=" + marker("copy") + ";export const t='CopyButton';",
};
const markdown = await load("markdown-writing-block", markdownMocks);
runtimeAssert(Object.keys(markdown), ["MarkdownWritingBlock"], "markdown unique export");
runtimeAssert(state.initializers, ["shared","compiler","icons","actions","selection","markdown","copy","surface"], "markdown initializer order");
let prevented = 0;
const markdownView = markdown.MarkdownWritingBlock({ className:"custom", content:"  hello  ", onAddSelectedTextToChat:(text, selectedRange)=>state.additions.push([text,selectedRange]) });
runtimeAssert(markdownView.type, "WritingBlockSurface", "markdown surface");
runtimeAssert(markdownView.props["data-theme"], "dark", "dark theme");
runtimeAssert(markdownView.props["data-markdown-copy"], "code-block", "copy block marker");
const toolbar = markdownView.props.children[0];
runtimeAssert(toolbar.props["data-markdown-copy"], "exclude", "toolbar copy excluded");
toolbar.props.children[0].props.onMouseDown({preventDefault(){prevented += 1;}});
toolbar.props.children[0].props.onClick();
runtimeAssert(prevented, 1, "mouse down preserves selection");
runtimeAssert(state.additions, [["hello",range]], "trimmed content added with range");
runtimeAssert(state.selected, [contentElement], "range selects content node");
toolbar.props.children[1].props.onCopy("event");
runtimeAssert(state.copies, [["  hello  ","event"]], "copy receives original content");
const noCopy = markdown.MarkdownWritingBlock({ content:"x", showCopyButton:false });
runtimeAssert(noCopy.props.children[0].props.children, [null,null], "optional actions hidden");

state.initializers = [];
state.turnContext = { messageId:"fallback", contentReferenceMessageIds:["same","same","other"], contentReferenceMessageStatuses:["done","in_progress"], isStreaming:false, marker:"context" };
const dilMocks = {
  "rolldown-runtime": "export {};",
  "app-shared": sharedBase,
  "app-initial": [
    "export const WJt=" + marker("schema") + ";export const wJt=" + marker("references") + ";export const git=" + marker("runtime") + ";",
    "export const _it=()=>globalThis.__editorDocsSmallTest.turnContext;",
    "export const CJt={safeParse:value=>globalThis.__editorDocsSmallTest.schemaSuccess?{success:true,data:value}:{success:false}};",
    "export const zJt=metadata=>metadata.generated?[{content:metadata.generated}]:[];",
  ].join("\n"),
  "writing-block-directive-renderer": "export const l=" + marker("directive") + ";export const c=input=>{globalThis.__editorDocsSmallTest.directiveInput=input;return [{content:'tone-content'}]};",
  "quick-chat-writing-block-adapter": "export const r=" + marker("adapter") + ";export const t='QuickChatWritingBlock';",
};
const dil = await load("dil-writing-block", dilMocks);
runtimeAssert(Object.keys(dil), ["DilWritingBlock"], "dil unique export");
runtimeAssert(state.initializers, ["shared","schema","references","runtime","adapter","directive"], "dil initializer order");
const dilView = dil.DilWritingBlock({ contentReferenceIndex:1, data:{ content:"fallback-content", metadata:{generated:"generated-content"}, options:{tone:"formal"}, recipient:"a@example.com", title:"Email" }, readOnly:true });
runtimeAssert(dilView.type, "QuickChatWritingBlock", "dil adapter root");
runtimeAssert(dilView.props.id, "same:1", "duplicate reference index id");
runtimeAssert(dilView.props.index, 1, "duplicate occurrence index");
runtimeAssert(dilView.props.sourceMessageId, "same", "source message id");
runtimeAssert(dilView.props.readOnly, true, "read only forwarded");
runtimeAssert(dilView.props.directive.bodyContent, "generated-content", "metadata content preferred");
runtimeAssert(dilView.props.directive.content, "tone-content", "tone section content preferred");
runtimeAssert(dilView.props.directive.metadata.options, {tone:"formal"}, "options merged into metadata");
runtimeAssert(dilView.props.directive.emailMetadata.recipient, "a@example.com", "email metadata forwarded");
runtimeAssert(dilView.props.turnContext.isStreaming, true, "reference status drives streaming");
runtimeAssert(state.directiveInput.preserveEmptySections, false, "streaming preserves no empty sections");
state.schemaSuccess = false;
runtimeAssert(dil.DilWritingBlock({contentReferenceIndex:0,data:{}}), null, "invalid DIL data returns null");

state.initializers = [];
const composerMocks = {
  "rolldown-runtime": "export {};",
  "app-shared": [sharedBase,"export const wL=" + marker("links") + ";export const e6=()=>globalThis.__editorDocsSmallTest.React;export const K2=" + marker("compiler") + ";export const y_=" + marker("theme") + ";export const zh=" + marker("icons") + ";","export const Ih='Dialog';export const Rh='VisuallyHidden';export const Y2='FormattedMessage';export const b_=(value,max)=>Math.min(value,max);export const n4=()=>({formatMessage:d=>d.defaultMessage});export const x_=()=>({meta:true});"].join("\n"),
  "app-initial": "export const Rpn=()=>240;export const E7=" + marker("annotation-runtime") + ";export const Lpn=annotation=>annotation.comment??'';export const T7={};",
  "annotation-comment-editor-card": "export const n=" + marker("annotation-card") + ";export const t='AnnotationCard';",
};
const composer = await load("composer-annotation-editor", composerMocks);
runtimeAssert(Object.keys(composer), ["ComposerAnnotationEditor"], "composer unique export");
runtimeAssert(state.initializers, ["shared","links","compiler","annotation-runtime","theme","annotation-card","icons"], "composer initializer order");
const annotation = { comment:"fallback", localBrowserAttachedImages:["image"], localBrowserDesignChange:{group:{declarations:[{}],text:null,annotationControlChanges:[],comment:"group comment"}} };
const composerView = composer.ComposerAnnotationEditor({ annotation, cwd:"/repo", onClose:()=>{state.closes += 1}, onRemove:()=>{state.removals += 1}, onSave:body=>state.saves.push(body) });
runtimeAssert(composerView.type, "Dialog", "composer dialog root");
runtimeAssert(composerView.props.portalContainer, "portal", "portal context forwarded");
runtimeAssert(composerView.props.shouldIgnoreClickOutside, false, "initial light dismiss enabled");
const card = composerView.props.children[1].props.children;
runtimeAssert(card.type, "AnnotationCard", "annotation card rendered");
runtimeAssert(card.props.allowEmptySubmit, true, "design changes allow empty comment");
runtimeAssert(card.props.allowImageAttachments, false, "image attachment editing disabled");
runtimeAssert(card.props.session.body, "group comment", "group comment preferred");
runtimeAssert(card.props.session.attachedImages, ["image"], "attached images forwarded");
runtimeAssert(card.props.session.cwd, "/repo", "cwd forwarded");
card.props.onSubmit({body:"saved"});
card.props.onDirectSubmit({body:"direct"});
runtimeAssert(state.saves, ["saved","direct"], "submit paths save body");
card.props.onDelete();
runtimeAssert(state.removals, 1, "delete forwarded");
card.props.onMounted(null,{height:500});
runtimeAssert(state.setters.at(-1), 240, "mounted height clamped");
card.props.onLightDismissibilityChange(false);
runtimeAssert(state.setters.at(-1), false, "dismissibility update forwarded");
composerView.props.onOpenChange(false);
runtimeAssert(state.closes, 1, "dialog close forwarded");

console.log(sourceAssertions + " source assertions and " + runtimeAssertions + " runtime assertions passed");
