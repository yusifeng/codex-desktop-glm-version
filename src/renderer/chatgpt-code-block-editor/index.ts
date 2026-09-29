import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  I3 as getJsxRuntime,
  K2 as initializeReactCompilerRuntime,
  e6 as getReactRuntime,
  h4 as initializeClassNames,
  m4 as classNames,
  n4 as useIntl,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import "@rchunk/codemirror-view-runtime";
import "@rchunk/codemirror-commands-runtime";
import "@rchunk/text-editor-merge-runtime";
import { n as codeEditorExtensions, r as initializeCodeBlockHighlighting } from "@rchunk/chatgpt-code-block-highlighting";

type LanguageSupport = unknown;
type LanguageLoader = () => Promise<LanguageSupport | null>;

interface MutableRef<Value> { current: Value }
interface CodeBlockEditorHandle { focus(): void }
interface CodeBlockEditorProps {
  className?: string;
  code: string;
  editorStateRef?: MutableRef<unknown>;
  language?: string | null;
  onBlur?(): void;
  onChange(value: string): void;
  placeholder?: string;
  ref?: MutableRef<CodeBlockEditorHandle | null> | ((value: CodeBlockEditorHandle | null) => void);
  wrapLines?: boolean;
}
interface TextAreaLike { focus(): void; value: string }
interface ChangeEvent { target: { value: string } }
type ModuleShape = Record<string, unknown>;

let jsx: JsxRuntime;
let React: ReactRuntime;
let initialized = false;
const loadedLanguages = new Map<string, LanguageSupport | null>();
const pendingLanguages = new Map<string, Promise<LanguageSupport | null>>();

function pick(module: ModuleShape, name: string, invoke = false): LanguageSupport | null {
  const value = module[name];
  if (invoke && typeof value === "function") return (value as () => unknown)();
  return value ?? null;
}

const shell = () => import("../../webview/assets/shell-d2f5d33d6a1d.js").then((module) => pick(module, "shell"));
const clike = (name: string) => (module: ModuleShape) => pick(module, name);

const languageLoaders: Record<string, LanguageLoader> = {
  bash: shell,
  zsh: shell,
  swift: () => import("../../webview/assets/swift-8dfd81d616cd.js").then((module) => pick(module, "swift")),
  css: () => import("../../webview/assets/dist-e0e1dd5f7b9f.js").then((module) => pick(module, "css", true)),
  html: () => import("../../webview/assets/dist-6c07c37ac5cf.js").then((module) => pick(module, "html", true)),
  javascript: () => import("../../webview/assets/dist-4d0af915d2c7.js").then((module) => {
    const factory = module.javascript;
    return typeof factory === "function" ? factory({ jsx: true, typescript: false }) : null;
  }),
  typescript: () => import("../../webview/assets/dist-4d0af915d2c7.js").then((module) => {
    const factory = module.javascript;
    return typeof factory === "function" ? factory({ jsx: true, typescript: true }) : null;
  }),
  json: () => import("../../webview/assets/dist-5f3b979f6042.js").then((module) => pick(module, "json", true)),
  python: () => import("../../webview/assets/dist-e57f9dd71fd9.js").then((module) => pick(module, "python", true)),
  sql: () => import("../../webview/assets/dist-bb15462d19af.js").then((module) => pick(module, "sql", true)),
  go: () => import("../../webview/assets/dist-d3d163026d8c.js").then((module) => pick(module, "go", true)),
  yaml: () => import("../../webview/assets/dist-d5dd03b951f2.js").then((module) => pick(module, "yaml", true)),
  java: () => import("../../webview/assets/dist-d6b4a14570bf.js").then((module) => pick(module, "java", true)),
  rust: () => import("../../webview/assets/dist-36a943344ead.js").then((module) => pick(module, "rust", true)),
  cpp: () => import("../../webview/assets/dist-eb3db1b44f9c.js").then((module) => pick(module, "cpp", true)),
  php: () => import("../../webview/assets/dist-e0c27992a03d.js").then((module) => pick(module, "php", true)),
  xml: () => import("../../webview/assets/dist-8c3f059ab4f8.js").then((module) => pick(module, "xml", true)),
  vue: () => import("../../webview/assets/dist-cdf530b7ad54.js").then((module) => pick(module, "vue", true)),
  ruby: () => import("../../webview/assets/ruby-4b369efc8a8f.js").then((module) => pick(module, "ruby")),
  haskell: () => import("../../webview/assets/haskell-99fa71648973.js").then((module) => pick(module, "haskell")),
  kotlin: () => import("../../webview/assets/clike-ce9cd077a325.js").then(clike("kotlin")),
  csharp: () => import("../../webview/assets/clike-ce9cd077a325.js").then(clike("csharp")),
  vb: () => import("../../webview/assets/vb-22c198681731.js").then((module) => pick(module, "vb")),
  c: () => import("../../webview/assets/clike-ce9cd077a325.js").then(clike("c")),
  objectivec: () => import("../../webview/assets/clike-ce9cd077a325.js").then(clike("objectiveC")),
  r: () => import("../../webview/assets/r-e2816acf1612.js").then((module) => pick(module, "r")),
  lua: () => import("../../webview/assets/lua-2129c39c5c75.js").then((module) => pick(module, "lua")),
  dart: () => import("../../webview/assets/clike-ce9cd077a325.js").then(clike("dart")),
  scala: () => import("../../webview/assets/clike-ce9cd077a325.js").then(clike("scala")),
  perl: () => import("../../webview/assets/perl-f304e93a1a94.js").then((module) => pick(module, "perl")),
  commonlisp: () => import("../../webview/assets/commonlisp-7766ebc65967.js").then((module) => pick(module, "commonLisp")),
  clojure: () => import("../../webview/assets/clojure-c69d8cb25c09.js").then((module) => pick(module, "clojure")),
  ocaml: () => import("../../webview/assets/mllike-18ec050dd84d.js").then((module) => pick(module, "oCaml")),
  powershell: () => import("../../webview/assets/powershell-242ce14e5ebb.js").then((module) => pick(module, "powerShell")),
  verilog: () => import("../../webview/assets/verilog-6d1b0f2b4c27.js").then((module) => pick(module, "verilog")),
  dockerfile: () => import("../../webview/assets/dockerfile-52b80bf56b3a.js").then((module) => pick(module, "dockerFile")),
};

function isLanguageSupported(language: string): boolean { return Object.hasOwn(languageLoaders, language); }
function getLoadedLanguage(language: string): LanguageSupport | null { return loadedLanguages.get(language) ?? null; }
function initializeLanguageRegistry(): void { void languageLoaders; }

function loadLanguage(language: string): Promise<LanguageSupport | null> {
  if (loadedLanguages.has(language)) return Promise.resolve(loadedLanguages.get(language) ?? null);
  const pending = pendingLanguages.get(language);
  if (pending != null) return pending;
  const loader = languageLoaders[language];
  if (loader == null) return Promise.resolve(null);
  const request = loader().then((support) => { loadedLanguages.set(language, support); return support; }).catch(() => null).finally(() => pendingLanguages.delete(language));
  pendingLanguages.set(language, request);
  return request;
}

function assignRef(ref: CodeBlockEditorProps["ref"], value: CodeBlockEditorHandle | null): void {
  if (typeof ref === "function") ref(value); else if (ref != null) ref.current = value;
}

function ChatGptCodeBlockEditor({ className, code, editorStateRef, language, onBlur, onChange, placeholder, ref, wrapLines = false }: CodeBlockEditorProps): unknown {
  const intl = useIntl();
  const elementRef = React.useRef<TextAreaLike | null>(null);
  const [languageSupport, setLanguageSupport] = React.useState<LanguageSupport | null>(() => language == null ? null : getLoadedLanguage(language));

  React.useEffect(() => {
    let active = true;
    if (language == null) { setLanguageSupport(null); return; }
    void loadLanguage(language).then((support) => { if (active) setLanguageSupport(support); });
    return () => { active = false; };
  }, [language]);

  React.useEffect(() => {
    const handle = { focus: () => elementRef.current?.focus() };
    assignRef(ref, handle);
    return () => assignRef(ref, null);
  }, [ref]);

  if (editorStateRef != null) editorStateRef.current = { code, extensions: codeEditorExtensions, language, languageSupport };

  return jsx.jsx("textarea", {
    ref: (element: TextAreaLike | null) => { elementRef.current = element; },
    className: classNames("min-h-24 w-full overflow-auto bg-transparent font-mono text-size-code text-default outline-none", wrapLines ? "whitespace-pre-wrap" : "whitespace-pre", className),
    dir: "ltr",
    value: code,
    placeholder,
    spellCheck: false,
    "aria-label": intl.formatMessage({ id: "chatgpt.codeBlocks.editor.ariaLabel", defaultMessage: "Edit code", description: "Accessible label for an editable code block" }),
    "aria-multiline": true,
    "data-code-language": language ?? undefined,
    "data-language-loaded": languageSupport != null,
    onBlur,
    onChange: (event: ChangeEvent) => onChange(event.target.value),
    onCopy: (event: { stopPropagation(): void }) => event.stopPropagation(),
  });
}

function initializeChatGptCodeBlockEditor(): void {
  if (initialized) return;
  initialized = true;
  initializeCompilerRuntime();
  initializeReactCompilerRuntime();
  initializeClassNames();
  initializeCodeBlockHighlighting();
  initializeLanguageRegistry();
  React = getReactRuntime();
  jsx = getJsxRuntime();
}

export {
  isLanguageSupported as a,
  getLoadedLanguage as i,
  initializeChatGptCodeBlockEditor as n,
  initializeLanguageRegistry as o,
  loadLanguage as r,
  ChatGptCodeBlockEditor as t,
};
