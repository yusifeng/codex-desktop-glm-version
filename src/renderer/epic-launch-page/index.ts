import { I3 as getJsxRuntime, e6 as getReactRuntime, type JsxRuntime, type ReactRuntime } from "@rchunk/app-shared";
import { B6t as AuthContext } from "@rchunk/app-initial";
import "@rchunk/epic-launch-contracts";
import "@rchunk/page-layout";
import "@rchunk/rolldown-runtime";

interface EpicLaunchBridge {
  destination(): string | null;
  get(): string | null;
  workspace(): string | null;
}
interface EpicAuthState { accountId?: string | null; authMethod?: string; isLoading?: boolean; userId?: string | null; }

declare global { interface Window { __oaiEpicNativeLaunch?: EpicLaunchBridge; } }

let React: ReactRuntime;
let jsx: JsxRuntime;

function EpicLaunchPage(): unknown {
  const auth = React.useContext<EpicAuthState | null>(AuthContext);
  const bridge = typeof window === "undefined" ? undefined : window.__oaiEpicNativeLaunch;
  const launch = React.useSyncExternalStore(
    (listener) => { window.addEventListener("oai-epic-native-launch", listener); return () => window.removeEventListener("oai-epic-native-launch", listener); },
    () => bridge?.get() ?? null,
    () => null,
  );
  if (auth?.isLoading || auth?.userId == null || auth.accountId == null)
    return jsx.jsx("p", { role: "status", children: "Opening chart…" });
  if (launch == null)
    return jsx.jsx("p", { role: "alert", children: "This chart could not be opened. Reopen ChatGPT from the patient’s chart in Epic." });
  if (auth.authMethod !== "chatgpt")
    return jsx.jsx("div", { "data-action": "request-chatgpt-login" });
  const workspace = bridge?.workspace();
  if (workspace != null && workspace !== auth.accountId)
    return jsx.jsx("p", { role: "alert", children: `Switch to workspace ${workspace} to open this chart.` });
  return jsx.jsx("a", { href: bridge?.destination() ?? "/epic/launch", "data-replace": true, children: "Continue" });
}

function initializeEpicLaunchPage(): void { React = getReactRuntime(); jsx = getJsxRuntime(); }
initializeEpicLaunchPage();
export { EpicLaunchPage };
