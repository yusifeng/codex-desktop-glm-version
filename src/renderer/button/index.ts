// Learning-block action buttons. Release chunk: button-6de526bfdc3d.js.
import "@rchunk/rolldown-runtime";
import * as AppShared from "@rchunk/app-shared";

interface ActionButtonProps extends Record<string, unknown> {
  className?: string;
  onClick?: () => void;
}

interface ActionButtonGroupProps extends Record<string, unknown> {
  children?: unknown;
  className?: string;
  columns?: number;
}

const sharedRuntime = AppShared as unknown as {
  I3(): AppShared.JsxRuntime;
  h4(): void;
  m4(...values: AppShared.ClassValue[]): string;
};

let jsxRuntime: AppShared.JsxRuntime;

function ActionButton({ className, onClick, ...buttonProps }: ActionButtonProps): unknown {
  const deferredClick = onClick
    ? () => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(onClick);
        });
      }
    : undefined;

  return jsxRuntime.jsx("button", {
    ...buttonProps,
    type: "button",
    className: sharedRuntime.m4(
      "interactive-button interactive-button-secondary interactive-outline-secondary flex min-h-9 w-full min-w-0 cursor-pointer items-center justify-center rounded-full px-3 py-1.5 text-center text-sm leading-5 font-medium whitespace-normal select-none transition-colors disabled:cursor-not-allowed",
      className,
    ),
    onClick: deferredClick,
  });
}

function ActionButtonGroup({ children, className, columns = 1, ...groupProps }: ActionButtonGroupProps): unknown {
  return jsxRuntime.jsx("div", {
    ...groupProps,
    className: sharedRuntime.m4(
      "grid gap-2",
      columns === 2
        ? "grid-cols-2 [&>*:last-child:nth-child(odd)]:col-span-2"
        : "grid-cols-1",
      className,
    ),
    children,
  });
}

function initializeLearningBlockButtons(): void {
  sharedRuntime.h4();
  jsxRuntime = sharedRuntime.I3();
}

export { ActionButtonGroup as n, initializeLearningBlockButtons as r, ActionButton as t };
