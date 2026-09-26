// composer-browser-skills-entry —— 浏览器技能提交公开入口。
//
// 原版：app/webview/assets/composer-state-fe0ac7960e24.js（123B）。
// 初始化 composer-browser-skills-state 后，将压缩导出 `r` 公开为
// submitWithBrowserSkills。

import {
  r as submitWithBrowserSkills,
  t as initializeComposerBrowserSkillsState,
} from "@rchunk/composer-browser-skills-state";

initializeComposerBrowserSkillsState();

export { submitWithBrowserSkills };
