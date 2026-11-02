import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("codex-micro-onboarding-host");
console.log(`${assertions} codex-micro-onboarding-host release assertions passed`);
