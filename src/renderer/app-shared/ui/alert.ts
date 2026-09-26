import { classNames } from "./class-names";
import { useIntl } from "./intl";
import { IconAsset } from "./icons/icon-preset";
import { icon_xmark_md_light_16 } from "./icons/xmark-md-light-16";

export type AlertLevel = "info" | "success" | "warning" | "danger";
export type AlertVariant = "default" | "successNeutral" | "dangerSolid";

export interface AlertIconProps {
  className?: string;
}

export interface AlertProps {
  actions?: unknown;
  actionsInline?: boolean;
  announce?: boolean;
  className?: string;
  level?: AlertLevel;
  fullWidth?: boolean;
  children?: unknown;
  icon?: (props: AlertIconProps) => unknown;
  leading?: unknown;
  onRemove?: (event: unknown) => void;
  richColors?: boolean;
  testId?: string;
  variant?: AlertVariant;
}

interface JsxRuntimeLike {
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

/** 原 `Ilt` / 压缩导出 `om`。 */
export function Alert({
  actions,
  actionsInline = false,
  announce = true,
  className,
  level = "info",
  fullWidth,
  children,
  icon: Icon,
  leading,
  onRemove,
  richColors = false,
  testId,
  variant = "default",
}: AlertProps): unknown {
  const runtime = runtimeOf();
  const intl = useIntl();
  const defaultNeutral =
    variant === "default" &&
    (level === "info" || (level === "success" && !richColors));
  const defaultRichSuccess =
    variant === "default" && level === "success" && richColors;
  const successNeutral = variant === "successNeutral";
  const dangerSolid = variant === "dangerSolid";
  const defaultWarning = variant === "default" && level === "warning";
  const defaultDanger = variant === "default" && level === "danger";
  const rootClassName = classNames(
    "alert-root inline-flex flex-col gap-2 rounded-xl px-2 py-2 text-base leading-[1.4] pointer-events-auto box-shadow-lg border",
    {
      flex: fullWidth,
      "border-default bg-surface-elevated-secondary": defaultNeutral,
      "border-text-success/20 bg-background-success-surface":
        defaultRichSuccess,
      "border-transparent bg-primary-solid text-primary-solid": successNeutral,
      "border-transparent bg-danger-solid text-danger-solid": dangerSolid,
      "border-warning-outline bg-warning-surface": defaultWarning,
      "border-danger-outline bg-danger-surface": defaultDanger,
      "text-default":
        variant === "default" && (!richColors || level === "info"),
      "text-success":
        variant === "default" && richColors && level === "success",
      "text-warning":
        variant === "default" && richColors && level === "warning",
      "text-danger": variant === "default" && richColors && level === "danger",
    },
    className,
  );
  const leadingNode =
    leading != null || Icon
      ? runtime.jsx("div", {
          className: classNames(
            "flex size-6 shrink-0 grow-0 items-center justify-center self-start",
            variant === "default" && !richColors && "text-default",
          ),
          children:
            leading ??
            (Icon ? runtime.jsx(Icon, { className: "icon-xs" }) : null),
        })
      : null;
  const body =
    typeof children === "string"
      ? runtime.jsx("div", { className: "font-medium", children })
      : children;
  const inlineActions =
    actionsInline && actions != null
      ? runtime.jsx("div", {
          className: "flex shrink-0 items-center gap-2",
          children: actions,
        })
      : null;
  const content = runtime.jsxs("div", {
    className: "flex min-w-0 flex-1 items-start gap-3",
    children: [
      runtime.jsx("div", {
        className: "min-w-0 flex-1 justify-center gap-2 break-words",
        children: body,
      }),
      inlineActions,
    ],
  });
  const closeButton = onRemove
    ? runtime.jsx("button", {
        type: "button",
        onClick: onRemove,
        "aria-label": intl.formatMessage({
          id: "codex.alert.closeAriaLabel",
          defaultMessage: "Close",
          description:
            "Aria label for the close button on an alert/toast component",
        }),
        className:
          "flex size-6 shrink-0 grow-0 cursor-interaction items-center justify-center self-start rounded-full hover:bg-background-primary-ghost-hover/5",
        children: runtime.jsx(IconAsset, {
          "aria-hidden": false,
          asset: icon_xmark_md_light_16,
        }),
      })
    : null;
  const footerActions =
    !actionsInline && actions != null
      ? runtime.jsx("div", {
          className: "flex items-center justify-end gap-2",
          children: actions,
        })
      : null;
  return runtime.jsxs("div", {
    className: rootClassName,
    role: announce ? "alert" : undefined,
    "data-testid": testId,
    children: [
      runtime.jsxs("div", {
        className: "flex min-w-0 items-start gap-1",
        children: [leadingNode, content, closeButton],
      }),
      footerActions,
    ],
  });
}

/** 原 `Rlt` / 压缩导出 `sm`。 */
export function initializeAlert(): void {}
