// gpt-plugin-migration-dialog —— 将已发布 GPT 迁移为私有插件的完整确认与恢复流程。
// 原版：app/webview/assets/dialog-c6c651e2d1ee.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as migratedAccessChunk from "@rchunk/migrated-plugin-access";
import * as managementUrlChunk from "@rchunk/gpt-management-url";
import * as migratedNoticeChunk from "@rchunk/migrated-plugin-notice";
import * as failureChunk from "@rchunk/gpt-plugin-migration-failure";

void runtimeChunk;

const {
  $3: initializeRuntimeLazy,
  BX: useSignalFamilyValue,
  D: initializeDynamicConfiguration,
  FX: initializeSignalRuntime,
  I: initializeDialogRuntime,
  I3: jsxRuntime,
  Ih: Dialog,
  K2: initializeSharedComponents,
  LX: useSignalScope,
  Lh: DialogDescription,
  Oh: DialogBody,
  Ph: initializeDialogLayout,
  QI: initializeSharedRuntime,
  Rh: DialogTitle,
  Y2: FormattedMessage,
  Yh: Button,
  ZI: applicationScope,
  Zh: initializeButton,
  e6: reactRuntime,
  zh: DialogFooter,
} = appSharedChunk;
const {
  _L: useQuery,
  gL: initializeUseQuery,
  pL: defineQueryOptions,
} = appSharedChunk;
const {
  rJt: apiClient,
  q6t: normalizeConnectorId,
  o_n: useNavigate,
  N6t: useSessionIdentity,
  uht: useAccount,
  ofn: useFeatureGate,
  m0t: experimentFamily,
  Dln: workspacePermissionsFamily,
  u1: openPlugin,
  Oft: openExternalLink,
  Qgn: initializeAccountContext,
  Sun: initializeGptRoutes,
  Oln: initializeWorkspacePermissions,
  M6t: initializeGptResource,
  rht: initializeAccountQueries,
  Dft: initializeExternalLinkBridge,
  l1: initializeNavigation,
  ifn: initializeFeatureGates,
  p0t: initializeExperiments,
  cJt: initializeApiClient,
} = appInitialChunk;
const { r: canMigrateResource, i: hasMigrationWorkspaceAccess } =
  migratedAccessChunk;
const { t: buildGptManagementUrl, n: initializeGptManagementUrl } =
  managementUrlChunk;
const { n: MigratedPluginOpenAction, r: initializeMigratedPluginNotice } =
  migratedNoticeChunk;
const {
  i: migrationFailureFamily,
  t: MigrationFailureDetails,
  r: initializeMigrationFailureState,
  n: initializeMigrationFailureDetails,
} = failureChunk;

interface JsxRuntime {
  jsx(component: unknown, props: unknown, key?: string): unknown;
  jsxs(component: unknown, props: unknown, key?: string): unknown;
}

let jsx: JsxRuntime;
interface MigrationIssue extends Record<string, unknown> {
  code?: string;
  resource?: { type?: string };
}

interface MigratedConnector extends Record<string, unknown> {
  id: string;
  status?: string;
}

interface MigrationApps {
  disabledByAdmin: MigratedConnector[];
  unavailable: string[];
}

interface MigrationTool extends Record<string, unknown> {
  settings?: { action_ids?: unknown };
  type: string;
}

interface MigrationGizmo extends Record<string, unknown> {
  current_user_permission?: { can_write?: boolean };
  display: { name: string };
  gizmo_config_id?: string | null;
  gizmo_type: string;
  id: string;
  migrated_plugin_id?: string | null;
}

interface MigrationResource extends Record<string, unknown> {
  files?: unknown[];
  gizmo: MigrationGizmo;
  tools: MigrationTool[];
}

interface MigrationPreview {
  apps: MigrationApps | null;
  resource: MigrationResource;
}

type AppCheck =
  | { status: "loading" }
  | { status: "error"; httpStatus?: number }
  | {
      status: "ready";
      apps: MigrationApps | null;
    };
type MigrationError = {
  kind: "request" | "preview" | "validation" | "file_copy" | "unavailable";
  status?: number;
  errorCode?: string;
  backendMessage?: string;
  backendSuggestion?: string;
  issues?: MigrationIssue[];
  failedFiles?: unknown[];
};

interface MigrationDialogViewProps {
  appCheck?: AppCheck;
  canMigrate: boolean;
  editingDisabled: boolean;
  failedFiles: unknown[];
  failure?: MigrationError;
  hasCustomActions: boolean;
  isMigrating: boolean;
  modal?: boolean;
  onCheckApps?(): void;
  onClose(): void;
  onEdit?(event: unknown): void;
  onMigrate(): void;
  pluginAction?: unknown;
  pluginId?: string | null;
  portalContainer?: unknown;
  resource: MigrationResource;
  canPublishPlugin?: boolean;
  canSharePlugin?: boolean;
  sharingChecked?: boolean;
  sharingCheckFailed?: boolean;
}

interface GptPluginMigrationDialogProps {
  modal?: boolean;
  onClose(): void;
  onMigrated?(pluginId: string): void;
  onMigratingChange?(isMigrating: boolean): void;
  portalContainer?: unknown;
  resource: MigrationResource;
}

interface FormSubmitEvent {
  preventDefault(): void;
}

interface MigrationQueryClient {
  fetchQuery(options: unknown): Promise<MigrationPreview>;
  invalidateQueries(options: { queryKey: readonly unknown[] }): unknown;
}

interface ConnectorBatchResponse {
  connectors?: MigratedConnector[];
}

interface MigrationPostResponse {
  failed_files?: unknown[];
  plugin_id: string;
}

function objectRecord(value: unknown): Record<string, unknown> | undefined {
  return value != null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

function message(
  id: string,
  defaultMessage: string,
  description: string,
  values?: Record<string, unknown>,
): unknown {
  return jsx.jsx(FormattedMessage, { id, defaultMessage, description, values });
}

function parseMigrationError(error: unknown): MigrationError {
  const errorRecord = objectRecord(error);
  const status =
    typeof errorRecord?.status === "number" ? errorRecord.status : undefined;
  let detail: unknown;
  try {
    const payload: unknown = JSON.parse(
      typeof errorRecord?.message === "string" ? errorRecord.message : "",
    );
    detail = objectRecord(payload)?.detail ?? payload;
  } catch {
    detail = undefined;
  }
  const detailRecord = objectRecord(detail);
  const code =
    typeof detailRecord?.code === "string" ? detailRecord.code : undefined;
  const issues = Array.isArray(detailRecord?.issues)
    ? (detailRecord.issues.filter(objectRecord) as MigrationIssue[])
    : [];
  const failedFiles = Array.isArray(detailRecord?.failed_files)
    ? detailRecord.failed_files
    : [];
  if (code === "gpt_plugin_file_copy_failed")
    return {
      kind: "file_copy",
      issues,
      failedFiles,
    };
  if (code === "gpt_plugin_incompatible")
    return {
      kind: "validation",
      issues,
      failedFiles,
    };
  const errorCode =
    typeof detail === "string"
      ? detail
      : typeof detailRecord?.error_code === "string"
        ? detailRecord.error_code
        : code;
  return {
    kind: "request",
    status,
    errorCode,
    backendMessage:
      typeof detailRecord?.message === "string"
        ? detailRecord.message
        : undefined,
    backendSuggestion:
      typeof detailRecord?.suggestion === "string"
        ? detailRecord.suggestion
        : undefined,
  };
}

function failureCopy(
  error: MigrationError,
  editingDisabled: boolean,
): { description: unknown; title: unknown } {
  let title = "Migration failed";
  let description = "We couldn’t finish migration. Try again to continue.";
  if (error.kind === "preview") {
    title =
      error.status === 401
        ? "Sign in to continue"
        : "We couldn’t check this GPT";
    description =
      error.status === 401
        ? "Your session expired. Sign in again, then retry migration."
        : "We couldn’t load this GPT’s saved settings to check whether it’s ready to migrate";
  } else if (
    error.kind === "unavailable" ||
    error.status === 403 ||
    error.status === 404
  ) {
    title = "Migration unavailable";
    description = "We couldn’t confirm that this GPT is available to migrate";
  } else if (error.errorCode === "gpt_plugin_migration_editor_access_failed") {
    description =
      "Your plugin was created, but we couldn’t finish setting up your access. Try again.";
  } else if (error.status === 401) {
    title = "Sign in to continue";
    description = "Your session expired. Sign in again, then retry migration.";
  } else if (error.status === 409) {
    if (error.errorCode === "gpt_plugin_migration_in_progress") {
      title = "Migration is already running";
      description = "Wait up to 5 minutes, then try again";
    } else {
      title = "Something changed during migration";
      description =
        "The GPT, its owner, or the plugin changed. Try again to use the latest settings.";
    }
  } else if (error.kind === "validation" || error.kind === "file_copy") {
    const issues = error.issues ?? [];
    if (issues.some((issue) => issue.code === "skill_bundle_too_large")) {
      title = "Plugin exceeds the size limit";
      description = editingDisabled
        ? "This GPT can’t be migrated with its current settings. GPT editing and publishing are no longer available."
        : "The compressed skill bundle is larger than 25 MB. Reduce the GPT’s knowledge files before trying again.";
    } else if (
      issues.some((issue) => issue.resource?.type === "knowledge_file")
    ) {
      title = "Knowledge files couldn’t be copied";
      description =
        "We couldn’t copy some knowledge files to the plugin. Try again.";
    }
  } else if (error.status !== 500 && error.status !== 502) {
    title = "We couldn’t confirm migration";
    description =
      "Try again to check whether your plugin was created and continue migration";
  }
  if (error.backendMessage) {
    title = "Migration failed";
    description = error.backendMessage;
  }
  return {
    title: message(
      "chatgptConversations.gpts.migration.failure.title",
      title,
      "GPT migration failure title",
    ),
    description: message(
      "chatgptConversations.gpts.migration.failure.detail",
      description,
      "GPT migration failure detail",
    ),
  };
}

function connectorIds(resource: MigrationResource): string[] {
  const ids: string[] = resource.tools.flatMap((tool) => {
    if (tool.type !== "connector") return [];
    const values = tool.settings?.action_ids;
    return Array.isArray(values)
      ? values.filter(
          (value: unknown): value is string =>
            typeof value === "string" &&
            /^(?:asdk_app|connector|templated_apps)_[A-Za-z0-9][A-Za-z0-9_-]*$/.test(
              value,
            ),
        )
      : [];
  });
  return [...new Set(ids)];
}

async function checkRequiredApps(
  resource: MigrationResource,
  accountId: string,
  signal: AbortSignal,
): Promise<MigrationApps> {
  const ids = connectorIds(resource);
  if (ids.length === 0) return { unavailable: [], disabledByAdmin: [] };
  const response = await apiClient.safePost<ConnectorBatchResponse>(
    "/aip/connectors/batch",
    {
      surface: "plugin_management",
      parameters: { query: { apply_eligibility_filter: false } },
      requestBody: { connector_ids: ids, include_actions: false },
      additionalHeaders: {
        "ChatGPT-Account-ID": accountId,
        "OAI-Product-Sku": "CONNECTOR_SETTING",
      },
      expectedErrorStatuses: [401, 403, 404],
      signal,
    },
  );
  const connectors = response.connectors ?? [];
  const normalized = new Map(
    connectors.map((connector: MigratedConnector) => [
      normalizeConnectorId(connector.id),
      connector,
    ]),
  );
  return {
    unavailable: ids.filter((id) => !normalized.has(normalizeConnectorId(id))),
    disabledByAdmin: connectors.filter(
      (connector: MigratedConnector) =>
        connector.status === "DISABLED_BY_ADMIN",
    ),
  };
}

function ReadinessChecklist({
  appCheck,
  failure,
  hasCustomActions,
  sharingChecked,
  sharingCheckFailed,
  canSharePlugin,
  canPublishPlugin,
  editingDisabled,
}: Pick<
  MigrationDialogViewProps,
  | "appCheck"
  | "canPublishPlugin"
  | "canSharePlugin"
  | "editingDisabled"
  | "failure"
  | "hasCustomActions"
  | "sharingChecked"
  | "sharingCheckFailed"
>): unknown {
  const issues = failure?.issues ?? [];
  const oversized = issues.filter(
    (issue) =>
      issue.code === "knowledge_file_too_large" &&
      issue.resource?.type === "knowledge_file",
  );
  const unavailable =
    appCheck?.status === "ready" ? (appCheck.apps?.unavailable ?? []) : [];
  const disabled =
    appCheck?.status === "ready" ? (appCheck.apps?.disabledByAdmin ?? []) : [];
  const rows = [
    {
      label: "Instructions and files",
      status:
        oversized.length > 0
          ? `${oversized.length} file${oversized.length === 1 ? " is" : "s are"} too large`
          : "No issues found",
      warning: oversized.length > 0,
    },
    {
      label: "Apps and actions",
      status:
        appCheck?.status === "loading"
          ? "Checking…"
          : appCheck?.status === "error" || appCheck?.apps == null
            ? "Couldn’t check"
            : unavailable.length > 0
              ? "Apps unavailable"
              : disabled.length > 0
                ? "Apps disabled by admin"
                : hasCustomActions
                  ? "Unsupported actions"
                  : "No issues found",
      warning:
        unavailable.length > 0 || disabled.length > 0 || hasCustomActions,
    },
    {
      label: "Access and sharing",
      status: sharingCheckFailed
        ? "Couldn’t check sharing"
        : !sharingChecked
          ? "Workspace permissions apply"
          : canPublishPlugin
            ? "Publishing enabled"
            : canSharePlugin
              ? "Sharing enabled"
              : "Private plugin",
      warning: sharingCheckFailed,
    },
  ];
  return jsx.jsx("div", {
    className: "flex flex-col gap-3",
    children: rows.map((row) =>
      jsx.jsxs(
        "div",
        {
          className: "flex items-start justify-between gap-4 text-sm",
          children: [
            jsx.jsx("span", { children: row.label }),
            jsx.jsx("span", {
              className: row.warning ? "text-warning" : "text-secondary",
              children: row.status,
            }),
          ],
        },
        row.label,
      ),
    ),
  });
}

function MigrationDialogView(props: MigrationDialogViewProps): unknown {
  const {
    resource,
    appCheck,
    canMigrate,
    failure,
    failedFiles,
    pluginId,
    isMigrating,
    editingDisabled,
    onClose,
    onMigrate,
    onEdit,
    onCheckApps,
    pluginAction,
  } = props;
  const name = resource.gizmo.display.name.trim();
  const blockingApps =
    appCheck?.status === "ready" &&
    (appCheck.apps?.unavailable.length ?? 0) > 0;
  const failureContent =
    pluginId == null && failure != null
      ? failureCopy(failure, editingDisabled)
      : null;
  const title = failureContent
    ? failureContent.title
    : pluginId != null
      ? message(
          "chatgptConversations.gpts.migration.ready",
          "Your plugin is ready",
          "Title after GPT migration succeeds",
        )
      : message(
          "chatgptConversations.gpts.migration.title",
          name ? "Migrate {gptName}" : "Migrate Untitled GPT",
          "GPT migration confirmation title",
          name ? { gptName: name } : undefined,
        );
  const description = failureContent
    ? failureContent.description
    : pluginId != null
      ? message(
          "chatgptConversations.gpts.migration.successDescription",
          "Open your plugin to review and install it",
          "GPT migration success detail",
        )
      : !canMigrate && !isMigrating
        ? message(
            "chatgptConversations.gpts.migration.unavailable",
            "Migration isn't available for this GPT. Check that the GPT is saved and that you have permission to use plugins",
            "GPT migration unavailable detail",
          )
        : message(
            "chatgptConversations.gpts.migration.description",
            "Turn this GPT into a plugin using its instructions and knowledge files. It starts private. You can manage sharing afterward, within your workspace’s permissions.",
            "GPT migration description",
          );
  const checkFailed =
    pluginId == null &&
    (appCheck?.status === "error" ||
      (appCheck?.status === "ready" && appCheck.apps == null));
  let primaryAction: unknown;
  if (checkFailed)
    primaryAction = jsx.jsx(Button, {
      className: "w-full",
      color: "primary",
      size: "promotionalAction",
      type: "button",
      disabled: isMigrating || onCheckApps == null,
      onClick: onCheckApps,
      children: message(
        "chatgptConversations.gpts.migration.checkAppsAgain",
        "Check again",
        "Retry migration readiness checks",
      ),
    });
  else if (pluginId != null) primaryAction = pluginAction;
  else if (blockingApps && onEdit != null && !editingDisabled)
    primaryAction = jsx.jsx(Button, {
      className: "w-full",
      color: "primary",
      size: "promotionalAction",
      type: "button",
      onClick: onEdit,
      children: message(
        "chatgptConversations.gpts.migration.editGpt",
        "Edit GPT",
        "Open GPT editor to resolve migration blockers",
      ),
    });
  else
    primaryAction = jsx.jsx(Button, {
      className: "w-full",
      color: "primary",
      size: "promotionalAction",
      disabled: !canMigrate || blockingApps,
      loading: isMigrating,
      spinnerVariant: "rays",
      type: "submit",
      children: message(
        "chatgptConversations.gpts.migration.confirm",
        isMigrating ? "Migrating" : "Migrate to plugin",
        "Confirm GPT migration",
      ),
    });
  const body = jsx.jsxs("div", {
    className: "flex flex-col gap-8 p-6 pt-14 text-start sm:p-10",
    children: [
      jsx.jsxs("div", {
        className: "flex flex-col gap-4",
        children: [
          jsx.jsx(DialogTitle, {
            className:
              "text-center text-heading-lg leading-7 font-semibold wrap-anywhere select-none",
            children: title,
          }),
          jsx.jsx(DialogDescription, {
            className:
              "text-center text-sm leading-5 text-secondary select-none",
            "aria-live": "polite",
            role: failureContent ? "alert" : undefined,
            children: description,
          }),
        ],
      }),
      pluginId == null && failureContent == null
        ? jsx.jsx(ReadinessChecklist, props)
        : null,
      isMigrating
        ? jsx.jsx("p", {
            className: "sr-only",
            role: "status",
            children: "Creating your plugin…",
          })
        : null,
      failedFiles?.length
        ? jsx.jsx(MigrationFailureDetails, {
            failedFiles,
            files: resource.files,
            migrationSucceeded: pluginId != null,
          })
        : null,
      jsx.jsxs(DialogFooter, {
        className: "flex-col text-center",
        expandSingleButton: false,
        children: [
          primaryAction,
          jsx.jsx(Button, {
            color: "ghostSecondary",
            size: "promotionalLink",
            disabled: isMigrating,
            type: "button",
            onClick: onClose,
            children: pluginId != null ? "Done" : "Migrate later",
          }),
        ],
      }),
    ],
  });
  const form = jsx.jsx(DialogBody, {
    as: "form",
    size: "viewport",
    variant: "chatgpt",
    onSubmit: (event: FormSubmitEvent) => {
      event.preventDefault();
      if (!isMigrating && canMigrate && !blockingApps && pluginId == null)
        onMigrate();
    },
    children: body,
  });
  return jsx.jsx(Dialog, {
    open: true,
    modal: props.modal,
    portalContainer: props.portalContainer,
    showDialogClose: !isMigrating,
    shouldIgnoreClickOutside: isMigrating,
    size: "beacon",
    closeButtonSize: "large",
    variant: "promotional",
    onOpenChange: (open: boolean) => {
      if (!open && !isMigrating) onClose();
    },
    children: form,
  });
}

function GptPluginMigrationDialog({
  resource,
  onClose,
  onMigratingChange,
  onMigrated,
  modal,
  portalContainer,
}: GptPluginMigrationDialogProps): unknown {
  initializeGptPluginMigrationDialog();
  const React =
    typeof reactRuntime === "function" ? reactRuntime() : reactRuntime;
  const scope = useSignalScope?.(applicationScope);
  const navigate = useNavigate();
  const { accountId, userId } = useSessionIdentity();
  const account = useAccount(undefined, { preview: false }).data;
  const eligibilityGate = useFeatureGate("2160578039");
  const migrationEnabled =
    useSignalFamilyValue(experimentFamily, "2562735250").get(
      "enabled",
      false,
    ) ?? false;
  const editingDisabled =
    useSignalFamilyValue(experimentFamily, "2513446768").get<boolean>(
      "disable_gpt_updates",
      false,
    ) === true;
  const workspaceGate = useFeatureGate("1355972088");
  const workspacePermissions = useSignalFamilyValue(
    workspacePermissionsFamily,
    accountId ?? "",
    {
      enabled:
        accountId != null &&
        account?.id === accountId &&
        account?.structure === "workspace",
    },
  )?.data?.permissions;
  const [pluginId, setPluginId] = React.useState(
    resource.gizmo.migrated_plugin_id,
  );
  const [allowMigrated, setAllowMigrated] = React.useState(false);
  const [isMigrating, setMigrating] = React.useState(false);
  const [failure, setFailure] = React.useState(undefined);
  const [failedFiles, setFailedFiles] = React.useState([] as unknown[]);
  const inFlight = React.useRef(false);
  const canMigrate =
    migrationEnabled &&
    canMigrateResource({
      resource,
      account,
      accountId,
      userId,
      enabled: eligibilityGate,
      allowMigrated,
    }) &&
    hasMigrationWorkspaceAccess(account, workspaceGate, workspacePermissions);
  const previewQuery = defineQueryOptions({
    queryKey: [
      "chatgpt-gizmos",
      "migration-preview",
      accountId,
      userId,
      resource.gizmo.id,
      resource.gizmo.gizmo_config_id,
    ],
    queryFn: async ({
      signal,
    }: {
      signal: AbortSignal;
    }): Promise<MigrationPreview> => {
      if (accountId == null) throw Error("GPT migration requires an account");
      const latest = await apiClient.safeGet<MigrationResource>(
        "/gizmos/{gizmo_id_or_short_url}",
        {
          parameters: {
            path: { gizmo_id_or_short_url: resource.gizmo.id },
          },
          additionalHeaders: { "ChatGPT-Account-ID": accountId },
          expectedErrorStatuses: [401, 403, 404],
          signal,
        },
      );
      return {
        resource: latest,
        apps:
          latest.gizmo.migrated_plugin_id == null
            ? await checkRequiredApps(latest, accountId, signal).catch(() => {
                signal.throwIfAborted?.();
                return null;
              })
            : { unavailable: [], disabledByAdmin: [] },
      };
    },
    enabled: canMigrate && pluginId == null,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  const preview = useQuery<MigrationPreview>(previewQuery);
  const appCheck: AppCheck = preview.isFetching
    ? { status: "loading" }
    : preview.isError
      ? {
          status: "error",
          httpStatus: parseMigrationError(preview.error).status,
        }
      : preview.data == null
        ? { status: "loading" }
        : { status: "ready", apps: preview.data.apps };
  const latestResource = preview.data?.resource ?? resource;
  const hasCustomActions = latestResource.tools?.some(
    (tool) => tool.type === "plugins_prototype",
  );
  const blockedByApps =
    appCheck.status === "ready" && (appCheck.apps?.unavailable.length ?? 0) > 0;
  const close = () => {
    if (!inFlight.current) onClose();
  };
  const migrate = () => {
    if (inFlight.current || pluginId != null || !canMigrate || blockedByApps)
      return;
    inFlight.current = true;
    setMigrating(true);
    onMigratingChange?.(true);
    setFailure(undefined);
    setFailedFiles([]);
    const execute = async () => {
      const queryClient = scope.queryClient as MigrationQueryClient;
      const latest =
        (await queryClient.fetchQuery(previewQuery)) ?? preview.data;
      if (latest == null) return;
      let destinationPluginId = latest.resource.gizmo.migrated_plugin_id;
      if (destinationPluginId == null || allowMigrated) {
        const configId = latest.resource.gizmo.gizmo_config_id;
        if (!configId)
          throw Error("Missing published GPT configuration for migration");
        const result = await apiClient.safePost<MigrationPostResponse>(
          "/gizmos/{gizmo_id}/migrate/plugin",
          {
            parameters: { path: { gizmo_id: latest.resource.gizmo.id } },
            requestBody: { gizmo_config_id: configId },
            expectedErrorStatuses: [400, 401, 403, 404, 409, 502],
          },
        );
        destinationPluginId = result.plugin_id;
        setFailedFiles(result.failed_files ?? []);
        setAllowMigrated(false);
      }
      setPluginId(destinationPluginId);
      queryClient.invalidateQueries({ queryKey: ["chatgpt-gizmos"] });
      if (
        (scope.get(
          migrationFailureFamily,
          `${accountId}:${destinationPluginId}`,
        )?.failedFiles?.length ?? 0) === 0
      ) {
        onClose();
        if (onMigrated == null) openPlugin(destinationPluginId, navigate);
        else onMigrated(destinationPluginId);
      }
    };
    void execute()
      .catch((error) => {
        const parsed = parseMigrationError(error);
        if (
          parsed.kind === "request" &&
          parsed.errorCode === "gpt_plugin_migration_editor_access_failed"
        )
          setAllowMigrated(true);
        setFailure(parsed);
      })
      .finally(() => {
        inFlight.current = false;
        setMigrating(false);
        onMigratingChange?.(false);
      });
  };
  const canEdit =
    appCheck.status === "ready" &&
    !editingDisabled &&
    latestResource.gizmo.current_user_permission?.can_write &&
    !latestResource.gizmo.migrated_plugin_id;
  const onEdit = canEdit
    ? (event: unknown) => {
        close();
        openExternalLink({
          event,
          href: `${buildGptManagementUrl("/gpts/editor")}/${encodeURIComponent(resource.gizmo.id)}`,
          initiator: "open_in_browser_bridge",
          openTarget: "external-browser",
        });
      }
    : undefined;
  const pluginAction =
    pluginId == null
      ? undefined
      : jsx.jsx(MigratedPluginOpenAction, {
          onOpen: () => {
            close();
            openPlugin(pluginId, navigate);
          },
        });
  return jsx.jsx(MigrationDialogView, {
    resource: latestResource,
    appCheck: canMigrate ? appCheck : undefined,
    canMigrate,
    failedFiles,
    failure,
    hasCustomActions,
    editingDisabled,
    isMigrating,
    modal,
    pluginAction,
    pluginId,
    portalContainer,
    onCheckApps: () => void preview.refetch?.(),
    onClose: close,
    onEdit,
    onMigrate: migrate,
  });
}

let initialized = false;
function initializeGptPluginMigrationDialog(): void {
  if (initialized) return;
  initializeRuntimeLazy?.();
  initializeUseQuery();
  initializeSignalRuntime?.();
  initializeSharedComponents?.();
  initializeAccountContext?.();
  initializeDynamicConfiguration?.();
  initializeGptRoutes?.();
  initializeWorkspacePermissions?.();
  initializeGptResource?.();
  initializeAccountQueries?.();
  initializeButton?.();
  initializeDialogRuntime?.();
  initializeDialogLayout?.();
  initializeExternalLinkBridge?.();
  initializeNavigation?.();
  initializeSharedRuntime?.();
  initializeFeatureGates?.();
  initializeExperiments?.();
  initializeApiClient?.();
  initializeMigrationFailureState?.();
  initializeMigrationFailureDetails?.();
  initializeGptManagementUrl?.();
  initializeMigratedPluginNotice?.();
  jsx = typeof jsxRuntime === "function" ? jsxRuntime() : jsxRuntime;
  initialized = true;
}

initializeGptPluginMigrationDialog();
export { GptPluginMigrationDialog };
