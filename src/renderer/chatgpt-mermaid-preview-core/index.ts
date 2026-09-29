import "@rchunk/rolldown-runtime";
import {
  $3 as initializeSharedRuntime,
  H3 as initializePreloadRuntime,
  I3 as getJsxRuntime,
  Jm as createLazyComponent,
  K2 as initializeUiRuntime,
  V3 as loadWithPreload,
  e6 as getReactRuntime,
  g_ as initializeToastRuntime,
  h4 as initializeClassNames,
  lk as initializeImperativeHandleRuntime,
  m4 as classNames,
  n4 as useIntl,
  qm as initializeQueryRuntime,
  type JsxRuntime,
} from "@rchunk/app-shared";
import { ck as getToastManager } from "@rchunk/app-shared";
import { Nat as LoadingRow, Pat as initializeLoadingRow } from "@rchunk/app-initial";
import { a as initializeMermaidImage, i as MermaidSvgRenderer, n as cloneMermaidSvg, r as initializeMermaidRasterizer, t as rasterizeMermaidSvg } from "@rchunk/image";

interface MermaidPreviewActions {
  captureScreenshotDataUrl(): Promise<string | null>;
  focus(): void;
  openFullscreen(): Promise<void>;
}
interface MermaidPreviewProps {
  actions?: unknown;
  chatTheme?: string;
  code: string;
  diagramId?: string;
  errorFallback?: unknown;
  isStreaming: boolean;
  onCodeBlur?: () => void;
  onCodeChange?: (code: string) => void;
  ref?: unknown;
}
interface SvgClone { height: number; src: string; width: number }
interface FocusTarget { focus(): void }
interface IntlRuntime { formatMessage(descriptor: { defaultMessage: string; description?: string; id: string }): string }
interface ReactHooks {
  useCallback<Callback>(callback: Callback, dependencies: readonly unknown[]): Callback;
  useImperativeHandle(ref: unknown, create: () => MermaidPreviewActions, dependencies: readonly unknown[]): void;
  useRef<Value>(initialValue: Value): { current: Value };
  useState<Value>(initialValue: Value): [Value, (value: Value | ((current: Value) => Value)) => void];
}
interface EditablePreviewProps extends Record<string, unknown> {
  alt: string;
  chatTheme?: string;
  code: string;
  downloadAriaLabel: string;
  image: SvgClone | null;
  onCodeBlur?: () => void;
  onCodeChange?: (code: string) => void;
  onOpenChange(open: boolean): void;
}
interface ToastManager { danger(message: string, options?: { errorAnalytics?: { toastId: string } }): void }

const cloneSvg = cloneMermaidSvg as unknown as (element: SVGSVGElement | null) => SvgClone | null;
const rasterizeSvg = rasterizeMermaidSvg as unknown as (source: string) => Promise<string | null>;
let React: ReactHooks;
let jsx: JsxRuntime;
let MermaidEditablePreview: (props: EditablePreviewProps) => unknown;
let initialized = false;

function ChatGptMermaidPreview({
  ref,
  actions,
  chatTheme,
  code,
  diagramId,
  errorFallback,
  isStreaming,
  onCodeChange,
  onCodeBlur,
}: MermaidPreviewProps): unknown {
  const intl = useIntl() as IntlRuntime;
  const trimmedCode = code.trim();
  const [renderedCode, setRenderedCode] = React.useState<string | null>(null);
  const [failedCode, setFailedCode] = React.useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = React.useState<SvgClone | null>(null);
  const containerRef = React.useRef<FocusTarget | null>(null);
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const ready = !isStreaming && (renderedCode === trimmedCode || failedCode === trimmedCode);
  const ariaLabel = intl.formatMessage({
    id: "mermaidDiagram.ariaLabel",
    defaultMessage: "Mermaid diagram",
    description: "Accessible description of a Mermaid diagram generated in a ChatGPT message",
  });
  const downloadLabel = intl.formatMessage({
    id: "chatgpt.codeBlocks.mermaid.downloadPng",
    defaultMessage: "Download as PNG",
    description: "Action that downloads the rendered Mermaid diagram as a PNG image",
  });
  const setSvg = React.useCallback((element: SVGSVGElement | null): void => {
    svgRef.current = element;
    setRenderedCode(element == null ? null : trimmedCode);
  }, [trimmedCode]);
  const captureScreenshotDataUrl = React.useCallback(async (): Promise<string | null> => {
    const source = cloneSvg(svgRef.current)?.src;
    return source == null ? null : rasterizeSvg(source);
  }, []);
  const showOpenError = React.useCallback((): void => {
    (getToastManager() as ToastManager).danger(
      intl.formatMessage({
        id: "mermaidDiagram.openPreviewFailed",
        defaultMessage: "Couldn’t open diagram preview",
        description: "Error shown when preparing a Mermaid diagram for the full-size image viewer fails",
      }),
      { errorAnalytics: { toastId: "mermaidDiagram.openPreviewFailed" } },
    );
  }, [intl]);
  const openFullscreen = React.useCallback(async (): Promise<void> => {
    try {
      await document.fonts.ready;
      const image = cloneSvg(svgRef.current);
      if (image == null && onCodeChange == null) return;
      setFullscreenImage(image);
    } catch {
      showOpenError();
    }
  }, [onCodeChange, showOpenError]);
  React.useImperativeHandle(ref, () => ({
    focus: () => containerRef.current?.focus(),
    captureScreenshotDataUrl,
    openFullscreen,
  }), [captureScreenshotDataUrl, openFullscreen]);

  const rootClassName = classNames(
    "group/mermaid-preview relative isolate flex w-full items-center justify-center",
    !isStreaming && "min-h-60",
  );
  const contentClassName = classNames(
    "flex h-full w-full items-center justify-center overflow-hidden rounded-lg transition-opacity duration-[180ms] ease-enter-snappy",
    ready ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0",
    !isStreaming && "min-h-60",
  );
  const loading = ready ? null : jsx.jsx(LoadingRow, { isStreaming });
  const diagram = isStreaming ? null : jsx.jsx(MermaidSvgRenderer, {
    chatTheme,
    code: trimmedCode,
    diagramId,
    errorFallback,
    onError: () => setFailedCode(trimmedCode),
    svgRef: setSvg,
  }, trimmedCode);
  const fullscreen = fullscreenImage == null ? null : jsx.jsx(MermaidEditablePreview, {
    alt: ariaLabel,
    chatTheme,
    code,
    downloadAriaLabel: downloadLabel,
    image: fullscreenImage,
    onCodeBlur,
    onCodeChange,
    onOpenChange: (open: boolean) => { if (!open) setFullscreenImage(null); },
  });

  return jsx.jsxs("div", {
    ref: containerRef,
    className: rootClassName,
    tabIndex: -1,
    children: [
      loading,
      jsx.jsx("div", { className: contentClassName, children: diagram }),
      ready ? actions : null,
      fullscreen,
    ],
  });
}

function initializeChatGptMermaidPreview(): void {
  if (initialized) return;
  initialized = true;
  initializeSharedRuntime();
  initializeClassNames();
  React = getReactRuntime() as unknown as ReactHooks;
  initializeUiRuntime();
  initializeQueryRuntime();
  initializeImperativeHandleRuntime();
  initializeToastRuntime();
  initializeMermaidImage();
  initializeMermaidRasterizer();
  initializeLoadingRow();
  jsx = getJsxRuntime();
  initializePreloadRuntime();
  MermaidEditablePreview = createLazyComponent<EditablePreviewProps>(async () => {
    const { MermaidEditablePreview: component } = await loadWithPreload(
      () => import("@rchunk/mermaid-editable-preview"),
      [
        "./editable-preview-8cca22390870.js",
        "./rolldown-runtime-2d059c5e81f4.js",
        "./app-shared-7b9edc1bfb7f.js",
        "./app-shared-fa570b9eb9dd.css",
        "./app-initial-51da50e6c6e3.js",
        "./app-initial-e8ceb32eb626.css",
        "./image-1b6037d6ba79.js",
        "./chunk-ZW26E7AF-c8fea83f7f61.js",
        "./chart-colors-7214911051c2.js",
      ],
      import.meta.url,
    );
    return component;
  });
}

export { initializeChatGptMermaidPreview as n, ChatGptMermaidPreview as t };
