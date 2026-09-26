// start-appgen-conversation —— 从 Sites 页面启动创建、编辑与发布会话。
// 原版：app/webview/assets/start-appgen-conversation-75d2f33c6ac2.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const appPrimary = appPrimaryChunk as Record<string, any>;

function startAppgenConversation(
  scope: any,
  startConversation: (options: any) => void,
  request: any,
  options: Record<string, any>,
): void {
  const intl = scope.get(appInitial.mpn);
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
              : appPrimary.Bh[request.assetType].artifact;
          prefillPrompt = appPrimary.Rf({
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
      prefillPrompt = appPrimary.Rf({
        defaultPrompt: intl.formatMessage({
          id: "appgenConversation.createPrompt",
          defaultMessage: "Create a website that …",
          description: "Prompt for starting a new site from the Sites page",
        }),
        pluginDisplayName: "Sites",
        pluginId: appInitial.jan,
      });
      break;

    case "edit":
      appInitial._pn(scope, appInitial.snn(request.projectId), {
        state: {
          ...options,
          siteEditLiveUrl: request.liveUrl,
          siteEditContext: {
            accountId: scope.get(appInitial.mun),
            userId: scope.get(appInitial._un),
            projectId: request.projectId,
            projectTitle: request.projectTitle,
            latestEditContext: request.latestEditContext,
          },
        },
      });
      return;

    case "publish": {
      const siteMention = appInitial.HWt({
        projectId: request.projectId,
        title: request.projectTitle,
      });
      prefillPrompt = `${appPrimary.Rf({
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
        pluginId: appInitial.jan,
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
  appShared.wL();
  appPrimary.Hh();
  appInitial.gpn();
  appInitial.Sun();
  appInitial.GWt();
  appInitial.Dft();
  appInitial.ppn();
  appPrimary.Bf();
  appInitial.Man();
  appInitial.lnn();
}

export { startAppgenConversation as n, initializeStartAppgenConversation as t };
