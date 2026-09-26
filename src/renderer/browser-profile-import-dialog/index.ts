// browser-profile-import-dialog —— 浏览器资料导入弹窗与完整导入状态机。
// 原版：app/webview/assets/dialog-d7d4fcb916e3.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as analyticsChunk from "@rchunk/browser-profile-import-analytics";
import * as queryChunk from "@rchunk/browser-profile-import-query";
import type {
  JsxRuntime,
  MessageDescriptor,
  ReactRuntime,
} from "@rchunk/app-shared";

void runtimeChunk;

type Source = "atlas" | "chrome";
type ImportKind = "passwords" | "cookies" | "history" | "extensions";

type Profile = {
  source: Source;
  profilePath: string;
  appName: string;
  profileName?: string;
  profileDirectoryName?: string;
  hasExtensions?: boolean;
};

type ImportRequest = {
  source: Source;
  profilePath: string;
  importCookies: boolean;
  importPasswords: boolean;
  importHistory: boolean;
  importExtensions: boolean;
  allowElevatedChromeDecryption?: boolean;
  allowUnverifiedExtensions?: boolean;
  cookieDomainAllowlist?: string[];
};

type DataResult = {
  status?: string;
  discovered?: number;
  imported?: number;
  failed?: number;
  error?: unknown;
  skippedExisting?: number;
  skippedInvalid?: number;
  failures?: Array<{ id?: string; name?: string; reason?: string }>;
  profile?: DataResult;
  account?: DataResult;
};

type ImportResult = {
  source?: Source;
  profilePath?: string;
  cookies?: DataResult;
  passwords?: DataResult;
  history?: DataResult;
  extensions?: DataResult;
};

type AttemptContext = {
  flowId: string;
  attemptIndex: number;
  windowsChromeAdminApprovalNoticeRequired: boolean;
  windowsChromeAdminApprovalNoticeAcknowledged: boolean;
};

interface BrowserProfileImportService {
  getImportSignals(): Promise<Record<string, unknown>>;
  importBrowserProfile(request: ImportRequest): Promise<ImportResult>;
  listImportableBrowserProfiles(): Promise<Profile[]>;
}

interface ImportMutationVariables {
  context: AttemptContext;
  previousResult?: ImportResult;
  request: ImportRequest;
  startedAt: number;
}

interface ResultState {
  result: ImportResult;
  revealedRowCount: number;
}

interface ExtensionConfirmationState {
  profile: Profile;
  request: ImportRequest;
}

interface ImportResultsProps {
  activeImportRequest?: ImportRequest;
  cookieAccessFailureMessage?: unknown;
  importCookies: boolean;
  importExtensions: boolean;
  importHistory: boolean;
  importPasswords: boolean;
  isImporting: boolean;
  revealedImportResultRowCount?: number;
  showCloseBrowserGuidance: boolean;
  result: ImportResult | null;
  onDone(): void;
  onRetry?: () => void;
}

interface ImportSelectionProps extends ImportResultsProps {
  confirmExtensionImport: boolean;
  elevatedChromeConsent: boolean;
  extensionsAvailable: boolean;
  isLoadingProfiles: boolean;
  profilePickerOpen?: boolean;
  profiles?: Profile[];
  profilesHaveError: boolean;
  requiresElevatedChromeConsent: boolean;
  selectedProfile: Profile | null;
  onCancel(): void;
  onElevatedChromeConsentChange(checked: boolean): void;
  onImport(): void;
  onImportCookiesChange(checked: boolean): void;
  onImportExtensionsChange(checked: boolean): void;
  onImportHistoryChange(checked: boolean): void;
  onImportPasswordsChange(checked: boolean): void;
  onProfilePickerOpenChange?: (open: boolean) => void;
  onSelectProfile(profile: Profile): void;
}

export interface BrowserProfileImportDialogProps {
  entryPoint: string;
  flowId: string;
  onClose(): void;
  service: BrowserProfileImportService;
}

const {
  _L: useQuery,
  gL: initializeUseQuery,
  iL: useMutation,
  rL: initializeUseMutation,
} = appSharedChunk;

const {
  $3: initializeRuntimeLazy,
  $h: initializeSettingsRow,
  Ad: Checkbox,
  Ah: DialogHeader,
  BX: useSignalFamilyValue,
  Dh: dialogActionsClassName,
  FX: initializeSignalRuntime,
  G2: defineMessages,
  I3: getJsxRuntime,
  If: initializeMenu,
  Ih: Dialog,
  K2: initializeReactRuntime,
  LX: useSignalScope,
  Lf: CheckControl,
  Lh: DialogDescription,
  Lo: ErrorIcon,
  Oh: DialogContent,
  Ph: initializeDialogLayout,
  QI: initializeAppScope,
  Qc: initializeErrorIcon,
  Qh: LoadingSpinner,
  Rf: initializeSettingsList,
  Rh: DialogTitle,
  Ro: initializeSuccessIcon,
  Tc: initializeMotion,
  Ud: MinusIcon,
  Wd: initializeMinusIcon,
  Y2: FormattedMessage,
  Yh: Button,
  ZI: appScope,
  Zc: SettingsList,
  Zh: initializeButton,
  a$: initializeMotionRuntime,
  al: initializeSelectTrigger,
  bD: selectedItemIcon,
  e6: getReactRuntime,
  h4: initializeClassNames,
  jd: initializeCheckbox,
  jf: Menu,
  jh: DialogSection,
  kf: MenuTrigger,
  kh: DialogActions,
  m4: classNames,
  o$: MotionSpan,
  rl: SettingsRow,
  wc: SuccessIcon,
  xD: initializeCheckControl,
  zh: initializeDialog,
} = appSharedChunk;
const {
  Gx: browserImportSucceededSignal,
  Jx: browserImportCompletedAtSignal,
  Kx: isImportSuccessful,
  Slt: useReducedMotion,
  Ux: isImportFailure,
  Wx: isImportDataSuccessful,
  Xl: initializeBrowserImportSettings,
  mfn: browserExtensionsFeatureFamily,
  pfn: initializeBrowserExtensionFeature,
  ql: SelectTrigger,
  qx: initializeBrowserImportRuntime,
  xlt: initializeBrowserImportState,
} = appInitialChunk;
const {
  Jp: WarningIcon,
  Yp: initializeWarningIcon,
} = appPrimaryChunk;
const {
  c: recordAdminNoticeShown,
  i: recordDialogClosed,
  n: recordAttemptFinished,
  r: recordAttemptStarted,
  s: recordAdminNoticeAcknowledged,
  t: initializeBrowserImportAnalytics,
} = analyticsChunk;
const {
  a: SourceIcon,
  c: importMessages,
  d: initializeImportDataIcons,
  i: initializeImportQueries,
  l: initializeImportMessages,
  s: initializeSourceIcons,
  t: createProfilesQueryOptions,
  u: ImportDataIcon,
} = queryChunk;

const jsx: JsxRuntime = getJsxRuntime();
const React: ReactRuntime = getReactRuntime();
const revealInitialDelayMs = 750;
const revealRowDelayMs = 500;

const dialogMessages = defineMessages({
  cancel: {
    id: "settings.browserUse.profileImport.cancel",
    defaultMessage: "Cancel",
    description: "Button that closes the browser data import dialog",
  },
  complete: {
    id: "settings.browserUse.profileImport.complete",
    defaultMessage: "Import complete",
    description: "Title shown after browser data import completes",
  },
  done: {
    id: "settings.browserUse.profileImport.done",
    defaultMessage: "Done",
    description: "Button that closes the browser data import dialog",
  },
  failed: {
    id: "settings.browserUse.profileImport.failed",
    defaultMessage: "Import failed",
    description: "Title shown when browser data import fails",
  },
  import: {
    id: "settings.browserUse.profileImport.import",
    defaultMessage: "Import",
    description: "Button that starts importing browser data",
  },
  importingCookies: {
    id: "settings.browserUse.profileImport.importingCookies",
    defaultMessage: "Importing cookies…",
    description: "Progress description shown while cookies are being imported",
  },
  importingHistory: {
    id: "settings.browserUse.profileImport.importingHistory",
    defaultMessage: "Importing browsing history…",
    description:
      "Progress description shown while browsing history is being imported",
  },
  importingPasswords: {
    id: "settings.browserUse.profileImport.importingPasswords",
    defaultMessage: "Importing saved passwords…",
    description:
      "Progress description shown while saved passwords are being imported",
  },
  importingExtensions: {
    id: "settings.browserUse.profileImport.importingExtensions",
    defaultMessage: "Importing extensions…",
    description:
      "Progress description shown while extensions are being imported",
  },
  retry: {
    id: "settings.browserUse.profileImport.retry",
    defaultMessage: "Retry",
    description: "Button that retries browser data import",
  },
});

function Message(props: Record<string, unknown>) {
  return jsx.jsx(FormattedMessage, props);
}

function profileKey(profile: Profile): string {
  return `${profile.source}:${profile.profilePath}`;
}

function profileAccessibleName(profile: Profile): string {
  return `${profile.appName} ${profile.profileName || profile.profileDirectoryName}`;
}

function buildImportRequest(
  profile: Profile,
  importCookies: boolean,
  importPasswords: boolean,
  importHistory: boolean,
  importExtensions: boolean,
  allowElevatedChromeDecryption: boolean,
): ImportRequest {
  const request: ImportRequest = {
    source: profile.source,
    profilePath: profile.profilePath,
    importCookies,
    importPasswords,
    importHistory,
    importExtensions,
  };
  return allowElevatedChromeDecryption
    ? { ...request, allowElevatedChromeDecryption: true }
    : request;
}

function mergeDataResult(
  previous?: DataResult,
  next?: DataResult,
): DataResult | undefined {
  if (next == null) return previous;
  const previousImported = previous?.imported ?? 0;
  return previousImported === 0
    ? next
    : { ...next, imported: previousImported + (next.imported ?? 0) };
}

function mergeImportResults(
  previous: ImportResult,
  next: ImportResult,
): ImportResult {
  return {
    ...previous,
    ...next,
    cookies: mergeDataResult(previous.cookies, next.cookies),
    passwords: mergeDataResult(previous.passwords, next.passwords),
    history: mergeDataResult(previous.history, next.history),
    extensions: mergeDataResult(previous.extensions, next.extensions),
  };
}

function shouldRetry(...results: (DataResult | undefined)[]): boolean {
  return !results.some(isImportDataSuccessful) || results.some(isImportFailure);
}

function hasCleanStatus(result?: DataResult): boolean {
  return (
    result?.error == null &&
    (result?.status == null ||
      result.status === "success" ||
      result.status === "missing" ||
      result.status === "partial" ||
      result.status === "partial-success") &&
    (result?.status !== "missing" || (result.failed ?? 0) === 0)
  );
}

function ImportedDataIcon({ kind }: { kind: ImportKind }) {
  return jsx.jsx(ImportDataIcon, { className: "size-5 text-secondary", kind });
}

const extensionFailureMessages: Record<string, [string, string]> = {
  unsupported_installation: [
    "settings.browserUse.profileImport.extensionUnsupportedInstallation",
    "This type of extension installation isn’t supported",
  ],
  managed_extension: [
    "settings.browserUse.profileImport.extensionManaged",
    "Managed extensions must be installed by your administrator",
  ],
  chrome_component: [
    "settings.browserUse.profileImport.extensionChromeComponent",
    "Built-in Chrome components can’t be imported",
  ],
  invalid_metadata: [
    "settings.browserUse.profileImport.extensionInvalidMetadata",
    "Chrome’s installation details are missing or invalid",
  ],
  missing_files: [
    "settings.browserUse.profileImport.extensionMissingFiles",
    "The extension’s files are missing from this Chrome profile",
  ],
  invalid_files: [
    "settings.browserUse.profileImport.extensionInvalidFiles",
    "The extension’s files couldn’t be safely read",
  ],
  invalid_manifest: [
    "settings.browserUse.profileImport.extensionInvalidManifest",
    "The extension’s manifest is invalid or doesn’t match its installation",
  ],
  invalid_permissions: [
    "settings.browserUse.profileImport.extensionInvalidPermissions",
    "The saved permissions or enabled state couldn’t be read safely",
  ],
  unsupported_permissions: [
    "settings.browserUse.profileImport.extensionUnsupportedPermissions",
    "The saved site-access restrictions can’t be preserved in Codex",
  ],
  copy_failed: [
    "settings.browserUse.profileImport.extensionCopyFailed",
    "The extension’s files couldn’t be copied. Check available disk space and try again.",
  ],
  blocked_by_policy: [
    "settings.browserUse.profileImport.extensionBlockedByPolicy",
    "Blocked by your administrator",
  ],
  blocked_by_security: [
    "settings.browserUse.profileImport.extensionBlockedBySecurity",
    "Blocked by browser security checks",
  ],
  unsupported_requirements: [
    "settings.browserUse.profileImport.extensionUnsupportedRequirements",
    "This extension requires features that aren’t available in Codex",
  ],
  dependency_failed: [
    "settings.browserUse.profileImport.extensionDependencyFailed",
    "A required shared module is missing or incompatible",
  ],
  initialization_failed: [
    "settings.browserUse.profileImport.extensionInitializationFailed",
    "Codex couldn’t start extension import. Restart Codex and try again.",
  ],
  profile_closed: [
    "settings.browserUse.profileImport.extensionProfileClosed",
    "The browser profile closed before import finished",
  ],
};

function ExtensionFailureReason({ reason }: { reason?: string }) {
  const [id, defaultMessage] = extensionFailureMessages[reason ?? ""] ?? [
    "settings.browserUse.profileImport.extensionInstallFailed",
    "The extension couldn’t be installed",
  ];
  return jsx.jsx(Message, {
    id,
    defaultMessage,
    description: "Reason an extension could not be imported",
  });
}

function ExtensionFailureMessage({ result }: { result?: DataResult }) {
  if (result?.failures?.length) {
    return jsx.jsx("ul", {
      className: "flex flex-col gap-3 select-text",
      children: result.failures.map((failure, index) =>
        jsx.jsxs(
          "li",
          {
            className: "flex min-w-0 flex-col gap-1",
            children: [
              jsx.jsx("div", {
                className: "font-medium wrap-anywhere text-default",
                children:
                  failure.name ||
                  failure.id ||
                  jsx.jsx(Message, {
                    id: "settings.browserUse.profileImport.unknownExtension",
                    defaultMessage: "Unknown extension",
                  }),
              }),
              jsx.jsx(ExtensionFailureReason, { reason: failure.reason }),
            ],
          },
          failure.id ?? index,
        ),
      ),
    });
  }
  if (result?.status === "failed_to_read") {
    return jsx.jsx(Message, {
      id: "settings.browserUse.profileImport.extensionSettingsUnreadable",
      defaultMessage:
        "Chrome’s extension settings couldn’t be read. Close Chrome and try again.",
    });
  }
  if (result?.status === "failed_to_copy") {
    return jsx.jsx(ExtensionFailureReason, { reason: "copy_failed" });
  }
  if (result?.status === "failed_to_initialize") {
    return jsx.jsx(ExtensionFailureReason, { reason: "initialization_failed" });
  }
  return jsx.jsx(Message, {
    id: "settings.browserUse.profileImport.extensionsError",
    defaultMessage: "Some extensions couldn’t be imported",
  });
}

function ProfileLabel({ profile }: { profile: Profile }) {
  const iconClass = classNames(
    "size-4 shrink-0",
    profile.source === "atlas" && "rounded-[22%]",
  );
  return jsx.jsxs("span", {
    className: "flex min-w-0 flex-1 items-center gap-1.5",
    children: [
      jsx.jsx(SourceIcon, { className: iconClass, source: profile.source }),
      jsx.jsx("span", {
        className: "min-w-0 truncate text-default",
        children: profile.appName,
      }),
      jsx.jsx("span", {
        className: "min-w-0 truncate text-tertiary",
        children: profile.profileName || profile.profileDirectoryName,
      }),
    ],
  });
}

function ProfilePicker({
  disabled,
  isLoading,
  open,
  profiles,
  selectedProfile,
  onOpenChange,
  onSelectProfile,
}: {
  disabled: boolean;
  isLoading: boolean;
  open: boolean;
  profiles?: Profile[];
  selectedProfile: Profile | null;
  onOpenChange: (open: boolean) => void;
  onSelectProfile: (profile: Profile) => void;
}) {
  const oneProfile = profiles?.length === 1;
  const triggerContent = isLoading
    ? jsx.jsxs(React.Fragment, {
        children: [
          jsx.jsx(LoadingSpinner, { className: "icon-2xs" }),
          jsx.jsx(Message, {
            id: "settings.browserUse.profileImport.loadingProfiles",
            defaultMessage: "Loading profiles…",
          }),
        ],
      })
    : selectedProfile == null
      ? jsx.jsx(Message, {
          id: "settings.browserUse.profileImport.noProfiles",
          defaultMessage: "No profiles found",
        })
      : jsx.jsx(ProfileLabel, { profile: selectedProfile });
  const trigger = jsx.jsx(SelectTrigger, {
    "aria-disabled": oneProfile || undefined,
    "aria-label": selectedProfile
      ? profileAccessibleName(selectedProfile)
      : undefined,
    className: classNames(
      "min-w-0 flex-1",
      oneProfile && "pointer-events-none",
    ),
    chevronClassName: oneProfile ? "hidden" : undefined,
    disabled: oneProfile ? undefined : disabled,
    tabIndex: oneProfile ? -1 : undefined,
    children: triggerContent,
  });
  return jsx.jsxs("div", {
    className: "flex items-center gap-3",
    children: [
      jsx.jsx("span", {
        className: "shrink-0 text-sm text-codex-description",
        children: jsx.jsx(Message, {
          id: "settings.browserUse.profileImport.from",
          defaultMessage: "From",
        }),
      }),
      oneProfile
        ? trigger
        : jsx.jsx(MenuTrigger, {
            align: "end",
            contentWidth: "menuWide",
            disabled,
            open,
            triggerButton: trigger,
            onOpenChange,
            children: jsx.jsx(Menu.Section, {
              className: "max-h-[250px] overflow-y-auto",
              children: profiles?.map((profile) =>
                jsx.jsx(
                  Menu.Item,
                  {
                    "aria-label": profileAccessibleName(profile),
                    rightIconAsset:
                      profileKey(profile) ===
                      (selectedProfile == null
                        ? null
                        : profileKey(selectedProfile))
                        ? selectedItemIcon
                        : undefined,
                    onSelect: () => onSelectProfile(profile),
                    children: jsx.jsx(ProfileLabel, { profile }),
                  },
                  profileKey(profile),
                ),
              ),
            }),
          }),
    ],
  });
}

function DataSelectionRow({
  checked,
  disabled,
  kind,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  kind: ImportKind;
  onChange: (checked: boolean) => void;
}) {
  return jsx.jsx(SettingsRow, {
    icon: jsx.jsx(ImportedDataIcon, { kind }),
    label: jsx.jsx("span", {
      className: "select-none",
      children: jsx.jsx(Message, { ...importMessages[kind] }),
    }),
    control: (props: Record<string, unknown>) =>
      jsx.jsx(CheckControl, { ...props, checked, disabled, onChange }),
  });
}

function ElevatedChromeConsent({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return jsx.jsxs("div", {
    className:
      "flex flex-col gap-2 rounded-lg border border-primary-outline bg-text/[0.025] p-3 text-sm",
    children: [
      jsx.jsx("p", {
        className: "font-medium text-default",
        children: jsx.jsx(Message, {
          id: "settings.browserUse.profileImport.windowsChrome.title",
          defaultMessage: "Administrator approval required",
        }),
      }),
      jsx.jsx("p", {
        className: "text-codex-description",
        children: jsx.jsx(Message, {
          id: "settings.browserUse.profileImport.windowsChrome.description",
          defaultMessage:
            "Windows protects Chrome cookies and passwords with App-Bound Encryption, so ChatGPT also needs administrator approval",
        }),
      }),
      jsx.jsxs("label", {
        className: "relative flex cursor-interaction items-start gap-2",
        children: [
          jsx.jsx(Checkbox, {
            checked,
            disabled,
            onCheckedChange: onChange,
          }),
          jsx.jsx("span", {
            children: jsx.jsx(Message, {
              id: "settings.browserUse.profileImport.windowsChrome.consent",
              defaultMessage:
                "I understand the app will request administrator approval to import this Chrome data",
            }),
          }),
        ],
      }),
    ],
  });
}

function ExtensionsConfirmation({
  profile,
  onCancel,
  onImport,
}: {
  profile: Profile;
  onCancel: () => void;
  onImport: () => void;
}) {
  const title = jsx.jsx(Message, {
    id: "settings.browserUse.profileImport.extensionsConfirmationTitle",
    defaultMessage: "Import unverified extensions?",
  });
  const description = jsx.jsx(Message, {
    id: "settings.browserUse.profileImport.extensionsConfirmationDescription",
    defaultMessage:
      "Codex can’t verify extensions or saved permissions from this {appName} profile “{profileName}”. If imported, these extensions may run code or access data in Codex. Continue only if you trust the profile.",
    values: { appName: profile.appName, profileName: profile.profileName },
  });
  return jsx.jsxs(DialogContent, {
    as: "form",
    onSubmit: (event: { preventDefault: () => void }) => {
      event.preventDefault();
      onImport();
    },
    children: [
      jsx.jsx(DialogTitle, { className: "sr-only", children: title }),
      jsx.jsx(DialogDescription, { className: "sr-only", children: description }),
      jsx.jsx(DialogSection, {
        children: jsx.jsx(DialogHeader, { title, subtitle: description }),
      }),
      jsx.jsx(DialogSection, {
        children: jsx.jsxs(DialogActions, {
          children: [
            jsx.jsx(Button, {
              autoFocus: true,
              color: "secondary",
              onClick: onCancel,
              type: "button",
              children: jsx.jsx(Message, { ...dialogMessages.cancel }),
            }),
            jsx.jsx(Button, {
              type: "submit",
              children: jsx.jsx(Message, {
                id: "settings.browserUse.profileImport.extensionsConfirmationAction",
                defaultMessage: "Import extensions",
              }),
            }),
          ],
        }),
      }),
    ],
  });
}

function cookieFailureMessage(
  result: ImportResult,
  message: unknown,
  showCloseBrowserGuidance: boolean,
  partiallyFailed: boolean,
) {
  if (result.cookies?.status === "failed_to_copy") {
    if (message != null) return jsx.jsx(React.Fragment, { children: message });
    const sourceGuidance = showCloseBrowserGuidance
      ? result.source === "chrome"
        ? "Chrome may still be running in the background. Close Chrome completely and try again. "
        : "Atlas may still be running in the background. Close Atlas completely and try again. "
      : "";
    return jsx.jsx(Message, {
      id: "settings.browserUse.profileImport.cookieAccessError",
      defaultMessage: `ChatGPT couldn’t access this profile’s cookies. ${sourceGuidance}A device security policy may be blocking access`,
    });
  }
  return jsx.jsx(Message, {
    id: partiallyFailed
      ? "settings.browserUse.profileImport.cookiesPartialError"
      : "settings.browserUse.profileImport.cookiesError",
    defaultMessage: partiallyFailed
      ? "Some cookies couldn’t be imported"
      : "Cookies couldn’t be imported",
  });
}

function passwordFailureMessage(results: (DataResult | undefined)[]) {
  const partiallyFailed =
    results.some(isImportFailure) && results.some(isImportDataSuccessful);
  const accessFailed = results.some(
    (result) => result?.status === "failed_to_copy",
  );
  return jsx.jsx(Message, {
    id: partiallyFailed
      ? "settings.browserUse.profileImport.passwordsPartialError"
      : accessFailed
        ? "settings.browserUse.profileImport.passwordAccessError"
        : "settings.browserUse.profileImport.passwordsError",
    defaultMessage: partiallyFailed
      ? "Some passwords couldn’t be imported"
      : accessFailed
        ? "ChatGPT couldn’t access this profile’s passwords. A device security policy may be blocking access"
        : "Passwords couldn’t be imported",
  });
}

type ResultRowModel = {
  kind: ImportKind;
  visible: boolean;
  importing: boolean;
  succeeded: boolean;
  warning?: boolean;
  failureMessage?: unknown;
};

function AnimatedStatusIcon({
  animationDelay,
  children,
  rotate,
}: {
  animationDelay: number;
  children: unknown;
  rotate: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const keyframes = rotate
    ? [
        "scale(0.9) rotate(-14deg)",
        "scale(1.16) rotate(6deg)",
        "scale(0.94) rotate(-3deg)",
        "scale(1.04) rotate(1deg)",
        "scale(1) rotate(0deg)",
      ]
    : ["scale(0.9)", "scale(1.16)", "scale(0.94)", "scale(1.04)", "scale(1)"];
  return jsx.jsx(MotionSpan, {
    className: "inline-flex",
    animate: {
      opacity: 1,
      transform: reducedMotion ? "scale(1) rotate(0deg)" : keyframes,
    },
    initial: !reducedMotion && {
      opacity: 0,
      transform: rotate ? "scale(0.9) rotate(-14deg)" : "scale(0.9)",
    },
    transition: {
      transform: {
        duration: reducedMotion ? 0 : 0.5,
        delay: reducedMotion ? 0 : animationDelay,
        times: [0, 0.38, 0.62, 0.82, 1],
        ease: "easeInOut",
      },
      opacity: {
        duration: reducedMotion ? 0 : 0.18,
        delay: reducedMotion ? 0 : animationDelay,
      },
    },
    "aria-hidden": "true",
    children,
  });
}

function ResultRow({
  animationDelay,
  failureMessage,
  kind,
  showSpinner,
  succeeded,
  warning,
}: {
  animationDelay: number;
  failureMessage?: unknown;
  kind: ImportKind;
  showSpinner: boolean;
  succeeded: boolean;
  warning?: boolean;
}) {
  const labelId = `browser-profile-import-${kind}-result-label`;
  const descriptionId = `browser-profile-import-${kind}-result-description`;
  let statusIcon = succeeded
    ? jsx.jsx(SuccessIcon, { className: "size-5 text-chart-green" })
    : jsx.jsx(MinusIcon, { className: "size-5 text-tertiary" });
  if (failureMessage != null) {
    statusIcon = warning
      ? jsx.jsx(WarningIcon, { className: "size-5 text-warning" })
      : jsx.jsx(ErrorIcon, { className: "size-5 text-danger" });
  }
  let control: unknown = jsx.jsx(AnimatedStatusIcon, {
    animationDelay,
    rotate: succeeded || failureMessage != null,
    children: statusIcon,
  });
  if (showSpinner) {
    control = jsx.jsx("span", {
      className: "inline-flex size-5 items-center justify-center",
      "aria-labelledby": labelId,
      role: "status",
      children: jsx.jsx(LoadingSpinner, { className: "size-5" }),
    });
  } else if (!succeeded && failureMessage == null) {
    control = jsx.jsx("span", {
      className: "inline-flex size-5 items-center justify-center",
      "aria-describedby": descriptionId,
      "aria-labelledby": labelId,
      role: "status",
      children: control,
    });
  }
  const detail =
    failureMessage != null
      ? jsx.jsx("div", {
          className: warning ? "text-warning" : "text-danger",
          role: warning ? "status" : "alert",
          children: failureMessage,
        })
      : !succeeded && !showSpinner
        ? jsx.jsx("span", {
            id: descriptionId,
            className: "text-tertiary",
            children: jsx.jsx(Message, {
              id: "settings.browserUse.profileImport.noDataStatus",
              defaultMessage: "No data was found to import",
            }),
          })
        : undefined;
  return jsx.jsxs("div", {
    children: [
      jsx.jsx(SettingsRow, {
        control,
        icon: jsx.jsx(ImportedDataIcon, { kind }),
        label: jsx.jsx("span", {
          id: labelId,
          children: jsx.jsx(Message, { ...importMessages[kind] }),
        }),
      }),
      detail == null
        ? undefined
        : jsx.jsx("div", {
            className:
              "min-w-0 px-4 pb-3 text-xs leading-4 text-balance text-secondary",
            children: detail,
          }),
    ],
  });
}

function ImportResults({
  activeImportRequest,
  cookieAccessFailureMessage,
  importCookies,
  importExtensions,
  importHistory,
  importPasswords,
  isImporting,
  revealedImportResultRowCount,
  showCloseBrowserGuidance,
  result,
  onDone,
  onRetry,
}: ImportResultsProps) {
  const revealing = isImporting || revealedImportResultRowCount != null;
  const visible = {
    passwords: revealing ? importPasswords : result?.passwords != null,
    cookies: revealing ? importCookies : result?.cookies != null,
    history: revealing ? importHistory : result?.history != null,
    extensions: revealing ? importExtensions : result?.extensions != null,
  };
  const passwordResults = [
    result?.passwords,
    result?.passwords?.profile,
    result?.passwords?.account,
  ];
  const passwordFailed =
    visible.passwords &&
    result != null &&
    (result.passwords == null || passwordResults.some(isImportFailure));
  const cookieFailed =
    visible.cookies &&
    result != null &&
    (result.cookies == null || isImportFailure(result.cookies));
  const historyFailed =
    visible.history &&
    result != null &&
    (result.history == null || isImportFailure(result.history));
  const extensionFailed =
    visible.extensions &&
    result != null &&
    (result.extensions == null || isImportFailure(result.extensions));
  const extensionSkipped =
    visible.extensions && (result?.extensions?.skippedInvalid ?? 0) > 0;
  const complete = result != null && isImportSuccessful(result);
  const anyFailure =
    passwordFailed || cookieFailed || historyFailed || extensionFailed;
  const allFailed = (anyFailure || extensionSkipped) && !complete;

  const cookiePartial =
    cookieFailed &&
    ((result?.cookies?.imported ?? 0) > 0 ||
      (result?.cookies?.status === "partial-success" &&
        result.cookies.imported == null));
  const cookieWarning =
    cookiePartial &&
    result?.cookies?.error == null &&
    ["success", "partial-success"].includes(result?.cookies?.status);
  const passwordWarning =
    passwordFailed &&
    passwordResults.some(isImportDataSuccessful) &&
    (passwordResults.some((item) => (item?.imported ?? 0) > 0) ||
      passwordResults.some(
        (item) => item?.status === "partial-success" && item.imported == null,
      )) &&
    passwordResults.every(hasCleanStatus);
  const historyWarning =
    historyFailed &&
    (result?.history?.imported ?? 0) > 0 &&
    result?.history?.status === "success";

  const allRows: ResultRowModel[] = [
    {
      kind: "passwords",
      visible: visible.passwords,
      importing:
        isImporting &&
        visible.passwords &&
        (activeImportRequest?.importPasswords ?? importPasswords),
      succeeded: passwordResults.some(isImportDataSuccessful),
      warning: passwordWarning,
      failureMessage: passwordFailed
        ? passwordFailureMessage(passwordResults)
        : undefined,
    },
    {
      kind: "cookies",
      visible: visible.cookies,
      importing:
        isImporting &&
        visible.cookies &&
        (activeImportRequest?.importCookies ?? importCookies),
      succeeded: isImportDataSuccessful(result?.cookies),
      warning: cookieWarning,
      failureMessage:
        result != null && cookieFailed
          ? cookieFailureMessage(
              result,
              cookieAccessFailureMessage,
              showCloseBrowserGuidance,
              cookiePartial,
            )
          : undefined,
    },
    {
      kind: "history",
      visible: visible.history,
      importing:
        isImporting &&
        visible.history &&
        (activeImportRequest?.importHistory ?? importHistory),
      succeeded: isImportDataSuccessful(result?.history),
      warning: historyWarning,
      failureMessage: historyFailed
        ? jsx.jsx(Message, {
            id: "settings.browserUse.profileImport.historyRetryGuidance",
            defaultMessage: "Make sure Chrome is fully closed",
          })
        : undefined,
    },
    {
      kind: "extensions",
      visible: visible.extensions,
      importing:
        isImporting &&
        visible.extensions &&
        (activeImportRequest?.importExtensions ?? importExtensions),
      succeeded: isImportDataSuccessful(result?.extensions),
      warning: isImportDataSuccessful(result?.extensions),
      failureMessage:
        extensionFailed || extensionSkipped
          ? jsx.jsx(ExtensionFailureMessage, { result: result?.extensions })
          : undefined,
    },
  ];
  const rows = allRows.filter((row) => row.visible);

  const importingRows = rows.filter((row) => row.importing);
  const revealIndex = revealedImportResultRowCount ?? 0;
  const activeKind =
    importingRows[Math.min(revealIndex, importingRows.length - 1)]?.kind ??
    "passwords";
  const titleMessage = isImporting
    ? importMessages.title
    : allFailed
      ? dialogMessages.failed
      : dialogMessages.complete;
  const subtitle = isImporting
    ? dialogMessages[
        {
          cookies: "importingCookies",
          history: "importingHistory",
          passwords: "importingPasswords",
          extensions: "importingExtensions",
        }[activeKind]
      ]
    : allFailed
      ? {
          id: "settings.browserUse.profileImport.failedSummary",
          defaultMessage: "We were unable to import your browsing data",
        }
      : complete
        ? {
            id: "settings.browserUse.profileImport.completeDescription",
            defaultMessage:
              "Your data is now available in the built-in browser",
          }
        : {
            id: "settings.browserUse.profileImport.noDataDescription",
            defaultMessage: "No browser data was available to import",
          };

  return jsx.jsxs(DialogContent, {
    children: [
      jsx.jsx(DialogSection, {
        children: jsx.jsx(DialogHeader, {
          title: jsx.jsx(Message, { ...titleMessage }),
          subtitle: jsx.jsx(Message, { ...subtitle }),
        }),
      }),
      jsx.jsx(DialogSection, {
        className: "max-h-80 overflow-y-auto",
        children: jsx.jsx(SettingsList, {
          className: "shrink-0",
          children: rows.map((row, index) => {
            const waiting =
              row.importing && revealIndex <= importingRows.indexOf(row);
            return jsx.jsx(
              ResultRow,
              {
                animationDelay:
                  revealedImportResultRowCount == null ? index * 0.25 : 0,
                failureMessage: waiting ? undefined : row.failureMessage,
                kind: row.kind,
                showSpinner: waiting,
                succeeded: row.succeeded,
                warning: row.warning,
              },
              row.kind,
            );
          }),
        }),
      }),
      jsx.jsx(DialogSection, {
        children: jsx.jsxs(DialogActions, {
          className: dialogActionsClassName,
          expandSingleButton: false,
          children: [
            isImporting
              ? jsx.jsx(Button, {
                  color: "secondary",
                  disabled: true,
                  onClick: onDone,
                  type: "button",
                  children: jsx.jsx(Message, { ...dialogMessages.cancel }),
                })
              : undefined,
            !isImporting && anyFailure && onRetry != null
              ? jsx.jsx(Button, {
                  color: "secondary",
                  onClick: onRetry,
                  type: "button",
                  children: jsx.jsx(Message, { ...dialogMessages.retry }),
                })
              : undefined,
            jsx.jsx(Button, {
              color: "primary",
              disabled: isImporting,
              loading: isImporting,
              onClick: onDone,
              type: "button",
              children: jsx.jsx(Message, {
                ...(isImporting ? dialogMessages.import : dialogMessages.done),
              }),
            }),
          ],
        }),
      }),
    ],
  });
}

function ImportSelection(props: ImportSelectionProps) {
  const {
    activeImportRequest,
    cookieAccessFailureMessage,
    confirmExtensionImport,
    elevatedChromeConsent,
    extensionsAvailable,
    importCookies,
    importExtensions,
    importHistory,
    importPasswords,
    isImporting,
    isLoadingProfiles,
    profilePickerOpen,
    profiles,
    profilesHaveError,
    revealedImportResultRowCount,
    requiresElevatedChromeConsent,
    result,
    selectedProfile,
  } = props;
  if (confirmExtensionImport && selectedProfile != null) {
    return jsx.jsx(ExtensionsConfirmation, {
      profile: selectedProfile,
      onCancel: props.onCancel,
      onImport: props.onImport,
    });
  }
  const cookiesSelected = selectedProfile != null && importCookies;
  const passwordsSelected = selectedProfile != null && importPasswords;
  const historySelected = selectedProfile?.source === "chrome" && importHistory;
  const extensionsSelected = extensionsAvailable && importExtensions;
  if (isImporting || result != null) {
    return jsx.jsx(ImportResults, {
      activeImportRequest,
      cookieAccessFailureMessage,
      importCookies: cookiesSelected,
      importExtensions:
        result?.extensions != null ||
        (activeImportRequest?.importExtensions ?? extensionsSelected),
      importHistory: historySelected,
      importPasswords: passwordsSelected,
      isImporting,
      revealedImportResultRowCount,
      showCloseBrowserGuidance: props.showCloseBrowserGuidance,
      result,
      onDone: props.onCancel,
      onRetry: props.onRetry,
    });
  }
  const submitDisabled =
    selectedProfile == null ||
    (!cookiesSelected &&
      !passwordsSelected &&
      !historySelected &&
      !extensionsSelected) ||
    (requiresElevatedChromeConsent && !elevatedChromeConsent);
  return jsx.jsxs(DialogContent, {
    as: "form",
    onSubmit: (event: { preventDefault: () => void }) => {
      event.preventDefault();
      props.onImport();
    },
    children: [
      jsx.jsx(DialogSection, {
        children: jsx.jsx(DialogHeader, {
          title: jsx.jsx(Message, { ...importMessages.title }),
          subtitle: jsx.jsx(DialogDescription, {
            asChild: true,
            children: jsx.jsx("div", {
              children: jsx.jsx(Message, {
                id: "settings.browserUse.profileImport.subtitle",
                defaultMessage:
                  "Choose data to bring over to the built-in browser",
              }),
            }),
          }),
        }),
      }),
      jsx.jsxs(DialogSection, {
        className: "gap-3",
        children: [
          jsx.jsx(ProfilePicker, {
            disabled: isImporting || !profiles?.length,
            isLoading: isLoadingProfiles,
            open: profilePickerOpen,
            profiles,
            selectedProfile,
            onOpenChange: props.onProfilePickerOpenChange,
            onSelectProfile: props.onSelectProfile,
          }),
          profiles?.length === 0
            ? jsx.jsx("p", {
                className: "text-sm text-codex-description",
                children: jsx.jsx(Message, {
                  id: "settings.browserUse.profileImport.noProfilesDescription",
                  defaultMessage:
                    "No Chrome or Atlas profiles were found on this device",
                }),
              })
            : undefined,
          props.showCloseBrowserGuidance && selectedProfile != null
            ? jsx.jsx("p", {
                className: "text-sm text-codex-description",
                children: jsx.jsx(Message, {
                  id: "settings.browserUse.profileImport.closeBrowser",
                  defaultMessage:
                    "Close {browserName} completely before importing",
                  values: { browserName: selectedProfile.appName },
                }),
              })
            : undefined,
          selectedProfile == null
            ? undefined
            : jsx.jsxs(SettingsList, {
                children: [
                  jsx.jsx(DataSelectionRow, {
                    checked: passwordsSelected,
                    disabled: isImporting,
                    kind: "passwords",
                    onChange: props.onImportPasswordsChange,
                  }),
                  jsx.jsx(DataSelectionRow, {
                    checked: cookiesSelected,
                    disabled: isImporting,
                    kind: "cookies",
                    onChange: props.onImportCookiesChange,
                  }),
                  selectedProfile.source === "chrome"
                    ? jsx.jsx(DataSelectionRow, {
                        checked: historySelected,
                        disabled: isImporting,
                        kind: "history",
                        onChange: props.onImportHistoryChange,
                      })
                    : undefined,
                  extensionsAvailable
                    ? jsx.jsx(DataSelectionRow, {
                        checked: extensionsSelected,
                        disabled: isImporting,
                        kind: "extensions",
                        onChange: props.onImportExtensionsChange,
                      })
                    : undefined,
                ],
              }),
          requiresElevatedChromeConsent
            ? jsx.jsx(ElevatedChromeConsent, {
                checked: elevatedChromeConsent,
                disabled: isImporting,
                onChange: props.onElevatedChromeConsentChange,
              })
            : undefined,
          profilesHaveError
            ? jsx.jsx("p", {
                className: "px-3 text-sm text-danger",
                role: "alert",
                children: jsx.jsx(Message, {
                  id: "settings.browserUse.profileImport.profilesError",
                  defaultMessage:
                    "We couldn't load browser profiles. Close and reopen this dialog to try again",
                }),
              })
            : undefined,
        ],
      }),
      jsx.jsx(DialogSection, {
        children: jsx.jsxs(DialogActions, {
          className: dialogActionsClassName,
          children: [
            jsx.jsx(Button, {
              color: "secondary",
              disabled: isImporting,
              onClick: props.onCancel,
              type: "button",
              children: jsx.jsx(Message, { ...dialogMessages.cancel }),
            }),
            jsx.jsx(Button, {
              color: "primary",
              disabled: submitDisabled,
              loading: isImporting,
              type: "submit",
              children: jsx.jsx(Message, { ...dialogMessages.import }),
            }),
          ],
        }),
      }),
    ],
  });
}

function BrowserProfileImportDialogModal({
  entryPoint,
  flowId,
  onClose,
  service,
}: BrowserProfileImportDialogProps) {
  const scope = useSignalScope(appScope);
  const [selectedProfileKey, setSelectedProfileKey] = React.useState("");
  const [importCookies, setImportCookies] = React.useState(true);
  const [importPasswords, setImportPasswords] = React.useState(true);
  const [importHistory, setImportHistory] = React.useState(true);
  const [importExtensions, setImportExtensions] = React.useState(false);
  const [extensionConfirmation, setExtensionConfirmation] =
    React.useState<ExtensionConfirmationState | null>(null);
  const extensionsFeatureEnabled = useSignalFamilyValue(
    browserExtensionsFeatureFamily,
    "2982604767",
  );
  const [resultState, setResultState] = React.useState<ResultState | undefined>(
    undefined,
  );
  const [elevatedConsentProfileKey, setElevatedConsentProfileKey] =
    React.useState<string | null>(null);
  const exitState = React.useRef("before-attempt");
  const closeRecorded = React.useRef(false);
  const dismissalReason = React.useRef("close-button");
  const adminNoticeAcknowledged = React.useRef(false);
  const adminNoticeRequired = React.useRef(false);
  const activeAttempt = React.useRef<ImportMutationVariables | null>(null);

  const profilesQuery = useQuery<Profile[]>(
    createProfilesQueryOptions(service, true),
  );
  const mutation = useMutation<
    ImportResult,
    unknown,
    ImportMutationVariables
  >({
    mutationFn: ({ request }) =>
      service.importBrowserProfile(request),
    onError: (_error, variables) => {
      exitState.current = "after-request-error";
      recordAttemptFinished(scope, entryPoint, variables.request, variables.context);
    },
    onSuccess: async (nextResult, variables) => {
      exitState.current = "after-result";
      const result =
        variables.previousResult == null
          ? nextResult
          : mergeImportResults(variables.previousResult, nextResult);
      const successful = isImportSuccessful(result);
      if (successful) scope.set(browserImportSucceededSignal, true);
      if (isImportSuccessful(nextResult))
        scope.set(browserImportCompletedAtSignal, Date.now());
      recordAttemptFinished(
        scope,
        entryPoint,
        variables.request,
        variables.context,
        nextResult,
      );
      const rowCount = [
        variables.request.importPasswords,
        variables.request.importCookies,
        variables.request.importHistory,
        variables.request.importExtensions,
      ].filter((value) => value === true).length;
      if (!successful) {
        setResultState({ result, revealedRowCount: rowCount });
        return;
      }
      setResultState({ result, revealedRowCount: 0 });
      const initialDelay = Math.max(
        0,
        revealInitialDelayMs - (performance.now() - variables.startedAt),
      );
      await Promise.all(
        Array.from({ length: rowCount }, async (_value, index) => {
          const delay = initialDelay + index * revealRowDelayMs;
          if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
          setResultState({ result, revealedRowCount: index + 1 });
        }),
      );
    },
  });

  const profiles: Profile[] | undefined = profilesQuery.data;
  const selectedProfile =
    profiles?.find((profile) => profileKey(profile) === selectedProfileKey) ??
    profiles?.[0] ??
    null;
  const cookiesSelected = selectedProfile != null && importCookies;
  const passwordsSelected = selectedProfile != null && importPasswords;
  const historySelected = selectedProfile?.source === "chrome" && importHistory;
  const extensionsAvailable =
    extensionsFeatureEnabled &&
    selectedProfile?.source === "chrome" &&
    selectedProfile.hasExtensions != null;
  const extensionsSelected = extensionsAvailable && importExtensions;
  const isWindows =
    typeof document !== "undefined" &&
    document.documentElement.dataset.codexOs === "win32";
  const showCloseBrowserGuidance =
    isWindows ||
    (typeof document !== "undefined" &&
      document.documentElement.dataset.codexOs === "darwin");
  const requiresElevatedChromeConsent =
    isWindows &&
    selectedProfile?.source === "chrome" &&
    (cookiesSelected || passwordsSelected);
  const selectedKey =
    selectedProfile == null ? null : profileKey(selectedProfile);
  const elevatedChromeConsent =
    selectedKey != null && elevatedConsentProfileKey === selectedKey;

  const failedResult: ImportResult | null =
    mutation.isError && mutation.variables != null
      ? {
          source: mutation.variables.request.source,
          profilePath: mutation.variables.request.profilePath,
          ...(mutation.variables.request.importCookies === false
            ? {}
            : {
                cookies: { ...resultState?.result.cookies, status: "failed" },
              }),
          ...(mutation.variables.request.importPasswords === false
            ? {}
            : {
                passwords: {
                  ...resultState?.result.passwords,
                  status: "failed",
                },
              }),
          ...(mutation.variables.request.importHistory === true
            ? {
                history: {
                  discovered: 0,
                  imported: 0,
                  skippedExisting: 0,
                  skippedInvalid: 0,
                  failed: 0,
                  ...resultState?.result.history,
                  status: "failed",
                },
              }
            : {}),
          ...(mutation.variables.request.importExtensions === true
            ? {
                extensions: {
                  ...resultState?.result.extensions,
                  status: "failed",
                },
              }
            : {}),
        }
      : null;
  const result: ImportResult | null =
    mutation.isError && failedResult != null
      ? { ...resultState?.result, ...failedResult }
      : (resultState?.result ?? mutation.data ?? null);

  const recordClose = (reason: string) => {
    if (closeRecorded.current) return;
    closeRecorded.current = true;
    recordDialogClosed(scope, entryPoint, {
      flowId,
      attemptIndex: activeAttempt.current?.context.attemptIndex,
      source:
        activeAttempt.current?.request.source ??
        (adminNoticeRequired.current ? "chrome" : selectedProfile?.source),
      windowsChromeAdminApprovalNoticeRequired:
        activeAttempt.current?.context
          .windowsChromeAdminApprovalNoticeRequired ??
        adminNoticeRequired.current,
      windowsChromeAdminApprovalNoticeAcknowledged:
        activeAttempt.current?.context
          .windowsChromeAdminApprovalNoticeAcknowledged ??
        adminNoticeAcknowledged.current,
      exitState: mutation.isPending ? undefined : exitState.current,
      dismissalReason: reason,
    });
  };

  React.useEffect(() => {
    if (
      requiresElevatedChromeConsent &&
      selectedKey != null &&
      !adminNoticeRequired.current
    ) {
      adminNoticeRequired.current = true;
      recordAdminNoticeShown(scope, entryPoint, flowId);
    }
  }, [selectedKey, entryPoint, flowId, requiresElevatedChromeConsent, scope]);

  const close = (reason: string) => {
    if (mutation.isPending) return;
    recordClose(reason);
    onClose();
  };
  const startImport = (
    request: ImportRequest,
    priorContext?: AttemptContext,
    previousResult?: ImportResult,
  ) => {
    if (
      request.importExtensions &&
      !scope.get(browserExtensionsFeatureFamily, "2982604767")
    )
      return;
    const context: AttemptContext = {
      flowId,
      attemptIndex: (activeAttempt.current?.context.attemptIndex ?? 0) + 1,
      windowsChromeAdminApprovalNoticeRequired:
        priorContext?.windowsChromeAdminApprovalNoticeRequired ??
        Boolean(requiresElevatedChromeConsent),
      windowsChromeAdminApprovalNoticeAcknowledged:
        priorContext?.windowsChromeAdminApprovalNoticeAcknowledged ??
        elevatedChromeConsent,
    };
    activeAttempt.current = {
      context,
      previousResult,
      request,
      startedAt: performance.now(),
    };
    setResultState(
      previousResult == null
        ? undefined
        : { result: previousResult, revealedRowCount: 0 },
    );
    mutation.reset();
    recordAttemptStarted(scope, entryPoint, request, context);
    mutation.mutate(activeAttempt.current);
  };

  const importSelected = () => {
    if (extensionConfirmation != null) {
      startImport({
        ...extensionConfirmation.request,
        allowUnverifiedExtensions: true,
      });
      setExtensionConfirmation(null);
      return;
    }
    if (selectedProfile == null) return;
    const request = buildImportRequest(
      selectedProfile,
      Boolean(cookiesSelected),
      Boolean(passwordsSelected),
      Boolean(historySelected),
      Boolean(extensionsSelected),
      Boolean(requiresElevatedChromeConsent),
    );
    if (request.importExtensions) {
      setExtensionConfirmation({ profile: selectedProfile, request });
    } else {
      startImport(request);
    }
  };

  const retry =
    result == null
      ? undefined
      : () => {
          const attempt = activeAttempt.current;
          if (attempt == null) return;
          const passwordResults = [
            result.passwords,
            result.passwords?.profile,
            result.passwords?.account,
          ];
          const request = {
            ...attempt.request,
            importCookies:
              attempt.request.importCookies !== false &&
              shouldRetry(result.cookies),
            importPasswords:
              attempt.request.importPasswords !== false &&
              shouldRetry(...passwordResults),
            importHistory:
              attempt.request.importHistory === true &&
              shouldRetry(result.history),
            importExtensions:
              attempt.request.importExtensions === true &&
              shouldRetry(result.extensions),
          };
          if (!request.importCookies) delete request.cookieDomainAllowlist;
          startImport(request, attempt.context, result);
        };

  const content = jsx.jsx(ImportSelection, {
    activeImportRequest: mutation.variables?.request,
    confirmExtensionImport: extensionConfirmation != null,
    cookieAccessFailureMessage: undefined,
    elevatedChromeConsent,
    extensionsAvailable,
    importCookies,
    importExtensions,
    importHistory,
    importPasswords,
    isImporting: mutation.isPending,
    isLoadingProfiles: profilesQuery.isLoading,
    showCloseBrowserGuidance,
    profiles,
    profilesHaveError: profilesQuery.isError,
    requiresElevatedChromeConsent,
    result,
    revealedImportResultRowCount: resultState?.revealedRowCount,
    selectedProfile: extensionConfirmation?.profile ?? selectedProfile,
    onCancel: () => {
      if (extensionConfirmation == null) {
        close(result == null ? "secondary-button" : "done-button");
      } else {
        setExtensionConfirmation(null);
      }
    },
    onElevatedChromeConsentChange: (checked: boolean) => {
      if (checked && !adminNoticeAcknowledged.current) {
        adminNoticeAcknowledged.current = true;
        recordAdminNoticeAcknowledged(scope, entryPoint, flowId);
      }
      setElevatedConsentProfileKey(checked ? selectedKey : null);
    },
    onImport: importSelected,
    onImportCookiesChange: setImportCookies,
    onImportExtensionsChange: setImportExtensions,
    onImportHistoryChange: setImportHistory,
    onImportPasswordsChange: setImportPasswords,
    onProfilePickerOpenChange: undefined,
    onRetry: retry,
    onSelectProfile: (profile: Profile) => {
      setSelectedProfileKey(profileKey(profile));
      setElevatedConsentProfileKey(null);
      setResultState(undefined);
      mutation.reset();
    },
  });

  return jsx.jsx(Dialog, {
    contentProps: {
      onEscapeKeyDown: () => {
        dismissalReason.current = "escape-key";
      },
      onPointerDownOutside: () => {
        dismissalReason.current = "backdrop";
      },
    },
    open: true,
    onOpenChange: (open: boolean) => {
      if (!open) close(dismissalReason.current);
    },
    showDialogClose: !mutation.isPending && result == null,
    size: "default",
    children: content,
  });
}

function initializeBrowserProfileImportDialog(): void {
  initializeRuntimeLazy();
  initializeSignalRuntime();
  initializeDialog();
  initializeAppScope();
  initializeCheckControl();
  initializeClassNames();
  initializeMotionRuntime();
  initializeReactRuntime();
  initializeButton();
  initializeCheckbox();
  initializeDialogLayout();
  initializeMenu();
  initializeSettingsRow();
  initializeSettingsList();
  initializeMotion();
  initializeMinusIcon();
  initializeSuccessIcon();
  initializeSelectTrigger();
  initializeErrorIcon();
  initializeUseMutation();
  initializeUseQuery();
  initializeBrowserExtensionFeature();
  initializeBrowserImportState();
  initializeBrowserImportSettings();
  initializeBrowserImportRuntime();
  initializeWarningIcon();
  initializeBrowserImportAnalytics();
  initializeImportDataIcons();
  initializeImportMessages();
  initializeSourceIcons();
  initializeImportQueries();
}

initializeBrowserProfileImportDialog();

export { BrowserProfileImportDialogModal };
