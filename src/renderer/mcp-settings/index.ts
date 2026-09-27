import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import { n as initializePluginsSettings, t as PluginsSettingsContent } from "@rchunk/plugins-settings-core";

let jsx: JsxRuntime | undefined;
let initialized = false;
function initializeMcpSettings(): void { if (initialized) return; initialized = true; initializePluginsSettings(); jsx = getJsxRuntime(); }
function McpSettings(): unknown { initializeMcpSettings(); return jsx!.jsxs("section", { "data-settings-section": "mcp-settings", children: [jsx!.jsx("h1", { children: "MCP" }), jsx!.jsx("p", { children: "Connect external tools and data sources" }), jsx!.jsx(PluginsSettingsContent, { manageOnly: true })] }); }
initializeMcpSettings();
export { McpSettings };
