import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("codex-app-home-beacon-announcement-core");
console.log(`codex-app-home-beacon-announcement-core release owner: ${assertions} assertion passed`);
