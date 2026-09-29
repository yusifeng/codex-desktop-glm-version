import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/app-primary";
import {
  r as initializeAnnotationBatchControlsExport,
  t as AnnotationBatchControls,
} from "@rchunk/artifact-annotation-batch-controls";
import {
  s as initializeAppgenAccess,
  t as canManageAppgenProjectExport,
} from "@rchunk/appgen-access";
import {
  n as openAppgenShareDialogExport,
  t as initializeShareDialog,
} from "@rchunk/open-appgen-share-dialog";

const initializeAnnotationBatchControls = initializeAnnotationBatchControlsExport as unknown as () => void;
const canManageAppgenProject = canManageAppgenProjectExport as unknown as (
  resource: Record<string, unknown>,
) => boolean;
const openAppgenShareDialog = openAppgenShareDialogExport as unknown as (
  scope: unknown,
  projectId: string,
  options: { source: string },
) => void;

const {
  $3: initializeRuntimeLazy,
  I3: getJsxRuntime,
  LX: useScope,
  Y2: FormattedMessage,
  Yh: Button,
  ZI: AppScope,
  e6: getReactRuntime,
  n4: useIntl,
} = appSharedChunk;

interface SiteResource extends Record<string, unknown> {
  currentLiveUrl?: string | null;
  projectId: string;
  publishedRevision?: number | string | null;
  title?: string | null;
  url?: string | null;
}

interface SitePreviewControls {
  confirmAction(action: () => void): boolean;
}

interface SitePreviewProps {
  controlsRef?: import("@rchunk/app-shared").ReactRef<SitePreviewControls | null>;
  onClose(): void;
  resource: SiteResource;
}

interface SiteAnnotation {
  capture?: { blob?: Blob; height?: number; width?: number };
  id: string;
  revision: number;
  target: {
    bounds?: Record<string, number>;
    selector?: string;
    tagName?: string;
    text?: string;
    url: string;
  };
  text: string;
}

interface SitePreviewMessage {
  channel: "sites-preview-annotations";
  event:
    | { type: "navigation-state"; canGoBack: boolean; canGoForward: boolean }
    | { type: "request-mode"; mode: "annotate" | "interact" }
    | { type: "state"; mode: "annotate" | "interact"; annotations: SiteAnnotation[] };
  sessionId: string;
  version: 1;
}

const siteInitial = appInitialChunk as unknown as {
  Oft(options: { event?: unknown; href: string; initiator: string; openTarget: "external-browser" | "in-app-browser" }): void;
  Oin(resource: SiteResource, currentLiveUrl?: string | null): { url: string };
  Pan(scope: unknown, event: Record<string, unknown>): void;
};
const {
  Oft: openSite,
  Oin: resolveSiteUrl,
  Pan: trackSiteInteraction,
} = siteInitial;

const CHANNEL = "sites-preview-annotations";
const MAX_CAPTURE_BYTES = 20 * 1024 * 1024;

function getTrustedOrigins(urlValue: string): string[] {
  try {
    const url = new URL(urlValue);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return [];
    if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:chatgpt\.site|chatgpt-team\.site|appgardenapps\.dev|appgardenapps\.com)$/.test(url.hostname)) {
      return [];
    }
    const normalized = new URL(url);
    normalized.hostname = url.hostname.replace(/\.chatgpt-team\.site$/, ".chatgpt.site");
    return [...new Set([url.origin, normalized.origin])];
  } catch {
    return [];
  }
}

function isAnnotation(value: unknown): value is SiteAnnotation {
  if (value == null || typeof value !== "object") return false;
  const annotation = value as Partial<SiteAnnotation>;
  return typeof annotation.id === "string"
    && annotation.id.length > 0
    && annotation.id.length <= 128
    && Number.isSafeInteger(annotation.revision)
    && (annotation.revision ?? 0) > 0
    && typeof annotation.text === "string"
    && annotation.text.trim().length > 0
    && annotation.text.length <= 4_000
    && annotation.target != null
    && typeof annotation.target.url === "string";
}

function readPreviewMessage(
  event: MessageEvent,
  iframeWindow: Window,
  trustedOrigins: readonly string[],
  sessionId: string,
): SitePreviewMessage["event"] | null {
  if (!event.isTrusted || event.source !== iframeWindow || !trustedOrigins.includes(event.origin)) return null;
  if (event.data == null || typeof event.data !== "object") return null;
  const message = event.data as Partial<SitePreviewMessage>;
  if (message.channel !== CHANNEL || message.version !== 1 || message.sessionId !== sessionId) return null;
  const previewEvent = message.event;
  if (previewEvent == null || typeof previewEvent !== "object" || typeof previewEvent.type !== "string") return null;
  if (previewEvent.type === "navigation-state") {
    return typeof previewEvent.canGoBack === "boolean" && typeof previewEvent.canGoForward === "boolean"
      ? previewEvent
      : null;
  }
  if (previewEvent.type === "request-mode") {
    return previewEvent.mode === "annotate" || previewEvent.mode === "interact" ? previewEvent : null;
  }
  if (previewEvent.type !== "state"
    || (previewEvent.mode !== "annotate" && previewEvent.mode !== "interact")
    || !Array.isArray(previewEvent.annotations)
    || previewEvent.annotations.length > 100
    || !previewEvent.annotations.every(isAnnotation)) return null;
  const annotations = previewEvent.annotations.slice();
  if (new Set(annotations.map((annotation) => annotation.id)).size !== annotations.length) return null;
  if (annotations.some((annotation) => new URL(annotation.target.url).origin !== event.origin)) return null;
  let captureBudget = MAX_CAPTURE_BYTES;
  for (const annotation of annotations) {
    const captureBytes = annotation.capture?.blob?.size ?? 0;
    if (captureBytes > captureBudget) delete annotation.capture;
    else captureBudget -= captureBytes;
  }
  return { ...previewEvent, annotations };
}

let React: import("@rchunk/app-shared").ReactRuntime & {
  useImperativeHandle<T>(ref: import("@rchunk/app-shared").ReactRef<T | null> | undefined, create: () => T, dependencies: readonly unknown[]): void;
};
let jsx: import("@rchunk/app-shared").JsxRuntime;

function SitePreview({ controlsRef, onClose, resource }: SitePreviewProps): unknown {
  initializeSitePreview();
  const scope = useScope(AppScope);
  const intl = useIntl();
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);
  const [status, setStatus] = React.useState<"error" | "loading" | "ready">("loading");
  const [mode, setMode] = React.useState<"annotate" | "interact">("interact");
  const [navigation, setNavigation] = React.useState({ canGoBack: false, canGoForward: false });
  const [annotations, setAnnotations] = React.useState<SiteAnnotation[]>([]);
  const [sessionId] = React.useState(() => crypto.randomUUID());
  const previewUrl = "/sites/" + encodeURIComponent(resource.projectId) + "/preview";
  const resolvedSite = resolveSiteUrl(resource, resource.currentLiveUrl);
  const trustedOrigins = getTrustedOrigins(resolvedSite.url);
  const title = resource.title ?? intl.formatMessage({
    id: "sites.preview.title",
    defaultMessage: "Site preview",
    description: "Accessible title of the generated Site preview iframe",
  });

  const confirmAction = (action: () => void): boolean => {
    if (annotations.length > 0) return false;
    action();
    return true;
  };
  React.useImperativeHandle(controlsRef, () => ({ confirmAction }), [annotations.length]);

  const postCommand = (command: Record<string, unknown>) => {
    const frameWindow = iframeRef.current?.contentWindow;
    if (frameWindow == null) return;
    for (const origin of trustedOrigins) {
      frameWindow.postMessage({ channel: CHANNEL, version: 1, sessionId, command }, origin);
    }
  };

  React.useEffect(() => {
    const frameWindow = iframeRef.current?.contentWindow;
    if (frameWindow == null || trustedOrigins.length === 0) return;
    const onMessage = (event: MessageEvent) => {
      const previewEvent = readPreviewMessage(event, frameWindow, trustedOrigins, sessionId);
      if (previewEvent == null) return;
      if (previewEvent.type === "navigation-state") {
        setNavigation({ canGoBack: previewEvent.canGoBack, canGoForward: previewEvent.canGoForward });
      } else if (previewEvent.type === "request-mode") {
        setMode(previewEvent.mode);
      } else {
        setMode(previewEvent.mode);
        setAnnotations(previewEvent.annotations);
      }
    };
    window.addEventListener("message", onMessage);
    postCommand({ type: "set-mode", mode });
    return () => window.removeEventListener("message", onMessage);
  }, [mode, sessionId, trustedOrigins.join("|")]);

  const canManage = canManageAppgenProject(resource);
  const openPublishedSite = () => {
    trackSiteInteraction(scope, { action: "open-site", projectId: resource.projectId });
    openSite({
      href: resolvedSite.url,
      initiator: "sites_preview",
      openTarget: "external-browser",
    });
  };
  const share = () => {
    trackSiteInteraction(scope, { action: "share", projectId: resource.projectId });
    openAppgenShareDialog(scope, resource.projectId, { source: "in-app-browser" });
  };
  const refresh = () => confirmAction(() => {
    setStatus("loading");
    setReloadKey((value) => value + 1);
  });
  const close = () => confirmAction(onClose);
  const toggleMode = () => {
    const nextMode = mode === "annotate" ? "interact" : "annotate";
    setMode(nextMode);
    postCommand({ type: "set-mode", mode: nextMode });
  };

  const iframe = jsx.jsx("iframe", {
    ref: iframeRef,
    allow: "clipboard-write",
    className: "min-h-0 w-full flex-1 border-0",
    title,
    src: previewUrl,
    referrerPolicy: "no-referrer",
    onError: () => setStatus("error"),
    onLoad: () => setStatus("ready"),
  }, reloadKey);

  const annotationControls = annotations.length === 0 ? null : jsx.jsx(AnnotationBatchControls, {
    annotationCount: annotations.length,
    annotations,
    busy: false,
    onCancel: () => setAnnotations([]),
    onSend: async () => setAnnotations([]),
  });

  return jsx.jsxs("div", {
    className: "@container/site-preview flex h-full min-h-0 flex-col bg-surface",
    children: [
      jsx.jsxs("header", {
        className: "grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-token-border-light px-3 py-2",
        children: [
          jsx.jsxs("div", {
            className: "flex items-center gap-1",
            children: [
              jsx.jsx(Button, {
                "aria-label": "Go back",
                disabled: !navigation.canGoBack,
                onClick: () => postCommand({ type: "navigate-back" }),
                children: "←",
              }),
              jsx.jsx(Button, {
                "aria-label": "Go forward",
                disabled: !navigation.canGoForward,
                onClick: () => postCommand({ type: "navigate-forward" }),
                children: "→",
              }),
              jsx.jsx(Button, {
                "aria-label": "Refresh preview",
                onClick: refresh,
                children: "↻",
              }),
            ],
          }),
          jsx.jsx("button", {
            type: "button",
            className: "min-w-0 truncate font-medium",
            onClick: openPublishedSite,
            children: title,
          }),
          jsx.jsxs("div", {
            className: "flex items-center justify-end gap-1",
            children: [
              canManage ? jsx.jsx(Button, {
                "aria-label": mode === "annotate" ? "Annotating" : "Annotate",
                "aria-pressed": mode === "annotate",
                onClick: toggleMode,
                children: mode === "annotate" ? "Annotating" : "Annotate",
              }) : null,
              canManage ? jsx.jsx(Button, {
                "aria-label": "Share",
                onClick: share,
                children: jsx.jsx(FormattedMessage, { id: "sites.preview.share.label", defaultMessage: "Share" }),
              }) : null,
              jsx.jsx(Button, {
                "aria-label": "Close site preview",
                onClick: close,
                children: "×",
              }),
            ],
          }),
        ],
      }),
      jsx.jsxs("div", {
        className: "relative flex min-h-0 flex-1 flex-col",
        children: [
          status === "loading" ? jsx.jsx("div", {
            className: "absolute inset-0 z-10 flex items-center justify-center bg-surface text-secondary",
            role: "status",
            children: jsx.jsx(FormattedMessage, { id: "sites.preview.loading", defaultMessage: "Loading preview…" }),
          }) : null,
          status === "error" ? jsx.jsx("div", {
            className: "p-4 text-secondary",
            role: "alert",
            children: jsx.jsx(FormattedMessage, {
              id: "sites.preview.error",
              defaultMessage: "Couldn’t load the site preview. Refresh to try again, or open the site in a new tab.",
            }),
          }) : null,
          iframe,
          annotationControls,
        ],
      }),
    ],
  }, resource.publishedRevision ?? resource.projectId);
}

let initialized = false;
function initializeSitePreview(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeAnnotationBatchControls();
  initializeAppgenAccess();
  initializeShareDialog();
  React = getReactRuntime() as typeof React;
  jsx = getJsxRuntime();
  initialized = true;
}

initializeSitePreview();
export { SitePreview };
