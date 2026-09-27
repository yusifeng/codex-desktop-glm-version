import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, m4 as cn } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import { Bl as Avatar } from "@rchunk/app-primary";

const jsxRuntime = getJsxRuntime();
export interface SubagentPanelItem { avatarSeed: string; id: string; label: string; preview?: string | null; previewLineCount?: 1 | 2; trailing?: unknown }
export interface SubagentPanelSection { className?: string; emptyState?: unknown; id: string; items: SubagentPanelItem[]; title: string; titleTrailing?: unknown; visibleItemLimit?: number }
export interface SubagentPanelProps { onSelect(id: string): void; sections: SubagentPanelSection[] }
export interface SubagentPanelHeaderProps { backAriaLabel: string; label: string; onBack(): void; seed: string; trailing?: unknown }

function SubagentPanel({ sections, onSelect }: SubagentPanelProps): unknown {
  return jsxRuntime.jsx("div", { className: "h-full min-h-0 overflow-y-auto px-3 py-5", children: jsxRuntime.jsx("div", { className: "mx-auto w-full max-w-[var(--thread-content-max-width)]", children: sections.map(section => jsxRuntime.jsx(SubagentSection, { section, onSelect }, section.id)) }) });
}
function SubagentPanelHeader({ backAriaLabel, label, seed, trailing, onBack }: SubagentPanelHeaderProps): unknown {
  return jsxRuntime.jsxs("div", { className: "flex h-12 shrink-0 items-center gap-2 border-b border-strong px-4", children: [jsxRuntime.jsx("button", { type: "button", "aria-label": backAriaLabel, onClick: onBack, children: "←" }), jsxRuntime.jsx(Avatar, { seed, className: "size-6", "aria-hidden": true }), jsxRuntime.jsx("span", { className: "min-w-0 flex-1 truncate text-sm font-medium", children: label }), trailing == null ? null : jsxRuntime.jsx("span", { className: "max-w-1/2 min-w-0 truncate text-xs text-tertiary select-none", children: trailing })] });
}
function SubagentSection({ section, onSelect }: { onSelect(id: string): void; section: SubagentPanelSection }): unknown {
  if (section.items.length === 0 && section.emptyState == null) return null;
  const items = section.items.length === 0 ? jsxRuntime.jsx("div", { className: "px-2 py-1 text-sm text-tertiary", children: section.emptyState }) : jsxRuntime.jsx("div", { className: "flex flex-col gap-1", children: section.items.slice(0, section.visibleItemLimit ?? section.items.length).map(item => jsxRuntime.jsx(SubagentItem, { item, onSelect }, item.id)) });
  return jsxRuntime.jsxs("section", { className: section.className, children: [jsxRuntime.jsxs("h2", { className: "mb-2 flex min-w-0 items-center justify-between gap-3 px-2 text-sm text-tertiary", children: [jsxRuntime.jsx("span", { className: "min-w-0 truncate", children: section.title }), section.titleTrailing] }), items] });
}
function SubagentItem({ item, onSelect }: { item: SubagentPanelItem; onSelect(id: string): void }): unknown {
  return jsxRuntime.jsxs("button", { type: "button", className: cn("flex min-h-10 w-full cursor-interaction gap-3 rounded-lg px-2 py-2 text-start select-none", item.preview == null ? "items-center" : "items-start"), onClick: () => onSelect(item.id), children: [jsxRuntime.jsx(Avatar, { seed: item.avatarSeed, className: "size-6", "aria-hidden": true }), jsxRuntime.jsxs("span", { className: "min-w-0 flex-1", children: [jsxRuntime.jsxs("span", { className: "flex min-h-6 items-center gap-2 text-sm", children: [jsxRuntime.jsx("span", { className: "min-w-0 flex-1 truncate text-default", children: item.label }), item.trailing == null ? null : jsxRuntime.jsx("span", { className: "shrink-0 text-xs whitespace-nowrap text-tertiary tabular-nums", children: item.trailing })] }), item.preview == null ? null : jsxRuntime.jsx("span", { className: cn("block text-sm leading-5 text-secondary", item.previewLineCount === 2 ? "!line-clamp-2" : "truncate"), children: item.preview })] })] });
}
function initializeSubagentPanel(): void {}
export { SubagentPanel as n, initializeSubagentPanel as r, SubagentPanelHeader as t };
