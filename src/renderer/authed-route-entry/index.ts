// authed-route-entry —— 已认证应用布局与路由守卫公开入口。
import * as appSharedChunk from "@rchunk/app-shared";
import * as appPrimaryChunk from "@rchunk/app-primary";
void appSharedChunk;
const {
  fc: AppLayoutRoute,
  mc: initializeAuthedRoutes,
  pc: AuthedRoute,
} = appPrimaryChunk;
initializeAuthedRoutes();
export { AppLayoutRoute, AuthedRoute };
