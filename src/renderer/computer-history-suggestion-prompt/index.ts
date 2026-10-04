// computer-history-suggestion-prompt —— 把 Computer History 建议转为带插件 mention 的预填 prompt。
// 原版：app/webview/assets/computer-history-suggestion-prompt-7850c0ed2372.js。

import {
  $K as computerHistoryPluginName,
  K2 as initializeIntl,
  W2 as defineMessage,
  oq as computerHistoryPluginVersion,
  wL as initializePlugins,
} from "@rchunk/app-shared";
import { Bf as initializePrefilledPrompt } from "@rchunk/app-primary";
import { createPrefilledPluginPrompt } from "../app-primary/runtime/create-prefilled-plugin-prompt";

export interface ComputerHistorySuggestion {
  type: "skill" | "automation";
  name: string;
  description: string;
}

export interface IntlLike {
  formatMessage(descriptor: any, values?: Record<string, unknown>): string;
}

const computerHistoryDisplayNameMessage = defineMessage({
  id: "settings.chronicle.history.pluginDisplayName",
  defaultMessage: "Computer History",
  description: "Display name of the Computer History plugin in a prefilled conversation mention",
});

const SKILL_PROMPT = {
  id: "settings.chronicle.history.createNamedSuggestedSkillPrompt",
  defaultMessage:
    'Create a new "{name}" skill based on the description below. Consult the memory at {memoryFilePath} and the events.jsonl files cited there to understand the recorded workflow and my actions.{paragraphBreak}"{request}"',
  description: "Prefilled conversation request for creating a named reusable skill from a Computer history suggestion",
};

const AUTOMATION_PROMPT = {
  id: "settings.chronicle.history.createNamedSuggestedAutomationPrompt",
  defaultMessage:
    'Create a new "{name}" automation based on the description below. Consult the memory at {memoryFilePath} and the events.jsonl files cited there to understand the recorded workflow and my actions.{paragraphBreak}"{request}"{paragraphBreak}Use my local timezone and a new chat for scheduled runs.',
  description: "Prefilled conversation request for creating a named automation from a Computer history suggestion",
};

function createComputerHistorySuggestionPrompt(input: {
  intl: IntlLike;
  memoryFilePath: string;
  suggestion: ComputerHistorySuggestion;
}) {
  const descriptor = input.suggestion.type === "skill" ? SKILL_PROMPT : AUTOMATION_PROMPT;
  return createPrefilledPluginPrompt({
    defaultPrompt: input.intl.formatMessage(descriptor, {
      name: input.suggestion.name,
      request: input.suggestion.description,
      memoryFilePath: input.memoryFilePath,
      paragraphBreak: "\n\n",
    }),
    pluginDisplayName: input.intl.formatMessage(computerHistoryDisplayNameMessage),
    pluginId: `${computerHistoryPluginName}@${computerHistoryPluginVersion}`,
  });
}

function initializeComputerHistorySuggestionPrompt(): void {
  initializePlugins();
  (initializeIntl as unknown as () => void)();
  initializePrefilledPrompt();
}

export {
  createComputerHistorySuggestionPrompt as n,
  initializeComputerHistorySuggestionPrompt as r,
  computerHistoryDisplayNameMessage as t,
};
