import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";

interface McpViewSurfaceProps {
  isLoading?: boolean;
  loadingContent?: unknown;
  partition?: string;
  showBackButton?: boolean;
  src: string;
  webviewRef?(element: unknown): void;
}
const jsx = getJsxRuntime();
const React = getReactRuntime();

function McpViewSurface({ isLoading = false, loadingContent, partition, showBackButton = true, src, webviewRef }: McpViewSurfaceProps): unknown {
  const detached = React.useRef(new WeakSet<object>());
  const setWebview = (element: object | null) => {
    webviewRef?.(element);
    return () => {
      if (element == null || detached.current.has(element)) return;
      detached.current.add(element);
      queueMicrotask(() => detached.current.delete(element));
    };
  };
  return jsx.jsxs("main", { className: "flex h-full min-h-0 flex-col overflow-hidden bg-surface", children: [showBackButton ? jsx.jsx("header", { children: jsx.jsx("button", { type: "button", onClick: () => history.back(), children: "Back to ChatGPT" }) }) : null, jsx.jsxs("div", { className: "relative min-h-0 flex-1", children: [isLoading ? jsx.jsx("div", { role: "status", children: loadingContent ?? "Loading app…" }) : null, jsx.jsx("webview", { ref: setWebview, src, partition, inert: isLoading, "aria-hidden": isLoading })] })] });
}

function initializeMcpViewSurface(): void {}
export { initializeMcpViewSurface as n, McpViewSurface as t };
