// workspace-file-tab-context-menu —— 文件标签页上下文菜单的数据入口。
// 原版：app/webview/assets/workspace-file-tab-context-menu-471b03473820.js。

import * as appInitialChunk from "@rchunk/app-initial";

const {
  Gut: getWorkspaceFileTabContextMenuItems,
  Kut: initializeWorkspaceFileTabContextMenuItems,
  qut: prefetchWorkspaceFileTabContextMenuItems,
} = appInitialChunk;

initializeWorkspaceFileTabContextMenuItems();

export {
  getWorkspaceFileTabContextMenuItems,
  prefetchWorkspaceFileTabContextMenuItems,
};
