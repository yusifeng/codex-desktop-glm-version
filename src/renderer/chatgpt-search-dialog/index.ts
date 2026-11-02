import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/app-shared";
import "@rchunk/library-file-display-title";
import "@rchunk/library-file-preview-kind";
import "@rchunk/open-image-preview";
import "@rchunk/file-preview";
import "@rchunk/security-tabs";
import "@rchunk/command-menu-search-results";
import { I3 as getJsxRuntime, e6 as ReactRuntime, type JsxRuntime } from "@rchunk/app-shared";
type SearchFilter = "all" | "chats" | "documents" | "images" | "projects";
interface SearchResult { id: string; kind: "chat" | "document" | "image" | "project"; state?: "failed" | "processing" | "ready"; subtitle?: string; title: string; url?: string }
interface ChatGptSearchDialogProps { close(): void; error?: string | null; inputRef?: { current?: unknown }; isLoading?: boolean; loadMore?(): void; onOpen?(result: SearchResult, options: { newTab: boolean }): void; onRetry?(): void; recentResults?: SearchResult[]; results?: SearchResult[]; search: string; searchEventLogger?: Record<string, unknown>; searchFilter: SearchFilter; setSearch(value: string, filter?: SearchFilter): void }
const resultKindByFilter: Record<Exclude<SearchFilter, "all">, SearchResult["kind"]> = {
  chats: "chat",
  documents: "document",
  images: "image",
  projects: "project",
};
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function ChatGptSearchDialog({ close, error, isLoading = false, loadMore, onOpen, onRetry, recentResults = [], results = [], search, searchFilter, setSearch }: ChatGptSearchDialogProps): unknown {
  const [query, setQuery] = ReactRuntime.useState(search), [filter, setFilter] = ReactRuntime.useState(searchFilter), [selectedIndex, setSelectedIndex] = ReactRuntime.useState(0); const visible = () => (query.trim().length === 0 && filter === "all" ? recentResults : results).filter(result => filter === "all" || result.kind === resultKindByFilter[filter]).filter(result => result.title.toLowerCase().includes(query.trim().toLowerCase())); const open = (result: SearchResult, newTab = false) => { if (result.state !== undefined && result.state !== "ready") return; onOpen?.(result, { newTab }); if (!newTab) close(); };
  return jsx().jsxs("dialog", { open: true, children: [jsx().jsxs("header", { children: [jsx().jsx("h2", { children: "Global search" }), jsx().jsx("button", { type: "button", "aria-label": "Close global search", onClick: close, children: "Close" })] }), jsx().jsx("p", { children: "Search your chats, projects, images, and documents" }), jsx().jsx("input", { role: "searchbox", value: query, placeholder: "Search…", onChange: (event: { currentTarget: { value: string } }) => { const next = event.currentTarget.value; setQuery(next); setSelectedIndex(0); setSearch(next, filter); }, onKeyDown: (event: { key: string; preventDefault(): void }) => { const items = visible(); if (event.key === "ArrowDown") { event.preventDefault(); setSelectedIndex(items.length === 0 ? 0 : (selectedIndex + 1) % items.length); } else if (event.key === "ArrowUp") { event.preventDefault(); setSelectedIndex(items.length === 0 ? 0 : (selectedIndex - 1 + items.length) % items.length); } else if (event.key === "Enter" && items[selectedIndex] != null) { event.preventDefault(); open(items[selectedIndex]); } else if (event.key === "Escape") close(); } }), jsx().jsx("fieldset", { children: [jsx().jsx("legend", { children: "Search result types" }), ...(["all", "chats", "images", "documents", "projects"] as const).map(value => jsx().jsx("label", { children: [jsx().jsx("input", { type: "radio", name: "search-filter", checked: filter === value, onChange: () => { setFilter(value); setSelectedIndex(0); setSearch(query, value); } }), value[0].toUpperCase() + value.slice(1)] }, value))] }), error != null ? jsx().jsxs("div", { role: "alert", children: ["Unable to load search results", jsx().jsx("button", { type: "button", onClick: onRetry, children: "Retry" })] }) : isLoading ? jsx().jsx("p", { role: "status", children: "Loading search results…" }) : visible().length === 0 ? jsx().jsx("p", { children: "No results" }) : jsx().jsx("ul", { children: visible().map((result, index) => jsx().jsx("li", { children: jsx().jsxs("button", { type: "button", "data-selected": index === selectedIndex, onClick: (event: { altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }) => open(result, Boolean(event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)), children: [jsx().jsx("strong", { children: result.title }), result.subtitle == null ? null : jsx().jsx("span", { children: result.subtitle }), result.state === "failed" ? jsx().jsx("span", { role: "alert", children: "This file could not be processed" }) : result.state === "processing" ? jsx().jsx("span", { role: "status", children: "This file is still processing" }) : null] }) }, result.id)) }), loadMore == null ? null : jsx().jsx("button", { type: "button", onClick: loadMore, children: "Load more" })] });
}
export { ChatGptSearchDialog, type ChatGptSearchDialogProps };
