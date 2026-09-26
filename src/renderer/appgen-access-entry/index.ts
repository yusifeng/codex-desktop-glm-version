// appgen-access-entry —— Site 访问策略逻辑的公开语义入口。
// 原版：app/webview/assets/appgen-access-6d1908b1dd94.js。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appgenAccessChunk from "@rchunk/appgen-access";

void appInitialChunk;
const appgenAccess = appgenAccessChunk as Record<string, any>;

appgenAccess.s();

const canManageAppgenProject = appgenAccess.t;
const getAppgenAccessModeOptions = appgenAccess.n;
const getAppgenAccessState = appgenAccess.r;
const getAppgenAccessUpdate = appgenAccess.i;
const getAppgenAccessUpdateWithoutGroup = appgenAccess.a;
const getAppgenAccessUpdateWithoutUser = appgenAccess.o;
const isAppgenAccessOwnerOnly = appgenAccess.c;

export {
  canManageAppgenProject,
  getAppgenAccessModeOptions,
  getAppgenAccessState,
  getAppgenAccessUpdate,
  getAppgenAccessUpdateWithoutGroup,
  getAppgenAccessUpdateWithoutUser,
  isAppgenAccessOwnerOnly,
};
