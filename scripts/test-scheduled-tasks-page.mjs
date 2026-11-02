import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("scheduled-tasks-page");
assertions += assertReleaseOwner("content-quick-chat-overlay");
console.log("scheduled-tasks-page, content-quick-chat-overlay release owners: " + assertions + " assertions passed");
