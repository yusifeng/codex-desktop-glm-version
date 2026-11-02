import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("codex-app-home-beacon-announcement-core");
console.log(`beacon action key owner is covered by release source: ${assertions} assertion passed`);
