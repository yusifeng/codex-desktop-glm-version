// thread-tab-route-checkpoint —— 捕获线程标签页路由检查点的公开桥。
import * as appPrimaryChunk from "@rchunk/app-primary";

const {
  gc: initializeThreadTabRouteCheckpoint,
  hc: captureThreadTabRouteCheckpoint,
} = appPrimaryChunk;

initializeThreadTabRouteCheckpoint();

export { captureThreadTabRouteCheckpoint };
