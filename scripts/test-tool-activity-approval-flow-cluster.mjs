import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("mcp-tool-activity-label", [/^\/\/ @ts-nocheck/m, /export \{/]);
assertions += assertReleaseOwner("mcp-tool-approval-message");
console.log(`mcp-tool-activity-label release-faithful assertions passed (${assertions})`);
