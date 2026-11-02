import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const assertions = assertReleaseOwner("environment-variable-row") +
  assertReleaseOwner("environment-variables-batch-dialog") +
  assertReleaseOwner("environment-batch-secrets-dialog") +
  assertReleaseOwner("personal-secrets-dialog") +
  assertReleaseOwner("personal-secret-dialog");
console.log(`${assertions} environment and secret editor release assertions passed`);
