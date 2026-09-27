import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, Yh as Button, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import { i as sourcesTitle, n as skillAttributionMessages, r as sourceCategoryMessages, t as memoryAttributionMessages } from "@rchunk/chatgpt-sources-message";
import "@rchunk/chatgpt-personalization-route";
import "@rchunk/memory-manager-gate";
import "@rchunk/chatgpt-saved-memory-state";
import "@rchunk/chatgpt-saved-memory-source-delete-dialog";
import "@rchunk/chatgpt-about-you-summary-panel";
import "@rchunk/chatgpt-skill-source-dialog";
import "@rchunk/chatgpt-saved-memories-panel";

export type ChatGptSourceKind = "app" | "file" | "link" | "memory" | "skill" | "web";
export interface ChatGptSource { attribution?: string | null; conversationContextType?: "general_memory" | "past_conversation" | "user_instructions" | "user_memory" | null; href?: string | null; key: string; kind: ChatGptSourceKind; label: string; memoryId?: string | null; snippet?: string | null; url?: string | null; }
export interface ChatGptSourcesSidePanelTabProps { conversationId?: string | null; inputCount?: number; isLoading?: boolean; onDeleteMemory?(source: ChatGptSource): Promise<void> | void; onOpenSource?(source: ChatGptSource): void; presentation?: "side-panel" | "summary"; shouldBlockExternalEgress?: boolean; sourceAccountId?: string | null; sources: readonly ChatGptSource[] }
export interface ChatGptSummarySourcesCountProps { inputCount?: number; sourceAccountId?: string | null; sources: readonly ChatGptSource[] }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }

function pastConversationId(source: ChatGptSource): string | null {
  if (source.kind !== "memory" || source.conversationContextType !== "past_conversation" || source.url == null) return null;
  try { const match = /(?:^|\/)c\/([^/?#]+)/u.exec(new URL(source.url, "https://chatgpt.com").pathname); return match?.[1] == null ? null : decodeURIComponent(match[1]); }
  catch { return null; }
}
function dedupeSources(sources: readonly ChatGptSource[]): ChatGptSource[] {
  const unique = new Map<string, ChatGptSource>();
  for (const source of sources) {
    let key = source.key;
    if (source.kind === "memory") {
      if (source.conversationContextType === "general_memory") key = `general_memory:${source.label.trim().toLowerCase()}:${source.attribution?.trim().toLowerCase() ?? ""}`;
      else if (source.conversationContextType === "user_memory" && source.memoryId != null) key = `user_memory:${source.memoryId}`;
      else if (source.conversationContextType === "past_conversation") key = `past_conversation:${pastConversationId(source) ?? source.key}`;
    }
    if (!unique.has(key)) unique.set(key, source);
  }
  return [...unique.values()];
}
function categoryFor(source: ChatGptSource): keyof typeof sourceCategoryMessages {
  if (source.kind === "app") return "apps";
  if (source.kind === "file") return "files";
  if (source.kind === "memory") return "memory";
  if (source.kind === "skill") return "skills";
  if (source.kind === "web") return "web";
  return "links";
}
function attributionFor(source: ChatGptSource): string | null {
  if (source.kind === "skill") return skillAttributionMessages.skill.defaultMessage;
  if (source.kind !== "memory") return source.attribution ?? null;
  if (source.conversationContextType === "user_instructions") return memoryAttributionMessages.userInstructions.defaultMessage;
  if (source.conversationContextType === "user_memory") return memoryAttributionMessages.userMemory.defaultMessage;
  if (source.conversationContextType === "general_memory") return memoryAttributionMessages.generalMemory.defaultMessage;
  return source.attribution ?? null;
}
function ChatGptSummarySourcesCount({ inputCount = 0, sources }: ChatGptSummarySourcesCountProps): unknown {
  const unique = dedupeSources(sources);
  const count = inputCount + unique.filter((source) => source.kind !== "memory").length + Number(unique.some((source) => source.kind === "memory"));
  return jsx().jsx("span", { className: "chatgpt-summary-sources-count", children: count });
}
function ChatGptSourcesSidePanelTab(props: ChatGptSourcesSidePanelTabProps): unknown {
  const view = jsx();
  if (props.isLoading) return view.jsx("div", { role: "status", children: "Loading sources…" });
  const unique = dedupeSources(props.sources);
  const groups = new Map<string, ChatGptSource[]>();
  for (const source of unique) { const category = categoryFor(source); const group = groups.get(category) ?? []; group.push(source); groups.set(category, group); }
  return view.jsxs("section", { className: "chatgpt-sources-side-panel-tab", "aria-label": sourcesTitle.defaultMessage, "data-presentation": props.presentation ?? "side-panel", children: [
    view.jsx("h2", { children: sourcesTitle.defaultMessage }),
    unique.length === 0 ? view.jsx("p", { children: "No sources" }) : [...groups].map(([category, sources]) => view.jsxs("section", { "aria-label": sourceCategoryMessages[category as keyof typeof sourceCategoryMessages].defaultMessage, children: [
      view.jsx("h3", { children: sourceCategoryMessages[category as keyof typeof sourceCategoryMessages].defaultMessage }),
      view.jsx("ul", { children: sources.map((source) => view.jsx("li", { children: view.jsxs("article", { children: [
        view.jsx("button", { type: "button", disabled: props.shouldBlockExternalEgress, onClick: () => props.onOpenSource?.(source), children: source.label }),
        attributionFor(source) == null ? null : view.jsx("small", { children: attributionFor(source) }),
        source.snippet == null ? null : view.jsx("p", { children: source.snippet }),
        source.kind === "memory" && source.memoryId != null && props.onDeleteMemory != null ? view.jsx(Button, { type: "button", color: "ghost", onClick: () => props.onDeleteMemory?.(source), children: "Delete memory" }) : null,
      ] }) }, source.key)) }),
    ] }, category)),
  ] });
}
export { ChatGptSourcesSidePanelTab, ChatGptSummarySourcesCount };
