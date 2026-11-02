export interface ActionV2Envelope {
  action_v2: {
    action_enum: string;
    web_url?: string | null;
  };
}

/** Return whether an action is the legacy local `/tasks` navigation. */
export function isTasksLocalAction(action: ActionV2Envelope): boolean {
  return action.action_v2.action_enum === "open_local_url" && action.action_v2.web_url === "/tasks";
}

/** Accept the URL schemes supported by action-v2 navigation. */
export function isAllowedActionUrl(value: string): boolean {
  return value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("codex://") ||
    (value.startsWith("/") && !value.startsWith("//"));
}

/** Return whether a foreground action asset uses an absolute HTTP(S) URL. */
export function isAbsoluteHttpUrl(value: string): boolean {
  return value.startsWith("https://") || value.startsWith("http://");
}
