// my-gpts-page — Created/shared GPT management, pagination, and row actions.

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
// @ts-ignore -- semantic dependency exists in the published renderer asset graph.
import * as directoryBannerChunk from "@rchunk/directory-banner";
import * as managementUrlChunk from "@rchunk/gpt-management-url";
import * as migratedAccessChunk from "@rchunk/migrated-plugin-access";
import * as migratedNoticeChunk from "@rchunk/migrated-plugin-notice";
import "@rchunk/rolldown-runtime";
import * as skillsGridChunk from "@rchunk/skills-page-grid";
import * as tabsChunk from "@rchunk/security-tabs";

interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: unknown, key?: string): unknown;
  jsxs(type: unknown, props: unknown, key?: string): unknown;
}

interface ReactRuntime {
  useState<Value>(value: Value): [Value, (next: Value) => void];
}

interface IntlShape {
  formatMessage(descriptor: MessageDescriptor): string;
}

interface MessageDescriptor {
  defaultMessage: string;
  description: string;
  id: string;
  values?: Record<string, unknown>;
}

interface FeatureConfig {
  get(name: string, fallback?: boolean): boolean;
}

interface Account {
  account_user_id?: string | null;
  id: string;
  name: string;
  structure: "personal" | "workspace";
}

interface GptPermission {
  can_delete?: boolean;
  can_write?: boolean;
}

interface GptResource {
  gizmo: {
    author: { user_id?: string | null };
    current_user_permission?: GptPermission;
    display: {
      description?: string;
      name: string;
      profile_picture_url?: string | null;
    };
    id: string;
    live_version?: number | null;
    migrated_plugin_id?: string | null;
    share_recipient?: string | null;
    vanity_metrics?: { num_conversations_str?: string | null } | null;
    workspace_id?: string | null;
  };
}

interface GptPage {
  list: {
    cursor?: string | null;
    items: Array<{ resource: GptResource }>;
  };
}

interface InfiniteQueryResult {
  data?: { pages: GptPage[] } | null;
  fetchNextPage(): Promise<unknown> | unknown;
  hasNextPage?: boolean;
  isFetchNextPageError?: boolean;
  isFetchingNextPage?: boolean;
  isPending?: boolean;
  refetch(): Promise<unknown> | unknown;
}

interface Scope {
  queryClient: {
    refetchQueries(input: { queryKey: string[] }): Promise<unknown> | unknown;
  };
}

interface AppSharedApi {
  $3(): void;
  $I(): void;
  $O: { ONE_MINUTE: number };
  BX<Value>(family: unknown, parameter: string, options?: { enabled: boolean }): { data?: Value };
  FX(): void;
  H3(): void;
  I3(): JsxRuntime;
  Jm(loader: () => Promise<unknown>): unknown;
  K2(): void;
  Kv: unknown;
  Kx: unknown;
  LX(scope: unknown): Scope;
  QI(): void;
  Xv: unknown;
  Y2: unknown;
  YC: unknown;
  Yh: unknown;
  ZI: unknown;
  Zh(): void;
  c_(): void;
  cb: unknown;
  e6(): ReactRuntime;
  eL(options: Record<string, unknown>): InfiniteQueryResult;
  ek(): void;
  lw(): void;
  mx: unknown;
  n4(): IntlShape;
  o_: unknown;
  qm(): void;
}

interface AppInitialApi {
  $d(): void;
  Dft(): void;
  Dln: unknown;
  F7(scope: unknown, conversationId: null): void;
  Het(): void;
  Jet(scope: unknown, mode: string): void;
  M6t(): void;
  N6t(): { accountId: string | null; userId: string | null };
  Oft(input: Record<string, unknown>): void;
  Oln(): void;
  P7(): void;
  Qd: unknown;
  Qgn(): void;
  Uzt(scope: unknown, component: unknown, props: Record<string, unknown>): void;
  Vzt(): void;
  Ygn: unknown;
  _tn: string;
  afn(key: string): FeatureConfig;
  cT: unknown;
  f7: { Header: unknown & { Toolbar: unknown }; HeaderToolbar: unknown & { Actions: unknown } };
  gmn(): unknown;
  iE(): void;
  ifn(): void;
  lT: unknown;
  o_n(): (destination: unknown) => void;
  ofn(key: string): boolean;
  p7(): void;
  rE: string;
  rht(): void;
  sfn(key: string): boolean;
  uT(): void;
  uht(accountId?: string, options?: { preview: boolean }): {
    data?: Account | null;
    isError?: boolean;
  };
  xtn(): void;
  ytn(gptId: string): string;
}

interface DirectoryBannerApi {
  a: (props: { onRetry(): void }) => unknown;
  d(): void;
  i(): void;
  l(): void;
  n(): void;
  o: () => unknown;
  r: () => unknown;
  t: (props: { showMigrationAction: boolean }) => unknown;
  u(input: { cutId: string; cursor?: unknown; limit: number; signal?: unknown }): Promise<GptPage>;
}

interface MigratedAccessApi {
  i(account: Account, workspaceGate: boolean, permissions?: string[]): boolean;
  r(input: {
    resource: GptResource;
    account: Account;
    accountId: string | null;
    userId: string | null;
    enabled: boolean;
  }): boolean;
}

const {
  $3: initializeCompilerRuntime,
  $I: initializeInteropRuntime,
  $O: timeConstants,
  BX: useSignalFamilyValue,
  FX: initializeSignalRuntime,
  H3: initializeSharedComponents,
  I3: getJsxRuntime,
  Jm: lazy,
  K2: initializeIntlRuntime,
  Kv: WorkspaceIcon,
  Kx: EditIcon,
  LX: useScope,
  QI: initializeScopeRuntime,
  Xv: ChatsIcon,
  Y2: FormattedMessage,
  YC: DeleteIcon,
  Yh: Button,
  ZI: applicationScope,
  Zh: initializeButton,
  c_: initializeTooltip,
  cb: PublicIcon,
  e6: getReactRuntime,
  eL: useInfiniteQuery,
  ek: initializeQueryRuntime,
  lw: initializeReactQueryRuntime,
  mx: PrivateIcon,
  n4: useIntl,
  o_: Tooltip,
  qm: initializeIcons,
} = appSharedChunk as unknown as AppSharedApi;

const {
  $d: initializeAccountChecks,
  Dft: initializeExternalLinks,
  Dln: workspacePermissionsFamily,
  F7: clearConversation,
  Het: initializeAccountRuntime,
  Jet: setConversationMode,
  M6t: initializeGptResources,
  N6t: useSessionIdentity,
  Oft: openExternalLink,
  Oln: initializeWorkspacePermissions,
  P7: initializeRouteRuntime,
  Qd: GptAvatar,
  Qgn: initializeAuthentication,
  Uzt: openDialog,
  Vzt: initializeDialogRuntime,
  Ygn: Redirect,
  _tn: homeRoute,
  afn: getExperiment,
  cT: Inset,
  f7: AppHeader,
  gmn: initializeUniqByRuntime,
  iE: initializeNavigationRuntime,
  ifn: initializeFeatureGates,
  lT: PageLayout,
  o_n: useNavigate,
  ofn: useFeatureGate,
  p7: initializePageRuntime,
  rE: gptBuilderRoute,
  rht: initializeAccountQueries,
  sfn: useFeatureGateLoading,
  uT: initializeComposerRuntime,
  uht: useAccount,
  xtn: initializeConversationRouting,
  ytn: buildGptConversationRoute,
} = appInitialChunk as unknown as AppInitialApi;

const {
  a: ErrorState,
  d: initializeDirectoryQueries,
  i: initializeDirectoryActions,
  l: initializeDirectoryLayout,
  n: initializeDirectoryBanner,
  o: LoadingState,
  r: CreateGptAction,
  t: DirectoryBanner,
  u: fetchGpts,
} = directoryBannerChunk as unknown as DirectoryBannerApi;

const { n: initializeTabs, t: Tabs } = tabsChunk;
const { r: initializeSkillsGrid, t: SkillsGrid } = skillsGridChunk;
const { i: hasMigrationWorkspaceAccess, r: canMigrateResource } =
  migratedAccessChunk as unknown as MigratedAccessApi;
const { n: initializeManagementUrl, t: buildGptManagementUrl } = managementUrlChunk;
const { r: initializeMigratedNotice, t: MigratedPluginNotice } = migratedNoticeChunk;

const ACCOUNT_QUERY_OPTIONS = { preview: false };
const PAGE_SIZE = 20;

let React: ReactRuntime;
let jsx: JsxRuntime;
let MigrationDialog: unknown;
let DeleteDialog: unknown;
let initialized = false;

function message(descriptor: MessageDescriptor): unknown {
  return jsx.jsx(FormattedMessage, descriptor);
}

function initializeMyGptsPage(): void {
  if (initialized) return;
  initializeCompilerRuntime();
  initializeInteropRuntime();
  initializeSignalRuntime();
  initializeSharedComponents();
  initializeIntlRuntime();
  initializeScopeRuntime();
  initializeButton();
  initializeTooltip();
  initializeQueryRuntime();
  initializeReactQueryRuntime();
  initializeIcons();
  initializeAccountChecks();
  initializeExternalLinks();
  initializeAccountRuntime();
  initializeGptResources();
  initializeWorkspacePermissions();
  initializeRouteRuntime();
  initializeAuthentication();
  initializeDialogRuntime();
  initializeUniqByRuntime();
  initializeNavigationRuntime();
  initializeFeatureGates();
  initializePageRuntime();
  initializeAccountQueries();
  initializeComposerRuntime();
  initializeConversationRouting();
  initializeTabs();
  initializeSkillsGrid();
  initializeDirectoryQueries();
  initializeDirectoryActions();
  initializeDirectoryLayout();
  initializeDirectoryBanner();
  initializeManagementUrl();
  initializeMigratedNotice();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  MigrationDialog = lazy(async () => {
    const module = await import("@rchunk/gpt-plugin-migration-dialog");
    return { default: module.GptPluginMigrationDialog };
  });
  DeleteDialog = lazy(async () => {
    const module = await import("@rchunk/my-gpt-delete-dialog");
    return { default: module.MyGptDeleteDialog };
  });
  initialized = true;
}

function AudienceDetails({ resource, account }: { resource: GptResource; account: Account }): unknown {
  const recipient = resource.gizmo.share_recipient ?? "private";
  const count = resource.gizmo.vanity_metrics?.num_conversations_str;
  const audienceIcon =
    recipient === "link" || recipient === "marketplace"
      ? PublicIcon
      : recipient === "workspace" || recipient === "workspace_link"
        ? WorkspaceIcon
        : PrivateIcon;
  const audienceCopy: Record<string, MessageDescriptor> = {
    link: { id: "chatgptConversations.gpts.mine.audience.link", defaultMessage: "Anyone with the link", description: "GPT link audience" },
    marketplace: { id: "chatgptConversations.gpts.mine.audience.public", defaultMessage: "Everyone", description: "GPT public audience" },
    workspace: { id: "chatgptConversations.gpts.mine.audience.workspace", defaultMessage: "Anyone at {workspaceName}", description: "GPT workspace audience", values: { workspaceName: account.name } },
    workspace_link: { id: "chatgptConversations.gpts.mine.audience.workspaceLink", defaultMessage: "Anyone at {workspaceName} with the link", description: "GPT workspace-link audience", values: { workspaceName: account.name } },
    email: { id: "chatgptConversations.gpts.mine.audience.invited", defaultMessage: "Invite only", description: "GPT invited audience" },
    group: { id: "chatgptConversations.gpts.mine.audience.invited", defaultMessage: "Invite only", description: "GPT invited audience" },
    user: { id: "chatgptConversations.gpts.mine.audience.invited", defaultMessage: "Invite only", description: "GPT invited audience" },
    private: { id: "chatgptConversations.gpts.mine.audience.private", defaultMessage: "Only me", description: "GPT private audience" },
  };
  return jsx.jsxs("div", {
    className: "flex min-w-0 flex-col gap-1 text-sm text-secondary select-none",
    children: [
      recipient !== "private" && count != null
        ? jsx.jsxs("div", { className: "flex items-center gap-1.5", children: [jsx.jsx(ChatsIcon, {}), message({ id: "chatgptConversations.gpts.mine.chats", defaultMessage: "{count} chats", description: "GPT usage count", values: { count } })] })
        : null,
      jsx.jsxs("div", { className: "flex items-center gap-1.5", children: [jsx.jsx(audienceIcon, {}), jsx.jsx("span", { className: "truncate", children: message(audienceCopy[recipient] ?? audienceCopy.private) })] }),
    ],
  });
}

function GptRow({ resource, account }: { resource: GptResource; account: Account }): unknown {
  const scope = useScope(applicationScope);
  const intl = useIntl();
  const navigate = useNavigate();
  const { accountId, userId } = useSessionIdentity();
  const migrationEnabled = useFeatureGate("2160578039");
  const workspaceMigrationEnabled = useFeatureGate("1355972088");
  const migrationExperiment = getExperiment("2562735250").get("enabled", false);
  const controlsExperiment = getExperiment("2826703856").get("enable_gpt_fe_controls", false);
  const updatesDisabled = getExperiment("2513446768").get("disable_gpt_updates", false);
  const permissionsEnabled = account.structure === "workspace" && (workspaceMigrationEnabled || controlsExperiment);
  const { data: workspacePermissions } = useSignalFamilyValue<{ permissions?: string[] }>(workspacePermissionsFamily, account.id, { enabled: permissionsEnabled });
  const pluginId = migrationEnabled ? resource.gizmo.migrated_plugin_id ?? null : null;
  const draft = (resource.gizmo.live_version ?? 0) === 0 && pluginId == null;
  const displayName = resource.gizmo.display.name.trim() || intl.formatMessage({ id: "chatgptConversations.gpts.mine.untitled", defaultMessage: "Untitled", description: "Fallback GPT name" });
  const controlsAllowed = !controlsExperiment || account.structure === "personal" || workspacePermissions?.permissions?.includes("chatgpt.workspace.gpt.crud") === true;
  const isOwner = pluginId != null && resource.gizmo.author.user_id === (account.structure === "personal" ? userId : account.account_user_id) && (resource.gizmo.workspace_id ?? null) === (account.structure === "workspace" ? account.id : null);
  const canWrite = controlsAllowed && (isOwner || resource.gizmo.current_user_permission?.can_write === true);
  const canDelete = controlsAllowed && (isOwner || resource.gizmo.current_user_permission?.can_delete === true);
  const migrationAllowed = migrationEnabled && migrationExperiment && hasMigrationWorkspaceAccess(account, workspaceMigrationEnabled, workspacePermissions?.permissions) && canMigrateResource({ resource, account, accountId, userId, enabled: migrationEnabled });
  const editLabel = intl.formatMessage({ id: "chatgptConversations.gpts.mine.edit", defaultMessage: "Edit GPT", description: "Edit GPT action" });
  const deleteLabel = intl.formatMessage({ id: "chatgptConversations.gpts.mine.delete", defaultMessage: "Delete GPT", description: "Delete GPT action" });
  const edit = (event: unknown): void => {
    if (draft) {
      navigate({ pathname: gptBuilderRoute, search: new URLSearchParams({ gizmo: resource.gizmo.id }).toString() });
      return;
    }
    openExternalLink({ event, href: `${buildGptManagementUrl("/gpts/editor")}/${encodeURIComponent(resource.gizmo.id)}`, initiator: "open_in_browser_bridge", openTarget: "external-browser" });
  };
  const open = (event: unknown): void => {
    if (draft) edit(event);
    else {
      setConversationMode(scope, "chat");
      clearConversation(scope, null);
      navigate(buildGptConversationRoute(resource.gizmo.id));
    }
  };
  const migrationAction = pluginId != null
    ? jsx.jsx(MigratedPluginNotice, { pluginId, presentation: "row" })
    : migrationAllowed
      ? jsx.jsx(Button, { className: "w-full", color: "primary", size: "entityRowAction", onClick: () => openDialog(scope, MigrationDialog, { resource }), children: message({ id: "chatgptConversations.gpts.mine.migrate", defaultMessage: "Migrate to plugin", description: "Migrate GPT action" }) })
      : null;
  const iconUrl = resource.gizmo.display.profile_picture_url ?? null;
  const draftDisabled = draft && (!canWrite || updatesDisabled);
  return jsx.jsxs("div", {
    role: "listitem",
    className: "flex flex-wrap items-center gap-x-6 gap-y-3 py-4 @lg:flex-nowrap",
    children: [
      jsx.jsxs("div", { className: "flex min-w-0 flex-1 basis-full items-center gap-6 @lg:basis-auto", children: [
        jsx.jsxs("button", { type: "button", "aria-label": displayName, className: "flex min-w-0 flex-1 cursor-interaction items-center gap-3 text-start select-none", disabled: draftDisabled, onClick: open, children: [
          jsx.jsx(GptAvatar, { customGpt: { id: resource.gizmo.id, name: displayName, iconUrl }, presentation: "avatar", className: "size-8 shrink-0" }),
          jsx.jsxs("div", { className: "min-w-0 flex-1", children: [jsx.jsxs("div", { className: "flex items-center gap-2", children: [jsx.jsx("span", { className: "truncate text-base font-semibold text-default", children: displayName }), draft ? jsx.jsx(Tooltip, { tooltipContent: message({ id: "chatgptConversations.gpts.mine.draft", defaultMessage: "Draft", description: "Draft GPT status" }), children: jsx.jsx("span", { className: "size-1.5 shrink-0 rounded-full bg-text-tertiary/30" }) }) : null] }), jsx.jsx("p", { className: "min-h-5 truncate text-sm text-secondary", children: resource.gizmo.display.description })] }),
        ] }),
        jsx.jsx("div", { className: "hidden w-50 shrink-0 @2xl:block", children: jsx.jsx(AudienceDetails, { resource, account }) }),
      ] }),
      jsx.jsx("div", { className: "basis-full @2xl:hidden", children: jsx.jsx(AudienceDetails, { resource, account }) }),
      jsx.jsxs("div", { className: "ms-auto flex w-55.25 shrink-0 items-center justify-end gap-3", children: [
        jsx.jsx("div", { className: "flex w-34.25 shrink-0 justify-end", children: migrationAction }),
        jsx.jsxs("div", { className: "flex w-18 shrink-0 items-center", children: [
          canWrite ? jsx.jsx(Tooltip, { tooltipContent: pluginId == null ? editLabel : message({ id: "chatgptConversations.gpts.mine.editMigratedTooltip", defaultMessage: "This GPT has been migrated to a plugin and can no longer be edited", description: "Migrated GPT edit disabled" }), children: jsx.jsx(Button, { "aria-label": editLabel, color: "ghostActive", size: "entityHeader", disabled: updatesDisabled || pluginId != null, onClick: edit, children: jsx.jsx(EditIcon, {}) }) }) : null,
          canDelete ? jsx.jsx(Tooltip, { tooltipContent: pluginId == null ? deleteLabel : message({ id: "chatgptConversations.gpts.mine.deleteMigratedTooltip", defaultMessage: "This GPT has been migrated to a plugin and can no longer be deleted", description: "Migrated GPT delete disabled" }), children: jsx.jsx(Button, { "aria-label": deleteLabel, color: "ghostActive", size: "entityHeader", disabled: pluginId != null, onClick: () => openDialog(scope, DeleteDialog, { resource }), children: jsx.jsx(DeleteIcon, { className: "text-danger" }) }) }) : null,
        ] }),
      ] }),
    ],
  });
}

function uniqueResources(pages: GptPage[]): GptResource[] {
  const seen = new Set<string>();
  const resources: GptResource[] = [];
  for (const page of pages) {
    for (const item of page.list.items) {
      if (!seen.has(item.resource.gizmo.id)) {
        seen.add(item.resource.gizmo.id);
        resources.push(item.resource);
      }
    }
  }
  return resources;
}

function getNextPageParam(page: GptPage): string | undefined {
  return page.list.cursor ?? undefined;
}

function MyGptsContent({ account }: { account: Account }): unknown {
  const intl = useIntl();
  const [selectedTab, setSelectedTab] = React.useState("mine");
  const query = useInfiniteQuery({
    queryKey: ["chatgpt-gizmos", account.id, "my-gpts", selectedTab],
    initialPageParam: undefined,
    staleTime: timeConstants.ONE_MINUTE,
    getNextPageParam,
    queryFn: ({ pageParam, signal }: { pageParam?: unknown; signal?: unknown }) =>
      fetchGpts({ cutId: selectedTab, cursor: pageParam, limit: PAGE_SIZE, signal }),
  });
  let content: unknown;
  if (query.isPending) content = jsx.jsx(LoadingState, {});
  else if (query.data == null) content = jsx.jsx(ErrorState, { onRetry: () => void query.refetch() });
  else {
    const resources = uniqueResources(query.data.pages);
    content = jsx.jsxs(jsx.Fragment, { children: [
      jsx.jsx("div", { role: "list", className: "@container flex flex-col", children: resources.map((resource) => jsx.jsx(GptRow, { resource, account }, resource.gizmo.id)) }),
      resources.length === 0 && !query.hasNextPage ? jsx.jsx("p", { className: "py-6 text-sm text-secondary select-none", children: message(selectedTab === "shared_with_me" ? { id: "chatgptConversations.gpts.mine.sharedEmpty", defaultMessage: "No GPTs have been shared with you yet", description: "Shared GPTs empty state" } : { id: "chatgptConversations.gpts.mine.empty", defaultMessage: "No GPTs here yet", description: "Owned GPTs empty state" }) }) : null,
      query.hasNextPage ? jsx.jsx("div", { className: "flex justify-center", children: jsx.jsx(Button, { color: "secondary", loading: query.isFetchingNextPage, onClick: () => void query.fetchNextPage(), children: message(query.isFetchNextPageError ? { id: "chatgptConversations.gpts.mine.retryMore", defaultMessage: "Try again", description: "Retry GPT pagination" } : { id: "chatgptConversations.gpts.mine.loadMore", defaultMessage: "Load more", description: "Load more GPTs" }) }) }) : null,
    ] });
  }
  const controls = account.structure === "workspace"
    ? jsx.jsx(Inset, { inset: false, children: jsx.jsx(Tabs, { variant: "underline", ariaLabel: intl.formatMessage({ id: "chatgptConversations.gpts.mine.tabs", defaultMessage: "My GPTs", description: "My GPTs tabs" }), selectedKey: selectedTab, onSelect: setSelectedTab, tabs: [
      { key: "mine", name: message({ id: "chatgptConversations.gpts.mine.created", defaultMessage: "Created by me", description: "Owned GPTs tab" }) },
      { key: "shared_with_me", name: message({ id: "chatgptConversations.gpts.mine.shared", defaultMessage: "Shared with me", description: "Shared GPTs tab" }) },
    ] }) })
    : undefined;
  return jsx.jsxs("div", {
    className: "flex h-full min-h-0 flex-col bg-surface text-default",
    children: [
      jsx.jsx(AppHeader.Header, { className: "flex shrink-0 px-panel", children: jsx.jsx(AppHeader.HeaderToolbar, { children: jsx.jsx(AppHeader.HeaderToolbar.Actions, { children: jsx.jsx(CreateGptAction, {}) }) }) }),
      jsx.jsx(SkillsGrid, { className: "flex h-full w-full flex-1 flex-col gap-8", children: jsx.jsx(PageLayout, { animateContentLayout: false, headerVariant: "compact", title: message({ id: "chatgptConversations.gpts.mine.title", defaultMessage: "My GPTs", description: "My GPTs page title" }), banner: jsx.jsx(DirectoryBanner, { showMigrationAction: false }), controls, children: content }) }),
    ],
  });
}

function MyGptsPage(): unknown {
  const scope = useScope(applicationScope);
  const featureEnabled = useFeatureGate("2160578039");
  const featureLoading = useFeatureGateLoading("2160578039");
  const { accountId } = useSessionIdentity();
  const accountQuery = useAccount(undefined, ACCOUNT_QUERY_OPTIONS);
  if (featureLoading) return jsx.jsx(LoadingState, {});
  if (!featureEnabled) return jsx.jsx(Redirect, { to: homeRoute, replace: true });
  if (accountQuery.isError) return jsx.jsx(ErrorState, { onRetry: () => void scope.queryClient.refetchQueries({ queryKey: ["accounts", "check"] }) });
  if (accountQuery.data == null || accountQuery.data.id !== accountId) return jsx.jsx(LoadingState, {});
  return jsx.jsx(MyGptsContent, { account: accountQuery.data }, accountQuery.data.id);
}

initializeMyGptsPage();
export { MyGptsPage };
