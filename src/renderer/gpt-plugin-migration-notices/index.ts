// gpt-plugin-migration-notices —— GPT 迁移、退役与工作区权限公告。
// 原版：app/webview/assets/notices-dbed4ccd62e0.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as retirementChunk from "@rchunk/gpt-plugin-retirement";
import * as migratedAccessChunk from "@rchunk/migrated-plugin-access";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const retirement = retirementChunk as Record<string, any>;
const migratedAccess = migratedAccessChunk as Record<string, any>;
let jsx: any;

function message(
  id: string,
  defaultMessage: string,
  description: string,
  values?: Record<string, unknown>,
): unknown {
  return jsx.jsx(appShared.Y2, { id, defaultMessage, description, values });
}

function useNoticeState(): any {
  const intl = appShared.n4?.();
  const migrationExperiment = appInitial.afn?.("2562735250");
  const retirementExperiment = appInitial.afn?.("2513446768");
  const migrationEnabled =
    migrationExperiment?.get?.("enabled", false) ?? false;
  const { accountId } = appInitial.N6t?.() ?? {};
  const account = appInitial.uht?.(undefined, { preview: false })?.data;
  const workspaceGate = appInitial.ofn?.("1355972088") ?? false;
  const queryEnabled =
    accountId != null &&
    account?.id === accountId &&
    account?.structure === "workspace" &&
    workspaceGate;
  const permissions = appShared.BX?.(appInitial.Dln, accountId ?? "", {
    enabled: queryEnabled,
  })?.data?.permissions;
  return {
    intl,
    retirementExperiment,
    deadline: intl.formatDate(
      retirement.t?.(retirementExperiment.get("retirement_date", "")),
      { month: "long", day: "numeric", timeZone: "UTC" },
    ),
    canUsePlugins:
      migrationEnabled &&
      account?.id === accountId &&
      migratedAccess.i?.(account, workspaceGate, permissions),
  };
}

function icon(): unknown {
  return jsx.jsx(appShared.S_, {
    asset: appShared.Tl,
    className: "text-secondary",
  });
}

function MigrationNotice({
  surface,
  onMigrate,
  onDismiss,
}: {
  surface: string;
  onMigrate?: () => void;
  onDismiss?: () => void;
}): unknown {
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
      : jsx.jsx(appShared.o_, {
          tooltipContent: canUsePlugins
            ? undefined
            : message(
                "chatgptConversations.gpts.migration.permissionRequired",
                "Your workspace must allow you to use plugins to migrate this GPT",
                "Tooltip on a disabled GPT migration button for workspace users without permission to use plugins, or while that permission is loading",
              ),
          children: jsx.jsx(appShared.Yh, {
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
      : jsx.jsx(appShared.Yh, {
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
          children: jsx.jsx(appShared.sw, {}),
        });
  return jsx.jsx(appInitial.n7, {
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
}: {
  surface: "directory" | "migrated" | "gpt";
  onKeepUsingGpt?: () => void;
  deadline?: number;
}): unknown {
  const intl = appShared.n4?.();
  const experiment = appInitial.afn?.("2513446768");
  const deadline = intl.formatDate(
    deadlineValue ?? retirement.t?.(experiment.get("retirement_date", "")),
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
      : jsx.jsx(appShared.Yh, {
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
  return jsx.jsx(appInitial.n7, {
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
}: {
  actionPlacement?: "inline" | "below";
  currentGpt?: boolean;
  onExplore?: (event: unknown) => void;
}): unknown {
  const { intl, retirementExperiment, deadline, canUsePlugins } =
    useNoticeState();
  const action = canUsePlugins
    ? onExplore
    : (event: unknown) =>
        appInitial.Oft?.({
          disposition: "new-tab",
          event,
          href: retirement.n?.(
            intl.locale,
            retirementExperiment.get("learn_more_url", ""),
          ),
          initiator: "open_in_browser_bridge",
          openTarget:
            actionPlacement === "below" ? "external-browser" : undefined,
        });
  const button = jsx.jsx(appShared.Yh, {
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
  const announcement = jsx.jsx(appInitial.n7, {
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
  appShared.$3?.();
  appShared.wl?.();
  appShared.FX?.();
  appShared.K2?.();
  appInitial.Oln?.();
  appInitial.M6t?.();
  appInitial.rht?.();
  appInitial.r7?.();
  appShared.Zh?.();
  appInitial.Dft?.();
  appShared.C_?.();
  appShared.lw?.();
  appShared.c_?.();
  appInitial.ifn?.();
  retirement.r?.();
  jsx = appShared.I3?.();
  initialized = true;
}

initializeGptPluginMigrationNotices();
export {
  initializeGptPluginMigrationNotices as i,
  MigrationNotice as n,
  RetirementNotice as r,
  WorkspacePluginsBlockedNotice as t,
};
