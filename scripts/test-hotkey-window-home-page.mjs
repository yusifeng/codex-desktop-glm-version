import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("hotkey-window-home-page");
assertions += assertReleaseOwner("worktree-environment-dropdown");
console.log(`hotkey-window-home-page, worktree-environment-dropdown release owners: ${assertions} assertions passed`);
