import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("chatgpt-code-block");
console.log("chatgpt-code-block release owners: " + assertions + " assertions passed");
