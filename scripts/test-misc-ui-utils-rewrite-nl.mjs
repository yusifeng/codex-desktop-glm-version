import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("chatgpt-ads-consent-boundary") +
  assertReleaseOwner("conversation-header") +
  assertReleaseOwner("workspace-recovery-gate-electron");

console.log(`${assertions} ads and conversation release-owner assertions passed`);
