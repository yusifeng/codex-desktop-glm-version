import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, Yh as Button, e6 as getReactRuntime, type JsxRuntime, type ReactRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/announcement-modal-source-bridge";
import "@rchunk/file-blank-icon";

export interface TemporaryChatToggleProps { conversationId?: string | null; isIndicator?: boolean; isTemporaryChat: boolean; onToggle?(temporary: boolean): void; }
export interface TemporaryChatOnboardingProps { children?(eligible: boolean): unknown; isEligible?: boolean; isLoading?: boolean; isTemporaryChat: boolean; onAcknowledge?(): Promise<void> | void }
let runtime: JsxRuntime | undefined;
let React: ReactRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function react(): ReactRuntime { React ??= getReactRuntime(); return React; }

function TurnOffTemporaryChatButton({ onToggle }: Pick<TemporaryChatToggleProps, "onToggle"> = {}): unknown {
  return jsx().jsx(Button, { "aria-label": "Temporary chat", color: "ghost", size: "toolbar", type: "button", onClick: () => onToggle?.(false), children: "Temporary chat" });
}

function TemporaryChatToggle({ isIndicator = false, isTemporaryChat, onToggle }: TemporaryChatToggleProps): unknown {
  if (isTemporaryChat && isIndicator) return jsx().jsx("span", { className: "temporary-chat-indicator", title: "This won't appear in your chat history", children: "Temporary chat" });
  return jsx().jsx(Button, {
    "aria-label": isTemporaryChat ? "Turn off temporary chat" : "Start temporary chat",
    color: isTemporaryChat ? "ghostActive" : "ghost",
    "aria-pressed": isTemporaryChat,
    type: "button",
    onClick: () => onToggle?.(!isTemporaryChat),
    children: isTemporaryChat ? "Temporary" : "Temporary chat",
  });
}

function TemporaryChatOnboarding({ children, isEligible = false, isLoading = false, isTemporaryChat, onAcknowledge }: TemporaryChatOnboardingProps): unknown {
  const [dismissed, setDismissed] = react().useState(false);
  const eligible = isTemporaryChat && isEligible && !dismissed;
  const modal = isLoading || !eligible ? null : jsx().jsxs("section", { role: "dialog", "aria-label": "Temporary Chat", children: [
    jsx().jsx("h2", { children: "Temporary Chat" }),
    jsx().jsx("p", { children: "Temporary chats won't appear in your history, and ChatGPT won't use or update its memory while in a temporary chat." }),
    jsx().jsx(Button, { type: "button", onClick: async () => { await onAcknowledge?.(); setDismissed(true); }, children: "Got it" }),
  ] });
  return jsx().jsxs(jsx().Fragment, { children: [modal, children?.(eligible)] });
}
function initializeTemporaryChatUi(): void { jsx(); react(); }
export { initializeTemporaryChatUi as i, TemporaryChatOnboarding as n, TemporaryChatToggle as r, TurnOffTemporaryChatButton as t };
