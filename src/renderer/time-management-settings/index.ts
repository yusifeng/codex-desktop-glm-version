import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import { Qgn as initializeRouter, Ygn as Navigate, i_n as useLocation } from "@rchunk/app-initial";

let jsx: JsxRuntime | undefined;
let initialized = false;
function initializeTimeManagementSettings(): void { if (initialized) return; initialized = true; initializeRouter(); jsx = getJsxRuntime(); }
function ChatGptTimeManagementSettings(): unknown {
  initializeTimeManagementSettings();
  const location = useLocation(); const parameters = new URLSearchParams(location.search);
  if (!new Set(["quiet-hours", "study-hours"]).has(parameters.get("view") ?? "")) parameters.set("view", "time-management");
  return jsx!.jsx(Navigate, { replace: true, state: location.state, to: { pathname: "/settings/safety", search: `?${parameters}`, hash: location.hash } });
}
initializeTimeManagementSettings();
export { ChatGptTimeManagementSettings };
