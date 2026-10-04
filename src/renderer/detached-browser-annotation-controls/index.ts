import "@rchunk/rolldown-runtime";
import {
  $3 as initializeSharedRuntime,
  I3 as getJsxRuntime,
  K2 as initializeUiRuntime,
  e6 as getReactRuntime,
  h4 as initializeClassNames,
  m4 as classNames,
  n4 as useIntl,
  wL as initializeWindowRuntime,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import {
  a as ScreenshotButton,
  c as initializeCommentModeButton,
  i as initializeDiscardAnnotationsDialog,
  l as handleSpaceKeyEvent,
  n as initializeTweaksToolbarView,
  o as initializeScreenshotButton,
  r as DiscardAnnotationsDialog,
  s as CommentModeButton,
  t as TweaksToolbarView,
  u as initializeSpaceKeyHandling,
} from "@rchunk/tweaks-toolbar-view";
import { formatBrowserUrl } from "../app-primary/runtime/format-browser-url";

type InteractionMode = "browse" | "comment";

interface BrowserSnapshot {
  areAnnotationMarkersVisible?: boolean;
  comments?: unknown;
  commentModeDisabledReason?: string | null;
  interactionMode?: InteractionMode;
  isAnnotationAddModifierPressed?: boolean;
  isAnnotationSuspended?: boolean;
  tabType?: string;
  url: string;
}

interface BrowserToolbarCapabilities {
  annotationMarkersVisible?: boolean;
  canCaptureScreenshot?: boolean;
  canUseComposer?: boolean;
  isComposerListenerRegistered?: boolean;
  pendingCommentAttachmentCount?: number;
  reduceMotion?: boolean;
  showAnnotationCoachmark?: boolean;
}

interface BrowserCommandRequest {
  browserTabId: string;
  command: Record<string, unknown>;
  conversationId: string;
}

interface ToolbarSourceAction {
  type: string;
  [key: string]: unknown;
}

interface KeyboardLikeEvent {
  altKey?: boolean;
  code?: string;
  ctrlKey?: boolean;
  defaultPrevented?: boolean;
  isComposing?: boolean;
  isTrusted?: boolean;
  key?: string;
  metaKey?: boolean;
  preventDefault(): void;
  repeat?: boolean;
  shiftKey?: boolean;
  stopImmediatePropagation?(): void;
  stopPropagation?(): void;
  target?: unknown;
  type?: string;
  composedPath?(): unknown[];
}

interface PointerLikeEvent {
  currentTarget: {
    hasPointerCapture?(pointerId: number): boolean;
    releasePointerCapture?(pointerId: number): void;
    setPointerCapture?(pointerId: number): void;
  };
  pointerId: number;
}

interface BrowserHost {
  setAnnotationPresentation(options: {
    browserTabId: string;
    conversationId: string;
    markersVisible?: boolean;
    suspended?: boolean;
  }): Promise<unknown>;
}

interface ViewportLike {
  contains(value: unknown): boolean;
}

interface AnnotationButtonProps {
  browserTabId: string;
  browserToolbarCapabilities: BrowserToolbarCapabilities;
  conversationId: string;
  focusPage(): void;
  onError(message: string): void;
  requestToolbarSourceAction(action: ToolbarSourceAction): Promise<boolean> | boolean;
  runCommand(request: BrowserCommandRequest): Promise<unknown> | unknown;
  snapshot: BrowserSnapshot;
}

interface TweaksToolbarProps {
  browserHost: BrowserHost;
  browserTabId: string;
  browserToolbarCapabilities: BrowserToolbarCapabilities;
  conversationId: string;
  onError(message: string): void;
  requestToolbarSourceAction(action: ToolbarSourceAction): Promise<boolean> | boolean;
  runCommand(request: BrowserCommandRequest): Promise<unknown> | unknown;
  showFullUrl?: boolean;
  snapshot: BrowserSnapshot;
  viewport: ViewportLike;
}

let jsx: JsxRuntime;
let React: ReactRuntime;

function isAccepted(result: unknown): boolean {
  return result === "accepted";
}

function isWebPage(snapshot: BrowserSnapshot): boolean {
  return (snapshot.tabType === "web" || snapshot.tabType === "WEB") && snapshot.url.trim().length > 0;
}

function hasComments(comments: unknown): boolean {
  if (Array.isArray(comments)) return comments.length > 0;
  if (comments != null && typeof comments === "object") return Object.keys(comments).length > 0;
  return Boolean(comments);
}

function displayUrl(url: string, showFullUrl: boolean): string {
  if (showFullUrl) return url;
  return formatBrowserUrl(url, false) ?? url;
}

function isCommandModifierPressed(event: KeyboardLikeEvent): boolean {
  return event.metaKey === true || event.ctrlKey === true;
}

function isTypingTarget(target: unknown): boolean {
  if (target == null || typeof target !== "object") return false;
  const candidate = target as { isContentEditable?: boolean; tagName?: string };
  return candidate.isContentEditable === true || ["INPUT", "TEXTAREA", "SELECT"].includes(candidate.tagName ?? "");
}

function formatMessageText(value: string | readonly unknown[]): string {
  return typeof value === "string" ? value : value.join("");
}

function DetachedBrowserAnnotationButton({
  browserTabId,
  browserToolbarCapabilities,
  conversationId,
  focusPage,
  onError,
  requestToolbarSourceAction,
  runCommand,
  snapshot,
}: AnnotationButtonProps): unknown {
  const intl = useIntl();
  const [activeHoverSuppressed, setActiveHoverSuppressed] = React.useState(false);
  const hasBrowserPage = isWebPage(snapshot);
  const disabled = !hasBrowserPage || snapshot.commentModeDisabledReason != null;
  const isCommentMode = snapshot.interactionMode === "comment";
  const failureMessage = formatMessageText(intl.formatMessage({
    id: "thread.browser.detachedAnnotationActionFailed",
    defaultMessage: "Unable to update annotations",
  }));

  const toggle = (entrySource: "keyboard-shortcut" | "toolbar-button") => {
    const interactionMode: InteractionMode = isCommentMode ? "browse" : "comment";
    setActiveHoverSuppressed(interactionMode === "comment");
    Promise.resolve(runCommand({
      browserTabId,
      conversationId,
      command: {
        type: "set-interaction-mode",
        interactionMode,
        annotationModeEntrySource: interactionMode === "comment" ? entrySource : undefined,
      },
    })).then(
      (result) => {
        if (!isAccepted(result)) onError(failureMessage);
        else if (interactionMode === "comment") focusPage();
      },
      () => onError(failureMessage),
    );
  };

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardLikeEvent) => {
      if (event.defaultPrevented || event.repeat || disabled) return;
      if (event.key === "." && !event.shiftKey && !event.altKey && isCommandModifierPressed(event)) {
        event.preventDefault();
        event.stopPropagation?.();
        toggle("keyboard-shortcut");
        return;
      }
      if (event.key !== "Escape" || !isCommentMode || isTypingTarget(event.target)) return;
      event.preventDefault();
      event.stopPropagation?.();
      Promise.resolve(requestToolbarSourceAction({ type: "dismiss-active-annotation-editor" })).then(
        (dismissed) => {
          if (!dismissed) return;
          Promise.resolve(runCommand({
            browserTabId,
            conversationId,
            command: { type: "add-annotations-to-composer" },
          })).then((result) => { if (!isAccepted(result)) onError(failureMessage); }, () => onError(failureMessage));
        },
        () => onError(failureMessage),
      );
    };
    window.addEventListener("keydown", onKeyDown as EventListener);
    return () => window.removeEventListener("keydown", onKeyDown as EventListener);
  }, [browserTabId, conversationId, disabled, failureMessage, isCommentMode, onError, requestToolbarSourceAction, runCommand]);

  const disabledTooltipContent = snapshot.commentModeDisabledReason === "site-blocked"
    ? intl.formatMessage({ id: "thread.browser.commentModeUnavailableForSite", defaultMessage: "Annotating is disabled for this website" })
    : undefined;
  const showCoachmark = browserToolbarCapabilities.showAnnotationCoachmark === true && hasBrowserPage && !disabled;
  const content = jsx.jsx(CommentModeButton, {
    activeHoverSuppressed,
    direction: document.documentElement.dir === "rtl" ? "rtl" : "ltr",
    disabled,
    disabledTooltipContent,
    isCommentMode,
    onActiveHoverSuppressedChange: setActiveHoverSuppressed,
    onDismissCoachmark: () => {
      Promise.resolve(requestToolbarSourceAction({ type: "dismiss-annotation-coachmark" })).then(
        (dismissed) => { if (!dismissed) onError(failureMessage); },
        () => onError(failureMessage),
      );
    },
    onToggle: () => toggle("toolbar-button"),
    shortcutLabel: "Cmd/Ctrl+.",
    showCoachmark,
  });
  return jsx.jsx("div", {
    "aria-hidden": !hasBrowserPage,
    className: classNames(
      "ease-basic flex origin-right justify-end transition-[max-width,margin-inline-start,opacity,scale] duration-basic motion-reduce:transition-none",
      hasBrowserPage
        ? "ms-0 max-w-40 scale-100 overflow-visible opacity-100"
        : "pointer-events-none -ms-1.5 max-w-0 scale-0 overflow-hidden opacity-0",
    ),
    children: content,
  });
}

function DetachedBrowserTweaksToolbar({
  browserHost,
  browserTabId,
  browserToolbarCapabilities,
  conversationId,
  onError,
  requestToolbarSourceAction,
  runCommand,
  showFullUrl = false,
  snapshot,
  viewport,
}: TweaksToolbarProps): unknown {
  const intl = useIntl();
  const [discardDialogOpen, setDiscardDialogOpen] = React.useState(false);
  const [isOriginalViewEnabled, setOriginalViewEnabled] = React.useState(false);
  const originalViewActive = React.useRef(false);
  const [isAddModifierPressed, setAddModifierPressed] = React.useState(false);
  const rootRef = React.useRef<{ contains(value: unknown): boolean } | null>(null);
  const failureMessage = formatMessageText(intl.formatMessage({
    id: "thread.browser.detachedAnnotationActionFailed",
    defaultMessage: "Unable to update annotations",
  }));

  const runAccepted = async (command: Record<string, unknown>): Promise<boolean> => {
    try {
      if (isAccepted(await runCommand({ browserTabId, conversationId, command }))) return true;
    } catch {}
    onError(failureMessage);
    return false;
  };
  const releaseOriginalView = () => {
    if (!originalViewActive.current) return;
    originalViewActive.current = false;
    setOriginalViewEnabled(false);
    void runAccepted({ type: "set-original-view-enabled", enabled: false });
  };
  const enableOriginalView = () => {
    if (originalViewActive.current) return;
    originalViewActive.current = true;
    setOriginalViewEnabled(true);
    void runAccepted({ type: "set-original-view-enabled", enabled: true });
  };

  React.useEffect(() => {
    window.addEventListener("blur", releaseOriginalView);
    return () => {
      window.removeEventListener("blur", releaseOriginalView);
      if (originalViewActive.current) {
        originalViewActive.current = false;
        void Promise.resolve(runCommand({
          browserTabId,
          conversationId,
          command: { type: "set-original-view-enabled", enabled: false },
        }));
      }
    };
  }, [browserTabId, conversationId, runCommand]);

  React.useEffect(() => {
    let spaceSuspended = false;
    const onSpace = (event: KeyboardLikeEvent) => {
      setAddModifierPressed(isCommandModifierPressed(event));
      const activeElement = document.activeElement;
      const focusedInToolbar = rootRef.current?.contains(activeElement) === true;
      const focusedInViewport = viewport.contains(activeElement);
      if (!spaceSuspended && snapshot.isAnnotationSuspended !== true && event.type !== "keydown" && !focusedInToolbar && !focusedInViewport) return;
      const suspended = handleSpaceKeyEvent(event, spaceSuspended || snapshot.isAnnotationSuspended === true, { preserveTyping: true });
      if (typeof suspended !== "boolean") return;
      spaceSuspended = suspended;
      void browserHost.setAnnotationPresentation({ browserTabId, conversationId, suspended }).catch(() => undefined);
    };
    const reset = () => {
      setAddModifierPressed(false);
      if (!spaceSuspended) return;
      spaceSuspended = false;
      void browserHost.setAnnotationPresentation({ browserTabId, conversationId, suspended: false }).catch(() => undefined);
    };
    window.addEventListener("keydown", onSpace as EventListener, true);
    window.addEventListener("keyup", onSpace as EventListener, true);
    window.addEventListener("blur", reset);
    return () => {
      window.removeEventListener("keydown", onSpace as EventListener, true);
      window.removeEventListener("keyup", onSpace as EventListener, true);
      window.removeEventListener("blur", reset);
      reset();
    };
  }, [browserHost, browserTabId, conversationId, snapshot.isAnnotationSuspended, viewport]);

  const pendingCount = browserToolbarCapabilities.pendingCommentAttachmentCount ?? 0;
  const hasQueuedTweaks = hasComments(snapshot.comments);
  const hasPendingAnnotations = hasQueuedTweaks || pendingCount > 0;
  const markersVisible = snapshot.areAnnotationMarkersVisible ?? browserToolbarCapabilities.annotationMarkersVisible ?? false;
  const canUseComposer = browserToolbarCapabilities.isComposerListenerRegistered
    ? browserToolbarCapabilities.canUseComposer
    : undefined;
  const screenshotButton = browserToolbarCapabilities.canCaptureScreenshot
    ? jsx.jsx(ScreenshotButton, {
        captureScreenshotLabel: intl.formatMessage({ id: "thread.browser.captureScreenshot", defaultMessage: "Capture screenshot" }),
        hasBrowserPage: true,
        isCommentMode: false,
        prefersReducedMotion: browserToolbarCapabilities.reduceMotion === true,
        onCapture: () => {
          void Promise.resolve(requestToolbarSourceAction({ type: "capture-screenshot-clicked" }));
          void runAccepted({ type: "capture-screenshot" });
        },
      })
    : null;

  const toolbar = jsx.jsx(TweaksToolbarView, {
    displayUrl: displayUrl(snapshot.url, showFullUrl),
    hasPendingAnnotations,
    hasQueuedTweaks,
    isAddModifierPressed: isAddModifierPressed || snapshot.isAnnotationAddModifierPressed === true,
    isOriginalViewEnabled,
    isSubmitAvailable: canUseComposer,
    isSuspended: snapshot.isAnnotationSuspended === true,
    markersVisible,
    onAddToComposer: () => { void runAccepted({ type: "add-annotations-to-composer" }); },
    onDiscard: () => setDiscardDialogOpen(true),
    onExit: () => {
      Promise.resolve(requestToolbarSourceAction({ type: "dismiss-active-annotation-editor" })).then(
        (dismissed) => { if (dismissed) void runAccepted({ type: "add-annotations-to-composer" }); },
        () => onError(failureMessage),
      );
    },
    onOriginalViewBlur: releaseOriginalView,
    onOriginalViewKeyDown: (event: KeyboardLikeEvent) => {
      if ((event.key === " " || event.key === "Enter") && !event.repeat) { event.preventDefault(); enableOriginalView(); }
    },
    onOriginalViewKeyUp: (event: KeyboardLikeEvent) => {
      if (event.key === " " || event.key === "Enter") { event.preventDefault(); releaseOriginalView(); }
    },
    onOriginalViewPointerCancel: (event: PointerLikeEvent) => {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture?.(event.pointerId);
      releaseOriginalView();
    },
    onOriginalViewPointerDown: (event: PointerLikeEvent) => {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      enableOriginalView();
    },
    onOriginalViewPointerUp: (event: PointerLikeEvent) => {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture?.(event.pointerId);
      releaseOriginalView();
    },
    onSubmit: async () => {
      try {
        const type = browserToolbarCapabilities.isComposerListenerRegistered
          ? "submit-browser-tweaks"
          : "submit-browser-tweaks-after-focus";
        if (await requestToolbarSourceAction({ type })) return;
      } catch {}
      onError(failureMessage);
    },
    onToggleMarkers: () => {
      const visible = !markersVisible;
      Promise.resolve(requestToolbarSourceAction({ type: "set-annotation-markers-visible", visible })).then(
        (updated) => {
          if (!updated) { onError(failureMessage); return; }
          void browserHost.setAnnotationPresentation({ browserTabId, conversationId, markersVisible: visible }).catch(() => onError(failureMessage));
        },
        () => onError(failureMessage),
      );
    },
    pendingAnnotationCount: pendingCount,
    screenshotButton,
  });
  const dialog = discardDialogOpen
    ? jsx.jsx(DiscardAnnotationsDialog, {
        onClose: () => setDiscardDialogOpen(false),
        onConfirm: () => { void runAccepted({ type: "discard-pending-annotations" }); },
      })
    : null;
  return jsx.jsxs("div", { ref: rootRef, className: "h-full", children: [toolbar, dialog] });
}

function initialize(): void {
  initializeSharedRuntime();
  initializeUiRuntime();
  initializeClassNames();
  initializeWindowRuntime();
  initializeSpaceKeyHandling();
  initializeCommentModeButton();
  initializeScreenshotButton();
  initializeDiscardAnnotationsDialog();
  initializeTweaksToolbarView();
  React = getReactRuntime();
  jsx = getJsxRuntime();
}

initialize();

export { DetachedBrowserAnnotationButton, DetachedBrowserTweaksToolbar };
