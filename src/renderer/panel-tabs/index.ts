// @ts-expect-error The release app-initial surface is declared incrementally by the shared manifest owner.
import { lgt as getConversationBrowserTabIdsForTransfer, mgt as initializePanelTabs, ugt as getLastFocusedBrowserTabId } from "@rchunk/app-initial";

initializePanelTabs();

export { getConversationBrowserTabIdsForTransfer, getLastFocusedBrowserTabId };
