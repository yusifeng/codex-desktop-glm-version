import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("worktree-setup-auto-fix");
console.log(`${assertions} worktree setup auto-fix release assertions passed`);
