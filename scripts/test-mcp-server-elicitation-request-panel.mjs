import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("mcp-server-elicitation-request-panel");
assertions += assertReleaseOwner("mcp-tool-item-content");
console.log("mcp-server-elicitation-request-panel, mcp-tool-item-content release owners: " + assertions + " assertions passed");
