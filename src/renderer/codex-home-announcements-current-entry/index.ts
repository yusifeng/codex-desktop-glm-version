// codex-home-announcements-current-entry —— 当前 Home 公告入口与语义重导出。
// 原版：app/webview/assets/codex-home-announcements-fb04cadd6201.js。

import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as announcementStateChunk from "@rchunk/home-announcement-state";
import * as announcementsChunk from "@rchunk/codex-home-announcements-current";
import * as announcementSlotChunk from "@rchunk/home-announcement-slot";

void appSharedChunk;
void appInitialChunk;
void appPrimaryChunk;

announcementStateChunk.t?.();
announcementsChunk.r();
announcementSlotChunk.n?.();

const HomeComposerAnnouncements = announcementsChunk.n;
const CodexHomeAnnouncements = announcementsChunk.t;

export { CodexHomeAnnouncements, HomeComposerAnnouncements };
