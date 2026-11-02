import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("browser-composer-disclaimer-core");
console.log(`${assertions} browser composer disclaimer release assertions passed`);
