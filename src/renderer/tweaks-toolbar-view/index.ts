import "@rchunk/rolldown-runtime";
import {
  $3 as initializeSharedRuntime,
  I3 as getJsxRuntime,
  Ih as Dialog,
  K2 as initializeUiRuntime,
  Lh as DialogText,
  Oh as DialogBody,
  Rh as DialogTitle,
  Y2 as FormattedMessage,
  Yh as Button,
  e6 as getReactRuntime,
  kh as DialogActions,
  m4 as classNames,
  n4 as useIntl,
  o_ as Tooltip,
  type JsxRuntime,
} from "@rchunk/app-shared";
// @ts-expect-error The compressed toolbar dependencies are registered centrally.
import { Gg as Coachmark, Kg as initializeCoachmark, _p as DiscardIcon, vp as ExitIcon } from "@rchunk/app-initial";
// @ts-expect-error The compressed toolbar dependencies are registered centrally.
import { Jc as isElement, cs as AnnotationIcon, ls as ScreenshotIcon, qc as initializeElementPredicates } from "@rchunk/app-primary";

interface KeyboardLikeEvent {
  altKey: boolean;
  code: string;
  composedPath(): unknown[];
  ctrlKey: boolean;
  isComposing: boolean;
  isTrusted: boolean;
  metaKey: boolean;
  preventDefault(): void;
  shiftKey: boolean;
  stopImmediatePropagation(): void;
  type: string;
}

interface ElementLike {
  closest(selector: string): unknown;
  isContentEditable?: boolean;
}

interface ReactHooks {
  useCallback<Callback extends (...parameters: never[]) => unknown>(
    callback: Callback,
    dependencies: readonly unknown[],
  ): Callback;
  useState<Value>(
    initialValue: Value,
  ): [Value, (next: Value | ((current: Value) => Value)) => void];
}

interface CommentModeButtonProps {
  activeHoverSuppressed?: boolean;
  direction?: "ltr" | "rtl";
  disabled?: boolean;
  disabledTooltipContent?: unknown;
  isCommentMode: boolean;
  onActiveHoverSuppressedChange?(suppressed: boolean): void;
  onDismissCoachmark?(): void;
  onToggle(event: unknown): void;
  shortcutLabel?: unknown;
  showCoachmark?: boolean;
}

interface ScreenshotButtonProps {
  captureScreenshotLabel: string;
  disabled?: boolean;
  hasBrowserPage: boolean;
  isCommentMode: boolean;
  onCapture(): void;
  prefersReducedMotion: boolean;
  reserveSpaceWhenHidden?: boolean;
}

interface DiscardAnnotationsDialogProps {
  onClose(): void;
  onConfirm(): void;
}

interface TweaksToolbarViewProps {
  displayUrl: string;
  hasPendingAnnotations: boolean;
  hasQueuedTweaks: boolean;
  isAddModifierPressed: boolean;
  isOriginalViewEnabled: boolean;
  isSubmitAvailable?: boolean;
  isSuspended?: boolean;
  markersVisible: boolean;
  onAddToComposer(): void;
  onDiscard(): void;
  onExit(): void;
  onOriginalViewBlur(event: unknown): void;
  onOriginalViewKeyDown(event: unknown): void;
  onOriginalViewKeyUp(event: unknown): void;
  onOriginalViewPointerCancel(event: unknown): void;
  onOriginalViewPointerDown(event: unknown): void;
  onOriginalViewPointerUp(event: unknown): void;
  onSubmit(): Promise<unknown> | null | undefined;
  onToggleMarkers(): void;
  pendingAnnotationCount?: number;
  screenshotButton?: unknown;
}

let initializedSpaceHandling = false;
let initializedCommentMode = false;
let initializedScreenshot = false;
let initializedDiscardDialog = false;
let initializedToolbar = false;
let jsx: JsxRuntime;
let react: ReactHooks;

function handleSpaceKeyEvent(
  event: KeyboardLikeEvent,
  active: boolean,
  { preserveTyping }: { preserveTyping: boolean },
): boolean | undefined {
  const typingTarget =
    preserveTyping &&
    event.composedPath().some(
      (target) =>
        isElement(target) &&
        ((target as ElementLike).isContentEditable === true ||
          (target as ElementLike).closest(
            "input,textarea,select,[role='textbox'],[data-codex-composer],[data-codex-terminal]",
          ) != null),
    );
  if (
    !event.isTrusted ||
    event.code !== "Space" ||
    (!active &&
      (event.isComposing ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        typingTarget))
  ) {
    return undefined;
  }
  event.preventDefault();
  event.stopImmediatePropagation();
  return event.type === "keydown";
}

function initializeSpaceKeyHandling(): void {
  if (initializedSpaceHandling) return;
  initializedSpaceHandling = true;
  initializeElementPredicates();
}

function CommentModeButton({
  activeHoverSuppressed,
  direction = "ltr",
  disabled,
  disabledTooltipContent,
  isCommentMode,
  onActiveHoverSuppressedChange,
  onDismissCoachmark,
  onToggle,
  shortcutLabel,
  showCoachmark,
}: CommentModeButtonProps): unknown {
  const intl = useIntl();
  const label = intl.formatMessage({
    id: "thread.browser.commentMode",
    defaultMessage: "Annotate this page",
  });
  const activeLabel = intl.formatMessage({
    id: "thread.browser.commentModeActive",
    defaultMessage: "Annotating",
  });
  const onClick = react.useCallback(
    (event: unknown) => {
      onActiveHoverSuppressedChange?.(!isCommentMode);
      onToggle(event);
    },
    [isCommentMode, onActiveHoverSuppressedChange, onToggle],
  );
  const onPointerLeave = react.useCallback(
    () => onActiveHoverSuppressedChange?.(false),
    [onActiveHoverSuppressedChange],
  );
  const button = jsx.jsx(Button, {
    color: "ghost",
    radius: isCommentMode ? "default" : "large",
    size: "toolbar",
    disabled,
    "aria-label": isCommentMode ? activeLabel : label,
    "aria-pressed": isCommentMode,
    "data-hover-suppressed": isCommentMode && activeHoverSuppressed === true,
    onClick,
    onPointerLeave,
    children: jsx.jsx(AnnotationIcon, { className: "icon-sm" }),
  });
  if (disabled && disabledTooltipContent != null) {
    return jsx.jsx(Tooltip, {
      side: "bottom",
      tooltipContent: disabledTooltipContent,
      children: jsx.jsx("span", { className: "inline-flex", children: button }),
    });
  }
  return jsx.jsx(Coachmark, {
    align: "start",
    description: jsx.jsx(FormattedMessage, {
      id: "thread.browser.commentModeCoachmarkDescription",
      defaultMessage:
        "Leave visual comments for ChatGPT with a single click or drag to select an area",
    }),
    disabled,
    dismissLabel: intl.formatMessage({
      id: "thread.browser.commentModeCoachmarkDismiss",
      defaultMessage: "Dismiss",
    }),
    fallbackShortcut: isCommentMode ? null : shortcutLabel,
    fallbackSide: "bottom",
    fallbackTooltipContent: isCommentMode
      ? intl.formatMessage({
          id: "thread.browser.commentModeBrowseShortcut",
          defaultMessage:
            "Click anywhere to annotate, or click and drag to select a region. Hold Space to click through the webpage.",
        })
      : label,
    onDismiss: onDismissCoachmark,
    open: showCoachmark,
    side: direction === "rtl" ? "right" : "left",
    sideOffset: 12,
    title: intl.formatMessage({
      id: "thread.browser.commentModeCoachmarkTitle",
      defaultMessage: "Try Annotation Mode",
    }),
    children: button,
  });
}

function initializeCommentModeButton(): void {
  if (initializedCommentMode) return;
  initializedCommentMode = true;
  initializeSharedRuntime();
  initializeUiRuntime();
  initializeSpaceKeyHandling();
  initializeCoachmark();
}

function ScreenshotButton({
  captureScreenshotLabel,
  disabled = false,
  hasBrowserPage,
  isCommentMode,
  onCapture,
  prefersReducedMotion,
  reserveSpaceWhenHidden = false,
}: ScreenshotButtonProps): unknown {
  const [animation, setAnimation] = react.useState<number | null>(null);
  const hidden = !hasBrowserPage || isCommentMode;
  const onClick = react.useCallback(
    () => {
      onCapture();
      if (!prefersReducedMotion) {
        setAnimation((current) => (current ?? 0) + 1);
      }
    },
    [onCapture, prefersReducedMotion],
  );
  const button = jsx.jsx(Button, {
    color: "ghost",
    size: "toolbar",
    uniform: true,
    "data-browser-sidebar-skip-address-commit": "true",
    disabled: disabled || !hasBrowserPage,
    "aria-label": captureScreenshotLabel,
    title: captureScreenshotLabel,
    tabIndex: isCommentMode ? -1 : undefined,
    onClick,
    children: jsx.jsx(ScreenshotIcon, {
      className: "icon-sm",
      "data-animation-key": animation,
    }),
  });
  return jsx.jsx("div", {
    "aria-hidden": hidden,
    className: classNames(
      "ease-basic origin-right transition-[max-width,opacity,transform] duration-basic motion-reduce:transition-none",
      hidden
        ? reserveSpaceWhenHidden
          ? "pointer-events-none max-w-8 overflow-hidden opacity-0"
          : "pointer-events-none max-w-0 scale-95 overflow-hidden opacity-0"
        : "max-w-8 translate-x-0 scale-100 overflow-visible opacity-100",
    ),
    children: jsx.jsx(Tooltip, {
      tooltipContent: captureScreenshotLabel,
      disabled: hidden || disabled,
      children: button,
    }),
  });
}

function initializeScreenshotButton(): void {
  if (initializedScreenshot) return;
  initializedScreenshot = true;
  initializeSharedRuntime();
  initializeUiRuntime();
}

function DiscardAnnotationsDialog({
  onClose,
  onConfirm,
}: DiscardAnnotationsDialogProps): unknown {
  const onOpenChange = (open: boolean): void => {
    if (!open) onClose();
  };
  const onSubmit = (event: { preventDefault(): void }): void => {
    event.preventDefault();
    onClose();
    onConfirm();
  };
  return jsx.jsx(Dialog, {
    open: true,
    onOpenChange,
    showDialogClose: false,
    size: "compact",
    children: jsx.jsxs(DialogBody, {
      as: "form",
      className: "py-4",
      onSubmit,
      children: [
        jsx.jsx(DialogTitle, {
          children: jsx.jsx(FormattedMessage, {
            id: "thread.browser.tweaks.cancelConfirmTitle",
            defaultMessage: "Discard all pending annotations?",
          }),
        }),
        jsx.jsx(DialogText, {
          children: jsx.jsx(FormattedMessage, {
            id: "thread.browser.tweaks.cancelConfirmSubtitle",
            defaultMessage: "All edits will be removed from the page",
          }),
        }),
        jsx.jsxs(DialogActions, {
          children: [
            jsx.jsx(Button, {
              color: "secondary",
              onClick: onClose,
              children: "Cancel",
            }),
            jsx.jsx(Button, { color: "danger", type: "submit", children: "Discard" }),
          ],
        }),
      ],
    }),
  });
}

function initializeDiscardAnnotationsDialog(): void {
  if (initializedDiscardDialog) return;
  initializedDiscardDialog = true;
  initializeSharedRuntime();
  initializeUiRuntime();
}

function TweaksToolbarView({
  displayUrl,
  hasPendingAnnotations,
  hasQueuedTweaks,
  isAddModifierPressed,
  isOriginalViewEnabled,
  isSubmitAvailable,
  isSuspended = false,
  markersVisible,
  onAddToComposer,
  onDiscard,
  onExit,
  onOriginalViewBlur,
  onOriginalViewKeyDown,
  onOriginalViewKeyUp,
  onOriginalViewPointerCancel,
  onOriginalViewPointerDown,
  onOriginalViewPointerUp,
  onSubmit,
  onToggleMarkers,
  pendingAnnotationCount,
  screenshotButton,
}: TweaksToolbarViewProps): unknown {
  const [submitting, setSubmitting] = react.useState(false);
  const intl = useIntl();
  const markerLabel = intl.formatMessage({
    id: markersVisible
      ? "thread.browser.tweaks.hideMarkers"
      : "thread.browser.tweaks.showMarkers",
    defaultMessage: markersVisible ? "Hide markers" : "Show markers",
  });
  const originalLabel = intl.formatMessage({
    id: "thread.browser.tweaks.holdToViewOriginal",
    defaultMessage: "Hold to view original",
  });
  const discardLabel = intl.formatMessage({
    id: "thread.browser.tweaks.discardAnnotations",
    defaultMessage: "Discard annotations",
  });
  const exitLabel = intl.formatMessage({
    id: "thread.browser.tweaks.exitAnnotations",
    defaultMessage: "Exit annotation mode",
  });
  const sendLabel = pendingAnnotationCount
    ? intl.formatMessage(
        {
          id: "thread.browser.tweaks.sendPendingAnnotationCount",
          defaultMessage: "Send {count} pending annotations",
        },
        { count: pendingAnnotationCount },
      )
    : undefined;
  const onSend = react.useCallback(
    () => {
      if (isAddModifierPressed) {
        onAddToComposer();
        return;
      }
      const request = onSubmit();
      if (request != null) {
        setSubmitting(true);
        void request.then(
          () => setSubmitting(false),
          () => setSubmitting(false),
        );
      }
    },
    [isAddModifierPressed, onAddToComposer, onSubmit],
  );
  const sendDisabled =
    !hasPendingAnnotations || (!isAddModifierPressed && isSubmitAvailable === false);

  const exitButton = jsx.jsx(Button, {
    "aria-label": exitLabel,
    color: "ghost",
    size: "toolbar",
    uniform: true,
    onClick: onExit,
    children: jsx.jsx(ExitIcon, { className: "icon-sm" }),
  });
  const discardButton = jsx.jsx(Button, {
    "aria-label": discardLabel,
    color: "ghost",
    size: "toolbar",
    uniform: true,
    disabled: !hasPendingAnnotations,
    onClick: onDiscard,
    children: jsx.jsx(DiscardIcon, { className: "icon-sm" }),
  });
  const markerButton = jsx.jsx(Button, {
    "aria-label": markerLabel,
    "aria-pressed": markersVisible,
    color: "ghost",
    size: "toolbar",
    uniform: true,
    onClick: onToggleMarkers,
    children: markersVisible ? "Markers on" : "Markers off",
  });
  const originalButton = jsx.jsx(Button, {
    "aria-label": originalLabel,
    "aria-pressed": isOriginalViewEnabled,
    color: isOriginalViewEnabled ? "ghostActive" : "ghost",
    size: "toolbar",
    title: originalLabel,
    uniform: true,
    disabled: !hasQueuedTweaks,
    onBlur: onOriginalViewBlur,
    onKeyDown: onOriginalViewKeyDown,
    onKeyUp: onOriginalViewKeyUp,
    onPointerCancel: onOriginalViewPointerCancel,
    onPointerDown: onOriginalViewPointerDown,
    onPointerUp: onOriginalViewPointerUp,
    children: isOriginalViewEnabled ? "Original" : "Tweaked",
  });
  const sendButton = jsx.jsxs(Button, {
    "aria-label": sendLabel,
    color: "primary",
    className:
      "!border-transparent !bg-chart-blue !text-white enabled:hover:!bg-chart-blue/90",
    size: "toolbar",
    disabled: sendDisabled,
    loading: submitting,
    onClick: onSend,
    children: [
      jsx.jsx(FormattedMessage, {
        id: "thread.browser.tweaks.send",
        defaultMessage: "Send",
      }),
      sendLabel
        ? jsx.jsx("span", {
            className:
              "ms-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-black/25 px-1",
            children: pendingAnnotationCount,
          })
        : null,
    ],
  });

  return jsx.jsxs("div", {
    className: classNames(
      "draggable grid h-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 text-default",
      isSuspended ? "bg-surface-secondary" : "bg-toolbar-tweaks",
    ),
    children: [
      jsx.jsxs("div", {
        className: "flex items-center gap-1.5 no-drag",
        children: [
          jsx.jsx(Tooltip, { tooltipContent: exitLabel, children: exitButton }),
          jsx.jsx(Tooltip, { tooltipContent: discardLabel, children: discardButton }),
        ],
      }),
      jsx.jsxs("div", {
        className: "flex min-w-0 items-center justify-center gap-1.5 text-sm select-none",
        children: [
          isSuspended ? "Space" : null,
          isOriginalViewEnabled ? `Original • ${displayUrl}` : `Annotating • ${displayUrl}`,
        ],
      }),
      jsx.jsxs("div", {
        className: "flex items-center gap-3 justify-self-end no-drag",
        children: [
          screenshotButton,
          jsx.jsx(Tooltip, { tooltipContent: markerLabel, children: markerButton }),
          jsx.jsx(Tooltip, { tooltipContent: originalLabel, children: originalButton }),
          sendButton,
        ],
      }),
    ],
  });
}

function initializeTweaksToolbarView(): void {
  if (initializedToolbar) return;
  initializedToolbar = true;
  initializeSharedRuntime();
  initializeUiRuntime();
  react = getReactRuntime() as unknown as ReactHooks;
  initializeCommentModeButton();
  initializeScreenshotButton();
  initializeDiscardAnnotationsDialog();
  jsx = getJsxRuntime();
}

export {
  ScreenshotButton as a,
  initializeCommentModeButton as c,
  initializeDiscardAnnotationsDialog as i,
  handleSpaceKeyEvent as l,
  initializeTweaksToolbarView as n,
  initializeScreenshotButton as o,
  DiscardAnnotationsDialog as r,
  CommentModeButton as s,
  TweaksToolbarView as t,
  initializeSpaceKeyHandling as u,
};
