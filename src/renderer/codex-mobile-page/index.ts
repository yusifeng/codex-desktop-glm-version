import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/codex-mobile-setup-dialog";
import "@rchunk/codex-mobile-setup-flow";

export interface CodexMobilePageProps {
  isMfaSetupRequiredError?: boolean; isMfaSetupRequiredFetching?: boolean; mfaSetupRequired?: boolean;
  remoteControlStatus?: "connected" | "disconnected" | "pending"; setupStepDebugOverride?: string;
  onManageConnections?(): void; onClose?(): void;
}
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }

function CodexMobilePage(props: CodexMobilePageProps): unknown {
  const runtime = ensureJsx();
  if (props.isMfaSetupRequiredFetching) return null;
  if (props.mfaSetupRequired && !props.isMfaSetupRequiredError) return runtime.jsxs("main", { className: "codex-mobile-setup-flow", "data-step": props.setupStepDebugOverride, children: [runtime.jsx("h1", { children: "Set up mobile access" }), runtime.jsx("button", { type: "button", onClick: props.onClose, children: "Close" })] });
  return runtime.jsxs("main", { className: "codex-mobile-connections", "data-status": props.remoteControlStatus ?? "disconnected", children: [runtime.jsx("h1", { children: "Codex mobile" }), runtime.jsx("button", { type: "button", onClick: props.onManageConnections, children: "Manage connections" })] });
}

export { CodexMobilePage };
