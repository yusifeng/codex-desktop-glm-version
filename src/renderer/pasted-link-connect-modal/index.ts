// pasted-link-connect-modal —— 粘贴链接触发的 App 连接弹窗组合层。

import * as appConnectModalChunk from "@rchunk/app-connect-modal";
import * as appInfoChunk from "@rchunk/app-info";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as useConnectFlowChunk from "@rchunk/use-app-connect-flow";

void runtimeChunk;

const appConnectModal = appConnectModalChunk as Record<string, any>;
const appInfo = appInfoChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;
const useConnectFlow = useConnectFlowChunk as Record<string, any>;

let jsx: any;

function LibraryPastedLinkConnectModal({
  app,
  area,
  onConnected,
  onOpenChange,
  reauthLinkId,
}: {
  app: any;
  area: unknown;
  onConnected(): void;
  onOpenChange(open: boolean): void;
  reauthLinkId?: string;
}): unknown {
  initializePastedLinkConnectModal();
  const { handleAppConnected, handleAppConnectOAuthStarted } =
    useConnectFlow.n();
  const normalizedApp = appInfo.t(app);
  const authReason = reauthLinkId == null ? "missing_link" : "reauth_required";
  return jsx.jsx(appConnectModal.t, {
    app: normalizedApp,
    connectorAuth: { authReason, linkId: reauthLinkId },
    isReconnecting: reauthLinkId != null,
    onConnected: () => {
      handleAppConnected(app.id);
      onConnected();
    },
    onOAuthStarted: (event: Record<string, unknown>) =>
      handleAppConnectOAuthStarted({
        ...event,
        pastedLinkProductExperience: area,
      }),
    onOpenChange,
    reauthLinkId,
  });
}

function initializePastedLinkConnectModal(): void {
  if (jsx != null) return;
  useConnectFlow.t?.();
  appConnectModal.n?.();
  appInfo.n?.();
  jsx = typeof appShared.I3 === "function" ? appShared.I3() : appShared.I3;
}

initializePastedLinkConnectModal();

export { LibraryPastedLinkConnectModal };
