// toolbar-breadcrumb —— 工具栏中的可访问面包屑导航。
// 原版：app/webview/assets/toolbar-breadcrumb-3bb5b6f3d25b.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

void runtimeChunk;
const {
  $3: initializeRuntimeLazy,
  C_: initializeIconAsset,
  I3: getJsxRuntime,
  K2: initializeSharedComponents,
  S_: IconAsset,
  Xd: initializeChevronAsset,
  Yd: chevronAsset,
  Yh: Button,
  Zh: initializeButton,
  e6: getReactRuntime,
  h4: initializeClassNames,
  m4: classNames,
  n4: useIntl,
} = appSharedChunk;

type BreadcrumbAncestor =
  | { content: unknown; id: string }
  | { id: string; label: unknown; onClick(): void };

interface ToolbarBreadcrumbProps {
  ancestors: BreadcrumbAncestor[];
  current?: unknown;
  textSm?: boolean;
}

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function ToolbarBreadcrumb({
  ancestors,
  current,
  textSm,
}: ToolbarBreadcrumbProps): unknown {
  const intl = useIntl();
  const ariaLabel = intl.formatMessage({
    id: "toolbarBreadcrumb.label",
    defaultMessage: "Breadcrumb",
    description: "Accessible label for toolbar breadcrumb navigation",
  });
  const textClassName = textSm ? "text-sm" : "text-base";
  const className = classNames(
    "flex min-w-0 items-center gap-1 text-codex-description",
    textClassName,
  );
  const ancestorNodes = ancestors.map((ancestor, index) =>
    jsx.jsxs(
      React.Fragment,
      {
        children: [
          index > 0
            ? jsx.jsx(IconAsset, {
                className: "shrink-0",
                asset: chevronAsset,
              })
            : null,
          "content" in ancestor
            ? ancestor.content
            : jsx.jsx(Button, {
                className: classNames("min-w-0", textSm && "text-sm"),
                color: "ghost",
                size: "toolbar",
                onClick: ancestor.onClick,
                children: jsx.jsx("span", {
                  className: "min-w-0 truncate",
                  children: ancestor.label,
                }),
              }),
        ],
      },
      ancestor.id,
    ),
  );
  const currentNode =
    current == null
      ? null
      : jsx.jsxs(React.Fragment, {
          children: [
            ancestors.length > 0
              ? jsx.jsx(IconAsset, {
                  className: "shrink-0",
                  asset: chevronAsset,
                })
              : null,
            jsx.jsx("span", {
              "aria-current": "page",
              className:
                "flex h-token-button-composer min-w-0 flex-auto items-center truncate px-2 text-default",
              children: current,
            }),
          ],
        });

  return jsx.jsxs("nav", {
    "aria-label": ariaLabel,
    className,
    children: [ancestorNodes, currentNode],
  });
}

function initializeToolbarBreadcrumb(): void {
  initializeRuntimeLazy();
  initializeChevronAsset();
  initializeClassNames();
  React = getReactRuntime();
  initializeSharedComponents();
  initializeIconAsset();
  initializeButton();
  jsx = getJsxRuntime();
}

export { initializeToolbarBreadcrumb as n, ToolbarBreadcrumb as t };
