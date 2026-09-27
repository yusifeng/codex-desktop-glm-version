import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/book-open";
import "@rchunk/memory-manager-gate";
import "@rchunk/chatgpt-about-you-summary-panel";
import "@rchunk/chatgpt-saved-memories-panel";
export interface ResolvedApp { installUrl?: string | null; logoUrl?: string | null; logoUrlDark?: string | null; name?: string }
export interface ToolIconContentProps { resolvedApps: readonly ResolvedApp[]; shouldBlockExternalEgress?: boolean; toolIcons?: readonly string[] | null }
export interface MemoryWriteItem { isUpdating?: boolean; writes: readonly string[] }
export interface MemoryWriteContentProps { isParagen?: boolean; item: MemoryWriteItem; onManage?(): void }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function resolveToolIcon(icon: string, apps: readonly ResolvedApp[]): { kind: "built-in" | "remote"; source: string } | null { const builtIn = new Set(["api_tool", "approved", "book-open", "brush-stroke", "code", "run-command", "code-searching", "denied", "edit-files", "globe", "library", "/images/ecosystem/apps/library/icon.png", "list-files", "stop", "thoughts"]); if (builtIn.has(icon)) return { kind: "built-in", source: icon }; const app = apps.find(candidate => candidate.logoUrl === icon || candidate.logoUrlDark === icon); if (app) return { kind: "remote", source: icon }; if (icon.startsWith("data:") || icon.startsWith("https://") || icon.startsWith("connectors://")) return { kind: "remote", source: icon }; if (icon.startsWith("/") && !icon.startsWith("//")) { const installUrl = apps.find(candidate => candidate.installUrl?.trim())?.installUrl?.trim(); if (installUrl) try { const url = new URL(icon, installUrl); if (["http:", "https:"].includes(url.protocol)) return { kind: "remote", source: url.toString() }; } catch {} } return null; }
function ToolIconContent({ resolvedApps, shouldBlockExternalEgress, toolIcons }: ToolIconContentProps): unknown { const icons = (toolIcons ?? []).flatMap((icon, index) => { const resolved = resolveToolIcon(icon.trim(), resolvedApps); if (!resolved) return []; return [jsx().jsx("span", { "data-icon-kind": resolved.kind, "data-load-remote": resolved.kind !== "remote" || !shouldBlockExternalEgress, children: resolved.source }, `${resolved.source}-${index}`)]; }).slice(0, 2); return icons.length ? jsx().jsx("span", { "data-tool-icons": true, children: icons }) : null; }
function MemoryWriteContent({ item, onManage }: MemoryWriteContentProps): unknown { if (item.isUpdating) return jsx().jsx("div", { role: "status", children: "Updating memory" }); const writes = item.writes.map((write, index) => jsx().jsx("li", { children: write.trim().replace(/^(?:The user|User)(?:'s)? /, "") }, `${index}`)); return jsx().jsxs("section", { "data-memory-write-content": true, children: [jsx().jsx("button", { disabled: !onManage, onClick: onManage, type: "button", children: item.writes.length === 1 ? "Memory updated" : "Memories updated" }), jsx().jsx("ul", { children: writes })] }); }
function initializeToolIconContent(): void { void jsx(); }
function initializeContent(): void { void jsx(); }
export { initializeToolIconContent as i, initializeContent as n, ToolIconContent as r, MemoryWriteContent as t };
