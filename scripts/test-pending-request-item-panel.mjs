import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("pending-request-item-panel");
console.log("pending request release owner: " + assertions + " assertions passed");
