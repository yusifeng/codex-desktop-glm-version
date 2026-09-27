// Codex 本地模式访问受限页。

import {
  n as initializeAccessSplash,
  t as AccessSplash,
} from "@rchunk/access-splash";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const {
  $3: initializeJsxRuntime,
  I3: getJsxRuntime,
  K2: initializeFormattedMessage,
  Y2: FormattedMessage,
} = appSharedChunk;

interface CodexLocalAccessSplashMessage {
  defaultMessage: string;
  description: string;
  id: string;
}

function CodexLocalAccessSplash(): unknown {
  initializeCodexLocalAccessSplash();
  const jsx =
    typeof getJsxRuntime === "function" ? getJsxRuntime() : getJsxRuntime;
  const message = ({
    id,
    defaultMessage,
    description,
  }: CodexLocalAccessSplashMessage) =>
    jsx.jsx(FormattedMessage, { id, defaultMessage, description });
  return jsx.jsx(AccessSplash, {
    accessMessage: message({
      id: "composer.codexAccessSplash.accessMessage",
      defaultMessage:
        "You don’t have access to Codex yet. Contact your admin to request access.",
      description:
        "Status shown above the Codex access splash when the user's workspace has not enabled local Codex, directing them to contact their admin",
    }),
    description: message({
      id: "composer.codexAccessSplash.description",
      defaultMessage:
        "Use Codex to understand codebases, build features, fix bugs, and review changes",
      description:
        "Description shown when a user selects Codex but their workspace has not enabled local Codex",
    }),
    learnMoreLabel: message({
      id: "composer.codexAccessSplash.learnMore",
      defaultMessage: "Learn more about Codex",
      description:
        "Link below the Codex access splash that opens an overview of Codex",
    }),
    learnMoreUrl: "https://chatgpt.com/codex/",
    title: message({
      id: "composer.codexAccessSplash.title",
      defaultMessage: "Take coding tasks from idea to pull request",
      description:
        "Title shown when a user selects Codex but their workspace has not enabled local Codex",
    }),
  });
}

function initializeCodexLocalAccessSplash(): void {
  initializeJsxRuntime?.();
  initializeFormattedMessage?.();
  initializeAccessSplash();
}

initializeCodexLocalAccessSplash();

export { CodexLocalAccessSplash };
