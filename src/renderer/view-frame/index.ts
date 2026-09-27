import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";

interface ViewFrameProps {
  className?: string;
  deepLink?: string;
  lifetime?: "app" | "component";
  mcpAppId?: string;
  onClose?(): void;
  sessionId?: string;
  view?: { id?: string; title?: string; url?: string; [key: string]: unknown };
}
const jsx = getJsxRuntime();

function ViewFrame({ className, deepLink, lifetime = "app", mcpAppId, onClose, sessionId, view }: ViewFrameProps): unknown {
  const source = view?.url ?? deepLink;
  if (source == null) return jsx.jsx("div", { role: "alert", children: "This app view is unavailable." });
  return jsx.jsxs("section", { className: `relative h-full min-h-0 ${className ?? ""}`.trim(), "data-lifetime": lifetime, "data-mcp-app-id": mcpAppId, "data-session-id": sessionId, children: [jsx.jsxs("header", { children: [jsx.jsx("h1", { children: view?.title ?? "App" }), onClose ? jsx.jsx("button", { type: "button", onClick: onClose, children: "Close" }) : null] }), jsx.jsx("iframe", { src: source, title: view?.title ?? "MCP app" })] });
}

function initializeViewFrame(): void {}
export { initializeViewFrame as n, ViewFrame as t };
