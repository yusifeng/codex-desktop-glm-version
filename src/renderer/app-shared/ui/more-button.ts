import { Button, type ButtonProps, type ButtonSize } from "./button";

export interface MoreButtonClickEvent {
  stopPropagation(): void;
}

export interface MoreButtonProps extends Omit<
  ButtonProps,
  "children" | "color" | "onClick" | "size" | "uniform"
> {
  label: string;
  onClick?: (event: MoreButtonClickEvent) => void;
  size?: ButtonSize;
  iconClassName?: string;
  uniform?: boolean;
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

function EllipsisIcon(props: Record<string, unknown>): unknown {
  const runtime = runtimeOf();
  return runtime.jsxs("svg", {
    width: 21,
    height: 21,
    viewBox: "0 0 21 21",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ...props,
    children: [
      runtime.jsx("path", {
        d: "M15.6981 9.04712C16.5255 9.04712 17.1959 9.71781 17.1961 10.5452C17.1961 11.3727 16.5256 12.0442 15.6981 12.0442C14.8706 12.0442 14.2 11.3727 14.2 10.5452C14.2002 9.71781 14.8707 9.04712 15.6981 9.04712Z",
        fill: "currentColor",
      }),
      runtime.jsx("path", {
        d: "M4.69806 9.04712C5.52546 9.04712 6.19691 9.71781 6.19708 10.5452C6.19708 11.3727 5.52557 12.0442 4.69806 12.0442C3.8707 12.044 3.20001 11.3726 3.20001 10.5452C3.20019 9.71792 3.87081 9.04729 4.69806 9.04712Z",
        fill: "currentColor",
      }),
      runtime.jsx("path", {
        d: "M10.2003 9.04712C11.0276 9.0473 11.6982 9.71792 11.6984 10.5452C11.6984 11.3726 11.0277 12.044 10.2003 12.0442C9.37284 12.0442 8.70132 11.3727 8.70132 10.5452C8.7015 9.71781 9.37295 9.04712 10.2003 9.04712Z",
        fill: "currentColor",
      }),
    ],
  });
}

/** 原 `q_t` / 压缩导出 `gu`。 */
export function MoreButton({
  label,
  onClick,
  size = "toolbar",
  iconClassName = "icon-xs",
  uniform = true,
  ...buttonProps
}: MoreButtonProps): unknown {
  const handleClick = (event: MoreButtonClickEvent): void => {
    event.stopPropagation();
    onClick?.(event);
  };
  return runtimeOf().jsx(Button, {
    color: "ghost",
    size,
    uniform,
    "aria-label": label,
    ...buttonProps,
    onClick: handleClick,
    children: runtimeOf().jsx(EllipsisIcon, { className: iconClassName }),
  });
}

/** 原 `X_t` / 压缩导出 `_u`。 */
export function initializeMoreButton(): void {}
