import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/computer-history-suggestions";
import "@rchunk/toolbar-breadcrumb";
import "@rchunk/document-title";
import "@rchunk/use-search-plugins";
import "@rchunk/plugin-skill-queries";
import "@rchunk/hosted-plugin-creation-actions";
import "@rchunk/skills-page-grid";
import "@rchunk/card-tile";
import "@rchunk/connector-logo-stack";
import { t as PluginRequestEmptyState } from "@rchunk/plugin-request-empty-state";
import "@rchunk/plugins-page-section";
import "@rchunk/profile-lock";
import "@rchunk/plugin-disabled-reason";
import "@rchunk/share-menu-item";
import "@rchunk/category-plugins-query";
import "@rchunk/hosted-plugin-create-dialog";

export interface StorePlugin { categoryIds?: string[]; description?: string; directory?: "openai" | "personal" | "workspace"; id: string; installed?: boolean; name: string; [key: string]: unknown }
export interface PluginsStorePageProps { category?: string | null; categoryHeadingPlacement?: "page" | "results"; directory?: "openai" | "personal" | "workspace"; hostId?: string; onInstall?(plugin: StorePlugin): void; onOpenPlugin?(plugin: StorePlugin): void; plugins?: StorePlugin[]; query?: string; scopeSearchToCategory?: boolean; selectedPlugin?: StorePlugin | null }
export interface PluginsStoreShellProps { children?: unknown; initialTab?: "plugins" | "skills"; onBrowseTabSelect?(tab: "plugins" | "skills"): void }
let jsx: JsxRuntime;

function PluginsStoreShell(props: PluginsStoreShellProps = {}): unknown {
  const runtime = ensureJsx();
  const tab = props.initialTab ?? "plugins";
  return runtime.jsxs("div", { className: "plugins-store-shell", "data-current-tab": tab, children: [runtime.jsxs("header", { children: [runtime.jsx("button", { type: "button", "aria-pressed": tab === "plugins", onClick: () => props.onBrowseTabSelect?.("plugins"), children: "Plugins" }), runtime.jsx("button", { type: "button", "aria-pressed": tab === "skills", onClick: () => props.onBrowseTabSelect?.("skills"), children: "Skills" })] }), props.children] });
}

function PluginsStorePage(props: PluginsStorePageProps = {}): unknown {
  const runtime = ensureJsx();
  if (props.selectedPlugin != null) return pluginDetail(props.selectedPlugin, props);
  const query = (props.query ?? "").trim().toLowerCase();
  const directory = props.directory ?? "openai";
  const visible = (props.plugins ?? []).filter((plugin) => {
    if ((plugin.directory ?? "openai") !== directory) return false;
    if (props.category && !(plugin.categoryIds ?? []).includes(props.category)) return false;
    return query.length === 0 || `${plugin.name} ${plugin.description ?? ""}`.toLowerCase().includes(query);
  });
  const heading = props.category ?? (query ? `Results for ${props.query?.trim()}` : directory === "openai" ? "Plugin store" : directory === "workspace" ? "Workspace plugins" : "Personal plugins");
  return runtime.jsxs("main", { "data-directory": directory, "data-host-id": props.hostId ?? "local", children: [runtime.jsx("h1", { children: heading }), visible.length === 0 ? runtime.jsx(PluginRequestEmptyState, {}) : runtime.jsx("div", { role: "list", children: visible.map((plugin) => runtime.jsxs("article", { role: "listitem", "data-plugin-id": plugin.id, children: [runtime.jsx("button", { type: "button", onClick: () => props.onOpenPlugin?.(plugin), children: plugin.name }), runtime.jsx("p", { children: plugin.description }), runtime.jsx("button", { type: "button", disabled: plugin.installed, onClick: () => props.onInstall?.(plugin), children: plugin.installed ? "Installed" : "Install" })] }, plugin.id)) })] });
}

function pluginDetail(plugin: StorePlugin, props: PluginsStorePageProps): unknown { const runtime = ensureJsx(); return runtime.jsxs("article", { className: "store-plugin-detail", "data-plugin-id": plugin.id, children: [runtime.jsx("h1", { children: plugin.name }), runtime.jsx("p", { children: plugin.description }), runtime.jsx("button", { type: "button", disabled: plugin.installed, onClick: () => props.onInstall?.(plugin), children: plugin.installed ? "Installed" : "Install" })] }); }
const initializeStoreShell = (): void => { jsx = getJsxRuntime(); };
const initializeStorePage = (): void => { jsx = getJsxRuntime(); };
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }

export { initializeStoreShell as i, initializeStorePage as n, PluginsStoreShell as r, PluginsStorePage as t };
