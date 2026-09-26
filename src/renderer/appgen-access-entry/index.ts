// appgen-access-entry —— Site 访问策略逻辑的公开语义入口。
// 原版：app/webview/assets/appgen-access-6d1908b1dd94.js。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appgenAccessChunk from "@rchunk/appgen-access";

void appInitialChunk;
const {
  a: getAppgenAccessUpdateWithoutGroup,
  c: isAppgenAccessOwnerOnly,
  i: getAppgenAccessUpdate,
  n: getAppgenAccessModeOptions,
  o: getAppgenAccessUpdateWithoutUser,
  r: getAppgenAccessState,
  s: initializeAppgenAccess,
  t: canManageAppgenProject,
} = appgenAccessChunk;

initializeAppgenAccess();

export {
  canManageAppgenProject,
  getAppgenAccessModeOptions,
  getAppgenAccessState,
  getAppgenAccessUpdate,
  getAppgenAccessUpdateWithoutGroup,
  getAppgenAccessUpdateWithoutUser,
  isAppgenAccessOwnerOnly,
};
