import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const draftAssertions = assertReleaseOwner("schedule-draft");
const fieldsAssertions = assertReleaseOwner("schedule-fields");
const frequencyAssertions = assertReleaseOwner("automation-frequency-section");

console.log(`automation schedule release owners: ${draftAssertions + fieldsAssertions + frequencyAssertions} assertions passed`);
