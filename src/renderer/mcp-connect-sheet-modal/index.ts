import {
  HX as useSignalValue,
  I3 as getJsxRuntime,
  LX as useScope,
  ZI as appScope,
} from "@rchunk/app-shared";
import {
  Ir as initializeAppConnectState,
  Lr as useAppConnectFlow,
  cW as resolveConnectRequest,
  lW as initializeAppConnectFlow,
  uW as pendingConnectRequest,
} from "@rchunk/app-initial";
import {
  n as AppConnectModalById,
  r as initializeAppConnectModalById,
} from "@rchunk/app-connect-modal-by-id";

export interface McpConnectSheetModalProps {
  onClose(): void;
}

interface PendingConnectRequest {
  beforeConnect?: unknown;
  connectorId: string;
  githubRepositoryAccess?: Record<string, unknown> & { linkId?: string };
  hostId?: string;
  id: string;
  reauthLinkId?: string;
  requireAuth?: boolean;
  result?: unknown;
}

function McpConnectSheetModal({ onClose }: McpConnectSheetModalProps): unknown {
  const scope = useScope(appScope);
  const request = useSignalValue(pendingConnectRequest) as
    | PendingConnectRequest
    | null;
  const { isAppConnectPending, markAppConnectOAuthPending } =
    useAppConnectFlow();
  if (request == null || request.result != null) return null;

  const resumeTarget = {
    kind: "mcp-connect-sheet",
    requestId: request.id,
  };
  const complete = (result: Record<string, unknown>) =>
    resolveConnectRequest(scope, request.id, result);
  const githubRepositoryAccess =
    request.githubRepositoryAccess == null
      ? undefined
      : {
          ...request.githubRepositoryAccess,
          onContinue: () =>
            complete({
              didConnect: true,
              linkId: request.githubRepositoryAccess?.linkId,
            }),
        };

  return getJsxRuntime().jsx(AppConnectModalById, {
    allowBrowserFallback: false,
    connectorId: request.connectorId,
    authTypeOverride: request.requireAuth ? "OAUTH" : undefined,
    closeOnOAuthStarted: false,
    beforeConnect: request.beforeConnect,
    isReconnecting: request.reauthLinkId != null,
    reauthLinkId: request.reauthLinkId,
    githubRepositoryAccess,
    hostId: request.hostId,
    isCompletingConnection: isAppConnectPending(
      request.connectorId,
      resumeTarget,
      request.hostId,
    ),
    onOpenChange: (open: boolean) => {
      if (!open) onClose();
    },
    onConnected: (linkId: string) => complete({ didConnect: true, linkId }),
    onOAuthStarted: (event: Record<string, unknown>) => {
      markAppConnectOAuthPending({
        ...event,
        hostId: request.hostId,
        returnTo: "/",
        resumeTarget,
      }) ?? complete({ didConnect: false });
    },
    waitForConnectedHandler: true,
  });
}

function initializeMcpConnectSheetModal(): void {
  initializeAppConnectModalById();
  initializeAppConnectState();
  initializeAppConnectFlow();
}

initializeMcpConnectSheetModal();

export { McpConnectSheetModal };
