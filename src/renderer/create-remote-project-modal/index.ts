// create-remote-project-modal —— 远程项目创建请求的全局弹窗宿主。
// 原版：app/webview/assets/remote-workspace-root-dialog-d437b27b6a2a.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as createProjectDialogChunk from "@rchunk/create-project-dialog-core";

void runtimeChunk;
const {
  FX: initializeScopeRuntime,
  I3: getJsxRuntime,
  K3: useHostMessageHandler,
  LX: useScope,
  QI: initializeAppScope,
  W3: initializeHostMessageBridge,
  ZI: appScope,
  e6: getReactRuntime,
} = appSharedChunk;
const {
  C4: initializeRemoteProjects,
  E4: useRemoteProjectsEnabled,
  QAt: initializeRemoteWorkspaceRequests,
  _N: useLocalProjectsDisabled,
  gN: initializeProjectAvailability,
  tjt: trackProjectCreation,
} = appInitialChunk;
const { r: initializeCreateProjectDialog, t: CreateProjectDialog } =
  createProjectDialogChunk;
const React = getReactRuntime();
const jsx = getJsxRuntime();

type RemoteProjectRequest = {
  mode?: "pick" | string;
  [key: string]: unknown;
};

function CreateRemoteProjectModal(
  props: { initialRequest?: RemoteProjectRequest } = {},
): unknown {
  const { initialRequest } = props;
  const scope = useScope(appScope);
  const localProjectsDisabled = useLocalProjectsDisabled();
  const remoteProjectsEnabled = useRemoteProjectsEnabled();
  const [request, setRequest] = React.useState<
    RemoteProjectRequest | undefined
  >(initialRequest);
  const [requestKey, setRequestKey] = React.useState(0);

  const open = (nextRequest: RemoteProjectRequest) => {
    setRequest(nextRequest);
    setRequestKey((value: number) => value + 1);
  };

  useHostMessageHandler<
    import("@rchunk/app-shared").RendererHostMessage & RemoteProjectRequest
  >("open-create-remote-project-modal", (nextRequest: RemoteProjectRequest) => {
    if (!remoteProjectsEnabled || localProjectsDisabled) return;
    trackProjectCreation({ scope, projectType: "remote" });
    open(nextRequest);
  });

  useHostMessageHandler<
    import("@rchunk/app-shared").RendererHostMessage & RemoteProjectRequest
  >("remote-workspace-root-requested", (nextRequest: RemoteProjectRequest) => {
    if (!remoteProjectsEnabled) return;
    if (nextRequest.mode !== "pick") {
      trackProjectCreation({ scope, projectType: "remote" });
    }
    open(nextRequest);
  });

  return request == null
    ? null
    : jsx.jsx(
        CreateProjectDialog,
        {
          initialRequest: request,
          onClose: () => setRequest(undefined),
        },
        requestKey,
      );
}

function initializeCreateRemoteProjectModal(): void {
  initializeScopeRuntime();
  initializeProjectAvailability();
  initializeHostMessageBridge();
  initializeRemoteProjects();
  initializeAppScope();
  initializeCreateProjectDialog();
  initializeRemoteWorkspaceRequests();
}

initializeCreateRemoteProjectModal();

export { CreateRemoteProjectModal };
