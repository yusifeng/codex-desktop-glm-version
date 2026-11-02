import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("use-external-agent-import-setup-actions");
console.log(`use-external-agent-import-setup-actions release owner: ${assertions} assertion passed`);
