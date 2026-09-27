// scheduled-shared-task-route —— 共享定时任务的认证分流与弹窗入口。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as sharedTaskDialogChunk from "@rchunk/scheduled-shared-task-dialog-core";
void runtimeChunk;

const { $3: initializeRuntimeLazy, I3: getJsxRuntime } = appSharedChunk;
const {
  M6t: initializeGptResource,
  N6t: useSessionIdentity,
  Qgn: initializeAccountContext,
  Ygn: Navigate,
  i_n: useLocation,
  l_n: useRouteParams,
  o_n: useNavigate,
} = appInitialChunk;
const {
  n: initializeScheduledSharedTaskDialog,
  t: ScheduledSharedTaskDialog,
} = sharedTaskDialogChunk;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function ScheduledSharedTaskRoute(): unknown {
  const { postId } = useRouteParams();
  const { search, hash, state } = useLocation();
  const navigate = useNavigate();
  const { authMethod, isLoading } = useSessionIdentity();
  if (isLoading) return null;
  if (postId == null) return jsx.jsx(Navigate, { to: "/", replace: true });
  if (authMethod === "chatgpt") {
    const params = new URLSearchParams(search);
    params.set("shared_task", postId);
    return jsx.jsx(Navigate, {
      to: { pathname: "/scheduled", search: `?${params}`, hash },
      state,
      replace: true,
    });
  }
  return jsx.jsx(ScheduledSharedTaskDialog, {
    postId,
    onClose: () => void navigate("/"),
  });
}

function initializeScheduledSharedTaskRoute(): void {
  initializeRuntimeLazy();
  initializeAccountContext();
  initializeGptResource();
  initializeScheduledSharedTaskDialog();
  jsx = getJsxRuntime();
}

initializeScheduledSharedTaskRoute();
export { ScheduledSharedTaskRoute };
