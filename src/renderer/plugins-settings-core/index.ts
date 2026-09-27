import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/plugin-request-empty-state";
import { n as initializePluginsPage, t as PluginsPage } from "@rchunk/plugins-page";

interface PluginsSettingsProps extends Record<string, unknown> { hostId?: string; initialTab?: "plugins" | "skills"; manageOnly?: boolean; onBrowseDirectory?(tab: "plugins" | "skills"): void }
let jsx: JsxRuntime | undefined;
let initialized = false;
function initializePluginsSettings(): void { if (initialized) return; initialized = true; initializePluginsPage(); jsx = getJsxRuntime(); }
function PluginsSettingsContent({ hostId, initialTab = "plugins", manageOnly = false, onBrowseDirectory }: PluginsSettingsProps = {}): unknown {
  initializePluginsSettings(); const directory = () => onBrowseDirectory?.(initialTab);
  const page = jsx!.jsx(PluginsPage, { directoryEntrypoint: "settings", hostId, initialManageTab: manageOnly ? "mcps" : initialTab, manageOnly: true });
  if (manageOnly) return page;
  return jsx!.jsxs("section", { "data-settings-section": "plugins", children: [jsx!.jsx("h1", { children: "Plugins" }), jsx!.jsx("p", { children: "Manage plugins, skills, and MCPs" }), jsx!.jsxs("div", { className: "flex items-center gap-2", children: [jsx!.jsx("button", { type: "button", onClick: directory, children: "Browse directory" }), jsx!.jsx("button", { type: "button", children: "Add MCP server" })] }), page] });
}
initializePluginsSettings();
export { initializePluginsSettings as n, PluginsSettingsContent as t };
