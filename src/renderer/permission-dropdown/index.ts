// permission-dropdown —— 分享对象权限选择与移除菜单。
// 原版：app/webview/assets/permission-dropdown-faa59c51006d.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

void runtimeChunk;
const {
  $3: initializeReactRuntime,
  I3: getJsxRuntime,
  If: initializeMenu,
  cy: ChevronIcon,
  iy: CheckIcon,
  jf: Menu,
  kf: DropdownMenu,
  lw: initializePermissionIcons,
} = appSharedChunk;
const jsx = getJsxRuntime();

type PermissionValue = string | number;

interface PermissionOption<Value extends PermissionValue> {
  ariaLabel?: string;
  description?: string | null;
  disabled?: boolean;
  tooltipText?: unknown;
  value: Value;
}

interface PermissionDropdownProps<Value extends PermissionValue> {
  disabled?: boolean;
  onChange?: (value: Value) => void;
  onRemoveAccess?: () => void;
  options: readonly PermissionOption<Value>[];
  removeLabel?: unknown;
  renderLabel: (value: Value) => unknown;
  value: Value;
  variant?: "default" | "inline";
}

function PermissionDropdown<Value extends PermissionValue>({
  options,
  disabled = false,
  renderLabel,
  removeLabel,
  variant = "default",
  value,
  onChange,
  onRemoveAccess,
}: PermissionDropdownProps<Value>): unknown {
  const triggerClassName =
    variant === "inline"
      ? "flex shrink-0 cursor-interaction items-center gap-1 text-base text-default"
      : "flex cursor-interaction items-center gap-1 rounded-md border border-default px-2 py-1 text-sm text-default";
  const triggerButton = jsx.jsxs("button", {
    type: "button",
    disabled,
    className: triggerClassName,
    children: [
      renderLabel(value),
      jsx.jsx(ChevronIcon, { className: "text-codex-description" }),
    ],
  });
  const optionItems = options.map((option) =>
    jsx.jsx(
      Menu.Item,
      {
        "aria-description": option.description,
        "aria-label": option.ariaLabel,
        disabled: disabled || option.disabled,
        RightIcon: option.value === value ? CheckIcon : undefined,
        SubText:
          option.description == null
            ? undefined
            : jsx.jsx(jsx.Fragment, { children: option.description }),
        subTextAllowWrap: true,
        tooltipText: option.tooltipText,
        onSelect: () => onChange?.(option.value),
        children: renderLabel(option.value),
      },
      option.value,
    ),
  );
  const removeItem =
    onRemoveAccess == null
      ? null
      : jsx.jsxs(jsx.Fragment, {
          children: [
            jsx.jsx(Menu.Separator, {}),
            jsx.jsx(Menu.Item, {
              disabled,
              onSelect: onRemoveAccess,
              children: jsx.jsx("span", {
                className: "text-danger",
                children: removeLabel,
              }),
            }),
          ],
        });

  return jsx.jsxs(DropdownMenu, {
    align: "end",
    contentWidth: "xs",
    disabled,
    triggerButton,
    children: [optionItems, removeItem],
  });
}

function initializePermissionDropdown(): void {
  initializeReactRuntime();
  initializeMenu();
  initializePermissionIcons();
}

export { initializePermissionDropdown as n, PermissionDropdown as t };
