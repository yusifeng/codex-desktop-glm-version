// create-remote-project-modal —— 远程项目创建请求的全局弹窗宿主。
// 原版：app/webview/assets/remote-workspace-root-dialog-d437b27b6a2a.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as createProjectDialogChunk from "@rchunk/create-project-dialog-core";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const createProjectDialog = createProjectDialogChunk as Record<string, any>;

type RemoteProjectRequest = {
  mode?: "pick" | string;
  [key: string]: unknown;
};

function CreateRemoteProjectModal(
  props: { initialRequest?: RemoteProjectRequest } = {},
) {
  const { initialRequest } = props;
  const scope = appShared.LX(appShared.ZI);
  const localProjectsDisabled = appInitial._N();
  const remoteProjectsEnabled = appInitial.E4();
  const [request, setRequest] = appShared.e6().useState(initialRequest);
  const [requestKey, setRequestKey] = appShared.e6().useState(0);

  const open = (nextRequest: RemoteProjectRequest) => {
    setRequest(nextRequest);
    setRequestKey((value: number) => value + 1);
  };

  appShared.K3(
    "open-create-remote-project-modal",
    (nextRequest: RemoteProjectRequest) => {
      if (!remoteProjectsEnabled || localProjectsDisabled) return;
      appInitial.tjt({ scope, projectType: "remote" });
      open(nextRequest);
    },
  );

  appShared.K3(
    "remote-workspace-root-requested",
    (nextRequest: RemoteProjectRequest) => {
      if (!remoteProjectsEnabled) return;
      if (nextRequest.mode !== "pick") {
        appInitial.tjt({ scope, projectType: "remote" });
      }
      open(nextRequest);
    },
  );

  return request == null
    ? null
    : appShared.I3().jsx(
        createProjectDialog.t,
        {
          initialRequest: request,
          onClose: () => setRequest(undefined),
        },
        requestKey,
      );
}

function initializeCreateRemoteProjectModal(): void {
  appShared.FX?.();
  appInitial.gN?.();
  appShared.W3?.();
  appInitial.C4?.();
  appShared.QI?.();
  createProjectDialog.r?.();
  appInitial.QAt?.();
}

initializeCreateRemoteProjectModal();

export { CreateRemoteProjectModal };
