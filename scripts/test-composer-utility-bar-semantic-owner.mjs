import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("composer-utility-bar", [
  /composer\.mode\.worktree\.forRepository/,
  /worktreeEnvironmentWorkspaceRoot/,
  /composer\.newTask\.worktree/,
  /Existing worktree/,
  /export \{ zs as ComposerUtilityBar \}/,
]);

console.log(`${assertions} release-faithful composer utility bar assertions passed`);
