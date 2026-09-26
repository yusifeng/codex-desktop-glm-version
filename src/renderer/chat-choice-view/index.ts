// chat-choice-view —— 已迁移 GPT 在原聊天中显示的插件选择公告。
// 原版：app/webview/assets/chat-choice-view-dbd92be32fed.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as retirementChunk from "@rchunk/gpt-plugin-retirement";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const retirement = retirementChunk as Record<string, any>;

let jsx: any;
let initialized = false;
function initializeChatChoiceView(): void {
  if (initialized) return;
  appShared.$3?.();
  appShared.wl?.();
  appShared.K2?.();
  appInitial.r7?.();
  appShared.Zh?.();
  appShared.C_?.();
  appInitial.ifn?.();
  retirement.r?.();
  jsx = appShared.I3?.();
  initialized = true;
}

type AccessState = "allowed" | "denied" | "pending" | "error";
type ChatChoiceViewProps = {
  gptName: string;
  accessState: AccessState;
  onUsePlugin: () => void;
  onKeepUsingGpt?: () => void;
  onRetry?: () => void;
};

function message(
  id: string,
  defaultMessage: string,
  description: string,
  values?: Record<string, unknown>,
): unknown {
  return jsx.jsx(appShared.Y2, { id, defaultMessage, description, values });
}

function ChatChoiceView({
  gptName,
  accessState,
  onUsePlugin,
  onKeepUsingGpt,
  onRetry,
}: ChatChoiceViewProps): unknown {
  initializeChatChoiceView();
  const intl = appShared.n4?.();
  const experiment = appInitial.afn?.("2513446768");
  const deadline = intl.formatDate(
    retirement.t?.(experiment.get("retirement_date", "")),
    { month: "long", day: "numeric", timeZone: "UTC" },
  );

  let primaryLabel: unknown;
  if (accessState === "error" && onRetry != null) {
    primaryLabel = message(
      "chatgptConversations.gpts.migration.chatChoiceRetry",
      "Try again",
      "Retry checking access to the migrated plugin",
    );
  } else if (accessState === "allowed" || accessState === "pending") {
    primaryLabel = message(
      "chatgptConversations.gpts.migration.chatChoiceUsePlugin",
      "Use plugin",
      "Opens the migrated plugin detail page from the initial GPT chat choice.",
    );
  } else {
    primaryLabel = message(
      "chatgptConversations.gpts.migration.chatChoiceExplorePlugins",
      "Explore plugins",
      "Opens the plugin directory from a migrated GPT chat banner when access to its plugin was denied or could not be verified after a failed request.",
    );
  }

  let content: unknown;
  if (accessState === "error" && onRetry == null) {
    content = message(
      "chatgptConversations.gpts.migration.chatChoiceAccessUnconfirmed",
      "We couldn’t check your access to the plugin. You can keep using this GPT until {deadline}.",
      "Fallback when the migration banner cannot load. Access is unknown; the user can explore plugins or continue using the GPT.",
      { deadline },
    );
  } else if (accessState === "error") {
    content = message(
      "chatgptConversations.gpts.migration.chatChoiceAccessError",
      "We couldn’t check your access to the plugin. Try again, or keep using this GPT until {deadline}.",
      "Migrated GPT notice after a failed plugin-access check; deadline is the localized retirement date",
      { deadline },
    );
  } else if (accessState === "denied") {
    content = message(
      "chatgptConversations.gpts.migration.chatChoiceAccessDenied",
      "This plugin isn’t available to you. You can keep using this GPT until {deadline}.",
      "Migrated GPT notice when the destination plugin is inaccessible; deadline is the localized retirement date",
      { deadline },
    );
  } else if (gptName.trim()) {
    content = message(
      "chatgptConversations.gpts.migration.chatChoiceNamedBody",
      "{gptName} is now available as a plugin. You can keep using this GPT until {deadline}.",
      "Explains the migrated GPT choice before the composer. gptName is the GPT display name and deadline is a localized month and day.",
      { gptName, deadline },
    );
  } else {
    content = message(
      "chatgptConversations.gpts.migration.chatChoiceBody",
      "This GPT is now available as a plugin. You can keep using this GPT until {deadline}.",
      "Explains the migrated GPT choice when the GPT has no display name; deadline is a localized month and day.",
      { deadline },
    );
  }

  const title = gptName.trim()
    ? message(
        "chatgptConversations.gpts.migration.chatChoiceNamedTitle",
        "{gptName} is now a plugin",
        "Title of the migrated GPT chat choice shown before the composer. gptName is the user-provided GPT name.",
        { gptName },
      )
    : message(
        "chatgptConversations.gpts.migration.chatChoiceTitle",
        "This GPT is now a plugin",
        "Title of the migrated GPT chat choice when the GPT has no display name.",
      );
  const Button = appShared.Yh;
  const primaryAction = jsx.jsx(Button, {
    color: "primary",
    disabled: accessState === "pending",
    size: "dialog",
    type: "button",
    onClick: accessState === "error" && onRetry != null ? onRetry : onUsePlugin,
    children: primaryLabel,
  });
  const keepUsingAction =
    onKeepUsingGpt == null
      ? null
      : jsx.jsx(Button, {
          color: "outline",
          size: "dialog",
          type: "button",
          onClick: onKeepUsingGpt,
          children: message(
            "chatgptConversations.gpts.migration.chatChoiceKeepUsing",
            "Keep using GPT",
            "Reveals the existing GPT chat composer for this visit only, keeping its draft. The choice is shown again when the GPT is reopened.",
          ),
        });
  const customCtas = jsx.jsxs("div", {
    className: "flex flex-wrap items-center gap-2",
    children: [primaryAction, keepUsingAction],
  });
  const icon = jsx.jsx(appShared.S_, {
    asset: appShared.Tl,
    className: "text-secondary",
  });
  return jsx.jsx("div", {
    className: "mx-auto mb-3 w-full max-w-[var(--thread-content-max-width)]",
    children: jsx.jsx(appInitial.n7, {
      variant: "announcement",
      icon,
      stackOnNarrow: true,
      wrapCtas: true,
      title,
      content,
      customCtas,
    }),
  });
}

initializeChatChoiceView();
export { initializeChatChoiceView as n, ChatChoiceView as t };
