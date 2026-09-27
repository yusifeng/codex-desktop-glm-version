// chatgpt-skill-source-dialog —— 将技能来源路由到插件预览或内置技能详情。
// 原版：app/webview/assets/chatgpt-skill-source-dialog-e43cd8abcd6d.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as pluginSkillPreviewChunk from "@rchunk/plugin-skill-preview";

void runtimeChunk;
const {
  $3: initializeJsxRuntime,
  I3: getJsxRuntime,
  Jm: createLazyComponent,
  lw: initializeBrowserProfileImportIcons,
  qm: initializeQueryRuntime,
  rC: PluginSkillIcon,
} = appSharedChunk;
const {
  _E: loadSkillDetails,
  gE: initializeSkillDetails,
} = appInitialChunk;
const {
  r: initializePluginSkillPreview,
  t: PluginSkillPreview,
} = pluginSkillPreviewChunk;

const jsx = getJsxRuntime();
const SkillDetailsDialog = createLazyComponent(loadSkillDetails);

type SkillSource = {
  label: string;
  pluginId?: string;
  pluginName?: string;
  skillId?: string;
};

interface ChatGptSkillSourceDialogProps {
  onClose(): void;
  shouldBlockExternalEgress: boolean;
  source: SkillSource;
}

function ChatGptSkillSourceDialog({
  source,
  shouldBlockExternalEgress,
  onClose,
}: ChatGptSkillSourceDialogProps): unknown {
  if (source.pluginId != null) {
    return jsx.jsx(PluginSkillPreview, {
      skillName: source.label,
      title: source.label,
      description: source.pluginName,
      icon: jsx.jsx(PluginSkillIcon, {}),
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
  initializeJsxRuntime();
  initializeSkillDetails();
  initializeBrowserProfileImportIcons();
  initializeQueryRuntime();
  initializePluginSkillPreview();
}

initializeChatGptSkillSourceDialog();

export { ChatGptSkillSourceDialog };
