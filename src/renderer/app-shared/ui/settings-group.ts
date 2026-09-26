import { classNames } from "./class-names";

export type SettingsGroupOverflow = "hidden" | "visible";
export type SettingsGroupVariant =
  "default" | "metered" | "secondary" | "form" | "recommendation";
export type SettingsGroupDecoration = "daybreak";

export interface SettingsGroupProps {
  children?: unknown;
  className?: string;
  contentOverflow?: SettingsGroupOverflow;
  dividers?: boolean;
  variant?: SettingsGroupVariant;
  decoration?: SettingsGroupDecoration;
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

/** 原 `hyt` / 压缩导出 `$c`。 */
export const settingsDividerClassName =
  "flex flex-col [&>*:not(:last-child)]:relative [&>*:not(:last-child)]:after:pointer-events-none [&>*:not(:last-child)]:after:absolute [&>*:not(:last-child)]:after:inset-x-4 [&>*:not(:last-child)]:after:bottom-0 [&>*:not(:last-child)]:after:h-[0.5px] [&>*:not(:last-child)]:after:bg-border [&>*:not(:last-child)]:after:content-['']";

const daybreakDecorationClassName = "_daybreak_1ajk7_1";

/** 原 `byt` / 压缩导出 `Zc`。 */
export function SettingsGroup({
  children,
  className,
  contentOverflow = "hidden",
  dividers = true,
  variant = "default",
  decoration,
}: SettingsGroupProps): unknown {
  const rootClassName = classNames(
    dividers ? settingsDividerClassName : "flex flex-col",
    variant === "recommendation" ? "rounded-[20px]" : "rounded-2xl",
    decoration === "daybreak" && daybreakDecorationClassName,
    contentOverflow === "visible" ? "overflow-visible" : "overflow-hidden",
    variant === "default" &&
      "border border-default group-data-[density=compact]/settings:border-0 group-data-[density=compact]/settings:py-1 group-data-[density=compact]/settings:ring-1 group-data-[density=compact]/settings:ring-inset group-data-[density=compact]/settings:ring-border",
    variant === "metered" && "ring-1 ring-inset ring-border-subtle",
    variant === "secondary" && "bg-surface-secondary/92",
    variant === "form" &&
      "border border-subtle bg-surface dark:bg-surface-secondary/92",
    variant === "recommendation" &&
      "border border-default bg-surface-secondary dark:bg-transparent",
    className,
  );
  const style =
    variant === "default" || variant === "metered"
      ? {
          backgroundColor:
            "var(--color-background-panel, var(--color-background-primary-soft-alpha))",
        }
      : undefined;
  return runtimeOf().jsx("div", {
    className: rootClassName,
    style,
    children,
  });
}

/** 原 `gyt` / 压缩导出 `el`。 */
export function initializeSettingsDividers(): void {}

/** 原 `Cyt` / 压缩导出 `Qc`。 */
export function initializeSettingsGroup(): void {}
