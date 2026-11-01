import { n as onceExport } from "@rchunk/rolldown-runtime";

type StringEnum = Record<string, string>;

let eventTypes: StringEnum;
let interactionSources: StringEnum;
let openSources: StringEnum;
let openDestinations: StringEnum;
let assistantModes: StringEnum;
let taskEvent: {
  readonly $type: "protobuf_analytics_events.v1.ChatgptTasksEvent";
};

function enumRecord(prefix: string, values: readonly string[]): StringEnum {
  return Object.fromEntries(
    [...values, "UNRECOGNIZED"].map((value) => {
      const key = value === "UNRECOGNIZED" ? value : `${prefix}_${value}`;
      return [key, key];
    }),
  );
}

const once = onceExport as (initializer: () => void) => () => void;
const initializeTaskEvents = once(() => {
  eventTypes = enumRecord("CHATGPT_TASKS_EVENT_TYPE", [
    "UNSPECIFIED",
    "PAGE_VIEWED",
    "FILTER_CHANGED",
    "SUGGESTED_TASK_IMPRESSION",
    "SUGGESTED_TASK_SELECTED",
    "SUGGESTED_TASK_DISMISSED",
    "COMPOSER_SUBMITTED",
    "TASK_OPENED",
    "TASK_EDITOR_OPENED",
    "TASK_STATUS_UPDATED",
    "TASK_SAVED",
    "TASK_DELETED",
    "TASK_EDITOR_DISCARDED",
    "CONVERSATION_WITH_TASK_VIEWED",
    "PAUSED_REACTIVATION_BANNER_SHOWN",
    "PAUSED_REACTIVATION_BANNER_CLICKED",
    "SUGGESTED_TASK_CONVERSATION_CREATED",
    "SUGGESTED_TASKS_SECTION_IMPRESSION",
    "SUGGESTED_AUTOMATIONS_SECTION_IMPRESSION",
    "TASK_SHARE_BUTTON_CLICKED",
    "TASK_SHARE_SHEET_VIEWED",
    "TASK_SHARE_LINK_BUTTON_CLICKED",
    "TASK_SHARE_LINK_CREATED",
    "TASK_SHARE_LINK_REFRESHED",
    "TASK_SHARE_LINK_DELETE_BUTTON_CLICKED",
    "TASK_SHARE_LINK_DELETED",
    "TASK_SHARE_SYSTEM_SHEET_VIEWED",
    "SHARED_TASK_SHEET_VIEWED",
    "SHARED_TASK_SAVE_BUTTON_CLICKED",
    "SHARED_TASK_SAVE_SUBMITTED",
    "SHARED_TASK_SHARE_BUTTON_CLICKED",
    "SHARED_TASK_REPORT_BUTTON_CLICKED",
    "SUGGESTED_TASK_COMPLETED",
    "SUGGESTED_TASK_FEEDBACK_MORE_LIKE_THIS",
    "SUGGESTED_TASK_FEEDBACK_LESS_LIKE_THIS",
  ]);
  interactionSources = enumRecord("CHATGPT_TASKS_INTERACTION_SOURCE", [
    "UNSPECIFIED",
    "TASKS_PAGE",
    "TASKS_PAGE_TASK_ROW",
    "EDITOR",
    "SUGGESTED_TASK_CARD",
    "COMPOSER",
    "CONVERSATION_MESSAGE_TASK_HEADER",
    "SHARING_SHEET",
    "SHARED_TASK_SHEET",
  ]);
  openSources = enumRecord("CHATGPT_TASKS_OPEN_SOURCE", [
    "UNSPECIFIED",
    "SCHEDULED_PAGE",
    "NOTIFICATION",
    "CONVERSATION",
    "CONVERSATION_SIDEBAR",
    "EDITOR",
  ]);
  openDestinations = enumRecord("CHATGPT_TASKS_OPEN_DESTINATION", [
    "UNSPECIFIED",
    "EDITOR",
    "CONVERSATION",
    "SCHEDULED_PAGE",
  ]);
  assistantModes = enumRecord("CHATGPT_TASKS_ASSISTANT_MODE", [
    "UNSPECIFIED",
    "CHAT",
    "WORK",
  ]);
  taskEvent = { $type: "protobuf_analytics_events.v1.ChatgptTasksEvent" };
});

export {
  openDestinations as a,
  interactionSources as i,
  taskEvent as n,
  openSources as o,
  eventTypes as r,
  initializeTaskEvents as s,
  assistantModes as t,
};
