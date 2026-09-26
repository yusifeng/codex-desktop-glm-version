import { Button, type ButtonProps } from "./button";
import { classNames } from "./class-names";

interface ElementLike {
  type: unknown;
  props: Record<string, unknown>;
}

interface JsxRuntimeLike {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
}

interface ReactLike {
  Children: { toArray(children: unknown): unknown[] };
  Fragment: unknown;
  cloneElement(element: ElementLike, props: Record<string, unknown>): unknown;
  isValidElement(value: unknown): value is ElementLike;
}

interface DialogPrimitives {
  Root: unknown;
  Trigger: unknown;
  Portal: unknown;
  Overlay: unknown;
  Content: unknown;
  Close: unknown;
  Title: unknown;
  Description: unknown;
}

const FALLBACK_DIALOG_PRIMITIVES: DialogPrimitives = {
  Root: "dialog-root",
  Trigger: "dialog-trigger",
  Portal: "dialog-portal",
  Overlay: "dialog-overlay",
  Content: "dialog-content",
  Close: "dialog-close",
  Title: "dialog-title",
  Description: "dialog-description",
};

function jsxRuntimeOf(): JsxRuntimeLike {
  return (
    (globalThis as { __RENDERER_JSX_RUNTIME__?: JsxRuntimeLike })
      .__RENDERER_JSX_RUNTIME__ ??
    (require("react/jsx-runtime") as JsxRuntimeLike)
  );
}

function reactOf(): ReactLike {
  return (
    (globalThis as { __RENDERER_REACT__?: ReactLike }).__RENDERER_REACT__ ??
    (require("react") as ReactLike)
  );
}

function dialogPrimitivesOf(): DialogPrimitives {
  return (
    (
      globalThis as {
        __RENDERER_DIALOG_PRIMITIVES__?: DialogPrimitives;
      }
    ).__RENDERER_DIALOG_PRIMITIVES__ ?? FALLBACK_DIALOG_PRIMITIVES
  );
}

function isDialogLayoutDebugEnabled(): boolean {
  return (
    typeof window !== "undefined" &&
    window.localStorage != null &&
    typeof window.localStorage.getItem === "function" &&
    window.localStorage.getItem("codex.debug.dialogLayout") === "1"
  );
}

function debugLabel(name: string): unknown {
  return jsxRuntimeOf().jsx("span", {
    className:
      "absolute -top-2 left-2 rounded bg-chart-blue/15 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-chart-blue",
    children: name,
  });
}

const DEBUG_CONTAINER_CLASS = "relative rounded-lg border border-chart-blue/40";

export type DialogSize =
  | "default"
  | "large"
  | "narrow"
  | "feature"
  | "catalogDetail"
  | "beacon"
  | "compact"
  | "wide"
  | "share"
  | "feedback"
  | "xwide"
  | "xwideTall"
  | "xxwide"
  | "xxxwideTall"
  | "editor"
  | "square"
  | "sheet";
export type DialogVariant =
  | "default"
  | "chatgpt"
  | "beacon"
  | "beaconModal"
  | "promotional"
  | "catalog"
  | "centeredText";

export interface DialogProps extends Record<string, unknown> {
  children?: unknown;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  triggerContent?: unknown;
  triggerAsChild?: boolean;
  triggerRef?: unknown;
  contentClassName?: string;
  contentOverflow?: "hidden" | "visible";
  contentPosition?: "centered" | "inline";
  contentProps?: Record<string, unknown>;
  dialogCloseClassName?: string;
  closeButtonSize?: "default" | "large";
  dialogCloseLabel?: string;
  headerActions?: unknown;
  overlayClassName?: string;
  portalContainer?: unknown;
  radius?: "default" | "compact";
  showDialogClose?: boolean;
  shouldIgnoreClickOutside?: boolean;
  shouldStopPointerDownPropagation?: boolean;
  unstyledContent?: boolean;
  viewportSized?: boolean;
  variant?: DialogVariant;
  size?: DialogSize;
}

function dialogWidthClass(size: DialogSize): string {
  switch (size) {
    case "large":
      return "w-lg";
    case "narrow":
      return "w-[380px]";
    case "feature":
      return "w-[400px]";
    case "catalogDetail":
      return "w-143.5";
    case "beacon":
      return "w-120";
    case "compact":
      return "w-[420px]";
    case "wide":
      return "w-[600px]";
    case "share":
      return "w-[640px]";
    case "feedback":
      return "w-xl";
    case "xwide":
      return "w-[680px]";
    case "xwideTall":
      return "h-[min(92vh,800px)] max-h-[min(92vh,800px)] w-[680px]";
    case "xxwide":
      return "w-[800px]";
    case "xxxwideTall":
      return "h-[min(85vh,740px)] max-h-[min(85vh,740px)] w-[960px]";
    case "editor":
      return "w-[600px] h-[720px] max-w-full max-h-full";
    case "square":
      return "aspect-square";
    case "sheet":
      return "rounded-b-none";
    default:
      return "w-[520px]";
  }
}

/** 原 `Hot` / 压缩导出 `Rh`。 */
export function DialogTitle({
  variant = "default",
  className,
  ...props
}: DialogLayoutProps & { variant?: DialogVariant }): unknown {
  return jsxRuntimeOf().jsx(dialogPrimitivesOf().Title, {
    className: classNames(
      className,
      variant === "promotional" ? "dialog-promotional-title" : undefined,
    ),
    ...props,
  });
}

/** 原 `Uot` / 压缩导出 `Lh`。 */
export function DialogDescription(props: DialogLayoutProps): unknown {
  return jsxRuntimeOf().jsx(dialogPrimitivesOf().Description, { ...props });
}

/** 原 `Vot` / 压缩导出 `Ih`。 */
export function Dialog(props: DialogProps): unknown {
  const {
    children,
    triggerContent,
    triggerAsChild = true,
    triggerRef,
    contentClassName,
    contentOverflow = "hidden",
    contentPosition = "centered",
    contentProps = {},
    dialogCloseClassName,
    closeButtonSize = "default",
    dialogCloseLabel = "Close dialog",
    headerActions,
    overlayClassName,
    portalContainer,
    radius = "default",
    showDialogClose = true,
    shouldIgnoreClickOutside = false,
    shouldStopPointerDownPropagation = true,
    unstyledContent = false,
    viewportSized = false,
    variant = "default",
    size = "default",
    ...rootProps
  } = props;
  const primitives = dialogPrimitivesOf();
  const trigger = triggerContent
    ? jsxRuntimeOf().jsx(primitives.Trigger, {
        asChild: triggerAsChild,
        ref: triggerRef,
        children: triggerContent,
      })
    : null;
  const isCatalog = variant === "catalog" || variant === "centeredText";
  const isBeacon = variant === "beacon" || variant === "beaconModal";
  const content = jsxRuntimeOf().jsxs(primitives.Content, {
    ...contentProps,
    className: classNames(
      "codex-dialog z-50",
      variant !== "centeredText" && "outline-none",
      size === "sheet" && "bottom-0 left-0",
      contentPosition === "centered" &&
        size !== "sheet" &&
        "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
      contentPosition !== "inline" &&
        (portalContainer == null ? "fixed" : "absolute"),
      !unstyledContent &&
        variant === "default" &&
        "bg-surface-elevated-secondary/90 text-default ring-border ring-[0.5px] shadow-lg backdrop-blur-xl",
      !unstyledContent &&
        (variant === "chatgpt" || isBeacon) &&
        "bg-surface dark:bg-surface-tertiary text-default shadow-lg",
      !unstyledContent &&
        variant === "promotional" &&
        "bg-surface-elevated-secondary text-default shadow-lg ring-[0.5px] ring-border",
      !unstyledContent &&
        isCatalog &&
        "bg-surface-elevated-secondary text-default",
      !unstyledContent &&
        !isCatalog &&
        (radius === "compact" || variant === "chatgpt" || isBeacon
          ? "rounded-2xl"
          : "rounded-3xl"),
      size !== "sheet" && size !== "square" && "max-w-[92vw]",
      contentOverflow === "visible" ? "overflow-visible" : "overflow-hidden",
      isBeacon && "max-h-[92dvh] overflow-y-auto",
      dialogWidthClass(size),
      viewportSized && "max-h-[92dvh]",
      contentClassName,
    ),
    onPointerDownOutside: (event: { preventDefault?(): void }) => {
      if (shouldIgnoreClickOutside) event.preventDefault?.();
      const handler = contentProps.onPointerDownOutside;
      if (typeof handler === "function") handler(event);
    },
    onPointerDown: (event: { stopPropagation?(): void }) => {
      if (shouldStopPointerDownPropagation) event.stopPropagation?.();
      const handler = contentProps.onPointerDown;
      if (typeof handler === "function") handler(event);
    },
    children: [
      children,
      headerActions,
      showDialogClose
        ? jsxRuntimeOf().jsx(primitives.Close, {
            className: classNames(
              "no-drag cursor-interaction leading-none hover:bg-primary-ghost-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              closeButtonSize === "large" ? "size-9" : "rounded p-1",
              dialogCloseClassName,
            ),
            "aria-label": dialogCloseLabel,
            children: "×",
          })
        : null,
    ],
  });
  const portal = jsxRuntimeOf().jsxs(primitives.Portal, {
    container: portalContainer ?? undefined,
    children: [
      jsxRuntimeOf().jsx(primitives.Overlay, {
        className: classNames(
          "codex-dialog-overlay fixed inset-0 z-50",
          (variant === "beacon" || variant === "promotional") &&
            "bg-text/5 backdrop-blur-sm",
          (variant === "default" || variant === "chatgpt") &&
            "extension:bg-surface-tertiary/80 electron:bg-[#00000022]",
          overlayClassName,
        ),
      }),
      content,
    ],
  });
  return jsxRuntimeOf().jsxs(primitives.Root, {
    ...rootProps,
    children: [trigger, portal],
  });
}

/** 原 `Jot` / 压缩导出 `zh`。 */
export function initializeDialog(): void {}

export interface DialogLayoutProps extends Record<string, unknown> {
  children?: unknown;
  className?: string;
}

export interface DialogHeaderProps extends DialogLayoutProps {
  icon?: unknown;
  iconClassName?: string;
  iconBackgroundClassName?: string;
  title?: unknown;
  titleSize?: "dialog" | "lg" | "base" | "sm";
  titleClassName?: string;
  subtitle?: unknown;
  subtitleSize?: "base" | "sm";
  subtitleTone?: "secondary" | "tertiary";
  subtitleClassName?: string;
}

/** 原 `Xot` / 压缩导出 `Ah`。 */
export function DialogHeader({
  icon,
  title,
  subtitle,
  className,
  iconClassName,
  iconBackgroundClassName,
  titleSize = "dialog",
  titleClassName,
  subtitleSize = "base",
  subtitleTone = "tertiary",
  subtitleClassName,
}: DialogHeaderProps): unknown {
  const debug = isDialogLayoutDebugEnabled();
  const titleClass =
    titleSize === "lg"
      ? "heading-lg"
      : titleSize === "base"
        ? "heading-base"
        : titleSize === "sm"
          ? "heading-sm"
          : "heading-dialog";
  const subtitleClass =
    subtitleSize === "base"
      ? "text-base leading-normal tracking-normal"
      : "text-sm leading-normal tracking-normal";
  const iconNode = icon
    ? jsxRuntimeOf().jsx("span", {
        className: classNames(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl p-2",
          iconBackgroundClassName ?? "bg-text/5",
          iconClassName,
        ),
        children: icon,
      })
    : null;
  const titleNode = title
    ? jsxRuntimeOf().jsx("div", {
        className: classNames(
          titleClass,
          "min-w-0 font-semibold",
          titleClassName,
        ),
        children: title,
      })
    : null;
  const subtitleNode = subtitle
    ? jsxRuntimeOf().jsx("div", {
        className: classNames(
          subtitleTone === "secondary"
            ? "text-secondary"
            : "text-codex-description",
          subtitleClass,
          subtitleClassName,
        ),
        children: subtitle,
      })
    : null;
  return jsxRuntimeOf().jsxs("div", {
    className: classNames(
      "flex flex-col items-start gap-3",
      debug && DEBUG_CONTAINER_CLASS,
      className,
    ),
    children: [
      debug ? debugLabel("DialogHeader") : null,
      iconNode,
      jsxRuntimeOf().jsxs("div", {
        className: "flex min-w-0 flex-1 flex-col gap-1 self-stretch",
        children: [titleNode, subtitleNode],
      }),
    ],
  });
}

export interface DialogBodyProps extends DialogLayoutProps {
  as?: "div" | "form";
  size?: "viewport" | "full" | "tall";
  variant?: "default" | string;
}

function dialogBodySizeClass(
  size: DialogBodyProps["size"],
): string | undefined {
  if (size === "viewport")
    return "max-h-[calc(100dvh/var(--codex-window-zoom)-2rem)] overflow-y-auto";
  if (size === "full") return "h-full min-h-0";
  if (size === "tall") return "min-h-[520px] max-h-[560px]";
  return undefined;
}

/** 原 `Zot` / 压缩导出 `Oh`。 */
export function DialogBody(props: DialogBodyProps): unknown {
  const {
    as = "div",
    children,
    className,
    size,
    variant = "default",
    ...elementProps
  } = props;
  const debug = isDialogLayoutDebugEnabled();
  const content = [debug ? debugLabel("DialogBody") : null, children];
  return jsxRuntimeOf().jsxs(as, {
    ...elementProps,
    className: classNames(
      "flex flex-col gap-0 text-base leading-normal tracking-normal",
      variant === "default" && "px-5 py-5",
      debug && DEBUG_CONTAINER_CLASS,
      dialogBodySizeClass(size),
      className,
    ),
    children: content,
  });
}

export interface DialogFooterProps extends DialogLayoutProps {
  expandSingleButton?: boolean;
}

/** 原 `Qot` / 压缩导出 `kh`。 */
export function DialogFooter({
  children,
  className,
  expandSingleButton = true,
}: DialogFooterProps): unknown {
  const react = reactOf();
  const childArray = react.Children.toArray(children);
  const buttonCount = childArray.reduce<number>(
    (count, child) =>
      react.isValidElement(child) && child.type === Button ? count + 1 : count,
    0,
  );
  const normalizedChildren = childArray.map((child) => {
    if (!react.isValidElement(child) || child.type !== Button) return child;
    const props = child.props as ButtonProps;
    return react.cloneElement(child, {
      size: props.size ?? "medium",
      className: classNames(
        props.className,
        expandSingleButton && buttonCount === 1
          ? "w-full justify-center"
          : undefined,
      ),
    });
  });
  const debug = isDialogLayoutDebugEnabled();
  return jsxRuntimeOf().jsxs("div", {
    className: classNames(
      "flex w-full items-center justify-end gap-3",
      debug && DEBUG_CONTAINER_CLASS,
      className,
    ),
    children: [
      debug ? debugLabel("DialogFooter") : null,
      jsxRuntimeOf().jsx(jsxRuntimeOf().Fragment, {
        children: normalizedChildren,
      }),
      null,
    ],
  });
}

export interface DialogSectionProps extends DialogLayoutProps {
  spacing?: "default" | "large";
}

/** 原 `est` / 压缩导出 `jh`。 */
export function DialogSection({
  children,
  className,
  spacing = "default",
}: DialogSectionProps): unknown {
  const debug = isDialogLayoutDebugEnabled();
  return jsxRuntimeOf().jsxs("div", {
    className: classNames(
      "flex w-full flex-col first:pt-0",
      spacing === "large" ? "pt-5" : "pt-3",
      debug && DEBUG_CONTAINER_CLASS,
      className,
    ),
    children: [debug ? debugLabel("DialogSection") : null, children],
  });
}

/** 原 `tst` / 压缩导出 `Nh`。 */
export function DialogFormRow({
  children,
  className,
}: DialogLayoutProps): unknown {
  const debug = isDialogLayoutDebugEnabled();
  return jsxRuntimeOf().jsxs("div", {
    className: classNames(
      "relative flex items-center gap-2",
      debug && DEBUG_CONTAINER_CLASS,
      className,
    ),
    children: [debug ? debugLabel("FormRow") : null, children],
  });
}

/** 原 `nst` / 压缩导出 `Mh`。 */
export function DialogFieldStack({
  children,
  className,
}: DialogLayoutProps): unknown {
  const debug = isDialogLayoutDebugEnabled();
  return jsxRuntimeOf().jsxs("div", {
    className: classNames(
      "flex flex-col gap-2",
      debug && DEBUG_CONTAINER_CLASS,
      className,
    ),
    children: [debug ? debugLabel("FieldStack") : null, children],
  });
}

/** 原 `ost` / 压缩导出 `Ph`。 */
export function initializeDialogLayout(): void {}

export { Button };
