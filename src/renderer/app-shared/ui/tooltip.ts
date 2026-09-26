import { classNames } from "./class-names";

export type TooltipSide = "top" | "right" | "bottom" | "left";
export type TooltipAlign = "start" | "center" | "end";
export type TooltipVariant =
  "tooltip" | "rich" | "coachmark" | "unstyled" | "floating-navigation-rail";
export type TooltipColor = "default" | "surface" | "inverse";
export type TooltipOpenWhen =
  "always" | "trigger-overflows" | "visibility-target-hidden";

export interface TooltipEvent {
  currentTarget?: unknown;
  defaultPrevented?: boolean;
  key?: string;
  pointerType?: string;
  preventDefault?(): void;
  stopPropagation?(): void;
}

export interface TooltipProps extends Record<string, unknown> {
  children?: unknown;
  tooltipContent?: unknown;
  shortcut?: string;
  disabled?: boolean;
  delayOpen?: boolean;
  delayDuration?: number;
  getDelayDuration?: (event: TooltipEvent, duration: number) => number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerPopupOpen?: boolean;
  disableHoverOpen?: boolean;
  closeOnTriggerClick?: boolean;
  closeOnTriggerBlur?: boolean;
  closeOnPointerLeave?: boolean;
  closeOnWindowBlur?: boolean;
  triggerAsChild?: boolean;
  cloneCustomTrigger?: boolean;
  triggerRef?: unknown;
  triggerElement?: unknown;
  positioningElement?: unknown;
  forceMount?: boolean;
  selectable?: boolean;
  interactive?: boolean;
  keyboardNavigation?: boolean;
  scaleAvailableSizeWithZoom?: boolean;
  disablePadding?: boolean;
  color?: TooltipColor;
  variant?: TooltipVariant;
  side?: TooltipSide;
  sideOffset?: number;
  align?: TooltipAlign;
  alignOffset?: number;
  flipAlignment?: boolean;
  tooltipClassName?: string;
  tooltipBodyClassName?: string;
  tooltipId?: string;
  tooltipMaxWidth?: string | number;
  openWhen?: TooltipOpenWhen;
  portalContainer?: unknown;
  className?: string;
}

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
  Fragment: unknown;
  cloneElement(element: ElementLike, props: Record<string, unknown>): unknown;
  isValidElement(value: unknown): value is ElementLike;
  useId(): string;
  useState<T>(initialValue: T): [T, (value: T) => void];
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

function joinAriaDescriptions(
  current: unknown,
  tooltipId: string | undefined,
): string | undefined {
  return typeof current !== "string" || current.length === 0
    ? tooltipId
    : tooltipId == null
      ? current
      : `${current} ${tooltipId}`;
}

function shouldOpenForElement(
  element: unknown,
  mode: TooltipOpenWhen,
): boolean {
  if (mode === "always") return true;
  if (typeof Element === "undefined" || !(element instanceof Element)) {
    return false;
  }
  if (mode === "trigger-overflows") {
    const target =
      element.querySelector("[data-tooltip-overflow-target]") ?? element;
    return (
      target.scrollWidth > target.clientWidth ||
      target.scrollHeight > target.clientHeight
    );
  }
  const target = element.querySelector("[data-tooltip-visibility-target]");
  return target != null && getComputedStyle(target).display === "none";
}

function contentClassName(props: TooltipProps, open: boolean): string {
  const variant = props.variant ?? "tooltip";
  const color = props.color ?? "default";
  return classNames(
    "w-fit text-sm whitespace-normal break-words",
    props.selectable ? "select-text" : "select-none",
    variant === "floating-navigation-rail" ? "z-20 flex flex-col" : "z-50",
    variant === "rich" &&
      "bg-surface-elevated-secondary/90 text-default ring-border rounded-xl shadow-xl-spread ring-[0.5px] backdrop-blur-sm",
    variant === "coachmark" &&
      "relative rounded-2xl bg-coachmark text-coachmark shadow-lg",
    variant === "tooltip" &&
      color === "surface" &&
      "rounded-md bg-surface-elevated-secondary/90 text-secondary ring-border shadow-xl-spread ring-[0.5px] backdrop-blur-sm",
    variant === "tooltip" &&
      color === "inverse" &&
      "border-text bg-primary-solid text-primary-solid rounded-2xl border",
    variant === "tooltip" &&
      color === "default" &&
      "rounded-2xl border border-(color:--color-border-tooltip) bg-(--color-background-tooltip) text-(color:--color-text-tooltip) leading-4.5 shadow-(--shadow-tooltip)",
    variant === "tooltip" &&
      !props.disablePadding &&
      (color === "default" ? "px-3 py-1.25" : "px-2 py-1.5"),
    !open && "pointer-events-none",
    props.tooltipClassName,
  );
}

/** 原 `M3` / 压缩导出 `o_`。 */
export function Tooltip(props: TooltipProps): unknown {
  const react = reactOf();
  const runtime = jsxRuntimeOf();
  if (props.disabled || props.tooltipContent == null) {
    return runtime.jsx(runtime.Fragment, { children: props.children });
  }

  const generatedId = react.useId();
  const tooltipId = props.tooltipId ?? generatedId;
  const [uncontrolledOpen, setUncontrolledOpen] = react.useState(
    props.defaultOpen === true,
  );
  const controlled = props.open !== undefined;
  const closeOnTriggerClick =
    props.closeOnTriggerClick ??
    ((props.variant ?? "tooltip") === "tooltip" &&
      !(props.interactive ?? props.selectable ?? false) &&
      !controlled);
  const open = !props.triggerPopupOpen && (props.open ?? uncontrolledOpen);
  const setOpen = (next: boolean) => {
    if (!controlled) setUncontrolledOpen(next);
    props.onOpenChange?.(next);
  };
  const triggerProps: Record<string, unknown> = {
    "aria-describedby": open ? tooltipId : undefined,
    "data-state": open ? "delayed-open" : "closed",
    className: props.className,
    onClick(event: TooltipEvent) {
      if (closeOnTriggerClick && !event.defaultPrevented) setOpen(false);
    },
    onBlur() {
      if (props.closeOnTriggerBlur ?? true) setOpen(false);
    },
    onContextMenu() {
      setOpen(false);
    },
    onFocus(event: TooltipEvent) {
      if (!event.defaultPrevented) setOpen(true);
    },
    onKeyDown(event: TooltipEvent) {
      if (event.key === "Escape") setOpen(false);
    },
    onPointerEnter(event: TooltipEvent) {
      if (
        !props.disableHoverOpen &&
        event.pointerType !== "touch" &&
        shouldOpenForElement(event.currentTarget, props.openWhen ?? "always")
      ) {
        const baseDuration = props.delayOpen
          ? 250
          : (props.delayDuration ?? 200);
        props.getDelayDuration?.(event, baseDuration);
        setOpen(true);
      }
    },
    onPointerLeave() {
      if (props.closeOnPointerLeave ?? true) setOpen(false);
    },
  };

  let trigger: unknown;
  if (props.triggerElement != null) {
    trigger = props.children;
  } else if (
    (props.triggerAsChild ?? true) &&
    react.isValidElement(props.children)
  ) {
    trigger = react.cloneElement(props.children, {
      ...triggerProps,
      "aria-describedby": joinAriaDescriptions(
        props.children.props["aria-describedby"],
        triggerProps["aria-describedby"] as string | undefined,
      ),
      className: classNames(
        props.children.props.className as string | undefined,
        props.className,
      ),
      ref: props.triggerRef,
    });
  } else {
    trigger = runtime.jsx("button", {
      type: "button",
      ...triggerProps,
      ref: props.triggerRef,
      children: props.children,
    });
  }

  const shouldRenderContent = open || props.forceMount === true;
  const content = shouldRenderContent
    ? runtime.jsx("div", {
        id: tooltipId,
        "data-side": props.side ?? "top",
        "aria-hidden": open ? undefined : "true",
        hidden: !open && (props.variant ?? "tooltip") !== "unstyled",
        role: "tooltip",
        className: contentClassName(props, open),
        style: {
          maxWidth:
            props.tooltipMaxWidth ??
            "min(20rem, var(--radix-tooltip-content-available-width), calc(100vw - 16px))",
          maxHeight:
            "min(var(--radix-tooltip-content-available-height), calc(100vh - 16px))",
        },
        children: runtime.jsxs("div", {
          className: classNames(
            "flex gap-2",
            (props.variant ?? "tooltip") === "tooltip"
              ? "items-center"
              : "items-stretch min-h-0 flex-1",
          ),
          children: [
            runtime.jsx("div", {
              className: classNames("min-w-0", props.tooltipBodyClassName),
              children: props.tooltipContent,
            }),
            props.shortcut
              ? runtime.jsx("kbd", { children: props.shortcut })
              : null,
          ],
        }),
      })
    : null;

  return runtime.jsxs(runtime.Fragment, { children: [trigger, content] });
}

/** 原 `U3` / 压缩导出 `c_`。 */
export function initializeTooltip(): void {}
