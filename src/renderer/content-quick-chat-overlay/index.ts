// content-quick-chat-overlay —— 主窗口内容区域上的 Quick Chat 浮层。

import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/quick-chat-drop-zones";
import "@rchunk/quick-chat-frame";
import "@rchunk/quick-chat-obstacles";
import "@rchunk/right-panel-composer-overlay-alignment";
import "@rchunk/rolldown-runtime";
import type { JsxRuntime } from "@rchunk/app-shared";

const { I3: jsxRuntimeExport } = appSharedChunk as unknown as {
  I3: JsxRuntime | (() => JsxRuntime);
};

export interface ContentQuickChatOverlayProps {
  children?: unknown;
  composerOnly?: boolean;
  hasElicitation?: boolean;
  onStop?(): void;
  renderTranscript?: (() => unknown) | null;
  statusState?: "idle" | "working" | "failed" | string;
  title?: string;
  titleContent?: unknown;
  workingStatus?: string;
}

const compactPresentationState = {
  defaultValue: "compact" as const,
  key: "quick-chat-presentation",
};

let jsx: JsxRuntime;

function statusLabel(props: ContentQuickChatOverlayProps): string | null {
  if (props.statusState === "failed") return "Chat stopped with an error";
  if (props.statusState === "working") return props.workingStatus ?? "Working…";
  return null;
}

function ContentQuickChatOverlay({
  children,
  composerOnly = false,
  hasElicitation = false,
  onStop,
  renderTranscript,
  statusState = "idle",
  title = "Quick Chat",
  titleContent,
  workingStatus,
}: ContentQuickChatOverlayProps): unknown {
  initializeContentQuickChatOverlay();
  const label = statusLabel({ statusState, workingStatus });
  const transcript = composerOnly ? null : renderTranscript?.();
  return jsx.jsxs("section", {
    "aria-label": title,
    "data-composer-overlay-floating-ui": true,
    "data-has-elicitation": hasElicitation,
    "data-status": statusState,
    className: "content-quick-chat-overlay",
    role: "dialog",
    children: [
      jsx.jsxs("header", {
        className: "content-quick-chat-overlay__header",
        children: [
          jsx.jsx("h2", { children: titleContent ?? title }),
          statusState === "working"
            ? jsx.jsx("button", {
                "aria-label": "Stop response",
                onClick: onStop,
                type: "button",
                children: "Stop",
              })
            : null,
        ],
      }),
      label == null
        ? null
        : jsx.jsx("p", {
            "aria-live": "polite",
            className: "content-quick-chat-overlay__status",
            children: label,
          }),
      transcript == null
        ? null
        : jsx.jsx("div", {
            className: "content-quick-chat-overlay__transcript",
            children: transcript,
          }),
      jsx.jsx("div", {
        className: "content-quick-chat-overlay__composer",
        children,
      }),
    ],
  });
}

function initializeCompactPresentationState(): void {}
function initializeContentQuickChatOverlay(): void {
  if (jsx != null) return;
  jsx =
    typeof jsxRuntimeExport === "function"
      ? jsxRuntimeExport()
      : jsxRuntimeExport;
}

initializeContentQuickChatOverlay();

export {
  initializeCompactPresentationState as i,
  initializeContentQuickChatOverlay as n,
  compactPresentationState as r,
  ContentQuickChatOverlay as t,
};
