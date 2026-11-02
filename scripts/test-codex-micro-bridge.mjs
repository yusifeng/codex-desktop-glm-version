import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("codex-micro-bridge");
console.log(`codex-micro-bridge release owner: ${assertions} assertion passed`);
