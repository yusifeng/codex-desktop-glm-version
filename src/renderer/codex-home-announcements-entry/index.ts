// codex-home-announcements-entry —— 兼容 Home 公告入口与语义重导出。
// 原版：app/webview/assets/codex-home-announcements-a162daf7b1b9.js。

import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as announcementsChunk from "@rchunk/codex-home-announcements";
import * as announcementStateChunk from "@rchunk/home-announcement-state";

void appSharedChunk;
void appInitialChunk;
void appPrimaryChunk;

announcementStateChunk.t?.();
announcementsChunk.r();

const HomeComposerAnnouncements = announcementsChunk.n;

export { HomeComposerAnnouncements };
