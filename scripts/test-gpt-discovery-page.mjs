import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("gpt-discovery-page");
console.log(`${assertions} GPT discovery page release assertions passed`);
