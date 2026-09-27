import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/thread-user-message-navigation-rail-app";
const jsx = getJsxRuntime();
interface NavigationItem { id: string; label?: string; bookmarked?: boolean; [key: string]: unknown }
function BookmarkedThreadUserMessageNavigation({ bookmarkKey, enabled = true, getItems, onBookmarkChange, onPreviewItem, onRevealItem }: { bookmarkKey?: string; enabled?: boolean; getItems(): NavigationItem[]; onBookmarkChange?(item: NavigationItem): void; onPreviewItem?(item: NavigationItem): void; onRevealItem?(item: NavigationItem): void }): unknown { if (!enabled) return null; const items = getItems().filter(item => item.bookmarked !== false); return jsx.jsx("nav", { "aria-label": "Bookmarked messages", "data-bookmark-key": bookmarkKey, children: items.map(item => jsx.jsxs("button", { type: "button", onMouseEnter: () => onPreviewItem?.(item), onClick: () => onRevealItem?.(item), onDoubleClick: () => onBookmarkChange?.(item), children: [item.label ?? item.id] }, item.id)) }); }
function initializeBookmarkedNavigation(): void { getReactRuntime(); }
export { initializeBookmarkedNavigation as n, BookmarkedThreadUserMessageNavigation as t };
