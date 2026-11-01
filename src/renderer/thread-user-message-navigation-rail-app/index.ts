import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/plan-implementation-request";
import "@rchunk/commit-icon";
import "@rchunk/pull-request";
import "@rchunk/thread-scroll-controller-context-value";

export interface NavigationItem { bookmarked?: boolean; isBookmarked?: boolean; id: string; preview?: unknown; title?: string; [key: string]: unknown }
export interface AppThreadUserMessageNavigationRailProps { items: NavigationItem[]; onBookmarkChange?(item: NavigationItem, bookmarked: boolean): void; onPreviewItem?(item: NavigationItem): void; onRevealItem?(item: NavigationItem): void }
let jsx: JsxRuntime;
function AppThreadUserMessageNavigationRail(props: AppThreadUserMessageNavigationRailProps): unknown { if (props.items.length < 4) return null; const runtime = ensureJsx(); return runtime.jsx("nav", { "aria-label": "Messages", className: "thread-user-message-navigation-rail", children: props.items.map((item, index) => { const bookmarked = item.isBookmarked ?? item.bookmarked ?? false; return runtime.jsxs("button", { type: "button", "data-thread-user-message-navigation-item-id": item.id, onClick: () => props.onRevealItem?.(item), onMouseEnter: () => props.onPreviewItem?.(item), children: [runtime.jsx("span", { children: item.title ?? `Message ${index + 1}` }), runtime.jsx("span", { role: "checkbox", "aria-checked": bookmarked, onClick: (event: { stopPropagation(): void }) => { event.stopPropagation(); props.onBookmarkChange?.(item, !bookmarked); }, children: bookmarked ? "Bookmarked" : "Bookmark" })] }, item.id); }) }); }
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
export { AppThreadUserMessageNavigationRail };
