import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("gift-card-redemption-page");
console.log(`gift-card-redemption-page release owner: ${assertions} assertion passed`);
