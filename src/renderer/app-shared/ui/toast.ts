import { Alert, type AlertLevel, type AlertVariant } from "./alert";
import { Button } from "./button";
import { classNames } from "./class-names";
import { icon_circle_checkmark_light_16 } from "./icons/circle-checkmark-light-16";
import { icon_circle_exclamation_mark_light_16 } from "./icons/circle-exclamation-mark-light-16";
import { icon_circle_info_light_16 } from "./icons/circle-info-light-16";
import { IconAsset, type IconPreset } from "./icons/icon-preset";

export interface ToastAction {
  label: unknown;
  loading?: boolean;
  onClick(): void;
}

export interface ToastProps {
  description?: unknown;
  leading?: unknown;
  level: AlertLevel;
  onClose?: (event: unknown) => void;
  primaryAction?: ToastAction;
  secondaryAction?: ToastAction;
  testId?: string;
  title?: unknown;
  variant?: AlertVariant;
}

interface JsxRuntimeLike {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
}

function runtimeOf(): JsxRuntimeLike {
  return (
    (globalThis as { __RENDERER_JSX_RUNTIME__?: JsxRuntimeLike })
      .__RENDERER_JSX_RUNTIME__ ??
    (require("react/jsx-runtime") as JsxRuntimeLike)
  );
}

const alertClassName = "_alert_1msoq_11";

const levelIcons: Record<AlertLevel, IconPreset> = {
  info: icon_circle_info_light_16,
  success: icon_circle_checkmark_light_16,
  warning: icon_circle_exclamation_mark_light_16,
  danger: icon_circle_exclamation_mark_light_16,
};

function renderAction(action: ToastAction, color?: "secondary"): unknown {
  return runtimeOf().jsx(Button, {
    color,
    loading: action.loading,
    onClick: () => {
      action.onClick();
    },
    size: "compact",
    children: action.label,
  });
}

/** 原 `Wlt` / 压缩导出 `nm`。 */
export function Toast({
  description,
  leading,
  level,
  onClose,
  primaryAction,
  secondaryAction,
  testId,
  title,
  variant = "default",
}: ToastProps): unknown {
  const runtime = runtimeOf();
  const actions =
    primaryAction != null || secondaryAction != null
      ? runtime.jsxs(runtime.Fragment, {
          children: [
            secondaryAction == null
              ? null
              : renderAction(secondaryAction, "secondary"),
            primaryAction == null ? null : renderAction(primaryAction),
          ],
        })
      : undefined;
  const icon =
    leading ??
    runtime.jsx(IconAsset, {
      "aria-hidden": false,
      asset: levelIcons[level],
    });
  const titleNode = runtime.jsx("div", {
    className:
      "flex min-h-6 items-center text-start font-medium whitespace-pre-wrap",
    children: title,
  });
  const descriptionNode =
    description == null
      ? null
      : runtime.jsx("div", {
          className: classNames("text-start", {
            "text-secondary": variant === "default" && level === "info",
            "text-success/80": variant === "default" && level === "success",
            "text-primary-solid/80": variant === "successNeutral",
            "text-danger-solid/80": variant === "dangerSolid",
            "text-warning/80": variant === "default" && level === "warning",
            "text-danger/80": variant === "default" && level === "danger",
          }),
          children: description,
        });
  return runtime.jsx(Alert, {
    className: classNames(alertClassName, "leading-normal"),
    announce: false,
    actions,
    actionsInline: description == null,
    fullWidth: true,
    leading: icon,
    level,
    onRemove: onClose,
    richColors: true,
    testId,
    variant,
    children: runtime.jsxs("div", {
      className: "min-w-0",
      children: [titleNode, descriptionNode],
    }),
  });
}

/** 原 `Ult` / 压缩导出 `im`。 */
export function initializeToastStyles(): void {}

/** 原 `qlt` / 压缩导出 `rm`。 */
export function initializeToast(): void {}
