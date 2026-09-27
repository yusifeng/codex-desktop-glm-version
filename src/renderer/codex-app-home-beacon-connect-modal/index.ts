// codex-app-home-beacon-connect-modal —— Home Beacon 的连接/恢复组合层。

import * as appConnectByIdChunk from "@rchunk/app-connect-modal-by-id";
import * as appSharedChunk from "@rchunk/app-shared";
import * as pcaActionChunk from "@rchunk/pca-connector-action";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as useConnectFlowChunk from "@rchunk/use-app-connect-flow";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

void runtimeChunk;

const { n: AppConnectModalById, r: initializeAppConnectModalById } =
  appConnectByIdChunk;
const {
  $3: initializeJsxRuntime,
  FX: initializeMaitaiRuntime,
  I3: getJsxRuntime,
  LX: useScope,
  QI: initializeAppScopeRuntime,
  ZI: AppScope,
  e6: getReactRuntime,
} = appSharedChunk;
const {
  n: initializePcaConnectorAction,
  r: resumePcaAfterConnection,
} = pcaActionChunk;
const { n: useAppConnectFlow, t: initializeAppConnectFlow } =
  useConnectFlowChunk;

let reactRuntime: ReactRuntime | null = null;
let jsxRuntime: JsxRuntime | null = null;

interface CodexAppHomeBeaconConnectModalProps {
  connectorId: string;
  onOpenChange(open: boolean): void;
  pcaResumeTarget?: unknown;
}

function CodexAppHomeBeaconConnectModal({
  connectorId,
  onOpenChange,
  pcaResumeTarget,
}: CodexAppHomeBeaconConnectModalProps): unknown {
  const { React, jsx } = getInitializedConnectModalRuntime();
  const scope = useScope(AppScope);
  const [isCompletingConnection, setCompletingConnection] =
    React.useState(false);
  const { handleAppConnectOAuthStarted } = useAppConnectFlow();
  const onConnected =
    pcaResumeTarget == null
      ? undefined
      : async () => {
          setCompletingConnection(true);
          await resumePcaAfterConnection(scope, pcaResumeTarget)
            .finally(() => setCompletingConnection(false));
        };
  const onOAuthStarted = (event: Record<string, unknown>) =>
    handleAppConnectOAuthStarted({ ...event, resumeTarget: pcaResumeTarget });
  return jsx.jsx(AppConnectModalById, {
    allowBrowserFallback: pcaResumeTarget == null,
    connectorId,
    isCompletingConnection,
    onOpenChange,
    onConnected,
    onOAuthStarted,
    waitForConnectedHandler: pcaResumeTarget != null,
  });
}

function initializeConnectModal(): void {
  if (jsxRuntime != null && reactRuntime != null) return;
  initializeJsxRuntime?.();
  initializeMaitaiRuntime?.();
  reactRuntime =
    typeof getReactRuntime === "function" ? getReactRuntime() : getReactRuntime;
  initializeAppConnectModalById();
  initializeAppConnectFlow();
  initializePcaConnectorAction?.();
  initializeAppScopeRuntime?.();
  jsxRuntime =
    typeof getJsxRuntime === "function" ? getJsxRuntime() : getJsxRuntime;
}

function getInitializedConnectModalRuntime(): {
  React: ReactRuntime;
  jsx: JsxRuntime;
} {
  initializeConnectModal();
  if (reactRuntime == null || jsxRuntime == null) {
    throw new Error("Beacon connect modal runtime failed to initialize");
  }
  return { React: reactRuntime, jsx: jsxRuntime };
}

initializeConnectModal();

export { CodexAppHomeBeaconConnectModal };
