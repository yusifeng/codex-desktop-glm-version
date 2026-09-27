import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/app-connect-modal";
import "@rchunk/use-app-connect-flow";
import "@rchunk/form-runtime";
import "@rchunk/first-app-connect-ambient-suggestions";
import "@rchunk/hosted-plugin-creation-actions";
import "@rchunk/skills-page-grid";
import "@rchunk/card-tile";
import "@rchunk/plugin-setup";
import "@rchunk/connector-logo-stack";
import "@rchunk/plugins-page-section";
import "@rchunk/profile-lock";
import "@rchunk/plugin-disabled-reason";
import "@rchunk/share-menu-item";

export type CreatorKind = "plugin" | "skill";
export interface PluginSummary { id: string; installed?: boolean; name: string; description?: string; marketplaceName?: string; [key: string]: unknown }
export interface PluginRecord { plugin: PluginSummary; logoDarkPath?: string; logoPath?: string; [key: string]: unknown }
export interface PluginDirectoryConfig { categoryIds: string[]; collapsedCategoryIds: string[]; sections: Array<{ id: string; pluginIds: string[] }> }
export interface PluginGridProps { errorMessage?: string | null; isLoading?: boolean; onInstallPlugin?(plugin: PluginRecord): void; onOpenPluginDetails?(plugin: PluginRecord): void; plugins: PluginRecord[]; unavailablePluginIds?: Set<string> }
export interface PluginRequestEmptyStateProps { onRequestPlugin?(): void }

let jsx: JsxRuntime;
const creatorOpenedStorageKey = "has-opened-skill-creator-prefill-v1";
const creatorOpenedState = { key: creatorOpenedStorageKey, defaultValue: false };
const selectedMarketplaceState = { key: "selected-plugin-marketplace", defaultValue: null as string | null };
const initialBrowseTabState = { key: "initial-plugin-browse-tab", defaultValue: "plugins" };
const initialHostState = { key: "initial-plugin-host", defaultValue: "local" };
const compactEmptyState = { key: "compact-plugin-empty-state", defaultValue: false };

function creatorPrompt({ creatorPath, includeStarterPrompt, kind }: { creatorPath: string; includeStarterPrompt: boolean; kind: CreatorKind }): string {
  const metadata = kind === "plugin"
    ? { skillName: "plugin-creator", starterPrompt: "help me create a plugin" }
    : { skillName: "skill-creator", starterPrompt: "help me create a skill" };
  const mention = `[$${metadata.skillName}](${creatorPath})`;
  return includeStarterPrompt ? `${mention} ${metadata.starterPrompt}` : `${mention} `;
}

function normalizeDirectoryConfig(value: unknown): PluginDirectoryConfig {
  const record = isRecord(value) ? value : {};
  const sections = Array.isArray(record.sections) ? record.sections : [];
  return {
    categoryIds: stringArray(record.category_ids),
    collapsedCategoryIds: stringArray(record.collapsed_category_ids),
    sections: sections.flatMap((section) => {
      if (!isRecord(section) || typeof section.id !== "string") return [];
      return [{ id: section.id, pluginIds: stringArray(section.plugin_ids) }];
    }),
  };
}

function pluginAction(plugin: PluginRecord, installedStateAction: "menu" | "status" | "toggle" = "status", canToggle = false): "install" | "menu" | "status" | "toggle" {
  if (!plugin.plugin.installed) return "install";
  if (installedStateAction === "toggle" && canToggle) return "toggle";
  if (installedStateAction === "menu" && canToggle) return "menu";
  return "status";
}

function PluginLoadingAction({ phase = "loading", progressPercent }: { phase?: "installing" | "loading"; progressPercent?: number }): unknown {
  return ensureJsx().jsx("button", { "aria-busy": true, disabled: true, children: progressPercent == null ? (phase === "installing" ? "Installing" : "Loading") : `${phase === "installing" ? "Installing" : "Loading"} ${progressPercent}%` });
}

function PluginActionsMenu(props: { children?: unknown; isUninstalling?: boolean; onManage?(): void; onShare?(): void; onTryInChat?(): void; onUninstall?(): void }): unknown {
  const runtime = ensureJsx();
  if (props.isUninstalling) return runtime.jsx(PluginLoadingAction, { phase: "loading" });
  return runtime.jsxs("div", { role: "menu", children: [props.children, actionButton("Manage", props.onManage), actionButton("Try in chat", props.onTryInChat), actionButton("Share", props.onShare), actionButton("Uninstall", props.onUninstall)] });
}

function PluginGrid(props: PluginGridProps): unknown {
  const runtime = ensureJsx();
  if (props.isLoading) return runtime.jsx("div", { "aria-busy": true, children: "Loading plugins…" });
  if (props.errorMessage) return runtime.jsx("div", { role: "alert", children: props.errorMessage });
  if (props.plugins.length === 0) return runtime.jsx(PluginRequestEmptyState, {});
  return runtime.jsx("div", { role: "list", className: "plugin-grid", children: props.plugins.map((plugin) => runtime.jsxs("article", { "data-plugin-id": plugin.plugin.id, role: "listitem", children: [runtime.jsx("button", { type: "button", onClick: () => props.onOpenPluginDetails?.(plugin), children: plugin.plugin.name }), runtime.jsx("p", { children: plugin.plugin.description }), runtime.jsx("button", { type: "button", disabled: props.unavailablePluginIds?.has(plugin.plugin.id), onClick: () => props.onInstallPlugin?.(plugin), children: plugin.plugin.installed ? "Installed" : "Install" })] }, plugin.plugin.id)) });
}

function InstalledPluginsSection(props: { id?: string; onManage?(): void; onOpenPluginDetails?(plugin: PluginRecord): void; plugins: PluginRecord[] }): unknown {
  const runtime = ensureJsx();
  return runtime.jsxs("section", { id: props.id ?? "plugins-connected", children: [runtime.jsxs("header", { children: [runtime.jsx("h2", { children: "Installed" }), actionButton("Manage", props.onManage)] }), runtime.jsx(PluginGrid, { plugins: props.plugins, onOpenPluginDetails: props.onOpenPluginDetails })] });
}

function PluginCatalog(props: PluginGridProps & { contentAfterConnected?: unknown }): unknown {
  return ensureJsx().jsxs("div", { className: "plugin-catalog", children: [ensureJsx().jsx(PluginGrid, props), props.contentAfterConnected] });
}

function PluginRequestDialog(props: { initialSuggestion?: string; onClose?(): void; onSubmit?(suggestion: string): void }): unknown {
  const runtime = ensureJsx();
  const suggestion = (props.initialSuggestion ?? "").trim().slice(0, 2000);
  return runtime.jsxs("form", { onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); if (suggestion) props.onSubmit?.(suggestion); }, children: [runtime.jsx("h2", { children: "Request a plugin" }), runtime.jsx("textarea", { defaultValue: suggestion, maxLength: 2000 }), runtime.jsx("button", { type: "button", onClick: props.onClose, children: "Cancel" }), runtime.jsx("button", { type: "submit", disabled: suggestion.length === 0, children: "Submit" })] });
}

function PluginRequestEmptyState({ onRequestPlugin }: PluginRequestEmptyStateProps): unknown {
  const runtime = ensureJsx();
  return runtime.jsxs("div", { className: "plugin-request-empty-state", children: [runtime.jsx("div", { children: "No plugins found" }), runtime.jsx("button", { type: "button", onClick: onRequestPlugin, children: "Request a plugin" })] });
}

function BrowserExtensionInstallBanner(props: { banner?: { browserFamily: string; displayName: string; installUrl: string } | null; onDismiss?(): void; onInstall?(): void }): unknown {
  if (props.banner == null) return null;
  const runtime = ensureJsx();
  return runtime.jsxs("aside", { children: [runtime.jsx("strong", { children: "Use ChatGPT while you browse" }), runtime.jsx("span", { children: `Install the ${props.banner.displayName} extension to bring ChatGPT into your browser.` }), runtime.jsx("a", { href: props.banner.installUrl, onClick: props.onInstall, children: "Install" }), runtime.jsx("button", { type: "button", "aria-label": "Dismiss browser extension installation banner", onClick: props.onDismiss, children: "Dismiss" })] });
}

function PluginDirectoryBoundary(props: { children?: unknown; hostId: string; mode?: string; source?: string }): unknown { return ensureJsx().jsx("div", { "data-host-id": props.hostId, "data-mode": props.mode, "data-source": props.source, children: props.children }); }
function ImportedPlugins(props: { plugins?: PluginRecord[]; onOpenPluginDetails?(plugin: PluginRecord): void }): unknown { const plugins = props.plugins ?? []; return plugins.length === 0 ? null : ensureJsx().jsx(InstalledPluginsSection, { id: "plugins-imported-connectors", plugins, onOpenPluginDetails: props.onOpenPluginDetails }); }
function PluginPageLoadMarker(props: { errorMessage?: string | null; isPageLoading?: boolean }): unknown { return props.isPageLoading ? null : ensureJsx().jsx("span", { hidden: true, "data-load-state": props.errorMessage == null ? "ready" : "failed" }); }

const initializeCreator = (): void => { jsx = getJsxRuntime(); };
const initializeBoundary = (): void => { jsx = getJsxRuntime(); };
const initializeStoreState = (): void => { jsx = getJsxRuntime(); };
const initializeDirectoryConfig = (): void => { jsx = getJsxRuntime(); };
const initializeActionsMenu = (): void => { jsx = getJsxRuntime(); };
const initializeGrid = (): void => { jsx = getJsxRuntime(); };
const initializeImportedPlugins = (): void => { jsx = getJsxRuntime(); };
const initializeBanner = (): void => { jsx = getJsxRuntime(); };
const initializePageLoadMarker = (): void => { jsx = getJsxRuntime(); };
const initializeRequestDialog = (): void => { jsx = getJsxRuntime(); };
const initializeEmptyState = (): void => { jsx = getJsxRuntime(); };
const stringArray = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value != null && !Array.isArray(value);
const actionButton = (label: string, onClick?: () => void): unknown => onClick == null ? null : ensureJsx().jsx("button", { type: "button", onClick, children: label });
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }

export { creatorPrompt as A, initialBrowseTabState as C, PluginDirectoryBoundary as D, selectedMarketplaceState as E, initializeCreator as M, initializeBoundary as O, initializeStoreState as S, initialHostState as T, initializeActionsMenu as _, PluginPageLoadMarker as a, initializeDirectoryConfig as b, PluginCatalog as c, initializeBanner as d, ImportedPlugins as f, PluginActionsMenu as g, initializeGrid as h, initializeRequestDialog as i, creatorOpenedState as j, creatorOpenedStorageKey as k, initializeImportedPlugins as l, PluginGrid as m, initializeEmptyState as n, initializePageLoadMarker as o, initializeImportedPlugins as p, PluginRequestDialog as r, InstalledPluginsSection as s, PluginRequestEmptyState as t, BrowserExtensionInstallBanner as u, PluginLoadingAction as v, compactEmptyState as w, normalizeDirectoryConfig as x, initializeGrid as y };
