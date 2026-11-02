import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("thread-side-panel-tab-content", [
  /review-diffs-/,
  /refreshGitQueriesDisabled/,
  /Review skipped \{count, number\} untracked files/,
  /diffTooLarge/,
  /export \{ Bc as ReviewThreadSidePanelTab \}/,
]);

console.log(`${assertions} release-faithful thread side panel assertions passed`);
