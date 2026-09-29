import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  Cz as codeThemeIds,
  H3 as initializeLazyComponents,
  I3 as getJsxRuntime,
  K2 as initializeEditorSurface,
  __ as useStableCallbackValue,
  dg as initializeGrammarRegistry,
  e6 as getReactRuntime,
  fg as useDarkMode,
  g_ as initializeGrammarRuntime,
  n4 as useIntl,
  wL as initializeEditorShared,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import {
  Kcn as useThemeSetting,
  L_n as initializeEditorSettings,
  Vcn as initializeThemeRuntime,
  Y_n as registerLanguage,
  r_t as resolveEditorTheme,
  wk as initializeThemePreference,
} from "@rchunk/app-initial";
import {
  m as initializeDiffCss,
  n as createDiffCss,
  p as DiffEditorProvider,
  r as initializeDiffEditorProvider,
} from "@rchunk/codex-diff-css";
import { t as initializePierreThemes } from "@rchunk/register-pierre-themes";
import { n as initializeFileEditor, t as FileEditorValue } from "@rchunk/pierre-file-editor";
import { n as initializeEditorRuntime, t as EditorValue } from "@rchunk/pierre-editor-runtime";

interface MermaidCodeEditorProps {
  editStateKey: string;
  initialCode: string;
  onBlur(): void;
  onChange(value: string): void;
}

interface EditorFile {
  cacheKey: string;
  contents: string;
  lang: string;
  name: string;
}

interface EditorChangeEvent {
  file: EditorFile;
}

interface FileEditorProps extends Record<string, unknown> {
  className: string;
  disableWorkerPool: boolean;
  edit: boolean;
  editStateKey: string;
  editorOptions: Record<string, unknown>;
  file: EditorFile;
  options: Record<string, unknown>;
}

interface EditorElement {
  focus(options?: { preventScroll?: boolean }): void;
}

type FileEditorComponent = (props: FileEditorProps) => unknown;
type DiffEditorProviderComponent = (props: {
  children?: unknown;
  createEditor(element: HTMLElement, options: unknown, state: unknown): unknown;
}) => unknown;
type EditorConstructor = new (element: HTMLElement, options: unknown, state: unknown) => unknown;
type StableCallbackHook = <Arguments extends unknown[], Result>(
  callback: (...arguments_: Arguments) => Result,
) => (...arguments_: Arguments) => Result;
type MermaidGrammar = Array<Record<string, unknown>>;

const FileEditor = FileEditorValue as unknown as FileEditorComponent;
const Editor = EditorValue as unknown as EditorConstructor;
const DiffProvider = DiffEditorProvider as unknown as DiffEditorProviderComponent;
const useStableCallback = useStableCallbackValue as StableCallbackHook;

let React: ReactRuntime;
let jsx: JsxRuntime;

function focusEditor(element: EditorElement): void {
  element.focus({ preventScroll: true });
}

function createEditor(element: HTMLElement, options: unknown, state: unknown): unknown {
  return new Editor(element, options, state);
}

function MermaidCodeEditor({ editStateKey, initialCode, onBlur, onChange }: MermaidCodeEditorProps): unknown {
  const intl = useIntl();
  const colorScheme = useDarkMode() === true ? "dark" : "light";
  const configuredTheme = useThemeSetting(
    colorScheme === "dark" ? codeThemeIds.darkCodeThemeId : codeThemeIds.lightCodeThemeId,
  );
  const onChangeStable = useStableCallback((event: EditorChangeEvent) => onChange(event.file.contents));
  const onBlurRef = React.useRef(onBlur);
  onBlurRef.current = onBlur;
  React.useEffect(() => () => onBlurRef.current(), []);

  const editorOptions = React.useMemo<Record<string, unknown>>(
    () => ({
      languageCommentConfig: { "mermaid-source": { lineComment: "%%" } },
      onAttach: focusEditor,
      onChange: onChangeStable,
    }),
    [onChangeStable],
  );
  const accessibleName = String(intl.formatMessage({
    id: "chatgpt.codeBlocks.editor.ariaLabel",
    defaultMessage: "Edit code",
    description: "Accessible label for an editable code block in a ChatGPT conversation or its execution dialog",
  }));
  const file = React.useMemo<EditorFile>(
    () => ({ name: accessibleName, contents: initialCode, lang: "mermaid-source", cacheKey: "mermaid-source" }),
    [accessibleName, initialCode],
  );
  const theme = resolveEditorTheme(configuredTheme, colorScheme);
  const unsafeCSS = React.useMemo(
    () => createDiffCss({
      includeDiffHeader: false,
      includeSimpleLineSeparators: false,
      rootSelector: "[data-file]",
      surface: "var(--color-surface)",
    }),
    [],
  );
  const options = React.useMemo<Record<string, unknown>>(
    () => ({
      disableFileHeader: true,
      overflow: "wrap",
      theme: theme.name,
      themeType: colorScheme,
      useTokenTransformer: true,
      unsafeCSS,
    }),
    [colorScheme, theme.name, unsafeCSS],
  );
  const editor = jsx.jsx(DiffProvider, {
    createEditor,
    children: jsx.jsx(FileEditor, {
      className: "[--diffs-editor-selection-bg:var(--color-background-info-soft)] [--diffs-min-number-column-width:1ch]",
      disableWorkerPool: true,
      edit: true,
      editStateKey,
      editorOptions,
      file,
      options,
    }),
  });
  return jsx.jsx("div", { className: "h-full overflow-auto pe-4", onBlur, children: editor });
}

initializeCompilerRuntime();
initializeEditorSettings();
initializeEditorRuntime();
initializeDiffCss();
initializeFileEditor();
initializeEditorShared();
React = getReactRuntime();
initializeEditorSurface();
initializeDiffEditorProvider();
initializePierreThemes();
initializeThemeRuntime();
initializeThemePreference();
initializeGrammarRegistry();
initializeGrammarRuntime();
jsx = getJsxRuntime();
initializeLazyComponents();
registerLanguage("mermaid-source", async () => {
  const grammarModule = await import("@rchunk/mermaid-grammar");
  const grammar = grammarModule.default as MermaidGrammar;
  return {
    default: grammar.map((definition) => ({
      ...definition,
      name: "mermaid-source",
      scopeName: "source.mermaid",
      aliases: [],
      injectionSelector: undefined,
      patterns: [{ include: "#mermaid" }],
    })),
  };
});

export { MermaidCodeEditor };
