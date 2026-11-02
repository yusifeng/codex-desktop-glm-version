import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("queued-message-list");
console.log(`${assertions} queued-message-list release assertions passed`);
