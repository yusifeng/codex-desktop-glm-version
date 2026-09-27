// pasted-link-connect-modal —— 粘贴链接触发的 App 连接弹窗组合层。

import * as appConnectModalChunk from "@rchunk/app-connect-modal";
import * as appInfoChunk from "@rchunk/app-info";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as useConnectFlowChunk from "@rchunk/use-app-connect-flow";
import type { ConnectorApp } from "@rchunk/app-info";
import type { JsxRuntime } from "@rchunk/app-shared";

void runtimeChunk;

const { n: initializeAppConnectModal, t: AppConnectModal } =
  appConnectModalChunk;
const { t: toAppInfo } = appInfoChunk;
const { $3: initializeJsxRuntime, I3: getJsxRuntime } = appSharedChunk;
const { n: useAppConnectFlow, t: initializeAppConnectFlow } =
  useConnectFlowChunk;

let jsxRuntime: JsxRuntime | null = null;

interface LibraryPastedLinkConnectModalProps {
  app: ConnectorApp;
  area: unknown;
  onConnected(): void;
  onOpenChange(open: boolean): void;
  reauthLinkId?: string;
}

function LibraryPastedLinkConnectModal({
  app,
  area,
  onConnected,
  onOpenChange,
  reauthLinkId,
}: LibraryPastedLinkConnectModalProps): unknown {
  const jsx = initializePastedLinkConnectModal();
  const { handleAppConnected, handleAppConnectOAuthStarted } =
    useAppConnectFlow();
  const normalizedApp = toAppInfo(app);
  const authReason = reauthLinkId == null ? "missing_link" : "reauth_required";
  return jsx.jsx(AppConnectModal, {
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

function initializePastedLinkConnectModal(): JsxRuntime {
  if (jsxRuntime != null) return jsxRuntime;
  initializeJsxRuntime?.();
  initializeAppConnectFlow();
  initializeAppConnectModal();
  jsxRuntime =
    typeof getJsxRuntime === "function" ? getJsxRuntime() : getJsxRuntime;
  return jsxRuntime;
}

initializePastedLinkConnectModal();

export { LibraryPastedLinkConnectModal };
