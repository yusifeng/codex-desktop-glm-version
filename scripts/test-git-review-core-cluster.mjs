import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("pull-request-comment");
assertions += assertReleaseOwner("local-conversation-git-actions");
assertions += assertReleaseOwner("review-file-tree-side-pane");
console.log("Git review release owners: " + assertions + " assertions passed");
