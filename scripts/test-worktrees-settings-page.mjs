import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("worktrees-settings-page");
console.log(`worktrees-settings-page release owner: ${assertions} assertion passed`);
