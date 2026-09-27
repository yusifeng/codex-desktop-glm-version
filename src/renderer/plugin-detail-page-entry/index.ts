// plugin-detail-page-entry —— 插件详情与管理详情页公开入口。
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as pageChunk from "@rchunk/plugin-detail-page-core";
void appSharedChunk;
void appInitialChunk;
const {
  n: PluginDetailPage,
  r: initializePluginDetailPages,
  t: ManagePluginDetailPage,
} = pageChunk;
initializePluginDetailPages();
export { ManagePluginDetailPage, PluginDetailPage };
