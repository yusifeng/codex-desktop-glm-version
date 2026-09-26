// gpt-plugin-migration-notices —— GPT 迁移、退役与工作区权限公告。
// 原版：app/webview/assets/notices-dbed4ccd62e0.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as retirementChunk from "@rchunk/gpt-plugin-retirement";
import * as migratedAccessChunk from "@rchunk/migrated-plugin-access";
import type {
  JsxRuntime,
  IntlShape,
} from "@rchunk/app-shared";
import type { Experiment } from "@rchunk/app-initial";

void runtimeChunk;

interface NoticeState {
  canUsePlugins: boolean;
  deadline: string;
  intl: IntlShape;
  retirementExperiment: Experiment;
}

export interface MigrationNoticeProps {
  onDismiss?: () => void;
  onMigrate?: () => void;
  surface: string;
}

export interface WorkspacePluginsBlockedNoticeProps {
  deadline?: number;
  onKeepUsingGpt?: () => void;
  surface: "directory" | "gpt" | "migrated";
}

export interface RetirementNoticeProps {
  actionPlacement?: "inline" | "below";
  currentGpt?: boolean;
  onExplore?: (event: unknown) => void;
}

const {
  $3: initializeRuntimeLazy,
  BX: useSignalFamilyValue,
  C_: initializeIconAsset,
  FX: initializeSignalRuntime,
  I3: getJsxRuntime,
  K2: initializeReactRuntime,
  S_: IconAsset,
  Tl: pluginMigrationIcon,
  Y2: FormattedMessage,
  Yh: Button,
  Zh: initializeButton,
  c_: initializeTooltip,
  lw: initializeMigrationIcons,
  n4: useIntl,
  o_: Tooltip,
  sw: CloseIcon,
  wl: initializeCloseIcon,
} = appSharedChunk;
const {
  Dft: initializeOpenExternalLink,
  Dln: workspacePermissionsQuery,
  M6t: initializeSessionAccount,
  N6t: useSessionAccount,
  Oft: openExternalLink,
  Oln: initializeNavigation,
  afn: getExperiment,
  ifn: initializeMigrationExperiments,
  n7: AnnouncementBanner,
  ofn: isGateEnabled,
  r7: initializeAccountPlan,
  rht: initializeAccountQuery,
  uht: useAccountQuery,
} = appInitialChunk;
const {
  n: getHelpCenterUrl,
  r: initializePluginRetirement,
  t: parseRetirementDate,
} = retirementChunk;
const { i: canAccountUseMigratedPlugins } = migratedAccessChunk;

let jsx: JsxRuntime;

function message(
  id: string,
  defaultMessage: string,
  description: string,
  values?: Record<string, unknown>,
): unknown {
  return jsx.jsx(FormattedMessage, { id, defaultMessage, description, values });
}

function useNoticeState(): NoticeState {
  const intl = useIntl();
  const migrationExperiment = getExperiment("2562735250");
  const retirementExperiment = getExperiment("2513446768");
  const migrationEnabled = migrationExperiment.get("enabled", false);
  const { accountId } = useSessionAccount();
  const account = useAccountQuery(undefined, { preview: false }).data;
  const workspaceGate = isGateEnabled("1355972088");
  const queryEnabled =
    accountId != null &&
    account?.id === accountId &&
    account?.structure === "workspace" &&
    workspaceGate;
  const permissions = useSignalFamilyValue(workspacePermissionsQuery, accountId ?? "", {
    enabled: queryEnabled,
  }).data?.permissions;
  return {
    intl,
    retirementExperiment,
    deadline: intl.formatDate(
      parseRetirementDate(retirementExperiment.get("retirement_date", "")),
      { month: "long", day: "numeric", timeZone: "UTC" },
    ),
    canUsePlugins:
      migrationEnabled &&
      account?.id === accountId &&
      canAccountUseMigratedPlugins(account, workspaceGate, permissions),
  };
}

function icon(): unknown {
  return jsx.jsx(IconAsset, {
    asset: pluginMigrationIcon,
    className: "text-secondary",
  });
}

function MigrationNotice({
  surface,
  onMigrate,
  onDismiss,
}: MigrationNoticeProps): unknown {
  const { intl, deadline, canUsePlugins } = useNoticeState();
  const title = message(
    "chatgptConversations.gpts.notices.migrateTitle",
    "Migrate your GPTs to plugins by {deadline}",
    "Heading of the migration notice in GPT lists or above a GPT chat composer, asking eligible creators to migrate their GPTs to plugins; deadline is a localized month and day",
    { deadline },
  );
  const content = message(
    "chatgptConversations.gpts.notices.directoryMigration",
    "GPTs that aren’t migrated won’t be available after {deadline}. Migrate yours so people can keep using them as plugins.",
    "Migration notice in the GPT directory or above a GPT chat composer for creators who can migrate GPTs; deadline is a localized month and day after which unmigrated GPTs retire",
    { deadline },
  );
  const customCtas =
    onMigrate == null
      ? undefined
      : jsx.jsx(Tooltip, {
          tooltipContent: canUsePlugins
            ? undefined
            : message(
                "chatgptConversations.gpts.migration.permissionRequired",
                "Your workspace must allow you to use plugins to migrate this GPT",
                "Tooltip on a disabled GPT migration button for workspace users without permission to use plugins, or while that permission is loading",
              ),
          children: jsx.jsx(Button, {
            color: "primary",
            size: "dialog",
            disabled: !canUsePlugins,
            onClick: onMigrate,
            children:
              surface === "chat"
                ? message(
                    "chatgptConversations.gpts.notices.migrateCurrent",
                    "Migrate to plugin",
                    "Button in a GPT chat migration notice opening migration confirmation for the current GPT",
                  )
                : message(
                    "chatgptConversations.gpts.notices.migrateGpts",
                    "Migrate GPTs",
                    "Button in a migration notice that opens My GPTs so the creator can choose GPTs to migrate",
                  ),
          }),
        });
  const trailingAction =
    onDismiss == null
      ? undefined
      : jsx.jsx(Button, {
          "aria-label": intl.formatMessage({
            id: "chatgptConversations.gpts.notices.dismiss",
            defaultMessage: "Dismiss migration notice",
            description:
              "Accessible label for the close button on a GPT chat migration notice; hides the notice for this page session without migrating anything",
          }),
          color: "ghost",
          size: "icon",
          uniform: true,
          onClick: onDismiss,
          children: jsx.jsx(CloseIcon, {}),
        });
  return jsx.jsx(AnnouncementBanner, {
    variant: "announcement",
    icon: icon(),
    stackOnNarrow: true,
    wrapCtas: true,
    title,
    content,
    customCtas,
    trailingAction,
  });
}

function WorkspacePluginsBlockedNotice({
  surface,
  onKeepUsingGpt,
  deadline: deadlineValue,
}: WorkspacePluginsBlockedNoticeProps): unknown {
  const intl = useIntl();
  const experiment = getExperiment("2513446768");
  const deadline = intl.formatDate(
    deadlineValue ?? parseRetirementDate(experiment.get("retirement_date", "")),
    { month: "long", day: "numeric", timeZone: "UTC" },
  );
  const copy =
    surface === "directory"
      ? "GPTs can continue as plugins, but your workspace admins have disabled plugins. Your GPTs can’t be migrated and won’t be available after {deadline}."
      : surface === "migrated"
        ? "This GPT is now a plugin, but the plugin isn’t available with your current workspace settings. You can keep using this GPT until {deadline}."
        : "This GPT can continue as a plugin, but your workspace admins have disabled plugins. It can’t be migrated and won’t be available after {deadline}.";
  const content = message(
    `chatgptConversations.gpts.blocked.${surface}.description`,
    copy,
    "Workspace plugin policy retirement notice",
    { deadline },
  );
  const title = message(
    surface === "directory"
      ? "chatgptConversations.gpts.blocked.directory.title"
      : "chatgptConversations.gpts.blocked.gpt.title",
    surface === "directory"
      ? "GPTs will be retired on {deadline}"
      : "This GPT will be retired on {deadline}",
    "Workspace plugin policy retirement heading",
    { deadline },
  );
  const customCtas =
    onKeepUsingGpt == null
      ? undefined
      : jsx.jsx(Button, {
          type: "button",
          color: "primary",
          size: "dialog",
          onClick: onKeepUsingGpt,
          children: message(
            "chatgptConversations.gpts.blocked.keep_using_gpt.label",
            "Keep using GPT",
            "Only action in the migrated GPT chat notice when its creator cannot use plugins. Reveals the existing composer with its draft preserved for this visit.",
          ),
        });
  return jsx.jsx(AnnouncementBanner, {
    variant: "announcement",
    icon: icon(),
    stackOnNarrow: true,
    wrapCtas: true,
    title,
    content,
    customCtas,
  });
}

function RetirementNotice({
  actionPlacement = "inline",
  currentGpt = false,
  onExplore,
}: RetirementNoticeProps): unknown {
  const { intl, retirementExperiment, deadline, canUsePlugins } =
    useNoticeState();
  const action = canUsePlugins
    ? onExplore
    : (event: unknown) =>
        openExternalLink({
          disposition: "new-tab",
          event,
          href: getHelpCenterUrl(
            intl.locale,
            retirementExperiment.get("learn_more_url", ""),
          ),
          initiator: "open_in_browser_bridge",
          openTarget:
            actionPlacement === "below" ? "external-browser" : undefined,
        });
  const button = jsx.jsx(Button, {
    className: actionPlacement === "below" ? "w-full" : undefined,
    color: "primary",
    size: actionPlacement === "below" ? "detailAction" : "dialog",
    onClick: action,
    children: canUsePlugins
      ? message(
          "chatgptConversations.gpts.notices.explorePlugins",
          "Explore plugins",
          "Button in the GPT retirement notice opening the Plugins directory",
        )
      : message(
          "chatgptConversations.gpts.notices.learnMore",
          "Learn more",
          "Button in a GPT retirement notice for people who cannot use plugins. Opens the localized Knowledge Center article about GPT retirement in a new browser tab. Keep this label short.",
        ),
  });
  const content = !canUsePlugins
    ? message(
        "chatgptConversations.gpts.notices.retirementLearnMore",
        "Learn more about the retirement of GPTs in the Knowledge Center.",
        "Body of the GPT retirement notice on a GPT list, chat, or details dialog when the viewer cannot use plugins.",
      )
    : currentGpt
      ? message(
          "chatgptConversations.gpts.notices.currentRetirement",
          "This GPT will only remain available if its creator migrates it to a plugin. Explore plugins, the new home for custom tools.",
          "Retirement notice above an unmigrated GPT chat composer.",
        )
      : message(
          "chatgptConversations.gpts.notices.directoryRetirement",
          "GPTs their creators migrate will continue as plugins after {deadline}.",
          "Retirement notice in the GPT directory.",
          { deadline },
        );
  const announcement = jsx.jsx(AnnouncementBanner, {
    variant: actionPlacement === "below" ? "announcementInset" : "announcement",
    icon: icon(),
    stackOnNarrow: true,
    wrapCtas: true,
    title: message(
      "chatgptConversations.gpts.notices.retirementTitle",
      "GPTs will be retired on {deadline}",
      "Heading of the retirement notice; deadline is a localized month and day",
      { deadline },
    ),
    content,
    customCtas: actionPlacement === "inline" ? button : undefined,
  });
  return actionPlacement === "below"
    ? jsx.jsxs("div", {
        className: "flex w-full flex-col gap-2",
        children: [announcement, button],
      })
    : announcement;
}

let initialized = false;
function initializeGptPluginMigrationNotices(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeCloseIcon();
  initializeSignalRuntime();
  initializeReactRuntime();
  initializeNavigation();
  initializeSessionAccount();
  initializeAccountQuery();
  initializeAccountPlan();
  initializeButton();
  initializeOpenExternalLink();
  initializeIconAsset();
  initializeMigrationIcons();
  initializeTooltip();
  initializeMigrationExperiments();
  initializePluginRetirement();
  jsx = getJsxRuntime();
  initialized = true;
}

initializeGptPluginMigrationNotices();
export {
  initializeGptPluginMigrationNotices as i,
  MigrationNotice as n,
  RetirementNotice as r,
  WorkspacePluginsBlockedNotice as t,
};
