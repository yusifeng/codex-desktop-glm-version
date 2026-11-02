import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("app-connect-modal");
assertions += assertReleaseOwner("codex-mobile-setup-dialog");
console.log("connect and mobile release owners: " + assertions + " assertions passed");
