// chatgpt-personalization-route —— 个性化设置中的记忆与参考照片深链。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
void runtimeChunk;

let memoriesSettingsRoute: string;
let referencePhotosSettingsRoute: string;

function initializeChatGptPersonalizationRoutes(): void {
  memoriesSettingsRoute = "/settings/personalization?modal=memories";
  referencePhotosSettingsRoute =
    "/settings/personalization#chatgpt-reference-photos";
}

initializeChatGptPersonalizationRoutes();

export {
  memoriesSettingsRoute as n,
  initializeChatGptPersonalizationRoutes as r,
  referencePhotosSettingsRoute as t,
};
