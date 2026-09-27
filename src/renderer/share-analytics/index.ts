import "@rchunk/rolldown-runtime";
import {
  cc as initializeMetrics,
  sc as metrics,
  xpn as trackAnalytics,
  ypn as initializeAnalytics,
} from "@rchunk/app-initial";
import {
  i as taskInteractionSources,
  n as taskInteractionEvent,
  r as taskEventTypes,
  s as initializeTaskEvents,
} from "@rchunk/chatgpt-tasks-runtime";

let shareEventTypes: Record<string, unknown>;
let shareSources: Record<string, unknown>;
let sharedTaskEventTypes: Record<string, unknown>;

function trackTaskShare(
  scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
  event: string,
  taskId: string,
  source = "sharing_sheet",
  details?: Record<string, unknown>,
): void {
  trackAnalytics(scope, taskInteractionEvent, {
    type: shareEventTypes[event], taskId, source: shareSources[source], ...details,
  });
  metrics.count("default", "automations.sharing.event", {
    type: event,
    source: source === "scheduled_page" ? "tasks_page_task_row" : source,
    ...(details?.success == null ? {} : { success: String(details.success) }),
  });
}

function trackSharedTask(
  scope: import("@rchunk/app-shared").MaitaiScopeApi<unknown>,
  event: string,
  sharePostId: string,
  details?: Record<string, unknown>,
): void {
  trackAnalytics(scope, taskInteractionEvent, {
    type: sharedTaskEventTypes[event],
    source: taskInteractionSources.CHATGPT_TASKS_INTERACTION_SOURCE_SHARED_TASK_SHEET,
    sharePostId,
    ...details,
  });
  metrics.count("default", "automations.sharing.event", {
    type: event, source: "shared_task_sheet",
    ...(details?.success == null ? {} : { success: String(details.success) }),
  });
}

function initializeShareAnalytics(): void {
  initializeTaskEvents();
  initializeMetrics();
  initializeAnalytics();
  shareEventTypes = {
    task_share_button_clicked: taskEventTypes.CHATGPT_TASKS_EVENT_TYPE_TASK_SHARE_BUTTON_CLICKED,
    task_share_sheet_viewed: taskEventTypes.CHATGPT_TASKS_EVENT_TYPE_TASK_SHARE_SHEET_VIEWED,
    task_share_link_button_clicked: taskEventTypes.CHATGPT_TASKS_EVENT_TYPE_TASK_SHARE_LINK_BUTTON_CLICKED,
    task_share_link_created: taskEventTypes.CHATGPT_TASKS_EVENT_TYPE_TASK_SHARE_LINK_CREATED,
    task_share_link_refreshed: taskEventTypes.CHATGPT_TASKS_EVENT_TYPE_TASK_SHARE_LINK_REFRESHED,
    task_share_link_delete_button_clicked: taskEventTypes.CHATGPT_TASKS_EVENT_TYPE_TASK_SHARE_LINK_DELETE_BUTTON_CLICKED,
    task_share_link_deleted: taskEventTypes.CHATGPT_TASKS_EVENT_TYPE_TASK_SHARE_LINK_DELETED,
  };
  shareSources = {
    scheduled_page: taskInteractionSources.CHATGPT_TASKS_INTERACTION_SOURCE_TASKS_PAGE_TASK_ROW,
    editor: taskInteractionSources.CHATGPT_TASKS_INTERACTION_SOURCE_EDITOR,
    sharing_sheet: taskInteractionSources.CHATGPT_TASKS_INTERACTION_SOURCE_SHARING_SHEET,
  };
  sharedTaskEventTypes = {
    shared_task_sheet_viewed: taskEventTypes.CHATGPT_TASKS_EVENT_TYPE_SHARED_TASK_SHEET_VIEWED,
    shared_task_save_button_clicked: taskEventTypes.CHATGPT_TASKS_EVENT_TYPE_SHARED_TASK_SAVE_BUTTON_CLICKED,
    shared_task_save_submitted: taskEventTypes.CHATGPT_TASKS_EVENT_TYPE_SHARED_TASK_SAVE_SUBMITTED,
    shared_task_report_button_clicked: taskEventTypes.CHATGPT_TASKS_EVENT_TYPE_SHARED_TASK_REPORT_BUTTON_CLICKED,
  };
}

export { trackTaskShare as n, trackSharedTask as r, initializeShareAnalytics as t };
