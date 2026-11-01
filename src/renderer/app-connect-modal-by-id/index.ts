import "@rchunk/rolldown-runtime";
import {
  $3 as getCompilerRuntime,
  $h as initializeResourceButtonDependencies,
  Ah as DialogHeader,
  I3 as getJsxRuntime,
  Ih as Dialog,
  K2 as initializeIntlRuntime,
  Lh as DialogDescription,
  Oh as DialogBody,
  Ph as initializeDialogLayout,
  Qh as LoadingSpinner,
  Rh as DialogTitle,
  Y2 as FormattedMessage,
  Yh as Button,
  Zh as initializeButton,
  kh as DialogFooter,
  zh as initializeDialog,
} from "@rchunk/app-shared";
import {
  B$ as initializeConnectorQuery,
  V$ as useConnectorAppsQuery,
} from "@rchunk/app-initial";
import {
  n as initializeAppConnectModal,
  t as AppConnectModal,
} from "@rchunk/app-connect-modal";
import type { AppInfo } from "@rchunk/app-info";

interface CompilerRuntime {
  c(size: number): unknown[];
}
interface ConnectorLoadStateProps {
  isPending: boolean;
  isFetching: boolean;
  onOpenChange(open: boolean): void;
  onRetry(): void;
}
interface AppConnectModalByIdProps extends Record<string, unknown> {
  connectorId: string;
  hostId?: string;
  onOpenChange(open: boolean): void;
}

let compilerRuntime: CompilerRuntime;
let jsx: ReturnType<typeof getJsxRuntime>;

function AppConnectModalById(props: AppConnectModalByIdProps): unknown {
  const cache = compilerRuntime.c(34);
  let connectorId: string;
  let hostId: string | undefined;
  let onOpenChange: (open: boolean) => void;
  let modalProps: Record<string, unknown>;
  if (cache[0] === props) {
    connectorId = cache[1] as string;
    hostId = cache[2] as string | undefined;
    onOpenChange = cache[3] as typeof onOpenChange;
    modalProps = cache[4] as Record<string, unknown>;
  } else {
    ({ connectorId, hostId, onOpenChange, ...modalProps } = props);
    cache[0] = props;
    cache[1] = connectorId;
    cache[2] = hostId;
    cache[3] = onOpenChange;
    cache[4] = modalProps;
  }
  let appIds: string[];
  if (cache[5] === connectorId) {
    appIds = cache[6] as string[];
  } else {
    appIds = [connectorId];
    cache[5] = connectorId;
    cache[6] = appIds;
  }
  let queryOptions: { appIds: string[]; hostId?: string };
  if (cache[7] !== hostId || cache[8] !== appIds) {
    queryOptions = { appIds, hostId };
    cache[7] = hostId;
    cache[8] = appIds;
    cache[9] = queryOptions;
  } else {
    queryOptions = cache[9] as typeof queryOptions;
  }
  const { data, isFetching, isPending, refetch } = useConnectorAppsQuery(queryOptions);
  let app: NonNullable<typeof data>[number] | undefined;
  if (cache[10] !== data || cache[11] !== connectorId) {
    app = data?.find((candidate) => candidate.id === connectorId);
    cache[10] = data;
    cache[11] = connectorId;
    cache[12] = app;
  } else {
    app = cache[12] as typeof app;
  }
  if (app == null) {
    let onRetry: () => void;
    if (cache[13] === refetch) {
      onRetry = cache[14] as () => void;
    } else {
      onRetry = () => { refetch(); };
      cache[13] = refetch;
      cache[14] = onRetry;
    }
    let loadState: unknown;
    if (cache[15] !== isFetching || cache[16] !== isPending || cache[17] !== onOpenChange || cache[18] !== onRetry) {
      loadState = jsx.jsx(ConnectorLoadState, {
        isPending,
        isFetching,
        onOpenChange,
        onRetry,
      });
      cache[15] = isFetching;
      cache[16] = isPending;
      cache[17] = onOpenChange;
      cache[18] = onRetry;
      cache[19] = loadState;
    } else {
      loadState = cache[19];
    }
    return loadState;
  }
  let normalizedApp: AppInfo;
  if (
    cache[20] !== app.description ||
    cache[21] !== app.distributionChannel ||
    cache[22] !== app.iconUrl ||
    cache[23] !== app.iconUrlDark ||
    cache[24] !== app.id ||
    cache[25] !== app.installUrl ||
    cache[26] !== app.name ||
    cache[27] !== app.pluginDisplayNames
  ) {
    normalizedApp = {
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
    cache[20] = app.description;
    cache[21] = app.distributionChannel;
    cache[22] = app.iconUrl;
    cache[23] = app.iconUrlDark;
    cache[24] = app.id;
    cache[25] = app.installUrl;
    cache[26] = app.name;
    cache[27] = app.pluginDisplayNames;
    cache[28] = normalizedApp;
  } else {
    normalizedApp = cache[28] as AppInfo;
  }
  let result: unknown;
  if (cache[29] !== normalizedApp || cache[30] !== hostId || cache[31] !== onOpenChange || cache[32] !== modalProps) {
    result = jsx.jsx(AppConnectModal, {
      ...modalProps,
      app: normalizedApp,
      hostId,
      onOpenChange,
    });
    cache[29] = normalizedApp;
    cache[30] = hostId;
    cache[31] = onOpenChange;
    cache[32] = modalProps;
    cache[33] = result;
  } else {
    result = cache[33];
  }
  return result;
}

function ConnectorLoadState({
  isPending,
  isFetching,
  onOpenChange,
  onRetry,
}: ConnectorLoadStateProps): unknown {
  const cache = compilerRuntime.c(8);
  let body: unknown;
  if (cache[0] !== isFetching || cache[1] !== isPending || cache[2] !== onOpenChange || cache[3] !== onRetry) {
    body = jsx.jsx(DialogBody, {
      className: "select-none",
      children: isPending
        ? jsx.jsx(DialogHeader, {
          title: jsx.jsx(DialogTitle, {
            children: jsx.jsx(FormattedMessage, {
              id: "beacons.connectApp.loading.title",
              defaultMessage: "Connect app",
              description: "Title of the dialog shown to an end user while app connection details requested by the user are loading. Keep this concise; there are no placeholders.",
            }),
          }),
          subtitle: jsx.jsxs(DialogDescription, {
            className: "flex items-center gap-2",
            children: [
              jsx.jsx(LoadingSpinner, { className: "icon-xs" }),
              jsx.jsx(FormattedMessage, {
                id: "beacons.connectApp.loading.description",
                defaultMessage: "Loading connection details…",
                description: "Status message in the app connection dialog shown to an end user while connector details are loading. Keep this concise; there are no placeholders.",
              }),
            ],
          }),
        })
        : jsx.jsxs(jsx.Fragment, {
          children: [
            jsx.jsx(DialogHeader, {
              title: jsx.jsx(DialogTitle, {
                children: jsx.jsx(FormattedMessage, {
                  id: "beacons.connectApp.loadError.title",
                  defaultMessage: "Couldn’t load connector",
                  description: "Error heading in the app connection dialog shown to an end user when connector details requested by the user could not be loaded. Keep this concise and nontechnical; there are no placeholders.",
                }),
              }),
              subtitle: jsx.jsx(DialogDescription, {
                children: jsx.jsx(FormattedMessage, {
                  id: "beacons.connectApp.loadError.description",
                  defaultMessage: "Try again, or cancel and return to the previous page",
                  description: "Actionable error explanation in the app connection dialog shown to an end user when connector details requested by the user could not be loaded. The dialog offers Retry and Cancel buttons. Keep this concise; there are no placeholders.",
                }),
              }),
            }),
            jsx.jsxs(DialogFooter, {
              children: [
                jsx.jsx(Button, {
                  color: "secondary",
                  disabled: isFetching,
                  onClick: () => onOpenChange(false),
                  type: "button",
                  children: jsx.jsx(FormattedMessage, {
                    id: "beacons.connectApp.loadError.button.cancel",
                    defaultMessage: "Cancel",
                    description: "Button label in the app connection dialog for closing it after connector details requested by the user failed to load. Keep this short; there are no placeholders.",
                  }),
                }),
                jsx.jsx(Button, {
                  color: "primary",
                  loading: isFetching,
                  onClick: onRetry,
                  type: "button",
                  children: jsx.jsx(FormattedMessage, {
                    id: "beacons.connectApp.loadError.button.retry",
                    defaultMessage: "Retry",
                    description: "Button label in the app connection dialog for retrying connector details that failed to load after an end user requested an app connection. Keep this short; there are no placeholders.",
                  }),
                }),
              ],
            }),
          ],
        }),
    });
    cache[0] = isFetching;
    cache[1] = isPending;
    cache[2] = onOpenChange;
    cache[3] = onRetry;
    cache[4] = body;
  } else {
    body = cache[4];
  }
  let result: unknown;
  if (cache[5] !== onOpenChange || cache[6] !== body) {
    result = jsx.jsx(Dialog, {
      open: true,
      onOpenChange,
      size: "compact",
      children: body,
    });
    cache[5] = onOpenChange;
    cache[6] = body;
    cache[7] = result;
  } else {
    result = cache[7];
  }
  return result;
}

function initializeAppConnectModalById(): void {
  compilerRuntime = getCompilerRuntime() as unknown as CompilerRuntime;
  initializeIntlRuntime();
  initializeButton();
  initializeDialog();
  initializeDialogLayout();
  initializeResourceButtonDependencies();
  initializeConnectorQuery();
  initializeAppConnectModal();
  jsx = getJsxRuntime();
}

export {
  AppConnectModalById as n,
  initializeAppConnectModalById as r,
  ConnectorLoadState as t,
};
