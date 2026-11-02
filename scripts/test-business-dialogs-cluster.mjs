import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("plugin-share-dialogs-runtime");
assertions += assertReleaseOwner("outbound-identity-connection-dialog");
console.log(`business dialog release owners: ${assertions} assertions passed`);
