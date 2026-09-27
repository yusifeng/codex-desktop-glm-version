import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, Yh as Button, e6 as getReactRuntime, type JsxRuntime, type ReactRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";

export interface CloudBrowserScreenshot { browser_conversation_id?: string | null; hostname?: string | null; image_asset_pointer: { asset_pointer: string }; src?: string | null; tool_summary?: string | null }
export interface CloudBrowserPreviewProps { conversationId: string; liveView?: unknown; onOpen?(): void; onSelect?(index: number): void; screenshots: readonly CloudBrowserScreenshot[]; variant?: "compact" | "expanded" }
let runtime: JsxRuntime | undefined;
let React: ReactRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function react(): ReactRuntime { React ??= getReactRuntime(); return React; }

function CloudBrowserPreview({ conversationId, liveView, onOpen, onSelect, screenshots, variant = "compact" }: CloudBrowserPreviewProps): unknown {
  const [selectedIndex, setSelectedIndex] = react().useState(Math.max(0, screenshots.length - 1));
  const [live, setLive] = react().useState(true);
  if (screenshots.length === 0) return liveView ?? null;
  const screenshot = screenshots[Math.min(selectedIndex, screenshots.length - 1)];
  const select = (index: number) => { const nextLive = index >= screenshots.length; setLive(nextLive); if (!nextLive) setSelectedIndex(index); onSelect?.(index); };
  return jsx().jsxs("section", { className: `cloud-browser-preview cloud-browser-preview--${variant}`, "data-conversation-id": conversationId, children: [
    variant === "expanded" ? jsx().jsx(Button, { "aria-pressed": live, color: live ? "mediaSolid" : "mediaSubtle", size: "compact", type: "button", onClick: () => select(screenshots.length), children: "LIVE" }) : null,
    live && liveView != null ? liveView : jsx().jsxs("figure", { children: [
      screenshot?.src == null ? jsx().jsx("div", { role: "status", children: "Loading preview…" }) : jsx().jsx("img", { alt: screenshot.tool_summary ?? "Browser preview", src: screenshot.src }),
      screenshot?.hostname == null ? null : jsx().jsx("figcaption", { children: screenshot.hostname }),
    ] }),
    screenshots.length <= 1 ? null : jsx().jsx("input", { "aria-label": "Browser activity timeline", type: "range", min: 0, max: screenshots.length - (variant === "compact" ? 1 : 0), value: live && variant === "expanded" ? screenshots.length : selectedIndex, onChange: (event: { currentTarget: { valueAsNumber: number } }) => select(event.currentTarget.valueAsNumber) }),
    onOpen == null ? null : jsx().jsx(Button, { type: "button", onClick: onOpen, children: "Open browser" }),
  ] });
}
function initializeCloudBrowserPreview(): void { jsx(); react(); }
export { initializeCloudBrowserPreview as n, CloudBrowserPreview as t };
