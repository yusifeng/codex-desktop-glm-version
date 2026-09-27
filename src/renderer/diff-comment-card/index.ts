import {
  $3 as reactCompilerRuntime,
  I3 as getJsxRuntime,
  h4 as initializeStyleRuntime,
  m4 as classNames,
} from "@rchunk/app-shared";

void reactCompilerRuntime;

export interface DiffCommentBodyProps {
  action?: unknown;
  children?: unknown;
  footer?: unknown;
}

export interface DiffCommentCardProps {
  authorAvatar?: unknown;
  authorLabel?: unknown;
  body?: unknown;
  className?: string;
  footer?: unknown;
  headerAccessory?: unknown;
  headerLayout?: "truncate" | "wrap";
  headerSuffix?: unknown;
  onHeaderClick?: () => void;
  onPointerDownCapture?: (event: unknown) => void;
  surfaceVariant?: "default" | "inline" | string;
}

function DiffCommentBody({ action, children, footer }: DiffCommentBodyProps): unknown {
  const { jsx, jsxs } = getJsxRuntime();
  const actionNode =
    action ??
    jsx("span", {
      "aria-hidden": "true",
      className: "size-token-button-composer-sm shrink-0",
    });
  return jsxs("div", {
    className: "px-3 pt-1 pb-2 text-sm leading-5",
    children: [
      jsxs("div", {
        className: "flex min-w-0 items-start gap-2",
        children: [
          jsx("div", {
            className:
              "min-h-token-button-composer-sm min-w-0 flex-1 break-words whitespace-pre-wrap",
            children,
          }),
          actionNode,
        ],
      }),
      footer,
    ],
  });
}

function DiffCommentCard({
  authorAvatar,
  authorLabel,
  body,
  className,
  footer,
  headerAccessory,
  headerLayout = "wrap",
  headerSuffix,
  onHeaderClick,
  onPointerDownCapture,
  surfaceVariant = "default",
}: DiffCommentCardProps): unknown {
  const { jsx, jsxs } = getJsxRuntime();
  const hasBody = body != null;
  const rootClassName = classNames(
    "group/comment overflow-hidden rounded-lg",
    surfaceVariant !== "inline" && "border border-default",
    surfaceVariant === "default" && "bg-primary-soft-alpha",
    className,
  );
  const headerClassName = classNames(
    "flex items-center justify-between gap-3 px-3 pt-2.5 select-none",
    headerLayout === "wrap" && "flex-wrap",
    hasBody || headerSuffix != null ? "pb-0.5" : "pb-2.5",
    onHeaderClick != null && "cursor-interaction",
  );
  const authorClassName = classNames(
    "flex min-h-6 min-w-0 items-center gap-2.5",
    headerLayout === "truncate" && "flex-1",
  );
  return jsxs("div", {
    className: rootClassName,
    onPointerDownCapture,
    children: [
      jsxs("div", {
        className: headerClassName,
        role: "presentation",
        onClick: onHeaderClick,
        children: [
          jsxs("div", {
            className: authorClassName,
            children: [
              authorAvatar,
              jsx("div", {
                className: "flex min-w-0 items-center gap-1.5",
                children: jsx("span", {
                  className:
                    "flex min-w-0 items-center truncate text-xs leading-4 text-codex-description",
                  children: authorLabel,
                }),
              }),
            ],
          }),
          headerAccessory,
        ],
      }),
      headerSuffix,
      hasBody ? body : null,
      footer == null
        ? null
        : jsx("div", {
            className: classNames(
              "_footer_1mwwy_1",
              "flex items-center justify-end px-3 pt-2 pb-3 text-sm leading-5 text-codex-description",
            ),
            children: footer,
          }),
    ],
  });
}

function initializeDiffCommentCard(): void {
  initializeStyleRuntime();
  getJsxRuntime();
}

export { DiffCommentBody as n, initializeDiffCommentCard as r, DiffCommentCard as t };
