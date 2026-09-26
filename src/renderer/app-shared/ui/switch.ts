import { classNames } from "./class-names";

export type SwitchSize = "default" | "sm";
export type SwitchTone = "accent" | "neutral";

export interface SwitchProps extends Record<string, unknown> {
  checked: boolean;
  onChange(checked: boolean): void;
  disabled?: boolean;
  className?: string;
  id?: string;
  ariaLabel?: string;
  size?: SwitchSize;
  tone?: SwitchTone;
  trackClassName?: string;
  thumbClassName?: string;
  onClick?: (event: SwitchEvent) => void;
}

export interface SwitchEvent {
  defaultPrevented?: boolean;
  preventDefault?(): void;
  stopPropagation?(): void;
}

interface JsxRuntimeLike {
  jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
}

function runtimeOf(): JsxRuntimeLike {
  return (
    (globalThis as { __RENDERER_JSX_RUNTIME__?: JsxRuntimeLike })
      .__RENDERER_JSX_RUNTIME__ ??
    (require("react/jsx-runtime") as JsxRuntimeLike)
  );
}

const TRACK_SIZE: Record<SwitchSize, string> = {
  default: "h-5 w-8",
  sm: "h-4 w-7",
};

const THUMB_SIZE: Record<SwitchSize, string> = {
  default:
    "h-4 w-4 data-[state=unchecked]:translate-x-[2px] data-[state=checked]:translate-x-[14px] rtl:data-[state=unchecked]:-translate-x-[2px] rtl:data-[state=checked]:-translate-x-[14px]",
  sm: "h-3 w-3 data-[state=unchecked]:translate-x-[2px] data-[state=checked]:translate-x-[14px] rtl:data-[state=unchecked]:-translate-x-[2px] rtl:data-[state=checked]:-translate-x-[14px]",
};

export interface SwitchTrackProps {
  checked: boolean;
  size?: SwitchSize;
  tone?: SwitchTone;
  trackClassName?: string;
  thumbClassName?: string;
}

export function SwitchTrack({
  checked,
  size = "default",
  tone = "accent",
  trackClassName,
  thumbClassName,
}: SwitchTrackProps): unknown {
  const state = checked ? "checked" : "unchecked";
  return runtimeOf().jsx("span", {
    "aria-hidden": true,
    "data-state": state,
    className: classNames(
      "relative inline-flex shrink-0 items-center rounded-full transition-colors duration-basic ease-out",
      checked && (tone === "neutral" ? "bg-text" : "bg-chart-blue"),
      !checked && "bg-text/10",
      TRACK_SIZE[size],
      trackClassName,
    ),
    children: runtimeOf().jsx("span", {
      "data-state": state,
      className: classNames(
        "rounded-full border shadow-sm transition-transform duration-basic ease-out data-[state=unchecked]:translate-x-0",
        tone === "neutral" && checked
          ? "border-transparent bg-surface"
          : "border-control-thumb-on-accent bg-control-thumb-on-accent",
        THUMB_SIZE[size],
        thumbClassName,
      ),
    }),
  });
}

/** 原 `Kdt` / 压缩导出 `Lf`。 */
export function Switch({
  checked,
  onChange,
  disabled = false,
  className,
  id,
  ariaLabel,
  size = "default",
  tone = "accent",
  trackClassName,
  thumbClassName,
  onClick,
  ...buttonProps
}: SwitchProps): unknown {
  const state = checked ? "checked" : "unchecked";
  return runtimeOf().jsx("button", {
    type: "button",
    role: "switch",
    "aria-checked": checked,
    "aria-label": ariaLabel,
    id,
    className: classNames(
      "inline-flex items-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-full",
      disabled ? "cursor-not-allowed opacity-60" : "cursor-interaction",
      className,
    ),
    "data-state": state,
    ...buttonProps,
    onClick(event: SwitchEvent) {
      onClick?.(event);
      if (!event.defaultPrevented && !disabled) onChange(!checked);
    },
    disabled,
    children: runtimeOf().jsx(SwitchTrack, {
      checked,
      size,
      tone,
      trackClassName,
      thumbClassName,
    }),
  });
}

/** 原 `Zdt` / 压缩导出 `Rf`。 */
export function initializeSwitch(): void {}
