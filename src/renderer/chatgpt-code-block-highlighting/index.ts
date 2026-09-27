import "@rchunk/rolldown-runtime";
import { o as highlightTags, r as syntaxTags } from "@rchunk/codemirror-state-runtime";
import { M as EditorView, O as syntaxHighlighting, R as initializeViewRuntime, t as HighlightStyle, w as initializeHighlightRuntime } from "@rchunk/codemirror-view-runtime";

const codeBlockClasses = { InlineCodePane: "_InlineCodePane_k3ovr_2", ViewerContent: "_ViewerContent_k3ovr_7", Comment: "_Comment_k3ovr_11" } as const;
const codeHighlightStyle = HighlightStyle.define([
  { tag: syntaxTags.comment, class: codeBlockClasses.Comment },
  { tag: syntaxTags.meta, class: "text-codex-syntax-name" },
  { tag: [syntaxTags.keyword, syntaxTags.definitionKeyword, syntaxTags.modifier, syntaxTags.operator], class: "text-codex-syntax-keyword" },
  { tag: [syntaxTags.heading, syntaxTags.contentSeparator], class: "text-codex-syntax-attribute" },
  { tag: syntaxTags.deleted, class: "text-codex-syntax-error" },
  { tag: [syntaxTags.bool, syntaxTags.null, syntaxTags.atom, syntaxTags.self, syntaxTags.number], class: "text-codex-syntax-literal" },
  { tag: [syntaxTags.string, syntaxTags.regexp, syntaxTags.special(syntaxTags.string)], class: "text-codex-syntax-string" },
  { tag: [syntaxTags.standard(syntaxTags.variableName), syntaxTags.standard(syntaxTags.propertyName), syntaxTags.className], class: "text-codex-syntax-literal" },
  { tag: [syntaxTags.variableName, syntaxTags.special(syntaxTags.variableName), syntaxTags.typeName, syntaxTags.function(syntaxTags.variableName), syntaxTags.definition(syntaxTags.variableName)], class: "text-codex-syntax-variable" },
  { tag: syntaxTags.attributeName, class: "text-codex-syntax-attribute" },
  { tag: [syntaxTags.labelName, syntaxTags.tagName, syntaxTags.definition(syntaxTags.tagName), syntaxTags.angleBracket], class: "text-codex-syntax-name" },
  { tag: [syntaxTags.link, syntaxTags.url], class: "text-codex-syntax-name underline" },
  { tag: [syntaxTags.invalid, syntaxTags.escape], class: "text-codex-syntax-error underline" },
]);
const codeEditorExtensions = [EditorView.theme({ "&": { backgroundColor: "transparent", color: "var(--color-text)", fontSize: "inherit", minWidth: "0" }, "&.cm-focused": { outline: "none" }, ".cm-scroller": { fontFamily: "var(--font-code-family)", overflowX: "auto", overscrollBehaviorX: "contain" }, ".cm-content": { caretColor: "var(--color-codex-editor-cursor)", lineHeight: "max(1.5em, calc(var(--spacing) * 5))", padding: "calc(var(--spacing) * 3) calc(var(--spacing) * 5)" }, ".cm-line": { padding: "0" } }), syntaxHighlighting(codeHighlightStyle)];
function initializeCodeBlockClasses(): void {}
function initializeCodeBlockHighlighting(): void { initializeHighlightRuntime(); initializeViewRuntime(); void highlightTags; }
export { initializeCodeBlockClasses as a, codeBlockClasses as i, codeEditorExtensions as n, initializeCodeBlockHighlighting as r, codeHighlightStyle as t };
