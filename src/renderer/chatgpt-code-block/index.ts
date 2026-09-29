import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  I3 as getJsxRuntime,
  K2 as initializeReactCompilerRuntime,
  Yh as Button,
  e6 as getReactRuntime,
  h4 as initializeClassNames,
  m4 as classNames,
  n4 as useIntl,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import "@rchunk/codemirror-state-runtime";
import "@rchunk/app-initial";
import { i as codeBlockClasses, r as initializeCodeBlockHighlighting } from "@rchunk/chatgpt-code-block-highlighting";
import { a as isLanguageSupported, n as initializeCodeBlockEditor, t as CodeBlockEditor } from "@rchunk/chatgpt-code-block-editor";
import { n as initializeMermaidPreviewActions } from "../../webview/assets/chatgpt-mermaid-preview-actions-99ff0b1286a4.js";

type PreviewLanguage = "html" | "mermaid" | "react" | "recharts" | "svg" | "threejs" | "vega" | "vega-lite";
interface TurnContext {
  browserConversationId?: string;
  codeBlocks?: Record<string, { content?: string; render_mode?: string; title?: string }>;
  conversationId: string;
  hostId?: string;
  isStreaming?: boolean;
  messageId?: string;
  shouldBlockExternalEgress?: boolean;
  turnId?: string;
}
interface ChatGptCodeBlockProps {
  codeBlockIndex: number;
  codeBlockInfo?: string;
  content: string;
  forceCodeBlockWordWrap?: boolean;
  isCodeFenceOpen?: boolean;
  language?: string;
  renderImmediately?: boolean;
  stickyHeader?: boolean;
  turnContext: TurnContext;
}
interface ExecutionProps extends Record<string, unknown> { children(runButton: unknown, consoleOutput: unknown): unknown; code: string; codeBlockIndex?: number; disabled?: boolean; isEdited?: boolean; onRun(): void; turnContext: TurnContext }
interface MermaidPreviewProps extends Record<string, unknown> { code: string; diagramId: string; isStreaming?: boolean; onCodeBlur?(): void; onCodeChange?(value: string): void; ref?: unknown }
type PreviewModule = { ChatGptMermaidPreview: (props: MermaidPreviewProps) => unknown };
type ExecutionEntry = { loadCodeBlockExecution(): Promise<(props: ExecutionProps) => unknown> };

let jsx: JsxRuntime;
let React: ReactRuntime;
let LazyMermaidPreview: (props: MermaidPreviewProps) => unknown;
let LazyCodeBlockExecution: (props: ExecutionProps) => unknown;
let initialized = false;

const languages: Record<string, { label: string; language: string; previewLanguage?: PreviewLanguage }> = {
  bash: { language: "bash", label: "Bash" }, sh: { language: "bash", label: "Bash" }, zsh: { language: "zsh", label: "Zsh" },
  c: { language: "c", label: "C" }, cpp: { language: "cpp", label: "C++" }, "c++": { language: "cpp", label: "C++" }, csharp: { language: "csharp", label: "C#" },
  css: { language: "css", label: "CSS" }, go: { language: "go", label: "Go" }, html: { language: "html", label: "HTML", previewLanguage: "html" },
  java: { language: "java", label: "Java" }, javascript: { language: "javascript", label: "JavaScript" }, js: { language: "javascript", label: "JavaScript" }, jsx: { language: "javascript", label: "JavaScript" },
  json: { language: "json", label: "JSON" }, kotlin: { language: "kotlin", label: "Kotlin" }, lua: { language: "lua", label: "Lua" }, mermaid: { language: "other", label: "Mermaid", previewLanguage: "mermaid" },
  php: { language: "php", label: "PHP" }, python: { language: "python", label: "Python" }, py: { language: "python", label: "Python" }, r: { language: "r", label: "R" },
  react: { language: "typescript", label: "React", previewLanguage: "react" }, recharts: { language: "typescript", label: "Recharts", previewLanguage: "recharts" },
  ruby: { language: "ruby", label: "Ruby" }, rust: { language: "rust", label: "Rust" }, sql: { language: "sql", label: "SQL" }, swift: { language: "swift", label: "Swift" },
  threejs: { language: "javascript", label: "Three.js", previewLanguage: "threejs" }, typescript: { language: "typescript", label: "TypeScript" }, ts: { language: "typescript", label: "TypeScript" }, tsx: { language: "typescript", label: "TypeScript" },
  vega: { language: "other", label: "Vega", previewLanguage: "vega" }, "vega-lite": { language: "other", label: "Vega-Lite", previewLanguage: "vega-lite" }, vegalite: { language: "other", label: "Vega-Lite", previewLanguage: "vega-lite" },
  xml: { language: "xml", label: "XML" }, svg: { language: "xml", label: "SVG", previewLanguage: "svg" }, yaml: { language: "yaml", label: "YAML" }, yml: { language: "yaml", label: "YAML" },
};

const svgPattern = /^\uFEFF?\s*(?:<\?xml\b[\s\S]*?\?>\s*)?(?:<!doctype\s+svg\b[^>]*>\s*)?<svg\b/i;
const defaultExportPattern = /\bexport\s+default\b/;

function detectPreviewLanguage(language: string | undefined, code: string): PreviewLanguage | null {
  const normalized = language?.trim().toLowerCase();
  const containsSvg = svgPattern.test(code);
  if (normalized === "html" || normalized === "xhtml") return containsSvg ? "svg" : "html";
  if (normalized === "xml") return containsSvg ? "svg" : null;
  if (normalized === "svg" || normalized === "mermaid" || normalized === "recharts" || normalized === "threejs" || normalized === "vega" || normalized === "vega-lite") return normalized;
  if (normalized === "vegalite") return "vega-lite";
  if (normalized === "react") return defaultExportPattern.test(code) ? "react" : null;
  if (["js", "jsx", "mjs", "cjs", "javascript", "ts", "tsx", "cts", "mts", "typescript"].includes(normalized ?? "")) {
    return /(?:['"]react['"])/.test(code) && defaultExportPattern.test(code) ? "react" : null;
  }
  return normalized == null && containsSvg ? "svg" : null;
}

function previewHtml(language: PreviewLanguage, code: string): string {
  if (language === "html") return code;
  if (language === "vega" || language === "vega-lite") {
    return `<!doctype html><html><body><div id="vis"></div><script src="https://cdn.jsdelivr.net/npm/vega@5/build/vega.min.js"><\/script><script src="https://cdn.jsdelivr.net/npm/vega-lite@5/build/vega-lite.min.js"><\/script><script src="https://cdn.jsdelivr.net/npm/vega-embed@6/build/vega-embed.min.js"><\/script><script>vegaEmbed('#vis',${code},{mode:${JSON.stringify(language)},actions:false,renderer:'svg'}).catch(console.error)<\/script></body></html>`;
  }
  const source = JSON.stringify(code).replaceAll("<", "\\u003c");
  return `<div id="chatgpt-code-block-preview"></div><script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7/babel.min.js"><\/script><script type="module">import React from "https://esm.sh/react@19";import{createRoot}from "https://esm.sh/react-dom@19/client";const source=${source};const transformed=Babel.transform(source,{filename:"preview.tsx",presets:[["react",{runtime:"classic"}],["typescript",{isTSX:true,allExtensions:true}]],plugins:["transform-modules-commonjs"]}).code;const module={exports:{}};new Function("React","module","exports",transformed)(React,module,module.exports);const Component=module.exports.default;if(typeof Component==="function")createRoot(document.getElementById("chatgpt-code-block-preview")).render(React.createElement(Component));<\/script>`;
}

function PreviewPane({ code, diagramId, isStreaming, language, title }: { code: string; diagramId: string; isStreaming: boolean; language: PreviewLanguage; title: string }): unknown {
  if (language === "svg") {
    const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(code)}`;
    return jsx.jsx("img", { alt: "Image generated by the assistant", className: "block min-h-24 w-full object-contain", src: source });
  }
  if (language === "mermaid") return jsx.jsx(React.Suspense ?? React.Fragment, { fallback: jsx.jsx("div", { children: "Loading diagram…" }), children: jsx.jsx(LazyMermaidPreview, { code, diagramId, isStreaming }) });
  return jsx.jsx("iframe", { className: "aspect-video w-full border-0", sandbox: "allow-scripts", srcDoc: previewHtml(language, code), title });
}

function CodeSurface({ code, language, streaming, wrapLines }: { code: string; language?: string; streaming: boolean; wrapLines: boolean }): unknown {
  const normalized = languages[language?.trim().toLowerCase() ?? ""]?.language ?? language?.trim().toLowerCase();
  if (normalized != null && isLanguageSupported(normalized)) return jsx.jsx(CodeBlockEditor, { code, language: normalized, onBlur() {}, onChange() {}, wrapLines });
  return jsx.jsx("pre", { className: classNames("overflow-x-auto px-4 pb-3 pt-0 font-mono text-size-code text-default", codeBlockClasses.ViewerContent, wrapLines ? "whitespace-pre-wrap break-anywhere" : "whitespace-pre"), "data-streaming": streaming, children: jsx.jsx("code", { children: code }) });
}

function ChatGptCodeBlock(props: ChatGptCodeBlockProps): unknown {
  const { codeBlockIndex, codeBlockInfo, content, forceCodeBlockWordWrap = false, isCodeFenceOpen = false, language, stickyHeader = false, turnContext } = props;
  const intl = useIntl();
  const block = turnContext.codeBlocks?.[String(codeBlockIndex)];
  const code = block?.content ?? content;
  let previewLanguage = detectPreviewLanguage(language, code);
  if (block?.render_mode === "app_block") previewLanguage = "html";
  if (language === "mermaid" && isCodeFenceOpen) previewLanguage = "mermaid";
  const modelPreviewable = block?.render_mode === "app_block" || /\bpreview\b/.test(codeBlockInfo ?? "");
  const clientPreviewable = previewLanguage != null && (["svg", "mermaid"].includes(previewLanguage) || !turnContext.shouldBlockExternalEgress);
  if (block?.render_mode === "app_block" && turnContext.shouldBlockExternalEgress) return null;
  const autoPreview = clientPreviewable && !isCodeFenceOpen && (modelPreviewable || previewLanguage === "svg" || previewLanguage === "mermaid" || previewLanguage === "vega" || previewLanguage === "vega-lite");
  const [mode, setMode] = React.useState<"code" | "preview">(autoPreview ? "preview" : "code");
  const label = block?.title ?? languages[language?.trim().toLowerCase() ?? ""]?.label ?? language ?? intl.formatMessage({ id: "chatgpt.codeBlocks.language.fallback", defaultMessage: "Code" });
  const copyCode = (): void => { void globalThis.navigator?.clipboard?.writeText(code); };
  const body = mode === "preview" && previewLanguage != null
    ? jsx.jsx(PreviewPane, { code, diagramId: `code-block-${codeBlockIndex}`, isStreaming: isCodeFenceOpen, language: previewLanguage, title: block?.title ?? "Preview" })
    : jsx.jsx(CodeSurface, { code, language, streaming: isCodeFenceOpen, wrapLines: forceCodeBlockWordWrap });
  const renderFrame = (runButton?: unknown, consoleOutput?: unknown): unknown => jsx.jsxs("section", {
    className: classNames("group/code-block overflow-hidden rounded-xl border border-default bg-surface-secondary", stickyHeader && "relative"),
    "data-code-block-language": language ?? "",
    children: [
      jsx.jsxs("header", { className: classNames("flex items-center justify-between gap-2 px-3 py-2 text-sm", stickyHeader && "sticky top-0 z-10"), children: [
        jsx.jsx("span", { children: label }),
        jsx.jsxs("div", { className: "flex items-center gap-1", children: [
          clientPreviewable && !isCodeFenceOpen ? jsx.jsxs("div", { role: "group", "aria-label": "Code block view", children: [
            jsx.jsx(Button, { "aria-label": "Code", "aria-pressed": mode === "code", color: mode === "code" ? "secondary" : "ghostActive", onClick: () => setMode("code"), size: "compact", children: "Code" }),
            jsx.jsx(Button, { "aria-label": "Preview", "aria-pressed": mode === "preview", color: mode === "preview" ? "secondary" : "ghostActive", onClick: () => setMode("preview"), size: "compact", children: "Preview" }),
          ] }) : null,
          runButton ?? null,
          !isCodeFenceOpen && mode === "code" ? jsx.jsx(Button, { "aria-label": "Copy code", color: "ghostActive", onClick: copyCode, size: "compact", children: "Copy" }) : null,
        ] }),
      ] }),
      body,
      consoleOutput ?? null,
    ],
  });
  const canRunPython = (language === "python" || language === "py") && turnContext.messageId != null && !turnContext.shouldBlockExternalEgress;
  return canRunPython
    ? jsx.jsx(React.Suspense ?? React.Fragment, { fallback: renderFrame(), children: jsx.jsx(LazyCodeBlockExecution, { code, codeBlockIndex, disabled: isCodeFenceOpen || turnContext.isStreaming === true, isEdited: false, turnContext, onRun() {}, children: renderFrame }) })
    : renderFrame();
}

function initializeChatGptCodeBlock(): void {
  if (initialized) return; initialized = true;
  initializeCompilerRuntime(); initializeReactCompilerRuntime(); initializeClassNames(); initializeCodeBlockHighlighting(); initializeCodeBlockEditor(); initializeMermaidPreviewActions();
  React = getReactRuntime(); jsx = getJsxRuntime();
  LazyMermaidPreview = React.lazy(async () => {
    const module = await import("../../webview/assets/preview-b78713aaceb0.js") as PreviewModule;
    return { default: module.ChatGptMermaidPreview };
  });
  LazyCodeBlockExecution = React.lazy(async () => {
    const entry = await import("../../webview/assets/entry-f33d8c691f70.js") as ExecutionEntry;
    return { default: await entry.loadCodeBlockExecution() };
  });
}

initializeChatGptCodeBlock();
export { ChatGptCodeBlock };
