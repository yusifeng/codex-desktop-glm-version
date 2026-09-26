// toolbar-breadcrumb —— 工具栏中的可访问面包屑导航。
// 原版：app/webview/assets/toolbar-breadcrumb-3bb5b6f3d25b.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
let React: any;
let jsx: any;

function ToolbarBreadcrumb({ ancestors, current, textSm }: any) {
  const intl = appShared.n4();
  const ariaLabel = intl.formatMessage({
    id: "toolbarBreadcrumb.label",
    defaultMessage: "Breadcrumb",
    description: "Accessible label for toolbar breadcrumb navigation",
  });
  const textClassName = textSm ? "text-sm" : "text-base";
  const className = appShared.m4(
    "flex min-w-0 items-center gap-1 text-codex-description",
    textClassName,
  );
  const ancestorNodes = ancestors.map((ancestor: any, index: number) =>
    jsx.jsxs(
      React.Fragment,
      {
        children: [
          index > 0
            ? jsx.jsx(appShared.S_, {
                className: "shrink-0",
                asset: appShared.Yd,
              })
            : null,
          "content" in ancestor
            ? ancestor.content
            : jsx.jsx(appShared.Yh, {
                className: appShared.m4("min-w-0", textSm && "text-sm"),
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
              ? jsx.jsx(appShared.S_, {
                  className: "shrink-0",
                  asset: appShared.Yd,
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
  appShared.$3();
  appShared.Xd();
  appShared.h4();
  React = appShared.e6();
  appShared.K2();
  appShared.C_();
  appShared.Zh();
  jsx = appShared.I3();
}

export { initializeToolbarBreadcrumb as n, ToolbarBreadcrumb as t };
