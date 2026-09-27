import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/connect-plugins-submenu-item";
import "@rchunk/use-search-plugins";
import type { JsxRuntime } from "@rchunk/app-shared";
const { I3: jsxExport } = appSharedChunk as unknown as { I3: JsxRuntime | (() => JsxRuntime) };
let jsx: JsxRuntime;
interface Plugin { id: string; name: string; selected?: boolean; }
function togglePlugin(plugins: readonly Plugin[], id: string): Plugin[] { return plugins.map((plugin) => plugin.id === id ? { ...plugin, selected: !plugin.selected } : plugin); }
function selectedPluginIds(plugins: readonly Plugin[]): string[] { return plugins.filter((plugin) => plugin.selected).map((plugin) => plugin.id); }
function PluginPickerMenuContent({ plugins = [], onChange }: { plugins?: readonly Plugin[]; onChange?(ids: string[]): void }): unknown {
  initializePluginPickerMenuContent();
  return jsx.jsx("div", { role: "menu", children: plugins.map((plugin) => jsx.jsx("button", { "aria-pressed": plugin.selected === true, onClick: () => onChange?.(selectedPluginIds(togglePlugin(plugins, plugin.id))), role: "menuitemcheckbox", type: "button", children: plugin.name }, plugin.id)) });
}
function initializePluginPickerMenuContent(): void { if (jsx == null) jsx = typeof jsxExport === "function" ? jsxExport() : jsxExport; }
initializePluginPickerMenuContent();
export { selectedPluginIds as a, initializePluginPickerMenuContent as i, PluginPickerMenuContent as n, togglePlugin as o, selectedPluginIds as r, PluginPickerMenuContent as t };
