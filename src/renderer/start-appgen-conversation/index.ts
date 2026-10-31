// start-appgen-conversation —— 从 Sites 页面启动创建、编辑与发布会话。
// 原版：app/webview/assets/start-appgen-conversation-75d2f33c6ac2.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import { createPrefilledPluginPrompt as createPluginPrompt } from "../app-primary/runtime/create-prefilled-plugin-prompt";

void runtimeChunk;
const { wL: initializeAppSharedRuntime } = appSharedChunk;
const {
  Dft: initializeAppgenState,
  GWt: initializeSiteMentions,
  HWt: createSiteMention,
  Man: initializeAppgenNavigation,
  Sun: initializeSubscriptionState,
  _pn: navigateToAppgenConversation,
  _un: currentUserIdSignal,
  gpn: initializeAppgenConversation,
  jan: sitesPluginId,
  lnn: initializeAppgenQueries,
  mpn: intlSignal,
  mun: currentAccountIdSignal,
  ppn: initializeAppgenPrompts,
  snn: getSiteConversationRoute,
} = appInitialChunk;
const {
  Bf: initializeArtifactTypes,
  Bh: artifactTypes,
  Hh: initializePluginPrompts,
} = appPrimaryChunk;

type StartAppgenRequest =
  | {
      assetType: "document" | "spreadsheet" | "presentation" | "pdf" | "image";
      cloudLibraryEnabled?: boolean;
      type: "create-asset";
    }
  | { type: "create" }
  | {
      latestEditContext?: unknown;
      liveUrl?: string | null;
      projectId: string;
      projectTitle: string;
      type: "edit";
    }
  | { projectId: string; projectTitle: string; type: "publish" };

interface ConversationLaunchOptions extends Record<string, unknown> {
  activeProject?: unknown;
  libraryFileCreation?: boolean;
  prefillPrompt?: string;
  startInSidebar?: boolean;
}

function startAppgenConversation(
  scope: import("@rchunk/app-shared").MaitaiScopeApi<Record<string, unknown>>,
  startConversation: (options: ConversationLaunchOptions) => void,
  request: StartAppgenRequest,
  options: Record<string, unknown>,
): void {
  const intl =
    scope.get<import("@rchunk/app-initial").AppgenConversationIntl>(intlSignal);
  let prefillPrompt: string | undefined;

  switch (request.type) {
    case "create-asset":
      switch (request.assetType) {
        case "document":
        case "spreadsheet":
        case "presentation":
        case "pdf": {
          const artifact =
            request.assetType === "pdf"
              ? { label: "PDF", pluginId: "pdf@openai-primary-runtime" }
              : artifactTypes[request.assetType].artifact;
          prefillPrompt = createPluginPrompt({
            defaultPrompt: null,
            pluginDisplayName: artifact.label,
            pluginId: artifact.pluginId,
          });
          break;
        }
        case "image":
          prefillPrompt = intl.formatMessage({
            id: "appgenPage.createMenu.imagePrompt",
            defaultMessage: "Create an image of …",
            description:
              "Prefill prompt for creating an image from the Library",
          });
      }
      break;

    case "create":
      prefillPrompt = createPluginPrompt({
        defaultPrompt: intl.formatMessage({
          id: "appgenConversation.createPrompt",
          defaultMessage: "Create a website that …",
          description: "Prompt for starting a new site from the Sites page",
        }),
        pluginDisplayName: "Sites",
        pluginId: sitesPluginId,
      });
      break;

    case "edit":
      navigateToAppgenConversation(
        scope,
        getSiteConversationRoute(request.projectId),
        {
          state: {
            ...options,
            siteEditLiveUrl: request.liveUrl,
            siteEditContext: {
              accountId: scope.get<string | null>(currentAccountIdSignal),
              userId: scope.get<string | null>(currentUserIdSignal),
              projectId: request.projectId,
              projectTitle: request.projectTitle,
              latestEditContext: request.latestEditContext,
            },
          },
        },
      );
      return;

    case "publish": {
      const siteMention = createSiteMention({
        projectId: request.projectId,
        title: request.projectTitle,
      });
      prefillPrompt = `${createPluginPrompt({
        defaultPrompt: intl.formatMessage(
          {
            id: "appgenConversation.publishPrompt",
            defaultMessage: "{siteMention} publish this site",
            description:
              "Prompt for asking the model to publish an existing unpublished Site",
          },
          { siteMention },
        ),
        pluginDisplayName: "Sites",
        pluginId: sitesPluginId,
      })} `;
      break;
    }
  }

  startConversation({
    ...options,
    activeProject: null,
    libraryFileCreation:
      request.type === "create-asset" &&
      request.assetType !== "image" &&
      request.cloudLibraryEnabled
        ? true
        : undefined,
    prefillPrompt,
    startInSidebar: true,
  });
}

function initializeStartAppgenConversation(): void {
  initializeAppSharedRuntime();
  initializePluginPrompts();
  initializeAppgenConversation();
  initializeSubscriptionState();
  initializeSiteMentions();
  initializeAppgenState();
  initializeAppgenPrompts();
  initializeArtifactTypes();
  initializeAppgenNavigation();
  initializeAppgenQueries();
}

export { startAppgenConversation as n, initializeStartAppgenConversation as t };
