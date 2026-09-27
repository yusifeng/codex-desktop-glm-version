import "@rchunk/rolldown-runtime";
const enumRecord = (prefix: string, values: readonly string[]) => Object.freeze(Object.fromEntries([...values, "UNRECOGNIZED"].map(value => [value === "UNRECOGNIZED" ? value : `${prefix}_${value}`, value === "UNRECOGNIZED" ? value : `${prefix}_${value}`])));
const eventTypes = enumRecord("CHATGPT_TASKS_EVENT_TYPE", ["UNSPECIFIED", "PAGE_VIEWED", "FILTER_CHANGED", "SUGGESTED_TASK_IMPRESSION", "SUGGESTED_TASK_SELECTED", "COMPOSER_SUBMITTED", "TASK_OPENED", "TASK_EDITOR_OPENED", "TASK_STATUS_UPDATED", "TASK_SAVED", "TASK_DELETED", "TASK_SHARE_BUTTON_CLICKED", "TASK_SHARE_SHEET_VIEWED", "TASK_SHARE_LINK_CREATED", "SHARED_TASK_SHEET_VIEWED", "SHARED_TASK_SAVE_SUBMITTED"]);
const interactionSources = enumRecord("CHATGPT_TASKS_INTERACTION_SOURCE", ["UNSPECIFIED", "TASKS_PAGE", "TASKS_PAGE_TASK_ROW", "EDITOR", "SUGGESTED_TASK_CARD", "COMPOSER", "CONVERSATION_MESSAGE_TASK_HEADER", "SHARING_SHEET", "SHARED_TASK_SHEET"]);
const openSources = enumRecord("CHATGPT_TASKS_OPEN_SOURCE", ["UNSPECIFIED", "SCHEDULED_PAGE", "NOTIFICATION", "CONVERSATION", "CONVERSATION_SIDEBAR", "EDITOR"]);
const openDestinations = enumRecord("CHATGPT_TASKS_OPEN_DESTINATION", ["UNSPECIFIED", "EDITOR", "CONVERSATION", "SCHEDULED_PAGE"]);
const assistantModes = enumRecord("CHATGPT_TASKS_ASSISTANT_MODE", ["UNSPECIFIED", "CHAT", "WORK"]);
const taskEvent = { $type: "protobuf_analytics_events.v1.ChatgptTasksEvent" } as const;
function initializeTaskEvents(): void {}
export { openDestinations as a, interactionSources as i, taskEvent as n, openSources as o, eventTypes as r, initializeTaskEvents as s, assistantModes as t };
