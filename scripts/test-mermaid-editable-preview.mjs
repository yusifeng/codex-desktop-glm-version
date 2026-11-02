import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("mermaid-editable-preview");
console.log(`${assertions} mermaid editable preview release assertions passed`);
