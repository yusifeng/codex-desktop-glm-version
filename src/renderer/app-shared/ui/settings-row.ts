import { classNames } from "./class-names";

export type SettingsRowVariant =
  "default" | "featured" | "recommendation" | "stacked" | "nested";
export type SettingsRowSize = "default" | "compact";

export interface SettingsControlAriaProps {
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

export type SettingsControl =
  | ((props: SettingsControlAriaProps) => unknown)
  | string
  | number
  | bigint
  | boolean
  | symbol
  | object
  | null;

export interface SettingsRowProps {
  label?: unknown;
  labelSizing?: "grow" | "fixed";
  description?: unknown;
  control?: SettingsControl;
  icon?: unknown;
  className?: string;
  id?: string;
  size?: SettingsRowSize;
  variant?: SettingsRowVariant;
  verticalAlignment?: "center" | "start";
}

export interface SettingsDescriptionProps {
  children?: unknown;
}

export interface SettingsFieldRowProps {
  children?: unknown;
  compactLabelInset?: boolean;
  label?: unknown;
  valueAlignment?: "start" | "end";
  variant?: "default" | "compact";
}

export interface SettingsActionRowProps {
  actions?: unknown;
  ariaLabel?: string;
  className?: string;
  description?: unknown;
  disabled?: boolean;
  edgeRounding?: "row" | "none";
  icon?: unknown;
  label?: unknown;
  onClick?: (event: unknown) => void;
  onFocus?: (event: unknown) => void;
  onPointerEnter?: (event: unknown) => void;
  trailing?: unknown;
  variant?: "default" | "recommendation" | "nested";
}

interface JsxRuntimeLike {
  jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
}

interface ReactLike {
  useId(): string;
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

interface SettingsLabelProps {
  label?: unknown;
  labelId?: string;
  labelSizing?: "grow" | "fixed";
  description?: unknown;
  descriptionId?: string;
  icon?: unknown;
  variant: SettingsRowVariant;
  verticalAlignment: "center" | "start";
}

function SettingsLabel({
  label,
  labelId,
  labelSizing = "grow",
  description,
  descriptionId,
  icon,
  variant,
  verticalAlignment,
}: SettingsLabelProps): unknown {
  const labelClassName = classNames(
    "min-w-0 break-words text-default group-data-[density=compact]/settings:leading-4.5",
    variant === "featured" && "text-base",
    variant === "recommendation" && "text-[13px] leading-[18.571429px]",
    variant !== "featured" && variant !== "recommendation" && "text-sm",
    variant !== "nested" && "font-medium",
  );
  return runtimeOf().jsxs("div", {
    className: classNames(
      "flex min-w-0 gap-3",
      verticalAlignment === "start" ? "items-start" : "items-center",
      labelSizing === "grow" && "flex-1",
    ),
    children: [
      icon == null
        ? null
        : runtimeOf().jsx("span", {
            className: "shrink-0",
            children: icon,
          }),
      runtimeOf().jsxs("div", {
        className: "flex min-w-0 flex-1 flex-col gap-0.5",
        children: [
          runtimeOf().jsx("div", {
            id: labelId,
            className: labelClassName,
            children: label,
          }),
          description
            ? runtimeOf().jsx("div", {
                id: descriptionId,
                className:
                  "min-w-0 text-xs leading-4 text-wrap break-words text-secondary",
                children: description,
              })
            : null,
        ],
      }),
    ],
  });
}

/** 原 `cyt` / 压缩导出 `rl`。 */
export function SettingsRow({
  label,
  labelSizing = "grow",
  description,
  control,
  icon,
  className,
  id,
  size = "default",
  variant = "default",
  verticalAlignment = "center",
}: SettingsRowProps): unknown {
  const generatedId = reactOf().useId();
  const hasLabel = label != null || description != null || icon != null;
  const renderControl = typeof control === "function";
  const labelId =
    renderControl && label != null ? `${generatedId}-label` : undefined;
  const descriptionId =
    renderControl && description ? `${generatedId}-description` : undefined;
  const rowClassName = classNames(
    "@container/settings-row",
    variant === "stacked" &&
      "flex flex-col items-stretch gap-1 px-4 py-3 group-data-[density=compact]/settings:gap-0.5 group-data-[density=compact]/settings:py-2.5 group-data-[density=compact]/settings:first:pt-3.5 group-data-[density=compact]/settings:last:pb-4",
    variant === "nested" &&
      "flex min-h-10 justify-between gap-3 px-4 py-2 max-sm:min-h-0 max-sm:flex-col max-sm:items-stretch",
    variant !== "stacked" &&
      (verticalAlignment === "start" ? "items-start" : "items-center"),
    (variant === "default" ||
      variant === "featured" ||
      variant === "recommendation") &&
      classNames(
        "flex justify-between px-4",
        variant === "featured" && "gap-6 py-4",
        variant !== "featured" &&
          (size === "compact" ? "gap-4 py-2" : "gap-6 py-3"),
      ),
    variant === "recommendation" && "dark:bg-primary-ghost-hover",
    className,
  );
  const controlNode = renderControl
    ? control({
        "aria-labelledby": labelId,
        "aria-describedby": descriptionId,
      })
    : control;
  return runtimeOf().jsxs("div", {
    id,
    className: rowClassName,
    children: [
      hasLabel
        ? runtimeOf().jsx(SettingsLabel, {
            label,
            labelId,
            labelSizing,
            description,
            descriptionId,
            icon,
            variant,
            verticalAlignment,
          })
        : null,
      runtimeOf().jsx("div", {
        className: classNames(
          variant === "stacked" && "w-full",
          variant === "nested" &&
            "flex min-w-0 flex-1 items-center justify-end max-sm:justify-stretch",
          (variant === "default" ||
            variant === "featured" ||
            variant === "recommendation") &&
            "flex min-w-[min(--spacing(40),40cqw)] max-w-full shrink-0 items-center justify-end gap-2 empty:min-w-0",
        ),
        children: controlNode,
      }),
    ],
  });
}

/** 原 `lyt` / 压缩导出 `il`。 */
export function SettingsDescription({
  children,
}: SettingsDescriptionProps): unknown {
  return runtimeOf().jsx("span", {
    className: "text-xs text-secondary",
    children,
  });
}

/** 原 `dyt` / 压缩导出 `nl`。 */
export function SettingsFieldRow({
  children,
  compactLabelInset = true,
  label,
  valueAlignment = "start",
  variant = "default",
}: SettingsFieldRowProps): unknown {
  const compact = variant === "compact";
  return runtimeOf().jsxs("div", {
    className: classNames(
      "grid items-center",
      compact
        ? "h-[1.875rem] w-full grid-cols-[auto_minmax(0,1fr)] gap-x-6 overflow-x-hidden rounded-lg text-base leading-[18px] text-default electron:opacity-75"
        : "min-h-14 gap-1 px-4 py-2 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-6",
    ),
    children: [
      runtimeOf().jsx("div", {
        className: classNames(
          "min-w-0",
          compact
            ? classNames(
                "flex items-center pe-2 text-start",
                compactLabelInset && "ps-1",
              )
            : "text-sm text-secondary",
        ),
        children: label,
      }),
      runtimeOf().jsx("div", {
        className: classNames(
          "min-w-0",
          compact
            ? "flex items-center justify-end justify-self-stretch overflow-hidden"
            : classNames(
                "break-words whitespace-normal text-sm text-default",
                valueAlignment === "end" && "text-end",
              ),
        ),
        children,
      }),
    ],
  });
}

/** 原 `uyt` / 压缩导出 `tl`。 */
export function SettingsActionRow({
  actions,
  ariaLabel,
  className,
  description,
  disabled,
  edgeRounding = "row",
  icon,
  label,
  onClick,
  onFocus,
  onPointerEnter,
  trailing,
  variant = "default",
}: SettingsActionRowProps): unknown {
  const interactive = !disabled;
  return runtimeOf().jsxs("div", {
    className: classNames(
      "group flex w-full items-center",
      edgeRounding === "row" && "first:rounded-t-2xl last:rounded-b-2xl",
      variant === "recommendation" && "dark:bg-primary-ghost-hover",
      interactive &&
        "hover:bg-primary-ghost-hover focus-within:bg-primary-ghost-hover",
      interactive &&
        variant === "recommendation" &&
        "dark:hover:bg-background-secondary-soft-alpha dark:focus-within:bg-background-secondary-soft-alpha",
    ),
    children: [
      runtimeOf().jsxs("button", {
        "aria-label": ariaLabel,
        className: classNames(
          "flex min-w-0 flex-1 cursor-interaction items-center rounded-[inherit] px-4 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring disabled:cursor-default disabled:opacity-60",
          variant === "nested" ? "min-h-10 gap-3 py-0.5" : "gap-6 py-3",
          className,
        ),
        disabled,
        onClick,
        onFocus,
        onPointerEnter,
        type: "button",
        children: [
          runtimeOf().jsx(SettingsLabel, {
            label,
            description,
            icon,
            variant,
            verticalAlignment: "center",
          }),
          trailing == null
            ? null
            : runtimeOf().jsx("div", {
                className: "flex shrink-0 items-center gap-2",
                children: trailing,
              }),
        ],
      }),
      interactive && actions != null
        ? runtimeOf().jsx("div", {
            className: "flex shrink-0 items-center gap-1 pe-4",
            children: actions,
          })
        : null,
    ],
  });
}

/** 原 `myt` / 压缩导出 `al`。 */
export function initializeSettingsRows(): void {}
