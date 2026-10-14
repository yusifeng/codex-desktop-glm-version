import assert from "node:assert/strict";
import { createBrowserPageLifecycleHelpersControllerClass } from "../src/main/main-app/browser-sidebar/browser-page-lifecycle-helpers-controller.ts";

let sessionUpdates = 0;
let syncs = 0;
let budgets = 0;
const thread = { conversationId: "c1", browserTabId: "t1" };
const lifecycle = {
  updateThreadSessionState(value) { assert.equal(value, thread); sessionUpdates += 1; },
  isBrowserUseManagedBrowserTab(conversationId, browserTabId) {
    return conversationId === "c1" && browserTabId === "t1";
  },
};
const comments = {
  dismiss(owner, conversationId, browserTabId, value) {
    assert.equal(owner, "owner");
    assert.equal(conversationId, "c1");
    assert.equal(browserTabId, "t1");
    assert.equal(value, thread);
  },
};
const host = {
  browserPageHostLifecycle: lifecycle,
  comments,
  getThreadStateForWindow() { return thread; },
  syncThreadState(windowState, conversationId, value) {
    assert.equal(windowState.owner, "owner");
    assert.equal(conversationId, "c1");
    assert.equal(value, thread);
    syncs += 1;
  },
  tabBudget: { enforceDetachedPageBudget() { budgets += 1; } },
  iabTabMentions: { notifyInvalidated() {} },
};
const Controller = createBrowserPageLifecycleHelpersControllerClass();
const controller = new Controller(host);
const page = { conversationId: "c1", browserTabId: "t1", view: { webContents: { isDestroyed: () => false } } };
const windowState = { owner: "owner" };

controller.dismissCommentEditorForCommittedNavigation(windowState, page, "https://example.com");
controller.finishPageAttach(windowState, page, page.view.webContents, "manual");
assert.equal(controller.isBrowserUseManagedBrowserTab("c1", "t1"), true);
assert.equal(sessionUpdates, 1);
assert.equal(syncs, 1);
assert.equal(budgets, 1);

console.log("test-main-browser-page-lifecycle-helpers-controller: 5 assertions passed");
