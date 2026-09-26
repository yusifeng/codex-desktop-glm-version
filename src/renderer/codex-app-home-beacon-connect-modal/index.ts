// codex-app-home-beacon-connect-modal —— Home Beacon 的连接/恢复组合层。

import * as appConnectByIdChunk from "@rchunk/app-connect-modal-by-id";
import * as appSharedChunk from "@rchunk/app-shared";
import * as pcaActionChunk from "@rchunk/pca-connector-action";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as useConnectFlowChunk from "@rchunk/use-app-connect-flow";

void runtimeChunk;

const appConnectById = appConnectByIdChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;
const pcaAction = pcaActionChunk as Record<string, any>;
const useConnectFlow = useConnectFlowChunk as Record<string, any>;

let React: any;
let jsx: any;

function CodexAppHomeBeaconConnectModal({
  connectorId,
  onOpenChange,
  pcaResumeTarget,
}: {
  connectorId: string;
  onOpenChange(open: boolean): void;
  pcaResumeTarget?: unknown;
}): unknown {
  initializeConnectModal();
  const scope = appShared.LX(appShared.ZI);
  const [isCompletingConnection, setCompletingConnection] =
    React.useState(false);
  const { handleAppConnectOAuthStarted } = useConnectFlow.n();
  const onConnected =
    pcaResumeTarget == null
      ? undefined
      : async () => {
          setCompletingConnection(true);
          await pcaAction
            .r(scope, pcaResumeTarget)
            .finally(() => setCompletingConnection(false));
        };
  const onOAuthStarted = (event: Record<string, unknown>) =>
    handleAppConnectOAuthStarted({ ...event, resumeTarget: pcaResumeTarget });
  return jsx.jsx(appConnectById.n, {
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
  if (jsx != null) return;
  appShared.FX?.();
  appConnectById.r?.();
  useConnectFlow.t?.();
  pcaAction.t?.();
  appShared.QI?.();
  React = typeof appShared.e6 === "function" ? appShared.e6() : appShared.e6;
  jsx = typeof appShared.I3 === "function" ? appShared.I3() : appShared.I3;
}

initializeConnectModal();

export { CodexAppHomeBeaconConnectModal };
