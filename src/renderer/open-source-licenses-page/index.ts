import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";

export interface OpenSourceLicensesState { licensesBackPath?: unknown; }
export interface OpenSourceLicensesPageProps { noticesText?: string | null; isLoading?: boolean; state?: OpenSourceLicensesState | null; onBack?(path: string): void; }
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
function licensesBackPath(state?: OpenSourceLicensesState | null): string { return typeof state?.licensesBackPath === "string" && state.licensesBackPath.startsWith("/settings/") ? state.licensesBackPath : "/settings/general"; }

function OpenSourceLicensesPage(props: OpenSourceLicensesPageProps): unknown {
  const runtime = ensureJsx(); const backPath = licensesBackPath(props.state);
  return runtime.jsxs("main", { className: "open-source-licenses-page", children: [runtime.jsx("a", { href: backPath, onClick: (event: { preventDefault(): void }) => { if (props.onBack) { event.preventDefault(); props.onBack(backPath); } }, children: "Back" }), runtime.jsx("h1", { children: "Open source licenses" }), props.isLoading ? runtime.jsx("div", { "aria-busy": true, children: "Loading licenses…" }) : props.noticesText ? runtime.jsx("pre", { children: props.noticesText }) : runtime.jsx("p", { role: "status", children: "License notices are unavailable." })] });
}

export { OpenSourceLicensesPage };
