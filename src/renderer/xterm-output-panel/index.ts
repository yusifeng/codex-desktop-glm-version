// Read-only xterm output surface used by background terminal tabs.

import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as themeFontFamilyChunk from "@rchunk/theme-font-family";
import * as themeFontFaceLoaderChunk from "@rchunk/theme-font-face-loader";
import * as xtermWindowZoomChunk from "@rchunk/xterm-window-zoom";
import "@rchunk/terminal-panel-bootstrap";

interface JsxRuntime { jsx(type: unknown, props: object, key?: string): unknown }
interface Ref<Value> { current: Value }
interface ReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useEffectEvent?<Arguments extends unknown[], Result>(callback: (...arguments_: Arguments) => Result): (...arguments_: Arguments) => Result;
  useLayoutEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void;
  useRef<Value>(initialValue: Value): Ref<Value>;
}
interface TerminalTheme { [key: string]: string | undefined }
interface TerminalOptions { fontFamily?: string; fontSize?: number; theme?: TerminalTheme; [key: string]: unknown }
interface TerminalInstance {
  options: TerminalOptions;
  rows: number;
  dispose(): void;
  loadAddon(addon: unknown): void;
  open(element: HTMLDivElement): void;
  refresh(start: number, end: number): void;
  reset(): void;
  scrollToBottom(): void;
  write(output: string): void;
}
interface FitAddonInstance { fit(): void }
interface ThemeDefinition { fonts: { code: string; codeFace?: string | null }; [key: string]: unknown }
type OutputReader = () => string | string[];

const shared = appSharedChunk as unknown as {
  $3?: () => void;
  Cz?: { lightChromeTheme: unknown; darkChromeTheme: unknown; codeFontSize: unknown };
  I3: () => JsxRuntime;
  e6: () => ReactRuntime;
  wL?: () => void;
  x_?: () => unknown;
  y_?: () => void;
};
const initial = appInitialChunk as unknown as {
  CW?: (mode: unknown) => "light" | "dark";
  Kcn?: <Value>(setting: unknown) => Value;
  SW?: () => unknown;
  Vcn?: () => void;
  bk?: () => void;
  vk?: (element: HTMLDivElement, theme: ThemeDefinition, colorScheme: "light" | "dark") => void;
  xW?: () => void;
  yk?: (theme: unknown, mode: "light" | "dark") => ThemeDefinition;
};
const fontFamily = themeFontFamilyChunk as unknown as { t?: (family: string, face: string) => boolean };
const fontLoader = themeFontFaceLoaderChunk as unknown as { n?: (face: string) => Promise<void>; t?: (family: string, size: number) => Promise<void> };
const xterm = xtermWindowZoomChunk as unknown as {
  _?: () => { Terminal: new (options: TerminalOptions) => TerminalInstance };
  a?: (fonts: ThemeDefinition["fonts"]) => string;
  c?: (terminal: TerminalInstance) => boolean;
  d?: (theme: ThemeDefinition) => TerminalTheme;
  f?: () => void;
  h?: unknown;
  i?: (family: string, size: number) => Promise<void>;
  l?: (terminal: TerminalInstance) => string | string[];
  m?: unknown;
  n?: (terminal: TerminalInstance, getModifierState: () => unknown) => () => void;
  o?: (output: string) => string;
  p?: () => void;
  s?: () => void;
  u?: () => void;
  v?: () => { WebLinksAddon: new (handler: unknown) => unknown };
  y?: () => { FitAddon: new () => FitAddonInstance };
  [key: string]: unknown;
};

const { $3: initializeSharedRuntime, Cz: settings, I3: getJsxRuntime, e6: getReactRuntime, wL: initializeSharedLinks, x_: useModifierState, y_: initializeSharedTheme } = shared;
const { CW: resolveColorScheme, Kcn: useSetting, SW: useThemeMode, Vcn: initializeThemeState, bk: initializeThemeConfig, vk: applyTheme, xW: initializeTerminalTheme, yk: resolveTheme } = initial;
const { t: isFontFaceAvailable } = fontFamily;
const { n: loadFontFace, t: loadTerminalFont } = fontLoader;
const { _: getTerminalModule, a: getCodeFontFamily, c: isScrolledToBottom, d: getTerminalTheme, f: initializeXtermTheme, h: linkHandler, i: prepareTerminalFont, l: readTerminalOutput, m: webLinkHandler, n: attachModifierState, o: normalizeTerminalOutput, p: initializeXtermCore, s: initializeXtermLinks, u: initializeXtermFit, v: getWebLinksAddonModule, y: getFitAddonModule } = xterm;

let jsx: JsxRuntime;
let React: ReactRuntime;
let TerminalConstructor: new (options: TerminalOptions) => TerminalInstance;
let FitAddonConstructor: new () => FitAddonInstance;
let WebLinksAddonConstructor: new (handler: unknown) => unknown;
let initialized = false;

function initializeXtermOutputPanel(): void {
  if (initialized) return;
  initializeSharedRuntime?.();
  initializeSharedLinks?.();
  initializeSharedTheme?.();
  initializeThemeState?.();
  initializeThemeConfig?.();
  initializeTerminalTheme?.();
  initializeXtermCore?.();
  initializeXtermTheme?.();
  initializeXtermFit?.();
  initializeXtermLinks?.();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  TerminalConstructor = getTerminalModule?.().Terminal as new (options: TerminalOptions) => TerminalInstance;
  FitAddonConstructor = getFitAddonModule?.().FitAddon as new () => FitAddonInstance;
  WebLinksAddonConstructor = getWebLinksAddonModule?.().WebLinksAddon as new (handler: unknown) => unknown;
  initialized = true;
}

function XtermOutputPanel({ output, onRenderedOutputReady }: { output: string; onRenderedOutputReady?: (readOutput: OutputReader) => void | (() => void) }): unknown {
  initializeXtermOutputPanel();
  const modifierState = useModifierState?.();
  const themeMode = useThemeMode?.();
  const colorScheme = resolveColorScheme?.(themeMode) ?? "dark";
  const lightTheme = useSetting?.<unknown>(settings?.lightChromeTheme);
  const darkTheme = useSetting?.<unknown>(settings?.darkChromeTheme);
  const fontSize = useSetting?.<number>(settings?.codeFontSize) ?? 12;
  const theme = resolveTheme?.(colorScheme === "light" ? lightTheme : darkTheme, colorScheme) ?? { fonts: { code: "monospace" } };
  const fontFace = theme.fonts.codeFace != null && isFontFaceAvailable?.(theme.fonts.code, theme.fonts.codeFace) ? theme.fonts.codeFace : undefined;
  const codeFontFamily = getCodeFontFamily?.(theme.fonts) ?? theme.fonts.code;
  const outerRef = React.useRef<HTMLDivElement | null>(null);
  const terminalElementRef = React.useRef<HTMLDivElement | null>(null);
  const terminalRef = React.useRef<TerminalInstance | null>(null);
  const fitAddonRef = React.useRef<FitAddonInstance | null>(null);
  const renderedOutputRef = React.useRef("");
  const modifierStateRef = React.useRef(modifierState);

  const registerReader = (terminal: TerminalInstance): void | (() => void) => {
    if (onRenderedOutputReady == null) return;
    let source: TerminalInstance | string[] = terminal;
    const read = (): string | string[] => Array.isArray(source) ? source : readTerminalOutput?.(source) ?? "";
    onRenderedOutputReady(read);
    return () => { source = Array.isArray(read()) ? read() as string[] : [String(read())]; };
  };
  const stableRegisterReader = React.useEffectEvent?.(registerReader) ?? registerReader;

  React.useLayoutEffect(() => { modifierStateRef.current = modifierState; }, [modifierState]);
  React.useLayoutEffect(() => { if (outerRef.current != null) applyTheme(outerRef.current, theme, colorScheme); }, [theme, colorScheme]);
  React.useEffect(() => {
    const terminal = terminalRef.current;
    if (terminal != null) { terminal.options.theme = getTerminalTheme?.(theme); if (terminal.rows > 0) terminal.refresh(0, terminal.rows - 1); }
  }, [theme, colorScheme]);
  React.useEffect(() => {
    const terminal = terminalRef.current;
    if (terminal == null) return;
    let cancelled = false;
    let frame: number | null = null;
    void (async () => {
      if (fontFace != null) await loadFontFace?.(fontFace);
      await (prepareTerminalFont?.(codeFontFamily, fontSize) ?? loadTerminalFont?.(codeFontFamily, fontSize));
      if (!cancelled) { terminal.options.fontFamily = codeFontFamily; terminal.options.fontSize = fontSize; frame = requestAnimationFrame(() => fitAddonRef.current?.fit()); }
    })();
    return () => { cancelled = true; if (frame != null) cancelAnimationFrame(frame); };
  }, [codeFontFamily, fontSize, fontFace]);
  React.useEffect(() => {
    const element = terminalElementRef.current;
    const outer = outerRef.current;
    if (element == null || outer == null) return;
    let disposed = false;
    let scrollFrame: number | null = null;
    const terminal = new TerminalConstructor({ allowProposedApi: true, allowTransparency: true, cursorStyle: "bar", disableStdin: true, fontSize, fontFamily: codeFontFamily, letterSpacing: 0, lineHeight: 1.2, linkHandler, theme: getTerminalTheme?.(theme) });
    const fitAddon = new FitAddonConstructor();
    const scheduleBottom = () => { if (scrollFrame == null) scrollFrame = requestAnimationFrame(() => { scrollFrame = null; terminal.scrollToBottom(); }); };
    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(new WebLinksAddonConstructor(webLinkHandler));
    terminal.open(element);
    const detachModifierState = attachModifierState?.(terminal, () => modifierStateRef.current) ?? (() => undefined);
    fitAddon.fit();
    if (renderedOutputRef.current.length > 0) { terminal.write(normalizeTerminalOutput?.(renderedOutputRef.current) ?? renderedOutputRef.current); scheduleBottom(); }
    const observer = new ResizeObserver(() => { if (!disposed) fitAddon.fit(); });
    observer.observe(element);
    const unregisterReader = stableRegisterReader(terminal);
    return () => {
      if (typeof unregisterReader === "function") unregisterReader();
      disposed = true;
      if (scrollFrame != null) cancelAnimationFrame(scrollFrame);
      observer.disconnect();
      fitAddonRef.current = null;
      terminalRef.current = null;
      detachModifierState();
      terminal.dispose();
    };
  }, [codeFontFamily, fontSize]);
  React.useEffect(() => {
    const terminal = terminalRef.current;
    if (terminal == null) { renderedOutputRef.current = output; return; }
    const previous = renderedOutputRef.current;
    const wasAtBottom = isScrolledToBottom?.(terminal) ?? true;
    if (output.startsWith(previous)) {
      const suffix = output.slice(previous.length);
      if (suffix.length > 0) terminal.write(normalizeTerminalOutput?.(suffix) ?? suffix);
    } else {
      terminal.reset();
      if (output.length > 0) terminal.write(normalizeTerminalOutput?.(output) ?? output);
    }
    renderedOutputRef.current = output;
    if (wasAtBottom) { const frame = requestAnimationFrame(() => terminal.scrollToBottom()); return () => cancelAnimationFrame(frame); }
  }, [output]);

  return jsx.jsx("div", { "data-codex-xterm": true, ref: outerRef, className: "relative flex h-full w-full flex-col", style: { backgroundColor: "var(--color-codex-terminal-background)", color: "var(--color-codex-terminal-foreground)" }, children: jsx.jsx("div", { className: "flex-1 overflow-hidden py-3 ps-3 tracking-normal", children: jsx.jsx("div", { className: "h-full w-full overflow-hidden", ref: terminalElementRef }) }) });
}

initializeXtermOutputPanel();
export { XtermOutputPanel };
