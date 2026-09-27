import "@rchunk/rolldown-runtime";
import {
  G2 as defineMessages,
  K2 as initializeInternationalization,
  type IntlShape,
  type MessageDescriptor,
} from "@rchunk/app-shared";

type HookEventName =
  | "interrupt"
  | "permissionRequest"
  | "postCompact"
  | "postToolUse"
  | "preCompact"
  | "preToolUse"
  | "sessionEnd"
  | "sessionStart"
  | "stop"
  | "subagentStart"
  | "subagentStop"
  | "userPromptSubmit";

const eventDefaults: Record<Exclude<HookEventName, "interrupt">, [string, string]> = {
  preToolUse: ["PreToolUse", "Before a tool executes"],
  permissionRequest: ["PermissionRequest", "When permission is requested"],
  postToolUse: ["PostToolUse", "After a tool executes"],
  preCompact: ["PreCompact", "Before ChatGPT compacts the conversation"],
  postCompact: ["PostCompact", "After ChatGPT compacts the conversation"],
  sessionStart: ["SessionStart", "When a new session starts"],
  sessionEnd: ["SessionEnd", "When a session ends"],
  userPromptSubmit: ["UserPromptSubmit", "When the user submits a prompt"],
  subagentStart: ["SubagentStart", "When a subagent starts"],
  subagentStop: ["SubagentStop", "When a subagent stops"],
  stop: ["Stop", "Right before ChatGPT ends its turn"],
};

const hookMessages = defineMessages(
  Object.fromEntries(
    Object.entries(eventDefaults).flatMap(([name, [title, description]]) => [
      [name, {
        id: `settings.hooks.event.${name}`,
        defaultMessage: title,
        description: `Label for the ${name} hook event`,
      }],
      [`${name}Description`, {
        id: `settings.hooks.event.${name}.description`,
        defaultMessage: description,
        description: `Description for the ${name} hook event`,
      }],
    ]),
  ) as Record<string, MessageDescriptor>,
);

function getHookEventLabel(eventName: HookEventName, intl: IntlShape): string | undefined {
  if (eventName === "interrupt") {
    return String(intl.formatMessage({
      id: "settings.hooks.event.interrupt",
      defaultMessage: "Interrupt",
      description: "Label for the hook that runs when a turn is interrupted",
    }));
  }
  return String(intl.formatMessage(hookMessages[eventName]));
}

function getHookEventDescription(eventName: HookEventName, intl: IntlShape): string | undefined {
  if (eventName === "interrupt") {
    return String(intl.formatMessage({
      id: "settings.hooks.event.interrupt.description",
      defaultMessage: "When a turn is interrupted",
      description: "Description for the interrupt hook event",
    }));
  }
  return String(intl.formatMessage(hookMessages[`${eventName}Description`]));
}

function getFallbackHookTitle(index: number, intl: IntlShape): string {
  return String(intl.formatMessage(
    {
      id: "settings.hooks.event.fallbackHookTitle",
      defaultMessage: "Hook {index}",
      description: "Fallback title for a hook row without a stronger label",
    },
    { index: index + 1 },
  ));
}

function getPluginName(value: string | null | undefined): string | null {
  return value == null ? null : value.split("@")[0] || null;
}

function initializeHooksSettingsCopy(): void {
  initializeInternationalization();
}

export {
  initializeHooksSettingsCopy as a,
  getPluginName as i,
  getHookEventLabel as n,
  getFallbackHookTitle as r,
  getHookEventDescription as t,
};
