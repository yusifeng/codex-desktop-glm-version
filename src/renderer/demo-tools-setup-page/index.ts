import { I3 as getJsxRuntime, e6 as getReactRuntime, type JsxRuntime, type ReactRuntime } from "@rchunk/app-shared";
import { pnt as desktopApi } from "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";
import "@rchunk/shield-check";

interface DemoToolsService {
  getSetup(): Promise<{ downloadUrl?: string | null; installStatus?: string }>;
  openDownload?(url: string): Promise<void> | void;
  resetProfile?(): Promise<void> | void;
}

let React: ReactRuntime;
let jsx: JsxRuntime;

function DemoToolsSetupPage(): unknown {
  const service = (desktopApi as { demoTools?: DemoToolsService }).demoTools;
  const [setup, setSetup] = React.useState<{ downloadUrl?: string | null; installStatus?: string } | null>(null);
  const [error, setError] = React.useState<unknown>(null);
  React.useEffect(() => {
    if (service == null) return;
    let active = true;
    service.getSetup().then((value) => { if (active) setSetup(value); }).catch((reason: unknown) => { if (active) setError(reason); });
    return () => { active = false; };
  }, [service]);
  return jsx.jsxs("main", {
    children: [
      jsx.jsx("h1", { children: "Set up a demo install" }),
      jsx.jsx("p", { children: "Follow four steps to show the real customer experience." }),
      error ? jsx.jsx("p", { role: "alert", children: "Demo setup status is unavailable" }) : null,
      jsx.jsx("ol", {
        children: [
          jsx.jsx("li", { children: jsx.jsx("button", { type: "button", disabled: !setup?.downloadUrl, onClick: () => setup?.downloadUrl && service?.openDownload?.(setup.downloadUrl), children: "Download the production build" }) }),
          jsx.jsx("li", { children: "Install the application" }),
          jsx.jsx("li", { children: jsx.jsx("button", { type: "button", onClick: () => service?.resetProfile?.(), children: "Create a clean demo profile" }) }),
          jsx.jsx("li", { children: setup?.installStatus === "installed" ? "Ready to launch" : "Launch and sign in" }),
        ],
      }),
    ],
  });
}

function initializeDemoToolsSetupPage(): void { React = getReactRuntime(); jsx = getJsxRuntime(); }
initializeDemoToolsSetupPage();
export { DemoToolsSetupPage };
