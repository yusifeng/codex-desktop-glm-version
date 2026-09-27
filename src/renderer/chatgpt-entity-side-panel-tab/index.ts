import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, m4 as joinClassNames, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";

export interface EntityPanelParameters { memorySource?: string | null; sourceId?: string | null; [key: string]: unknown }
export interface ChatGptEntitySidePanelTabProps { conversationId: string; params: EntityPanelParameters; renderEntity?(input: { conversationId: string; flushTop: boolean; params: EntityPanelParameters }): unknown }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function ChatGptEntitySidePanelTab({ conversationId, params, renderEntity }: ChatGptEntitySidePanelTabProps): unknown {
  const flushTop = params.memorySource != null;
  const content = renderEntity?.({ conversationId, flushTop, params }) ?? null;
  return jsx().jsx("section", { className: "chatgpt-entity-side-panel-tab", children: jsx().jsx("div", {
    className: flushTop ? "min-h-0 flex-1 overflow-y-auto p-panel" : "h-full flex-1 overflow-y-auto",
    children: jsx().jsx("div", { className: joinClassNames("relative flex min-h-full flex-col", !flushTop && "px-6 pb-8"), children: content }),
  }) });
}
export { ChatGptEntitySidePanelTab };
