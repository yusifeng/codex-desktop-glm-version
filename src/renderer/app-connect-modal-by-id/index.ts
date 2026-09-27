// app-connect-modal-by-id —— 按 connector ID 查询并打开连接弹窗。

import * as appConnectModalChunk from "@rchunk/app-connect-modal";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import type { AppInfo } from "@rchunk/app-info";
import type { JsxRuntime } from "@rchunk/app-shared";

void runtimeChunk;

const { n: initializeAppConnectModal, t: AppConnectModal } =
  appConnectModalChunk;
const { B$: initializeConnectorQuery, V$: useConnectorAppsQuery } =
  appInitialChunk;
const {
  $3: initializeJsxRuntime,
  $h: initializeResourceButtonDependencies,
  I3: getJsxRuntime,
  K2: initializeIntlRuntime,
  Ph: initializeDialogLayout,
  Zh: initializeButton,
  zh: initializeDialog,
} = appSharedChunk;

let jsxRuntime: JsxRuntime | null = null;

interface ConnectorLoadStateProps {
  isPending: boolean;
  isFetching: boolean;
  onOpenChange(open: boolean): void;
  onRetry(): void;
}

function ConnectorLoadState({
  isPending,
  isFetching,
  onOpenChange,
  onRetry,
}: ConnectorLoadStateProps): unknown {
  const jsx = getInitializedJsxRuntime();
  const title = isPending ? "Connect app" : "Couldn’t load connector";
  return jsx.jsx("div", {
    role: "dialog",
    "aria-modal": true,
    "aria-busy": isPending || isFetching,
    className:
      "flex min-w-80 flex-col gap-4 rounded-xl bg-surface-elevated p-5",
    children: jsx.jsxs(jsx.Fragment, {
      children: [
        jsx.jsx("h2", { className: "heading-md", children: title }),
        jsx.jsx("p", {
          className: "text-secondary",
          children: isPending
            ? "Loading connection details…"
            : "Try again, or cancel and return to the previous page",
        }),
        isPending
          ? null
          : jsx.jsxs("div", {
              className: "flex justify-end gap-2",
              children: [
                jsx.jsx("button", {
                  type: "button",
                  disabled: isFetching,
                  onClick: () => onOpenChange(false),
                  children: "Cancel",
                }),
                jsx.jsx("button", {
                  type: "button",
                  disabled: isFetching,
                  onClick: onRetry,
                  children: isFetching ? "Retrying…" : "Retry",
                }),
              ],
            }),
      ],
    }),
  });
}

interface AppConnectModalByIdProps extends Record<string, unknown> {
  connectorId: string;
  hostId?: string;
  onOpenChange(open: boolean): void;
}

function AppConnectModalById(props: AppConnectModalByIdProps): unknown {
  const jsx = getInitializedJsxRuntime();
  const { connectorId, hostId, onOpenChange, ...modalProps } = props;
  const query = useConnectorAppsQuery({ appIds: [connectorId], hostId });
  const app = query.data?.find((entry) => entry.id === connectorId);
  if (app == null) {
    return jsx.jsx(ConnectorLoadState, {
      isPending: query.isPending,
      isFetching: query.isFetching,
      onOpenChange,
      onRetry: () => query.refetch(),
    });
  }
  const normalizedApp: AppInfo = {
    appMetadata: null,
    branding: null,
    description: app.description,
    distributionChannel: app.distributionChannel,
    iconAssets: null,
    iconDarkAssets: null,
    id: app.id,
    installUrl: app.installUrl,
    isAccessible: false,
    isEnabled: false,
    labels: null,
    logoUrl: app.iconUrl,
    logoUrlDark: app.iconUrlDark,
    name: app.name,
    pluginDisplayNames: app.pluginDisplayNames,
  };
  return jsx.jsx(AppConnectModal, {
    ...modalProps,
    app: normalizedApp,
    hostId,
    onOpenChange,
  });
}

function initializeAppConnectModalById(): void {
  if (jsxRuntime != null) return;
  initializeJsxRuntime?.();
  initializeIntlRuntime?.();
  initializeButton?.();
  initializeDialog?.();
  initializeDialogLayout?.();
  initializeResourceButtonDependencies?.();
  initializeConnectorQuery?.();
  initializeAppConnectModal();
  jsxRuntime =
    typeof getJsxRuntime === "function" ? getJsxRuntime() : getJsxRuntime;
}

function getInitializedJsxRuntime(): JsxRuntime {
  initializeAppConnectModalById();
  if (jsxRuntime == null) {
    throw new Error("App connect modal JSX runtime failed to initialize");
  }
  return jsxRuntime;
}

export {
  AppConnectModalById as n,
  initializeAppConnectModalById as r,
  ConnectorLoadState as t,
};
