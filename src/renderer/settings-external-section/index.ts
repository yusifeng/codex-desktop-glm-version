import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";

let jsx: JsxRuntime | undefined;
let initialized = false;
function initializeSettingsExternalSection(): void { if (initialized) return; initialized = true; jsx = getJsxRuntime(); }
function SettingsExternalSection(): unknown { initializeSettingsExternalSection(); return jsx!.jsxs("section", { "data-settings-section": "environments", children: [jsx!.jsx("h1", { children: "Environments" }), jsx!.jsx("p", { children: "Opens in your browser during Alpha" })] }); }
initializeSettingsExternalSection();
export { SettingsExternalSection };
