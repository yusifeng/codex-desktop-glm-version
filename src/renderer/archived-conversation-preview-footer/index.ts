import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, Yh as Button, e6 as getReactRuntime, type JsxRuntime, type ReactRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/chat-tab-metadata-bridge";

export interface ArchivedConversationPreviewFooterProps {
  conversationId: string;
  kind: "chatgpt" | "cloud" | "local";
  onDone?(): void;
  onError?(error: unknown): void;
  onRecover?(input: { conversationId: string; kind: "chatgpt" | "cloud" | "local" }): Promise<void> | void;
  restored?: boolean;
  restoring?: boolean;
}
let runtime: JsxRuntime | undefined;
let React: ReactRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function react(): ReactRuntime { React ??= getReactRuntime(); return React; }

function ArchivedConversationPreviewFooter(props: ArchivedConversationPreviewFooterProps): unknown {
  const view = jsx();
  const [pending, setPending] = react().useState(props.restoring === true);
  const recover = async () => {
    if (pending || props.restored) return;
    setPending(true);
    try { await props.onRecover?.({ conversationId: props.conversationId, kind: props.kind }); }
    catch (error) { props.onError?.(error); }
    finally { setPending(false); }
  };
  return view.jsxs("footer", { className: "archived-conversation-preview-footer", children: [
    view.jsx("p", { children: props.restored ? "Chat restored" : "This is an archived chat preview" }),
    props.restored
      ? view.jsx(Button, { type: "button", onClick: props.onDone, children: "Done" })
      : view.jsx(Button, { type: "button", disabled: pending, loading: pending, onClick: recover, children: pending ? "Restoring…" : "Restore chat" }),
  ] });
}
function initializeArchivedConversationPreviewFooter(): void { jsx(); }
export { initializeArchivedConversationPreviewFooter as n, ArchivedConversationPreviewFooter as t };
