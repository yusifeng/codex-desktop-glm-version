// skills-page-entry —— Skills 与插件管理页面公开入口。
import * as appSharedChunk from "@rchunk/app-shared";
import * as pageChunk from "@rchunk/skills-page-core";
void appSharedChunk;
const {
  n: SkillsPage,
  r: ManagePluginsPage,
  t: initializeSkillsPages,
} = pageChunk;
initializeSkillsPages();
export { ManagePluginsPage, SkillsPage };
