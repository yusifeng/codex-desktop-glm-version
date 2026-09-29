import "@rchunk/rolldown-runtime";
import {
  H3 as initializePreloadRuntime,
  I3 as getJsxRuntime,
  Jm as createLazyComponent,
  V3 as loadWithPreload,
  __ as stableCallbackValue,
  ck as getToastManager,
  e6 as getReactRuntime,
  fg as useDarkMode,
  n4 as useIntl,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
// @ts-expect-error Art is part of the published app-initial export surface.
import { Art as downloadImage, Nat as LoadingRow, Pat as initializeLoadingRow, Trt as initializeLightbox, wrt as ImageLightbox } from "@rchunk/app-initial";
// @ts-expect-error The image chunk's full Mermaid surface is declared with this alias.
import { a as initializeImage, c as resolveThemeVariables, i as MermaidSvgRenderer, n as cloneSvg, s as defaultThemeVariables, t as rasterizeSvg, u as renderMermaidSource } from "@rchunk/image";

interface MermaidImage { height: number; src: string; width: number }
interface MermaidEditablePreviewProps { alt: string; chatTheme?: string; code: string; downloadAriaLabel: string; image: MermaidImage | null; onCodeBlur?: () => void; onCodeChange?: (code: string) => void; onOpenChange(open: boolean): void }
interface IntlRuntime { formatMessage(descriptor: { defaultMessage: string; description?: string; id: string }): string }
interface ToastRuntime { danger(message: string, options?: { errorAnalytics?: { toastId: string } }): void }
interface ThemeVariables extends Record<string, unknown> {}
interface SvgLike { src: string }
type Mode = "code" | "diagram" | "error" | "loading";
type StableCallback = <Arguments extends unknown[], Result>(callback: (...arguments_: Arguments) => Result) => (...arguments_: Arguments) => Result;
type MermaidCodeEditorComponent = (props: { editStateKey: string; initialCode: string; onBlur(): void; onChange(value: string): void }) => unknown;

const useStableCallback = stableCallbackValue as StableCallback;
const copySvg = cloneSvg as unknown as (element: SVGSVGElement | null) => MermaidImage | null;
const renderSource = renderMermaidSource as unknown as (input: { diagramId: string; isDarkMode: boolean; source: string; themeVariables: ThemeVariables }) => Promise<string | null>;
const sanitizeSvg = copySvg as unknown as (element: SVGSVGElement | null) => MermaidImage | null;
const themeVariablesFor = resolveThemeVariables as unknown as (input: { chatTheme: string; isDarkMode: boolean }) => ThemeVariables | null;
const fallbackThemeVariables = defaultThemeVariables as unknown as ThemeVariables;
let React: ReactRuntime;
let jsx: JsxRuntime;
let MermaidCodeEditor: MermaidCodeEditorComponent;

function MermaidEditablePreview({ alt, chatTheme, code, downloadAriaLabel, image, onCodeChange, onCodeBlur, onOpenChange }: MermaidEditablePreviewProps): unknown {
  const intl = useIntl() as IntlRuntime;
  const id = React.useId();
  const darkMode = useDarkMode() === true;
  const resolvedTheme = chatTheme == null ? fallbackThemeVariables : themeVariablesFor({ chatTheme, isDarkMode: darkMode }) ?? fallbackThemeVariables;
  const [draftCode, setDraftCode] = React.useState(code);
  const [renderedCode, setRenderedCode] = React.useState(code);
  const [renderedImage, setRenderedImage] = React.useState(image);
  const [renderTheme, setRenderTheme] = React.useState({ isDarkMode: darkMode, themeVariables: resolvedTheme });
  const [mode, setMode] = React.useState<Mode>(image == null ? "code" : "diagram");
  const renderSequence = React.useRef(0);
  React.useEffect(() => () => { renderSequence.current += 1; }, []);

  const toggle = useStableCallback(async (): Promise<void> => {
    const sequence = ++renderSequence.current;
    if (mode !== "code") { setMode("code"); return; }
    if (draftCode === renderedCode && renderedImage != null) { setMode("diagram"); return; }
    setMode("loading");
    try {
      const markup = await renderSource({
        diagramId: `chatgpt-mermaid-expanded-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`,
        isDarkMode: darkMode,
        source: draftCode,
        themeVariables: resolvedTheme,
      });
      const template = document.createElement("template");
      template.innerHTML = markup ?? "";
      const nextImage = sanitizeSvg(template.content.querySelector("svg"));
      if (sequence !== renderSequence.current) return;
      if (nextImage == null) { setMode("error"); return; }
      setRenderedImage(nextImage);
      setRenderedCode(draftCode);
      setRenderTheme({ isDarkMode: darkMode, themeVariables: resolvedTheme });
      setMode("diagram");
    } catch {
      if (sequence === renderSequence.current) setMode("error");
    }
  });
  const download = React.useCallback(async (): Promise<void> => {
    if (renderedImage == null) return;
    const source = await rasterizeSvg(renderedImage.src);
    const success = source == null ? false : await downloadImage({ downloadSrc: source, suggestedFilename: "mermaid-diagram.png" });
    if (!success) (getToastManager() as ToastRuntime).danger(intl.formatMessage({ id: "imageSidePanel.downloadFailure", defaultMessage: "Could not download image", description: "Error shown when the image toolbar download fails." }), { errorAnalytics: { toastId: "imageSidePanel.downloadFailure" } });
  }, [intl, renderedImage]);
  const buttonLabel = intl.formatMessage(mode === "code" ? { id: "mermaidDiagram.viewDiagram", defaultMessage: "View Diagram", description: "Switch from Mermaid code to the diagram" } : { id: "mermaidDiagram.editCode", defaultMessage: "Edit Code", description: "Switch from the diagram to Mermaid code" });
  let previewContent: unknown;
  if (mode === "code") previewContent = jsx.jsx(MermaidCodeEditor, { editStateKey: id, initialCode: draftCode, onBlur: () => onCodeBlur?.(), onChange: (value: string) => { setDraftCode(value); onCodeChange?.(value); } });
  else if (mode === "loading") previewContent = jsx.jsx(LoadingRow, { isStreaming: false });
  else if (mode === "error") previewContent = jsx.jsx("div", { role: "alert", children: "Couldn’t render diagram. Edit the code to try again" });
  const zoomableContent = renderedImage == null ? undefined : { width: renderedImage.width, height: renderedImage.height, content: jsx.jsx(MermaidSvgRenderer, { chatTheme, code: renderedCode, diagramId: `expanded-${id}`, renderTheme, sizing: "fill", onError: () => setMode("error") }) };
  return jsx.jsx(ImageLightbox, {
    alt,
    downloadAriaLabel,
    imageSurface: "card",
    onDownload: () => void download(),
    onOpenChange,
    open: true,
    previewContent: previewContent == null ? undefined : jsx.jsx("div", { className: "flex h-full min-h-0 w-full flex-col bg-surface text-default", children: previewContent }),
    showDownload: mode === "diagram",
    showZoomControls: mode === "diagram",
    src: renderedImage?.src ?? "",
    toolbarLeadingAction: onCodeChange == null ? undefined : { ariaLabel: buttonLabel, label: buttonLabel, onClick: () => void toggle() },
    zoomableContent,
  });
}

initializeImage();
initializeLoadingRow();
initializeLightbox();
React = getReactRuntime();
jsx = getJsxRuntime();
initializePreloadRuntime();
MermaidCodeEditor = createLazyComponent(async () => {
  const loaded = await loadWithPreload(() => import("@rchunk/mermaid-code-editor"), [
    "./editor-586a9e08096d.js", "./rolldown-runtime-2d059c5e81f4.js", "./app-shared-7b9edc1bfb7f.js", "./app-shared-fa570b9eb9dd.css", "./app-initial-51da50e6c6e3.js", "./app-initial-e8ceb32eb626.css", "./codex-diff-css-4cc1d2356a79.js", "./register-pierre-themes-58d8ca57f84b.js", "./File-4270090fca79.js", "./renderFileChildren-897963e963e5.js", "./editor-370fecef1630.js",
  ], import.meta.url);
  return loaded.MermaidCodeEditor;
});

export { MermaidEditablePreview };
