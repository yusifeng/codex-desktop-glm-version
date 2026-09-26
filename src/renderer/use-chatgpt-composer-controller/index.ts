// use-chatgpt-composer-controller —— ChatGPT composer controller 的一次性创建与销毁适配。
// 原版：app/webview/assets/use-chatgpt-composer-controller-d0283af53f81.js。

import "@rchunk/app-shared";
import "@rchunk/app-initial";

export type ComposerTextKind = "prompt" | "plain" | string;

export interface ChatGPTComposerControllerOptions<TController = ChatGPTComposerControllerView> {
  conversationId?: string | null;
  initialPrompt?: string | null;
  initialPromptKind?: ComposerTextKind | null;
  conversationDraft?: string | null;
  composerPlainTextMode?: boolean;
  createController?(text: string, config: ChatGPTComposerControllerConfig): TController;
}

export interface ChatGPTComposerControllerConfig {
  defaultTextKind: ComposerTextKind;
  enableFileMentions: true;
  enableRichText: true;
  enableSkillMentions: false;
  enableSlashCommands: { triggers: ["/"] };
  plainTextMode: boolean;
}

export interface ChatGPTComposerControllerView {
  kind: "chatgpt-composer-controller";
  text: string;
  config: ChatGPTComposerControllerConfig;
  view: { isDestroyed: boolean };
  destroy(): void;
}

function containsStructuredPrompt(text: string): boolean {
  return /(?:^|\s)(?:@|\/)[^\s]+/.test(text);
}

function useChatGPTComposerController<TController = ChatGPTComposerControllerView>(
  options: ChatGPTComposerControllerOptions<TController> = {},
): TController {
  const text = options.initialPrompt ?? (options.conversationId == null ? "" : options.conversationDraft ?? "");
  const defaultTextKind = options.initialPromptKind ??
    ((options.initialPrompt == null && options.conversationId != null) || containsStructuredPrompt(text)
      ? "prompt"
      : "plain");
  const config: ChatGPTComposerControllerConfig = {
    defaultTextKind,
    enableFileMentions: true,
    enableRichText: true,
    enableSkillMentions: false,
    enableSlashCommands: { triggers: ["/"] },
    plainTextMode: options.composerPlainTextMode === true,
  };
  if (options.createController != null) return options.createController(text, config);
  const controller: ChatGPTComposerControllerView = {
    kind: "chatgpt-composer-controller",
    text,
    config,
    view: { isDestroyed: false },
    destroy() {
      controller.view.isDestroyed = true;
    },
  };
  return controller as TController;
}

function initializeUseChatGPTComposerController(): void {}

export { useChatGPTComposerController as n, initializeUseChatGPTComposerController as t };
