import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

const {
  I3: getJsxRuntime,
  e6: getReactRuntime,
  h4: initializeClassNames,
  m4: classNames,
} = appSharedChunk;
let React: ReactRuntime;
let jsx: JsxRuntime;
const sizeClasses = {
  small: "-ms-1 size-5",
  medium: "-ms-1.5 size-6",
} as const;

function ConnectorLogoStack({
  ariaLabel,
  children,
  size = "small",
  surface = "default",
}: {
  ariaLabel?: string;
  children?: unknown;
  size?: keyof typeof sizeClasses;
  surface?: "default" | "white";
}): unknown {
  initializeConnectorLogoStack();
  const items = React.Children.toArray(children);
  if (items.length === 0) return null;
  const logos = React.Children.map(items, (child: unknown) =>
    jsx.jsx("span", {
      className: classNames(
        "flex items-center justify-center overflow-hidden rounded-md ring-1 ring-inset first:ms-0",
        surface === "white"
          ? "bg-brand-logo-background text-brand-logo-foreground ring-brand-logo-foreground/10"
          : "bg-surface text-default ring-border",
        sizeClasses[size],
      ),
      children: child,
    }),
  );
  return jsx.jsx("span", {
    "aria-hidden": ariaLabel == null || undefined,
    "aria-label": ariaLabel,
    className: "flex shrink-0 items-center",
    role: ariaLabel == null ? undefined : "img",
    children: logos,
  });
}

let initialized = false;
function initializeConnectorLogoStack(): void {
  if (initialized) return;
  initializeClassNames();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}
initializeConnectorLogoStack();
export { initializeConnectorLogoStack as n, ConnectorLogoStack as t };
