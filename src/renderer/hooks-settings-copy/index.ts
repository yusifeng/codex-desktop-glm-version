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

let hookMessages: Record<string, MessageDescriptor>;

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
  hookMessages = defineMessages({
    preToolUse: { id: "settings.hooks.event.preToolUse", defaultMessage: "PreToolUse", description: "Label for the pre tool use hook event" },
    permissionRequest: { id: "settings.hooks.event.permissionRequest", defaultMessage: "PermissionRequest", description: "Label for the permission request hook event" },
    postToolUse: { id: "settings.hooks.event.postToolUse", defaultMessage: "PostToolUse", description: "Label for the post tool use hook event" },
    preCompact: { id: "settings.hooks.event.preCompact", defaultMessage: "PreCompact", description: "Label for the pre compact hook event" },
    postCompact: { id: "settings.hooks.event.postCompact", defaultMessage: "PostCompact", description: "Label for the post compact hook event" },
    sessionStart: { id: "settings.hooks.event.sessionStart", defaultMessage: "SessionStart", description: "Label for the session start hook event" },
    sessionEnd: { id: "settings.hooks.event.sessionEnd", defaultMessage: "SessionEnd", description: "Label for the session end hook event" },
    userPromptSubmit: { id: "settings.hooks.event.userPromptSubmit", defaultMessage: "UserPromptSubmit", description: "Label for the user prompt submit hook event" },
    subagentStart: { id: "settings.hooks.event.subagentStart", defaultMessage: "SubagentStart", description: "Label for the subagent start hook event" },
    subagentStop: { id: "settings.hooks.event.subagentStop", defaultMessage: "SubagentStop", description: "Label for the subagent stop hook event" },
    stop: { id: "settings.hooks.event.stop", defaultMessage: "Stop", description: "Label for the stop hook event" },
    preToolUseDescription: { id: "settings.hooks.event.preToolUse.description", defaultMessage: "Before a tool executes", description: "Description for the pre tool use hook event" },
    permissionRequestDescription: { id: "settings.hooks.event.permissionRequest.description", defaultMessage: "When permission is requested", description: "Description for the permission request hook event" },
    postToolUseDescription: { id: "settings.hooks.event.postToolUse.description", defaultMessage: "After a tool executes", description: "Description for the post tool use hook event" },
    preCompactDescription: { id: "settings.hooks.event.preCompact.description", defaultMessage: "Before ChatGPT compacts the conversation", description: "Description for the pre compact hook event" },
    postCompactDescription: { id: "settings.hooks.event.postCompact.description", defaultMessage: "After ChatGPT compacts the conversation", description: "Description for the post compact hook event" },
    sessionStartDescription: { id: "settings.hooks.event.sessionStart.description", defaultMessage: "When a new session starts", description: "Description for the session start hook event" },
    sessionEndDescription: { id: "settings.hooks.event.sessionEnd.description", defaultMessage: "When a session ends", description: "Description for the session end hook event" },
    userPromptSubmitDescription: { id: "settings.hooks.event.userPromptSubmit.description", defaultMessage: "When the user submits a prompt", description: "Description for the user prompt submit hook event" },
    subagentStartDescription: { id: "settings.hooks.event.subagentStart.description", defaultMessage: "When a subagent starts", description: "Description for the subagent start hook event" },
    subagentStopDescription: { id: "settings.hooks.event.subagentStop.description", defaultMessage: "When a subagent stops", description: "Description for the subagent stop hook event" },
    stopDescription: { id: "settings.hooks.event.stop.description", defaultMessage: "Right before ChatGPT ends its turn", description: "Description for the stop hook event" },
    fallbackHookTitle: { id: "settings.hooks.event.fallbackHookTitle", defaultMessage: "Hook {index}", description: "Fallback title for a hook row without a stronger label" },
  });
}

export {
  initializeHooksSettingsCopy as a,
  getPluginName as i,
  getHookEventLabel as n,
  getFallbackHookTitle as r,
  getHookEventDescription as t,
};
