import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/use-app-connect-flow";
import "@rchunk/open-in-google-drive-menu-item";

interface OpenInButtonProps { analyticsClickSource?: string; artifactRef?: string; hostId?: string; kind?: string; onDownload?(): void; onOpen?(): void; threadId?: string; title?: string; variant?: "menu" | "title" }
const jsx = getJsxRuntime();
function OpenInButton({ artifactRef, hostId, kind, onDownload, onOpen, threadId, title, variant = "menu" }: OpenInButtonProps): unknown {
  if (hostId == null) return null;
  return jsx.jsxs("div", { "data-artifact-ref": artifactRef, "data-thread-id": threadId, "data-variant": variant, children: [jsx.jsx("button", { type: "button", onClick: onOpen, children: title ? `Open ${title}` : `Open in ${kind ?? "app"}` }), jsx.jsx("button", { type: "button", onClick: onDownload, children: variant === "title" ? "Download" : "Download a copy" })] });
}
function initializeOpenInButton(): void {}
export { initializeOpenInButton as n, OpenInButton as t };
