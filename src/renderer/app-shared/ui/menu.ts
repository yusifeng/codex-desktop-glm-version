import { classNames } from "./class-names";
import { Tooltip, type TooltipProps } from "./tooltip";

export interface MenuEvent {
  defaultPrevented?: boolean;
  key?: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  preventDefault(): void;
  stopPropagation(): void;
  currentTarget?: { select?(): void };
}

export interface MenuBaseProps extends Record<string, unknown> {
  children?: unknown;
  className?: string;
  disabled?: boolean;
}

export interface MenuContentProps extends MenuBaseProps {
  align?: "start" | "center" | "end";
  sideOffset?: number;
  size?: "default" | "large" | "descriptive" | "select";
  surface?: "menu" | "panel" | "glass" | "chatgpt" | "bare";
  variant?: "default" | "attached" | "picker";
  style?: Record<string, unknown>;
}

export interface MenuItemProps extends MenuBaseProps {
  asChild?: boolean;
  href?: string;
  onClick?: (event: MenuEvent) => void;
  onSelect?: (event: MenuEvent) => void;
  isActive?: boolean;
  focusableWhenDisabled?: boolean;
  leftIcon?: unknown;
  rightIcon?: unknown;
  keyboardShortcut?: unknown;
  rightText?: unknown;
  SubText?: unknown;
  tone?: "default" | "danger";
  variant?: "default" | "hint" | "label" | "display" | "detail" | "unstyled";
  allowWrap?: boolean;
  subTextAllowWrap?: boolean;
  textOverflow?: "ellipsis" | "fade";
  tooltipText?: unknown;
  tooltipDisabled?: boolean;
  tooltipSide?: TooltipProps["side"];
  tooltipAlign?: TooltipProps["align"];
  tooltipOpenWhen?: TooltipProps["openWhen"];
}

export interface MenuCheckboxItemProps extends MenuBaseProps {
  checked?: boolean;
  closeOnSelect?: boolean;
  href?: string;
  indicator?: "checkmark" | "switch";
  leftIcon?: unknown;
  onSelect?: (event: MenuEvent) => void;
  SubText?: unknown;
}

export interface MenuRadioItemProps extends MenuBaseProps {
  value?: string;
  href?: string;
  icon?: unknown;
  SubText?: unknown;
  variant?: "default" | "icon" | "swatch" | "chatgpt";
}

export interface MenuInputProps extends Record<string, unknown> {
  className?: string;
  onKeyDown?: (event: MenuEvent) => void;
}

export interface MenuSearchInputProps extends MenuInputProps {
  inputClassName?: string;
  sticky?: boolean;
  trailingContent?: unknown;
  variant?: "default" | "inset";
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
  Children: { toArray(children: unknown): unknown[] };
  cloneElement(element: ElementLike, props: Record<string, unknown>): unknown;
  isValidElement(value: unknown): value is ElementLike;
  useState<T>(initialValue: T): [T, (value: T) => void];
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

const ITEM_BASE =
  "outline-hidden flex min-h-[var(--app-menu-item-height,0px)] shrink-0 items-center p-[var(--app-menu-item-padding,var(--padding-row-y)_var(--padding-row-x))] text-(length:--app-menu-item-font-size,var(--text-sm))";
const ITEM_CONTENT =
  "flex w-full items-center gap-[var(--spacing-menu-item-content,calc(var(--spacing)*1.5))]";

/** 原 `tft`。 */
export function MenuTrigger({
  disabled,
  className,
  ...props
}: MenuBaseProps): unknown {
  return runtimeOf().jsx("button", {
    type: "button",
    "aria-disabled": disabled || undefined,
    className: classNames(
      "outline-hidden",
      disabled ? "cursor-default opacity-25" : "cursor-interaction",
      className,
    ),
    ...props,
  });
}

/** 原 `nft`。 */
export function MenuContent({
  children,
  className,
  align = "start",
  sideOffset = 1,
  size = "default",
  surface = "menu",
  variant = "default",
  style,
  ...props
}: MenuContentProps): unknown {
  return runtimeOf().jsx("div", {
    role: "menu",
    align,
    sideOffset,
    className: classNames(
      "no-drag z-50 flex select-none flex-col overflow-y-auto",
      variant === "picker" && "w-65 [--app-menu-gutter:0px]",
      surface === "panel" && "px-1 py-1",
      variant === "attached"
        ? "m-0 rounded-b-2xl border border-t-0 border-default bg-surface-elevated-secondary p-[var(--app-menu-gutter,var(--spacing))] shadow-xl-spread"
        : "m-px",
      size !== "default" && `menu-${size}-rows`,
      className,
    ),
    style: {
      maxWidth:
        surface === "chatgpt"
          ? "min(var(--container-xs), var(--radix-dropdown-menu-content-available-width), calc(100vw - 16px))"
          : "min(var(--radix-dropdown-menu-content-available-width), calc(100vw - 16px))",
      maxHeight:
        "min(var(--radix-dropdown-menu-content-available-height), calc(100vh - 16px))",
      ...style,
    },
    ...props,
    children,
  });
}

function menuItemContent(props: MenuItemProps): unknown {
  return runtimeOf().jsxs("div", {
    "data-menu-row-content": true,
    className: ITEM_CONTENT,
    children: [
      props.leftIcon == null
        ? null
        : runtimeOf().jsx("span", {
            className: "shrink-0 opacity-75",
            children: props.leftIcon,
          }),
      runtimeOf().jsxs("div", {
        className: "flex min-w-0 flex-1 flex-col",
        children: [
          runtimeOf().jsx("span", {
            "data-tooltip-overflow-target":
              props.tooltipOpenWhen === "trigger-overflows" ? "" : undefined,
            className: classNames(
              "min-w-0",
              props.allowWrap && "whitespace-normal",
              !props.allowWrap &&
                (props.textOverflow === "fade"
                  ? "text-fade-truncate"
                  : "truncate"),
            ),
            children: props.children,
          }),
          props.SubText == null
            ? null
            : runtimeOf().jsx("span", {
                className: classNames(
                  "min-w-0 text-xs leading-dense text-tertiary",
                  props.subTextAllowWrap ? "whitespace-normal" : "truncate",
                ),
                children: props.SubText,
              }),
        ],
      }),
      props.keyboardShortcut == null
        ? null
        : runtimeOf().jsx("span", {
            className: "ms-2 shrink-0 text-xs text-codex-description",
            children: props.keyboardShortcut,
          }),
      props.rightText,
      props.rightIcon,
    ],
  });
}

/** 原 `rft`。 */
export function MenuItem(props: MenuItemProps): unknown {
  const {
    asChild,
    children,
    className,
    disabled,
    focusableWhenDisabled = false,
    href,
    onClick,
    onSelect,
    isActive,
    tone = "default",
    variant = "default",
    tooltipText,
    tooltipDisabled,
    tooltipSide,
    tooltipAlign,
    tooltipOpenWhen,
    leftIcon,
    rightIcon,
    keyboardShortcut,
    rightText,
    SubText,
    allowWrap,
    subTextAllowWrap,
    textOverflow,
    ...elementProps
  } = props;
  const displayOnly = variant === "display" || variant === "label";
  const handleClick = (event: MenuEvent) => {
    if (displayOnly) return event.preventDefault();
    if (!disabled) onClick?.(event);
  };
  const handleSelect =
    disabled || displayOnly
      ? (event: MenuEvent) => event.preventDefault()
      : onSelect;
  const contentProps: MenuItemProps = {
    children,
    leftIcon,
    rightIcon,
    keyboardShortcut,
    rightText,
    SubText,
    allowWrap,
    subTextAllowWrap,
    textOverflow,
    tooltipOpenWhen,
  };
  const child =
    asChild && reactOf().isValidElement(children) ? children : undefined;
  const Element = href == null ? "div" : "a";
  const itemProps = {
    ...elementProps,
    href: child == null ? href : (child.props.href ?? href),
    role: "menuitem",
    "aria-current": isActive ? "true" : undefined,
    "aria-disabled": disabled || undefined,
    tabIndex: disabled && !focusableWhenDisabled ? -1 : undefined,
    className: classNames(
      "no-drag",
      variant !== "unstyled" && ITEM_BASE,
      variant !== "unstyled" &&
        (variant === "display" || variant === "detail"
          ? "rounded-md"
          : "rounded-xl"),
      tone === "danger" ? "text-danger" : "text-default",
      isActive && "bg-primary-ghost-hover",
      disabled
        ? "cursor-default opacity-50"
        : !displayOnly &&
            "group cursor-interaction hover:bg-primary-ghost-hover focus:bg-primary-ghost-hover",
      className,
    ),
    onClick: handleClick,
    onSelect: handleSelect,
    children: menuItemContent(contentProps),
  };
  const item =
    child == null
      ? runtimeOf().jsx(Element, itemProps)
      : reactOf().cloneElement(child, {
          ...itemProps,
          className: classNames(
            typeof child.props.className === "string"
              ? child.props.className
              : undefined,
            itemProps.className,
          ),
        });
  return !tooltipText
    ? item
    : runtimeOf().jsx(Tooltip, {
        tooltipContent: tooltipText,
        disabled: tooltipDisabled,
        side: tooltipSide,
        align: tooltipAlign,
        openWhen: tooltipOpenWhen,
        children: item,
      });
}

/** 原 Radix `s7`。 */
export function MenuItemSlot(props: MenuBaseProps): unknown {
  return runtimeOf().jsx(runtimeOf().Fragment, { children: props.children });
}

/** 原 `sft`。 */
export function MenuCheckboxItem({
  children,
  checked,
  closeOnSelect = false,
  disabled,
  href,
  indicator = "checkmark",
  leftIcon,
  onSelect,
  className,
  SubText,
  ...props
}: MenuCheckboxItemProps): unknown {
  const handleSelect = (event: MenuEvent) => {
    if (href == null && !closeOnSelect) event.preventDefault();
    onSelect?.(event);
  };
  return runtimeOf().jsx(href == null ? "div" : "a", {
    ...props,
    href,
    role: "menuitemcheckbox",
    "aria-checked": checked === true,
    "aria-disabled": disabled || undefined,
    className: classNames(
      "no-drag flex flex-col rounded-xl text-default",
      ITEM_BASE,
      disabled
        ? "cursor-default opacity-50"
        : "cursor-interaction hover:bg-primary-ghost-hover",
      className,
    ),
    onSelect: handleSelect,
    children: runtimeOf().jsxs("div", {
      "data-menu-row-content": true,
      className: ITEM_CONTENT,
      children: [
        leftIcon,
        runtimeOf().jsxs("div", {
          className: "flex min-w-0 flex-1 flex-col",
          children: [children, SubText],
        }),
        runtimeOf().jsx("span", {
          "data-indicator": indicator,
          children:
            indicator === "switch"
              ? checked
                ? "on"
                : "off"
              : checked
                ? "✓"
                : null,
        }),
      ],
    }),
  });
}

export function MenuRadioGroup(props: MenuBaseProps): unknown {
  return runtimeOf().jsx("div", { ...props, role: "group" });
}

/** 原 `uft`。 */
export function MenuRadioItem({
  children,
  className,
  disabled,
  href,
  icon,
  SubText,
  variant = "default",
  ...props
}: MenuRadioItemProps): unknown {
  const compact = variant === "icon" || variant === "swatch";
  return runtimeOf().jsx(href == null ? "div" : "a", {
    ...props,
    href,
    role: "menuitemradio",
    "aria-disabled": disabled || undefined,
    className: classNames(
      "no-drag text-default outline-hidden",
      compact
        ? "flex size-9 items-center justify-center rounded-full"
        : ITEM_BASE,
      disabled
        ? "cursor-default opacity-50"
        : "cursor-interaction hover:bg-primary-ghost-hover",
      className,
    ),
    children: compact
      ? children
      : runtimeOf().jsxs("div", {
          className: ITEM_CONTENT,
          children: [icon, children, SubText, "●"],
        }),
  });
}

/** 原 `pft`。 */
export function MenuItemIcon({
  children,
  className,
  size = "sm",
}: MenuBaseProps & { size?: "xs" | "sm" | "base" | "md" }): unknown {
  return runtimeOf().jsx("span", {
    className: classNames(
      "inline-flex items-center justify-center leading-none shrink-0 opacity-75",
      `icon-${size}`,
      className,
    ),
    children,
  });
}

/** 原 `mft`。 */
export function MenuInput({
  className,
  onKeyDown,
  ...props
}: MenuInputProps): unknown {
  return runtimeOf().jsx("input", {
    ...props,
    className: classNames(
      "w-full min-w-0 rounded-sm border-none px-row-x py-row-y text-sm !outline-none",
      className,
    ),
    autoFocus: true,
    onKeyDown(event: MenuEvent) {
      event.stopPropagation();
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key?.toLowerCase() === "a"
      ) {
        event.preventDefault();
        event.currentTarget?.select?.();
        return;
      }
      onKeyDown?.(event);
    },
  });
}

/** 原 `hft`。 */
export function MenuSearchInput({
  className,
  inputClassName,
  sticky = false,
  trailingContent,
  variant = "default",
  ...props
}: MenuSearchInputProps): unknown {
  const content = runtimeOf().jsxs("div", {
    className: classNames(
      ITEM_CONTENT,
      "p-[var(--app-menu-item-padding,var(--padding-row-y)_var(--padding-row-x))]",
      variant === "inset" &&
        "m-2 !w-auto rounded-lg border border-primary-outline",
      className,
    ),
    children: [
      runtimeOf().jsx("span", { className: "text-tertiary", children: "⌕" }),
      runtimeOf().jsx(MenuInput, {
        ...props,
        className: classNames(
          "!w-auto flex-1 appearance-none !rounded-none !border-none bg-transparent !px-0 !py-0",
          inputClassName,
        ),
      }),
      trailingContent,
    ],
  });
  return sticky
    ? runtimeOf().jsx("div", {
        className:
          "sticky top-0 z-10 -mx-1 -mt-1 bg-surface-elevated-secondary p-1",
        children: content,
      })
    : content;
}

export function MenuSeparator({
  className,
  variant = "default",
}: MenuBaseProps & { variant?: "default" | "chatgpt" }): unknown {
  return runtimeOf().jsx("div", {
    role: "separator",
    className: classNames(
      "w-full",
      variant === "chatgpt" ? "px-4 py-1" : "px-row-x py-1",
      className,
    ),
    children: runtimeOf().jsx("div", {
      className: classNames(
        "h-px w-full",
        variant === "chatgpt" ? "bg-border-subtle" : "bg-border",
      ),
    }),
  });
}

export function MenuSectionLabel(props: MenuBaseProps): unknown {
  return runtimeOf().jsx("div", {
    ...props,
    "data-menu-section-label": true,
    className: classNames("text-xs text-codex-description", props.className),
  });
}

export function MenuMessage({
  tone = "muted",
  compact = false,
  centered = false,
  variant = "default",
  ...props
}: MenuBaseProps & {
  tone?: "muted" | "error";
  compact?: boolean;
  centered?: boolean;
  variant?: "default" | "chatgpt";
}): unknown {
  return runtimeOf().jsx("div", {
    ...props,
    className: classNames(
      variant === "chatgpt"
        ? "mx-1.5 px-2.5 py-2.5 text-xs leading-4"
        : compact
          ? "px-row-x py-2 text-sm"
          : "px-row-x py-3 text-sm",
      tone === "error" ? "text-danger" : "text-codex-description",
      centered && "self-center text-center",
      props.className,
    ),
  });
}

export function MenuTitle(props: MenuBaseProps): unknown {
  return runtimeOf().jsx("div", {
    ...props,
    className: classNames(
      "text-codex-description flex min-h-6 items-center truncate px-row-x py-row-y text-sm leading-4",
      props.className,
    ),
  });
}

export function MenuSubmenuItem({
  trigger,
  children,
  isDefaultOpen = false,
  onOpenChange,
}: {
  trigger: ElementLike;
  children?: unknown;
  isDefaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}): unknown {
  const react = reactOf();
  const disabled = trigger.props.disabled === true;
  const [open, setOpen] = react.useState(!disabled && isDefaultOpen);
  const active = open && !disabled;
  const clonedTrigger = react.cloneElement(trigger, {
    onSelect(event: MenuEvent) {
      const handler = trigger.props.onSelect;
      if (typeof handler === "function") handler(event);
      if (!event.defaultPrevented) {
        event.preventDefault();
        event.stopPropagation();
        if (!disabled) {
          setOpen(!active);
          onOpenChange?.(!active);
        }
      }
    },
    rightIcon: "›",
  });
  return runtimeOf().jsxs("div", {
    className: "flex flex-col",
    "data-state": active ? "open" : "closed",
    children: [
      clonedTrigger,
      runtimeOf().jsx("div", {
        className: active
          ? undefined
          : "pointer-events-none invisible h-0 overflow-hidden",
        children: active ? children : null,
      }),
    ],
  });
}

export function MenuFlyoutSubmenuItem(props: MenuItemProps): unknown {
  return runtimeOf().jsx("div", {
    "data-menu-flyout": true,
    children: runtimeOf().jsx(MenuItem, {
      ...props,
      rightIcon: props.rightIcon ?? "›",
    }),
  });
}

export function MenuSection(props: MenuBaseProps): unknown {
  return runtimeOf().jsx("div", { ...props });
}

export function MenuGroup(props: MenuBaseProps): unknown {
  return runtimeOf().jsx("div", {
    ...props,
    role: "group",
    className: classNames("menu-group", props.className),
  });
}

export const Menu = {
  Trigger: MenuTrigger,
  Content: MenuContent,
  Item: MenuItem,
  ItemSlot: MenuItemSlot,
  CheckboxItem: MenuCheckboxItem,
  RadioGroup: MenuRadioGroup,
  RadioItem: MenuRadioItem,
  ItemIcon: MenuItemIcon,
  Input: MenuInput,
  SearchInput: MenuSearchInput,
  Separator: MenuSeparator,
  SectionLabel: MenuSectionLabel,
  Message: MenuMessage,
  Title: MenuTitle,
  SubmenuItem: MenuSubmenuItem,
  FlyoutSubmenuItem: MenuFlyoutSubmenuItem,
  Group: MenuGroup,
  Section: MenuSection,
} as const;

/** 原 `jft` / 压缩导出 `If`。 */
export function initializeMenu(): void {}
