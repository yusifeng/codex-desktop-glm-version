import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("standalone-elicitation-page");
console.log(`${assertions} standalone elicitation page release assertions passed`);
