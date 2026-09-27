// Work 模式访问受限页。

import {
  n as initializeAccessSplash,
  t as AccessSplash,
} from "@rchunk/access-splash";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const {
  Cg: WorkModeToggleContext,
  wg: initializeWorkModeToggleContext,
} = appPrimaryChunk;
const {
  $3: initializeJsxRuntimeLazy,
  I3: getJsxRuntime,
  K2: initializeFormattedMessage,
  Y2: FormattedMessage,
} = appSharedChunk;

interface WorkModeAccessSplashProps {
  modeToggle?: unknown;
}

function WorkModeAccessSplash({ modeToggle }: WorkModeAccessSplashProps): unknown {
  initializeWorkModeAccessSplash();
  const jsx =
    typeof getJsxRuntime === "function" ? getJsxRuntime() : getJsxRuntime;
  const message = (id: string, defaultMessage: string, description: string) =>
    jsx.jsx(FormattedMessage, { id, defaultMessage, description });
  const toggle =
    modeToggle == null
      ? null
      : WorkModeToggleContext == null
        ? modeToggle
        : jsx.jsx(WorkModeToggleContext, { children: modeToggle });
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
  initializeJsxRuntimeLazy?.();
  initializeFormattedMessage?.();
  initializeWorkModeToggleContext?.();
  initializeAccessSplash();
}

initializeWorkModeAccessSplash();

export { WorkModeAccessSplash };
