import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("quick-chat-window");
console.log("quick-chat-window release owners: " + assertions + " assertions passed");
