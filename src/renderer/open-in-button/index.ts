import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as googleDriveChunk from "@rchunk/open-in-google-drive-menu-item";
import "@rchunk/rolldown-runtime";
import * as appConnectFlowChunk from "@rchunk/use-app-connect-flow";
import type { IntlShape, JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

type Component = (props: Record<string, unknown>) => unknown;
type Variant = "menu" | "title";
interface OpenInButtonProps {
  analyticsClickSource?: string;
  artifactRef?: string;
  hostId?: string;
  kind?: string;
  threadId?: string;
  title?: string;
  variant?: Variant;
}
interface NativeTarget {
  default?: boolean;
  icon: string;
  id: string;
  label: string;
}
interface NativeTargetsResult {
  fileManagerIcon?: string | null;
  reason?: string;
  status: "failed" | "ready";
  targets: NativeTarget[];
}
type NativeAction =
  | { type: "download-copy" | "show-in-folder" }
  | { type: "open"; targetId: string };
interface NativeActionResult {
  reason?: string;
  status: "completed" | "failed";
}
interface SnapshotResult {
  bytes?: Uint8Array;
  contentType?: string;
  fileName?: string;
  status: "completed" | "failed";
}
interface ArtifactSessionsBridge {
  supportsNativeOpen(): Promise<boolean>;
  getNativeOpenTargets(input: {
    artifactRef?: string;
    threadId?: string;
  }): Promise<NativeTargetsResult>;
  performNativeFileAction(input: {
    action: NativeAction;
    artifactRef?: string;
    threadId?: string;
  }): Promise<NativeActionResult>;
  readNativeSnapshot(input: {
    artifactRef?: string;
    threadId?: string;
  }): Promise<SnapshotResult>;
}
interface WorkspaceFilesBridge {
  getDownloadsFolderIcon?(): Promise<string | null>;
}
interface QueryResult<Data> {
  data?: Data;
  isError: boolean;
  isFetching: boolean;
  refetch(): Promise<unknown>;
}
interface ScopeApi {
  get<Value>(key: unknown): Value;
}
interface ToastService {
  danger(message: unknown, options?: Record<string, unknown>): void;
  success(message: unknown): void;
}
interface MenuComponents {
  Item: Component;
  Message: Component;
  Separator: Component;
}
interface SharedDependencies {
  $O: { INFINITE: number; ONE_MINUTE: number };
  DO: unknown;
  EO: unknown;
  Hl: unknown;
  I3(): JsxRuntime;
  Is: unknown;
  LX(scope: unknown): ScopeApi;
  UI<Value>(promise: Promise<Value>, signal?: AbortSignal): Promise<Value>;
  Y2: Component;
  Yh: Component;
  ZI: unknown;
  _L<Data>(options: Record<string, unknown>): QueryResult<Data>;
  cO: unknown;
  cy: Component;
  e6(): ReactRuntime;
  jf: MenuComponents;
  kf: Component;
  lg: Component;
  n4(): IntlShape;
  pk: unknown;
  q_: Component;
  ug: Component;
  vb: Component;
  yb: Component;
  [key: string]: unknown;
}
interface InitialDependencies {
  E6t(): { platform: "linux" | "macOS" | "windows" };
  Ml(hostId?: string): boolean;
  Xrt: Component;
  ait: Component;
  oit: Component;
  pnt?: {
    artifactSessions?: ArtifactSessionsBridge;
    workspaceFiles?: WorkspaceFilesBridge;
  };
  [key: string]: unknown;
}

const shared = appSharedChunk as unknown as SharedDependencies;
const initial = appInitialChunk as unknown as InitialDependencies;
const useAppConnectFlow = (
  appConnectFlowChunk as unknown as {
    n(options: {
      hostId?: string;
    }): import("@rchunk/use-app-connect-flow").AppConnectFlow;
  }
).n;
const initializeAppConnectFlow = (
  appConnectFlowChunk as unknown as { t(): void }
).t;
const initializeGoogleDriveItem = (googleDriveChunk as unknown as { i(): void })
  .i;
const OpenInGoogleDriveMenuItem = (
  googleDriveChunk as unknown as { r: Component }
).r;
const GoogleDriveConnectModal = (
  googleDriveChunk as unknown as { t: Component }
).t;
let jsx: JsxRuntime;
let react: ReactRuntime;

function OpenInButton(props: OpenInButtonProps): unknown {
  initializeOpenInButton();
  const variant = props.variant ?? "menu";
  if (!initial.Ml(props.hostId)) return null;
  return jsx.jsx(jsx.Fragment, {
    children: jsx.jsx(OpenInMenu, { ...props, variant }),
  });
}

function OpenInMenu({
  analyticsClickSource,
  artifactRef,
  hostId,
  kind,
  threadId,
  title,
  variant,
}: OpenInButtonProps & { variant: Variant }): unknown {
  const scope = shared.LX(shared.ZI);
  const intl = shared.n4();
  const { platform } = initial.E6t();
  const bridges = initial.pnt;
  const artifactSessions = bridges?.artifactSessions;
  const supportQuery = shared._L<boolean>({
    queryKey: ["artifact-session-supports-native-open"],
    queryFn:
      artifactSessions == null
        ? shared.FZ
        : ({ signal }: { signal?: AbortSignal }) =>
            shared.UI(artifactSessions.supportsNativeOpen(), signal),
    retry: false,
    staleTime: shared.$O.INFINITE,
  });
  const [open, setOpen] = react.useState(false);
  const [refreshVersion, setRefreshVersion] = react.useState(0);
  const [isPerformingAction, setPerformingAction] = react.useState(false);
  const [isOpeningDrive, setOpeningDrive] = react.useState(false);
  const nativeTargetsQuery = shared._L<NativeTargetsResult>({
    enabled: supportQuery.data === true && artifactSessions != null,
    gcTime: 0,
    queryKey: [
      "artifact-session-native-open-targets",
      threadId,
      artifactRef,
      refreshVersion,
    ],
    queryFn:
      artifactSessions == null
        ? shared.FZ
        : ({ signal }: { signal?: AbortSignal }) =>
            shared.UI(
              artifactSessions.getNativeOpenTargets({ artifactRef, threadId }),
              signal,
            ),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: shared.$O.ONE_MINUTE,
  });
  const downloadIconQuery = shared._L<string | null>({
    queryFn:
      variant === "title" ||
      bridges?.workspaceFiles?.getDownloadsFolderIcon == null ||
      !open
        ? shared.FZ
        : () => bridges.workspaceFiles?.getDownloadsFolderIcon?.(),
    queryKey: ["workspace-file-downloads", "folder-icon"],
    staleTime: shared.$O.INFINITE,
  });
  const connectFlow = useAppConnectFlow({ hostId });

  if (artifactSessions == null || supportQuery.data !== true) {
    return variant === "title"
      ? jsx.jsx(initial.Xrt, {
          fileType: kind,
          title,
          open,
          onOpenChange: setOpen,
        })
      : null;
  }

  const result = nativeTargetsQuery.data;
  const targets = result?.status === "ready" ? result.targets : null;
  const fileManagerIcon =
    result?.status === "ready" ? result.fileManagerIcon : null;
  const loadFailed = nativeTargetsQuery.isError || result?.status === "failed";
  const canRetry =
    !nativeTargetsQuery.isFetching && (loadFailed || targets?.length === 0);
  const performAction = async (action: NativeAction) => {
    if (isPerformingAction || isOpeningDrive) return;
    setPerformingAction(true);
    const actionResult = await shared
      .UI(
        artifactSessions.performNativeFileAction({
          artifactRef,
          threadId,
          action,
        }),
      )
      .catch(() => null);
    setPerformingAction(false);
    if (actionResult?.status === "completed") {
      if (action.type === "download-copy") {
        scope.get<ToastService>(shared.pk).success(
          intl.formatMessage({
            id: "localConversation.endResource.downloadCopy.success",
            defaultMessage: "Saved a copy to Downloads",
            description:
              "Success message after copying an artifact to the Downloads folder",
          }),
        );
      }
      return;
    }
    if (actionResult?.reason === "target-unavailable")
      setRefreshVersion((version) => version + 1);
    const failures = {
      "download-copy": [
        "localConversation.endResource.downloadCopy.failure",
        "Could not download a copy",
        "Error message after an artifact could not be copied to the Downloads folder",
      ],
      "show-in-folder": [
        "artifactSession.openIn.showInFolder.failure",
        "Could not show this artifact in the file manager",
        "Error message after a live Artifact Session could not be revealed in the system file manager",
      ],
      open: [
        "artifactSession.openIn.failed",
        "Couldn’t open in the selected app",
        "Error toast shown when a live Artifact Session cannot be opened in a native desktop app",
      ],
    } as const;
    const [id, defaultMessage, description] = failures[action.type];
    scope
      .get<ToastService>(shared.pk)
      .danger(intl.formatMessage({ id, defaultMessage, description }), {
        errorAnalytics: { toastId: id },
      });
  };
  const readUploadFile = async () => {
    const snapshot = await shared.UI(
      artifactSessions.readNativeSnapshot({ artifactRef, threadId }),
    );
    if (snapshot.status === "failed")
      throw Error("Artifact Session snapshot materialization failed");
    return {
      bytes: snapshot.bytes,
      contentType: snapshot.contentType,
      fileName: snapshot.fileName,
    };
  };
  const iconSize = variant === "title" ? "base" : "sm";
  const analyticsContext = {
    threadId,
    turnId: null,
    inputMessageId: null,
    messageId: null,
  };
  const targetItems = targets?.map((target) =>
    jsx.jsx(
      shared.jf.Item,
      {
        disabled: isPerformingAction,
        leftIcon: jsx.jsx(initial.ait, {
          size: iconSize,
          children: jsx.jsx("img", {
            alt: "",
            className: "size-full",
            src: target.icon,
          }),
        }),
        onSelect: () => {
          void performAction({ type: "open", targetId: target.id });
        },
        children: jsx.jsx(shared.Y2, {
          id: "localConversation.endResource.nativeAppWithDefault.label",
          defaultMessage:
            "{target}{isDefault, select, true { (Default)} other {}}",
          description:
            "Native app name in a resource card's Open menu, with a suffix when it is the system default",
          values: { isDefault: target.default === true, target: target.label },
        }),
      },
      target.id,
    ),
  );
  const statusItems = [
    open && nativeTargetsQuery.isFetching
      ? menuMessage(
          "localConversation.endResource.loadingAvailableApps",
          "Loading available apps…",
          "Dropdown item shown while loading apps that can open a conversation resource",
        )
      : null,
    targets?.length === 0 && !nativeTargetsQuery.isFetching
      ? menuMessage(
          "artifactSession.openIn.noAvailableApps",
          "No available apps",
          "Empty state shown when no native apps can open a live Artifact Session",
        )
      : null,
    loadFailed && !nativeTargetsQuery.isFetching
      ? menuMessage(
          "artifactSession.openIn.loadTargetsFailed",
          "Couldn’t load available apps",
          "Error shown when native apps for opening a live Artifact Session cannot be discovered",
          { role: "alert", tone: "error" },
        )
      : null,
    canRetry
      ? jsx.jsx(shared.jf.Item, {
          onSelect: (event: { preventDefault(): void }) => {
            event.preventDefault();
            void nativeTargetsQuery.refetch();
          },
          children: jsx.jsx(shared.Y2, {
            id: "artifactSession.openIn.retry",
            defaultMessage: "Try again",
            description:
              "Button that retries native app discovery for a live Artifact Session",
          }),
        })
      : null,
  ];
  const driveItem = jsx.jsx(OpenInGoogleDriveMenuItem, {
    analyticsClickSource,
    analyticsContext,
    handleConnectApp: connectFlow.handleConnectApp,
    hostId,
    iconSize,
    isOpening: isOpeningDrive,
    keepOpenWhileOpening: true,
    onCloseDropdown: () => setOpen(false),
    onOpeningChange: setOpeningDrive,
    readUploadFile,
    sourceId: `artifact-session:${artifactRef}`,
    targetType: kind,
    title,
  });
  const revealIcon =
    fileManagerIcon == null
      ? variant === "title"
        ? jsx.jsx(shared.ug, { icon: { 16: shared.vb, 20: shared.yb } })
        : jsx.jsx(shared.vb, {})
      : jsx.jsx("img", {
          alt: "",
          className: "size-full",
          src: fileManagerIcon,
        });
  const revealItem = jsx.jsx(shared.jf.Item, {
    disabled: isPerformingAction,
    leftIcon: jsx.jsx(initial.ait, { size: iconSize, children: revealIcon }),
    onSelect: () => {
      void performAction({ type: "show-in-folder" });
    },
    children: showInFileManagerLabel(intl, platform),
  });
  const menuContent = jsx.jsxs(jsx.Fragment, {
    children: [
      targetItems,
      ...statusItems,
      driveItem,
      jsx.jsx(shared.jf.Separator, {}),
      revealItem,
    ],
  });
  const downloadIcon = jsx.jsxs(initial.ait, {
    size: iconSize,
    children: [
      variant === "title"
        ? jsx.jsx(shared.ug, {
            icon: { assets: { 16: shared.Hl, 20: shared.EO } },
          })
        : null,
      variant !== "title"
        ? downloadIconQuery.data == null
          ? jsx.jsx(shared.q_, {})
          : jsx.jsx("img", {
              alt: "",
              className: "icon-sm",
              src: downloadIconQuery.data,
            })
        : null,
    ],
  });
  const downloadItem = jsx.jsx(shared.jf.Item, {
    disabled: isPerformingAction,
    leftIcon: downloadIcon,
    onSelect: () => {
      void performAction({ type: "download-copy" });
    },
    children: jsx.jsx(
      shared.Y2,
      variant === "title"
        ? {
            id: "artifactSession.downloadTitleMenu",
            defaultMessage: "Download",
            description:
              "Title menu action for downloading the current live artifact",
          }
        : {
            id: "localConversation.endResource.downloadCopy",
            defaultMessage: "Download a copy",
            description:
              "Dropdown item for saving a separate copy of an artifact to Downloads",
          },
    ),
  });
  const surface =
    variant === "title"
      ? jsx.jsxs(initial.Xrt, {
          fileType: kind,
          title,
          open,
          onOpenChange: setOpen,
          children: [
            jsx.jsx(initial.oit, {
              leftIcon: jsx.jsx(shared.ug, {
                icon: { assets: { 16: shared.cO, 20: shared.Is } },
              }),
              label: jsx.jsx(shared.Y2, {
                id: "artifactSession.openIn.menu",
                defaultMessage: "Open in",
                description:
                  "Button that opens the menu of apps and export actions for a live artifact",
              }),
              children: menuContent,
            }),
            downloadItem,
          ],
        })
      : jsx.jsxs(shared.kf, {
          align: "end",
          surface: "opaque",
          open,
          onOpenChange: setOpen,
          triggerButton: jsx.jsxs(shared.Yh, {
            className: "pointer-events-auto shrink-0",
            color: "outline",
            size: "toolbar",
            loading: isPerformingAction,
            children: [
              jsx.jsx(shared.Y2, {
                id: "artifactSession.openIn.menu",
                defaultMessage: "Open in",
                description:
                  "Button that opens the menu of apps and export actions for a live artifact",
              }),
              jsx.jsx(shared.cy, {}),
            ],
          }),
          children: [menuContent, downloadItem],
        });
  const connectModal =
    connectFlow.connectingApp == null
      ? null
      : jsx.jsx(GoogleDriveConnectModal, {
          app: connectFlow.connectingApp,
          hostId,
          onClose: connectFlow.clearConnectingApp,
          onOAuthStarted: connectFlow.handleAppConnectOAuthStarted,
        });
  return jsx.jsxs(jsx.Fragment, { children: [surface, connectModal] });
}

function menuMessage(
  id: string,
  defaultMessage: string,
  description: string,
  extra: Record<string, unknown> = {},
): unknown {
  return jsx.jsx(shared.jf.Message, {
    compact: true,
    ...extra,
    children: jsx.jsx(shared.Y2, { id, defaultMessage, description }),
  });
}
function showInFileManagerLabel(
  intl: IntlShape,
  platform: "linux" | "macOS" | "windows",
): string {
  const copy =
    platform === "macOS"
      ? [
          "localConversation.endResource.showInFinder",
          "Show in Finder",
          "Dropdown item for revealing a conversation resource in Finder",
        ]
      : platform === "windows"
        ? [
            "localConversation.endResource.showInFileExplorer",
            "Show in File Explorer",
            "Dropdown item for revealing a conversation resource in File Explorer",
          ]
        : [
            "localConversation.endResource.showInFileManager",
            "Show in File Manager",
            "Dropdown item for revealing a conversation resource in the system file manager",
          ];
  return String(
    intl.formatMessage({
      id: copy[0],
      defaultMessage: copy[1],
      description: copy[2],
    }),
  );
}

let initialized = false;
function initializeOpenInButton(): void {
  if (initialized) return;
  initialized = true;
  const call = (name: string) => {
    const candidate = name in shared ? shared[name] : initial[name];
    if (typeof candidate === "function") (candidate as () => unknown)();
  };
  for (const name of [
    "Ul",
    "DO",
    "lO",
    "Ls",
    "jZ",
    "gL",
    "FX",
    "K2",
    "Zh",
    "If",
    "lw",
    "ug",
    "lk",
    "T6t",
    "mnt",
    "QI",
    "ek",
    "Rrt",
    "jl",
  ])
    call(name);
  initializeAppConnectFlow();
  initializeGoogleDriveItem();
  react = shared.e6();
  jsx = shared.I3();
}

export { initializeOpenInButton as n, OpenInButton as t };
