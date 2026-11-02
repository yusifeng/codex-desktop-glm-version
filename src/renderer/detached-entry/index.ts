// Detached-window renderer entry.
//
// This is the readable owner of entry-d8508ad25dff.js. It preserves the
// release bootstrap, title-bar interaction, theme propagation and renderer
// lifecycle without the compiler-generated memo-cache bookkeeping.

import {
  Am as browserContentRenderer,
  C_ as initializeTooltip,
  GI as getPlatform,
  Gs as pinIconAsset,
  I3 as getJsxRuntime,
  N3 as getReactDomClient,
  S_ as Icon,
  Td as initializeDetachedServices,
  Ws as initializeButton,
  Xv as FocusSourceIcon,
  Yc as applyCssVariables,
  Yh as Button,
  Zh as initializeIcon,
  c_ as initializeAppProvider,
  e6 as getReact,
  jm as initializeAppShared,
  lw as initializeClassNames,
  o_ as Tooltip,
  qI as initializeFocusSourceIcon,
  s_ as AppProvider,
  wd as createAppHost,
  xd as detachedThemeRuntime,
  yd as initializeAppHost,
} from "@rchunk/app-shared";
import {
  h4 as initializeReact,
  m4 as classNames,
} from "@exact-chunk/app-shared-7b9edc1bfb7f.js";
import {
  r as loadThemeFonts,
  t as initializeThemeFontLoader,
} from "@rchunk/theme-font-face-loader";

type Appearance = {
  fonts?: unknown;
  variant: string;
  variables: Record<string, string>;
};

type DetachedChrome = {
  appearance?: Appearance | null;
  direction: string;
  focusSourceFailedLabel: string;
  focusSourceLabel: string;
  locale: string;
  pinFailedLabel: string;
  pinLabel: string;
  sourceTitle: string;
  unpinLabel: string;
};

type DetachedWindowState = {
  alwaysOnTop: boolean | null;
  chrome: DetachedChrome;
  title: string;
  toolbarState?: unknown;
};

type DetachedRequest = DetachedWindowState & {
  content: { kind: string; [key: string]: unknown };
};

type DetachedWindowsService = {
  focusSource(): unknown;
  getContentKind(): Promise<string | null>;
  getRequest(): Promise<DetachedRequest | null>;
  setAlwaysOnTop(enabled: boolean): unknown;
};

type DisposableLike = { [Symbol.dispose]?(): void };
type DetachedContentRenderer = {
  loadDetachedRenderer(): Promise<(
    request: DetachedRequest,
    appHost: unknown,
    container: HTMLElement,
    themeRuntime: unknown,
    updateWindowState: (state: DetachedWindowState) => void,
    updateStatus: (status: unknown) => void,
  ) => Promise<DisposableLike | void> | DisposableLike | void>;
};

type WindowControlsOverlay = {
  visible?: boolean;
  addEventListener(type: "geometrychange", listener: () => void): void;
  removeEventListener(type: "geometrychange", listener: () => void): void;
};

declare global {
  interface Navigator {
    windowControlsOverlay?: WindowControlsOverlay;
  }
}

const React = getReact();
const ReactDomClient = getReactDomClient();
const jsx = getJsxRuntime();

initializeAppShared();
initializeButton();
initializeReact();
initializeIcon();
initializeTooltip();
initializeClassNames();
initializeAppProvider();
initializeFocusSourceIcon();
initializeThemeFontLoader();
initializeDetachedServices();
initializeAppHost();

const contentRenderers: Record<string, DetachedContentRenderer> = {
  browser: browserContentRenderer as DetachedContentRenderer,
};

function subscribeToControlsOverlay(listener: () => void): () => void {
  const overlay = navigator.windowControlsOverlay;
  overlay?.addEventListener("geometrychange", listener);
  return () => overlay?.removeEventListener("geometrychange", listener);
}

function controlsOverlayVisible(): boolean {
  return navigator.windowControlsOverlay?.visible === true;
}

function controlsOverlayHiddenOnServer(): boolean {
  return false;
}

type DetachedTitleBarProps = DetachedWindowState & {
  onFocusSource(): Promise<unknown>;
  onSetAlwaysOnTop(enabled: boolean): Promise<unknown>;
  statusContent?: unknown;
};

function DetachedTitleBar(props: DetachedTitleBarProps): unknown {
  const {
    title,
    chrome,
    alwaysOnTop,
    statusContent,
    onFocusSource,
    onSetAlwaysOnTop,
  } = props;
  const overlayVisible = React.useSyncExternalStore(
    subscribeToControlsOverlay,
    controlsOverlayVisible,
    controlsOverlayHiddenOnServer,
  );
  const [pending, setPending] = React.useState({ focus: false, pin: false });
  const [failedAction, setFailedAction] = React.useState<"focus" | "pin" | null>(null);

  const runAction = async (action: "focus" | "pin") => {
    setPending((current: { focus: boolean; pin: boolean }) => ({ ...current, [action]: true }));
    setFailedAction(null);
    try {
      const succeeded = await (action === "focus"
        ? onFocusSource()
        : onSetAlwaysOnTop(!alwaysOnTop));
      if (!succeeded) setFailedAction(action);
    } catch {
      setFailedAction(action);
    }
    setPending((current: { focus: boolean; pin: boolean }) => ({ ...current, [action]: false }));
  };

  const failureLabel = failedAction === "focus"
    ? chrome.focusSourceFailedLabel
    : chrome.pinFailedLabel;
  const pinTooltip = alwaysOnTop ? chrome.unpinLabel : chrome.pinLabel;

  return jsx.jsxs("header", {
    className: classNames(
      "_TitleBar_74py0_2",
      "flex shrink-0 items-center gap-2 bg-surface text-sm text-default draggable select-none",
    ),
    "data-controls-overlay-visible": overlayVisible,
    "data-platform": getPlatform(),
    dir: chrome.direction,
    children: [
      jsx.jsx("span", { className: "min-w-0 flex-1 truncate", title, children: title }),
      statusContent,
      failedAction == null
        ? null
        : jsx.jsx("span", {
            className: "truncate",
            role: "status",
            title: failureLabel,
            children: failureLabel,
          }),
      jsx.jsx(Tooltip, {
        side: "bottom",
        tooltipContent: chrome.focusSourceLabel,
        children: jsx.jsxs(Button, {
          className: "max-w-1/2",
          color: "ghostSecondary",
          size: "compact",
          allowShrink: true,
          disabled: pending.focus,
          onClick: () => void runAction("focus"),
          children: [
            jsx.jsx(FocusSourceIcon, {}),
            jsx.jsx("span", { className: "truncate", children: chrome.sourceTitle }),
          ],
        }),
      }),
      alwaysOnTop == null
        ? null
        : jsx.jsx(Tooltip, {
            side: "bottom",
            tooltipContent: pinTooltip,
            children: jsx.jsx(Button, {
              "aria-label": chrome.pinLabel,
              "aria-pressed": alwaysOnTop,
              color: alwaysOnTop ? "ghostActive" : "ghostSecondary",
              size: "compact",
              uniform: true,
              disabled: pending.pin,
              onClick: () => void runAction("pin"),
              children: jsx.jsx(Icon, { className: "shrink-0", asset: pinIconAsset }),
            }),
          }),
    ],
  });
}

/** Boot the renderer selected by the detached-window service. */
async function initializeDetachedWindow(): Promise<DisposableStack> {
  const disposables = new DisposableStack();
  const appHost = disposables.use(createAppHost());
  const detachedWindows = await (appHost as unknown as {
    services: { detachedWindows: Promise<DetachedWindowsService | null> };
  }).services.detachedWindows;
  if (detachedWindows == null) throw new Error("Detached window service is unavailable");

  const contentKind = await detachedWindows.getContentKind();
  if (contentKind == null) throw new Error("Detached window has no content kind");
  const contentRenderer = contentRenderers[contentKind];
  if (contentRenderer == null) throw new Error(`Detached window has unknown content kind: ${contentKind}`);
  await contentRenderer.loadDetachedRenderer();

  const request = await detachedWindows.getRequest();
  const root = document.getElementById("root");
  if (request == null || root == null) throw new Error("Detached window has no source");
  if (request.content.kind !== contentKind) {
    throw new Error("Detached window renderer does not match its content");
  }

  document.documentElement.dataset.codexWindowType = "electron";
  root.className = "flex h-full flex-col overflow-hidden";
  const titleBarContainer = document.createElement("div");
  titleBarContainer.className = "shrink-0";
  const contentContainer = document.createElement("div");
  contentContainer.className = "relative min-h-0 min-w-0 flex-1 bg-surface";
  root.replaceChildren(titleBarContainer, contentContainer);

  const titleBarRoot = ReactDomClient.createRoot(titleBarContainer) as {
    render(node: unknown): void;
    unmount(): void;
  };
  disposables.defer(() => titleBarRoot.unmount());
  let appearance: Appearance | null = null;
  let state: DetachedWindowState = {
    title: request.title,
    chrome: request.chrome,
    toolbarState: request.toolbarState,
    alwaysOnTop: null,
  };
  let statusContent: unknown;

  const renderTitleBar = () => {
    titleBarRoot.render(
      jsx.jsx(AppProvider, {
        children: jsx.jsx(DetachedTitleBar, {
          ...state,
          statusContent,
          onFocusSource: () => Promise.resolve(detachedWindows.focusSource()),
          onSetAlwaysOnTop: (enabled: boolean) => Promise.resolve(detachedWindows.setAlwaysOnTop(enabled)),
        }),
      }),
    );
  };

  const updateWindowState = (nextState: DetachedWindowState) => {
    state = nextState;
    const { chrome } = nextState;
    document.documentElement.lang = chrome.locale;
    document.documentElement.dir = chrome.direction;
    if (chrome.appearance != null) {
      const variables = {
        ...Object.fromEntries(Object.keys(appearance?.variables ?? {}).map((name) => [name, undefined])),
        ...chrome.appearance.variables,
      };
      applyCssVariables(document.documentElement, variables as Record<string, string | undefined>);
      applyCssVariables(document.body, variables as Record<string, string | undefined>);
      document.documentElement.dataset.theme = chrome.appearance.variant;
      void loadThemeFonts([chrome.appearance.fonts as Record<string, unknown>]).catch(() => undefined);
      appearance = chrome.appearance;
    }
    renderTitleBar();
  };

  updateWindowState(state);
  const mountRenderer = await contentRenderer.loadDetachedRenderer();
  const mounted = await mountRenderer(
    request,
    appHost,
    contentContainer,
    detachedThemeRuntime,
    updateWindowState,
    (nextStatus) => {
      statusContent = nextStatus;
      renderTitleBar();
    },
  );
  if (mounted != null && typeof mounted === "object" && Symbol.dispose in mounted) {
    disposables.use(mounted as Disposable);
  }
  return disposables.move();
}

export { initializeDetachedWindow };
