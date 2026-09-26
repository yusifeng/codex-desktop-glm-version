// permission-dropdown —— 分享对象权限选择与移除菜单。
// 原版：app/webview/assets/permission-dropdown-faa59c51006d.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const jsx = appShared.I3();

function PermissionDropdown({
  options,
  disabled = false,
  renderLabel,
  removeLabel,
  variant = "default",
  value,
  onChange,
  onRemoveAccess,
}: {
  options: any[];
  disabled?: boolean;
  renderLabel: (value: any) => any;
  removeLabel?: any;
  variant?: "default" | "inline";
  value: any;
  onChange?: (value: any) => void;
  onRemoveAccess?: () => void;
}) {
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
      jsx.jsx(appShared.cy, { className: "text-codex-description" }),
    ],
  });
  const optionItems = options.map((option) =>
    jsx.jsx(
      appShared.jf.Item,
      {
        "aria-description": option.description,
        "aria-label": option.ariaLabel,
        disabled: disabled || option.disabled,
        RightIcon: option.value === value ? appShared.iy : undefined,
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
            jsx.jsx(appShared.jf.Separator, {}),
            jsx.jsx(appShared.jf.Item, {
              disabled,
              onSelect: onRemoveAccess,
              children: jsx.jsx("span", {
                className: "text-danger",
                children: removeLabel,
              }),
            }),
          ],
        });

  return jsx.jsxs(appShared.kf, {
    align: "end",
    contentWidth: "xs",
    disabled,
    triggerButton,
    children: [optionItems, removeItem],
  });
}

function initializePermissionDropdown(): void {
  appShared.$3?.();
  appShared.If?.();
  appShared.lw?.();
}

export { initializePermissionDropdown as n, PermissionDropdown as t };
