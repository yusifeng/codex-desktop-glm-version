import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/editable-writing-block";
import "@rchunk/writing-block-app-capabilities";
import "@rchunk/writing-block-content-update";
import "@rchunk/writing-block-directive-renderer";
export interface WritingBlockDirective { content?: string; id?: string; metadata?: { recipients?: string[]; subject?: string }; title?: string; variant?: "document" | "email" | string }
export interface CodexWritingBlockDirectiveRendererProps { directive: WritingBlockDirective; editable?: boolean; onBlur?(): void; onContentChange?(content: string): void; onRecipientChange?(recipients: string[]): void; onSubjectChange?(subject: string): void; render?(content: string): unknown }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function CodexWritingBlockDirectiveRenderer({ directive, editable = false, onBlur, onContentChange, onRecipientChange, onSubjectChange, render }: CodexWritingBlockDirectiveRendererProps): unknown { const content = directive.content ?? ""; return jsx().jsxs("article", { "data-writing-block": directive.id ?? "", "data-variant": directive.variant ?? "document", children: [jsx().jsx("h3", { children: directive.title ?? "Writing block" }), directive.variant === "email" ? jsx().jsxs("header", { children: [jsx().jsx("input", { "aria-label": "Recipients", defaultValue: directive.metadata?.recipients?.join(", ") ?? "", disabled: !editable, onChange: (event: { currentTarget: { value: string } }) => onRecipientChange?.(event.currentTarget.value.split(",").map(value => value.trim()).filter(Boolean)) }), jsx().jsx("input", { "aria-label": "Subject", defaultValue: directive.metadata?.subject ?? "", disabled: !editable, onChange: (event: { currentTarget: { value: string } }) => onSubjectChange?.(event.currentTarget.value) })] }) : null, editable ? jsx().jsx("textarea", { defaultValue: content, onBlur, onChange: (event: { currentTarget: { value: string } }) => onContentChange?.(event.currentTarget.value) }) : render?.(content) ?? jsx().jsx("div", { children: content })] }); }
export { CodexWritingBlockDirectiveRenderer };
