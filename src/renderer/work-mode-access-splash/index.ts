// Work 模式访问受限页。

import {
  n as initializeAccessSplash,
  t as AccessSplash,
} from "@rchunk/access-splash";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const appPrimary = appPrimaryChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;

function WorkModeAccessSplash({
  modeToggle,
}: {
  modeToggle?: unknown;
}): unknown {
  initializeWorkModeAccessSplash();
  const jsx =
    typeof appShared.I3 === "function" ? appShared.I3() : appShared.I3;
  const Message = appShared.Y2;
  const Context = appPrimary.Cg;
  const message = (id: string, defaultMessage: string, description: string) =>
    jsx.jsx(Message, { id, defaultMessage, description });
  const toggle =
    modeToggle == null
      ? null
      : Context == null
        ? modeToggle
        : jsx.jsx(Context, { children: modeToggle });
  return jsx.jsxs(jsx.Fragment, {
    children: [
      toggle,
      jsx.jsx(AccessSplash, {
        accessMessage: message(
          "composer.home.workModeAccessSplash.accessMessage",
          "You don’t have access to Work yet. Contact your admin to request access.",
          "Work access status",
        ),
        description: message(
          "composer.home.workModeAccessSplash.description",
          "Research across your tools, create documents and presentations, and take action with ChatGPT",
          "Work access splash description",
        ),
        learnMoreLabel: message(
          "composer.home.workModeAccessSplash.learnMore",
          "Learn more about Work",
          "Work access splash link",
        ),
        learnMoreUrl: "https://openai.com/chatgpt-work/",
        title: message(
          "composer.home.workModeAccessSplash.title",
          "Turn complex tasks into finished work",
          "Work access splash title",
        ),
      }),
    ],
  });
}

function initializeWorkModeAccessSplash(): void {
  appShared.K2?.();
  appPrimary.wg?.();
  initializeAccessSplash();
}

initializeWorkModeAccessSplash();

export { WorkModeAccessSplash };
