// Codex 本地模式访问受限页。

import {
  n as initializeAccessSplash,
  t as AccessSplash,
} from "@rchunk/access-splash";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const appShared = appSharedChunk as Record<string, any>;

function CodexLocalAccessSplash(): unknown {
  initializeCodexLocalAccessSplash();
  const jsx =
    typeof appShared.I3 === "function" ? appShared.I3() : appShared.I3;
  const Message = appShared.Y2;
  const message = (id: string, defaultMessage: string, description: string) =>
    jsx.jsx(Message, { id, defaultMessage, description });
  return jsx.jsx(AccessSplash, {
    accessMessage: message(
      "composer.codexAccessSplash.accessMessage",
      "You don’t have access to Codex yet. Contact your admin to request access.",
      "Codex access status",
    ),
    description: message(
      "composer.codexAccessSplash.description",
      "Use Codex to understand codebases, build features, fix bugs, and review changes",
      "Codex access splash description",
    ),
    learnMoreLabel: message(
      "composer.codexAccessSplash.learnMore",
      "Learn more about Codex",
      "Codex access splash link",
    ),
    learnMoreUrl: "https://chatgpt.com/codex/",
    title: message(
      "composer.codexAccessSplash.title",
      "Take coding tasks from idea to pull request",
      "Codex access splash title",
    ),
  });
}

function initializeCodexLocalAccessSplash(): void {
  appShared.K2?.();
  initializeAccessSplash();
}

initializeCodexLocalAccessSplash();

export { CodexLocalAccessSplash };
