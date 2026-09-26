import { classNames } from "./class-names";

export type CheckboxState = boolean | "indeterminate";
export type CheckboxVariant = "default" | "secondary" | "overlay" | "checklist";

export interface CheckboxClickEvent {
  defaultPrevented?: boolean;
}

export interface CheckboxProps extends Record<string, unknown> {
  checked?: CheckboxState;
  className?: string;
  defaultChecked?: CheckboxState;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onClick?: (event: CheckboxClickEvent) => void;
  variant?: CheckboxVariant;
}

interface ReactLike {
  useState<T>(initial: T): [T, (value: T) => void];
}

interface JsxRuntimeLike {
  jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
}

function reactOf(): ReactLike {
  return (
    (globalThis as { __RENDERER_REACT__?: ReactLike }).__RENDERER_REACT__ ??
    (require("react") as ReactLike)
  );
}

function runtimeOf(): JsxRuntimeLike {
  return (
    (globalThis as { __RENDERER_JSX_RUNTIME__?: JsxRuntimeLike })
      .__RENDERER_JSX_RUNTIME__ ??
    (require("react/jsx-runtime") as JsxRuntimeLike)
  );
}

const CHECKBOX_VARIANT_CLASSES: Record<CheckboxVariant, string> = {
  default:
    "icon-2xs rounded-xs data-[state=checked]:bg-primary-soft data-[state=indeterminate]:bg-primary-soft",
  secondary:
    "rounded-xs flex size-4 items-center justify-center text-tertiary data-[state=indeterminate]:text-default",
  overlay: "size-5 rounded-full bg-surface disabled:bg-surface-secondary",
  checklist: "relative grid size-5 place-items-center rounded-xs text-tertiary",
};

function stateName(checked: CheckboxState): "checked" | "indeterminate" | "unchecked" {
  return checked === "indeterminate"
    ? "indeterminate"
    : checked
      ? "checked"
      : "unchecked";
}

function CheckboxIndicator({
  checked,
  disabled,
  variant,
}: {
  checked: CheckboxState;
  disabled: boolean;
  variant: CheckboxVariant;
}): unknown {
  const runtime = runtimeOf();
  const iconOpacity = classNames(
    "opacity-75",
    !disabled && "group-hover:opacity-100 group-focus-visible:opacity-100",
  );
  if (variant === "checklist") {
    return runtime.jsx("span", {
      "aria-hidden": true,
      "data-checkbox-indicator": variant,
      className: "absolute inset-0 grid place-items-center",
      children: [
        runtime.jsx("span", {
          "data-checkbox-outline": true,
          className: iconOpacity,
        }),
        runtime.jsx("span", {
          "data-checkbox-mark": checked === "indeterminate" ? "minus" : "check",
        }),
      ],
    });
  }
  if (variant === "secondary") {
    return runtime.jsx("span", {
      "aria-hidden": true,
      "data-checkbox-indicator": variant,
      className: classNames(
        "flex h-full w-full items-center justify-center text-current",
        iconOpacity,
      ),
      children: runtime.jsx("span", {
        "data-checkbox-mark":
          checked === "indeterminate"
            ? "minus-circle"
            : checked
              ? "check-circle"
              : "circle",
      }),
    });
  }
  return runtime.jsx("span", {
    "aria-hidden": true,
    "data-checkbox-indicator": variant,
    className: "flex h-full w-full items-center justify-center text-current",
    children:
      checked === false
        ? null
        : runtime.jsx("span", {
            "data-checkbox-mark": checked === "indeterminate" ? "minus" : "check",
            className:
              checked === "indeterminate"
                ? "icon-2xs flex-shrink-0"
                : "icon-xxs flex-shrink-0",
          }),
  });
}

/** 原 `Nmt` / 压缩导出 `Ad`。 */
export function Checkbox({
  checked,
  className,
  defaultChecked = false,
  disabled = false,
  onCheckedChange,
  onClick,
  variant = "default",
  ...buttonProps
}: CheckboxProps): unknown {
  const [uncontrolledChecked, setUncontrolledChecked] =
    reactOf().useState<CheckboxState>(defaultChecked);
  const currentChecked = checked ?? uncontrolledChecked;
  const state = stateName(currentChecked);
  const isCompactVariant = variant === "secondary" || variant === "checklist";
  return runtimeOf().jsx("button", {
    type: "button",
    role: "checkbox",
    "aria-checked": currentChecked === "indeterminate" ? "mixed" : currentChecked,
    "data-state": state,
    className: classNames(
      "group peer shrink-0 outline-none",
      variant === "checklist"
        ? "transition-[background-color,border-color,box-shadow]"
        : undefined,
      CHECKBOX_VARIANT_CLASSES[variant],
      !isCompactVariant &&
        "border border-strong shadow-sm data-[state=checked]:text-default data-[state=indeterminate]:text-default",
      "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
      "aria-invalid:ring-2 aria-invalid:ring-text-danger/20 aria-invalid:border-text-danger",
      "disabled:cursor-not-allowed",
      !disabled && !isCompactVariant && "hover:bg-surface-tertiary",
      className,
    ),
    checked: currentChecked,
    disabled,
    ...buttonProps,
    onClick(event: CheckboxClickEvent) {
      onClick?.(event);
      if (event.defaultPrevented || disabled) return;
      const nextChecked = currentChecked === "indeterminate" || !currentChecked;
      if (checked === undefined) setUncontrolledChecked(nextChecked);
      onCheckedChange?.(nextChecked);
    },
    children: runtimeOf().jsx(CheckboxIndicator, {
      checked: currentChecked,
      disabled,
      variant,
    }),
  });
}

/** 原 `Imt` / 压缩导出 `jd`。 */
export function initializeCheckbox(): void {}
