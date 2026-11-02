// Browser permissions and plugin selection controls used by settings pages.
import "@rchunk/rolldown-runtime";
import "@rchunk/app-primary";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import { fq as isOfficialMarketplace, lq as marketplaceForBuildFlavor } from "@rchunk/app-shared";
import { Oun as getBuildFlavor, iDt as marketplacePathsEqual } from "@rchunk/app-initial";
import * as browserUseOriginStateChunk from "@rchunk/browser-use-origin-state-queries";
import "@rchunk/settings-loading-row";
import "@rchunk/assert-never";

interface PluginRecord { displayName?: string; marketplaceName?: string; marketplacePath?: string; plugin: { enabled?: boolean; id: string; installed?: boolean; name: string } }
interface PluginItem { action?: unknown; description?: unknown; enabled?: boolean; expanded?: boolean; icon?: unknown; id: string; kind?: "app" | "disclosure" | "plugin" | "unavailable"; onToggleEnabled?(enabled: boolean): void; onToggleExpanded?(): void; plugin?: PluginRecord; showEnableToggle?: boolean; title: unknown; toggleAriaLabel?: string }
interface PluginsQuery { errorMessage?: string | null; isLoading?: boolean; reload?(): void; retry?(): void }
const shared = appSharedChunk as unknown as { BX?<Value>(signal: unknown, key: string): Value; I3(): import("@rchunk/app-shared").JsxRuntime };
const initial = appInitialChunk as unknown as { Gv?(): { selectedHostId: string } };
const browserConfigStatusSignal = (browserUseOriginStateChunk as unknown as { n?: unknown }).n;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function SettingRow(props: { control?: unknown; description?: unknown; icon?: unknown; label: unknown; muted?: boolean }): unknown {
  return jsx.jsxs("div", { className: `flex min-h-[60px] items-center gap-3 px-4 py-3${props.muted ? " opacity-60" : ""}`, children: [props.icon == null ? null : jsx.jsx("span", { className: "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border", children: props.icon }), jsx.jsxs("div", { className: "min-w-0 flex-1", children: [jsx.jsx("div", { className: "font-medium", children: props.label }), props.description == null ? null : jsx.jsx("div", { className: "text-xs text-secondary", children: props.description })] }), props.control ?? null] });
}
function Toggle(props: { ariaLabel?: string; checked: boolean; disabled?: boolean; onChange(value: boolean): void }): unknown {
  return jsx.jsx("button", { type: "button", role: "switch", "aria-label": props.ariaLabel, "aria-checked": props.checked, disabled: props.disabled, onClick: () => props.onChange(!props.checked), children: props.checked ? "On" : "Off" });
}
function BrowserUseSettingsSection(props: { backend?: unknown; browserUseEnabled?: boolean; configStatus?: "error" | "loading" | "supported" | "unsupported"; showHistory?: boolean; showWebMcp?: boolean; siteSettingsRow?: unknown }): unknown {
  const host = initial.Gv?.().selectedHostId;
  const runtimeStatus = host == null || browserConfigStatusSignal == null
    ? undefined
    : shared.BX?.<typeof props.configStatus>(browserConfigStatusSignal, host);
  const status = props.configStatus ?? runtimeStatus ?? "unsupported";
  if (status === "loading") return jsx.jsx("div", { role: "status", children: "Loading browser settings…" });
  if (status === "error") return jsx.jsx("div", { role: "alert", children: "Unable to load browser settings" });
  const enabled = props.browserUseEnabled !== false;
  const permissions = props.siteSettingsRow != null || (enabled && props.showWebMcp === true) ? jsx.jsxs("section", { "data-browser-backend": props.backend, "data-host-id": host, children: [jsx.jsx("h3", { children: props.backend === "chrome" ? "Permissions" : "Browser permissions" }), props.siteSettingsRow, enabled && props.showWebMcp === true ? jsx.jsx(SettingRow, { label: "Website tools", description: "Allow websites to expose tools to ChatGPT." }) : null] }) : null;
  if (status === "supported") return jsx.jsxs("section", { "data-browser-settings": true, children: [permissions, enabled && props.showHistory !== false ? jsx.jsx(SettingRow, { label: "Browsing history" }) : null] });
  return jsx.jsxs(jsx.Fragment, { children: [permissions, enabled ? jsx.jsx(SettingRow, { label: "Browser Use" }) : null] });
}
function PluginControls(props: { emptyStateTitle: unknown; installButtonLabel: unknown; items: readonly PluginItem[]; onInstallPlugin?(plugin: PluginRecord): void; onOpenPluginDetails?(plugin: PluginRecord): void; onTogglePlugin?(plugin: PluginRecord, enabled: boolean): void; onUninstallPlugin?(plugin: PluginRecord): void; pendingPluginId?: string | null; pluginsQuery: PluginsQuery; selectedHostId: string; unavailableItems?: readonly PluginItem[] }): unknown {
  const items = [...props.items, ...(props.unavailableItems ?? [])];
  if (props.pluginsQuery.isLoading === true && items.length === 0) return jsx.jsx("div", { role: "status", children: "Loading plugins…" });
  if (props.pluginsQuery.errorMessage != null) return jsx.jsxs("div", { role: "alert", children: [props.pluginsQuery.errorMessage, props.pluginsQuery.retry == null ? null : jsx.jsx("button", { type: "button", onClick: props.pluginsQuery.retry, children: "Retry" })] });
  if (items.length === 0) return jsx.jsx(SettingRow, { label: props.emptyStateTitle });
  return jsx.jsx("div", { "data-plugin-host-id": props.selectedHostId, children: items.map((item) => {
    if (item.kind === "disclosure") return jsx.jsx("button", { type: "button", "aria-expanded": item.expanded, onClick: item.onToggleExpanded, children: jsx.jsx(SettingRow, { icon: item.icon, label: item.title, description: item.description, control: item.expanded ? "⌃" : "⌄" }) }, item.id);
    if (item.kind === "unavailable") return jsx.jsx(SettingRow, { icon: item.icon, label: item.title, description: item.description, muted: true, control: jsx.jsx(Toggle, { checked: false, disabled: true, onChange() {} }) }, item.id);
    if (item.kind === "app" || item.plugin == null) return jsx.jsx(SettingRow, { icon: item.icon, label: item.title, description: item.description, control: item.action ?? (item.showEnableToggle === false ? null : jsx.jsx(Toggle, { ariaLabel: item.toggleAriaLabel, checked: item.enabled === true, onChange: (enabled) => item.onToggleEnabled?.(enabled) })) }, item.id);
    const record = item.plugin; const installed = record.plugin.installed === true; const pending = props.pendingPluginId === record.plugin.id;
    const control = installed ? jsx.jsxs("div", { children: [jsx.jsx(Toggle, { checked: record.plugin.enabled !== false, disabled: pending, onChange: (value) => props.onTogglePlugin?.(record, value) }), props.onUninstallPlugin == null ? null : jsx.jsx("button", { type: "button", disabled: pending, onClick: () => props.onUninstallPlugin?.(record), children: "Delete" })] }) : jsx.jsx("button", { type: "button", disabled: pending, onClick: () => props.onInstallPlugin?.(record), children: props.installButtonLabel });
    return jsx.jsx("div", { className: "group", children: jsx.jsx("button", { type: "button", onClick: () => props.onOpenPluginDetails?.(record), children: jsx.jsx(SettingRow, { icon: item.icon, label: item.title, description: item.description, control }) }) }, item.id);
  }) });
}
function resolvePreferredPlugin(records: readonly PluginRecord[], pluginName: string, marketplacePath?: string): PluginRecord | null {
  const candidates = records.filter((record) => record.plugin.name === pluginName || record.plugin.id.split("@")[0] === pluginName);
  const currentMarketplace = marketplaceForBuildFlavor(getBuildFlavor());
  return candidates.find((record) => record.marketplaceName === currentMarketplace)
    ?? candidates.find((record) => isOfficialMarketplace(record.marketplaceName))
    ?? candidates.find((record) => record.marketplaceName === "openai-curated")
    ?? candidates.find((record) => marketplacePathsEqual(marketplacePath, record.marketplacePath))
    ?? null;
}
let initialized = false;
function initializePluginSelection(): void { if (!initialized) { jsx = shared.I3(); initialized = true; } }
function initializeBrowserUseSettingsSection(): void { initializePluginSelection(); }
function initializePluginControls(): void { initializePluginSelection(); }
export { BrowserUseSettingsSection as a, initializePluginSelection as i, resolvePreferredPlugin as n, initializeBrowserUseSettingsSection as o, PluginControls as r, initializePluginControls as t };
