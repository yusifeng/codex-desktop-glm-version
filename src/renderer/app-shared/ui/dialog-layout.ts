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
