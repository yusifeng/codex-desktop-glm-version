import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("browser-mfa-sms-enrollment") +
  assertReleaseOwner("mermaid-image-rendering") +
  assertReleaseOwner("imagegen-request-form") +
  assertReleaseOwner("workspace-auto-generated-name");

console.log(`${assertions} release-owner assertions passed`);
