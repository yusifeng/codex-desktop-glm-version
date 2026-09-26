// app-connect-modal-by-id —— 按 connector ID 查询并打开连接弹窗。

import * as appConnectModalChunk from "@rchunk/app-connect-modal";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const appConnectModal = appConnectModalChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;

let jsx: any;

function ConnectorLoadState({
  isPending,
  isFetching,
  onOpenChange,
  onRetry,
}: {
  isPending: boolean;
  isFetching: boolean;
  onOpenChange(open: boolean): void;
  onRetry(): void;
}): unknown {
  initializeAppConnectModalById();
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

function AppConnectModalById(props: Record<string, any>): unknown {
  initializeAppConnectModalById();
  const { connectorId, hostId, onOpenChange, ...modalProps } = props;
  const query = appInitial.V$({ appIds: [connectorId], hostId });
  const app = query.data?.find(
    (entry: { id: string }) => entry.id === connectorId,
  );
  if (app == null) {
    return jsx.jsx(ConnectorLoadState, {
      isPending: query.isPending,
      isFetching: query.isFetching,
      onOpenChange,
      onRetry: () => query.refetch(),
    });
  }
  const normalizedApp = {
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
  return jsx.jsx(appConnectModal.t, {
    ...modalProps,
    app: normalizedApp,
    hostId,
    onOpenChange,
  });
}

function initializeAppConnectModalById(): void {
  if (jsx != null) return;
  appShared.K2?.();
  appShared.Zh?.();
  appShared.zh?.();
  appShared.Ph?.();
  appShared.$h?.();
  appInitial.B$?.();
  appConnectModal.n?.();
  jsx = typeof appShared.I3 === "function" ? appShared.I3() : appShared.I3;
}

export {
  AppConnectModalById as n,
  initializeAppConnectModalById as r,
  ConnectorLoadState as t,
};
