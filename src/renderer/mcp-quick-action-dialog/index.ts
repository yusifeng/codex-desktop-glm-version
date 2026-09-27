import {
  I3 as getJsxRuntime,
  Ih as Dialog,
  LX as useScope,
  Rh as DialogTitle,
  Yh as Button,
  ZI as appScope,
  Zh as initializeButton,
  c_ as initializeTooltip,
  e6 as getReactRuntime,
  o_ as Tooltip,
  tU as createId,
  zh as initializeDialog,
} from "@rchunk/app-shared";
import {
  Gdt as initializeMcpAppAnalytics,
  LR as McpActionIcon,
  Mk as recordMcpAppOpened,
  RR as initializeMcpActionIcon,
  Wdt as getMcpActionIcon,
  kk as initializeMcpAppIds,
} from "@rchunk/app-initial";
import {
  n as initializeViewFrame,
  t as ViewFrame,
} from "@rchunk/view-frame";

export interface McpQuickAction {
  target: { arguments: unknown };
  title: string;
  [key: string]: unknown;
}

export interface McpQuickActionDialogProps {
  action: McpQuickAction;
  onOpen(): Promise<{ toolResult: unknown } | null | undefined>;
  pending: boolean;
  quickActionView: unknown;
  tooltipText?: string;
  trigger?: unknown;
  view: {
    tool: { _meta?: Record<string, unknown> };
    [key: string]: unknown;
  };
}

interface OpenedMcpApp {
  mcpAppId: string;
  toolResult: unknown;
}

function McpQuickActionDialog({
  action,
  pending,
  quickActionView,
  onOpen,
  view,
  trigger,
  tooltipText,
}: McpQuickActionDialogProps): unknown {
  const scope = useScope(appScope);
  const React = getReactRuntime();
  const [openedApp, setOpenedApp] = React.useState<OpenedMcpApp | null>(null);
  const [contentContainer, setContentContainer] =
    React.useState<unknown>(null);
  const jsx = getJsxRuntime();

  const setOpen = (open: boolean) => {
    if (!open) {
      setOpenedApp(null);
      return;
    }
    if (pending) return;
    recordMcpAppOpened(scope, { view: quickActionView });
    const mcpAppId = createId();
    setOpenedApp({ mcpAppId, toolResult: null });
    void onOpen().then((result) => {
      setOpenedApp((current) =>
        current?.mcpAppId === mcpAppId
          ? result == null
            ? null
            : { mcpAppId, toolResult: result.toolResult }
          : current,
      );
    });
  };

  const triggerContent =
    trigger ??
    jsx.jsx(Button, {
      "aria-label": action.title,
      color: "ghost",
      disabled: pending && openedApp == null,
      size: "compact",
      uniform: true,
      children: jsx.jsx(McpActionIcon, {
        icon: getMcpActionIcon(action),
        monochrome: view.tool._meta?.["openai/iconStyle"] === "monochrome",
      }),
    });
  const framedView =
    openedApp == null
      ? null
      : jsx.jsx(ViewFrame, {
          autoFocus: contentContainer != null,
          contentContainer,
          fullSurface: false,
          inDialog: true,
          lifetime: "component",
          mcpAppId: openedApp.mcpAppId,
          onRequestClose: () => setOpen(false),
          toolResult: openedApp.toolResult,
          toolArguments: action.target.arguments,
          useHostThread: true,
          view: quickActionView,
        });

  return jsx.jsxs(jsx.Fragment, {
    children: [
      jsx.jsxs(Dialog, {
        open: openedApp != null,
        onOpenChange: setOpen,
        size: "compact",
        dialogCloseClassName: "z-10",
        contentProps: { "aria-describedby": undefined },
        triggerContent: jsx.jsx(Tooltip, {
          tooltipContent: tooltipText ?? action.title,
          cloneCustomTrigger: true,
          delayOpen: true,
          children: triggerContent,
        }),
        children: [
          jsx.jsx(DialogTitle, {
            className: "sr-only",
            children: action.title,
          }),
          jsx.jsx("div", {
            ref: setContentContainer,
            "data-mcp-app-portal-target": "true",
            className:
              "relative max-h-[calc(100dvh/var(--codex-window-zoom)-6rem)] min-h-0 overflow-y-auto",
          }),
        ],
      }),
      jsx.jsx("div", {
        className: "pointer-events-none invisible fixed w-96",
        inert: true,
        children: framedView,
      }),
    ],
  });
}

function initializeMcpQuickActionDialog(): void {
  initializeButton();
  initializeDialog();
  initializeTooltip();
  initializeMcpAppAnalytics();
  initializeMcpActionIcon();
  initializeViewFrame();
  initializeMcpAppIds();
}

export { initializeMcpQuickActionDialog as n, McpQuickActionDialog as t };
