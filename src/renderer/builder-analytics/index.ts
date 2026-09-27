import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";

type EnumRecord = Readonly<Record<string, string>>;
export interface BuilderAnalyticsScope { get?<Value>(key: symbol): Value; set?<Value>(key: symbol, value: Value): void; track?(schema: { $type: string }, payload: Record<string, unknown>): void }
const makeEnum = (prefix: string, values: readonly string[]): EnumRecord => Object.freeze(Object.fromEntries([...values, "UNRECOGNIZED"].map(value => [value === "UNRECOGNIZED" ? value : `${prefix}_${value}`, value === "UNRECOGNIZED" ? value : `${prefix}_${value}`])));
const pageTypes = makeEnum("CHATGPT_AGENT_BUILDER_PAGE", ["UNSPECIFIED", "NEW_AGENT", "EDITOR_INSTRUCTIONS", "PREVIEW", "ANALYTICS", "CHANNEL_CHATGPT", "CHANNEL_SLACK", "CONNECTOR_DETAIL", "FILES_ROOT", "FILE_DETAIL", "MEMORY_ROOT", "SKILL_OVERVIEW"]);
const sourceTypes = makeEnum("CHATGPT_AGENT_BUILDER_SOURCE", ["UNSPECIFIED", "DIRECT", "HEADER", "OVERFLOW_MENU", "BUILD_NAV", "PREVIEW", "APPS_MODAL", "CONNECTOR_DETAIL", "FILES_DETAIL", "SKILL_DETAIL", "SHARE_MODAL", "SETTINGS_MODAL"]);
const resultTypes = makeEnum("CHATGPT_AGENT_BUILDER_ACTION_RESULT", ["UNSPECIFIED", "STARTED", "SUCCEEDED", "FAILED", "BLOCKED", "CANCELED"]);
const resourceTypes = makeEnum("CHATGPT_AGENT_BUILDER_RESOURCE_TYPE", ["UNSPECIFIED", "AGENT", "CONNECTOR", "SKILL", "FILE", "MEMORY", "CHATGPT_CHANNEL", "SLACK_CHANNEL", "SCHEDULE", "VERSION", "TEMPLATE"]);
const actionTypes = makeEnum("CHATGPT_AGENT_BUILDER_ACTION_TYPE", ["UNSPECIFIED", "BUILD_NAV_ITEM_CLICK", "PREVIEW_OPEN", "PREVIEW_CLOSE", "ANALYTICS_OPEN", "AGENT_NAME_EDIT", "INSTRUCTIONS_EDIT", "PUBLISH", "FILE_UPLOAD", "FILE_OPEN", "FILE_DELETE", "DRAFT_SAVE", "BUILDER_EXIT_CLICK"]);
const scheduleTypes = makeEnum("CHATGPT_AGENT_BUILDER_SCHEDULE_TYPE", ["UNSPECIFIED", "HOURLY", "WEEKLY", "CUSTOM"]);
const channelTypes = makeEnum("CHATGPT_AGENT_BUILDER_CHANNEL_TYPE", ["UNSPECIFIED", "CHATGPT", "SLACK"]);
const actionSchema = { $type: "protobuf_analytics_events.v1.ChatgptAgentBuilderAction" } as const;
const sessionKey = Symbol.for("chatgpt.agent-builder.analytics-session");
const fallbackSessions = new WeakMap<object, { id: string; sequence: number }>();
function createSession(): { id: string; sequence: number } { return { id: `builder-session-id-${crypto.randomUUID()}`, sequence: 0 }; }
function trackBuilderAction(scope: BuilderAnalyticsScope, payload: Record<string, unknown>): void {
  try {
    const owner = scope as object;
    const current = scope.get?.<{ id: string; sequence: number }>(sessionKey) ?? fallbackSessions.get(owner) ?? createSession();
    const next = { ...current, sequence: current.sequence + 1 };
    scope.set?.(sessionKey, next); fallbackSessions.set(owner, next);
    scope.track?.(actionSchema, { ...payload, builderSessionId: next.id, builderSequenceNumber: next.sequence });
  } catch {}
}
function initializeBuilderSession(): void {}
function initializeBuilderAnalytics(): void {}
export { channelTypes as a, scheduleTypes as c, actionTypes as i, sourceTypes as l, trackBuilderAction as n, pageTypes as o, resultTypes as r, resourceTypes as s, initializeBuilderSession as t, initializeBuilderAnalytics as u };
