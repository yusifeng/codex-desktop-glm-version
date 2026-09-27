import "@rchunk/rolldown-runtime";
const enumRecord = (prefix: string, values: readonly string[]) => Object.freeze(Object.fromEntries([...values, "UNRECOGNIZED"].map(value => [value === "UNRECOGNIZED" ? value : `${prefix}_${value}`, value === "UNRECOGNIZED" ? value : `${prefix}_${value}`])));
const sourceTypes = enumRecord("CHATGPT_SITES_SOURCE", ["UNSPECIFIED", "SIDEBAR", "HOME_HEADER", "HOME_EMPTY_STATE", "HOME_LIST", "HOME_GRID", "SETTINGS", "RESPONSE_CARD", "TRAFFIC_ANALYTICS", "SITE_DETAIL", "AT_MENTION"]);
const interactionTypes = enumRecord("CHATGPT_SITES_INTERACTION_TYPE", ["UNSPECIFIED", "SIDEBAR_OPEN_CLICKED", "CREATE_SITE_CLICKED", "SITE_OPENED", "EDIT_WITH_CHAT_CLICKED", "SHARE_OPENED", "SETTINGS_OPENED", "LOAD_RETRY_CLICKED", "VIEW_MODE_CHANGED", "DELETE_MODAL_OPENED", "PREVIEW_OPENED", "TRAFFIC_ANALYTICS_OPENED", "SEARCH_STARTED", "NEXT_PAGE_REQUESTED"]);
const responseCardViewed = { $type: "protobuf_analytics_events.v1.ChatgptSitesResponseCardViewed" } as const;
const interaction = { $type: "protobuf_analytics_events.v1.ChatgptSitesInteraction" } as const;
function initializeSitesAnalytics(): void {}
export { initializeSitesAnalytics as a, sourceTypes as i, interactionTypes as n, responseCardViewed as r, interaction as t };
