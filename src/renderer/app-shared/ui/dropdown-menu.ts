import { classNames } from "./class-names";
import { Menu } from "./menu";

export type DropdownContentWidth =
  | "icon"
  | "xs"
  | "sm"
  | "menuNarrow"
  | "menu"
  | "menuFixed"
  | "menuBounded"
  | "menuWide"
  | "sidebar"
  | "workspace"
  | "panel"
  | "panelWide"
  | "panelExtraWide";

export type DropdownContentMaxHeight =
  "compact" | "list" | "tall" | "composerPlugins";

export interface DropdownEvent {
  defaultPrevented?: boolean;
  preventDefault?(): void;
  stopPropagation?(): void;
}

export interface DropdownElement {
  type: unknown;
  props: Record<string, unknown>;
}

export interface DropdownMenuProps extends Record<string, unknown> {
  triggerButton: DropdownElement;
  disabled?: boolean;
  children?: unknown;
  modal?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  dir?: "ltr" | "rtl";
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  contentRef?: unknown;
  onContentFocus?: (event: DropdownEvent) => void;
  onContentKeyDownCapture?: (event: DropdownEvent) => void;
  onContentPointerDownCapture?: (event: DropdownEvent) => void;
  onContentPointerEnter?: (event: DropdownEvent) => void;
  onContentPointerLeave?: (event: DropdownEvent) => void;
  onOpenAutoFocus?: (event: DropdownEvent) => void;
  onCloseAutoFocus?: (event: DropdownEvent) => void;
  onEscapeKeyDown?: (event: DropdownEvent) => void;
  contentClassName?: string;
  contentVariant?: "default" | "attached" | "picker";
  contentStyle?: Record<string, unknown>;
  size?: "default" | "large" | "descriptive" | "select";
  surface?: "menu" | "panel" | "glass" | "chatgpt" | "bare";
  contentWidth?: DropdownContentWidth;
  matchTriggerWidth?: boolean;
  contentMaxHeight?: DropdownContentMaxHeight;
  portalContainer?: unknown;
}

interface JsxRuntimeLike {
  jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
}

interface ReactLike {
  cloneElement(
    element: DropdownElement,
    props: Record<string, unknown>,
  ): DropdownElement;
  useEffect(
    effect: () => void | (() => void),
    dependencies: readonly unknown[],
  ): void;
  useState<T>(value: T): [T, (value: T) => void];
}

function runtimeOf(): JsxRuntimeLike {
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

const WIDTH_CLASS: Record<DropdownContentWidth, string> = {
  icon: "min-w-[120px]",
  xs: "min-w-[160px]",
  sm: "min-w-[180px]",
  menuNarrow: "w-52",
  menu: "min-w-[var(--app-menu-min-width,220px)]",
  menuFixed: "w-[220px]",
  menuBounded: "min-w-[200px] max-w-[320px]",
  menuWide: "w-[240px]",
  sidebar: "min-w-[172px] max-w-[240px]",
  workspace: "min-w-[260px]",
  panel: "w-[280px]",
  panelWide: "w-[360px]",
  panelExtraWide: "w-[408px]",
};

const MAX_HEIGHT: Record<DropdownContentMaxHeight, string> = {
  compact: "200px",
  list: "250px",
  tall: "350px",
  composerPlugins: "var(--height-composer-plugins-menu, 250px)",
};

/** 原 `xft` / 压缩导出 `kf`。 */
export function DropdownMenu(props: DropdownMenuProps): unknown {
  const react = reactOf();
  const [localOpen, setLocalOpen] = react.useState(false);
  const open = props.disabled ? false : (props.open ?? localOpen);
  const setOpen = (next: boolean) => {
    if (props.disabled && next) return;
    if (props.open === undefined) setLocalOpen(next);
    props.onOpenChange?.(next);
  };

  react.useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const close = () => setOpen(false);
    window.addEventListener("blur", close);
    return () => window.removeEventListener("blur", close);
  }, [open]);

  const originalClick = props.triggerButton.props.onClick;
  const trigger = react.cloneElement(props.triggerButton, {
    "aria-expanded": open,
    "aria-haspopup": "menu",
    "data-state": open ? "open" : "closed",
    disabled: props.disabled || props.triggerButton.props.disabled,
    onClick(event: DropdownEvent) {
      if (typeof originalClick === "function") originalClick(event);
      if (!event.defaultPrevented && !props.disabled) setOpen(!open);
    },
  });

  const attached = props.contentVariant === "attached";
  const triggerWidth = "var(--radix-dropdown-menu-trigger-width)";
  const widthStyle =
    attached || props.matchTriggerWidth
      ? { width: triggerWidth, minWidth: triggerWidth }
      : undefined;
  const requestedMaxHeight =
    props.contentMaxHeight == null
      ? attached
        ? MAX_HEIGHT.list
        : undefined
      : MAX_HEIGHT[props.contentMaxHeight];
  const content =
    !open || props.disabled
      ? null
      : runtimeOf().jsx(Menu.Content, {
          ref: props.contentRef,
          side: attached ? "bottom" : props.side,
          align: props.align,
          sideOffset: attached ? 0 : props.sideOffset,
          avoidCollisions: !attached,
          alignOffset: props.alignOffset,
          onFocus: props.onContentFocus,
          onKeyDownCapture: props.onContentKeyDownCapture,
          onPointerDownCapture: props.onContentPointerDownCapture,
          onPointerEnter: props.onContentPointerEnter,
          onPointerLeave: props.onContentPointerLeave,
          onOpenAutoFocus: props.onOpenAutoFocus,
          onCloseAutoFocus: props.onCloseAutoFocus,
          onEscapeKeyDown(event: DropdownEvent) {
            props.onEscapeKeyDown?.(event);
            if (!event.defaultPrevented) setOpen(false);
          },
          size: props.size,
          surface: props.surface ?? "menu",
          variant: props.contentVariant,
          className: classNames(
            props.contentWidth == null
              ? undefined
              : WIDTH_CLASS[props.contentWidth],
            props.contentClassName,
          ),
          style: {
            ...props.contentStyle,
            ...widthStyle,
            maxHeight:
              requestedMaxHeight == null
                ? props.contentStyle?.maxHeight
                : `min(${requestedMaxHeight}, var(--radix-dropdown-menu-content-available-height), calc(100vh - 16px))`,
          },
          children: props.children,
        });
  const overlay =
    props.modal && open && !props.disabled
      ? runtimeOf().jsx("div", {
          "aria-hidden": true,
          className: "pointer-events-auto fixed inset-0",
          "data-portal-container": props.portalContainer,
        })
      : null;
  return runtimeOf().jsxs("div", {
    dir: props.dir,
    "data-dropdown-menu": true,
    "data-modal": props.modal === true,
    "data-state": open ? "open" : "closed",
    children: [trigger, overlay, content],
  });
}
