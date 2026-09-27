import { I3 as getJsxRuntime, e6 as getReactRuntime, type JsxRuntime, type ReactRuntime } from "@rchunk/app-shared";
import { i_n as useRouterLocation, o_n as useNavigate } from "@rchunk/app-initial";
import "@rchunk/app-connect-link-navigation";
import "@rchunk/app-connect-modal";
import "@rchunk/plugin-connector-setup";
import "@rchunk/rolldown-runtime";

export interface AppConnectCallbackResult { appId?: string; error?: string; success: boolean; }
export interface AppConnectOAuthCallbackPageProps { completeCallback?(parameters: URLSearchParams): Promise<AppConnectCallbackResult>; }

let React: ReactRuntime;
let jsx: JsxRuntime;

function AppConnectOAuthCallbackPage(props: AppConnectOAuthCallbackPageProps = {}): unknown {
  const location = useRouterLocation();
  const navigate = useNavigate();
  const [result, setResult] = React.useState<AppConnectCallbackResult | null>(null);
  const parameters = new URLSearchParams(location.search);
  React.useEffect(() => {
    let active = true;
    const complete = props.completeCallback ?? (async (values: URLSearchParams) => ({ success: !values.has("error"), error: values.get("error") ?? undefined, appId: values.get("app_id") ?? undefined }));
    complete(parameters).then((value) => { if (active) setResult(value); });
    return () => { active = false; };
  }, [location.search, props.completeCallback]);
  if (result == null) return jsx.jsx("p", { role: "status", children: "Finishing app connection…" });
  if (!result.success)
    return jsx.jsxs("main", { children: [jsx.jsx("h1", { children: "Couldn’t connect app" }), jsx.jsx("p", { role: "alert", children: result.error ?? "The authorization request failed" }), jsx.jsx("button", { type: "button", onClick: () => navigate("/settings/connectors", { replace: true }), children: "Back to apps" })] });
  return jsx.jsxs("main", { children: [jsx.jsx("h1", { children: "App connected" }), jsx.jsx("button", { type: "button", onClick: () => navigate(result.appId ? `/settings/connectors/${result.appId}` : "/settings/connectors", { replace: true }), children: "Continue" })] });
}

function initializeAppConnectOAuthCallbackPage(): void { React = getReactRuntime(); jsx = getJsxRuntime(); }
initializeAppConnectOAuthCallbackPage();
export { AppConnectOAuthCallbackPage };
