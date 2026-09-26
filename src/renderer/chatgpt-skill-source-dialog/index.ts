// chatgpt-skill-source-dialog —— 将技能来源路由到插件预览或内置技能详情。
// 原版：app/webview/assets/chatgpt-skill-source-dialog-e43cd8abcd6d.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as pluginSkillPreviewChunk from "@rchunk/plugin-skill-preview";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const pluginSkillPreview = pluginSkillPreviewChunk as Record<string, any>;

const jsx = appShared.I3();
const SkillDetailsDialog = appShared.Jm(appInitial._E);

type SkillSource = {
  label: string;
  pluginId?: string;
  pluginName?: string;
  skillId?: string;
};

function ChatGptSkillSourceDialog({
  source,
  shouldBlockExternalEgress,
  onClose,
}: {
  source: SkillSource;
  shouldBlockExternalEgress: boolean;
  onClose: () => void;
}) {
  if (source.pluginId != null) {
    return jsx.jsx(pluginSkillPreview.t, {
      skillName: source.label,
      title: source.label,
      description: source.pluginName,
      icon: jsx.jsx(appShared.rC, {}),
      pluginId: source.pluginId,
      shouldBlockExternalEgress,
      onClose,
    });
  }
  return source.skillId == null
    ? null
    : jsx.jsx(SkillDetailsDialog, { skillId: source.skillId, onClose });
}

function initializeChatGptSkillSourceDialog(): void {
  appShared.$3?.();
  appInitial.gE?.();
  appShared.lw?.();
  appShared.qm?.();
  pluginSkillPreview.r?.();
}

initializeChatGptSkillSourceDialog();

export { ChatGptSkillSourceDialog };
