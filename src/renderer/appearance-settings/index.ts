import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import { n as AppearanceSettingsContent, o as initializeGeneralSettings } from "@rchunk/general-settings";

let jsx: JsxRuntime | undefined;
let initialized = false;
function initializeAppearanceSettings(): void { if (initialized) return; initialized = true; initializeGeneralSettings(); jsx = getJsxRuntime(); }
function AppearanceSettings(): unknown { initializeAppearanceSettings(); return jsx!.jsxs("section", { "data-settings-section": "appearance", children: [jsx!.jsx("h1", { children: "Appearance" }), jsx!.jsx(AppearanceSettingsContent, {})] }); }
initializeAppearanceSettings();
export { AppearanceSettings };
