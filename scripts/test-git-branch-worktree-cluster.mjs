import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("git-action-new-branch-field");
assertions += assertReleaseOwner("git-branch-switcher");
console.log("git-action-new-branch-field, git-branch-switcher release owners: " + assertions + " assertions passed");
